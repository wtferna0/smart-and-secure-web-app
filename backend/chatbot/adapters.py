"""
Repository/adapter layer. If you already have your own Customer/Order/Menu models,
replace these functions to point at your models (keeping the same signatures).
"""
from typing import Optional, Iterable, Dict, Any
from .models import ChatCustomer, ChatMenuItem, ChatOrder

def get_or_create_customer(email: Optional[str], name: str = "") -> Optional[ChatCustomer]:
    if not email:
        return None
    cust, _ = ChatCustomer.objects.get_or_create(email=email, defaults={"name": name})
    return cust

def list_categories() -> Iterable[str]:
    return ChatMenuItem.objects.values_list("category", flat=True).distinct()

def sample_menu_items(limit: int = 5) -> Iterable[Dict[str, Any]]:
    return ChatMenuItem.objects.all()[:limit].values("name","category","price")

def latest_order_for_customer(cust: ChatCustomer) -> Optional[ChatOrder]:
    return ChatOrder.objects.filter(customer=cust).order_by("-created_at").first()
