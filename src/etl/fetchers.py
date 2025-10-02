import pandas as pd

def fetch_weekly_stub(season: int, weeks: int = 12) -> pd.DataFrame:
    # Generate weeks 1..weeks (inclusive)
    data = []
    for w in range(1, weeks + 1):
        data.append({
            "player_id": "demo1",
            "season": season,
            "week": w,
            "pass_yards": 0, "pass_td": 0, "ints": 0,
            "rush_yards": 10 + w, "rush_td": 0,
            "rec_yards": 20 + 2*w, "rec_td": 0,
            "receptions": 3
        })
    return pd.DataFrame(data)