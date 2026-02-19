const crypto = require('crypto');

function generateId() {
  return crypto.randomUUID();
}

function createGroup({ name, type, metadata = {} }) {
  const validTypes = ['vehicle', 'person', 'category'];
  if (!validTypes.includes(type)) {
    throw new Error(`Group type must be one of: ${validTypes.join(', ')}`);
  }
  return {
    id: generateId(),
    name,
    type,
    metadata,
    createdAt: new Date().toISOString(),
  };
}

function createItem({
  groupId = null,
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
  const validCategories = ['automotive', 'footwear'];
  const validUnits = ['miles', 'kilometers', 'cycles', 'days', 'hours'];

  if (!validCategories.includes(category)) {
    throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
  }
  if (!validUnits.includes(usageUnit)) {
    throw new Error(`Usage unit must be one of: ${validUnits.join(', ')}`);
  }
  if (typeof purchasePrice !== 'number' || purchasePrice < 0) {
    throw new Error('Purchase price must be a non-negative number');
  }
  if (typeof lifespanExpected !== 'number' || lifespanExpected <= 0) {
    throw new Error('Expected lifespan must be a positive number');
  }

  return {
    id: generateId(),
    groupId,
    name,
    category,
    dbItemId,
    status: 'active',
    purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
    purchasePrice,
    laborCost,
    usageUnit,
    usageAtInstall,
    usageCurrent: usageAtInstall,
    lifespanExpected,
    notes,
    createdAt: new Date().toISOString(),
  };
}

function createUsageLog({ itemId, usageValue, note = '' }) {
  if (typeof usageValue !== 'number' || usageValue < 0) {
    throw new Error('Usage value must be a non-negative number');
  }
  return {
    id: generateId(),
    itemId,
    usageValue,
    note,
    loggedAt: new Date().toISOString(),
  };
}

function createReplacementHistory({
  newItemId,
  previousItemId,
  finalUsageValue,
  finalCost = 0,
  notes = '',
}) {
  return {
    id: generateId(),
    newItemId,
    previousItemId,
    replacedAt: new Date().toISOString(),
    finalUsageValue,
    finalCost,
    notes,
  };
}

function createReminder({ itemId, thresholdType, thresholdValue }) {
  const validTypes = ['percentage', 'usage_remaining', 'date'];
  if (!validTypes.includes(thresholdType)) {
    throw new Error(`Threshold type must be one of: ${validTypes.join(', ')}`);
  }
  return {
    id: generateId(),
    itemId,
    thresholdType,
    thresholdValue,
    isActive: true,
    lastTriggeredAt: null,
  };
}

module.exports = {
  createGroup,
  createItem,
  createUsageLog,
  createReplacementHistory,
  createReminder,
};
