"""
CARE Superset Configuration Template

This file contains all CARE-specific customizations for Apache Superset.
It consolidates branding, theming, feature flags, security settings, and
operational configurations.

Usage:
  1. Copy this file to /app/pythonpath/superset_config.py in your deployment
  2. Set environment variables for sensitive values (passwords, keys)
  3. Adjust settings as needed for your environment

For more details, see: care-customisations/CARE_CUSTOMIZATION.md
"""

import os
from celery.schedules import crontab

# ==============================================================================
# DEPLOYMENT CONFIGURATION
# ==============================================================================

# Context path for deploying at non-root URL (e.g., /superset)
# Set to "/superset" if deploying at domain.com/superset
# Set to "" if deploying at root domain.com/
APPLICATION_ROOT = os.getenv("APPLICATION_ROOT", "/superset")
STATIC_ASSETS_PREFIX = os.getenv("STATIC_ASSETS_PREFIX", "/superset")

# Enable proxy fix for reverse proxy headers (Traefik, nginx)
# Required when Superset is behind a reverse proxy
ENABLE_PROXY_FIX = True
PROXY_FIX_CONFIG = {
    "x_for": 1,  # X-Forwarded-For
    "x_proto": 1,  # X-Forwarded-Proto (http/https)
    "x_host": 1,  # X-Forwarded-Host
    "x_port": 1,  # X-Forwarded-Port
    "x_prefix": 1,  # X-Forwarded-Prefix
}

# ==============================================================================
# BRANDING & APPEARANCE
# ==============================================================================

# Application name shown in UI
APP_NAME = "CARE Analytics"

# Application icon/logo (path relative to /app/superset/static/)
# Logo should be ~126px width, transparent background recommended
APP_ICON = "/app/superset/static/assets/images/care_logo.png"

# Tooltip text when hovering over logo
LOGO_TOOLTIP = "CARE HMIS"

# Favicon configurations (multiple sizes)
FAVICONS = [
    {"href": "/app/superset/static/assets/images/favicon.png"},
]

# ==============================================================================
# THEME CUSTOMIZATION
# ==============================================================================

# CARE color palette - teal-based design system
CARE_COLORS = {
    "primary": {
        "base": "#006064",  # Teal 900
        "dark1": "#004d40",  # Teal 1000
        "dark2": "#00363a",
        "light1": "#00838f",  # Teal 700
        "light2": "#00acc1",  # Cyan 600
        "light3": "#4dd0e1",  # Cyan 300
        "light4": "#b2ebf2",  # Cyan 100
        "light5": "#e0f7fa",  # Cyan 50
    },
    "secondary": {
        "base": "#00ACC1",  # Cyan 600
        "dark1": "#00838f",
        "dark2": "#006064",
        "dark3": "#004d40",
        "light1": "#26c6da",
        "light2": "#4dd0e1",
        "light3": "#80deea",
    },
    "grayscale": {
        "base": "#666666",
        "dark1": "#323232",
        "dark2": "#000000",
        "light1": "#B2B2B2",
        "light2": "#E0E0E0",
        "light3": "#F7F7F7",
        "light4": "#FFFFFF",
    },
    "error": {
        "base": "#E53935",  # Red 600
        "dark1": "#C62828",
        "dark2": "#B71C1C",
        "light1": "#EF5350",
        "light2": "#E57373",
    },
    "warning": {
        "base": "#FB8C00",  # Orange 600
        "dark1": "#F57C00",
        "light1": "#FF9800",
        "light2": "#FFB74D",
    },
    "alert": {
        "base": "#FFC107",  # Amber 500
        "dark1": "#FFA000",
        "light1": "#FFD54F",
        "light2": "#FFECB3",
    },
    "success": {
        "base": "#43A047",  # Green 600
        "dark1": "#388E3C",
        "light1": "#66BB6A",
        "light2": "#A5D6A7",
    },
    "info": {
        "base": "#0288D1",  # Light Blue 700
        "dark1": "#0277BD",
        "light1": "#03A9F4",
        "light2": "#4FC3F7",
    },
}

# Theme overrides - customize Superset's appearance
# This uses Superset's theming system to apply CARE colors
THEME_OVERRIDES = {
    "borderRadius": 4,
    "colors": {
        "primary": CARE_COLORS["primary"],
        "secondary": CARE_COLORS["secondary"],
        "grayscale": CARE_COLORS["grayscale"],
        "error": CARE_COLORS["error"],
        "warning": CARE_COLORS["warning"],
        "alert": CARE_COLORS["alert"],
        "success": CARE_COLORS["success"],
        "info": CARE_COLORS["info"],
    },
    "typography": {
        "families": {
            "sansSerif": "'Inter', 'Helvetica Neue', Arial, sans-serif",
            "serif": "'Georgia', 'Times New Roman', Times, serif",
            "monospace": "'Fira Code', 'Courier New', monospace",
        },
        "weights": {
            "light": 300,
            "normal": 400,
            "medium": 500,
            "bold": 600,
        },
    },
}

# ==============================================================================
# CUSTOM COLOR SCHEMES
# ==============================================================================

# Custom categorical color palette for charts
# These colors are used for different categories in visualizations
CARE_CATEGORICAL_PALETTE = [
    "#006064",  # Teal 900
    "#00ACC1",  # Cyan 600
    "#43A047",  # Green 600
    "#FB8C00",  # Orange 600
    "#0288D1",  # Light Blue 700
    "#8E24AA",  # Purple 600
    "#E53935",  # Red 600
    "#FDD835",  # Yellow 600
    "#5E35B1",  # Deep Purple 600
    "#D81B60",  # Pink 600
]

# Sequential color palette for heatmaps and gradients
CARE_SEQUENTIAL_PALETTE = [
    "#E0F7FA",  # Cyan 50
    "#B2EBF2",  # Cyan 100
    "#80DEEA",  # Cyan 200
    "#4DD0E1",  # Cyan 300
    "#26C6DA",  # Cyan 400
    "#00BCD4",  # Cyan 500
    "#00ACC1",  # Cyan 600
    "#0097A7",  # Cyan 700
    "#00838F",  # Cyan 800
    "#006064",  # Cyan 900
]

# Register custom color schemes
EXTRA_CATEGORICAL_COLOR_SCHEMES = [
    {
        "id": "care_colors",
        "label": "CARE Colors",
        "colors": CARE_CATEGORICAL_PALETTE,
    }
]

EXTRA_SEQUENTIAL_COLOR_SCHEMES = [
    {
        "id": "care_sequential",
        "label": "CARE Sequential (Teal)",
        "colors": CARE_SEQUENTIAL_PALETTE,
        "isDiverging": False,
    }
]

# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================

# Metadata database for Superset itself
# This stores dashboards, charts, users, permissions, etc.
# Format: postgresql+psycopg2://USER:PASSWORD@HOST:PORT/DATABASE
SQLALCHEMY_DATABASE_URI = os.getenv(
    "SQLALCHEMY_DATABASE_URI",
    "postgresql+psycopg2://superset:CHANGE_PASSWORD@postgres-care-rw.care.svc.cluster.local:5432/superset",
)

# Connection pool configuration for metadata database
SQLALCHEMY_ENGINE_OPTIONS = {
    "pool_size": 10,
    "pool_recycle": 3600,
    "pool_pre_ping": True,
    "max_overflow": 20,
    "echo": False,
}

# Disable modification tracking to reduce memory usage
SQLALCHEMY_TRACK_MODIFICATIONS = False

# ==============================================================================
# CACHE CONFIGURATION
# ==============================================================================

# Redis cache configuration
# Used for caching query results, dashboard data, and thumbnails
REDIS_HOST = os.getenv("REDIS_HOST", "redis.care.svc.cluster.local")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)  # None if no auth
REDIS_CELERY_DB = int(os.getenv("REDIS_CELERY_DB", "0"))
REDIS_RESULTS_DB = int(os.getenv("REDIS_RESULTS_DB", "1"))

# Build Redis URL with optional password
if REDIS_PASSWORD:
    REDIS_BASE_URL = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}"
else:
    REDIS_BASE_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}"

# Cache configuration for general caching
CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 300,  # 5 minutes default
    "CACHE_KEY_PREFIX": "superset_cache_",
    "CACHE_REDIS_URL": f"{REDIS_BASE_URL}/{REDIS_RESULTS_DB}",
}

# Cache specifically for query results
DATA_CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 86400,  # 24 hours for query results
    "CACHE_KEY_PREFIX": "superset_data_",
    "CACHE_REDIS_URL": f"{REDIS_BASE_URL}/{REDIS_RESULTS_DB}",
}

# Cache for dashboard thumbnails
THUMBNAIL_CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 86400 * 7,  # 7 days for thumbnails
    "CACHE_KEY_PREFIX": "superset_thumbnail_",
    "CACHE_REDIS_URL": f"{REDIS_BASE_URL}/{REDIS_RESULTS_DB}",
}

# Filter state cache TTL (dashboard filters)
FILTER_STATE_CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 86400,  # 24 hours
    "CACHE_KEY_PREFIX": "superset_filter_",
    "CACHE_REDIS_URL": f"{REDIS_BASE_URL}/{REDIS_RESULTS_DB}",
}

# Explore form data cache (chart builder state)
EXPLORE_FORM_DATA_CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 86400,  # 24 hours
    "CACHE_KEY_PREFIX": "superset_explore_",
    "CACHE_REDIS_URL": f"{REDIS_BASE_URL}/{REDIS_RESULTS_DB}",
}

# ==============================================================================
# CELERY CONFIGURATION (Async Queries & Scheduled Reports)
# ==============================================================================


class CeleryConfig:
    """Celery configuration for async query execution and scheduled tasks"""

    broker_url = f"{REDIS_BASE_URL}/{REDIS_CELERY_DB}"
    result_backend = f"{REDIS_BASE_URL}/{REDIS_RESULTS_DB}"

    # Task execution settings
    imports = (
        "superset.sql_lab",  # SQL Lab async queries
        "superset.tasks.scheduler",  # Scheduled reports
        "superset.tasks.thumbnails",  # Dashboard thumbnails
        "superset.tasks.cache",  # Cache warmup tasks
    )

    # Worker settings
    worker_prefetch_multiplier = 1  # Don't prefetch tasks
    task_acks_late = False  # Acknowledge before execution
    worker_max_tasks_per_child = 128  # Restart worker after N tasks

    # Result backend settings
    result_expires = 86400  # Results expire after 24 hours
    task_track_started = True
    task_time_limit = 1800  # 30 minutes max per task
    task_soft_time_limit = 1500  # Soft limit at 25 minutes

    # Scheduled tasks (beat schedule)
    beat_schedule = {
        # Run scheduled reports/alerts every minute
        "reports.scheduler": {
            "task": "reports.scheduler",
            "schedule": crontab(minute="*", hour="*"),
        },
        # Prune old report logs daily at 00:10
        "reports.prune_log": {
            "task": "reports.prune_log",
            "schedule": crontab(minute=10, hour=0),
        },
        # Warm up dashboard cache every 6 hours
        # Uncomment to enable:
        # "cache-warmup-hourly": {
        #     "task": "cache-warmup",
        #     "schedule": crontab(minute=0, hour="*/6"),
        #     "kwargs": {"strategy_name": "top_n_dashboards", "top_n": 10},
        # },
    }


CELERY_CONFIG = CeleryConfig

# ==============================================================================
# FEATURE FLAGS
# ==============================================================================

FEATURE_FLAGS = {
    # Alerts and scheduled reports
    "ALERT_REPORTS": True,
    # Dashboard-level role-based access control
    "DASHBOARD_RBAC": True,
    # Cross-filtering between charts
    "DASHBOARD_CROSS_FILTERS": True,
    # Drill to detail (click chart to see underlying data)
    "DRILL_TO_DETAIL": True,
    # Drill by dimension (explore different groupings)
    "DRILL_BY": True,
    # Jinja templating in SQL Lab
    "ENABLE_TEMPLATE_PROCESSING": True,
    # Dashboard native filters (new filter experience)
    "DASHBOARD_NATIVE_FILTERS": True,
    # Horizontal filtering (filters in a horizontal bar)
    "HORIZONTAL_FILTER_BAR": True,
    # Global async queries (run queries in background)
    "GLOBAL_ASYNC_QUERIES": True,
    # Embedded dashboards (iframe support)
    "EMBEDDED_SUPERSET": True,
    # Dashboard caching
    "DASHBOARD_CACHE": True,
    # Remove unwanted features
    "ENABLE_TEMPLATE_REMOVE_FILTERS": False,
    # Scheduled queries (SQL Lab scheduled runs)
    "SCHEDULED_QUERIES": True,
    # SSH tunneling for database connections
    "SSH_TUNNELING": False,  # Enable if needed
    # Dynamic viz plugins (custom visualizations)
    "DYNAMIC_PLUGINS": True,
}

# ==============================================================================
# WEBDRIVER CONFIGURATION (For Reports & Thumbnails)
# ==============================================================================

# WebDriver is used to capture dashboard screenshots for:
# - Email reports with embedded images
# - Dashboard thumbnails
# - Alerts with visual snapshots

# Internal URL used by Selenium to access dashboards
# This should be the cluster-internal service URL
WEBDRIVER_BASEURL = os.getenv(
    "WEBDRIVER_BASEURL",
    "http://superset.care.svc.cluster.local:8080/superset/",
)

# User-friendly URL shown in email reports
# This should be the public-facing URL
WEBDRIVER_BASEURL_USER_FRIENDLY = os.getenv(
    "WEBDRIVER_BASEURL_USER_FRIENDLY",
    "https://care-k3s.digit.org/superset/",
)

# WebDriver type (firefox or chrome)
# Default: firefox (included in apache/superset image)
WEBDRIVER_TYPE = "firefox"

# WebDriver options
WEBDRIVER_OPTION_ARGS = [
    "--headless",  # Run in headless mode
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
]

# Screenshot dimensions for reports
WEBDRIVER_WINDOW = {"dashboard": (1600, 2000), "slice": (3000, 1200)}

# ==============================================================================
# SECURITY CONFIGURATION
# ==============================================================================

# Secret key for session signing
# CRITICAL: Generate with `openssl rand -base64 42` and store securely
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE-ME-IN-PRODUCTION-USE-OPENSSL-RAND")

# Session cookie configuration
SESSION_COOKIE_PATH = APPLICATION_ROOT or "/"
SESSION_COOKIE_SAMESITE = "Lax"  # CSRF protection
SESSION_COOKIE_SECURE = True  # Requires HTTPS
SESSION_COOKIE_HTTPONLY = True  # Prevent XSS

# WTF CSRF protection
WTF_CSRF_ENABLED = True
WTF_CSRF_TIME_LIMIT = None  # No time limit

# Public role - what unauthenticated users can see
# Options: None, "Public", "Gamma", "Alpha"
PUBLIC_ROLE_LIKE = None  # Require login

# ==============================================================================
# CORS CONFIGURATION (For Embedded Dashboards)
# ==============================================================================

# Enable CORS for embedding dashboards in other applications
ENABLE_CORS = True

# CORS options
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": ["*"],
    "origins": [
        "https://care-k3s.digit.org",  # Main CARE frontend
        "https://care-fe.digit.org",  # Alternative frontend domain
        # Add other allowed origins here
    ],
}

# ==============================================================================
# EMAIL CONFIGURATION (For Reports & Alerts)
# ==============================================================================

# SMTP settings for sending email reports
# Uncomment and configure to enable email functionality

# SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
# SMTP_STARTTLS = True
# SMTP_SSL = False
# SMTP_USER = os.getenv("SMTP_USER", "your-email@gmail.com")
# SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # Store in secret!
# SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
# SMTP_MAIL_FROM = os.getenv("SMTP_MAIL_FROM", "superset@care-hmis.org")

# Email report settings
# EMAIL_REPORTS_SUBJECT_PREFIX = "[CARE Analytics] "
# EMAIL_REPORT_BCC_ADDRESS = None  # BCC address for all reports

# ==============================================================================
# ROW-LEVEL SECURITY (RLS)
# ==============================================================================

# RLS is configured in the Superset UI, not in config file
# However, here are common patterns for CARE HMIS:

# Facility-based access (most common):
# -----------------------------------
# WHERE facility_id = '{{ current_user.facility_id }}'

# District-based access:
# ---------------------
# WHERE district_id = '{{ current_user.district_id }}'

# State-based access:
# ------------------
# WHERE state_id = '{{ current_user.state_id }}'

# Multi-level access (facility OR district):
# ------------------------------------------
# WHERE facility_id = '{{ current_user.facility_id }}'
#    OR district_id = '{{ current_user.district_id }}'

# Date-based access (last 90 days only):
# --------------------------------------
# WHERE created_date >= CURRENT_DATE - INTERVAL '90 days'

# Role-based data filtering:
# --------------------------
# WHERE CASE
#   WHEN '{{ current_user.role }}' = 'facility_admin'
#     THEN facility_id = '{{ current_user.facility_id }}'
#   WHEN '{{ current_user.role }}' = 'district_admin'
#     THEN district_id = '{{ current_user.district_id }}'
#   ELSE TRUE  -- State admins see all
# END

# ==============================================================================
# SQL LAB CONFIGURATION
# ==============================================================================

# SQL Lab allows users to run ad-hoc queries
SQLLAB_ASYNC_TIME_LIMIT_SEC = 3600  # 1 hour max for async queries
SQLLAB_TIMEOUT = 300  # 5 minutes for sync queries

# Save query results to database for later retrieval
SQLLAB_SAVE_WARNING_MESSAGE = "Query results are retained for 30 days"

# Query result limits
SQL_MAX_ROW = 100000  # Max rows to return
DISPLAY_MAX_ROW = 10000  # Max rows to display in UI

# ==============================================================================
# DASHBOARD CONFIGURATION
# ==============================================================================

# Dashboard filter box timeout
FILTER_SELECT_ROW_LIMIT = 10000

# Dashboard auto-refresh minimum interval (seconds)
DASHBOARD_AUTO_REFRESH_INTERVALS = [
    [0, "Don't refresh"],
    [10, "10 seconds"],
    [30, "30 seconds"],
    [60, "1 minute"],
    [300, "5 minutes"],
    [1800, "30 minutes"],
    [3600, "1 hour"],
]

# Default dashboard refresh interval (seconds)
DASHBOARD_AUTO_REFRESH_MODE = "fetch"

# ==============================================================================
# LOGGING CONFIGURATION
# ==============================================================================

# Log level for application logs
LOG_LEVEL = "INFO"

# Enable logging to stdout (required for Kubernetes)
ENABLE_PROXY_FIX = True

# Disable Flask-specific logging to reduce noise
SILENCE_FAB = True

# ==============================================================================
# AUTHENTICATION CONFIGURATION
# ==============================================================================

# Authentication type
# Options: AUTH_DB, AUTH_LDAP, AUTH_OAUTH, AUTH_REMOTE_USER, AUTH_OID
# Default: AUTH_DB (username/password stored in Superset DB)
from flask_appbuilder.security.manager import AUTH_DB

AUTH_TYPE = AUTH_DB

# Auto-create user on first login (for OAuth/LDAP)
AUTH_USER_REGISTRATION = True

# Default role for new users
AUTH_USER_REGISTRATION_ROLE = "Gamma"  # Read-only by default

# ==============================================================================
# LDAP AUTHENTICATION (Optional)
# ==============================================================================

# Uncomment and configure if using LDAP authentication
# from flask_appbuilder.security.manager import AUTH_LDAP
#
# AUTH_TYPE = AUTH_LDAP
# AUTH_LDAP_SERVER = "ldap://ldap.care-hmis.org"
# AUTH_LDAP_USE_TLS = True
# AUTH_LDAP_BIND_USER = "cn=admin,dc=care-hmis,dc=org"
# AUTH_LDAP_BIND_PASSWORD = os.getenv("LDAP_BIND_PASSWORD")
# AUTH_LDAP_SEARCH = "dc=care-hmis,dc=org"
# AUTH_LDAP_UID_FIELD = "uid"
# AUTH_LDAP_FIRSTNAME_FIELD = "givenName"
# AUTH_LDAP_LASTNAME_FIELD = "sn"
# AUTH_LDAP_EMAIL_FIELD = "mail"
#
# # Map LDAP groups to Superset roles
# AUTH_ROLES_MAPPING = {
#     "cn=superset_admins,ou=groups,dc=care-hmis,dc=org": ["Admin"],
#     "cn=superset_users,ou=groups,dc=care-hmis,dc=org": ["Gamma"],
# }

# ==============================================================================
# OAUTH AUTHENTICATION (Optional)
# ==============================================================================

# Uncomment and configure if using OAuth (Google, Okta, Azure AD, etc.)
# from flask_appbuilder.security.manager import AUTH_OAUTH
#
# AUTH_TYPE = AUTH_OAUTH
# OAUTH_PROVIDERS = [
#     {
#         "name": "google",
#         "icon": "fa-google",
#         "token_key": "access_token",
#         "remote_app": {
#             "client_id": os.getenv("GOOGLE_CLIENT_ID"),
#             "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
#             "api_base_url": "https://www.googleapis.com/oauth2/v2/",
#             "client_kwargs": {"scope": "email profile"},
#             "request_token_url": None,
#             "access_token_url": "https://accounts.google.com/o/oauth2/token",
#             "authorize_url": "https://accounts.google.com/o/oauth2/auth",
#         },
#     }
# ]

# ==============================================================================
# CUSTOM MIDDLEWARE (Optional)
# ==============================================================================

# Add custom middleware for request processing, logging, etc.
# ADDITIONAL_MIDDLEWARE = []

# ==============================================================================
# MAPBOX CONFIGURATION (For Geographic Visualizations)
# ==============================================================================

# Mapbox API token for map visualizations
# Get token from: https://account.mapbox.com/access-tokens/
# MAPBOX_API_KEY = os.getenv("MAPBOX_API_KEY", "")

# ==============================================================================
# SENTRY ERROR TRACKING (Optional)
# ==============================================================================

# Uncomment to enable Sentry error tracking
# import sentry_sdk
# from sentry_sdk.integrations.flask import FlaskIntegration
#
# SENTRY_DSN = os.getenv("SENTRY_DSN")
# if SENTRY_DSN:
#     sentry_sdk.init(
#         dsn=SENTRY_DSN,
#         integrations=[FlaskIntegration()],
#         environment=os.getenv("SUPERSET_ENV", "production"),
#         traces_sample_rate=0.1,  # 10% of transactions
#     )

# ==============================================================================
# CUSTOM SQL VALIDATORS (Optional)
# ==============================================================================

# Add custom SQL validators to prevent dangerous queries
# PRESTO_SPLIT_VIEWS_FROM_CATALOG = False

# ==============================================================================
# END OF CONFIGURATION
# ==============================================================================

# Validate required environment variables
_required_env_vars = ["SECRET_KEY", "SQLALCHEMY_DATABASE_URI"]
_missing_vars = [var for var in _required_env_vars if not os.getenv(var)]
if _missing_vars:
    raise ValueError(
        f"Missing required environment variables: {', '.join(_missing_vars)}"
    )

# Log configuration status
if os.getenv("SUPERSET_ENV") != "production":
    print("=" * 80)
    print("CARE Superset Configuration Loaded")
    print("=" * 80)
    print(f"Application Root: {APPLICATION_ROOT}")
    print(f"Redis Host: {REDIS_HOST}:{REDIS_PORT}")
    print(f"Feature Flags Enabled: {len([k for k, v in FEATURE_FLAGS.items() if v])}")
    print("=" * 80)
