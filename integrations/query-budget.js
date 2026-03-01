#!/usr/bin/env node
/**
 * Actual Budget - Query Budget
 *
 * Query transactions, balances, and spending summaries from your Actual Budget.
 *
 * Commands:
 *   recent  - Get recent transactions (optionally filtered by account)
 *   balance - Get current balance for all accounts
 *   summary - Get spending summary by category for a given month
 *   search  - Search transactions by payee or notes text
 *
 * Usage:
 *   node query-budget.js '{"command":"recent","account":"Checking","limit":10}'
 *   node query-budget.js '{"command":"balance"}'
 *   node query-budget.js '{"command":"summary","month":"2026-03"}'
 *   node query-budget.js '{"command":"summary","month":"2026-03","account":"Credit Card"}'
 *   node query-budget.js '{"command":"search","query":"grocery","limit":20}'
 *
 * Setup:
 *   1. Copy config.example.json to config.json and fill in your credentials
 *   2. Run: node setup/discover-accounts.js to find your account UUIDs
 *   3. Update the ACCOUNTS map below with your real UUIDs
 *   4. Update MODULE_DIR to point to your @actual-app/api installation
 */

// Path to the directory containing @actual-app/api
// If you installed locally: './node_modules'
// If you share node_modules with another project, use an absolute path
const MODULE_DIR = './node_modules';
const api = require(require('path').join(MODULE_DIR, '@actual-app/api'));
const config = require('./config.json');
const fs = require('fs');

// -----------------------------------------------------------------------
// Replace these with your actual account UUIDs from Actual Budget.
// Run: node setup/discover-accounts.js to discover them automatically.
// The keys are friendly nicknames you'll use in the CLI command.
// -----------------------------------------------------------------------
const ACCOUNTS = {
  'Checking':    'YOUR_CHECKING_ACCOUNT_UUID',     // e.g. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  'Savings':     'YOUR_SAVINGS_ACCOUNT_UUID',
  'Credit Card': 'YOUR_CREDIT_CARD_ACCOUNT_UUID',
};

// Reverse lookup: UUID -> friendly account name
const ACCOUNT_NAMES = Object.fromEntries(
  Object.entries(ACCOUNTS).map(([k, v]) => [v, k])
);

/**
 * Initialize connection to Actual Budget server and download the budget.
 * Uses downloadBudget() which always fetches a fresh copy from the server.
 */
async function initBudget() {
  const dataDir = '/tmp/actual-data';
  fs.mkdirSync(dataDir, { recursive: true });
  await api.init({ serverURL: config.serverUrl, password: config.password, dataDir });
  await api.downloadBudget(config.budgetId);
}

/**
 * Get recent transactions, optionally filtered by account.
 *
 * @param {Object} params
 * @param {string} [params.account] - Account nickname to filter by (omit for all accounts)
 * @param {number} [params.limit=10] - Maximum number of transactions to return
 */
async function getRecentTransactions({ account, limit = 10 }) {
  await initBudget();
  const accountId = account ? ACCOUNTS[account] : null;
  let transactions;

  if (accountId) {
    transactions = await api.getTransactions(accountId, undefined, undefined);
  } else {
    // Fetch from all accounts
    const allTx = [];
    for (const [code, id] of Object.entries(ACCOUNTS)) {
      const txs = await api.getTransactions(id, undefined, undefined);
      allTx.push(...txs.map(t => ({ ...t, accountCode: code })));
    }
    transactions = allTx;
  }

  // Sort by date descending, take the most recent
  transactions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  transactions = transactions.slice(0, limit).map(t => ({
    date: t.date,
    amount: (t.amount || 0) / 100,
    payee: t.payee_name || t.payee || '',
    notes: t.notes || '',
    account: t.accountCode || ACCOUNT_NAMES[t.account] || t.account,
    category: t.category || '',
    cleared: t.cleared,
  }));

  await api.shutdown();
  return { ok: true, command: 'recent', count: transactions.length, transactions };
}

/**
 * Get the current balance for every account.
 * Balance is calculated as the sum of all transaction amounts.
 */
async function getBalance() {
  await initBudget();
  const balances = {};
  for (const [code, id] of Object.entries(ACCOUNTS)) {
    const txs = await api.getTransactions(id, undefined, undefined);
    balances[code] = txs.reduce((sum, t) => sum + (t.amount || 0), 0) / 100;
  }
  await api.shutdown();
  return { ok: true, command: 'balance', balances };
}

/**
 * Get a spending summary for a given month, grouped by category.
 *
 * @param {Object} params
 * @param {string} [params.month] - Month in YYYY-MM format (defaults to current month)
 * @param {string} [params.account] - Account nickname to filter by (omit for all accounts)
 */
async function getSummary({ month, account }) {
  await initBudget();
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const startDate = targetMonth.replace('-', '') + '01';
  const endMonth = parseInt(targetMonth.split('-')[1]);
  const endYear = parseInt(targetMonth.split('-')[0]);
  const lastDay = new Date(endYear, endMonth, 0).getDate();
  const endDate = targetMonth.replace('-', '') + String(lastDay).padStart(2, '0');

  const allTx = [];
  const accountEntries = account
    ? [[account, ACCOUNTS[account]]]
    : Object.entries(ACCOUNTS);

  for (const [code, id] of accountEntries) {
    if (!id) continue;
    const txs = await api.getTransactions(id, startDate, endDate);
    allTx.push(...txs.map(t => ({ ...t, accountCode: code })));
  }

  const byCategory = {};
  let totalExpense = 0, totalIncome = 0;
  for (const t of allTx) {
    const cat = t.category || 'Uncategorized';
    const amt = (t.amount || 0) / 100;
    if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 };
    byCategory[cat].total += amt;
    byCategory[cat].count += 1;
    if (amt < 0) totalExpense += amt; else totalIncome += amt;
  }

  await api.shutdown();
  return {
    ok: true,
    command: 'summary',
    month: targetMonth,
    totalExpense,
    totalIncome,
    net: totalIncome + totalExpense,
    transactionCount: allTx.length,
    byCategory,
  };
}

/**
 * Search transactions across all accounts by payee or notes text.
 *
 * @param {Object} params
 * @param {string} params.query - Text to search for (case-insensitive)
 * @param {number} [params.limit=20] - Maximum number of results to return
 */
async function searchTransactions({ query, limit = 20 }) {
  await initBudget();
  const allTx = [];
  for (const [code, id] of Object.entries(ACCOUNTS)) {
    const txs = await api.getTransactions(id, undefined, undefined);
    allTx.push(...txs.map(t => ({ ...t, accountCode: code })));
  }

  const q = (query || '').toLowerCase();
  const matches = allTx
    .filter(t => {
      const payee = (t.payee_name || t.payee || '').toLowerCase();
      const notes = (t.notes || '').toLowerCase();
      return payee.includes(q) || notes.includes(q);
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, limit)
    .map(t => ({
      date: t.date,
      amount: (t.amount || 0) / 100,
      payee: t.payee_name || t.payee || '',
      notes: t.notes || '',
      account: t.accountCode,
    }));

  await api.shutdown();
  return { ok: true, command: 'search', query, count: matches.length, transactions: matches };
}

// CLI mode - dispatch to the appropriate command handler
const input = process.argv[2];
if (input) {
  const params = JSON.parse(input);
  const handlers = {
    recent: getRecentTransactions,
    balance: getBalance,
    summary: getSummary,
    search: searchTransactions,
  };
  const handler = handlers[params.command];
  if (!handler) {
    console.error(JSON.stringify({
      ok: false,
      error: `Unknown command: ${params.command}. Use: recent, balance, summary, search`,
    }));
    process.exit(1);
  }
  handler(params)
    .then(r => console.log(JSON.stringify(r, null, 2)))
    .catch(e => { console.error(JSON.stringify({ ok: false, error: e.message })); process.exit(1); });
}

module.exports = { getRecentTransactions, getBalance, getSummary, searchTransactions };
