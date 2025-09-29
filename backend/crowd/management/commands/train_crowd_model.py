from django.core.management.base import BaseCommand
from django.conf import settings
from django.apps import apps
from django.utils import timezone
from datetime import timedelta
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

def cfg():
    defaults = dict(
        WINDOW_MINUTES=30, BIN_MINUTES=5, ACTIVE_STATUSES=["Accepted","Preparing","Ready"],
        STATUS_WEIGHTS={"Accepted":1.0,"Preparing":0.8,"Ready":0.4},
        PEOPLE_PER_ORDER=1.3, CAPACITY=50,
        ORDER_MODEL="orders.Order", STATUS_FIELD="status", CREATED_FIELD="placed_at",
        MODEL_PATH=settings.BASE_DIR / "crowd" / "model_assets" / "crowd_model.pkl",
        TRAIN_LOOKBACK_DAYS=14,
    )
    c = defaults.copy(); c.update(getattr(settings, "CROWD_METER", {})); return c

def add_time_feats(df, ts_col):
    df["hour"] = df[ts_col].dt.hour
    df["dow"] = df[ts_col].dt.dayofweek
    df["hour_sin"] = np.sin(2*np.pi*df["hour"]/24)
    df["hour_cos"] = np.cos(2*np.pi*df["hour"]/24)
    df["is_weekend"] = (df["dow"] >= 5).astype(int)
    return df

class Command(BaseCommand):
    help = "Train ML model for the crowd meter from recent orders (bootstrapped label)."

    def handle(self, *args, **kwargs):
        C = cfg()
        Order = apps.get_model(C["ORDER_MODEL"])
        tsf, sf = C["CREATED_FIELD"], C["STATUS_FIELD"]
        now = timezone.now()
        since = now - timedelta(days=C["TRAIN_LOOKBACK_DAYS"])

        qs = Order.objects.filter(**{f"{tsf}__gte": since}).values(tsf, sf)
        if not qs.exists():
            self.stdout.write(self.style.WARNING("No orders in lookback window. Aborting."))
            return

        df = pd.DataFrame.from_records(qs)
        df[tsf] = pd.to_datetime(df[tsf], utc=True).dt.tz_convert("UTC")
        df["bin_start"] = df[tsf].dt.floor(f"{C['BIN_MINUTES']}min")

        # Features per bin -----------------------------------------------------
        pivot = (df.pivot_table(index="bin_start", columns=sf, values=tsf, aggfunc="count")
                   .fillna(0).astype(int))
        for s in C["ACTIVE_STATUSES"]:
            if s not in pivot.columns:
                pivot[s] = 0
        pivot = pivot.sort_index()
        feats = pivot.copy()
        feats["orders_total"] = feats.sum(axis=1)

        win = max(1, int(C["WINDOW_MINUTES"] / C["BIN_MINUTES"]))
        # rolling sums/means within the crowd window
        for col in list(pivot.columns) + ["orders_total"]:
            feats[f"r_sum_{col}"] = feats[col].rolling(win, min_periods=1).sum()
        feats["r_mean_orders_total"] = feats["orders_total"].rolling(win, min_periods=1).mean()

        feats = feats.reset_index()
        feats = add_time_feats(feats, "bin_start")

        # Bootstrapped target (heuristic) -------------------------------------
        weights = C["STATUS_WEIGHTS"]; ppl = C["PEOPLE_PER_ORDER"]; cap = C["CAPACITY"]
        tmp = df.copy(); tmp["w"] = tmp[sf].map(weights).fillna(0.0)
        target = (tmp.groupby("bin_start")["w"].sum() * ppl).clip(0, cap).rename("target").reset_index()

        data = feats.merge(target, on="bin_start", how="left").sort_values("bin_start")
        data["target"] = data["target"].fillna(method="ffill").fillna(0)

        feature_cols = [c for c in data.columns if c not in ["bin_start","target"]]
        X = data[feature_cols].values; y = data["target"].values

        if len(data) < 100:
            self.stdout.write(self.style.WARNING(f"Low sample size ({len(data)}). Training anyway."))

        # simple temporal split: last 20% as test
        split = int(len(data)*0.8)
        from_idx = max(1, split)
        X_train, y_train = X[:from_idx], y[:from_idx]
        X_test, y_test = X[from_idx:], y[from_idx:]

        model = RandomForestRegressor(n_estimators=250, max_depth=14, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)
        mae = mean_absolute_error(y_test, model.predict(X_test)) if len(X_test) else float("nan")

        bundle = {"model": model, "meta": {"feature_cols": feature_cols, "generated_at": now.isoformat()}}
        path = C["MODEL_PATH"]
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(bundle, path)

        self.stdout.write(self.style.SUCCESS(
            f"Saved ML model → {path} | MAE vs heuristic: {mae:.2f} | rows={len(data)}"
        ))
