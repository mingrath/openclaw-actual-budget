# openclaw-actual-budget

> **Your personal finance AI agent** — scan receipts, track expenses, query budgets. All from Telegram.

Built with [OpenClaw](https://github.com/anthropics/openclaw) + [Actual Budget](https://actualbudget.org/) + Telegram.

---

## Demo

![Demo](demo.gif)

> [Watch full video (MP4)](demo.mp4)

### 1. Scan a Receipt

Send a photo of a bank slip or receipt — the AI reads it and logs it automatically.

```
┌─────────────────────────────────────────┐
│  You:                                   │
│  📷 [bank_transfer_receipt.jpg]         │
│                                         │
│  Penny:                                 │
│  ✅ Logged!                             │
│  📅 01 Mar | 💸 -$42.50                 │
│  🏪 Whole Foods Market | 🏦 Checking    │
│  📝 Ref: TXN-20260301-8847             │
└─────────────────────────────────────────┘
```

### 2. Quick Text Logging

Just type the amount and what it was for.

```
┌─────────────────────────────────────────┐
│  You:  90 lunch                         │
│                                         │
│  Penny:                                 │
│  ✅ Logged!                             │
│  📅 01 Mar | 💸 -$90.00                 │
│  🏪 lunch | 🏦 Checking                 │
├─────────────────────────────────────────┤
│  You:  grab 150                         │
│                                         │
│  Penny:                                 │
│  ✅ Logged!                             │
│  📅 01 Mar | 💸 -$150.00                │
│  🏪 Grab | 🏦 Checking                  │
├─────────────────────────────────────────┤
│  You:  salary 5000 income Savings       │
│                                         │
│  Penny:                                 │
│  ✅ Logged!                             │
│  📅 01 Mar | 💰 +$5,000.00              │
│  🏪 Salary | 🏦 Savings                 │
└─────────────────────────────────────────┘
```

### 3. Ask About Your Spending

```
┌─────────────────────────────────────────┐
│  You:  how much did I spend this month? │
│                                         │
│  Penny:                                 │
│  📊 March 2026 Summary                  │
│                                         │
│  💸 Expenses:  -$2,847.50               │
│  💰 Income:    +$5,000.00               │
│  📈 Net:       +$2,152.50               │
│                                         │
│  Top categories:                        │
│  🍔 Food:        -$890.00  (31%)        │
│  🚗 Transport:   -$650.00  (23%)        │
│  🛒 Shopping:    -$520.00  (18%)        │
│  💡 Bills:       -$487.50  (17%)        │
│  🎬 Fun:         -$300.00  (11%)        │
├─────────────────────────────────────────┤
│  You:  what's my balance?               │
│                                         │
│  Penny:                                 │
│  🏦 Account Balances                    │
│                                         │
│  Checking:     $12,450.00               │
│  Savings:      $45,000.00               │
│  Credit Card:     -$273.58              │
└─────────────────────────────────────────┘
```

---

## How It Works

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌───────────────┐
│          │     │          │     │              │     │               │
│ Telegram │────▶│ OpenClaw │────▶│  AI Agent    │────▶│ Actual Budget │
│   App    │◀────│  Server  │◀────│  (Penny)     │◀────│   (SQLite)    │
│          │     │          │     │              │     │               │
└──────────┘     └──────────┘     └──────────────┘     └───────────────┘
   phone            router          reads images          stores data
                                    parses text           runs queries
                                    calls scripts         syncs budgets
```

1. **You** send a receipt photo or text to your Telegram bot
2. **OpenClaw** routes it to your budget agent
3. **The agent** reads the image (no OCR needed — the AI IS the OCR), extracts transaction details
4. **add-transaction.js** logs it in Actual Budget
5. **The agent** confirms with a clean summary

---

## What You Get

- **Receipt scanning** — Send a photo of any bank slip or receipt. The AI reads it directly and extracts date, amount, payee, and account.
- **Quick text logging** — Type "90 lunch" or "grab 150" and it logs the expense instantly.
- **Budget queries** — Recent transactions, account balances, monthly summaries, or search by payee.
- **Multi-account support** — Track checking, savings, credit cards — as many accounts as you need.
- **Telegram interface** — Works from your phone, anywhere. No app to install.
- **Self-hosted** — Your financial data stays on your server. No cloud services.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (for Actual Budget server)
- [Node.js](https://nodejs.org/) v18+ (for integration scripts)
- [OpenClaw](https://github.com/anthropics/openclaw) installed and configured
- A Telegram account

## Quick Start

### Step 1: Start Actual Budget

```bash
cd setup/
docker compose up -d
```

This starts Actual Budget at `http://localhost:5006`. Open it in your browser, create a password, and set up a budget with your bank accounts.

> **Safari users:** If you see a SharedArrayBuffer error when accessing from another device, uncomment the Caddy section in `docker-compose.yml` for HTTPS support, or click "Advanced options" on the error page.

### Step 2: Install the API Package

```bash
cd integrations/
npm init -y
npm install @actual-app/api
```

### Step 3: Discover Your Account IDs

```bash
ACTUAL_PASSWORD=yourpass node setup/discover-accounts.js
```

This prints your budget IDs and account UUIDs. You'll need these for the next step.

Example output:
```
=== Available Budgets ===

  Name:     My Budget 2026
  Group ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  <-- use this as "budgetId" in config.json

=== Accounts ===

  const ACCOUNTS = {
    'Checking': 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    'Savings':  'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
    'Credit':   'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
  };
```

### Step 4: Configure Integration Scripts

```bash
cd integrations/
cp config.example.json config.json
```

Edit `config.json` with your Actual Budget password and budget ID from Step 3.

Then update the `ACCOUNTS` object and `BUDGET_LOCAL_ID` in:
- `integrations/add-transaction.js`
- `integrations/query-budget.js`
- `workspace/skills/budget/query-budget.js`

### Step 5: Create a Telegram Bot

1. Open Telegram, search for **@BotFather**
2. Send `/newbot`
3. Choose a name and username (must end with `_bot`)
4. Copy the **bot token**

### Step 6: Register the Agent in OpenClaw

Add these entries to your `~/.openclaw/openclaw.json`:

**Agent entry** (in `agents.list`):
```json
{
  "id": "budget-bot",
  "name": "Budget Bot",
  "workspace": "/path/to/workspace",
  "agentDir": "/path/to/agents/budget-bot/agent"
}
```

**Telegram binding** (in `bindings`):
```json
{
  "agentId": "budget-bot",
  "match": {
    "channel": "telegram",
    "accountId": "budget-bot"
  }
}
```

**Telegram account** (in `channels.telegram.accounts`):
```json
"budget-bot": {
  "dmPolicy": "pairing",
  "botToken": "YOUR_BOT_TOKEN_HERE",
  "groupPolicy": "open",
  "streaming": "partial"
}
```

### Step 7: Deploy the Workspace

Copy the workspace files to your OpenClaw workspace directory:

```bash
cp -r workspace/ ~/.openclaw/workspace-budget-bot/
```

Update the file paths in your workspace files:
- `TOOLS.md` — update integration paths and account UUIDs
- `AGENTS.md` — update tool command paths
- `skills/budget/SKILL.md` — update tool command paths
- `skills/budget/query-budget.js` — update config path
- `skills/receipt-parser/SKILL.md` — update add-transaction path

### Step 8: Test

```bash
# Test adding a transaction
node integrations/add-transaction.js '{"amount":-50,"payee":"Test","notes":"setup test","account":"Checking"}'

# Test querying
node integrations/query-budget.js '{"command":"recent","limit":5}'

# Test balance
node integrations/query-budget.js '{"command":"balance"}'
```

Then restart OpenClaw and message your bot on Telegram. Send `/pair` to pair your account.

## Customization

### Agent Personality

Edit `workspace/SOUL.md` to change the agent's name, personality, and response style.

### Bank Slip Detection

Edit `workspace/skills/receipt-parser/SKILL.md` to add your country's bank slip formats, colors, and logos.

### Accounts & Categories

Update the accounts table in `workspace/AGENTS.md` and the categories list to match your budget setup.

### Currency

Update `workspace/USER.md` with your currency symbol and timezone.

## Project Structure

```
├── README.md                          # This file
├── workspace/                         # Agent workspace (copy to ~/.openclaw/)
│   ├── SOUL.md                        # Agent personality
│   ├── AGENTS.md                      # Agent protocols
│   ├── USER.md                        # User profile
│   ├── TOOLS.md                       # Environment config
│   ├── IDENTITY.md                    # Quick reference
│   ├── HEARTBEAT.md                   # Background checks (empty)
│   └── skills/
│       ├── receipt-parser/SKILL.md    # Receipt/slip reading protocol
│       └── budget/
│           ├── SKILL.md               # Budget query protocol
│           └── query-budget.js        # Query script
├── integrations/
│   ├── config.example.json            # Config template (copy to config.json)
│   ├── add-transaction.js             # Add transactions to Actual Budget
│   └── query-budget.js                # Query transactions
└── setup/
    ├── discover-accounts.js           # Find budget IDs & account UUIDs
    └── docker-compose.yml             # Actual Budget + optional HTTPS
```

## How It Works

1. You send a bank slip photo or text like "90 lunch" to your Telegram bot
2. OpenClaw routes the message to your agent
3. The agent reads the image (it IS the OCR — no external service needed) or parses the text
4. It calls `add-transaction.js` to log the transaction in Actual Budget
5. It confirms with a clean summary

For queries, the agent calls `query-budget.js` with commands like `recent`, `balance`, `summary`, or `search`.

## License

MIT
