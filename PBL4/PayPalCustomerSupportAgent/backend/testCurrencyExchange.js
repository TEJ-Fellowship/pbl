const { getExchangeRate, getSupportedCurrencies, isValidCurrencyCode, formatCurrencyAmount } = require('./services/currencyExchangeService');

async function testCurrencyExchange() {
  console.log('🧪 Testing Currency Exchange Service\n');
  
  try {
    // Test 1: Basic exchange rate
    console.log('Test 1: USD to EUR');
    const usdToEur = await getExchangeRate('USD', 'EUR', 100);
    console.log(`Result: ${usdToEur.amount} ${usdToEur.from_currency} = ${usdToEur.converted_amount.toFixed(2)} ${usdToEur.to_currency}`);
    console.log(`Rate: 1 ${usdToEur.from_currency} = ${usdToEur.exchange_rate} ${usdToEur.to_currency}\n`);
    
    // Test 2: Different currency pair
    console.log('Test 2: GBP to JPY');
    const gbpToJpy = await getExchangeRate('GBP', 'JPY', 50);
    console.log(`Result: ${gbpToJpy.amount} ${gbpToJpy.from_currency} = ${gbpToJpy.converted_amount.toFixed(2)} ${gbpToJpy.to_currency}`);
    console.log(`Rate: 1 ${gbpToJpy.from_currency} = ${gbpToJpy.exchange_rate} ${gbpToJpy.to_currency}\n`);
    
    // Test 3: Same currency (should be 1:1)
    console.log('Test 3: USD to USD');
    const usdToUsd = await getExchangeRate('USD', 'USD', 100);
    console.log(`Result: ${usdToUsd.amount} ${usdToUsd.from_currency} = ${usdToUsd.converted_amount} ${usdToUsd.to_currency}`);
    console.log(`Rate: 1 ${usdToUsd.from_currency} = ${usdToUsd.exchange_rate} ${usdToUsd.to_currency}\n`);
    
    // Test 4: Currency validation
    console.log('Test 4: Currency validation');
    console.log(`USD is valid: ${isValidCurrencyCode('USD')}`);
    console.log(`XYZ is valid: ${isValidCurrencyCode('XYZ')}\n`);
    
    // Test 5: Currency formatting
    console.log('Test 5: Currency formatting');
    console.log(`$100 USD: ${formatCurrencyAmount(100, 'USD')}`);
    console.log(`€85.50 EUR: ${formatCurrencyAmount(85.50, 'EUR')}`);
    console.log(`¥11000 JPY: ${formatCurrencyAmount(11000, 'JPY')}\n`);
    
    // Test 6: Error handling
    console.log('Test 6: Error handling');
    try {
      await getExchangeRate('USD', 'INVALID');
    } catch (error) {
      console.log(`Expected error: ${error.message}\n`);
    }
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCurrencyExchange();

