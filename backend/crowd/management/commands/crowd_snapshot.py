from django.core.management.base import BaseCommand
from crowd.services import store_snapshot

class Command(BaseCommand):
    help = "Capture and store a crowd snapshot (intended for 2–5 min schedule)."
    
    def handle(self, *args, **kwargs):
        data = store_snapshot()
        self.stdout.write(self.style.SUCCESS(f"Snapshot: {data}"))