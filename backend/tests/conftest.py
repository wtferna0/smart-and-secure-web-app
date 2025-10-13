import os
import pytest
from django.conf import settings
from rest_framework.test import APIClient
from model_bakery import baker

@pytest.fixture(autouse=True, scope="session")
def _test_env():
    os.environ.setdefault("ENV", "test")

@pytest.fixture(autouse=True)
def _override_settings(settings):
    # Fast, isolated DB + fake secrets
    settings.DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
    settings.SECRET_KEY = "test-secret"
    settings.PAYHERE = {
        "MERCHANT_ID": "T123",
        "MERCHANT_SECRET": "TESTSECRET",
        "CHECKOUT_URL": "https://sandbox.payhere.lk/pay/checkout",
        "RETURN_URL": "http://testserver/return",
        "CANCEL_URL": "http://testserver/cancel",
        "NOTIFY_URL": "http://testserver/api/payments/payhere/ipn/",
    }

@pytest.fixture
def api():
    return APIClient()

@pytest.fixture
def admin_user(db):
    return baker.make("auth.User", is_staff=True, is_superuser=True)

@pytest.fixture
def staff_user(db):
    return baker.make("auth.User", is_staff=True)

@pytest.fixture
def normal_user(db):
    return baker.make("auth.User")

@pytest.fixture
def category(db):
    return baker.make("catalog.MenuCategory", name="Coffee")

@pytest.fixture
def menu_item(db, category):
    return baker.make("catalog.MenuItem", category=category, name="Latte", price="1200.00")
