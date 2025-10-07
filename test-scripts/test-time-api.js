const { getBelgianTime } = require('../services/timeService');

console.log('🧪 Testing Belgian time API fallbacks...\n');

getBelgianTime()
  .then(result => {
    console.log('✅ SUCCESS! Belgian time retrieved:');
    console.log(`   Hour: ${result.hour}`);
    console.log(`   Minute: ${result.minute}`);
    console.log(`   Is after 9 AM: ${result.isAfter9AM}`);
    console.log(`   DateTime: ${result.datetime}`);
  })
  .catch(error => {
    console.error('❌ FAILED! All time APIs failed');
    console.error(`   Error: ${error.message}`);
    console.log('\n⚠️ This is expected if your firewall/antivirus is blocking API requests.');
    console.log('   The app will gracefully handle this by allowing updates anyway.');
  });
