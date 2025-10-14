import pytest
from decimal import Decimal
from chatbot import adapters
from chatbot.models import ChatMenuItem

pytestmark = pytest.mark.django_db

def test_sample_menu_items_returns_available_only():
    ChatMenuItem.objects.create(name="A", category="Drinks", price=Decimal("1.00"), is_available=True)
    ChatMenuItem.objects.create(name="B", category="Food", price=Decimal("2.00"), is_available=False)

    items = adapters.sample_menu_items(limit=5)
    assert isinstance(items, list)
    assert all({"name","category","price"} <= set(it.keys()) for it in items)

    names = {it["name"] for it in items}
    assert "A" in names and "B" not in names

def test_get_or_create_customer_idempotent():
    c1 = adapters.get_or_create_customer(email="x@example.com", name="X")
    c2 = adapters.get_or_create_customer(email="x@example.com", name="Y")
    assert c1 and c2 and c1.id == c2.id
