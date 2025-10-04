// scripts/fetch_week.js
// Run: node scripts/fetch_week.js 2025 5 espn

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function canonicalTeamNameToCode(name) {

if (!name || typeof name !== "string") return "UNK";

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
	const url = "https://raw.githubusercontent.com/Incarcer/customvenom-data-pipelines/main/data/stats/nfl/2025/week=5/espn.json";
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

unction normalizeEspn(records, { league, year, week }) {
	const source = "espn";
	const out = [];

	if (!Array.isArray(records)) return out;

	for (const r of records) {
		// Accept multiple possible key names from different payloads
		const rawTeam =
			r.teamName ||
			r.team ||
			r.team_full_name ||
			r.team_code ||
			r.teamAbbr ||
			"";
		const rawOpp =
			r.opponentName ||
			r.opponent ||
			r.opponent_full_name ||
			r.opp_code ||
			r.oppAbbr ||
			"";
		const team = canonicalTeamNameToCode(rawTeam);
		const opp = canonicalTeamNameToCode(rawOpp);

		// Player key fallbacks
		const sourcePlayerKey =
			r.sourcePlayerKey ||
			r.playerId ||
			r.player_id ||
			r.id ||
			r.espnId ||
			"unknown";

		const player_id = mkPlayerId(source, String(sourcePlayerKey));
		const game_id = mkGameId(league, year, week, team, opp);
		const ingested_at = nowIso();

		// Stats can be nested or flat; prefer r.stats, else synthesize from common fields
		const statsObj = r.stats && typeof r.stats === "object" ? r.stats : {};
		// Optionally map a few common top-level keys into stats if present
		if (r.yards != null && statsObj.yards == null) statsObj.yards = r.yards;
		if (r.touchdowns != null && statsObj.touchdowns == null) statsObj.touchdowns = r.touchdowns;
		if (r.tds != null && statsObj.touchdowns == null) statsObj.touchdowns = r.tds;

		for (const [stat_name, valueRaw] of Object.entries(statsObj)) {
			const valueNum = Number(valueRaw);
			if (valueRaw == null || Number.isNaN(valueNum)) continue;

			out.push({
				player_id,
				team_id: `nfl:${team}`,
				game_id,
				week,
				opponent: opp,
				stat_name,
				value: valueNum,
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