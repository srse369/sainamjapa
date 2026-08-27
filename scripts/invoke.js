const path = require('path');

async function invoke(funcName, event) {
  try {
    const fnPath = path.join(__dirname, '..', 'netlify', 'functions', `${funcName}.js`);
    const mod = require(fnPath);
    if (typeof mod.handler !== 'function') {
      console.error(funcName, 'handler not found');
      return;
    }
    const res = await mod.handler(event || {});
    console.log('Response for', funcName, JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error invoking', funcName, err && err.stack ? err.stack : err);
  }
}

const which = process.argv[2];
if (!which) {
  console.log('Usage: node scripts/invoke.js <functionName> [method]');
  process.exit(1);
}

const method = process.argv[3] || 'GET';
const event = { httpMethod: method, headers: {}, body: method === 'POST' ? '{}' : undefined };
invoke(which, event).then(() => process.exit(0));
