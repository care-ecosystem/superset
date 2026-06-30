# Superset Custom Plugin Development Guide

**Complete guide for creating, building, and deploying custom visualization plugins in Apache Superset**

## Overview

Apache Superset supports custom visualization plugins built with React and TypeScript. This guide covers the complete workflow from plugin development to Kubernetes deployment.

**Environment:**
- Superset: 6.1.0
- Node.js: 22.23.1
- Package Manager: npm with `--legacy-peer-deps`

## Table of Contents

1. [Plugin Architecture](#plugin-architecture)
2. [Local Development Setup](#local-development-setup)
3. [Creating a New Plugin](#creating-a-new-plugin)
4. [Building and Testing Locally](#building-and-testing-locally)
5. [Docker Image Build with Custom Plugin](#docker-image-build-with-custom-plugin)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Plugin Architecture

### How Superset Plugins Work

```
┌─────────────────────────────────────────────────┐
│          Superset Frontend (React)              │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │        MainPreset.ts                      │ │
│  │  (Registers all available plugins)        │ │
│  └───────────────────────────────────────────┘ │
│                      │                          │
│                      ↓                          │
│  ┌───────────────────────────────────────────┐ │
│  │      Plugin Registry                      │ │
│  │  - EchartsPie                            │ │
│  │  - EchartsTimeseries                     │ │
│  │  - **YourCustomPlugin** ← New           │ │
│  └───────────────────────────────────────────┘ │
│                      │                          │
│                      ↓                          │
│  ┌───────────────────────────────────────────┐ │
│  │   Chart Builder UI                        │ │
│  │   (User selects plugin from dropdown)     │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Plugin Structure

```
superset-frontend/plugins/
├── plugin-chart-echarts/        # Built-in ECharts plugin
├── plugin-chart-table/          # Built-in table plugin
└── plugin-chart-your-custom/    # Your custom plugin
    ├── package.json             # Plugin metadata
    ├── tsconfig.json            # TypeScript config
    ├── src/
    │   ├── index.ts            # Plugin entry point
    │   ├── plugin/
    │   │   └── index.ts        # Plugin registration
    │   ├── YourChart.tsx       # Main chart component
    │   ├── transformProps.ts   # Data transformation
    │   └── controlPanel.ts     # Configuration UI
    └── README.md
```

---

## Local Development Setup

### Prerequisites

**1. Install Node.js 22.23.1:**

```bash
# Using nvm (recommended)
nvm install 22.23.1
nvm use 22.23.1

# Verify
node --version
# v22.23.1
```

**2. Install ZStd Compression (Required):**

**macOS:**
```bash
brew install zstd
```

**Ubuntu/Debian:**
```bash
sudo apt-get install zstd
```

**RHEL/CentOS:**
```bash
sudo yum install zstd
```

**Why needed:** Superset uses ZStd compression for efficient asset bundling. Build will fail without it.

### Clone and Setup Superset

```bash
# Clone Superset repository
git clone https://github.com/apache/superset.git
cd superset

# Checkout specific version
git checkout 6.1.0

# Install frontend dependencies
cd superset-frontend
npm install --legacy-peer-deps
```

**Why `--legacy-peer-deps`?**
- Superset has many legacy plugins with peer dependency conflicts
- Using `--legacy-peer-deps` allows npm to ignore peer dependency warnings
- Required for successful installation

**Expected Output:**
```
added 2547 packages in 3m
152 vulnerabilities (1 low, 45 moderate, 94 high, 12 critical)
```

**Note:** These vulnerabilities are from legacy plugins and are expected.

### Start Development Server

```bash
# In superset-frontend/
npm run dev-server

# Superset frontend will be available at:
# http://localhost:9000
```

**In a separate terminal, start backend:**

```bash
# In superset/ root directory
docker compose up
```

---

## Creating a New Plugin

### Step 1: Generate Plugin Scaffold

Use the Superset CLI to generate a new plugin:

```bash
cd superset-frontend

# Generate plugin
npm run plugins:create -- \
  --name chart-custom-viz \
  --description "Custom visualization for CARE HMIS" \
  --author "CARE Team"
```

**Output:**
```
superset-frontend/plugins/
└── plugin-chart-custom-viz/
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts
    │   ├── plugin/
    │   │   └── index.ts
    │   ├── CustomViz.tsx
    │   ├── transformProps.ts
    │   └── controlPanel.ts
    └── README.md
```

### Step 2: Understand Key Files

**`src/plugin/index.ts` - Plugin Registration:**

```typescript
import { ChartMetadata, ChartPlugin } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from '../transformProps';
import thumbnail from '../images/thumbnail.png';

export default class CustomVizChartPlugin extends ChartPlugin {
  constructor() {
    super({
      loadChart: () => import('../CustomViz'),
      metadata: new ChartMetadata({
        name: 'Custom Viz',
        description: 'Custom visualization for healthcare data',
        thumbnail,
        useLegacyApi: false,
        behaviors: ['INTERACTIVE_CHART'],
        category: 'Custom',
        tags: ['Healthcare', 'CARE', 'Custom'],
      }),
      buildQuery,
      controlPanel,
      transformProps,
    });
  }
}
```

**`src/CustomViz.tsx` - Chart Component:**

```typescript
import React from 'react';
import { styled } from '@superset-ui/core';

const Styles = styled.div`
  padding: 16px;
  border-radius: 4px;
  background-color: white;
`;

export default function CustomViz({ width, height, data }) {
  return (
    <Styles style={{ width, height }}>
      <h3>Custom Visualization</h3>
      <div>Data points: {data.length}</div>
      {/* Your custom visualization logic */}
    </Styles>
  );
}
```

**`src/transformProps.ts` - Data Transformation:**

```typescript
import { ChartProps } from '@superset-ui/core';

export default function transformProps(chartProps: ChartProps) {
  const { width, height, queriesData } = chartProps;
  const data = queriesData[0].data;

  return {
    width,
    height,
    data,
    // Transform your data here
  };
}
```

**`src/controlPanel.ts` - Configuration UI:**

```typescript
import { t } from '@superset-ui/core';
import { ControlPanelConfig } from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        ['metrics'],
        ['adhoc_filters'],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'show_legend',
            config: {
              type: 'CheckboxControl',
              label: t('Show Legend'),
              renderTrigger: true,
              default: true,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
```

### Step 3: Install Plugin Dependencies

If your plugin needs additional libraries:

```bash
cd plugins/plugin-chart-custom-viz

# Install dependencies
npm install --save d3 @types/d3 --legacy-peer-deps
npm install --save recharts --legacy-peer-deps
npm install --save @visx/scale @visx/group --legacy-peer-deps

# Return to frontend root
cd ../..
```

**Common Visualization Libraries:**
- `d3` - Data-driven visualizations
- `recharts` - React charting library
- `@visx` - Airbnb's visualization components
- `echarts-for-react` - ECharts wrapper (already in Superset)
- `plotly.js` - Interactive charts

### Step 4: Register Plugin in MainPreset

**Edit: `superset-frontend/src/visualizations/presets/MainPreset.js`**

```javascript
import CustomVizChartPlugin from '@superset-ui/plugin-chart-custom-viz';

export default class MainPreset extends Preset {
  constructor() {
    super({
      name: 'Main',
      presets: [new DeckGLChartPreset()],
      plugins: [
        // Existing plugins...
        new EchartsTimeseriesChartPlugin(),
        new EchartsPieChartPlugin(),

        // Add your custom plugin
        new CustomVizChartPlugin().configure({ key: 'custom_viz' }),
      ],
    });
  }
}
```

**Plugin Key:**
- The `key` must be unique across all plugins
- Used to identify the plugin in the chart metadata
- Convention: `snake_case`, descriptive name

---

## Building and Testing Locally

### Step 1: Build the Frontend

```bash
cd superset-frontend

# Full production build
npm run build

# Or for faster development builds
npm run build:dev
```

**Build Output:**
```
Creating an optimized production build...
Compiled successfully in 4m 23s

File sizes after gzip:
  2.1 MB  superset.entry.js
  438 KB  theme.js
  ...
```

**Common Build Errors and Solutions:**

**Error: `FATAL ERROR: Reached heap limit`**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Error: `command not found: zstd`**
```bash
# Install ZStd (see Prerequisites section)
brew install zstd  # macOS
```

**Error: `Dependency X is not compatible with peer dependency Y`**
```bash
# Install the missing dependency
npm install X@compatible-version --legacy-peer-deps
```

### Step 2: Start Superset with Custom Plugin

**Option A: Development Mode (Hot Reload):**

```bash
# Terminal 1: Frontend dev server
cd superset-frontend
npm run dev-server

# Terminal 2: Backend
cd ..
docker compose up
```

Access: `http://localhost:9000`

**Option B: Production Build:**

```bash
# Build frontend
cd superset-frontend
npm run build

# Rebuild Docker image
cd ..
docker compose down
docker compose up --build
```

Access: `http://localhost:8088`

### Step 3: Test Your Plugin

**1. Login to Superset:**
- URL: `http://localhost:8088`
- Username: `admin`
- Password: `admin`

**2. Create a New Chart:**
- Click "Charts" → "+ CHART"
- Select a dataset
- In "Visualization Type", search for your plugin name
- Select your custom plugin

**3. Configure and Render:**
- Use the control panel to configure the chart
- Click "Run Query" to render
- Verify the visualization displays correctly

**4. Check Browser Console:**

Open DevTools (F12) and check for:
- TypeScript compilation errors
- Runtime errors
- Data transformation issues

---

## Docker Image Build with Custom Plugin

### Option 1: Build from Modified Source

**Create Custom Dockerfile:**

```dockerfile
# Dockerfile.custom
FROM apache/superset:6.1.0

# Switch to root to install dependencies
USER root

# Install Node.js 22 (if not already)
RUN apt-get update && \
    apt-get install -y zstd && \
    rm -rf /var/lib/apt/lists/*

# Copy your custom plugin source
COPY ./superset-frontend/plugins/plugin-chart-custom-viz /app/superset-frontend/plugins/plugin-chart-custom-viz

# Copy modified MainPreset.js
COPY ./superset-frontend/src/visualizations/presets/MainPreset.js /app/superset-frontend/src/visualizations/presets/MainPreset.js

# Install frontend dependencies and rebuild
WORKDIR /app/superset-frontend
RUN npm install --legacy-peer-deps && \
    npm run build

# Switch back to superset user
USER superset

WORKDIR /app
```

**Build Custom Image:**

```bash
docker build -f Dockerfile.custom -t ghcr.io/care-ecosystem/superset-custom:latest .
```

### Option 2: Extend Existing CARE Image

**For the CARE Superset deployment, extend the existing image:**

```dockerfile
# Dockerfile
FROM ghcr.io/care-ecosystem/superset:latest

USER root

# Copy custom plugin
COPY ./plugins/plugin-chart-care-viz /app/superset-frontend/plugins/plugin-chart-care-viz

# Copy modified MainPreset.js
COPY ./MainPreset.js /app/superset-frontend/src/visualizations/presets/MainPreset.js

# Rebuild frontend
WORKDIR /app/superset-frontend
RUN npm install --legacy-peer-deps && npm run build

USER superset
WORKDIR /app
```

**Build and Push:**

```bash
# Build
docker build -t ghcr.io/care-ecosystem/superset:custom-v1.0.0 .

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Push
docker push ghcr.io/care-ecosystem/superset:custom-v1.0.0
```

### Option 3: GitHub Actions CI/CD (Multi-Arch Build)

**CARE uses a sophisticated multi-arch build strategy.** The existing workflow is at `.github/workflows/docker-publish.yml` in the Superset repository.

**Key Features:**
- ✅ Multi-architecture support (linux/amd64, linux/arm64)
- ✅ Native ARM64 builds (no QEMU emulation - faster)
- ✅ PR validation (amd64 only, no push)
- ✅ Per-arch caching for faster builds
- ✅ Multi-arch manifest combining

**To add custom plugins to the existing workflow:**

**Step 1: Add your plugin files to the repository:**

```bash
# In your Superset fork
git checkout -b feature/custom-plugin
mkdir -p superset-frontend/plugins/plugin-chart-care-viz
# ... add your plugin files
```

**Step 2: Update MainPreset.js:**

```javascript
// superset-frontend/src/visualizations/presets/MainPreset.js
import CareVizChartPlugin from '@superset-ui/plugin-chart-care-viz';

export default class MainPreset extends Preset {
  constructor() {
    super({
      plugins: [
        // ... existing plugins
        new CareVizChartPlugin().configure({ key: 'care_viz' }),
      ],
    });
  }
}
```

**Step 3: Commit and push:**

```bash
git add superset-frontend/plugins/plugin-chart-care-viz
git add superset-frontend/src/visualizations/presets/MainPreset.js
git commit -m "feat: add CARE custom visualization plugin"
git push origin feature/custom-plugin
```

**Step 4: Create PR for validation:**

- Create pull request on GitHub
- Workflow runs `build-pr` job (amd64 only, no push)
- Verifies plugin builds successfully
- Test image health check runs

**Step 5: Merge to trigger multi-arch build:**

- After PR approval and merge
- Workflow runs `build-matrix` job (both amd64 and arm64)
- Builds per-arch images in parallel
- `create-manifest` job combines into multi-arch manifest
- Tags created (see workflow line 51-61):
  - `latest` (if main/master branch)
  - `<branch>` (branch name)
  - `<branch>-<short-sha>`
  - `<branch>-<run-number>-<short-sha>`

**Step 6: Use the new image:**

```bash
# Pull latest with custom plugin
docker pull ghcr.io/care-ecosystem/superset:latest

# Or specific build
docker pull ghcr.io/care-ecosystem/superset:main-abc1234
```

**The existing workflow structure:**

```yaml
jobs:
  # 1. Prepare metadata (runs once)
  prepare:
    runs-on: ubuntu-24.04
    outputs:
      tags: ...
      labels: ...
      short_sha: ...

  # 2. PR validation (amd64 only, no push)
  build-pr:
    needs: prepare
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-24.04
    # Build, test, don't push

  # 3. Build per-architecture (parallel)
  build-matrix:
    needs: prepare
    if: github.event_name != 'pull_request'
    runs-on: ${{ matrix.runner }}
    strategy:
      matrix:
        - arch: amd64, runner: ubuntu-24.04
        - arch: arm64, runner: ubuntu-24.04-arm  # Native ARM64!
    # Build and push arch-specific tags

  # 4. Combine into multi-arch manifest
  create-manifest:
    needs: [prepare, build-matrix]
    runs-on: ubuntu-24.04
    # Create multi-arch manifest for all tags
```

**Why this approach is better:**

1. **Faster ARM64 builds**: Native runners, no QEMU emulation
2. **Parallel builds**: Both architectures build simultaneously
3. **PR safety**: PRs only build amd64 for validation, don't push
4. **Disk space management**: Auto-cleans common bloat on GitHub runners
5. **Comprehensive tagging**: Multiple tags for flexibility
6. **Cache optimization**: Per-arch caching, shared buildcache tag

**Customizing for your fork:**

If you need to modify the workflow:

```yaml
# Update image name
env:
  IMAGE_NAME: your-org/superset-custom

# Add build args for custom configuration
build-args: |
  BUILD_TRANSLATIONS=false
  INCLUDE_CHROMIUM=false
  CUSTOM_PLUGIN_VERSION=1.0.0  # Your addition
```

**Testing before merge:**

```bash
# Run PR build locally
act pull_request -W .github/workflows/docker-publish.yml

# Or test Docker build manually
docker build -t superset-test:local -f Dockerfile .
docker run --rm superset-test:local superset version
```

---

## Kubernetes Deployment

### Update k3s Deployment with Custom Image

**Step 1: Update Image in Manifests**

Edit the deployment files we created earlier:

**`05-deployment-web.yaml`:**
```yaml
containers:
  - name: superset
    image: ghcr.io/care-ecosystem/superset:custom-v1.0.0  # Changed
    # ... rest of config
```

**`06-deployment-worker.yaml`:**
```yaml
containers:
  - name: worker
    image: ghcr.io/care-ecosystem/superset:custom-v1.0.0  # Changed
    # ... rest of config
```

**`07-deployment-beat.yaml`:**
```yaml
containers:
  - name: beat
    image: ghcr.io/care-ecosystem/superset:custom-v1.0.0  # Changed
    # ... rest of config
```

**Step 2: Apply Updates**

```bash
export KUBECONFIG=/path/to/kubeconfig

# Update deployments
kubectl apply -f 05-deployment-web.yaml
kubectl apply -f 06-deployment-worker.yaml
kubectl apply -f 07-deployment-beat.yaml

# Monitor rollout
kubectl rollout status deployment/superset-web -n care
kubectl rollout status deployment/superset-worker -n care
kubectl rollout status deployment/superset-beat -n care
```

**Step 3: Verify Plugin is Available**

```bash
# Port forward to test
kubectl port-forward -n care svc/superset 8080:8080

# Access Superset at http://localhost:8080/superset
# Login and check Charts → Visualization Types
# Your custom plugin should appear in the list
```

### Rolling Update Strategy

**Zero-downtime deployment:**

```bash
# Update web first
kubectl set image deployment/superset-web superset=ghcr.io/care-ecosystem/superset:custom-v1.0.0 -n care

# Wait for rollout
kubectl rollout status deployment/superset-web -n care

# Update worker and beat
kubectl set image deployment/superset-worker worker=ghcr.io/care-ecosystem/superset:custom-v1.0.0 -n care
kubectl set image deployment/superset-beat beat=ghcr.io/care-ecosystem/superset:custom-v1.0.0 -n care
```

**Rollback if issues:**

```bash
kubectl rollout undo deployment/superset-web -n care
kubectl rollout undo deployment/superset-worker -n care
kubectl rollout undo deployment/superset-beat -n care
```

---

## Troubleshooting

### Build Errors

**Problem: `npm ERR! peer dep missing`**

```bash
# Install the missing peer dependency
npm install @missing/package@version --legacy-peer-deps
```

**Problem: `Module not found: Error: Can't resolve 'X'`**

```bash
# Install the module
cd plugins/plugin-chart-custom-viz
npm install X --save --legacy-peer-deps
cd ../..
npm run build
```

**Problem: `Unexpected token` in TypeScript**

Check `tsconfig.json` compiler options:
```json
{
  "compilerOptions": {
    "jsx": "react",
    "module": "esnext",
    "target": "es2018"
  }
}
```

### Runtime Errors

**Problem: Plugin not appearing in dropdown**

**Causes:**
1. Not registered in `MainPreset.js`
2. Build didn't complete successfully
3. Browser cache

**Solutions:**
```bash
# Verify registration
grep -r "CustomVizChartPlugin" superset-frontend/src/visualizations/presets/

# Rebuild
npm run build

# Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
```

**Problem: `transformProps is not a function`**

**Cause:** Export/import mismatch in `transformProps.ts`

**Solution:**
```typescript
// Correct: default export
export default function transformProps(chartProps: ChartProps) {
  // ...
}

// Wrong: named export
export function transformProps(chartProps: ChartProps) {
  // ...
}
```

**Problem: Chart crashes with data error**

**Solution:** Add error handling in component:

```typescript
export default function CustomViz({ width, height, data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>No data to display</p>
      </div>
    );
  }

  try {
    // Render chart
    return <YourChart data={data} />;
  } catch (error) {
    console.error('Chart render error:', error);
    return <div>Error rendering chart</div>;
  }
}
```

### Deployment Errors

**Problem: ImagePullBackOff in Kubernetes**

```bash
# Check image exists
docker pull ghcr.io/care-ecosystem/superset:custom-v1.0.0

# Check image pull secret
kubectl get secret ghcr-secret -n care

# Create if missing
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=$GITHUB_USERNAME \
  --docker-password=$GITHUB_TOKEN \
  -n care
```

**Problem: Pod crashes after plugin deployment**

```bash
# Check logs
kubectl logs -n care deployment/superset-web -c superset --tail=100

# Look for:
# - JavaScript syntax errors
# - Module not found errors
# - React runtime errors
```

---

## Best Practices

### Development Workflow

**1. Use Version Control:**

```bash
# Create feature branch for plugin
git checkout -b feature/custom-viz-plugin

# Commit incrementally
git add plugins/plugin-chart-custom-viz
git commit -m "feat: add custom viz plugin scaffold"

git add superset-frontend/src/visualizations/presets/MainPreset.js
git commit -m "feat: register custom viz plugin"

# Push and create PR
git push origin feature/custom-viz-plugin
```

**2. Test Locally Before Building Docker:**

- Always test in dev-server mode first
- Verify data transformation logic
- Test with various datasets
- Check browser console for errors

**3. Use TypeScript Strictly:**

```typescript
// Define prop types
interface CustomVizProps {
  width: number;
  height: number;
  data: DataRecord[];
  showLegend: boolean;
}

// Use typed components
const CustomViz: React.FC<CustomVizProps> = ({ width, height, data, showLegend }) => {
  // ...
};
```

### Plugin Design

**1. Follow Superset Conventions:**

- Use `@superset-ui/core` utilities
- Follow existing plugin patterns
- Use Superset's theming system
- Support both light and dark modes

**2. Optimize Performance:**

```typescript
import React, { useMemo } from 'react';

export default function CustomViz({ data }) {
  // Memoize expensive computations
  const processedData = useMemo(() => {
    return data.map(row => ({
      // ... transform
    }));
  }, [data]);

  return <Chart data={processedData} />;
}
```

**3. Handle Edge Cases:**

- Empty data
- Invalid data types
- Missing required fields
- Large datasets (pagination/virtualization)
- Errors in user queries

### Documentation

**Create comprehensive plugin README:**

```markdown
# Custom Viz Plugin

## Description
Healthcare-specific visualization for patient encounters.

## Configuration Options
- `showLegend`: Display legend (boolean)
- `colorScheme`: Color palette (string)

## Data Requirements
- Columns: date, count, category
- Minimum rows: 1
- Data types: temporal, numeric, string

## Examples
...

## Troubleshooting
...
```

### Security

**1. Sanitize User Input:**

```typescript
import { sanitizeHtml } from '@superset-ui/core';

// Don't render raw HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // ❌ Vulnerable

// Sanitize first
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userInput) }} />  // ✅ Safe
```

**2. Validate Data:**

```typescript
function validateData(data: unknown[]): DataRecord[] {
  return data.filter(row => {
    return (
      row &&
      typeof row === 'object' &&
      'date' in row &&
      'value' in row
    );
  });
}
```

---

## Summary Checklist

### Local Development

- [ ] Node.js 22.23.1 installed
- [ ] ZStd compression installed
- [ ] Superset cloned and dependencies installed
- [ ] Plugin scaffold created
- [ ] Plugin dependencies installed
- [ ] Plugin registered in MainPreset.js
- [ ] Build successful: `npm run build`
- [ ] Plugin visible in dev-server
- [ ] Tested with sample data

### Docker Build

- [ ] Dockerfile created
- [ ] Custom plugin source copied
- [ ] MainPreset.js updated in image
- [ ] Build successful: `docker build`
- [ ] Image pushed to registry
- [ ] Image tagged appropriately

### Kubernetes Deployment

- [ ] Deployment manifests updated with new image
- [ ] Changes applied: `kubectl apply`
- [ ] Rollout successful: `kubectl rollout status`
- [ ] Plugin visible in production Superset
- [ ] Existing dashboards still work
- [ ] New charts can be created with plugin

---

**Related Documentation:**
- [K8S_DEPLOYMENT_GUIDE.md](./K8S_DEPLOYMENT_GUIDE.md) - Kubernetes deployment
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - General troubleshooting
- [Apache Superset Plugin Tutorial](https://superset.apache.org/docs/contributing/creating-viz-plugins)

**Last Updated:** 2026-06-26
**Superset Version:** 6.1.0
**Node Version:** 22.23.1
