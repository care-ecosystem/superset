# CARE HMIS Superset Customization
# This file extends the base superset_config.py with CARE-specific branding and features

import os
from celery.schedules import crontab

# =====================
# CARE Branding
# =====================

APP_NAME = "CARE Analytics"
APP_ICON = "/app/superset/static/assets/images/care_logo.png"
APP_ICON_WIDTH = 126
FAVICONS = [{"href": "/app/superset/static/assets/images/favicon.png"}]

# Logo behavior
LOGO_TARGET_PATH = "/"
LOGO_TOOLTIP = "CARE HMIS"
LOGO_RIGHT_TEXT = "eGov Foundation"

# =====================
# CARE Theme Colors
# =====================

THEME_OVERRIDES = {
    "colors": {
        "primary": {
            "base": "#006064",      # CARE Teal
            "dark1": "#004D40",
            "dark2": "#00251A",
            "light1": "#00838F",
            "light2": "#4FB3BF",
            "light3": "#B2EBF2",
            "light4": "#E0F7FA",
            "light5": "#F1FBFD",
        },
        "secondary": {
            "base": "#00ACC1",      # CARE Cyan
        },
        "error": {"base": "#E53935"},
        "warning": {"base": "#FB8C00"},
        "success": {"base": "#43A047"},
        "info": {"base": "#039BE5"},
    },
    "typography": {
        "families": {
            "sansSerif": "Inter, Roboto, 'Helvetica Neue', Arial, sans-serif",
            "serif": "Georgia, 'Times New Roman', Times, serif",
            "monospace": "'Courier New', Courier, monospace",
        },
        "sizes": {
            "s": 12,
            "m": 14,
            "l": 16,
            "xl": 21,
            "xxl": 28,
        },
    },
    "gridUnit": 4,
    "borderRadius": 4,
}

# =====================
# Custom Color Schemes
# =====================

EXTRA_CATEGORICAL_COLOR_SCHEMES = [
    {
        "id": "care_colors",
        "description": "CARE HMIS color palette",
        "label": "CARE Colors",
        "colors": [
            "#006064",  # Teal
            "#00838F",  # Light Teal
            "#4FB3BF",  # Lighter Teal
            "#43A047",  # Green
            "#FB8C00",  # Orange
            "#E53935",  # Red
            "#5E35B1",  # Purple
            "#00897B",  # Teal Green
            "#039BE5",  # Blue
            "#F4511E",  # Deep Orange
        ]
    },
    {
        "id": "care_sequential",
        "description": "CARE sequential color palette",
        "label": "CARE Sequential",
        "colors": [
            "#E0F7FA",
            "#B2EBF2",
            "#80DEEA",
            "#4DD0E1",
            "#26C6DA",
            "#00BCD4",
            "#00ACC1",
            "#0097A7",
            "#00838F",
            "#006064",
        ]
    },
]

# =====================
# Feature Flags
# =====================

FEATURE_FLAGS = {
    # Core features
    "ALERT_REPORTS": True,
    "DASHBOARD_RBAC": True,
    "DASHBOARD_CROSS_FILTERS": True,
    "DRILL_TO_DETAIL": True,
    "DRILL_BY": True,

    # SQL Lab
    "ENABLE_TEMPLATE_PROCESSING": True,
    "SQLLAB_BACKEND_PERSISTENCE": True,

    # Embedding
    "EMBEDDED_SUPERSET": True,
    "DASHBOARD_NATIVE_FILTERS": True,

    # UI Enhancements
    "TAGGING_SYSTEM": True,
    "DASHBOARD_FILTERS_EXPERIMENTAL": True,

    # Advanced features
    "THUMBNAILS": True,
    "THUMBNAILS_SQLA_LISTENERS": True,
}

# =====================
# Guest Token for Embedding
# =====================

GUEST_ROLE_NAME = "Public"
GUEST_TOKEN_JWT_SECRET = os.getenv("GUEST_TOKEN_JWT_SECRET", "CHANGE-ME-IN-PRODUCTION")
GUEST_TOKEN_JWT_ALGO = "HS256"
GUEST_TOKEN_JWT_EXP_SECONDS = 300

# =====================
# Email Configuration (Optional)
# =====================

# Uncomment and configure if you want to enable email reports
# SMTP_HOST = "smtp.gmail.com"
# SMTP_STARTTLS = True
# SMTP_SSL = False
# SMTP_USER = "your-email@gmail.com"
# SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")
# SMTP_PORT = 587
# SMTP_MAIL_FROM = "superset@care-k3s.digit.org"

# EMAIL_NOTIFICATIONS = True
# EMAIL_REPORTS_SUBJECT_PREFIX = "[CARE Analytics] "

# =====================
# SQL Lab Configuration
# =====================

# SQL Lab query timeout
SQLLAB_TIMEOUT = 300  # 5 minutes

# Enable SQL Lab query cost estimation
ESTIMATE_QUERY_COST = False

# SQL Lab result display limit
SQL_MAX_ROW = 10000

# =====================
# Dashboard Configuration
# =====================

# Dashboard auto-refresh intervals (in seconds)
SUPERSET_DASHBOARD_POSITION_DATA_LIMIT = 65535

# Filter box timeout
FILTER_SELECT_ROW_LIMIT = 10000

# =====================
# Row Level Security
# =====================

# RLS is configured through the UI
# Example RLS rules for CARE:
# - Facility-based access: facility_id = '{{ current_user.facility_id }}'
# - District-based access: district_id = '{{ current_user.district_id }}'
# - State-based access: state_id = '{{ current_user.state_id }}'

# =====================
# Custom CSS (Optional)
# =====================

# You can add custom CSS by creating a CSS file and referencing it here
# CUSTOM_CSS = """
# .navbar-brand {
#     font-size: 1.2em;
#     font-weight: 600;
# }
#
# .header-with-actions {
#     background: linear-gradient(135deg, #006064 0%, #00838F 100%);
# }
# """

# =====================
# Database Drivers
# =====================

# Additional database drivers are specified in requirements-local.txt
# Supported databases for CARE:
# - PostgreSQL (default)
# - MySQL/MariaDB
# - BigQuery
# - Snowflake
# - Redshift

# =====================
# Cache and Performance
# =====================

# Results backend cache timeout (in seconds)
CACHE_DEFAULT_TIMEOUT = 86400  # 24 hours

# Thumbnail cache timeout
THUMBNAIL_CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 86400 * 7,  # 7 days
}

# =====================
# Security Settings
# =====================

# Session configuration
PERMANENT_SESSION_LIFETIME = 86400  # 24 hours

# CSRF configuration
WTF_CSRF_ENABLED = True
WTF_CSRF_TIME_LIMIT = None  # No timeout

# Content Security Policy
TALISMAN_ENABLED = False  # Disabled by default in v4.0+
# If enabling Talisman, configure CSP headers here

# =====================
# Logging Configuration
# =====================

# Log level
LOG_LEVEL = "INFO"

# Log format
LOG_FORMAT = "%(asctime)s:%(levelname)s:%(name)s:%(message)s"

# =====================
# Internationalization
# =====================

# Default language
BABEL_DEFAULT_LOCALE = "en"

# Available languages
LANGUAGES = {
    "en": {"flag": "us", "name": "English"},
    "hi": {"flag": "in", "name": "Hindi"},
    # Add more languages as needed
}

# =====================
# WebDriver Configuration
# =====================

# For generating thumbnails and reports
WEBDRIVER_BASEURL = os.getenv("WEBDRIVER_BASEURL", "http://superset.care.svc.cluster.local:8080/superset/")
WEBDRIVER_BASEURL_USER_FRIENDLY = os.getenv("WEBDRIVER_BASEURL_USER_FRIENDLY", "https://care-k3s.digit.org/superset/")

# WebDriver type (default is chrome)
WEBDRIVER_TYPE = "chrome"

# Screenshot configuration
SCREENSHOT_LOCATE_WAIT = 10
SCREENSHOT_LOAD_WAIT = 60

# =====================
# Additional CARE-specific settings
# =====================

# Custom welcome message
WELCOME_PAGE_LAST_TAB = "all"

# Disable dataset health check (if needed)
DATASET_HEALTH_CHECK = True

# Enable time range filter
NATIVE_FILTER_DEFAULT_ROW_LIMIT = 1000

print("CARE customization loaded successfully!")
