# CARE Superset Customization Guide

This document describes the CARE-specific customizations for Apache Superset.

## Files Overview

### Customization Files

1. **`superset_config_care.py`** - CARE-specific configuration
   - Branding (logo, colors, name)
   - Theme customization
   - Feature flags
   - Color schemes
   - Security settings

2. **`requirements-care.txt`** - Additional Python dependencies
   - Database drivers (PostgreSQL, MySQL, BigQuery)
   - Utilities

3. **`.github/workflows/docker-publish.yml`** - CI/CD pipeline
   - Automated Docker builds
   - Publishing to GHCR
   - Multi-platform support

## Customization Components

### 1. Branding

```python
APP_NAME = "CARE Analytics"
APP_ICON = "/app/superset/static/assets/images/care_logo.png"
LOGO_TOOLTIP = "CARE HMIS"
```

**To add your logo:**
1. Place logo files in `superset/static/assets/images/`
   - `care_logo.png` (126px width recommended)
   - `favicon.png` (32x32 or 64x64)
2. Logo files will be included in Docker image automatically

### 2. Theme Colors

CARE uses teal-based color palette:
- Primary: `#006064` (Teal)
- Secondary: `#00ACC1` (Cyan)
- Success: `#43A047` (Green)
- Warning: `#FB8C00` (Orange)
- Error: `#E53935` (Red)

To customize colors, edit `THEME_OVERRIDES` in `superset_config_care.py`.

### 3. Feature Flags

Enabled features:
- ✅ Alert & Reports
- ✅ Dashboard RBAC
- ✅ Cross-filtering
- ✅ Drill to detail
- ✅ Drill by dimension
- ✅ SQL Lab with Jinja templates
- ✅ Embedded dashboards

### 4. Custom Color Schemes

Two color schemes added:
- **CARE Colors** - Categorical palette (10 colors)
- **CARE Sequential** - Sequential palette for heatmaps

### 5. Row-Level Security (RLS)

RLS rules are configured in the Superset UI after deployment.

**Common CARE RLS patterns:**

```python
# Facility-based access
facility_id = '{{ current_user.facility_id }}'

# District-based access
district_id = '{{ current_user.district_id }}'

# State-based access
state_id = '{{ current_user.state_id }}'

# Multi-level access (facility or district)
facility_id = '{{ current_user.facility_id }}'
OR district_id = '{{ current_user.district_id }}'
```

## Using Customizations

### Method 1: During Docker Build (Recommended)

Add to your `Dockerfile`:

```dockerfile
FROM apache/superset:latest

USER root

# Copy CARE customization
COPY superset_config_care.py /app/pythonpath/superset_config.py

# Copy logo assets
COPY superset/static/assets/images/care_logo.png \
     /app/superset/static/assets/images/care_logo.png
COPY superset/static/assets/images/favicon.png \
     /app/superset/static/assets/images/favicon.png

# Install additional requirements
COPY requirements-care.txt /app/
RUN pip install --no-cache-dir -r /app/requirements-care.txt

USER superset
```

### Method 2: Via Kubernetes ConfigMap

The customization is already included in the Kubernetes ConfigMap (`01-configmap-superset.yaml`).

## Adding Logo Files

1. **Create logo files:**
   ```bash
   # Place in superset/static/assets/images/
   # - care_logo.png (PNG, 126px width, transparent background)
   # - favicon.png (PNG, 32x32 or 64x64)
   ```

2. **Rebuild Docker image:**
   ```bash
   # GitHub Actions will automatically build on push
   git add superset/static/assets/images/
   git commit -m "feat: add CARE logo files"
   git push origin main
   ```

3. **Or build locally:**
   ```bash
   docker build -t ghcr.io/care-ecosystem/superset:latest .
   docker push ghcr.io/care-ecosystem/superset:latest
   ```

## Email Configuration

To enable email reports:

1. Uncomment email settings in `superset_config_care.py`:
   ```python
   SMTP_HOST = "smtp.gmail.com"
   SMTP_USER = "your-email@gmail.com"
   SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
   SMTP_PORT = 587
   ```

2. Add SMTP password to Kubernetes secret:
   ```bash
   kubectl edit secret superset-secret -n care
   # Add: SMTP_PASSWORD: your-password
   ```

3. Restart Superset pods:
   ```bash
   kubectl rollout restart deployment/superset-web -n care
   ```

## Database Drivers

### PostgreSQL (Default)
Already included. Connection string:
```
postgresql+psycopg2://user:password@host:5432/database
```

### MySQL/MariaDB
Included in `requirements-care.txt`. Connection string:
```
mysql://user:password@host:3306/database
```

### BigQuery
Included in `requirements-care.txt`. Connection string:
```
bigquery://project-id
```

### Adding More Drivers

1. Add to `requirements-care.txt`:
   ```txt
   snowflake-sqlalchemy==1.5.0
   ```

2. Rebuild Docker image

3. Use in Superset:
   ```
   snowflake://user:password@account/database/schema
   ```

## Updating Customizations

### Update Colors/Branding

1. Edit `superset_config_care.py`
2. Update ConfigMap:
   ```bash
   kubectl apply -f 01-configmap-superset.yaml
   ```
3. Restart pods:
   ```bash
   kubectl rollout restart deployment/superset-web -n care
   ```

### Add New Features

1. Update `FEATURE_FLAGS` in `superset_config_care.py`
2. Apply changes (same as above)

### Update Logo

1. Replace files in `superset/static/assets/images/`
2. Rebuild and push Docker image
3. Update deployment:
   ```bash
   kubectl rollout restart deployment/superset-web -n care
   ```

## Testing Customizations Locally

```bash
# Start local Superset with customizations
export PYTHONPATH="${PWD}:${PYTHONPATH}"
export SUPERSET_CONFIG_PATH="${PWD}/superset_config_care.py"

superset run -p 8088 --with-threads --reload --debugger
```

## Troubleshooting

### Logo not showing
- Check file paths in `APP_ICON` and `FAVICONS`
- Verify files exist in Docker image: `docker exec <pod> ls /app/superset/static/assets/images/`
- Clear browser cache

### Colors not applying
- Verify `THEME_OVERRIDES` syntax
- Restart Superset pods
- Check browser console for errors

### Feature not working
- Verify feature flag is `True` in `FEATURE_FLAGS`
- Check Superset version compatibility
- Review pod logs: `kubectl logs -n care deployment/superset-web -c superset`

## Reference Links

- [Superset Configuration Docs](https://superset.apache.org/docs/configuration/configuring-superset)
- [Feature Flags List](https://github.com/apache/superset/blob/master/RESOURCES/FEATURE_FLAGS.md)
- [Database Connections](https://superset.apache.org/docs/configuration/databases)
- [Row-Level Security](https://superset.apache.org/docs/security/#row-level-security)

## Support

For CARE-specific issues:
- Check deployment logs: `kubectl logs -n care deployment/superset-web`
- Review configuration: `kubectl get cm superset-config -n care -o yaml`
- Consult deployment manual: `/Users/jagankumar/.claude/plans/superset-deployment-manual.md`
