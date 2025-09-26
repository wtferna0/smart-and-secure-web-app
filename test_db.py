# test_db.py
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        print(f"✅ Database connection successful: {result}")
        
    # Test if tables are created
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print(f"✅ Found {len(tables)} tables in database")
    
except Exception as e:
    print(f"❌ Database connection failed: {e}")
