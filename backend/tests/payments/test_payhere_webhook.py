import pytest
from django.conf import settings
from payments.utils import payhere_compute_md5sig
from orders.models import Order, OrderStatusEvent

IPN_URL = "/api/payments/payhere/ipn/"

def _sign(payload):
    return {
        **payload,
        "md5sig": payhere_compute_md5sig(
            payload["merchant_id"],
            payload["order_id"],
            payload["payhere_amount"],
            payload["payhere_currency"],
            payload["status_code"],
            settings.PAYHERE["MERCHANT_SECRET"],
        ),
    }

@pytest.mark.security
def test_ipn_invalid_signature_is_rejected(api, db):
    bad = dict(
        merchant_id=settings.PAYHERE["MERCHANT_ID"],
        order_id="99999",
        payhere_amount="1200.00",
        payhere_currency="LKR",
        status_code="2",
        md5sig="WRONG",
    )
    res = api.post(IPN_URL, data=bad)
    assert res.status_code in (400, 401, 403)

@pytest.mark.integration
def test_ipn_valid_signature_updates_order(api, db):
    order = Order.objects.create(order_token="TOK-100", status=Order.Status.PENDING_PAYMENT)
    payload = _sign(dict(
        merchant_id=settings.PAYHERE["MERCHANT_ID"],
        order_id=str(order.id),  # views.py expects order_id to be primary key
        payhere_amount="1200.00",
        payhere_currency="LKR",
        status_code="2",
    ))
    res = api.post(IPN_URL, data=payload)
    assert res.status_code in (200, 204)
    order.refresh_from_db()
    # mapping in views.py: status_code '2' -> Order.Status.PLACED
    assert order.status == Order.Status.PLACED

@pytest.mark.security
def test_ipn_is_idempotent(api, db):
    order = Order.objects.create(order_token="TOK-200", status=Order.Status.PENDING_PAYMENT)
    payload = _sign(dict(
        merchant_id=settings.PAYHERE["MERCHANT_ID"],
        order_id=str(order.id),
        payhere_amount="100.00",
        payhere_currency="LKR",
        status_code="2",
    ))
    r1 = api.post(IPN_URL, data=payload)
    r2 = api.post(IPN_URL, data=payload)
    order.refresh_from_db()
    assert r1.status_code in (200, 204)
    assert r2.status_code in (200, 204)
    assert OrderStatusEvent.objects.filter(order=order, to_status=Order.Status.PLACED).count() == 1
