#!/usr/bin/env node

const service = require('./budget-service');

const [,, command, ...args] = process.argv;

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      parsed[key] = args[i + 1] || true;
      i++;
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`
Caitlin Budget - Personal Budgeting App

Usage: budget <command> [options]

Commands:
  add-category --name <name>
      Add a spending category

  list-categories
      List all categories

  add-income --amount <n> --description <text> [--category <name>]
      Record income

  add-expense --amount <n> --description <text> [--category <name>]
      Record an expense

  list-transactions [--month YYYY-MM] [--type income|expense]
      List transactions

  set-budget --category <name> --limit <n> [--month YYYY-MM]
      Set a monthly budget for a category

  summary [--month YYYY-MM]
      Show monthly summary with budget status

  help
      Show this help message
`);
}

try {
  switch (command) {
    case 'add-category': {
      const opts = parseArgs(args);
      if (!opts.name) {
        console.error('Error: --name is required');
        process.exit(1);
      }
      const cat = service.addCategory(opts.name);
      console.log(`Category added: ${cat.name}`);
      break;
    }

    case 'list-categories': {
      const categories = service.listCategories();
      if (categories.length === 0) {
        console.log('No categories yet. Use add-category to create one.');
      } else {
        console.log('Categories:');
        for (const c of categories) {
          console.log(`  - ${c.name}`);
        }
      }
      break;
    }

    case 'add-income': {
      const opts = parseArgs(args);
      if (!opts.amount) {
        console.error('Error: --amount is required');
        process.exit(1);
      }
      const t = service.addTransaction({
        amount: parseFloat(opts.amount),
        description: opts.description || '',
        category: opts.category || null,
        type: 'income',
      });
      console.log(`Income recorded: ${formatCurrency(t.amount)} - ${t.description}`);
      break;
    }

    case 'add-expense': {
      const opts = parseArgs(args);
      if (!opts.amount) {
        console.error('Error: --amount is required');
        process.exit(1);
      }
      const t = service.addTransaction({
        amount: parseFloat(opts.amount),
        description: opts.description || '',
        category: opts.category || null,
        type: 'expense',
      });
      console.log(`Expense recorded: ${formatCurrency(t.amount)} - ${t.description}`);
      break;
    }

    case 'list-transactions': {
      const opts = parseArgs(args);
      const transactions = service.listTransactions({
        month: opts.month,
        type: opts.type,
      });
      if (transactions.length === 0) {
        console.log('No transactions found.');
      } else {
        const categories = service.listCategories();
        console.log('Transactions:');
        for (const t of transactions) {
          const cat = categories.find((c) => c.id === t.categoryId);
          const catLabel = cat ? ` [${cat.name}]` : '';
          const sign = t.type === 'income' ? '+' : '-';
          console.log(
            `  ${t.date.slice(0, 10)}  ${sign}${formatCurrency(t.amount)}  ${t.description}${catLabel}`
          );
        }
      }
      break;
    }

    case 'set-budget': {
      const opts = parseArgs(args);
      if (!opts.category || !opts.limit) {
        console.error('Error: --category and --limit are required');
        process.exit(1);
      }
      const b = service.setBudget({
        category: opts.category,
        limit: parseFloat(opts.limit),
        month: opts.month,
      });
      console.log(
        `Budget set: ${formatCurrency(b.limit)}/month for ${opts.category} (${b.month})`
      );
      break;
    }

    case 'summary': {
      const opts = parseArgs(args);
      const s = service.getSummary(opts.month);
      console.log(`\n=== Budget Summary for ${s.month} ===\n`);
      console.log(`  Income:   ${formatCurrency(s.totalIncome)}`);
      console.log(`  Expenses: ${formatCurrency(s.totalExpenses)}`);
      console.log(`  Balance:  ${formatCurrency(s.balance)}\n`);

      if (Object.keys(s.byCategory).length > 0) {
        console.log('  Spending by Category:');
        for (const [cat, amount] of Object.entries(s.byCategory)) {
          console.log(`    ${cat}: ${formatCurrency(amount)}`);
        }
        console.log();
      }

      if (s.budgetStatus.length > 0) {
        console.log('  Budget Status:');
        for (const b of s.budgetStatus) {
          const status = b.overBudget ? 'OVER BUDGET' : 'OK';
          console.log(
            `    ${b.category}: ${formatCurrency(b.spent)} / ${formatCurrency(b.limit)} (${status})`
          );
        }
        console.log();
      }
      break;
    }

    case 'help':
    case undefined:
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
