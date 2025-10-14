from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class PromoCode(models.Model):
    class Type(models.TextChoices):
        PERCENT = "PERCENT"
        AMOUNT = "AMOUNT"

    code = models.CharField(max_length=40, unique=True)
    discount_type = models.CharField(max_length=10, choices=Type.choices, default=Type.AMOUNT)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_order_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    active = models.BooleanField(default=True) 
    max_redemptions = models.IntegerField(null=True, blank=True)
    current_redemptions = models.IntegerField(default=0) 
    end_date = models.DateField(null=True, blank=True) 
    start_date = models.DateField(null=True, blank=True) 
    is_puzzle_reward = models.BooleanField(default=False)
    puzzle_points_required = models.IntegerField(default=0)

    def __str__(self):
        return self.code

    @property
    def is_valid(self):
        """Check if promo code is currently valid"""
        now = timezone.now().date()
        
        if not self.active:
            return False
        
        if self.start_date and now < self.start_date:
            return False
        
        if self.end_date and now > self.end_date:
            return False
        
        if self.max_redemptions and self.current_redemptions >= self.max_redemptions:
            return False
        
        return True

    @property
    def type(self):
        return self.discount_type

    @property
    def value(self):
        return self.amount

    @property
    def max_uses(self):
        return self.max_redemptions

    @property
    def expires_at(self):
        return self.end_date

    @property
    def is_active(self):
        return self.active

class UserPromo(models.Model):
    promo = models.ForeignKey(PromoCode, on_delete=models.PROTECT)
    order = models.ForeignKey("orders.Order", on_delete=models.RESTRICT, null=True, blank=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.RESTRICT)
    email = models.EmailField(blank=True, null=True)
    redeemed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_puzzle_reward = models.BooleanField(default=False)
    puzzle_session_id = models.IntegerField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["user", "promo"])]

    def __str__(self):
        return f"{self.promo.code} -> {self.user.username if self.user else self.email}"

class PointsTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('earned', 'Earned'),
        ('redeemed', 'Redeemed'),
        ('adjusted', 'Adjusted'),
        ('expired', 'Expired'),
    ]
    
    SOURCE_TYPES = [
        ('purchase', 'Purchase'),
        ('puzzle', 'Puzzle Reward'),
        ('referral', 'Referral'),
        ('bonus', 'Bonus'),
        ('redemption', 'Redemption'),
        ('adjustment', 'Manual Adjustment'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    points = models.IntegerField()
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    source = models.CharField(max_length=20, choices=SOURCE_TYPES)
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)
    balance_after = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        sign = '+' if self.points > 0 else ''
        return f"{self.user.email}: {sign}{self.points} points ({self.transaction_type})"