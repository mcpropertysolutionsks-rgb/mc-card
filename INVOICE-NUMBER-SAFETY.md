# Invoice numbering safety — isolated test branch

This feature branch disables local invoice-number generation in the separate MCPS Invoice v11 application. It does NOT change production or any stored invoices.

## Behavior
- New drafts and duplicate-copies have NO official number.
- The invoice number field cannot be manually edited.
- Unnumbered drafts are saved and can be previewed, but an attempted customer print is blocked with an explanation to issue the official invoice number from the CRM.
- All existing invoices remain in browser storage under the same key without migration. Existing invoice numbers are preserved, and historical records with existing numbers remain viewable and printable.
- Visual styles, logo, invoice template layout and photo storage have not been changed.

## Why it is not yet ready for production
This browser-only app has no verified Firebase Auth or central allocation transaction. Before production, either:
1. Add authenticated read-only support to load *already issued* invoices by reference from the central CRM/Firebase registry, without independently allocating IDs; or
2. Explicitly designate this interface a draft/template tool, and require all official invoicing/printing and sending to occur from the CRM.

Deploying this branch as a permanent replacement without user acceptance may interrupt workflows that currently print directly from the standalone invoice app.

No changes have been made to the main branch or production deployment.
