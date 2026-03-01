# Skill: Budget Management

Query and add transactions to Actual Budget.

## Tools

### Add Transaction

Adds a single transaction to Actual Budget.

```bash
# UPDATE THIS PATH to match your installation
node /path/to/integrations/add-transaction.js '<JSON>'
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | number | Yes | Transaction amount (negative = expense, positive = income) |
| `payee` | string | Yes | Merchant or payee name |
| `notes` | string | No | Description, reference number, or context |
| `date` | string | No | YYYY-MM-DD format (defaults to today) |
| `account` | string | No | Account nickname from ACCOUNTS map (defaults to user's default) |

**Example:**
```bash
node /path/to/integrations/add-transaction.js \
  '{"amount":-45,"payee":"Grocery Store","notes":"Weekly groceries","date":"2026-03-01","account":"Checking"}'
```

### Query Transactions

Query your budget data from Actual Budget.

```bash
# UPDATE THIS PATH to match your installation
node /path/to/workspace/skills/budget/query-budget.js '<JSON>'
```

#### Commands

| Command | Parameters | Description |
|---------|-----------|-------------|
| `recent` | `limit` (default: 10) | Get the most recent N transactions |
| `category` | `startDate`, `endDate` | Spending breakdown by category for a date range |
| `total` | `startDate`, `endDate` | Total spending (sum) for a date range |
| `search` | `payee`, `limit` (default: 20) | Search transactions by payee name |

**Examples:**
```bash
# Last 5 transactions
node /path/to/workspace/skills/budget/query-budget.js '{"command":"recent","limit":5}'

# Spending by category this month
node /path/to/workspace/skills/budget/query-budget.js \
  '{"command":"category","startDate":"2026-03-01","endDate":"2026-03-31"}'

# Total spending this month
node /path/to/workspace/skills/budget/query-budget.js \
  '{"command":"total","startDate":"2026-03-01","endDate":"2026-03-31"}'

# Search for a payee
node /path/to/workspace/skills/budget/query-budget.js '{"command":"search","payee":"Coffee"}'
```

## Account Codes

Update this table with your Actual Budget account names and UUIDs. Run `node setup/discover-accounts.js` to find your values.

| Code | Account Name | Default For |
|------|-------------|-------------|
| YOUR_ACCOUNT_1 | Checking | Daily expenses (DEFAULT) |
| YOUR_ACCOUNT_2 | Savings | Savings & emergency fund |
| YOUR_ACCOUNT_3 | Credit Card | Credit card purchases |
| YOUR_ACCOUNT_4 | Investment | Investment account (off-budget) |

## Actual Budget Connection

| Setting | Value |
|---------|-------|
| Server URL | `http://localhost:5006` (update in `config.json`) |
| Password | Stored in `config.json` (never commit this file) |
| Budget ID | Your budget's group ID (find via `discover-accounts.js`) |
| Config file | `/path/to/integrations/config.json` (update path) |

## Notes

- All amounts are in your local currency as configured in USER.md
- Amounts are stored internally as cents (multiplied by 100) by the API
- The `config.json` file is gitignored -- copy `config.example.json` and fill in your values
- After first sync, a local budget folder is created in `/tmp/actual-data/`
