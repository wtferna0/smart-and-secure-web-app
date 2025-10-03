# catalog/management/commands/add_menu_images.py
import os
from django.core.files import File
from django.core.management.base import BaseCommand
from django.conf import settings
from catalog.models import MenuItem

class Command(BaseCommand):
    help = 'Add images to existing menu items'
    
    def add_arguments(self, parser):
        parser.add_argument('--image-dir', type=str, default='media/menu_images/', help='Directory containing images')
    
    def handle(self, *args, **options):
        image_dir = options['image_dir']
        
        # Map item names to image files
        image_mapping = {
            # Coffee Items
            'Affogato (Espresso + Ice Cream)': 'affogato.jpg',
            'Americano': 'americano.jpg',
            'Cafe Latte': 'latte.jpg',
            'Caffè Mocha': 'mocha.jpg',
            'Cappuccino': 'cappuccino.jpg',
            'Cold Brew Coffee': 'cold-brew.jpg',
            'Espresso (Single)': 'espresso.jpg',
            'Espresso Macchiato': 'macchiato.jpg',
            'Flat White': 'flatwhite.jpg',
            'Hot Chocolate': 'hotchoc.jpg',
            'Iced Americano': 'iced-americano.jpg',
            'Iced Cappuccino': 'iced-cappuccino.jpg',
            'Iced Caramel Macchiato': 'iced-macchiato.jpg',
            'Iced Espresso': 'iced-espresso.jpg',
            'Iced Flat White': 'iced-flatwhite.jpg',
            'Iced Latte': 'iced-latte.jpg',
            'Iced Mocha': 'iced-mocha.jpg',
            'Irish Coffee (non-alcoholic)': 'irishcoffee.jpg',
            'Vienna Iced Coffee': 'Vienna.jpg',
            
            # Tea Items
            'Ginger Tea': 'ginger-tea.jpg',
            'Iced Green Tea': 'green-iced-tea.jpg',
            'Lemon Iced Tea': 'lemon-iced-tea.jpg',
            'Masala Chai': 'chai.jpg',
            'Matcha Latte': 'matcha.jpg',
            'Milk Tea': 'tea-milk.jpg',
            'Peach Iced Tea': 'peach-iced-tea.jpg',
            'Plain Ceylon Tea': 'tea.jpg',
            
            # Frappés & Cold Beverages
            'Caramel Frappé': 'frappe-caramel.jpg',
            'Coffee Frappé': 'frappe.jpg',
            'Cookies & Cream Frappe': 'frappe-cookies.jpg',
            'Hazelnut Iced Latte': 'hazelnut.jpg',
            'Mocha Frappé': 'frappe-mocha.jpg',
            'Vanilla Iced Latte': 'vanilla.jpg',
            'Vanilla Sweet Cream Cold Brew': 'cold-brew-vanilla.jpg',
            
            # Smoothies & Shakes
            'Avocado Smoothie': 'avacado.jpg',
            'Banana Milkshake': 'banana-milkshake.jpg',
            'Oreo Shake': 'oreo-shake.jpg',
            'Strawberry Milkshake': 'strawberry-milkshake.jpg',
            
            # Juices & Coolers
            'Faluda': 'faluda.jpg',
            'King Coconut Water': 'kingcoconut.jpg',
            'Mango Juice (Seasonal)': 'mango-juice.jpg',
            'Mint Lime Cooler': 'mint-lime.jpg',
            'Papaya Juice': 'papaya.jpg',
            'Passion Fruit Juice': 'passion-fruit.jpg',
            'Watermelon Juice': 'watermelon.jpg',
            
            # Bakery & Cakes
            'Butter Cake (Slice)': 'butter-cake-slice.jpg',
            'Cheesecake (Slice)': 'cheesecake-slice.jpg',
            'Chocolate Biscuit Pudding': 'cbp.jpg',
            'Chocolate Cake (Slice)': 'choc-cake-slice.jpg',
            'Fudgy Brownie': 'brownie.jpg',
            'Red Velvet (Slice)': 'red-velvet-slice.jpg',
            'Ribbon Cake (Slice)': 'ribbon-cake-slice.jpg',
            'Watalappan': 'watalappan.jpg',
            
            # Cookies
            'Cashew Cookie': 'cashew-cookie.jpg',
            'Chocolate Chip Cookie': 'choco-chip-cookie.jpg',  # Fixed duplicate filename
            'Coconut Macaroon': 'coconut-macaroon.jpg',
            'Double Chocolate Cookie': 'double-choc-cookie.jpg',
            'Peanut Butter Cookie': 'peanut-butter-cookie.jpg',
            'Pistacio Cookie': 'pistacio-cookie.jpg',
            'Red velvet Cookie': 'red-velvet-cookie.jpg',
            'Shortbread': 'shortbread.jpg',
            
            # Savory Items
            'Cheese & Ham Toastie': 'cheese-ham-toastie.jpg',
            'Chicken Cutlet': 'chicken-cutlet.jpg',
            'Chicken Roll': 'chicken-roll.jpg',
            'Chicken Wrap': 'wrap.jpg',
            'Egg Roll': 'egg-roll.jpg',
            'Fish Bun': 'chicken-burger.jpg',  # Fixed filename
            'Fish Cutlet': 'fish-cutlet.jpg',
            'Sausage Bun': 'sausage-bun.jpg',
            'Vegetable Samosa': 'samosa.jpg',
            
            # Pastries
            'croissant': 'croissant.jpg',
        }
        
        updated_count = 0
        not_found_count = 0
        image_not_found_count = 0
        
        for item_name, image_filename in image_mapping.items():
            try:
                item = MenuItem.objects.get(name__iexact=item_name)
                image_path = os.path.join(image_dir, image_filename)
                
                if os.path.exists(image_path):
                    with open(image_path, 'rb') as f:
                        item.image.save(image_filename, File(f))
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Added image to {item.name}')
                    )
                    updated_count += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f'❌ Image not found: {image_path}')
                    )
                    image_not_found_count += 1
                    
            except MenuItem.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'❌ Menu item not found: {item_name}')
                )
                not_found_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error updating {item_name}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n🎉 Completed! Updated {updated_count} items, {not_found_count} items not found, {image_not_found_count} images missing'
            )
        )