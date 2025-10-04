// scripts/fetch_week.js
// Run: node scripts/fetch_week.js 2025 5 espn

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function canonicalTeamNameToCode(name) {
	const map = {
		"Kansas City Chiefs": "KC",
		"Las Vegas Raiders": "LV",
		// add as you go
	};
	return map[name] || name.toUpperCase().slice(0, 3);
}

function mkPlayerId(source, sourcePlayerKey) {
	return `${source}:${sourcePlayerKey}`;
}

function mkGameId(league, year, week, home, away) {
	return `${league}:${year}-${String(week).padStart(2, '0')}-${home}-${away}`;
}

function nowIso() {
	return new Date().toISOString();
}

// Replace ONLY the URL below with your real raw GitHub JSON URL.
// Example pattern:
// https://raw.githubusercontent.com/<owner>/<repo>/<branch>/data/seeds/nfl/2025/week=5/espn.seed.json
async function fetchFromEspn(year, week) {
	const url = 'https://raw.githubusercontent.com/Incarcer/customvenom-data-pipelines/main/data/stats/nfl/2025/week=5/espn.json';
	const res = await fetch(url, {
		headers: {
			"User-Agent": "customvenom/0.1",
			"Accept": "application/json"
		}
	});
	if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
	// If your seed is already an array with {sourcePlayerKey, playerName, teamName, opponentName, stats:{...}}
	// you can return it directly.
	const data = await res.json();
	return Array.isArray(data) ? data : [];
}

function normalizeEspn(records, { league, year, week }) {
	const source = "espn";
	const out = [];
	for (const r of records) {
		const team = canonicalTeamNameToCode(r.teamName);
		const opp = canonicalTeamNameToCode(r.opponentName);
		const game_id = mkGameId(league, year, week, team, opp);
		const player_id = mkPlayerId(source, r.sourcePlayerKey);
		const ingested_at = nowIso();

		// flatten stats to stat_name/value/unit rows
		for (const [stat_name, value] of Object.entries(r.stats || {})) {
			if (value == null || Number.isNaN(Number(value))) continue;
			out.push({
				player_id,
				team_id: `nfl:${team}`,
				game_id,
				week,
				opponent: opp,
				stat_name,
				value: Number(value),
				unit: stat_name === "yards" ? "yards" : "count",
				source,
				ingested_at,
			});
		}
	}
	return out;
}

async function ensureDir(p) {
	await mkdir(p, { recursive: true });
}

async function writeJson(filePath, data) {
	await ensureDir(path.dirname(filePath));
	await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function main() {
	const [, , yearStr, weekStr, source] = process.argv;
	const year = Number(yearStr);
	const week = Number(weekStr);
	if (!year || !week || !source) {
		console.error("Usage: node scripts/fetch_week.js <year> <week> <source>");
		process.exit(1);
	}

	const league = "nfl";
	let rows = [];

	if (source === "espn") {
		const raw = await fetchFromEspn(year, week);
		rows = normalizeEspn(raw, { league, year, week });
	} else {
		console.error(`Unknown source: ${source}`);
		process.exit(1);
	}

	const outDir = path.join("data", "stats", league, String(year), `week=${week}`);
	const outPath = path.join(outDir, `${source}.json`);
	await writeJson(outPath, rows);

	console.log(`Wrote ${rows.length} rows to ${outPath}`);
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});