from rest_framework.test import APIRequestFactory
from payments.views import PayHereCheckoutCreate
import pytest
from decimal import Decimal
from django.conf import settings
from orders.models import Order
from payments.models import Payment

pytestmark = pytest.mark.django_db

def test_checkout_requires_order_id_returns_400():
    factory = APIRequestFactory()
    request = factory.post("/api/payments/payhere/checkout/", {}, format="json")
    response = PayHereCheckoutCreate.as_view()(request)
    assert response.status_code == 400
    assert "Order ID is required" in str(getattr(response, "data", {}))


def test_checkout_path_creates_payment_and_returns_form(api, normal_user):
    api.force_authenticate(user=normal_user)
    order = Order.objects.create(
        order_token="TOK-CHK-1",
        status=Order.Status.PENDING_PAYMENT,
        customer=normal_user,
        subtotal=Decimal("100.00"),
        discount_total=Decimal("0.00"),
        total=Decimal("100.00"),
    )

    r = api.post("/api/payments/payhere/checkout/", {"order_id": order.id}, format="json")
    assert r.status_code == 200

    data = r.data
    assert data["action_url"] == settings.PAYHERE["CHECKOUT_URL"]
    form = data["form_fields"]
    assert form["order_id"] == str(order.id)
    assert form["amount"] == "100.00"
    assert form["currency"] == "LKR"

    assert Payment.objects.filter(
        order=order, provider=Payment.Provider.PAYHERE, status=Payment.Status.PENDING
    ).exists()


def test_checkout_rejects_non_payable_status(api, normal_user):
    api.force_authenticate(user=normal_user)
    order = Order.objects.create(
        order_token="TOK-CHK-2",
        status=Order.Status.COMPLETED,
        customer=normal_user,
        subtotal=Decimal("10.00"),
        discount_total=Decimal("0.00"),
        total=Decimal("10.00"),
    )
    r = api.post("/api/payments/payhere/checkout/", {"order_id": order.id}, format="json")
    assert r.status_code == 400
    assert "not payable" in str(r.data).lower()

def test_checkout_rejects_zero_amount(api, normal_user):
    api.force_authenticate(user=normal_user)
    order = Order.objects.create(
        order_token="TOK-CHK-3",
        status=Order.Status.PENDING_PAYMENT,
        customer=normal_user,
        subtotal=Decimal("0.00"),
        discount_total=Decimal("0.00"),
        total=Decimal("0.00"),
    )
    r = api.post("/api/payments/payhere/checkout/", {"order_id": order.id}, format="json")
    assert r.status_code == 400
    assert "greater than 0" in str(r.data).lower()
