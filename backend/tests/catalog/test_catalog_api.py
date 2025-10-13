import pytest

@pytest.mark.integration
def test_guest_can_read_menu(api, menu_item):
    res = api.get("/api/catalog/items/")
    assert res.status_code == 200
    assert any("Latte" in str(x) for x in res.data)

@pytest.mark.security
def test_normal_user_cannot_create_menu_item(api, normal_user, category):
    api.force_authenticate(user=normal_user)
    res = api.post("/api/catalog/items/", {"name": "Espresso", "price": "800.00", "category": category.id})
    assert res.status_code in (401, 403)

@pytest.mark.integration
def test_staff_can_create_menu_item(api, staff_user, category):
    api.force_authenticate(user=staff_user)
    res = api.post("/api/catalog/items/", {"name": "Espresso", "price": "800.00", "category": category.id})
    assert res.status_code in (200, 201)
