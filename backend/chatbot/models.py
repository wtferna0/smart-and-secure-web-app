from django.db import models

class ChatCustomer(models.Model):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=120, blank=True, default="")
    loyalty_points = models.PositiveIntegerField(default=0)
    def __str__(self): return self.email

class ChatMenuItem(models.Model):
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=80)
    price = models.DecimalField(max_digits=7, decimal_places=2)
    is_available = models.BooleanField(default=True)
    def __str__(self): return f"{self.name} ({self.category})"

class ChatOrder(models.Model):
    customer = models.ForeignKey(ChatCustomer, on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=32, default="PLACED")
    created_at = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=9, decimal_places=2, default=0)
    def __str__(self): return f"Order #{self.id} - {self.status}"
