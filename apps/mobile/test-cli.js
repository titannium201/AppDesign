try {
  require('@expo/cli');
  console.log('OK');
} catch(e) {
  console.log('FAIL:', e.code, e.message);
}
