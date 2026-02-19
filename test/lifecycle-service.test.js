const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const LIFECYCLE_FILES = ['groups', 'items', 'usage-logs', 'replacement-history', 'reminders'];

function clearData() {
  for (const file of LIFECYCLE_FILES) {
    const fp = path.join(DATA_DIR, `${file}.json`);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
}

function loadService() {
  for (const key of Object.keys(require.cache)) {
    if (
      key.includes('lifecycle-service') ||
      key.includes('lifecycle-models') ||
      key.includes('item-database') ||
      key.includes('/storage')
    ) {
      delete require.cache[key];
    }
  }
  return require('../src/lifecycle-service');
}

// ─── Groups ───────────────────────────────────────────────────────────────────

describe('Groups', () => {
  beforeEach(() => clearData());

  it('should add and list groups', () => {
    const service = loadService();
    service.addGroup({ name: 'My Car', type: 'vehicle', metadata: { make: 'Honda', model: 'Civic', year: '2020' } });
    service.addGroup({ name: 'Vic', type: 'person' });
    const groups = service.listGroups();
    assert.equal(groups.length, 2);
    assert.equal(groups[0].name, 'My Car');
    assert.equal(groups[0].type, 'vehicle');
    assert.equal(groups[1].name, 'Vic');
  });

  it('should store vehicle metadata on a group', () => {
    const service = loadService();
    const group = service.addGroup({
      name: 'Integra',
      type: 'vehicle',
      metadata: { make: 'Acura', model: 'Integra', year: '2023' },
    });
    assert.equal(group.metadata.make, 'Acura');
    assert.equal(group.metadata.model, 'Integra');
    assert.equal(group.metadata.year, '2023');
  });

  it('should reject duplicate group names (case-insensitive)', () => {
    const service = loadService();
    service.addGroup({ name: 'My Car', type: 'vehicle' });
    assert.throws(
      () => service.addGroup({ name: 'my car', type: 'vehicle' }),
      /already exists/
    );
  });

  it('should reject invalid group types', () => {
    const service = loadService();
    assert.throws(
      () => service.addGroup({ name: 'Test', type: 'invalid' }),
      /vehicle|person|category/
    );
  });

  it('should find a group by name', () => {
    const service = loadService();
    const created = service.addGroup({ name: 'Integra', type: 'vehicle' });
    const found = service.findGroup('Integra');
    assert.equal(found.id, created.id);
  });

  it('should find a group by id', () => {
    const service = loadService();
    const created = service.addGroup({ name: 'Integra', type: 'vehicle' });
    const found = service.findGroup(created.id);
    assert.equal(found.id, created.id);
  });

  it('should return null for unknown group', () => {
    const service = loadService();
    assert.equal(service.findGroup('nonexistent'), null);
  });
});

// ─── Items ────────────────────────────────────────────────────────────────────

describe('Items', () => {
  beforeEach(() => clearData());

  it('should add an automotive item', () => {
    const service = loadService();
    const item = service.addItem({
      name: 'Front Brake Pads',
      category: 'automotive',
      purchasePrice: 120,
      usageUnit: 'miles',
      usageAtInstall: 45000,
      lifespanExpected: 50000,
    });
    assert.equal(item.name, 'Front Brake Pads');
    assert.equal(item.category, 'automotive');
    assert.equal(item.status, 'active');
    assert.equal(item.usageAtInstall, 45000);
    assert.equal(item.usageCurrent, 45000);
    assert.ok(item.id);
    assert.ok(item.createdAt);
  });

  it('should add a footwear item', () => {
    const service = loadService();
    const item = service.addItem({
      name: 'Running Shoes',
      category: 'footwear',
      purchasePrice: 150,
      usageUnit: 'miles',
      usageAtInstall: 0,
      lifespanExpected: 400,
    });
    assert.equal(item.category, 'footwear');
    assert.equal(item.lifespanExpected, 400);
    assert.equal(item.usageCurrent, 0);
  });

  it('should add item with labor cost', () => {
    const service = loadService();
    const item = service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      laborCost: 80,
      usageUnit: 'miles',
      lifespanExpected: 50000,
    });
    assert.equal(item.laborCost, 80);
  });

  it('should assign purchase date when not provided', () => {
    const service = loadService();
    const item = service.addItem({
      name: 'Running Shoes',
      category: 'footwear',
      purchasePrice: 150,
      usageUnit: 'miles',
      lifespanExpected: 400,
    });
    assert.ok(item.purchaseDate);
    assert.match(item.purchaseDate, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('should reject invalid category', () => {
    const service = loadService();
    assert.throws(
      () =>
        service.addItem({
          name: 'Test',
          category: 'tools',
          purchasePrice: 10,
          usageUnit: 'miles',
          lifespanExpected: 100,
        }),
      /Category/
    );
  });

  it('should reject invalid usage unit', () => {
    const service = loadService();
    assert.throws(
      () =>
        service.addItem({
          name: 'Test',
          category: 'footwear',
          purchasePrice: 10,
          usageUnit: 'lightyears',
          lifespanExpected: 100,
        }),
      /Usage unit/
    );
  });

  it('should reject negative purchase price', () => {
    const service = loadService();
    assert.throws(
      () =>
        service.addItem({
          name: 'Test',
          category: 'footwear',
          purchasePrice: -10,
          usageUnit: 'miles',
          lifespanExpected: 100,
        }),
      /Purchase price/
    );
  });

  it('should reject zero or negative lifespan', () => {
    const service = loadService();
    assert.throws(
      () =>
        service.addItem({
          name: 'Test',
          category: 'footwear',
          purchasePrice: 10,
          usageUnit: 'miles',
          lifespanExpected: 0,
        }),
      /lifespan/
    );
  });

  it('should add item with a group', () => {
    const service = loadService();
    const group = service.addGroup({ name: 'My Car', type: 'vehicle' });
    const item = service.addItem({
      name: 'Rear Brake Pads',
      category: 'automotive',
      group: 'My Car',
      purchasePrice: 90,
      usageUnit: 'miles',
      usageAtInstall: 45000,
      lifespanExpected: 50000,
    });
    assert.equal(item.groupId, group.id);
  });

  it('should throw when adding item with unknown group', () => {
    const service = loadService();
    assert.throws(
      () =>
        service.addItem({
          name: 'Brake Pads',
          category: 'automotive',
          group: 'Ghost Car',
          purchasePrice: 100,
          usageUnit: 'miles',
          lifespanExpected: 50000,
        }),
      /not found/
    );
  });

  it('should list items filtered by group', () => {
    const service = loadService();
    service.addGroup({ name: 'Car A', type: 'vehicle' });
    service.addGroup({ name: 'Car B', type: 'vehicle' });
    service.addItem({ name: 'Item 1', category: 'automotive', group: 'Car A', purchasePrice: 100, usageUnit: 'miles', lifespanExpected: 50000 });
    service.addItem({ name: 'Item 2', category: 'automotive', group: 'Car B', purchasePrice: 100, usageUnit: 'miles', lifespanExpected: 50000 });
    service.addItem({ name: 'Item 3', category: 'automotive', group: 'Car A', purchasePrice: 100, usageUnit: 'miles', lifespanExpected: 50000 });

    const carAItems = service.listItems({ group: 'Car A' });
    assert.equal(carAItems.length, 2);
    assert.ok(carAItems.every((i) => i.groupId !== null));
  });

  it('should list items filtered by category', () => {
    const service = loadService();
    service.addItem({ name: 'Brake Pads', category: 'automotive', purchasePrice: 100, usageUnit: 'miles', lifespanExpected: 50000 });
    service.addItem({ name: 'Running Shoes', category: 'footwear', purchasePrice: 150, usageUnit: 'miles', lifespanExpected: 400 });

    const footwear = service.listItems({ category: 'footwear' });
    assert.equal(footwear.length, 1);
    assert.equal(footwear[0].name, 'Running Shoes');
  });

  it('should find an item by name (case-insensitive)', () => {
    const service = loadService();
    const created = service.addItem({ name: 'Running Shoes', category: 'footwear', purchasePrice: 150, usageUnit: 'miles', lifespanExpected: 400 });
    const found = service.findItem('running shoes');
    assert.equal(found.id, created.id);
  });
});

// ─── Lifecycle Stats ──────────────────────────────────────────────────────────

describe('Lifecycle Stats', () => {
  beforeEach(() => clearData());

  it('should compute usageSinceInstall for miles-based item', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 50000,
    });
    service.logUsage({ item: 'Brake Pads', usageValue: 45000 });

    const { stats } = service.getLifecycleStats('Brake Pads');
    assert.equal(stats.usageSinceInstall, 5000);
    assert.equal(stats.usageRemaining, 45000);
    assert.ok(stats.percentRemaining > 89 && stats.percentRemaining < 91);
  });

  it('should compute cost per unit', () => {
    const service = loadService();
    service.addItem({
      name: 'Running Shoes',
      category: 'footwear',
      purchasePrice: 150,
      laborCost: 0,
      usageUnit: 'miles',
      usageAtInstall: 0,
      lifespanExpected: 400,
    });
    service.logUsage({ item: 'Running Shoes', usageValue: 100 });

    const { stats } = service.getLifecycleStats('Running Shoes');
    assert.equal(stats.costPerUnit, 1.5);
  });

  it('should include labor cost in cost-per-unit calculation', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      laborCost: 50,
      usageUnit: 'miles',
      usageAtInstall: 0,
      lifespanExpected: 50000,
    });
    service.logUsage({ item: 'Brake Pads', usageValue: 150 });

    const { stats } = service.getLifecycleStats('Brake Pads');
    assert.equal(stats.costPerUnit, 1.0); // $150 total / 150 miles
  });

  it('should return null costPerUnit when no usage logged', () => {
    const service = loadService();
    service.addItem({
      name: 'Running Shoes',
      category: 'footwear',
      purchasePrice: 150,
      usageUnit: 'miles',
      usageAtInstall: 0,
      lifespanExpected: 400,
    });

    const { stats } = service.getLifecycleStats('Running Shoes');
    assert.equal(stats.costPerUnit, null);
  });

  it('should compute percentRemaining = 100 at start for non-days items', () => {
    const service = loadService();
    service.addItem({
      name: 'Running Shoes',
      category: 'footwear',
      purchasePrice: 150,
      usageUnit: 'miles',
      usageAtInstall: 0,
      lifespanExpected: 400,
    });

    const { stats } = service.getLifecycleStats('Running Shoes');
    assert.equal(stats.percentRemaining, 100);
    assert.equal(stats.usageSinceInstall, 0);
    assert.equal(stats.usageRemaining, 400);
  });

  it('should compute days-based stats automatically from purchase date', () => {
    const service = loadService();
    const purchaseDate = new Date();
    purchaseDate.setDate(purchaseDate.getDate() - 90);

    service.addItem({
      name: 'Wiper Blades',
      category: 'automotive',
      purchasePrice: 30,
      usageUnit: 'days',
      lifespanExpected: 270,
      purchaseDate: purchaseDate.toISOString().slice(0, 10),
    });

    const { stats } = service.getLifecycleStats('Wiper Blades');
    assert.ok(stats.usageSinceInstall >= 89 && stats.usageSinceInstall <= 91);
    assert.ok(stats.percentRemaining < 100 && stats.percentRemaining > 60);
    assert.ok(stats.predictedReplacementDate instanceof Date);
  });

  it('should set percentRemaining to 0 when past expected lifespan', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 50000,
    });
    service.logUsage({ item: 'Brake Pads', usageValue: 95000 }); // 55000 miles over lifespan

    const { stats } = service.getLifecycleStats('Brake Pads');
    assert.equal(stats.percentRemaining, 0);
    assert.equal(stats.usageRemaining, 0);
  });

  it('should predict replacement date based on usage pace', () => {
    const service = loadService();
    service.addItem({
      name: 'Running Shoes',
      category: 'footwear',
      purchasePrice: 150,
      usageUnit: 'miles',
      usageAtInstall: 0,
      lifespanExpected: 400,
      purchaseDate: new Date().toISOString().slice(0, 10),
    });
    service.logUsage({ item: 'Running Shoes', usageValue: 100 });

    const { stats } = service.getLifecycleStats('Running Shoes');
    assert.ok(stats.predictedReplacementDate instanceof Date);
    assert.ok(stats.daysRemaining !== null && stats.daysRemaining > 0);
  });

  it('should throw when item not found', () => {
    const service = loadService();
    assert.throws(() => service.getLifecycleStats('Ghost Item'), /not found/);
  });
});

// ─── Usage Logging ─────────────────────────────────────────────────────────────

describe('Usage Logging', () => {
  beforeEach(() => clearData());

  it('should log usage and update item usageCurrent', () => {
    const service = loadService();
    service.addItem({
      name: 'Running Shoes',
      category: 'footwear',
      purchasePrice: 150,
      usageUnit: 'miles',
      usageAtInstall: 0,
      lifespanExpected: 400,
    });
    const { item } = service.logUsage({ item: 'Running Shoes', usageValue: 50 });
    assert.equal(item.usageCurrent, 50);
  });

  it('should store usage log record', () => {
    const service = loadService();
    const created = service.addItem({
      name: 'Running Shoes',
      category: 'footwear',
      purchasePrice: 150,
      usageUnit: 'miles',
      usageAtInstall: 0,
      lifespanExpected: 400,
    });
    service.logUsage({ item: 'Running Shoes', usageValue: 50, note: 'Long run' });

    const logs = service.getUsageLogs(created.id);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].usageValue, 50);
    assert.equal(logs[0].note, 'Long run');
  });

  it('should support multiple usage log entries', () => {
    const service = loadService();
    const item = service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 50000,
    });
    service.logUsage({ item: 'Brake Pads', usageValue: 42000 });
    service.logUsage({ item: 'Brake Pads', usageValue: 44000 });
    service.logUsage({ item: 'Brake Pads', usageValue: 47000 });

    const logs = service.getUsageLogs(item.id);
    assert.equal(logs.length, 3);

    const { stats } = service.getLifecycleStats('Brake Pads');
    assert.equal(stats.usageSinceInstall, 7000);
  });

  it('should reject usage value less than install value', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 45000,
      lifespanExpected: 50000,
    });
    assert.throws(
      () => service.logUsage({ item: 'Brake Pads', usageValue: 40000 }),
      /cannot be less than install/
    );
  });

  it('should reject usage logging for days-based items', () => {
    const service = loadService();
    service.addItem({
      name: 'Wiper Blades',
      category: 'automotive',
      purchasePrice: 30,
      usageUnit: 'days',
      lifespanExpected: 270,
    });
    assert.throws(
      () => service.logUsage({ item: 'Wiper Blades', usageValue: 100 }),
      /automatically/
    );
  });

  it('should reject usage logging for replaced items', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 50000,
    });
    service.replaceItem({ item: 'Brake Pads' });
    assert.throws(
      () => service.logUsage({ item: 'Brake Pads', usageValue: 50000 }),
      /not active/
    );
  });
});

// ─── Reminders ────────────────────────────────────────────────────────────────

describe('Reminders', () => {
  beforeEach(() => clearData());

  it('should set and trigger a percentage reminder', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 10000,
    });
    service.setReminder({ item: 'Brake Pads', thresholdType: 'percentage', thresholdValue: 30 });
    service.logUsage({ item: 'Brake Pads', usageValue: 47500 }); // 75% through lifespan

    const triggered = service.checkReminders();
    assert.equal(triggered.length, 1);
    assert.equal(triggered[0].item.name, 'Brake Pads');
  });

  it('should not trigger reminder when above threshold', () => {
    const service = loadService();
    service.addItem({
      name: 'Running Shoes',
      category: 'footwear',
      purchasePrice: 150,
      usageUnit: 'miles',
      usageAtInstall: 0,
      lifespanExpected: 400,
    });
    service.setReminder({ item: 'Running Shoes', thresholdType: 'percentage', thresholdValue: 20 });
    service.logUsage({ item: 'Running Shoes', usageValue: 100 }); // 75% remaining

    const triggered = service.checkReminders();
    assert.equal(triggered.length, 0);
  });

  it('should trigger a usage_remaining reminder', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 10000,
    });
    service.setReminder({ item: 'Brake Pads', thresholdType: 'usage_remaining', thresholdValue: 3000 });
    service.logUsage({ item: 'Brake Pads', usageValue: 47500 }); // 2500 miles remaining

    const triggered = service.checkReminders();
    assert.equal(triggered.length, 1);
  });

  it('should trigger a date reminder when date has passed', () => {
    const service = loadService();
    service.addItem({
      name: 'Wiper Blades',
      category: 'automotive',
      purchasePrice: 30,
      usageUnit: 'days',
      lifespanExpected: 270,
    });
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    service.setReminder({
      item: 'Wiper Blades',
      thresholdType: 'date',
      thresholdValue: pastDate.toISOString().slice(0, 10),
    });

    const triggered = service.checkReminders();
    assert.equal(triggered.length, 1);
  });

  it('should not trigger a date reminder for future date', () => {
    const service = loadService();
    service.addItem({
      name: 'Wiper Blades',
      category: 'automotive',
      purchasePrice: 30,
      usageUnit: 'days',
      lifespanExpected: 270,
    });
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    service.setReminder({
      item: 'Wiper Blades',
      thresholdType: 'date',
      thresholdValue: futureDate.toISOString().slice(0, 10),
    });

    const triggered = service.checkReminders();
    assert.equal(triggered.length, 0);
  });

  it('should replace existing reminder for same item', () => {
    const service = loadService();
    service.addItem({
      name: 'Running Shoes',
      category: 'footwear',
      purchasePrice: 150,
      usageUnit: 'miles',
      lifespanExpected: 400,
    });
    service.setReminder({ item: 'Running Shoes', thresholdType: 'percentage', thresholdValue: 20 });
    service.setReminder({ item: 'Running Shoes', thresholdType: 'percentage', thresholdValue: 10 });

    const reminders = require('../src/storage').load('reminders');
    assert.equal(reminders.length, 1);
    assert.equal(reminders[0].thresholdValue, 10);
  });

  it('should reject invalid threshold type', () => {
    const service = loadService();
    service.addItem({
      name: 'Running Shoes',
      category: 'footwear',
      purchasePrice: 150,
      usageUnit: 'miles',
      lifespanExpected: 400,
    });
    assert.throws(
      () => service.setReminder({ item: 'Running Shoes', thresholdType: 'invalid', thresholdValue: 20 }),
      /percentage|usage_remaining|date/
    );
  });
});

// ─── Replacement ──────────────────────────────────────────────────────────────

describe('Replacement', () => {
  beforeEach(() => clearData());

  it('should archive item when replaced', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 50000,
    });
    service.logUsage({ item: 'Brake Pads', usageValue: 90000 });

    const { archivedItem } = service.replaceItem({ item: 'Brake Pads' });
    assert.equal(archivedItem.status, 'replaced');
  });

  it('should remove replaced item from active list', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 50000,
    });
    service.replaceItem({ item: 'Brake Pads' });

    const activeItems = service.listItems({ status: 'active' });
    assert.equal(activeItems.length, 0);
  });

  it('should start new cycle from previous item', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 50000,
    });
    service.logUsage({ item: 'Brake Pads', usageValue: 90000 });

    const { archivedItem } = service.replaceItem({ item: 'Brake Pads' });
    const { newItem, history } = service.startNewCycle({
      previousItemId: archivedItem.id,
      purchasePrice: 120,
      usageAtInstall: 90000,
    });

    assert.equal(newItem.name, 'Brake Pads');
    assert.equal(newItem.purchasePrice, 120);
    assert.equal(newItem.usageAtInstall, 90000);
    assert.equal(newItem.status, 'active');
    assert.equal(history.previousItemId, archivedItem.id);
    assert.equal(history.newItemId, newItem.id);
  });

  it('should inherit properties from previous item in new cycle', () => {
    const service = loadService();
    const group = service.addGroup({ name: 'My Car', type: 'vehicle' });
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      group: 'My Car',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 50000,
    });
    const { archivedItem } = service.replaceItem({ item: 'Brake Pads' });
    const { newItem } = service.startNewCycle({ previousItemId: archivedItem.id });

    assert.equal(newItem.category, 'automotive');
    assert.equal(newItem.usageUnit, 'miles');
    assert.equal(newItem.lifespanExpected, 50000);
    assert.equal(newItem.groupId, group.id);
  });

  it('should reject replacing an already replaced item', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 50000,
    });
    service.replaceItem({ item: 'Brake Pads' });
    assert.throws(
      () => service.replaceItem({ item: 'Brake Pads' }),
      /not active/
    );
  });

  it('should record replacement history', () => {
    const service = loadService();
    service.addItem({
      name: 'Brake Pads',
      category: 'automotive',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 40000,
      lifespanExpected: 50000,
    });
    service.logUsage({ item: 'Brake Pads', usageValue: 90000 });
    const { archivedItem } = service.replaceItem({ item: 'Brake Pads' });
    service.startNewCycle({ previousItemId: archivedItem.id, usageAtInstall: 90000 });

    const history = service.getHistory('Brake Pads');
    assert.equal(history.length, 1);
    assert.equal(history[0].finalUsageValue, 90000);
    assert.ok(history[0].previousItem);
    assert.ok(history[0].newItem);
  });

  it('should list all history when no item specified', () => {
    const service = loadService();
    service.addItem({ name: 'Shoes A', category: 'footwear', purchasePrice: 100, usageUnit: 'miles', lifespanExpected: 400 });
    service.addItem({ name: 'Shoes B', category: 'footwear', purchasePrice: 120, usageUnit: 'miles', lifespanExpected: 400 });

    const { archivedItem: a } = service.replaceItem({ item: 'Shoes A' });
    const { archivedItem: b } = service.replaceItem({ item: 'Shoes B' });
    service.startNewCycle({ previousItemId: a.id });
    service.startNewCycle({ previousItemId: b.id });

    const allHistory = service.getHistory(null);
    assert.equal(allHistory.length, 2);
  });
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe('Dashboard', () => {
  beforeEach(() => clearData());

  it('should return items sorted by urgency (lowest percent first)', () => {
    const service = loadService();
    service.addItem({
      name: 'Nearly Done',
      category: 'footwear',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 0,
      lifespanExpected: 400,
    });
    service.addItem({
      name: 'Barely Used',
      category: 'footwear',
      purchasePrice: 100,
      usageUnit: 'miles',
      usageAtInstall: 0,
      lifespanExpected: 400,
    });

    service.logUsage({ item: 'Nearly Done', usageValue: 380 }); // 5% remaining
    service.logUsage({ item: 'Barely Used', usageValue: 20 });  // 95% remaining

    const dashboard = service.getDashboard();
    assert.equal(dashboard[0].item.name, 'Nearly Done');
    assert.equal(dashboard[1].item.name, 'Barely Used');
    assert.ok(dashboard[0].stats.percentRemaining < dashboard[1].stats.percentRemaining);
  });

  it('should return empty array when no active items', () => {
    const service = loadService();
    const dashboard = service.getDashboard();
    assert.equal(dashboard.length, 0);
  });

  it('should exclude replaced items from dashboard', () => {
    const service = loadService();
    service.addItem({ name: 'Old Shoes', category: 'footwear', purchasePrice: 100, usageUnit: 'miles', lifespanExpected: 400 });
    service.addItem({ name: 'New Shoes', category: 'footwear', purchasePrice: 120, usageUnit: 'miles', lifespanExpected: 400 });
    service.replaceItem({ item: 'Old Shoes' });

    const dashboard = service.getDashboard();
    assert.equal(dashboard.length, 1);
    assert.equal(dashboard[0].item.name, 'New Shoes');
  });
});

// ─── Item Database ─────────────────────────────────────────────────────────────

describe('Item Database', () => {
  it('should list all database items (at least 20)', () => {
    const service = loadService();
    const items = service.listDbItems();
    assert.ok(items.length >= 20);
  });

  it('should filter database items by automotive category', () => {
    const service = loadService();
    const automotive = service.listDbItems({ category: 'automotive' });
    assert.ok(automotive.length > 0);
    assert.ok(automotive.every((i) => i.category === 'automotive'));
  });

  it('should filter database items by footwear category', () => {
    const service = loadService();
    const footwear = service.listDbItems({ category: 'footwear' });
    assert.ok(footwear.length > 0);
    assert.ok(footwear.every((i) => i.category === 'footwear'));
  });

  it('should have automotive + footwear count equal total', () => {
    const service = loadService();
    const automotive = service.listDbItems({ category: 'automotive' });
    const footwear = service.listDbItems({ category: 'footwear' });
    const all = service.listDbItems();
    assert.equal(automotive.length + footwear.length, all.length);
  });

  it('should get a specific database item by id', () => {
    const service = loadService();
    const item = service.getDbItem('running-shoes');
    assert.ok(item);
    assert.equal(item.itemName, 'Running Shoes');
    assert.equal(item.usageUnit, 'miles');
    assert.equal(item.lifespanTypical, 400);
  });

  it('should get brake pads from database', () => {
    const service = loadService();
    const front = service.getDbItem('brake-pads-front');
    assert.ok(front);
    assert.equal(front.usageUnit, 'miles');
    assert.ok(front.lifespanTypical > 0);
  });

  it('should return null for unknown database item', () => {
    const service = loadService();
    assert.equal(service.getDbItem('nonexistent-item'), null);
  });

  it('should have required fields on every database item', () => {
    const service = loadService();
    const items = service.listDbItems();
    for (const item of items) {
      assert.ok(item.id, `Missing id on ${item.itemName}`);
      assert.ok(item.itemName, `Missing itemName`);
      assert.ok(item.category, `Missing category on ${item.itemName}`);
      assert.ok(item.usageUnit, `Missing usageUnit on ${item.itemName}`);
      assert.ok(item.lifespanTypical > 0, `Invalid lifespanTypical on ${item.itemName}`);
    }
  });
});
