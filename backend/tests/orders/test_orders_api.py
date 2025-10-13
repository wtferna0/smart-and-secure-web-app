import pytest

@pytest.mark.integration
def test_create_order_flow(api, normal_user, menu_item):
    api.force_authenticate(user=normal_user)
    data = {
        "status": "PLACED",
        "items": [{"menu_item": menu_item.id, "quantity": 2}],
        "subtotal": "2400.00", "discount_total": "0.00", "total": "2400.00",
    }
    res = api.post("/api/orders/", data, format="json")
    assert res.status_code in (200, 201)
    assert "order_token" in res.data

@pytest.mark.security
def test_cannot_order_with_negative_qty(api, normal_user, menu_item):
    api.force_authenticate(user=normal_user)
    bad = {
        "status": "PLACED",
        "items": [{"menu_item": menu_item.id, "quantity": -1}],
        "subtotal": "0.00", "discount_total": "0.00", "total": "0.00",
    }
    res = api.post("/api/orders/", bad, format="json")
    assert res.status_code in (400, 422)
