# debug_images.py
import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalog.models import MenuItem

def check_current_images():
    print("=== CURRENT MENU ITEMS AND IMAGES ===")
    items = MenuItem.objects.all()[:5]  # Check first 5 items
    for item in items:
        print(f"ID: {item.id}, Name: {item.name}")
        print(f"  Has image: {bool(item.image)}")
        print(f"  Image field: {item.image}")
        print(f"  Image name: {item.image.name if item.image else 'None'}")
        print(f"  Image URL: {item.image.url if item.image else 'None'}")
        print("---")

def test_api_endpoint():
    print("\n=== TESTING API ENDPOINT ===")
    try:
        # Test the API endpoint
        response = requests.get('https://cafe-app.duckdns.org/api/catalog/items/')
        if response.status_code == 200:
            data = response.json()
            print(f"API returned {len(data)} items")
            # Fix: Don't use slice on dict, check if it's a list first
            if isinstance(data, list):
                for i, item in enumerate(data[:3]):  # Only show first 3
                    print(f"API Item {i+1}: {item.get('name', 'No name')}")
                    print(f"  Image URL from API: {item.get('image_url', 'No image_url')}")
                    print(f"  Raw image field: {item.get('image', 'No image field')}")
            else:
                print(f"API returned: {type(data)} - {data}")
        else:
            print(f"API Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"API Test Error: {e}")

def test_single_item():
    print("\n=== TESTING SINGLE ITEM API ===")
    try:
        # Test a specific item that we know has an image
        response = requests.get('https://cafe-app.duckdns.org/api/catalog/items/1/')
        if response.status_code == 200:
            item = response.json()
            print(f"Single Item: {item.get('name')}")
            print(f"  Image URL: {item.get('image_url')}")
            print(f"  All fields: {json.dumps(item, indent=2)}")
        else:
            print(f"Single Item Error: {response.status_code}")
    except Exception as e:
        print(f"Single Item Test Error: {e}")

if __name__ == "__main__":
    check_current_images()
    test_api_endpoint()
    test_single_item()