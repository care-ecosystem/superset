# Apache Superset — Approach Document
### Local Development Setup & Kubernetes/Helm Deployment with Customisation
**Prepared by:** eGov Foundation / CARE Team  
**Audience:** Engineers & Ops  
**Last Updated:** June 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Local Development Setup](#3-local-development-setup)
4. [Customisation Guide](#4-customisation-guide)
5. [Building a Custom Docker Image](#5-building-a-custom-docker-image)
6. [Kubernetes / Helm Deployment](#6-kubernetes--helm-deployment)
7. [Post-Deployment Verification](#7-post-deployment-verification)
8. [Troubleshooting](#8-troubleshooting)
9. [Reference & Links](#9-reference--links)

---

## 1. Overview

Apache Superset is the analytics and dashboarding layer for the CARE HMIS platform. The CARE team maintains a fork at **https://github.com/care-ecosystem/superset** which is the single source of truth for all customisations. This document covers:

- Setting up a local development environment for engineers making customisations (branding, config, drilldowns)
- Building and pushing a custom Docker image with those changes
- Deploying to a Kubernetes cluster via the official Helm chart
- Validating the deployment end-to-end

The target Kubernetes cluster is a k3s deployment on AWS (`carehmis.dpdns.org`) with Traefik ingress and Cloudflare DNS.

---

## 2. Prerequisites

### For Engineers (Local Dev)

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.9 – 3.11 | Avoid 3.12; some Superset deps lag |
| Node.js | 18.x LTS | For frontend asset builds |
| Docker | 24+ | With BuildKit enabled |
| Git | Any | |
| PostgreSQL | 14+ | Used as Superset metadata DB locally |
| Redis | 6+ | Used as cache/Celery broker locally |

### For Ops (Deployment)

| Tool | Version | Notes |
|------|---------|-------|
| kubectl | 1.27+ | Configured against target cluster |
| Helm | 3.12+ | |
| Docker | 24+ | To push custom image |
| Access to container registry | — | e.g. GHCR, ECR, or Docker Hub |

---

## 3. Local Development Setup

### 3.1 Clone the Repository

The CARE team maintains a fork of Apache Superset at:
**https://github.com/care-ecosystem/superset**

All customisations (config, branding, Dockerfile, Helm values) live in this fork. Always work from here — do not clone upstream directly.

```bash
# Clone the CARE fork
git clone https://github.com/care-ecosystem/superset.git
cd superset

# Add upstream remote to pull in future Apache Superset releases
git remote add upstream https://github.com/apache/superset.git
git fetch upstream

# Verify remotes
git remote -v
# origin    https://github.com/care-ecosystem/superset.git (fetch)
# upstream  https://github.com/apache/superset.git (fetch)
```

#### Keeping the fork in sync with upstream

```bash
# Fetch latest upstream changes
git fetch upstream

# Merge upstream into your working branch (e.g. main)
git checkout main
git merge upstream/master   # or upstream/main depending on Apache's default branch

# Push synced state to the fork
git push origin main
```

> Do this periodically (e.g. before starting a new feature or before a release) to stay current with Apache Superset security and bug fixes.

### 3.2 Python Backend Setup

```bash
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Superset with development extras
pip install -e ".[development]"

# Copy and edit the local config
cp superset/config.py superset_config.py
export SUPERSET_CONFIG_PATH=$(pwd)/superset_config.py
```

### 3.3 Start Local PostgreSQL and Redis

Using Docker Compose for dependencies only:

```yaml
# docker-compose.deps.yml
version: "3.8"
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: superset
      POSTGRES_USER: superset
      POSTGRES_PASSWORD: superset
    ports:
      - "5432:5432"

  redis:
    image: redis:6
    ports:
      - "6379:6379"
```

```bash
docker compose -f docker-compose.deps.yml up -d
```

### 3.4 Initialise the Database

```bash
# Set the DB connection string
export DATABASE_URL="postgresql+psycopg2://superset:superset@localhost:5432/superset"

# Run DB migrations
superset db upgrade

# Create admin user
superset fab create-admin \
  --username admin \
  --firstname Admin \
  --lastname User \
  --email admin@carehmis.in \
  --password admin

# Load example data (optional, useful for testing charts)
superset load_examples

# Initialise roles and permissions
superset init
```

### 3.5 Run the Development Server

```bash
# Backend (Flask dev server)
superset run -p 8088 --with-threads --reload --debugger

# Frontend (in a separate terminal)
cd superset-frontend
npm install
npm run dev
```

Frontend dev server proxies API calls to `localhost:8088`. Access the UI at `http://localhost:9000`.

### 3.6 Full Local Stack via Docker Compose (Alternative)

If you want a full local stack without manual setup:

```bash
# Uses the official docker-compose from the Superset repo
docker compose -f docker-compose-image-tag.yml up
```

Set `TAG=latest` or pin to a specific version in the `.env` file.

> **Note for engineers making customisations:** The manual setup (3.2–3.5) is preferred, since it allows live reload of Python config changes without rebuilding Docker images.

---

## 4. Customisation Guide

All customisations are applied via `superset_config.py`. This file is mounted into the container in production and overlaid on top of Superset's defaults.

### 4.1 Branding

```python
# superset_config.py

APP_NAME = "CARE HMIS Analytics"
APP_ICON = "/app/superset/static/assets/images/care_logo.png"
APP_ICON_WIDTH = 126
FAVICONS = [{"href": "/app/superset/static/assets/images/favicon.png"}]

# Header link — clicking the logo goes here
LOGO_TARGET_PATH = "/"
LOGO_TOOLTIP = "CARE HMIS"
```

Place your logo files in `superset/static/assets/images/`. They will be copied into the Docker image in Section 5.

### 4.2 Theme Overrides

```python
THEME_OVERRIDES = {
    "colors": {
        "primary": {
            "base": "#006064",
            "dark1": "#004D40",
            "dark2": "#00251A",
            "light1": "#00838F",
            "light2": "#4FB3BF",
            "light3": "#B2EBF2",
            "light4": "#E0F7FA",
            "light5": "#F1FBFD",
        },
        "secondary": {
            "base": "#00ACC1",
        },
        "error": {"base": "#E53935"},
        "warning": {"base": "#FB8C00"},
        "success": {"base": "#43A047"},
    },
    "typography": {
        "families": {
            "sansSerif": "Inter, Roboto, sans-serif",
        }
    },
}
```

### 4.3 Feature Flags

```python
FEATURE_FLAGS = {
    # Embedding
    "EMBEDDED_SUPERSET": True,

    # Dashboard RBAC (per-dashboard role control)
    "DASHBOARD_RBAC": True,

    # Cross-filter drilldowns
    "DASHBOARD_CROSS_FILTERS": True,
    "DASHBOARD_FILTERS_EXPERIMENTAL": True,

    # Drill to detail (raw row data on click)
    "DRILL_TO_DETAIL": True,

    # Drill by dimension (hierarchical drill: State → District → Facility)
    "DRILL_BY": True,

    # Alerts & Reports
    "ALERT_REPORTS": True,

    # SQL Lab
    "ENABLE_TEMPLATE_PROCESSING": True,
}
```

### 4.4 Guest Token (Embedded Dashboards)

Required if embedding Superset dashboards inside the CARE frontend:

```python
GUEST_ROLE_NAME = "Public"
GUEST_TOKEN_JWT_SECRET = "your-secure-secret-here"   # rotate this in prod
GUEST_TOKEN_JWT_ALGO = "HS256"
GUEST_TOKEN_JWT_EXP_SECONDS = 300
```

### 4.5 Row-Level Security (RLS)

RLS filters are configured in the Superset UI under **Security → Row Level Security Filters**, not in `superset_config.py`.

Steps:
1. Go to **Security → Row Level Security Filters**
2. Click **+ Filter**
3. Set:
   - **Filter Type:** Regular
   - **Tables:** Select the relevant dataset
   - **Roles:** e.g. `FacilityViewer`
   - **Clause:** `facility_id = '{{current_user_facility}}'` (Jinja template)
4. Save

Alternatively, use the REST API to create RLS filters programmatically during an init job.

### 4.6 Drilldown Configuration

#### Cross-filter (click a bar, filter other charts)

1. Enable `DASHBOARD_CROSS_FILTERS` (done above in feature flags)
2. In the Dashboard editor, open the **Filters** panel
3. Set charts as **filter emitters** and other charts as **filter receivers**

#### Drill to Detail (row-level popup)

Enable `DRILL_TO_DETAIL`. Right-click any chart data point → "Drill to detail" to see raw rows.

#### Drill by Dimension (hierarchical)

Enable `DRILL_BY`. Right-click any data point → "Drill by" → choose a dimension (e.g. State → District → Facility). No additional chart configuration needed.

#### URL-based Drilldown (navigate to another dashboard)

Use native URL filter parameters:

```
https://superset.carehmis.dpdns.org/dashboard/facility-detail/?native_filters=<encoded_filter>
```

You can generate the `native_filters` value from the Superset UI by applying a filter and copying the URL.

---

## 5. Building a Custom Docker Image

Once customisations are ready and tested locally, build a custom image to deploy.

### 5.1 Dockerfile

```dockerfile
# Dockerfile.custom
FROM apache/superset:3.1.3

USER root

# Copy custom config
COPY superset_config.py /app/pythonpath/superset_config.py

# Copy custom static assets (logo, favicon)
COPY superset/static/assets/images/care_logo.png \
     /app/superset/static/assets/images/care_logo.png
COPY superset/static/assets/images/favicon.png \
     /app/superset/static/assets/images/favicon.png

# Install any additional Python packages (e.g. database drivers)
RUN pip install psycopg2-binary sqlalchemy-bigquery

USER superset
```

### 5.2 Build and Push

```bash
# Build
docker build -f Dockerfile.custom \
  -t ghcr.io/care-ecosystem/superset:v3.1.3-care1 .

# Push to registry
docker push ghcr.io/care-ecosystem/superset:v3.1.3-care1
```

Tag convention: `<upstream-version>-<internal-build>` (e.g. `3.1.3-care1`).

---

## 6. Kubernetes / Helm Deployment

### 6.1 Add the Helm Repository

```bash
helm repo add superset https://apache.github.io/superset
helm repo update
```

### 6.2 Create Namespace

```bash
kubectl create namespace superset
```

### 6.3 Create Secrets

```bash
# Superset secret key (used for session signing)
kubectl create secret generic superset-secret \
  --from-literal=secret-key="$(openssl rand -base64 42)" \
  -n superset

# DB credentials (if using an external PostgreSQL)
kubectl create secret generic superset-db \
  --from-literal=postgresql-password="your-db-password" \
  -n superset

# Image pull secret (if using a private registry)
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<PAT> \
  -n superset

# Note: PAT must have read:packages scope for ghcr.io/care-ecosystem/superset
```

### 6.4 values.yaml

```yaml
# values.yaml

image:
  repository: ghcr.io/care-ecosystem/superset
  tag: v3.1.3-care1
  pullPolicy: IfNotPresent

imagePullSecrets:
  - name: regcred

# Override superset_config.py via Helm values
# These are merged into /app/pythonpath/superset_config.py
configOverrides:
  care_config: |
    APP_NAME = "CARE HMIS Analytics"
    APP_ICON = "/app/superset/static/assets/images/care_logo.png"
    APP_ICON_WIDTH = 126

    FEATURE_FLAGS = {
        "EMBEDDED_SUPERSET": True,
        "DASHBOARD_RBAC": True,
        "DASHBOARD_CROSS_FILTERS": True,
        "DRILL_TO_DETAIL": True,
        "DRILL_BY": True,
        "ALERT_REPORTS": True,
    }

    THEME_OVERRIDES = {
        "colors": {
            "primary": {"base": "#006064"},
        }
    }

    GUEST_ROLE_NAME = "Public"
    GUEST_TOKEN_JWT_ALGO = "HS256"
    GUEST_TOKEN_JWT_EXP_SECONDS = 300

# Secret key from Kubernetes secret
extraEnv:
  SUPERSET_SECRET_KEY:
    secretKeyRef:
      name: superset-secret
      key: secret-key
  GUEST_TOKEN_JWT_SECRET:
    secretKeyRef:
      name: superset-secret
      key: guest-token-secret

# PostgreSQL (use external DB in production)
postgresql:
  enabled: false   # set true for a local test install

externalPostgres:
  host: "your-rds-or-pg-host"
  port: 5432
  database: superset
  username: superset
  existingSecret: superset-db
  existingSecretKey: postgresql-password

# Redis
redis:
  enabled: true   # or point to an external Redis

# Celery workers for async queries and alerts
supersetWorker:
  replicaCount: 1

# Web pod
supersetNode:
  replicaCount: 1
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 1
      memory: 2Gi

# Ingress (Traefik on k3s)
ingress:
  enabled: true
  ingressClassName: traefik
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: superset.carehmis.dpdns.org
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: superset-tls
      hosts:
        - superset.carehmis.dpdns.org

# DB init job — runs migrations and init on first install
init:
  enabled: true
  loadExamples: false
  adminUser:
    username: admin
    firstname: Admin
    lastname: User
    email: admin@carehmis.in
    password: ""   # set via secret in production
```

### 6.5 Install / Upgrade

```bash
# First install
helm install superset superset/superset \
  -f values.yaml \
  --namespace superset \
  --create-namespace

# Subsequent upgrades
helm upgrade superset superset/superset \
  -f values.yaml \
  --namespace superset \
  --reuse-values
```

### 6.6 Cloudflare DNS

Point your Cloudflare DNS A record for `superset.carehmis.dpdns.org` to the Elastic IP of the k3s node (same as other subdomains). Set proxy status to **DNS only (grey cloud)** if using cert-manager for TLS; switch to **Proxied** only after TLS is confirmed working.

---

## 7. Post-Deployment Verification

### 7.1 Check Pod Status

```bash
kubectl get pods -n superset
# All pods should be Running; init job should be Completed
```

### 7.2 Check Logs

```bash
# Web pod
kubectl logs -n superset deploy/superset -c superset

# Init job
kubectl logs -n superset job/superset-init-db
```

### 7.3 Verify Branding

1. Open `https://superset.carehmis.dpdns.org`
2. Confirm the CARE logo appears in the header
3. Confirm the page title shows "CARE HMIS Analytics"
4. Check the primary colour in the UI matches the configured hex

### 7.4 Verify Feature Flags

1. Log in as admin
2. Open any existing dashboard
3. Right-click a chart data point → confirm "Drill to detail" and "Drill by" options appear
4. Enable cross-filters from the Dashboard edit panel and confirm they respond to chart clicks

### 7.5 Verify Embedded Token (if using embedding)

```bash
# Generate a guest token via the Superset API
curl -X POST https://superset.carehmis.dpdns.org/api/v1/security/guest_token/ \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "user": {"username": "guest", "first_name": "Guest", "last_name": "User"},
    "resources": [{"type": "dashboard", "id": "<dashboard-uuid>"}],
    "rls": []
  }'
```

A valid JWT in the response confirms the guest token flow is working.

---

## 8. Troubleshooting

| Symptom | Likely Cause | Resolution |
|--------|-------------|------------|
| `superset init` fails with DB error | DB not reachable / creds wrong | Check `DATABASE_URL` / secret values |
| Logo not showing | Path mismatch in `APP_ICON` | Verify the static file path inside the container |
| `DRILL_BY` option missing on right-click | Feature flag not applied | Confirm `configOverrides` in values.yaml is being picked up; restart pods |
| Ingress not routing | Traefik not picking up ingress class | Check `ingressClassName: traefik` and that Traefik is deployed |
| TLS cert not issued | cert-manager misconfigured | `kubectl describe certificate superset-tls -n superset` for events |
| Guest token endpoint returns 401 | Admin JWT expired or wrong scope | Re-login to obtain a fresh JWT before calling the guest token API |
| Celery workers not processing | Redis connection issue | Check `CELERY_BROKER_URL` in config and Redis pod status |
| Cross-filters not working | Flag enabled but dashboard not configured | Open Dashboard editor → Filters panel → configure emitters and receivers |

---

## 9. Reference & Links

- [CARE Superset Fork](https://github.com/care-ecosystem/superset) — source of truth for all CARE customisations
- [Apache Superset Docs](https://superset.apache.org/docs/intro)
- [Superset Helm Chart](https://github.com/apache/superset/tree/master/helm/superset)
- [Superset Configuration Reference](https://superset.apache.org/docs/configuration/configuring-superset)
- [Embedded Superset Guide](https://superset.apache.org/docs/embedding-superset)
- [CARE HMIS Platform](https://github.com/ohcnetwork/care-ecosystem)
- Cluster domain: `carehmis.dpdns.org` (Cloudflare / k3s on AWS ap-south-1)

---

*Jagan, eGov Foundation / CARE Team*
