# scripts/baseline_projections.py
# Run example (from repo root):
#   .\.venv\Scripts\Activate.ps1
#   python scripts\baseline_projections.py --year 2025 --week 5

import argparse
import json
from collections import defaultdict
from pathlib import Path

def load_rows(path_str: str):
    p = Path(path_str)
    if not p.exists():
        print(f"WARNING: missing file: {p}")
        return []
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"WARNING: failed to parse JSON: {p} ({e})")
        return []
    if not isinstance(data, list):
        print(f"WARNING: not an array: {p}")
        return []
    return data

def group_stats_by_player(rows):
    """
    Input rows are flat:
      player_id, team_id, game_id, week, opponent, stat_name, value, unit, source, ingested_at
    Return dict: player_id -> stat_name -> [values]
    """
    g = defaultdict(lambda: defaultdict(list))
    for r in rows:
        pid = r.get("player_id")
        stat = r.get("stat_name")
        val = r.get("value")
        if pid is None or stat is None:
            continue
        try:
            num = float(val)
        except Exception:
            continue
        g[pid][stat].append(num)
    return g

def simple_blend(values):
    if not values:
        return None
    return sum(values) / len(values)

def compute_baseline(espn_rows, free_rows):
    g_espn = group_stats_by_player(espn_rows)
    g_free = group_stats_by_player(free_rows)

    players = set(g_espn.keys()) | set(g_free.keys())
    out = []
    for pid in sorted(players):
        stats = set(g_espn.get(pid, {}).keys()) | set(g_free.get(pid, {}).keys())
        for stat in sorted(stats):
            vals = []
            vals.extend(g_espn.get(pid, {}).get(stat, []))
            vals.extend(g_free.get(pid, {}).get(stat, []))
            blended = simple_blend(vals)
            if blended is None:
                continue
            out.append({
                "player_id": pid,
                "stat_name": stat,
                "projection": round(blended, 3),
                "method": "avg(vendor_values)",
                "sources_used": len(vals)
            })
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--year", type=int, required=True)
    ap.add_argument("--week", type=int, required=True)
    ap.add_argument("--league", type=str, default="nfl")
    args = ap.parse_args()

    repo = Path(__file__).resolve().parents[1]
    stats_dir = repo / "data" / "stats" / args.league / str(args.year) / f"week={args.week}"
    out_dir = repo / "data" / "projections" / args.league / str(args.year) / f"week={args.week}"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "baseline.json"

    espn_path = stats_dir / "espn.json"
    free_path = stats_dir / "freeapi1.json"

    espn_rows = load_rows(str(espn_path))
    free_rows = load_rows(str(free_path))

    baseline = compute_baseline(espn_rows, free_rows)
    out_path.write_text(json.dumps(baseline, indent=2), encoding="utf-8")
    print(f"Wrote {len(baseline)} projections to {out_path}")

if __name__ == "__main__":
    main()