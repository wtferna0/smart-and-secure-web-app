# loyalty/services.py
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from loyalty.models import PromoCode, UserPromo
from orders.models import Order
from accounts.models import UserProfile

POINTS_TO_CURRENCY = Decimal("1.00")  # 1 point = $1.00; adjust if needed

def _load_order_for_update(order_id: int) -> Order:
    return Order.objects.select_for_update().get(id=order_id)

def apply_promo_to_order(*, order_id: int, code: str, user) -> Order:
    order = _load_order_for_update(order_id)
    promo = PromoCode.objects.get(code__iexact=code)

    if not promo.is_valid():
        raise ValidationError("Promo code is not valid.")

    if order.subtotal < promo.min_order_total:
        raise ValidationError("Order total does not meet promo minimum.")

    # Apply the discount
    discount = promo.amount if promo.discount_type == "AMOUNT" else (order.subtotal * (promo.amount / 100))
    order.applied_promo_code = promo.code
    order.discount_total = discount
    order.total = (order.subtotal - discount).quantize(Decimal("0.01"))
    order.save()
    return order

@transaction.atomic
def redeem_points_for_order(*, order_id: int, user, points: int) -> Order:
    order = _load_order_for_update(order_id)
    if points > user.points_balance:
        raise ValidationError("Insufficient points.")
    user.points_balance -= points
    user.save()

    order.points_redeemed = points
    order.total = (order.subtotal - order.discount_total - (order.points_redeemed * POINTS_TO_CURRENCY)).quantize(Decimal("0.01"))
    order.save()
    return order

# loyalty/services.py
@transaction.atomic
def mark_order_paid_and_finalize_loyalty(*, order_id: int) -> Order:
    order = _load_order_for_update(order_id)

    if order.status == "PAID":
        return order

    if order.applied_promo_code:
        promo = PromoCode.objects.filter(code=order.applied_promo_code).first()
        if promo:
            UserPromo.objects.get_or_create(user=order.customer, promo=promo, order=order, defaults={"redeemed_at": timezone.now()})

    if order.points_earned:
        credit_points(user=order.customer, points=order.points_earned, reason="ORDER_PAID")

    order.status = "PAID"
    order.save()
    return order

