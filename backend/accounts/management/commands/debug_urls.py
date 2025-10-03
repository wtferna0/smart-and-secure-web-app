# accounts/management/commands/debug_urls.py
from django.core.management.base import BaseCommand
from django.urls import reverse, resolve

class Command(BaseCommand):
    help = 'Debug URL configuration'

    def handle(self, *args, **options):
        self.stdout.write("🔍 Checking accounts URLs...")
        
        # Test specific URLs
        test_urls = [
            'admin-users-list',
            'admin-user-detail', 
            'admin-users-search',
        ]
        
        for url_name in test_urls:
            try:
                url = reverse(url_name)
                self.stdout.write(self.style.SUCCESS(f"✅ {url_name} -> {url}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ {url_name} -> {e}"))
        
        # Check if the path resolves
        test_paths = [
            '/api/auth/admin/users/',
            '/api/auth/admin/users/1/',
            '/api/auth/admin/users/search/?q=test',
        ]
        
        self.stdout.write("\n🔍 Testing path resolution...")
        for path in test_paths:
            try:
                match = resolve(path)
                self.stdout.write(self.style.SUCCESS(f"✅ {path} -> {match.func}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ {path} -> {e}"))