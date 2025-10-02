import pandas as pd

REQUIRED = [
    "pass_yards","pass_td","ints",
    "rush_yards","rush_td",
    "rec_yards","rec_td","receptions"
]

def weekly_to_fantasy_points(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # Ensure required stat columns exist
    for col in REQUIRED:
        if col not in df.columns:
            df[col] = 0
    df["fantasy_points"] = (
        df["pass_yards"]/25 + df["pass_td"]*4 - df["ints"]*2 +
        df["rush_yards"]/10 + df["rush_td"]*6 +
        df["rec_yards"]/10 + df["rec_td"]*6 + df["receptions"]
    )
    return df