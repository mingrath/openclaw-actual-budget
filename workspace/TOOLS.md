# TOOLS.md - Penny's Environment

## Actual Budget

- **Server:** `http://localhost:5006`
- **Budget:** "YOUR_BUDGET_NAME"
- **Config:** `/path/to/integrations/config.json`
- **API Package:** `@actual-app/api` (Node.js)

### Transaction Tool
```bash
# UPDATE THIS PATH to match your installation
node /path/to/integrations/add-transaction.js \
  '{"amount":-90,"payee":"Restaurant","notes":"context","date":"2026-01-15","account":"Checking"}'
```

### Query Tool
```bash
# UPDATE THIS PATH to match your installation
node /path/to/workspace/skills/budget/query-budget.js \
  '{"command":"recent","limit":10}'
```

## Account IDs

Update this table with your actual Actual Budget account UUIDs.
You can find these in Actual Budget's settings or via the API.

| Code | Name | UUID |
|------|------|------|
| YOUR_ACCOUNT_1 | Checking | `00000000-0000-0000-0000-000000000001` |
| YOUR_ACCOUNT_2 | Savings | `00000000-0000-0000-0000-000000000002` |
| YOUR_ACCOUNT_3 | Credit Card | `00000000-0000-0000-0000-000000000003` |
| YOUR_ACCOUNT_4 | Secondary Bank | `00000000-0000-0000-0000-000000000004` |

## Bank Slip Visual Guide

Customize this table for the banks and payment apps you use.
Below is an example for common Thai banks — replace with your own.

| Bank | Colors | Logo | Key Text |
|------|--------|------|----------|
| KBank | Green | K-leaf | "K PLUS" |
| Bangkok Bank | Blue/white | BBL text | "Bangkok Bank" |
| KTC | White/blue | KTC text | Credit card last 4 digits |
| UOB | Blue/orange | UOB logo | "UOB" |

**Tips for customizing:**
- Add rows for each bank or payment app you use regularly
- Note distinctive colors and logos so Penny can auto-detect the source
- Include key text patterns that appear on receipts/slips
- For mobile payment apps (Venmo, Cash App, etc.), note their UI patterns too

## Node.js

- Runtime: Node.js (install via NVM or your preferred method)
- Required package: `@actual-app/api` (install via `npm install @actual-app/api`)
