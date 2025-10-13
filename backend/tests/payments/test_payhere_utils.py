from django.conf import settings
from payments.utils import payhere_compute_md5sig, payhere_verify_md5sig

def test_payhere_signature_roundtrip():
    payload = dict(
        merchant_id=settings.PAYHERE["MERCHANT_ID"],
        order_id="ORD-1",
        payhere_amount="1200.00",
        payhere_currency="LKR",
        status_code="2",
    )
    sig = payhere_compute_md5sig(
        payload["merchant_id"],
        payload["order_id"],
        payload["payhere_amount"],
        payload["payhere_currency"],
        payload["status_code"],
        settings.PAYHERE["MERCHANT_SECRET"],
    )
    assert isinstance(sig, str) and len(sig) == 32
    ok = payhere_verify_md5sig({**payload, "md5sig": sig})
    assert ok is True
