from pathlib import Path
import os
from datetime import timedelta

# --- Paths -------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# --- .env --------------------------------------------------------------------
def env(key, default=None):
    return os.getenv(key, default)

try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / ".env")
except Exception:
    pass

# --- Core Django --------------------------------------------------------------
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-insecure")
DEBUG = os.getenv("DJANGO_DEBUG", "0").strip().lower() in ("1", "true", "yes", "on")
ALLOWED_HOSTS = [
    h.strip() for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,51.20.9.106,cafe-app.duckdns.org,172.31.34.189").split(",") if h.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "drf_spectacular",
    "django_filters",

    "accounts",
    "catalog.apps.CatalogConfig",
    "orders.apps.OrdersConfig",
    "payments",
    "loyalty",
    "crowd",
    "chatbot",
    "puzzle",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# --- Database ----------------------------------------------------------------
DB_ENGINE = os.getenv("DB_ENGINE", "mysql").lower()
if DB_ENGINE == "mysql":
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': 'cafedb',
            'USER': 'admin',
            'PASSWORD': '050812Km*',
            'HOST': 'cafedb.cxkqk02iupbr.eu-north-1.rds.amazonaws.com',
            'PORT': '3306',
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            }
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# --- i18n / tz ---------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Colombo"
USE_I18N = True
USE_TZ = True

# --- Static / Media ----------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- DRF / OpenAPI / Auth ----------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 100,
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_THROTTLE_RATES": {
        "crowdmeter_burst": "10/minute",
        "crowdmeter_sustained": "100/hour",
    }
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "QwikBrew API",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# --- CORS / CSRF -------------------------------------------------------------
_raw_cors = os.getenv("CORS_ALLOWED_ORIGINS", "")

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [o.strip() for o in _raw_cors.split(",") if o.strip()]
if DEBUG and not CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://cafe-app.duckdns.org",
        "https://cafe-app.duckdns.org",
    ]

CORS_ALLOW_CREDENTIALS = True

_raw_csrf = os.getenv("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _raw_csrf.split(",") if o.strip()]
if DEBUG and not CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://51.20.9.106:8000",
        "http://51.20.9.106:3000",
        "https://51.20.9.106:8000",
        "https://51.20.9.106:3000",
        "https://cafe-app.duckdns.org",
        "http://cafe-app.duckdns.org",
        "https://sandbox.payhere.lk",
        "https://www.sandbox.payhere.lk",
    ]

# --- Password validators (useful for admin/prod) -----------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- Security for production -------------------------------------------------
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# --- Logging (handy while developing) ---------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django.db.backends": {"handlers": ["console"], "level": "DEBUG" if DEBUG else "INFO"}
    },
}

# --- Crowd Meter Configuration -----------------------------------------------
CROWD_METER = {
    "MODE": "ml",
    "WINDOW_MINUTES": 30,
    "BIN_MINUTES": 15,
    "ACTIVE_STATUSES": ["PLACED", "ACCEPTED", "DONE"],
    "STATUS_WEIGHTS": {"PLACED": 1.0, "ACCEPTED": 0.8, "DONE": 0.4},
    "PEOPLE_PER_ORDER": 1.3,
    "CAPACITY": 50,
    "SMOOTHING_ALPHA": 0.35,
    "ORDER_MODEL": "orders.Order",
    "STATUS_FIELD": "status", 
    "CREATED_FIELD": "placed_at",
    "MODEL_PATH": str(BASE_DIR / "crowd" / "model_assets" / "crowd_model.pkl"),
    "TRAIN_LOOKBACK_DAYS": 14,
}

# --- PayHere Configuration ---------------------------------------------------
PAYHERE = {
    "MERCHANT_ID": "1232370",
    "MERCHANT_SECRET": "MjQ4OTgxOTI3MzEyMDk0Nzc0MDU1NTU0MzM2OTkzNDExNjkxODU2",
    "CHECKOUT_URL": "https://sandbox.payhere.lk/pay/checkout",
    "RETURN_URL": "https://cafe-app.duckdns.org/order-success",
    "CANCEL_URL": "https://cafe-app.duckdns.org/order-cancelled",
    "NOTIFY_URL": "https://cafe-app.duckdns.org/api/payments/payhere/ipn/",
}

DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'