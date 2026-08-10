const path = require('path');
try {
  const resolved = require.resolve('@expo/cli');
  console.log('resolved:', resolved);
  const m = require(resolved);
  console.log('loaded:', typeof m);
} catch(e) {
  console.log('FAIL:', e.code, e.message);
}
