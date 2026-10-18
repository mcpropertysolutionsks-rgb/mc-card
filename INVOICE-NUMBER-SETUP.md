# Invoice numbering — isolated preview

Only use an independent Firebase project, never the CRM project. API: POST /api/allocate-invoice with Firebase ID token in Authorization Bearer header and JSON {invoiceId,prefix}.

Preview-only server environment variables:
- MCPS_INVOICE_FIREBASE_SERVICE_ACCOUNT_JSON: encrypted dedicated service account JSON
- MCPS_INVOICE_FIREBASE_PROJECT_ID: matching dedicated Firebase project ID
- MCPS_INVOICE_ALLOWED_UIDS: explicitly approved Firebase Authentication user IDs
- MCPS_INVOICE_ALLOCATION_ENABLED: keep unset or false until reconciliation

Before enabling, export and reconcile all existing invoices from every device, including AC-0006. Archive each previously issued/canceled invoice number in issuedInvoiceNumbers/{invoiceNo}; initialize invoiceSequences/{PREFIX} with {next: first truly unused number, reconciled: true}. Never reuse canceled or historical numbers.

Test sequential allocation, repeated invoice requests (idempotent), concurrent requests to different invoice IDs, unauthorized access and history conflicts before connecting the UI. The current UI remains a draft-only tool until integration is verified. No production or CRM modifications.
