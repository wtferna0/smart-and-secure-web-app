from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from django.apps import apps
from django.db import DatabaseError
from .models import CrowdSnapshot, CrowdOverride
from .ml_runtime import predict_level_now

def _cfg():
    d = dict(
        WINDOW_MINUTES=30, 
        ACTIVE_STATUSES=["Accepted","Preparing","Ready"],
        STATUS_WEIGHTS={"Accepted":1.0,"Preparing":0.8,"Ready":0.4},
        PEOPLE_PER_ORDER=1.3, 
        CAPACITY=50, 
        SMOOTHING_ALPHA=0.35,
        ORDER_MODEL="orders.Order", 
        STATUS_FIELD="status", 
        CREATED_FIELD="placed_at",
        MODE="heuristic",
    )
    d.update(getattr(settings, "CROWD_METER", {}))
    return d

def _heuristic_from_orders():
    C = _cfg()
    try:
        Order = apps.get_model(C["ORDER_MODEL"])
    except LookupError:
        return 0

    tsf, sf = C["CREATED_FIELD"], C["STATUS_FIELD"]
    now = timezone.now()
    since = now - timedelta(minutes=C["WINDOW_MINUTES"])
    qs = Order.objects.filter(**{f"{tsf}__gte": since, f"{sf}__in": C["ACTIVE_STATUSES"]}).values(sf)
    
    weights = C["STATUS_WEIGHTS"]
    ppl = C["PEOPLE_PER_ORDER"]
    cap = C["CAPACITY"]
    
    score = 0.0
    for r in qs:
        score += weights.get(r[sf], 0.0)
    
    est = int(round(score * ppl))
    return max(0, min(est, cap))

def _smooth(new_level: int):
    C = _cfg()
    alpha = float(C.get("SMOOTHING_ALPHA", 0.35))
    last = CrowdSnapshot.objects.order_by("-timestamp").first()
    last_lvl = last.level if last else new_level
    return int(round(alpha * new_level + (1 - alpha) * last_lvl))

def current_level():
    """
    If a manual override is active, return it.
    Else try ML prediction; if unavailable, use heuristic.
    Smooth before returning.
    """
    try:
        now = timezone.now()
        ov = (CrowdOverride.objects
            .order_by("-created_at")
            .first())
        
        if ov and ov.is_active():
            level = max(0, min(int(ov.level), _cfg()["CAPACITY"]))
            level = _smooth(level)
            return {"level": level, "source": "manual", "updated_at": now}

        if _cfg().get("MODE") == "ml":
            ml = predict_level_now()
            if ml is not None:
                level = _smooth(ml)
                return {"level": level, "source": "ml", "updated_at": now}

        h = _heuristic_from_orders()
        level = _smooth(h)
        return {"level": level, "source": "system", "updated_at": now}
    except Exception:
        # Covers pytest-django RuntimeError (DB blocked) and DB errors
        return {"level": 0}
    
    return {"level": 0}

def store_snapshot():
    data = current_level()
    CrowdSnapshot.objects.create(level=data["level"], source=data["source"])
    return data