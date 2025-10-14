from datetime import datetime
from typing import Dict, Any
from .adapters import sample_menu_items, latest_order_for, get_or_create_customer

def intent_menu() -> Dict[str, Any]:
    items = sample_menu_items(8)
    if not items:
        return {"reply": "Our menu is being updated. Please check back soon."}
    lines = [f"- {i['name']} ({i['category']}): LKR {i['price']}" for i in items]
    return {"reply": "Here are some popular items:\n" + "\n".join(lines)}

def intent_hours() -> Dict[str, Any]:
    return {"reply": "We're open daily from 8:00 AM to 8:00 PM."}

def intent_location() -> Dict[str, Any]:
    return {"reply": "We’re at 123 Cafe Street, Colombo 07. Parking available across the road."}

def intent_crowd() -> Dict[str, Any]:
    now = datetime.now().strftime("%I:%M %p")
    return {"reply": f"As of {now}, we’re moderately busy. Best time is usually 3–5 PM."}

def intent_loyalty(email: str = "") -> Dict[str, Any]:
    cust = get_or_create_customer(email or None)
    if not cust:
        return {"reply": "Tell me your email to check points, e.g., 'my email is you@example.com'."}
    return {"reply": f"You have {cust.loyalty_points} loyalty points."}

def intent_order_status(email: str = "", text: str = "") -> Dict[str, Any]:
    order = latest_order_for(email or None)
    if not order:
        return {"reply": "I couldn’t find a recent order for you. If you placed one, share your email."}
    return {"reply": f"Your latest order #{order.id} is {order.status}. Total: LKR {order.total}."}
