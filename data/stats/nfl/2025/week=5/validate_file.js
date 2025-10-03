// scripts/validate_file.js
const fs = require('fs/promises');

function validateRow(r) {
	const required = ["player_id","team_id","game_id","week","opponent","stat_name","value","source","ingested_at"];
	for (const k of required) if (!(k in r)) return `Missing ${k}`;
	if (typeof r.value !== "number" || Number.isNaN(r.value)) return "value must be number";
	return null;
}

(async () => {
	const file = process.argv[2];
	if (!file) {
		console.error("Usage: node scripts/validate_file.js <path/to.json>");
		process.exit(1);
	}
	const buf = await fs.readFile(file, "utf8");
	const arr = JSON.parse(buf);
	for (let i = 0; i < arr.length; i++) {
		const err = validateRow(arr[i]);
		if (err) {
			console.error(`Row ${i}: ${err}`);
			process.exit(1);
		}
	}
	console.log("OK");
})();