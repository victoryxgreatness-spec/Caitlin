const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function clearData() {
  for (const file of ['categories', 'transactions', 'budgets']) {
    const fp = path.join(DATA_DIR, `${file}.json`);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
}

// Re-require fresh module for each test suite
function loadService() {
  // Clear the require cache so storage reads fresh files
  delete require.cache[require.resolve('../src/budget-service')];
  delete require.cache[require.resolve('../src/storage')];
  return require('../src/budget-service');
}

describe('Categories', () => {
  beforeEach(() => clearData());

  it('should add and list categories', () => {
    const service = loadService();
    service.addCategory('Food');
    service.addCategory('Transport');
    const cats = service.listCategories();
    assert.equal(cats.length, 2);
    assert.equal(cats[0].name, 'Food');
    assert.equal(cats[1].name, 'Transport');
  });

  it('should reject duplicate category names', () => {
    const service = loadService();
    service.addCategory('Food');
    assert.throws(() => service.addCategory('food'), /already exists/);
  });

  it('should find a category by name', () => {
    const service = loadService();
    const created = service.addCategory('Rent');
    const found = service.findCategory('Rent');
    assert.equal(found.id, created.id);
  });
});

describe('Transactions', () => {
  beforeEach(() => clearData());

  it('should add income', () => {
    const service = loadService();
    const t = service.addTransaction({
      amount: 3000,
      description: 'Salary',
      type: 'income',
    });
    assert.equal(t.type, 'income');
    assert.equal(t.amount, 3000);
  });

  it('should add expense with category', () => {
    const service = loadService();
    service.addCategory('Food');
    const t = service.addTransaction({
      amount: 45.5,
      description: 'Groceries',
      category: 'Food',
      type: 'expense',
    });
    assert.equal(t.type, 'expense');
    assert.ok(t.categoryId);
  });

  it('should reject expense with unknown category', () => {
    const service = loadService();
    assert.throws(
      () =>
        service.addTransaction({
          amount: 10,
          description: 'test',
          category: 'Nonexistent',
          type: 'expense',
        }),
      /not found/
    );
  });

  it('should filter transactions by type', () => {
    const service = loadService();
    service.addTransaction({ amount: 100, type: 'income', description: 'a' });
    service.addTransaction({ amount: 50, type: 'expense', description: 'b' });
    service.addTransaction({ amount: 200, type: 'income', description: 'c' });

    const income = service.listTransactions({ type: 'income' });
    assert.equal(income.length, 2);

    const expenses = service.listTransactions({ type: 'expense' });
    assert.equal(expenses.length, 1);
  });
});

describe('Budgets', () => {
  beforeEach(() => clearData());

  it('should set a budget for a category', () => {
    const service = loadService();
    service.addCategory('Food');
    const b = service.setBudget({ category: 'Food', limit: 500 });
    assert.equal(b.limit, 500);
    assert.ok(b.month);
  });

  it('should replace budget for same category and month', () => {
    const service = loadService();
    service.addCategory('Food');
    service.setBudget({ category: 'Food', limit: 500, month: '2026-02' });
    service.setBudget({ category: 'Food', limit: 600, month: '2026-02' });
    const budgets = service.listBudgets('2026-02');
    assert.equal(budgets.length, 1);
    assert.equal(budgets[0].limit, 600);
  });
});

describe('Summary', () => {
  beforeEach(() => clearData());

  it('should compute correct totals', () => {
    const service = loadService();
    service.addCategory('Food');
    service.addTransaction({ amount: 3000, type: 'income', description: 'Salary' });
    service.addTransaction({
      amount: 150,
      type: 'expense',
      description: 'Groceries',
      category: 'Food',
    });
    service.addTransaction({
      amount: 50,
      type: 'expense',
      description: 'Takeout',
      category: 'Food',
    });
    service.setBudget({ category: 'Food', limit: 300 });

    const summary = service.getSummary();
    assert.equal(summary.totalIncome, 3000);
    assert.equal(summary.totalExpenses, 200);
    assert.equal(summary.balance, 2800);
    assert.equal(summary.byCategory['Food'], 200);
    assert.equal(summary.budgetStatus.length, 1);
    assert.equal(summary.budgetStatus[0].overBudget, false);
    assert.equal(summary.budgetStatus[0].remaining, 100);
  });

  it('should detect over-budget spending', () => {
    const service = loadService();
    service.addCategory('Entertainment');
    service.setBudget({ category: 'Entertainment', limit: 100 });
    service.addTransaction({
      amount: 150,
      type: 'expense',
      description: 'Concert',
      category: 'Entertainment',
    });

    const summary = service.getSummary();
    assert.equal(summary.budgetStatus[0].overBudget, true);
  });
});
