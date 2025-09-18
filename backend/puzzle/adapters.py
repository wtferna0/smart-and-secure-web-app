"""Integration hooks for awarding loyalty or generating promo codes.
If the 'chatbot' app with ChatCustomer exists, we will increment loyalty points.
Otherwise we issue a promo code.
"""
import random, string
from typing import Optional, Tuple

def _generate_code(n: int = 8) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=n))

def award_loyalty(email: Optional[str], points: int) -> Tuple[int, str]:
    awarded = 0
    code = ""
    if not email:
        return (0, _generate_code())
    try:
        from chatbot.models import ChatCustomer
        cust, _ = ChatCustomer.objects.get_or_create(email=email, defaults={"name":""})
        cust.loyalty_points += points
        cust.save(update_fields=["loyalty_points"])
        awarded = points
        return (awarded, code)
    except Exception:
        return (0, _generate_code())
