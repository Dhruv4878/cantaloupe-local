const bcrypt = require('bcryptjs');

async function test() {
  try {
    console.log('Testing bcrypt.compare with undefined password...');
    const res = await bcrypt.compare('somepassword', undefined);
    console.log('Result:', res);
  } catch (err) {
    console.error('Caught Expected Error:', err);
  }
}

test();
