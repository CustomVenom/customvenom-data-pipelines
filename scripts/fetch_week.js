// scripts/fetch_week.js
// Run: node scripts/fetch_week.js 2025 5 espn

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Utility
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function nowIso() { return new Date().toISOString(); }

// Canonicalization helpers
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

// FETCH: replace ONLY the URL below with your Raw GitHub JSON URL.
// The URL must be a plain string (no [text](url) Markdown).
async function fetchFromEspn(year, week) {
	const url = "https://raw.githubusercontent.com/Incarcer/customvenom-data-pipelines/main/data/stats/nfl/2025/week=5/espn.json";
	const res = await fetch(url, {
		headers: {
			"User-Agent": "customvenom/0.1",
			"Accept": "application/json"
		}
	});
	if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
	const data = await res.json(); console.log("FETCH SAMPLE =", JSON.stringify(Array.isArray(data) ? data[0] : data, null, 2), "SIZE=", Array.isArray(data) ? data.length : "not-array");
	

	// If your seed file already has the final flattened rows (player_id, team_id, ...),
	// you can return it as-is by uncommenting the next line and skipping normalize in main().
	// return Array.isArray(data) ? data : [];

	// Otherwise, expect an array of "records" like:
	// { sourcePlayerKey, playerName, teamName, opponentName, stats: { yards, touchdowns, ... } }
	return Array.isArray(data) ? data : [];
}

// NORMALIZE: resilient to slightly different field names
function normalizeEspn(records, { league, year, week }) {
	const source = "espn";
	const out = [];

	if (!Array.isArray(records)) return out;

	for (const r of records) {
		const rawTeam =
			r.teamName ??
			r.team ??
			r.team_full_name ??
			r.team_code ??
			r.teamAbbr ??
			"";
		const rawOpp =
			r.opponentName ??
			r.opponent ??
			r.opponent_full_name ??
			r.opp_code ??
			r.oppAbbr ??
			"";

		const team = canonicalTeamNameToCode(rawTeam);
		const opp = canonicalTeamNameToCode(rawOpp);

		const sourcePlayerKey =
			r.sourcePlayerKey ??
			r.playerId ??
			r.player_id ??
			r.id ??
			r.espnId ??
			"unknown";

		const player_id = mkPlayerId(source, String(sourcePlayerKey));
		const game_id = mkGameId(league, year, week, team, opp);
		const ingested_at = nowIso();

		// Prefer nested stats; allow a few top-level fallbacks
		const statsObj = (r.stats && typeof r.stats === "object") ? { ...r.stats } : {};
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

// FS helpers
async function ensureDir(p) {
	await mkdir(p, { recursive: true });
}

async function writeJson(filePath, data) {
	await ensureDir(path.dirname(filePath));
	await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// MAIN
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

		// Option 1: use normalize (default)
		rows = Array.isArray(raw) ? raw : [];

		// Option 2: if your seed is already flat rows, bypass normalize:
		// rows = Array.isArray(raw) ? raw : [];
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

