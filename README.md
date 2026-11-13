# Party Bill & Payment Management Software

Bangla-first payable and receivable web application for Dawat IT & Consultancy.

## Included modules

- Secure session login with Admin, Operator and Viewer roles
- Party master: customer, supplier or both, with opening payable/receivable
- Quick entry for sales bills, purchase bills, collection, payment, returns and adjustment
- Separate payable and receivable calculation for the same party
- Non-negative due view: an overpayment is shown as an advance instead of a negative due
- Party ledger with opening balance, running balances, date filters and print/PDF support
- Dashboard KPIs, balance summary report and CSV (Excel-ready) export
- Company header on every document; A4 statement / balance-report views with PDF download
- Shareable read-only ledger links (magic links) that anyone can open without an account
- Audit log collection and Admin-only void flow; financial entries cannot be hard deleted
- Company settings and MongoDB Atlas-ready configuration

## UI

The interface is built with **Tailwind CSS v4** and **shadcn/ui** primitives, so every
screen works from a 360 px phone up to a wide desktop:

- `app/globals.css` — theme tokens (colors, radius, shadows, Bengali-friendly type stack)
- `components/ui/*` — shadcn primitives (button, card, input, label, select, textarea,
  dialog, sheet, table, badge, alert, dropdown-menu, skeleton, sonner)
- `components/app-shell.tsx` — fixed dark sidebar on desktop, slide-in drawer plus a
  bottom tab bar on phones, sticky page header with account menu
- `components/stat-card.tsx` — the KPI tile reused by dashboard, ledger and reports

`npm run ui:check` logs in with Headless Chrome and writes desktop/mobile screenshots to
`.runtime\shots` (requires a running app; point `BASE_URL` elsewhere to override).

### Documents and share links

- **PDF** — `লেজার → PDF` opens `/print/ledger/<partyId>` and `রিপোর্টস → PDF` opens
  `/print/reports`. Both are A4-formatted documents with the company header from Settings;
  the browser's print dialog saves them as PDF (Bengali text prints correctly because the
  document is rendered by the browser, not a PDF library).
- **Magic share link** — on the ledger screen, `শেয়ার` creates a read-only
  `/share/ledger/<token>` URL. It needs no login, expires after 30 days, can be revoked,
  and counts views. Tokens live in the `sharelinks` collection (`Token`, `createdAt`,
  `expiresAt`, `revokedAt`, `views`).

## Setup

1. Install Node.js 20+ and dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`, then set the MongoDB Atlas URI and a unique 32+ character `AUTH_SECRET`.

   **Local-only alternative:** this checkout already runs against a portable MongoDB
   under `.runtime\mongo` (8.0.4, data in `.runtime\data`). `.env.local` points at
   `mongodb://127.0.0.1:27017/party_accounts_db`. Start database + app together with:

   ```bash
   npm run local
   ```

   That script starts `mongod` on 127.0.0.1:27017 if it is not already running, then
   runs `next dev` on <http://localhost:3000>. Delete `.runtime\data` to reset the
   database. No Atlas account is needed for local work.

3. Create the first admin (already done locally: `admin@company.com` / `Admin@12345`
   — change this before any real use):

   ```bash
   npm run seed -- admin@yourcompany.com YourStrongPassword "Company Admin"
   ```

4. Start development:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

5. Production check and start:

   ```bash
   npm run build
   npm run start
   ```

## MongoDB Atlas deployment checklist

- Create an Atlas database user with only this application's database access.
- Add the VPS public IP to Atlas Network Access.
- Put `MONGODB_URI` and `AUTH_SECRET` in the VPS environment (never commit `.env.local`).
- Enable Atlas automated backups. For a production financial app, use a scheduled snapshot/continuous backup policy appropriate to the client's data retention requirement.
- Deploy behind HTTPS and set `NODE_ENV=production`; session cookies will then be secure-only.

## Accounting rules

Every transaction has a positive amount and an explicit account impact:

| Entry | Account | Effect |
| --- | --- | --- |
| Sales bill | Receivable | Increase |
| Customer receipt | Receivable | Decrease |
| Purchase bill | Payable | Increase |
| Supplier payment | Payable | Decrease |
| Return/refund | Corresponding account | Corrective increase/decrease |
| Adjustment | Selected account | Admin-selected increase/decrease |

`Due = max(raw balance, 0)` and `Advance = max(-raw balance, 0)`. This avoids displaying a misleading negative due when a party has prepaid or overpaid.

## Remaining production choices

- Configure an automated backup/snapshot policy in the selected Atlas tier.
- If the client expects formal `.xlsx` output (rather than Excel-ready CSV) or branded PDF statements, add a document-export service such as SheetJS/PDFKit after their preferred layout is approved.
- User management UI, invoice attachments and payment allocation UI are deliberately staged for Phase 2; the data model already includes allocation support.
