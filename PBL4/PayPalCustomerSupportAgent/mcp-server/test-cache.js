const CurrencyExchangeService = require('./src/components/currencyExchange');

async function testCaching() {
  console.log('🧪 Testing Currency Exchange Caching\n');
  
  const currencyService = new CurrencyExchangeService();
  
  // Test 1: First call (should hit API)
  console.log('📡 Test 1: First USD to EUR call (API call expected)');
  const start1 = Date.now();
  const result1 = await currencyService.getExchangeRate('USD', 'EUR', 100);
  const time1 = Date.now() - start1;
  console.log(`✅ Result: ${result1.from_currency} ${result1.amount} = ${result1.to_currency} ${result1.converted_amount.toFixed(2)}`);
  console.log(`⏱️ Time: ${time1}ms`);
  console.log(`📊 Source: ${result1.source}\n`);
  
  // Test 2: Second call (should hit cache)
  console.log('💾 Test 2: Second USD to EUR call (cache hit expected)');
  const start2 = Date.now();
  const result2 = await currencyService.getExchangeRate('USD', 'EUR', 50);
  const time2 = Date.now() - start2;
  console.log(`✅ Result: ${result2.from_currency} ${result2.amount} = ${result2.to_currency} ${result2.converted_amount.toFixed(2)}`);
  console.log(`⏱️ Time: ${time2}ms`);
  console.log(`📊 Source: ${result2.source}\n`);
  
  // Test 3: Different amount, same currencies (should hit cache)
  console.log('💾 Test 3: USD to EUR with different amount (cache hit expected)');
  const start3 = Date.now();
  const result3 = await currencyService.getExchangeRate('USD', 'EUR', 250);
  const time3 = Date.now() - start3;
  console.log(`✅ Result: ${result3.from_currency} ${result3.amount} = ${result3.to_currency} ${result3.converted_amount.toFixed(2)}`);
  console.log(`⏱️ Time: ${time3}ms`);
  console.log(`📊 Source: ${result3.source}\n`);
  
  // Test 4: Different currency pair (should hit API)
  console.log('📡 Test 4: USD to NPR call (API call expected)');
  const start4 = Date.now();
  const result4 = await currencyService.getExchangeRate('USD', 'NPR', 100);
  const time4 = Date.now() - start4;
  console.log(`✅ Result: ${result4.from_currency} ${result4.amount} = ${result4.to_currency} ${result4.converted_amount.toFixed(2)}`);
  console.log(`⏱️ Time: ${time4}ms`);
  console.log(`📊 Source: ${result4.source}\n`);
  
  // Test 5: Same currency pair again (should hit cache)
  console.log('💾 Test 5: USD to NPR call again (cache hit expected)');
  const start5 = Date.now();
  const result5 = await currencyService.getExchangeRate('USD', 'NPR', 75);
  const time5 = Date.now() - start5;
  console.log(`✅ Result: ${result5.from_currency} ${result5.amount} = ${result5.to_currency} ${result5.converted_amount.toFixed(2)}`);
  console.log(`⏱️ Time: ${time5}ms`);
  console.log(`📊 Source: ${result5.source}\n`);
  
  // Show cache statistics
  console.log('📊 Cache Statistics:');
  const stats = currencyService.getCacheStats();
  console.log(`   Total entries: ${stats.total}`);
  console.log(`   Valid entries: ${stats.valid}`);
  console.log(`   Expired entries: ${stats.expired}`);
  console.log(`   Max cache size: ${stats.maxSize}`);
  console.log(`   Cache expiry: ${stats.expiryMinutes} minutes`);
  
  // Performance comparison
  console.log('\n⚡ Performance Comparison:');
  console.log(`   API calls: ${time1}ms, ${time4}ms (average: ${(time1 + time4) / 2}ms)`);
  console.log(`   Cache hits: ${time2}ms, ${time3}ms, ${time5}ms (average: ${(time2 + time3 + time5) / 3}ms)`);
  console.log(`   Speed improvement: ${Math.round(((time1 + time4) / 2) / ((time2 + time3 + time5) / 3))}x faster`);
  
  console.log('\n✅ Caching test completed!');
}

// Run the test
testCaching().catch(console.error);
