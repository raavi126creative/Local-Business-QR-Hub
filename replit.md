# Local Business QR Hub

Local Business QR Hub lets a small business publish a mobile storefront, manage its catalog and offers, and share one permanent QR code.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/qr-hub` — the React/Vite owner dashboard and public `/store` storefront.
- `artifacts/api-server/src/routes/storefront.ts` — profile, catalog, offers, dashboard summary, and public storefront API.
- `lib/api-spec/openapi.yaml` — source of truth for generated API hooks and validation.
- `lib/db/src/schema/` — PostgreSQL schema for the business profile, catalog items, and offers.

## Architecture decisions

- The public storefront and the owner dashboard read from the same API-backed records, so edits are reflected without regenerating a QR code.
- The initial experience uses one seeded business profile so a first-time owner sees a complete example immediately.
- `/store` is the permanent public destination; the QR page encodes that route rather than a short-lived preview URL.
- Images are currently entered as URLs to keep the five-minute setup fast; persistent file storage can be added without changing the public data shape.

## Product

- Guided owner dashboard with profile checklist and storefront preview.
- Editable products/services with prices, descriptions, photos, categories, and availability.
- Editable special offers with activation, codes, and optional expiry dates.
- Downloadable and printable scannable QR code with shareable public link.
- Mobile-first public storefront with contact, location, hours, menu, and offers.

## User preferences

The owner experience should stay fast, clear, and approachable for non-technical small business owners.

## Gotchas

- The API server mounts routes under `/api`; the public web route is handled by the QR Hub artifact at `/store`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
