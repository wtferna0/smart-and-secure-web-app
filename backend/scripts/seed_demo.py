# backend/scripts/seed_demo.py
from decimal import Decimal
from datetime import timedelta
from pathlib import Path
import os
import sys
import django

# --- bootstrap Django FIRST ---
BASE_DIR = Path(__file__).resolve().parent.parent  # points to .../backend
sys.path.insert(0, str(BASE_DIR))                  # ensure 'config' is importable
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.utils import timezone
from django.contrib.auth.models import User

# --- accounts ---
from accounts.models import UserProfile  # and AuditLog if you want

# --- catalog ---
from catalog.models import MenuCategory, MenuItem, ItemStockMovement

# --- orders / payments / loyalty ---
from orders.models import Order, OrderItem, OrderStatusEvent
from payments.models import Payment
from loyalty.models import PromoCode, UserPromo

# --- crowd / puzzle / chatbot (optional but included) ---
from crowd.models import CrowdSnapshot
from puzzle.models import PuzzleSession
try:
    from chatbot.models import ChatMenuItem, ChatCustomer, ChatOrder, ChatOrderItems
    HAS_CHATBOT = True
except Exception:
    HAS_CHATBOT = False

now = timezone.now()


def upsert_user(username, email, is_staff=False, is_superuser=False):
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            "email": email,
            "is_staff": is_staff,
            "is_superuser": is_superuser,
        },
    )
    if created:
        user.set_password("Passw0rd!")
        user.save()
    # profile
    UserProfile.objects.get_or_create(
        user=user,
        defaults=dict(
            display_name=username.title(),
            phone="555-{:04d}".format(user.id or 1),
            contact_email=email,
            points_balance=100,
            paid_order_count=0,
            default_currency="USD",
            marketing_opt_in=True,
            created_at=now - timedelta(days=10),
            updated_at=now,
        ),
    )
    return user


def seed_users():
    admin = upsert_user("admin", "admin@example.com", True, True)
    alice = upsert_user("alice", "alice@example.com")
    bob = upsert_user("bob", "bob@example.com")
    carol = upsert_user("carol", "carol@example.com")
    return admin, alice, bob, carol


def seed_catalog():
    coffee, _ = MenuCategory.objects.get_or_create(name="Coffee", defaults={"is_active": True})
    tea, _ = MenuCategory.objects.get_or_create(name="Tea", defaults={"is_active": True})
    pastry, _ = MenuCategory.objects.get_or_create(name="Pastry", defaults={"is_active": True})

    items = [
        ("Americano", Decimal("3.50"), coffee, 50),
        ("Latte", Decimal("4.20"), coffee, 30),
        ("Cappuccino", Decimal("4.00"), coffee, 25),
        ("Green Tea", Decimal("2.80"), tea, 40),
        ("Croissant", Decimal("2.50"), pastry, 35),
    ]
    created = []
    for name, price, cat, stock in items:
        mi, _ = MenuItem.objects.get_or_create(
            name=name,
            defaults=dict(
                price=price,
                is_active=True,
                stock_qty=stock,
                category=cat,
                created_at=now - timedelta(days=5),
            ),
        )
        created.append(mi)
    return created


def adjust_stock(item, delta, reason="ORDER", by_user=None, ref_order=None, note=None):
    # record a movement and update the MenuItem's stock
    ItemStockMovement.objects.create(
        menu_item=item,
        delta_qty=delta,
        reason=reason,
        note=note,
        created_at=now,
        created_by=by_user,
        ref_order=ref_order,
    )
    item.stock_qty += delta
    item.save(update_fields=["stock_qty"])


def seed_promos():
    pc, _ = PromoCode.objects.get_or_create(
        code="WELCOME10",
        defaults=dict(
            discount_type="PERCENT",  # or "AMOUNT"
            amount=Decimal("10.00"),
            min_order_total=Decimal("0.00"),
            starts_at=now - timedelta(days=30),
            ends_at=now + timedelta(days=30),
            is_active=True,
            max_redemptions=1000,
            per_user_limit=1,
            created_at=now - timedelta(days=30),
        ),
    )
    return pc


def make_order(customer, items, promo=None, guest_email=None):
    """
    items = [(MenuItem, qty), ...]
    """
    subtotal = sum(mi.price * qty for mi, qty in items)
    discount = Decimal("0.00")
    applied_code = None
    if promo:
        applied_code = promo.code
        if promo.discount_type.upper() == "PERCENT":
            discount = (subtotal * (promo.amount / Decimal("100"))).quantize(Decimal("0.01"))
        else:
            discount = min(promo.amount, subtotal)
    total = subtotal - discount

    order = Order.objects.create(
        order_token=Order.generate_token() if hasattr(Order, "generate_token")
        else f"TOK{int(now.timestamp())}{customer.id if customer else 0}",
        status="PLACED",
        guest_email=guest_email,
        subtotal=subtotal,
        discount_total=discount,
        total=total,
        points_redeemed=0,
        points_earned=int(total),  # 1 point per $ for demo
        applied_promo_code=applied_code,
        placed_at=now,
        updated_at=now,
        customer=customer,
    )

    # line items + stock movements
    for mi, qty in items:
        OrderItem.objects.create(
            order=order,
            menu_item=mi,  # ensure FK is set
            item_name=mi.name,
            price_each=mi.price,
            qty=qty,
            line_total=(mi.price * qty).quantize(Decimal("0.01")),
        )
        adjust_stock(mi, -qty, reason="ORDER", by_user=customer, ref_order=order)

    OrderStatusEvent.objects.create(
        order=order,
        from_status=None,
        to_status="PLACED",
        note="Demo order placed",
        created_at=now,
        changed_by=customer,
    )

    return order


def pay_order(order, by_user=None, provider="MOCK", status="PAID"):
    Payment.objects.get_or_create(
        payment_ref=f"PAY-{order.id}",
        defaults=dict(
            order=order,              # <— add this
            provider=provider,
            amount=order.total,
            currency="USD",
            status=status,
            raw_payload={"demo": True, "order_id": order.id},
            created_at=now,
            created_by=by_user,
        ),
    )
    
    if order.status != "PAID":
        OrderStatusEvent.objects.create(
            order=order,
            from_status=order.status,
            to_status="PAID",
            note="Demo payment captured",
            created_at=now,
            changed_by=by_user,
        )
        order.status = "PAID"
        order.updated_at = now
        order.save(update_fields=["status", "updated_at"])


def seed_crowd():
    CrowdSnapshot.objects.get_or_create(
        as_of=now.replace(second=0, microsecond=0),
        defaults=dict(level=3, orders_in_last_30m=7, note="Demo snapshot"),
    )


def seed_puzzle(user):
    PuzzleSession.objects.get_or_create(
        email=user.email,
        defaults=dict(
            grid_size=4,
            started_at=now - timedelta(minutes=5),
            completed_at=now,
            moves=42,
            time_ms=5 * 60 * 1000,
            points_awarded=15,
            reward_code="PUZ-REWARD",
        ),
    )


def seed_chatbot():
    if not HAS_CHATBOT:
        return
    cm1, _ = ChatMenuItem.objects.get_or_create(
        name="Iced Latte",
        defaults=dict(
            description="Chilled latte",
            price=Decimal("4.50"),
            category="Coffee",
            image_url="https://picsum.photos/seed/latte/200",
        ),
    )
    cust, _ = ChatCustomer.objects.get_or_create(
        email="chatter@example.com",
        defaults=dict(name="Chatter", loyalty_points=50),
    )
    co, _ = ChatOrder.objects.get_or_create(
        customer=cust,
        status="OPEN",
        defaults=dict(total_price=Decimal("4.50"), created_at=now),
    )
    ChatOrderItems.objects.get_or_create(chatorder=co, chatmenuitem=cm1)


def run():
    admin, alice, bob, carol = seed_users()
    items = seed_catalog()
    promo = seed_promos()

    # three demo orders
    o1 = make_order(alice, [(items[0], 2), (items[4], 1)], promo=promo)
    pay_order(o1, alice)

    o2 = make_order(bob, [(items[1], 1)], promo=None)
    # leave UNPAID to test statuses

    o3 = make_order(None, [(items[2], 1), (items[3], 2)], guest_email="guest@example.com")

    # loyalty redemption example
    UserPromo.objects.get_or_create(user=alice, promo=promo, order=o1, defaults={"redeemed_at": now})

    seed_crowd()
    seed_puzzle(alice)
    seed_chatbot()

    print("✅ demo seed complete.")
    print("Users: admin/alice/bob/carol (password: Passw0rd!)")
    print(f"Orders created: {o1.id}, {o2.id}, {o3.id}")

if __name__ == "__main__":
    run()
