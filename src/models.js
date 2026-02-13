const crypto = require('crypto');

function generateId() {
  return crypto.randomUUID();
}

function createCategory(name) {
  return {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
  };
}

function createTransaction({ amount, description, categoryId, type }) {
  if (type !== 'income' && type !== 'expense') {
    throw new Error('Transaction type must be "income" or "expense"');
  }
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  return {
    id: generateId(),
    amount,
    description: description || '',
    categoryId: categoryId || null,
    type,
    date: new Date().toISOString(),
  };
}

function createBudget({ categoryId, limit, month }) {
  if (typeof limit !== 'number' || limit <= 0) {
    throw new Error('Budget limit must be a positive number');
  }
  const budgetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
  return {
    id: generateId(),
    categoryId,
    limit,
    month: budgetMonth,
    createdAt: new Date().toISOString(),
  };
}

module.exports = { createCategory, createTransaction, createBudget };
