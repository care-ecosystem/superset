## Recommended Workflow

The correct replacement sequence should be:

1. **Replace Datasets**
2. **Replace Charts**
3. **Replace Dashboard**

This ensures that all dependencies are updated in the correct order and that dashboards reference the latest datasets and charts.

## Performance Considerations

Currently, the export and import processes are relatively fast because we are working with staging data. However, when moving to production, timeout issues may occur due to the larger volume of data and objects being processed.

### Recommended Production Approach

Instead of replacing all assets every time, only replace the components that have changed.

For example:

- If only **2 out of 10 datasets** are modified, export and overwrite only those **2 datasets**.
- Then replace only the **charts that depend on those datasets**.
- Finally, replace only the **dashboards that use those updated charts**.

This targeted approach reduces processing time, minimizes the risk of timeouts, and avoids unnecessary updates to unchanged assets.