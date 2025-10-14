import pytest
from decimal import Decimal

from orders.serializers import OrderCreateSerializer
from orders.models import Order

pytestmark = pytest.mark.django_db

def test_order_create_serializer_maps_fields_and_creates_order(menu_item):
    # make sure we actually have stock for this test
    menu_item.stock_qty = 10
    menu_item.price = Decimal("1200.00")
    menu_item.save()

    data = {
        "status": "PLACED",
        "items": [{"menu_item": menu_item.id, "quantity": 2}],
        "subtotal": "2400.00",
        "discount_total": "0.00",
        "total": "2400.00",
    }
    ser = OrderCreateSerializer(data=data, context={})
    assert ser.is_valid(), ser.errors

    order = ser.save()
    assert isinstance(order, Order)
    # order items created?
    assert order.orderitem_set.count() == 1
    # stock reduced?
    menu_item.refresh_from_db()
    assert menu_item.stock_qty == 8
    # money fields preserved
    assert order.subtotal == Decimal("2400.00")
    assert order.total == Decimal("2400.00")
    assert order.discount_total == Decimal("0.00")
