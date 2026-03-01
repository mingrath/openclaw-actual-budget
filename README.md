# openclaw-actual-budget

A ready-to-fork template for building a **personal finance AI agent** with [OpenClaw](https://github.com/anthropics/openclaw) + [Actual Budget](https://actualbudget.org/) + Telegram.

Send your agent a bank slip photo or type "90 lunch" — it reads it, logs the transaction, and confirms. Ask "how much did I spend this month?" and it queries your budget instantly.

## What You Get

- **Receipt scanning** — Send a photo of a bank slip or receipt. The AI reads it (no OCR service needed) and extracts date, amount, payee, and account.
- **Quick text logging** — Type "90 lunch" or "grab 150" and it logs the expense.
- **Budget queries** — Ask for recent transactions, account balances, monthly summaries, or search by payee.
- **Multi-account support** — Track multiple bank accounts and credit cards.
- **Telegram interface** — Your agent lives in Telegram. Send it messages from anywhere.

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
