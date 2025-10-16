const axios = require('axios');
const NodeCache = require('node-cache');

// ===== CONFIGURATION =====
const EXCHANGE_API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';
const CACHE_TTL = 300; // 5 minutes cache

// Initialize cache
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// ===== CURRENCY EXCHANGE FUNCTION =====
async function getExchangeRate(fromCurrency, toCurrency, amount = 1) {
  try {
    console.log(`💱 Getting exchange rate: ${fromCurrency} to ${toCurrency}`);
    
    // Validate currency codes
    if (!fromCurrency || !toCurrency) {
      throw new Error('Both fromCurrency and toCurrency are required');
    }
    
    // Check cache first
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cachedRate = cache.get(cacheKey);
    
    if (cachedRate) {
      console.log(`✅ Using cached rate for ${fromCurrency} to ${toCurrency}`);
      return calculateConversion(cachedRate, amount, fromCurrency, toCurrency);
    }
    
    // Fetch from API
    const response = await axios.get(`${EXCHANGE_API_BASE_URL}/${fromCurrency}`);
    
    if (!response.data || !response.data.rates) {
      throw new Error('Invalid API response');
    }
    
    const rates = response.data.rates;
    const rate = rates[toCurrency];
    
    if (!rate) {
      throw new Error(`Currency ${toCurrency} not supported`);
    }
    
    // Cache the rate
    cache.set(cacheKey, rate);
    
    console.log(`✅ Fetched fresh rate: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
    
    return calculateConversion(rate, amount, fromCurrency, toCurrency);
    
  } catch (error) {
    console.error('❌ Currency exchange error:', error.message);
    throw error;
  }
}

// ===== CONVERSION CALCULATION =====
function calculateConversion(rate, amount, fromCurrency, toCurrency) {
  const convertedAmount = amount * rate;
  
  return {
    from_currency: fromCurrency,
    to_currency: toCurrency,
    exchange_rate: rate,
    amount: amount,
    converted_amount: convertedAmount,
    timestamp: new Date().toISOString(),
    source: 'exchangerate-api',
    cache_hit: false
  };
}

// ===== GET SUPPORTED CURRENCIES =====
async function getSupportedCurrencies() {
  try {
    console.log('📋 Fetching supported currencies');
    
    const response = await axios.get(`${EXCHANGE_API_BASE_URL}/USD`);
    
    if (!response.data || !response.data.rates) {
      throw new Error('Invalid API response');
    }
    
    const currencies = Object.keys(response.data.rates);
    currencies.unshift('USD'); // Add base currency
    
    console.log(`✅ Found ${currencies.length} supported currencies`);
    return currencies;
    
  } catch (error) {
    console.error('❌ Error fetching supported currencies:', error.message);
    return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']; // Fallback currencies
  }
}

// ===== VALIDATE CURRENCY CODE =====
function isValidCurrencyCode(currencyCode) {
  const validCodes = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD',
    'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR', 'KRW'
  ];
  
  return validCodes.includes(currencyCode?.toUpperCase());
}

// ===== GET CURRENCY INFO =====
function getCurrencyInfo(currencyCode) {
  const currencyInfo = {
    'USD': { name: 'US Dollar', symbol: '$' },
    'EUR': { name: 'Euro', symbol: '€' },
    'GBP': { name: 'British Pound', symbol: '£' },
    'JPY': { name: 'Japanese Yen', symbol: '¥' },
    'CAD': { name: 'Canadian Dollar', symbol: 'C$' },
    'AUD': { name: 'Australian Dollar', symbol: 'A$' },
    'CHF': { name: 'Swiss Franc', symbol: 'CHF' },
    'CNY': { name: 'Chinese Yuan', symbol: '¥' },
    'SEK': { name: 'Swedish Krona', symbol: 'kr' },
    'NZD': { name: 'New Zealand Dollar', symbol: 'NZ$' }
  };
  
  return currencyInfo[currencyCode?.toUpperCase()] || { name: currencyCode, symbol: currencyCode };
}

// ===== FORMAT CURRENCY AMOUNT =====
function formatCurrencyAmount(amount, currencyCode) {
  const info = getCurrencyInfo(currencyCode);
  const formattedAmount = parseFloat(amount).toFixed(2);
  
  if (currencyCode === 'JPY') {
    return `${info.symbol}${Math.round(amount)}`;
  }
  
  return `${info.symbol}${formattedAmount}`;
}

module.exports = {
  getExchangeRate,
  getSupportedCurrencies,
  isValidCurrencyCode,
  getCurrencyInfo,
  formatCurrencyAmount
};
