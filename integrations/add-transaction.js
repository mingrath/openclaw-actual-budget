#!/usr/bin/env node
/**
 * Actual Budget - Add Transaction
 *
 * Adds a single transaction to your Actual Budget instance via the API.
 *
 * Usage:
 *   node add-transaction.js '{"amount":-90,"payee":"Restaurant","notes":"lunch","date":"2026-03-01","account":"Checking"}'
 *
 * Parameters (JSON):
 *   amount  - Transaction amount (negative = expense, positive = income)
 *   payee   - Payee / merchant name
 *   notes   - Optional description
 *   date    - YYYY-MM-DD format (defaults to today)
 *   account - Account nickname from ACCOUNTS map (defaults to 'Checking')
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

// The local budget folder name created after first sync/download.
// Check your dataDir (e.g. /tmp/actual-data/) after running discover-accounts.js
// to find the folder name, which looks like 'My-Budget-abc1234'.
const BUDGET_LOCAL_ID = 'YOUR_BUDGET_LOCAL_FOLDER_ID';

async function addTransaction({ amount, payee, notes, date, account = 'Checking' }) {
  const dataDir = '/tmp/actual-data';
  fs.mkdirSync(dataDir, { recursive: true });

  await api.init({ serverURL: config.serverUrl, password: config.password, dataDir });
  await api.loadBudget(BUDGET_LOCAL_ID);

  const accountId = ACCOUNTS[account] || ACCOUNTS['Checking'];
  const amountCents = Math.round(parseFloat(amount) * 100);
  const txDate = date || new Date().toISOString().split('T')[0];

  const ids = await api.addTransactions(accountId, [{
    date: txDate,
    amount: amountCents,
    payee_name: payee || '',
    notes: notes || '',
    cleared: true,
  }]);

  await api.sync();
  await api.shutdown();
  return { ok: true, id: ids[0], account, amount: amountCents / 100, payee, date: txDate, notes };
}

// CLI mode
const input = process.argv[2];
if (input) {
  const params = JSON.parse(input);
  addTransaction(params)
    .then(r => console.log(JSON.stringify(r)))
    .catch(e => { console.error(JSON.stringify({ ok: false, error: e.message })); process.exit(1); });
}

module.exports = { addTransaction };
