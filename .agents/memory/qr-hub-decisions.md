---
name: QR Hub decisions
description: Durable product decisions for the local business storefront builder.
---

The public storefront is intentionally a single stable `/store` destination. The QR code should encode that destination so business edits never require reprinting.

**Why:** A permanent QR destination is the core promise of the product and avoids broken links after routine dashboard changes.

**How to apply:** Keep QR generation, share/copy links, and preview buttons aligned with the public route whenever the storefront routing changes.