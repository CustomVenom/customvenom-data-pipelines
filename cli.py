import json
from pathlib import Path
import pandas as pd
from src.etl.fetchers import fetch_weekly_stub
from src.etl.normalize import weekly_to_fantasy_points
from src.models.prophet_blend import make_ts, forecast_next

def run_projection(season:int, week:int):
    # 1) fetch last 12 weeks of toy data
    weekly = fetch_weekly_stub(season, weeks=12)
    # 2) compute fantasy points
    weekly = weekly_to_fantasy_points(weekly)
    # 3) forecast per player (only demo1 exists)
    players = weekly["player_id"].unique().tolist()
    out = []
    for pid in players:
        ts = make_ts(weekly, pid)
        fc = forecast_next(ts)
        if not fc: continue
        out.append({
            "player_id": pid,
            "proj_mean": fc["mean"],
            "proj_low": fc["low"],
            "proj_high": fc["high"]
        })
    # 4) save
    out_dir = Path(f"data/artifacts/{season}-{week}")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "projections.json").write_text(json.dumps(out, indent=2))
    print("wrote", out_dir / "projections.json")

if __name__ == "__main__":
    run_projection(season=2025, week=5)