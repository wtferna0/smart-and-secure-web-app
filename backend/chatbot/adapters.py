"""
Repository/adapter layer. If you already have your own Customer/Order/Menu models,
replace these functions to point at your models (keeping the same signatures).
"""
from typing import Optional, Iterable, Dict, Any
from .models import ChatCustomer, ChatMenuItem, ChatOrder

def get_or_create_customer(email: Optional[str], name: str = "") -> Optional[ChatCustomer]:
    if not email:
        return None
    
    # First try to find in main user system
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Try to find user by email in main system
        main_user = User.objects.filter(email=email).first()
        
        # Ensure exists in chatbot system for compatibility
        chatbot_customer, _ = ChatCustomer.objects.get_or_create(
            email=email,
            defaults={"name": name or (main_user.get_full_name() if main_user else "")}
        )
        
        return chatbot_customer
        
    except Exception as e:
        # Fallback to chatbot's own customer system
        print(f"Error connecting to main user system: {e}")
        cust, _ = ChatCustomer.objects.get_or_create(email=email, defaults={"name": name})
        return cust

def list_categories() -> Iterable[str]:
    # Try to use main catalog categories first
    try:
        from catalog.models import Category  # Adjust to your actual catalog app
        categories = Category.objects.all().values_list('name', flat=True)
        return list(categories)
    except ImportError:
        print("Catalog app not found, using chatbot categories")
        return ChatMenuItem.objects.values_list("category", flat=True).distinct()
    except Exception as e:
        print(f"Error getting categories from catalog: {e}")
        return ChatMenuItem.objects.values_list("category", flat=True).distinct()

def sample_menu_items(limit: int = 5) -> Iterable[Dict[str, Any]]:
    # Try to use main catalog items first
    try:
        from catalog.models import Product  # Adjust to your actual product model
        items = Product.objects.filter(available=True)[:limit].values(
            "name", "category__name", "price", "description"
        )
        # Convert to expected format
        formatted_items = []
        for item in items:
            formatted_items.append({
                "name": item["name"],
                "category": item["category__name"],
                "price": item["price"],
                "description": item.get("description", "")
            })
        return formatted_items
    except ImportError:
        print("Catalog app not found, using chatbot menu items")
        return ChatMenuItem.objects.all()[:limit].values("name", "category", "price", "description")
    except Exception as e:
        print(f"Error getting menu items from catalog: {e}")
        return ChatMenuItem.objects.all()[:limit].values("name", "category", "price", "description")

def latest_order_for_customer(cust: ChatCustomer) -> Optional[ChatOrder]:
    # Try to find order in main orders system first
    try:
        from orders.models import Order
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Find the corresponding user in main system by email
        main_user = User.objects.filter(email=cust.email).first()
        
        if main_user:
            print(f"Looking for orders with customer_id: {main_user.id}")
            # Get latest order from orders table for this customer
            main_order = Order.objects.filter(customer_id=main_user.id).order_by("-placed_at").first()
            
            if main_order:
                print(f"Found main order: ID={main_order.id}, Status={main_order.status}")
                
                # Map your order status to chatbot order status
                status_mapping = {
                    'PENDING_PAYMENT': 'placed',
                    'PLACED': 'placed',
                    'ACCEPTED': 'preparing',
                    'DONE': 'done',
                    'FAILED': 'cancelled',
                    'CANCELLED': 'cancelled'
                }
                
                chatbot_status = status_mapping.get(main_order.status, 'placed')
                
                # Create or update a corresponding chatbot order for reference
                chatbot_order, created = ChatOrder.objects.update_or_create(
                    id=main_order.id,  # Use same ID to maintain relationship
                    defaults={
                        "customer": cust,
                        "status": chatbot_status,
                        "total_price": main_order.total,
                        "created_at": main_order.placed_at
                    }
                )
                
                print(f"Chatbot order {'created' if created else 'updated'}: ID={chatbot_order.id}, Status={chatbot_order.status}")
                return chatbot_order
            else:
                print(f"No orders found in orders system for customer_id: {main_user.id}")
                # Check if there are any orders with this email (guest orders)
                guest_order = Order.objects.filter(guest_email=cust.email).order_by("-placed_at").first()
                if guest_order:
                    print(f"Found guest order with email: ID={guest_order.id}")
                    # Map status for guest order
                    chatbot_status = status_mapping.get(guest_order.status, 'placed')
                    
                    chatbot_order, created = ChatOrder.objects.update_or_create(
                        id=guest_order.id,
                        defaults={
                            "customer": cust,
                            "status": chatbot_status,
                            "total_price": guest_order.total,
                            "created_at": guest_order.placed_at
                        }
                    )
                    return chatbot_order
        else:
            print(f"User {cust.email} not found in main user system, checking guest orders")
            # Check for guest orders with this email
            guest_order = Order.objects.filter(guest_email=cust.email).order_by("-placed_at").first()
            if guest_order:
                print(f"Found guest order: ID={guest_order.id}")
                status_mapping = {
                    'PENDING_PAYMENT': 'placed',
                    'PAYMENT_RECEIVED': 'placed',
                    'CONFIRMED': 'preparing',
                    'PREPARING': 'preparing', 
                    'READY_FOR_PICKUP': 'ready',
                    'COMPLETED': 'completed',
                    'CANCELLED': 'cancelled',
                    'REFUNDED': 'cancelled'
                }
                chatbot_status = status_mapping.get(guest_order.status, 'placed')
                
                chatbot_order, created = ChatOrder.objects.update_or_create(
                    id=guest_order.id,
                    defaults={
                        "customer": cust,
                        "status": chatbot_status,
                        "total_price": guest_order.total,
                        "created_at": guest_order.placed_at
                    }
                )
                return chatbot_order
            
    except ImportError as e:
        print(f"Orders app not found: {e}, using chatbot orders")
    except Exception as e:
        print(f"Error getting orders from orders system: {e}")
        import traceback
        traceback.print_exc()
    
    # Fallback to chatbot's own orders
    print("Falling back to chatbot orders")
    return ChatOrder.objects.filter(customer=cust).order_by("-created_at").first()