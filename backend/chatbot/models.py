from django.db import models

class ChatCustomer(models.Model):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=120, blank=True)
    loyalty_points = models.PositiveIntegerField(default=0)
    def __str__(self): return self.email

class ChatMenuItem(models.Model):
    CATEGORY_CHOICES = [("Coffee","Coffee"),("Tea","Tea"),("Pastry","Pastry"),("Sandwich","Sandwich")]
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    image_url = models.URLField(blank=True)
    def __str__(self): return self.name

class ChatOrder(models.Model):
    STATUS_CHOICES = [("placed","Placed"),("preparing","Preparing"),("ready","Ready"),("completed","Completed")]
    customer = models.ForeignKey(ChatCustomer, on_delete=models.SET_NULL, null=True, blank=True)
    items = models.ManyToManyField(ChatMenuItem, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="placed")
    total_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"Order {self.id}"
