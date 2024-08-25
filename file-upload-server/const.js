const path = require('path');
const ENV = process.env.NODE_ENV || 'dev';

const FILE_STORAGE_ROOT = path.resolve(__dirname, './node_modules/.cache');

module.exports = {
  ENV,
  FILE_STORAGE_ROOT,
};
