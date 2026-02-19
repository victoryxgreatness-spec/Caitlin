const storage = require('./storage');
const {
  createGroup,
  createItem,
  createUsageLog,
  createReplacementHistory,
  createReminder,
} = require('./lifecycle-models');
const { listDbItems, getDbItem } = require('./item-database');

// --- Groups ---

function addGroup({ name, type, metadata = {} }) {
  const groups = storage.load('groups');
  const exists = groups.find((g) => g.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    throw new Error(`Group "${name}" already exists`);
  }
  const group = createGroup({ name, type, metadata });
  groups.push(group);
  storage.save('groups', groups);
  return group;
}

function listGroups() {
  return storage.load('groups');
}

function findGroup(nameOrId) {
  const groups = storage.load('groups');
  return (
    groups.find(
      (g) =>
        g.id === nameOrId || g.name.toLowerCase() === nameOrId.toLowerCase()
    ) || null
  );
}

// --- Items ---

function addItem({
  groupId = null,
  group = null,
  name,
  category,
  dbItemId = null,
  purchaseDate,
  purchasePrice,
  laborCost = 0,
  usageUnit,
  usageAtInstall = 0,
  lifespanExpected,
  notes = '',
}) {
  let resolvedGroupId = groupId;
  if (group && !groupId) {
    const grp = findGroup(group);
    if (!grp) throw new Error(`Group "${group}" not found`);
    resolvedGroupId = grp.id;
  }

  const item = createItem({
    groupId: resolvedGroupId,
    name,
    category,
    dbItemId,
    purchaseDate,
    purchasePrice,
    laborCost,
    usageUnit,
    usageAtInstall,
    lifespanExpected,
    notes,
  });

  const items = storage.load('items');
  items.push(item);
  storage.save('items', items);
  return item;
}

function listItems({ groupId = null, group = null, category = null, status = 'active' } = {}) {
  let items = storage.load('items');

  let resolvedGroupId = groupId;
  if (group && !groupId) {
    const grp = findGroup(group);
    if (grp) resolvedGroupId = grp.id;
  }

  if (resolvedGroupId) {
    items = items.filter((i) => i.groupId === resolvedGroupId);
  }
  if (category) {
    items = items.filter((i) => i.category === category);
  }
  if (status) {
    items = items.filter((i) => i.status === status);
  }

  return items;
}

function findItem(nameOrId) {
  const items = storage.load('items');
  // Prefer active items when searching by name to avoid returning archived ones
  const active = items.filter((i) => i.status === 'active');
  return (
    active.find(
      (i) =>
        i.id === nameOrId || i.name.toLowerCase() === nameOrId.toLowerCase()
    ) ||
    items.find(
      (i) =>
        i.id === nameOrId || i.name.toLowerCase() === nameOrId.toLowerCase()
    ) ||
    null
  );
}

function getItem(itemId) {
  const items = storage.load('items');
  return items.find((i) => i.id === itemId) || null;
}

// --- Lifecycle Stats ---

function computeStats(item) {
  const now = new Date();
  const purchaseDate = new Date(item.purchaseDate);
  const daysSinceInstall = Math.max(
    (now - purchaseDate) / (1000 * 60 * 60 * 24),
    0.001
  );

  let usageSinceInstall;
  if (item.usageUnit === 'days') {
    usageSinceInstall = daysSinceInstall;
  } else {
    usageSinceInstall = Math.max(item.usageCurrent - item.usageAtInstall, 0);
  }

  const usageRemaining = Math.max(item.lifespanExpected - usageSinceInstall, 0);
  const percentRemaining = Math.min(
    (usageRemaining / item.lifespanExpected) * 100,
    100
  );

  const totalCost = item.purchasePrice + (item.laborCost || 0);
  const costPerUnit = usageSinceInstall > 0 ? totalCost / usageSinceInstall : null;

  let predictedReplacementDate = null;
  let daysRemaining = null;

  if (item.usageUnit === 'days') {
    daysRemaining = usageRemaining;
    predictedReplacementDate = new Date(
      purchaseDate.getTime() + item.lifespanExpected * 24 * 60 * 60 * 1000
    );
  } else if (usageSinceInstall > 0) {
    const pacePerDay = usageSinceInstall / daysSinceInstall;
    daysRemaining = pacePerDay > 0 ? usageRemaining / pacePerDay : null;
    if (daysRemaining !== null) {
      predictedReplacementDate = new Date(
        now.getTime() + daysRemaining * 24 * 60 * 60 * 1000
      );
    }
  }

  return {
    usageSinceInstall,
    usageRemaining,
    percentRemaining,
    costPerUnit,
    daysRemaining,
    predictedReplacementDate,
  };
}

function getLifecycleStats(nameOrId) {
  const item = findItem(nameOrId);
  if (!item) throw new Error(`Item "${nameOrId}" not found`);
  return { item, stats: computeStats(item) };
}

// --- Usage Logging ---

function logUsage({ item: nameOrId, usageValue, note = '' }) {
  const item = findItem(nameOrId);
  if (!item) throw new Error(`Item "${nameOrId}" not found`);
  if (item.status !== 'active') throw new Error(`Item "${item.name}" is not active`);
  if (item.usageUnit === 'days') {
    throw new Error('Days-based items track usage automatically from purchase date');
  }
  if (usageValue < item.usageAtInstall) {
    throw new Error(
      `Usage value (${usageValue}) cannot be less than install value (${item.usageAtInstall})`
    );
  }

  const log = createUsageLog({ itemId: item.id, usageValue, note });
  const logs = storage.load('usage-logs');
  logs.push(log);
  storage.save('usage-logs', logs);

  const items = storage.load('items');
  const idx = items.findIndex((i) => i.id === item.id);
  items[idx].usageCurrent = usageValue;
  storage.save('items', items);

  return { log, item: items[idx] };
}

function getUsageLogs(itemId) {
  const logs = storage.load('usage-logs');
  return logs.filter((l) => l.itemId === itemId);
}

// --- Reminders ---

function setReminder({ item: nameOrId, thresholdType, thresholdValue }) {
  const item = findItem(nameOrId);
  if (!item) throw new Error(`Item "${nameOrId}" not found`);

  const reminder = createReminder({ itemId: item.id, thresholdType, thresholdValue });
  const reminders = storage.load('reminders');

  // Replace existing reminder for this item
  const idx = reminders.findIndex((r) => r.itemId === item.id);
  if (idx >= 0) {
    reminders[idx] = reminder;
  } else {
    reminders.push(reminder);
  }

  storage.save('reminders', reminders);
  return reminder;
}

function checkReminders() {
  const reminders = storage.load('reminders');
  const triggered = [];

  for (const reminder of reminders.filter((r) => r.isActive)) {
    const item = getItem(reminder.itemId);
    if (!item || item.status !== 'active') continue;

    const stats = computeStats(item);
    let isTriggered = false;

    if (reminder.thresholdType === 'percentage') {
      isTriggered = stats.percentRemaining <= reminder.thresholdValue;
    } else if (reminder.thresholdType === 'usage_remaining') {
      isTriggered = stats.usageRemaining <= reminder.thresholdValue;
    } else if (reminder.thresholdType === 'date') {
      // Trigger on or after the specified date
      isTriggered = new Date() >= new Date(reminder.thresholdValue);
    }

    if (isTriggered) {
      triggered.push({ reminder, item, stats });
    }
  }

  return triggered;
}

// --- Replacement ---

function replaceItem({ item: nameOrId, notes = '' }) {
  const item = findItem(nameOrId);
  if (!item) throw new Error(`Item "${nameOrId}" not found`);
  if (item.status !== 'active') throw new Error(`Item "${item.name}" is not active`);

  const stats = computeStats(item);

  const items = storage.load('items');
  const idx = items.findIndex((i) => i.id === item.id);
  items[idx].status = 'replaced';
  storage.save('items', items);

  return { archivedItem: items[idx], finalStats: stats };
}

function startNewCycle({
  previousItemId,
  purchaseDate,
  purchasePrice,
  laborCost,
  usageAtInstall,
  notes = '',
}) {
  const previous = getItem(previousItemId);
  if (!previous) throw new Error('Previous item not found');

  const newItem = createItem({
    groupId: previous.groupId,
    name: previous.name,
    category: previous.category,
    dbItemId: previous.dbItemId,
    purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
    purchasePrice: purchasePrice !== undefined ? purchasePrice : previous.purchasePrice,
    laborCost: laborCost !== undefined ? laborCost : previous.laborCost,
    usageUnit: previous.usageUnit,
    usageAtInstall: usageAtInstall !== undefined ? usageAtInstall : 0,
    lifespanExpected: previous.lifespanExpected,
    notes,
  });

  const items = storage.load('items');
  items.push(newItem);
  storage.save('items', items);

  const history = createReplacementHistory({
    newItemId: newItem.id,
    previousItemId,
    finalUsageValue: previous.usageCurrent,
    finalCost: previous.purchasePrice + (previous.laborCost || 0),
    notes,
  });

  const histories = storage.load('replacement-history');
  histories.push(history);
  storage.save('replacement-history', histories);

  return { newItem, history };
}

// --- History ---

function getHistory(nameOrId) {
  const histories = storage.load('replacement-history');
  const items = storage.load('items');

  let records = histories;
  if (nameOrId) {
    const item = findItem(nameOrId) || getItem(nameOrId);
    if (item) {
      records = histories.filter(
        (h) => h.newItemId === item.id || h.previousItemId === item.id
      );
    }
  }

  return records.map((h) => ({
    ...h,
    newItem: items.find((i) => i.id === h.newItemId) || null,
    previousItem: items.find((i) => i.id === h.previousItemId) || null,
  }));
}

// --- Dashboard ---

function getDashboard() {
  const items = listItems({ status: 'active' });
  return items
    .map((item) => ({ item, stats: computeStats(item) }))
    .sort((a, b) => a.stats.percentRemaining - b.stats.percentRemaining);
}

module.exports = {
  addGroup,
  listGroups,
  findGroup,
  addItem,
  listItems,
  findItem,
  getItem,
  computeStats,
  getLifecycleStats,
  logUsage,
  getUsageLogs,
  setReminder,
  checkReminders,
  replaceItem,
  startNewCycle,
  getHistory,
  getDashboard,
  listDbItems,
  getDbItem,
};
