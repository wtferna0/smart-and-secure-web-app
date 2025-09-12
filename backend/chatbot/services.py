from typing import Optional, Dict
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from .adapters import (
    get_or_create_customer, list_categories, sample_menu_items, latest_order_for_customer
)

def intent_menu() -> Dict:
    cats = list(sorted(set(list_categories())))
    sample = list(sample_menu_items(5))
    return {"reply":"Here are some categories and sample items.","categories":cats,"sample":sample}

def intent_order_status(customer) -> Dict:
    if not customer:
        return {"reply":"To check order status, please provide your email."}
    order = latest_order_for_customer(customer)
    if not order:
        return {"reply":"I couldn't find any orders for you yet."}
    return {"reply": f"Your latest order #{order.id} is '{order.status}'.", "order_id": order.id}

def intent_loyalty(customer) -> Dict:
    if not customer:
        return {"reply":"Please share your email to check loyalty points."}
    return {"reply": f"You have {customer.loyalty_points} loyalty points."}

def intent_hours() -> Dict:
    return {"reply":"We’re open daily 8:00–22:00 (Asia/Colombo)."}

def intent_location() -> Dict:
    return {"reply":"We are at 123 Café Street, Colombo."}

def intent_crowd() -> Dict:
    from .models import ChatOrder
    now = timezone.now()
    since = now - timedelta(hours=12)
    buckets = (
        ChatOrder.objects.filter(created_at__gte=since)
        .extra(select={'hour': "strftime('%%H', created_at)"})
        .values('hour').annotate(count=Count('id')).order_by('hour')
    )
    return {"reply":"Crowd levels for the last 12 hours.","buckets": list(buckets)}
