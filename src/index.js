#!/usr/bin/env node

const service = require('./lifecycle-service');

const [,, command, ...args] = process.argv;

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed[key] = args[i + 1];
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

function formatPercent(n) {
  return `${n.toFixed(1)}%`;
}

function formatUsage(value, unit) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;
}

function formatDate(date) {
  if (!date) return 'unknown';
  return new Date(date).toISOString().slice(0, 10);
}

function urgencyLabel(pct) {
  if (pct <= 10) return '[CRITICAL]';
  if (pct <= 20) return '[WARNING] ';
  if (pct <= 40) return '[LOW]     ';
  return '[OK]      ';
}

function printHelp() {
  console.log(`
Lifecycle Tracker - Physical Item Depreciation & Replacement Tracker

Usage: lifecycle <command> [options]

Item Database:
  list-db-items [--category automotive|footwear]
      Browse pre-populated item specs

Groups:
  add-group --name <name> --type vehicle|person|category
            [--make <make> --model <model> --year <year>]
      Create a group (e.g., a vehicle or a person)

  list-groups
      List all groups

Items:
  add-item --name <name> --category automotive|footwear
           --price <n> --lifespan <n> --unit miles|km|cycles|days|hours
           [--group <name>] [--usage-at-install <n>]
           [--labor <n>] [--purchase-date YYYY-MM-DD] [--db-item <id>]
      Add an item to your inventory

  list-items [--group <name>] [--category automotive|footwear]
      List active inventory items

  item-status --item <name>
      Show full lifecycle status for an item

Usage Logging:
  log-usage --item <name> --usage <current-total> [--note <text>]
      Record current usage (e.g., current odometer reading, total miles on shoes)

Reminders:
  set-reminder --item <name> --type percentage|usage_remaining|date
               --value <n|YYYY-MM-DD>
      Set a reminder threshold (e.g., alert at 20% life remaining)

  check-reminders
      Show items that have crossed their reminder threshold

Replacement:
  replace --item <name> [--notes <text>]
      Archive an item as replaced

  new-cycle --previous-item-id <id> [--price <n>]
            [--usage-at-install <n>] [--labor <n>]
            [--purchase-date YYYY-MM-DD] [--notes <text>]
      Start a new replacement cycle for an item

History:
  history [--item <name>]
      View replacement history

Dashboard:
  dashboard
      All active items sorted by urgency (lowest life % first)

  help
      Show this help message
`);
}

try {
  switch (command) {
    case 'list-db-items': {
      const opts = parseArgs(args);
      const items = service.listDbItems({ category: opts.category });
      if (items.length === 0) {
        console.log('No items found in database.');
      } else {
        const catLabel = opts.category ? ` (${opts.category})` : '';
        console.log(`\nItem Database${catLabel}:\n`);
        for (const item of items) {
          console.log(`  [${item.id}]`);
          console.log(`    ${item.itemName}  (${item.category} / ${item.subcategory})`);
          console.log(
            `    Lifespan: ${item.lifespanMin.toLocaleString()}–${item.lifespanMax.toLocaleString()} ${item.usageUnit}` +
            ` (typical: ${item.lifespanTypical.toLocaleString()})`
          );
          console.log(`    Est. cost: $${item.avgCostLow}–$${item.avgCostHigh}`);
          console.log();
        }
      }
      break;
    }

    case 'add-group': {
      const opts = parseArgs(args);
      if (!opts.name || !opts.type) {
        console.error('Error: --name and --type are required');
        process.exit(1);
      }
      const metadata = {};
      if (opts.make) metadata.make = opts.make;
      if (opts.model) metadata.model = opts.model;
      if (opts.year) metadata.year = opts.year;
      const group = service.addGroup({ name: opts.name, type: opts.type, metadata });
      console.log(`Group added: "${group.name}" (${group.type})`);
      if (opts.make || opts.model || opts.year) {
        console.log(
          `  Vehicle: ${[metadata.year, metadata.make, metadata.model].filter(Boolean).join(' ')}`
        );
      }
      break;
    }

    case 'list-groups': {
      const groups = service.listGroups();
      if (groups.length === 0) {
        console.log('No groups yet. Use add-group to create one.');
      } else {
        console.log('\nGroups:\n');
        for (const g of groups) {
          const vehicleInfo =
            g.type === 'vehicle' && g.metadata
              ? `  — ${[g.metadata.year, g.metadata.make, g.metadata.model]
                  .filter(Boolean)
                  .join(' ')}`
              : '';
          console.log(`  ${g.name} (${g.type})${vehicleInfo}`);
        }
      }
      break;
    }

    case 'add-item': {
      const opts = parseArgs(args);
      if (!opts.name || !opts.category || !opts.price || !opts.lifespan || !opts.unit) {
        console.error(
          'Error: --name, --category, --price, --lifespan, and --unit are required'
        );
        process.exit(1);
      }
      const item = service.addItem({
        name: opts.name,
        category: opts.category,
        group: opts.group || null,
        dbItemId: opts['db-item'] || null,
        purchaseDate: opts['purchase-date'] || null,
        purchasePrice: parseFloat(opts.price),
        laborCost: opts.labor ? parseFloat(opts.labor) : 0,
        usageUnit: opts.unit,
        usageAtInstall: opts['usage-at-install'] ? parseFloat(opts['usage-at-install']) : 0,
        lifespanExpected: parseFloat(opts.lifespan),
        notes: opts.notes || '',
      });
      console.log(`Item added: "${item.name}"`);
      console.log(`  Category:         ${item.category}`);
      console.log(
        `  Expected lifespan: ${item.lifespanExpected.toLocaleString()} ${item.usageUnit}`
      );
      console.log(`  Purchase price:   $${item.purchasePrice.toFixed(2)}`);
      if (item.laborCost) console.log(`  Labor cost:       $${item.laborCost.toFixed(2)}`);
      if (item.groupId) {
        const grp = service.findGroup(item.groupId);
        if (grp) console.log(`  Group:            ${grp.name}`);
      }
      break;
    }

    case 'list-items': {
      const opts = parseArgs(args);
      const items = service.listItems({
        group: opts.group || null,
        category: opts.category || null,
      });
      if (items.length === 0) {
        console.log('No active items found. Use add-item to add one.');
      } else {
        const groups = service.listGroups();
        console.log('\nActive Items:\n');
        for (const item of items) {
          const grp = item.groupId ? groups.find((g) => g.id === item.groupId) : null;
          const groupLabel = grp ? ` [${grp.name}]` : '';
          const stats = service.computeStats(item);
          console.log(
            `  ${urgencyLabel(stats.percentRemaining)} ${item.name}${groupLabel}` +
            `  —  ${formatPercent(stats.percentRemaining)} remaining`
          );
        }
      }
      break;
    }

    case 'item-status': {
      const opts = parseArgs(args);
      if (!opts.item) {
        console.error('Error: --item is required');
        process.exit(1);
      }
      const { item, stats } = service.getLifecycleStats(opts.item);
      const groups = service.listGroups();
      const grp = item.groupId ? groups.find((g) => g.id === item.groupId) : null;

      console.log(`\n=== ${item.name} ===\n`);
      if (grp) console.log(`  Group:            ${grp.name}`);
      console.log(`  Category:         ${item.category}`);
      console.log(`  Purchase date:    ${item.purchaseDate}`);
      const laborLine = item.laborCost
        ? ` + $${item.laborCost.toFixed(2)} labor`
        : '';
      console.log(`  Purchase price:   $${item.purchasePrice.toFixed(2)}${laborLine}`);
      console.log();
      console.log(
        `  Life remaining:   ${urgencyLabel(stats.percentRemaining)} ${formatPercent(stats.percentRemaining)}`
      );
      console.log(`  Usage since install: ${formatUsage(stats.usageSinceInstall, item.usageUnit)}`);
      console.log(`  Usage remaining:     ${formatUsage(stats.usageRemaining, item.usageUnit)}`);
      if (stats.costPerUnit !== null) {
        const unitSingular = item.usageUnit.replace(/s$/, '');
        console.log(`  Cost per ${unitSingular}:      $${stats.costPerUnit.toFixed(4)}`);
      }
      if (stats.predictedReplacementDate) {
        console.log(
          `  Predicted replacement: ${formatDate(stats.predictedReplacementDate)}`
        );
        if (stats.daysRemaining !== null) {
          console.log(`  Days remaining:        ~${Math.ceil(stats.daysRemaining)}`);
        }
      }
      console.log(`  Item ID: ${item.id}`);
      break;
    }

    case 'log-usage': {
      const opts = parseArgs(args);
      if (!opts.item || opts.usage === undefined) {
        console.error('Error: --item and --usage are required');
        process.exit(1);
      }
      const { item } = service.logUsage({
        item: opts.item,
        usageValue: parseFloat(opts.usage),
        note: opts.note || '',
      });
      const stats = service.computeStats(item);
      console.log(`Usage updated for "${item.name}"`);
      console.log(`  Current total:  ${formatUsage(item.usageCurrent, item.usageUnit)}`);
      console.log(`  Since install:  ${formatUsage(item.usageCurrent - item.usageAtInstall, item.usageUnit)}`);
      console.log(`  Life remaining: ${formatPercent(stats.percentRemaining)}`);
      if (stats.predictedReplacementDate) {
        console.log(
          `  Predicted replacement: ${formatDate(stats.predictedReplacementDate)}`
        );
      }
      break;
    }

    case 'set-reminder': {
      const opts = parseArgs(args);
      if (!opts.item || !opts.type || opts.value === undefined) {
        console.error('Error: --item, --type, and --value are required');
        process.exit(1);
      }
      const thresholdValue =
        opts.type === 'date' ? opts.value : parseFloat(opts.value);
      const reminder = service.setReminder({
        item: opts.item,
        thresholdType: opts.type,
        thresholdValue,
      });
      console.log(`Reminder set`);
      console.log(`  Type:      ${reminder.thresholdType}`);
      console.log(`  Threshold: ${reminder.thresholdValue}`);
      break;
    }

    case 'check-reminders': {
      const triggered = service.checkReminders();
      if (triggered.length === 0) {
        console.log('No reminders triggered. All items are within threshold.');
      } else {
        console.log(`\n=== ${triggered.length} Reminder(s) Triggered ===\n`);
        for (const { item, stats, reminder } of triggered) {
          console.log(`  ${urgencyLabel(stats.percentRemaining)} ${item.name}`);
          console.log(`    Life remaining: ${formatPercent(stats.percentRemaining)}`);
          if (stats.predictedReplacementDate) {
            console.log(
              `    Predicted replacement: ${formatDate(stats.predictedReplacementDate)}`
            );
          }
          console.log(
            `    Threshold: ${reminder.thresholdType} <= ${reminder.thresholdValue}`
          );
          console.log();
        }
      }
      break;
    }

    case 'replace': {
      const opts = parseArgs(args);
      if (!opts.item) {
        console.error('Error: --item is required');
        process.exit(1);
      }
      const { archivedItem, finalStats } = service.replaceItem({
        item: opts.item,
        notes: opts.notes || '',
      });
      console.log(`Item archived as replaced: "${archivedItem.name}"`);
      console.log(
        `  Final usage since install: ${formatUsage(finalStats.usageSinceInstall, archivedItem.usageUnit)}`
      );
      console.log(
        `  Expected lifespan:         ${archivedItem.lifespanExpected.toLocaleString()} ${archivedItem.usageUnit}`
      );
      console.log(
        `  Total cost: $${(archivedItem.purchasePrice + (archivedItem.laborCost || 0)).toFixed(2)}`
      );
      console.log(`\n  Start a new cycle with:`);
      console.log(
        `    lifecycle new-cycle --previous-item-id ${archivedItem.id} --price <n> --usage-at-install <n>`
      );
      break;
    }

    case 'new-cycle': {
      const opts = parseArgs(args);
      if (!opts['previous-item-id']) {
        console.error('Error: --previous-item-id is required');
        process.exit(1);
      }
      const { newItem } = service.startNewCycle({
        previousItemId: opts['previous-item-id'],
        purchaseDate: opts['purchase-date'] || null,
        purchasePrice: opts.price ? parseFloat(opts.price) : undefined,
        laborCost: opts.labor ? parseFloat(opts.labor) : undefined,
        usageAtInstall: opts['usage-at-install']
          ? parseFloat(opts['usage-at-install'])
          : undefined,
        notes: opts.notes || '',
      });
      console.log(`New cycle started: "${newItem.name}"`);
      console.log(`  Purchase date:    ${newItem.purchaseDate}`);
      console.log(`  Purchase price:   $${newItem.purchasePrice.toFixed(2)}`);
      console.log(
        `  Usage at install: ${newItem.usageAtInstall.toLocaleString()} ${newItem.usageUnit}`
      );
      console.log(`  Item ID: ${newItem.id}`);
      break;
    }

    case 'history': {
      const opts = parseArgs(args);
      const records = service.getHistory(opts.item || null);
      if (records.length === 0) {
        console.log('No replacement history found.');
      } else {
        const label = opts.item ? ` for "${opts.item}"` : '';
        console.log(`\n=== Replacement History${label} ===\n`);
        for (const record of records) {
          const prev = record.previousItem;
          const next = record.newItem;
          console.log(`  Replaced: ${record.replacedAt.slice(0, 10)}`);
          if (prev) {
            const actualVsExpected =
              prev.usageUnit !== 'days'
                ? `  (expected: ${prev.lifespanExpected.toLocaleString()})`
                : '';
            console.log(
              `    Previous: ${prev.name}  (${prev.purchaseDate} — ${record.replacedAt.slice(0, 10)})`
            );
            console.log(
              `    Final usage: ${record.finalUsageValue.toLocaleString()} ${prev.usageUnit}${actualVsExpected}`
            );
            console.log(`    Total cost: $${record.finalCost.toFixed(2)}`);
          }
          if (next) console.log(`    New item: ${next.name} (ID: ${next.id})`);
          console.log();
        }
      }
      break;
    }

    case 'dashboard': {
      const entries = service.getDashboard();
      if (entries.length === 0) {
        console.log('No active items. Use add-item to get started.');
      } else {
        const groups = service.listGroups();
        console.log('\n=== Lifecycle Dashboard ===\n');
        for (const { item, stats } of entries) {
          const grp = item.groupId ? groups.find((g) => g.id === item.groupId) : null;
          const groupLabel = grp ? ` [${grp.name}]` : '';
          const predDate = stats.predictedReplacementDate
            ? `  → replace ~${formatDate(stats.predictedReplacementDate)}`
            : '';
          console.log(
            `  ${urgencyLabel(stats.percentRemaining)} ${item.name}${groupLabel}`
          );
          console.log(
            `    ${formatPercent(stats.percentRemaining)} remaining` +
            ` (${formatUsage(stats.usageRemaining, item.usageUnit)} left)${predDate}`
          );
          console.log();
        }
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
