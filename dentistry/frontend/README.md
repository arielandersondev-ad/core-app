This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Dentistry authentication

Copy `.env.example` to `.env.local` and set the backend addresses:

```env
AUTH_API_URL=http://localhost:3001
DENTISTRY_API_URL=http://localhost:3004
```

Both variables are server-only. `AUTH_API_URL` points to Core/Auth for `POST /auth/dentistry/login`; `DENTISTRY_API_URL` points to Dentistry Backend for `/auth/me`, appointments and patients. The BFF stores the 30-minute access token in the `crowant_dentistry_access` HttpOnly cookie and forwards it only to allowlisted Dentistry endpoints. Refresh is not implemented yet; after expiry the user signs in again.

## Patient BFF and services

The existing `/api/dentistry/[...path]` handler exposes these patient operations:

| BFF operation | Backend operation | Required token permission |
| --- | --- | --- |
| `GET /api/dentistry/patients` | `GET /patients` | `dentistry:patients:read` |
| `GET /api/dentistry/patients/:id` | `GET /patients/:id` | `dentistry:patients:read` |
| `POST /api/dentistry/patients` | `POST /patients` | `dentistry:patients:create` |
| `PATCH /api/dentistry/patients/:id` | `PATCH /patients/:id` | `dentistry:patients:update` |
| `DELETE /api/dentistry/patients/:id` | `DELETE /patients/:id` | `dentistry:patients:delete` |

The list accepts only `search`, `status`, `page` and `pageSize`. Unknown or repeated query parameters return 400; other patient operations accept no query parameters. NestJS validates parameter values and computes pagination. Omitted pagination uses its defaults (page 1, 20 items; maximum size 100). The BFF forwards `{ items, pagination }` without changing it.

POST/PATCH require same-origin requests, JSON and a body of at most 64 KiB, including streamed bodies. DELETE requires same-origin and sends no body. All responses use `Cache-Control: no-store`. Missing cookies return 401; NestJS verifies the token and permissions and derives the organization and author from its claims. Backend 4xx JSON responses retain their status and messages; backend 5xx or invalid response content types produce a generic 502. Connection failures return 502 and the 15-second timeout returns 504.

Patient contracts, endpoint names and HTTP services live in `src/features/patient`. The former unused `modules/clinic/api/patients.ts` client was replaced by this feature. Requests contain patient data and filters; they do not require organization or author identifiers. Dates remain JSON strings, and PATCH distinguishes omitted fields from nullable fields explicitly set to `null`.

The services use `fetch` through `requestJson`. `ApiError` exposes `status`, `message` and `messages` (including validation arrays). Status 0 means the browser could not reach the BFF. Services do not navigate or clear form state on 401.

## Patient list

The authenticated `/patients` list now reads real data through `usePatients` → patient services → BFF → Dentistry Backend. TanStack Query uses the same pinned version as Core (`5.100.14`), with a 30-second stale time and one retry for transient errors. HTTP 4xx errors are not retried automatically. A QueryClient is created per mounted authenticated context, keyed by user, organization and membership, without persisting patient data in browser storage.

Search, status, page and page size live in the URL. Search waits 350 ms before requesting; changing search, status or page size resets page to 1. Query keys include all criteria and obsolete requests consume an AbortSignal. The table renders the returned page directly and uses the server's counts and numbered pagination, including empty and out-of-range pages. Demographic columns use the actual response fields; birth dates remain civil dates.

The list handles initial loading, refresh, empty results, connection failures, 401 and 403. On 401 it offers an explicit login link preserving the list URL; it does not automatically redirect. The patient detail uses the real `GET /patients/:id` endpoint; the clinical demo remains a separate legacy flow.

## Patient creation

The header's **Nuevo paciente** button opens the shared `Modal`. `/patients?create=true`, including the dashboard shortcut, opens the same real creation flow. The button is shown when the authenticated session includes `dentistry:patients:create`; NestJS remains the final permission authority.

The feature follows Core's organization/setup structure: button and dialog under `components`, form under `components/forms`, Zod validation under `schemas`, inferred form values under `types`, and the TanStack mutation under `hooks`/`api`. It reuses `Modal`, `Button`, `Input`, `Select` and `Label`, with React Hook Form `7.88.0`, Zod `4.6.5` and resolvers `5.9.1`, matching Core's installed versions. Only first and last names are required. Empty optional fields are omitted, birth dates use `YYYY-MM-DD`, and document type/number must be supplied together.

Creation verifies the current session context before POST, never sends organization/author identifiers, and never retries writes automatically. A successful write invalidates every patient list, closes the modal and returns the current list to page 1 with a success message. Existing search/status filters are retained. A failed list refresh does not turn an already successful write into a failed creation.

On 401, validation errors, 403 or connection failures, the form remains mounted with its values. For expired sessions it offers login in another tab; the user then returns to the original form and saves again. Switching user, organization or membership blocks that POST until the original context is restored. Drafts are held only in memory; closing/cancelling or reloading the page discards them. Closing is blocked while submitting.

## Patient update and deletion

The patient detail offers editing when the session includes `dentistry:patients:update`. It reuses the patient form, verifies the current user/organization/membership before PATCH, sends `null` for emptied optional fields and refreshes the detail and list queries after success.

Logical deletion is available when the session includes `dentistry:patients:delete`. The detail asks for confirmation, then sends DELETE. Dentistry sets `deletedAt` to the current timestamp and records the acting membership in `updatedByMembershipId`; deleted patients disappear from list and detail reads. This does not physically remove the patient or related clinical data. Core must have this permission assigned to the appropriate roles before users can see or invoke the action.

Run `npm test` for isolated BFF/service tests using Node's test runner and the installed TypeScript compiler. They execute the production route, proxy and services with mocked cookies/upstream transport, without connecting to Core, Dentistry or a database. Run TypeScript, lint and a production build separately for framework integration checks.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
