# payments/utils.py
import hashlib
from django.conf import settings

def payhere_compute_md5sig(merchant_id, order_id, payhere_amount, payhere_currency, status_code, merchant_secret):
    # Spec: md5sig = UPPERCASE( MD5( merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPERCASE(MD5(merchant_secret)) ) )
    secret_hash = hashlib.md5(merchant_secret.encode("utf-8")).hexdigest().upper()
    raw = f"{merchant_id}{order_id}{payhere_amount}{payhere_currency}{status_code}{secret_hash}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest().upper()

def payhere_verify_md5sig(payload: dict) -> bool:
    """payload is request.POST dict-likes (strings)."""
    cfg = settings.PAYHERE
    required = ["merchant_id", "order_id", "payhere_amount", "payhere_currency", "status_code", "md5sig"]
    if not all(k in payload for k in required):
        return False
    expected = payhere_compute_md5sig(
        payload["merchant_id"],
        payload["order_id"],
        payload["payhere_amount"],
        payload["payhere_currency"],
        payload["status_code"],
        cfg["MERCHANT_SECRET"],
    )
    return expected == payload["md5sig"]
