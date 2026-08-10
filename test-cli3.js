// Test with environment variable to skip network
process.env.EXPO_NO_CLIENT_ENV_CHECK = '1';
process.env.EXPO_OFFLINE = '1';

try {
  const resolved = require.resolve('@expo/cli');
  console.log('resolved:', resolved);
  const m = require(resolved);
  console.log('loaded:', typeof m);
} catch(e) {
  console.log('FAIL:', e.code, e.message);
}
