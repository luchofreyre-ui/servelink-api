export const AMAZON_CATALOG_EXECUTION_WORKFLOW = [
  "1. Add raw batch data to amazonPasteInput.ts or amazonPasteRawInput.ts",
  "2. Run npm run preview:amazon-paste-import",
  "3. Resolve unmatched rows, duplicate issues, and conflict issues",
  "4. Review merge hints before editing amazonCatalogImport.ts",
  "5. Paste only clean matched output into amazonCatalogImport.ts",
  "6. Run npm run report:amazon-catalog-health",
  "7. Run npm run report:amazon-catalog-fill-status",
  "8. Prioritize rows in this order: purchase_enabled_without_url, missing_primary_image, missing_amazon_url, missing_asin",
  "9. Run npx tsc --noEmit and npm run build",
  "10. Visually QA one PDP, one comparison page, and one recommendation surface",
] as const;
