from prophet import Prophet
import pandas as pd

def demo_forecast():
    # toy weekly series
    df = pd.DataFrame({"ds": pd.date_range("2025-01-01", periods=12, freq="W"),
                       "y": [10,11,9,13,12,14,11,13,12,15,14,16]})
    m = Prophet(weekly_seasonality=True, yearly_seasonality=False, daily_seasonality=False)
    m.fit(df)
    fc = m.predict(m.make_future_dataframe(periods=1, freq="W")).tail(1).iloc[0]
    return {"mean": float(fc["yhat"]), "low": float(fc["yhat_lower"]), "high": float(fc["yhat_upper"])}
    
    from prophet import Prophet
import pandas as pd

def demo_forecast():
    df = pd.DataFrame({"ds": pd.date_range("2025-01-01", periods=12, freq="W"),
                       "y": [10,11,9,13,12,14,11,13,12,15,14,16]})
    m = Prophet(weekly_seasonality=True, yearly_seasonality=False, daily_seasonality=False)
    m.fit(df)
    fc = m.predict(m.make_future_dataframe(periods=1, freq="W")).tail(1).iloc[0]
    return {"mean": float(fc["yhat"]), "low": float(fc["yhat_lower"]), "high": float(fc["yhat_upper"])}

def make_ts(df: pd.DataFrame, player_id: str) -> pd.DataFrame|None:
    sub = df[df["player_id"]==player_id].copy()
    if sub.empty: return None
    sub["ds"] = pd.to_datetime(sub["season"].astype(str)+"-01-01") + pd.to_timedelta((sub["week"]-1)*7, unit="D")
    sub["y"] = sub["fantasy_points"].astype(float)
    return sub[["ds","y"]]

def forecast_next(ts: pd.DataFrame) -> dict|None:
    if ts is None or len(ts) < 6:
        return None
    m = Prophet(weekly_seasonality=True, yearly_seasonality=False, daily_seasonality=False)
    m.fit(ts)
    fc = m.predict(m.make_future_dataframe(periods=1, freq="W")).tail(1).iloc[0]
    return {"mean": float(fc["yhat"]), "low": float(fc["yhat_lower"]), "high": float(fc["yhat_upper"])}