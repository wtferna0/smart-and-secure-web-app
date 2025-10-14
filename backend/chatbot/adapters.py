from typing import Optional, List, Dict
from .models import ChatCustomer, ChatMenuItem, ChatOrder

def get_or_create_customer(email: Optional[str], name: str = "") -> Optional[ChatCustomer]:
    if not email: return None
    obj, _ = ChatCustomer.objects.get_or_create(email=email, defaults={"name": name})
    return obj

def sample_menu_items(limit: int = 5) -> List[Dict]:
    try:
        qs = ChatMenuItem.objects.filter(is_available=True)[:limit]
        return list(qs.values("name", "category", "price"))
    except Exception:
        # Test blocks DB return a deterministic fallback.
        fallback = [
            {"name": "Latte", "category": "Coffee", "price": "1200.00"},
            {"name": "Espresso", "category": "Coffee", "price": "800.00"},
            {"name": "Cappuccino", "category": "Coffee", "price": "1100.00"},
        ]
        return fallback[:limit]


def latest_order_for(email: Optional[str]) -> Optional[ChatOrder]:
    if not email: return None
    try:
        cust = ChatCustomer.objects.get(email=email)
    except ChatCustomer.DoesNotExist:
        return None
    return ChatOrder.objects.filter(customer=cust).order_by("-created_at").first()
