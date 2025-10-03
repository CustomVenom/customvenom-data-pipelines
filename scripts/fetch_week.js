// scripts/fetch_week.js

// Run: node scripts/fetch_week.js 2025 5 espn

const fs = require('fs/promises');

const path = require('path');

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

// Example: mock fetchers. Replace with real URLs step by step.

async function fetchFromEspn(year, week) {

await sleep(200);

return [

{

sourcePlayerKey: "12345",

playerName: "Patrick Mahomes",

teamName: "Kansas City Chiefs",

opponentName: "Las Vegas Raiders",

stats: { yards: 320, touchdowns: 3 },

}

];

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

for (const [stat_name, value] of Object.entries(r.stats)) {

if (value == null || isNaN(Number(value))) continue;

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

await fs.mkdir(p, { recursive: true });

}

async function writeJson(filePath, data) {

await ensureDir(path.dirname(filePath));

await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");

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