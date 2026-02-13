const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function getFilePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function load(name) {
  const filePath = getFilePath(name);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function save(name, data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(getFilePath(name), JSON.stringify(data, null, 2));
}

module.exports = { load, save };
