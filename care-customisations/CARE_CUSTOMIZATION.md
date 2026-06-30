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

## Backup & Restore Procedures

### Why Backups Matter

Superset contains critical assets:
- **Dashboards** - Layouts, filters, and configurations
- **Charts** - Visualization definitions and queries
- **Datasets** - Virtual datasets and metrics
- **User metadata** - Permissions, roles, and RLS rules
- **Saved queries** - SQL Lab queries and history

**Recommendation:** Perform daily automated backups and test restore procedures quarterly.

### 1. Export Dashboards & Charts

#### Method A: Using Superset CLI (Recommended)

Export all content to a ZIP file:

```bash
# Export all dashboards with dependencies
superset export-dashboards -f /tmp/superset_export.zip

# Or export specific dashboard by ID
superset export-dashboards -f /tmp/dashboard_42.zip -d 42
```

**In Kubernetes:**
```bash
kubectl exec -n care deployment/superset-web -c superset -- \
  superset export-dashboards -f /tmp/backup.zip

# Copy file out of pod
kubectl cp care/superset-web-xxxxx:/tmp/backup.zip ./superset_backup_$(date +%Y%m%d).zip -c superset
```

#### Method B: Using Superset UI

1. Navigate to **Dashboards** → Select dashboard → **⋮ Menu**
2. Click **Export**
3. Save the `.zip` file
4. Repeat for all critical dashboards

**Limitation:** UI export only handles one dashboard at a time.

### 2. Backup Metadata Database

The metadata database stores all Superset configuration. Back it up regularly using PostgreSQL tools.

#### Manual Backup

```bash
# Backup to SQL file
kubectl exec -n care postgres-care-1 -- \
  pg_dump -U superset superset > superset_metadata_$(date +%Y%m%d).sql

# Backup with compression
kubectl exec -n care postgres-care-1 -- \
  pg_dump -U superset superset | gzip > superset_metadata_$(date +%Y%m%d).sql.gz
```

#### Automated Daily Backup (Kubernetes CronJob)

Create a CronJob to backup daily:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: superset-backup
  namespace: care
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:16
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: superset-secret
                      key: DB_PASS
              command:
                - /bin/sh
                - -c
                - |
                  pg_dump -h postgres-care-rw.care.svc.cluster.local \
                          -U superset \
                          -d superset \
                          | gzip > /backup/superset_$(date +%Y%m%d_%H%M%S).sql.gz
              volumeMounts:
                - name: backup-storage
                  mountPath: /backup
          restartPolicy: OnFailure
          volumes:
            - name: backup-storage
              persistentVolumeClaim:
                claimName: superset-backup-pvc
```

**Don't forget to create the PVC:**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: superset-backup-pvc
  namespace: care
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### 3. Restore Procedures

#### Restore Dashboards from Export

```bash
# Using Superset CLI
superset import-dashboards -p /tmp/backup.zip

# In Kubernetes
kubectl cp ./superset_backup_20260630.zip care/superset-web-xxxxx:/tmp/backup.zip -c superset
kubectl exec -n care deployment/superset-web -c superset -- \
  superset import-dashboards -p /tmp/backup.zip
```

#### Restore Metadata Database

**⚠️ WARNING:** This will overwrite all existing data. Test in dev environment first.

```bash
# Restore from SQL backup
kubectl exec -i -n care postgres-care-1 -- \
  psql -U superset superset < superset_metadata_20260630.sql

# Restore from compressed backup
gunzip < superset_metadata_20260630.sql.gz | \
  kubectl exec -i -n care postgres-care-1 -- \
  psql -U superset superset
```

**After restore:**
```bash
# Restart Superset pods to clear caches
kubectl rollout restart deployment/superset-web -n care
kubectl rollout restart deployment/superset-worker -n care
```

### 4. Disaster Recovery Checklist

Follow this checklist when recovering from a disaster:

**Step 1: Verify Infrastructure**
```bash
# Check PostgreSQL
kubectl get pods -n care | grep postgres
kubectl exec -n care postgres-care-1 -- psql -U postgres -c "\l"

# Check Redis
kubectl get pods -n care | grep redis
kubectl exec -n care redis-0 -- redis-cli ping
```

**Step 2: Restore Metadata Database**
```bash
# Drop and recreate database (if corrupted)
kubectl exec -it -n care postgres-care-1 -- psql -U postgres
DROP DATABASE superset;
CREATE DATABASE superset;
GRANT ALL PRIVILEGES ON DATABASE superset TO superset;
\q

# Restore from latest backup
kubectl exec -i -n care postgres-care-1 -- \
  psql -U superset superset < latest_backup.sql
```

**Step 3: Deploy Superset**
```bash
cd /Users/jagankumar/Office/Work/repo/Care/care_deployment/k3s/k8s/superset

# Apply manifests
kubectl apply -f 01-configmap-superset.yaml
kubectl apply -f 02-configmap-nginx.yaml
kubectl apply -f 03-secret-superset.yaml
kubectl apply -f 04-init-job.yaml

# Wait for init job
kubectl wait --for=condition=complete --timeout=600s job/superset-init-db -n care

# Deploy application
kubectl apply -f 05-deployment-web.yaml
kubectl apply -f 06-deployment-worker.yaml
kubectl apply -f 07-deployment-beat.yaml
kubectl apply -f 08-service.yaml
kubectl apply -f 09-middleware.yaml
kubectl apply -f 10-ingress.yaml
```

**Step 4: Verify Functionality**
```bash
# Check pod status
kubectl get pods -n care -l app=superset

# Check logs
kubectl logs -n care deployment/superset-web -c superset --tail=50

# Test login
curl -k https://care-k3s.digit.org/superset/health
```

**Step 5: Restore Dashboard Exports (if needed)**
```bash
# Import dashboard ZIP files
kubectl exec -n care deployment/superset-web -c superset -- \
  superset import-dashboards -p /tmp/dashboard_exports.zip
```

### 5. Backup Best Practices

**Daily Tasks:**
- ✅ Automated metadata database backup (CronJob)
- ✅ Verify backup file is created
- ✅ Rotate old backups (keep last 30 days)

**Weekly Tasks:**
- ✅ Export critical dashboards manually via CLI
- ✅ Store exports in version control (GitOps)

**Monthly Tasks:**
- ✅ Test restore procedure in dev environment
- ✅ Document any restore issues
- ✅ Verify backup file integrity (`pg_restore --list backup.sql`)

**Quarterly Tasks:**
- ✅ Perform full disaster recovery test
- ✅ Update disaster recovery documentation
- ✅ Review backup retention policy

### 6. Backup Retention Policy

Recommended retention schedule:

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Metadata DB | Daily | 30 days |
| Metadata DB | Weekly | 12 weeks |
| Metadata DB | Monthly | 12 months |
| Dashboard exports | Weekly | 12 weeks |
| Dashboard exports | Monthly | Forever (in Git) |

### 7. Offsite Backup Storage

Store backups in multiple locations for disaster recovery:

**Option 1: S3-Compatible Storage**
```bash
# Upload to S3 using AWS CLI
aws s3 cp superset_backup.sql.gz \
  s3://care-backups/superset/$(date +%Y/%m/%d)/
```

**Option 2: Network Storage**
```bash
# Mount NFS share
mount -t nfs backup-server:/backups /mnt/backups

# Copy backup
cp superset_backup.sql.gz /mnt/backups/superset/
```

**Option 3: Git for Dashboard Exports**
```bash
# Store dashboard exports in version control
cd /path/to/superset-configs-repo
mkdir -p exports/$(date +%Y-%m)
cp dashboard_exports.zip exports/$(date +%Y-%m)/
git add exports/
git commit -m "backup: dashboard exports $(date +%Y-%m-%d)"
git push
```

### 8. Troubleshooting Backup Issues

**Issue: pg_dump fails with "permission denied"**
```bash
# Solution: Use postgres superuser
kubectl exec -n care postgres-care-1 -- \
  pg_dump -U postgres superset > backup.sql
```

**Issue: Restore fails with "database in use"**
```bash
# Solution: Terminate active connections first
kubectl exec -n care postgres-care-1 -- psql -U postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='superset';"
```

**Issue: Import fails with "uuid already exists"**
```bash
# Solution: Use --force flag to overwrite
superset import-dashboards -p backup.zip --force
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
