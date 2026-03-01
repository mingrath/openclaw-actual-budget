#!/usr/bin/env node
/**
 * Actual Budget - Query Transactions
 *
 * Queries your Actual Budget instance for transaction data.
 *
 * Usage:
 *   node query-budget.js '{"command":"recent","limit":10}'
 *   node query-budget.js '{"command":"category","startDate":"2026-03-01","endDate":"2026-03-31"}'
 *   node query-budget.js '{"command":"total","startDate":"2026-03-01","endDate":"2026-03-31"}'
 *   node query-budget.js '{"command":"search","payee":"Coffee","limit":20}'
 *
 * Commands:
 *   recent   - Get the most recent N transactions (default limit: 10)
 *   category - Spending breakdown by category for a date range
 *   total    - Total spending for a date range
 *   search   - Search transactions by payee name
 *
 * Setup:
 *   1. Copy config.example.json to config.json in the integrations/ directory
 *   2. Run: node setup/discover-accounts.js to find your account UUIDs
 *   3. Update the ACCOUNTS map below with your real UUIDs
 *   4. Update the config path below to point to your integrations/ directory
 */

const path = require('path');
const fs = require('fs');

// -----------------------------------------------------------------------
// UPDATE THIS PATH to point to your integrations/config.json
// Example: '/home/youruser/openclaw-actual-budget/integrations/config.json'
// -----------------------------------------------------------------------
const config = require('/path/to/integrations/config.json'); // Update this path

// Path to the directory containing @actual-app/api
// If you installed locally: use a path relative to the integrations/ directory
// or an absolute path to your node_modules
const MODULE_DIR = path.resolve(__dirname, '../../node_modules');
const api = require(path.join(MODULE_DIR, '@actual-app/api'));

// -----------------------------------------------------------------------
// Replace these with your actual account UUIDs from Actual Budget.
// Run: node setup/discover-accounts.js to discover them automatically.
// The keys are friendly nicknames you'll use in queries.
// -----------------------------------------------------------------------
const ACCOUNTS = {
  'Checking':    'YOUR_CHECKING_ACCOUNT_UUID',     // e.g. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  'Savings':     'YOUR_SAVINGS_ACCOUNT_UUID',
  'Credit Card': 'YOUR_CREDIT_CARD_ACCOUNT_UUID',
};

// The local budget folder name created after first sync/download.
// Check your dataDir (e.g. /tmp/actual-data/) after running discover-accounts.js
// to find the folder name, which looks like 'My-Budget-abc1234'.
const BUDGET_LOCAL_ID = 'YOUR_BUDGET_LOCAL_FOLDER_ID';

async function initAPI() {
  const dataDir = '/tmp/actual-data';
  fs.mkdirSync(dataDir, { recursive: true });
  await api.init({ serverURL: config.serverUrl, password: config.password, dataDir });
  await api.loadBudget(BUDGET_LOCAL_ID);
}

// ---------------------
// Command: recent
// ---------------------
async function getRecent(limit = 10) {
  await initAPI();

  // Query all accounts for recent transactions
  const accounts = await api.getAccounts();
  let allTransactions = [];

  for (const acct of accounts) {
    const txns = await api.getTransactions(acct.id);
    for (const t of txns) {
      allTransactions.push({
        date: t.date,
        amount: t.amount / 100,
        payee: t.payee_name || t.payee || '',
        notes: t.notes || '',
        account: acct.name,
        cleared: t.cleared,
      });
    }
  }

  // Sort by date descending, then take the limit
  allTransactions.sort((a, b) => b.date.localeCompare(a.date));
  const result = allTransactions.slice(0, limit);

  await api.shutdown();
  return result;
}

// ---------------------
// Command: category
// ---------------------
async function getCategorySpending(startDate, endDate) {
  await initAPI();

  const accounts = await api.getAccounts();
  const categories = {};

  for (const acct of accounts) {
    const txns = await api.getTransactions(acct.id);
    for (const t of txns) {
      if (t.date >= startDate && t.date <= endDate && t.amount < 0) {
        const cat = t.category || 'Uncategorized';
        categories[cat] = (categories[cat] || 0) + t.amount;
      }
    }
  }

  // Convert to array and sort by amount (most spent first)
  const result = Object.entries(categories)
    .map(([category, amount]) => ({ category, amount: amount / 100 }))
    .sort((a, b) => a.amount - b.amount);

  await api.shutdown();
  return result;
}

// ---------------------
// Command: total
// ---------------------
async function getTotal(startDate, endDate) {
  await initAPI();

  const accounts = await api.getAccounts();
  let totalExpenses = 0;
  let totalIncome = 0;
  let txCount = 0;

  for (const acct of accounts) {
    const txns = await api.getTransactions(acct.id);
    for (const t of txns) {
      if (t.date >= startDate && t.date <= endDate) {
        txCount++;
        if (t.amount < 0) {
          totalExpenses += t.amount;
        } else {
          totalIncome += t.amount;
        }
      }
    }
  }

  await api.shutdown();
  return {
    period: `${startDate} to ${endDate}`,
    expenses: totalExpenses / 100,
    income: totalIncome / 100,
    net: (totalIncome + totalExpenses) / 100,
    transactionCount: txCount,
  };
}

// ---------------------
// Command: search
// ---------------------
async function searchByPayee(payee, limit = 20) {
  await initAPI();

  const accounts = await api.getAccounts();
  const matches = [];
  const searchTerm = payee.toLowerCase();

  for (const acct of accounts) {
    const txns = await api.getTransactions(acct.id);
    for (const t of txns) {
      const payeeName = (t.payee_name || t.payee || '').toLowerCase();
      if (payeeName.includes(searchTerm)) {
        matches.push({
          date: t.date,
          amount: t.amount / 100,
          payee: t.payee_name || t.payee || '',
          notes: t.notes || '',
          account: acct.name,
        });
      }
    }
  }

  matches.sort((a, b) => b.date.localeCompare(a.date));
  const result = matches.slice(0, limit);

  await api.shutdown();
  return result;
}

// ---------------------
// CLI entry point
// ---------------------
const input = process.argv[2];
if (!input) {
  console.error('Usage: node query-budget.js \'{"command":"recent","limit":10}\'');
  console.error('Commands: recent, category, total, search');
  process.exit(1);
}

const params = JSON.parse(input);

(async () => {
  let result;
  switch (params.command) {
    case 'recent':
      result = await getRecent(params.limit || 10);
      break;
    case 'category':
      if (!params.startDate || !params.endDate) {
        console.error('Error: category command requires startDate and endDate');
        process.exit(1);
      }
      result = await getCategorySpending(params.startDate, params.endDate);
      break;
    case 'total':
      if (!params.startDate || !params.endDate) {
        console.error('Error: total command requires startDate and endDate');
        process.exit(1);
      }
      result = await getTotal(params.startDate, params.endDate);
      break;
    case 'search':
      if (!params.payee) {
        console.error('Error: search command requires payee');
        process.exit(1);
      }
      result = await searchByPayee(params.payee, params.limit || 20);
      break;
    default:
      console.error(`Unknown command: ${params.command}`);
      console.error('Available commands: recent, category, total, search');
      process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
})().catch(e => {
  console.error(JSON.stringify({ ok: false, error: e.message }));
  process.exit(1);
});
