from django.conf import settings
from django.apps import apps
from django.utils import timezone
from datetime import timedelta
import numpy as np, pandas as pd, joblib

_CACHE = {"bundle": None}

def C(): return getattr(settings, "CROWD_METER", {})

def load_model():
    if _CACHE["bundle"] is None:
        try:
            _CACHE["bundle"] = joblib.load(C().get("MODEL_PATH"))
        except Exception:
            _CACHE["bundle"] = None
    return _CACHE["bundle"]

def _time_feats(df, ts):
    df["hour"] = df[ts].dt.hour
    df["dow"] = df[ts].dt.dayofweek
    df["hour_sin"] = np.sin(2*np.pi*df["hour"]/24)
    df["hour_cos"] = np.cos(2*np.pi*df["hour"]/24)
    df["is_weekend"] = (df["dow"] >= 5).astype(int)
    return df

def build_features_now():
    cfg = C()
    Order = apps.get_model(cfg.get("ORDER_MODEL","orders.Order"))
    tsf = cfg.get("CREATED_FIELD","placed_at")
    sf  = cfg.get("STATUS_FIELD","status")
    bin_m = int(cfg.get("BIN_MINUTES",5))
    window = int(cfg.get("WINDOW_MINUTES",30))

    now = timezone.now()
    since = now - timedelta(minutes=window)
    qs = Order.objects.filter(**{f"{tsf}__gte": since}).values(tsf, sf)
    if not qs.exists():
        # empty row with only time features
        b = pd.DataFrame({"bin_start": [pd.Timestamp(now, tz="UTC").floor(f"{bin_m}min")]})
        return _time_feats(b, "bin_start")

    df = pd.DataFrame.from_records(qs)
    df[tsf] = pd.to_datetime(df[tsf], utc=True)
    df["bin_start"] = df[tsf].dt.floor(f"{bin_m}min")
    pivot = (df.pivot_table(index="bin_start", columns=sf, values=tsf, aggfunc="count")
               .fillna(0).astype(int)).sort_index()
    for s in cfg.get("ACTIVE_STATUSES", []):
        if s not in pivot.columns: pivot[s] = 0
    feats = pivot.copy()
    feats["orders_total"] = feats.sum(axis=1)
    win = max(1, int(window / bin_m))
    for col in list(pivot.columns) + ["orders_total"]:
        feats[f"r_sum_{col}"] = feats[col].rolling(win, min_periods=1).sum()
    feats["r_mean_orders_total"] = feats["orders_total"].rolling(win, min_periods=1).mean()
    feats = feats.reset_index()
    feats = _time_feats(feats, "bin_start")
    row = feats.iloc[[-1]].copy()
    return row

def predict_level_now():
    bundle = load_model()
    if not bundle:
        return None
    feat_row = build_features_now()
    feat_cols = bundle["meta"]["feature_cols"]
    for c in feat_cols:
        if c not in feat_row.columns:
            feat_row[c] = 0
    X = feat_row[feat_cols].astype(float).values
    yhat = float(bundle["model"].predict(X)[0])
    cap = int(C().get("CAPACITY", 50))
    return max(0, min(int(round(yhat)), cap))
