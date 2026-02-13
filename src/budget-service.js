const storage = require('./storage');
const { createCategory, createTransaction, createBudget } = require('./models');

// --- Categories ---

function addCategory(name) {
  const categories = storage.load('categories');
  const exists = categories.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) {
    throw new Error(`Category "${name}" already exists`);
  }
  const category = createCategory(name);
  categories.push(category);
  storage.save('categories', categories);
  return category;
}

function listCategories() {
  return storage.load('categories');
}

function findCategory(nameOrId) {
  const categories = storage.load('categories');
  return categories.find(
    (c) =>
      c.id === nameOrId || c.name.toLowerCase() === nameOrId.toLowerCase()
  );
}

// --- Transactions ---

function addTransaction({ amount, description, category, type }) {
  let categoryId = null;
  if (category) {
    const cat = findCategory(category);
    if (!cat) {
      throw new Error(`Category "${category}" not found`);
    }
    categoryId = cat.id;
  }
  const transaction = createTransaction({
    amount,
    description,
    categoryId,
    type,
  });
  const transactions = storage.load('transactions');
  transactions.push(transaction);
  storage.save('transactions', transactions);
  return transaction;
}

function listTransactions({ month, type, categoryId } = {}) {
  let transactions = storage.load('transactions');

  if (month) {
    transactions = transactions.filter((t) => t.date.startsWith(month));
  }
  if (type) {
    transactions = transactions.filter((t) => t.type === type);
  }
  if (categoryId) {
    transactions = transactions.filter((t) => t.categoryId === categoryId);
  }

  return transactions;
}

// --- Budgets ---

function setBudget({ category, limit, month }) {
  const cat = findCategory(category);
  if (!cat) {
    throw new Error(`Category "${category}" not found`);
  }
  const budget = createBudget({ categoryId: cat.id, limit, month });
  const budgets = storage.load('budgets');

  // Replace existing budget for the same category+month
  const idx = budgets.findIndex(
    (b) => b.categoryId === cat.id && b.month === budget.month
  );
  if (idx >= 0) {
    budgets[idx] = budget;
  } else {
    budgets.push(budget);
  }

  storage.save('budgets', budgets);
  return budget;
}

function listBudgets(month) {
  const budgets = storage.load('budgets');
  if (month) {
    return budgets.filter((b) => b.month === month);
  }
  return budgets;
}

// --- Summary ---

function getSummary(month) {
  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const transactions = listTransactions({ month: currentMonth });
  const categories = listCategories();
  const budgets = listBudgets(currentMonth);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const byCategory = {};
  for (const t of transactions.filter((t) => t.type === 'expense')) {
    const cat = categories.find((c) => c.id === t.categoryId);
    const catName = cat ? cat.name : 'Uncategorized';
    byCategory[catName] = (byCategory[catName] || 0) + t.amount;
  }

  const budgetStatus = budgets.map((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    const catName = cat ? cat.name : 'Unknown';
    const spent = byCategory[catName] || 0;
    return {
      category: catName,
      limit: b.limit,
      spent,
      remaining: b.limit - spent,
      overBudget: spent > b.limit,
    };
  });

  return {
    month: currentMonth,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    byCategory,
    budgetStatus,
  };
}

module.exports = {
  addCategory,
  listCategories,
  findCategory,
  addTransaction,
  listTransactions,
  setBudget,
  listBudgets,
  getSummary,
};
