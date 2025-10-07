const fs = require('fs');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function scrapePayPalFees(url,fileName) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (compatible; ScraperBot/1.0)');
  await page.goto(url, { waitUntil: 'networkidle2' });

  const html = await page.content();
  const $ = cheerio.load(html);

  const tablesData = [];

  // Find all table elements
  $('table').each((index, table) => {
    const tableData = {};
    const $table = $(table);

    // Capture description/title above the table (if exists)
    const description = $table.prevAll('p, h2, h3').first().text().trim();
    tableData.description = description || `Table ${index + 1}`;

    // Extract headers
    const headers = [];
    $table.find('thead tr th').each((i, th) => {
      headers.push($(th).text().trim());
    });

    // Extract rows
    const rows = [];
    $table.find('tbody tr').each((i, tr) => {
      const rowData = {};
      $(tr).find('td').each((j, td) => {
        const header = headers[j] || `Column ${j + 1}`;
        rowData[header] = $(td).text().trim();
      });
      rows.push(rowData);
    });

    tableData.headers = headers;
    tableData.rows = rows;
    tablesData.push(tableData);
  });

  await browser.close();

  // Save data as JSON
  fs.writeFileSync(fileName, JSON.stringify(tablesData, null, 2));
  console.log(`✅ Data saved to ${fileName}`);
}

const paypalConsumerUrl = 'https://www.paypal.com/us/digital-wallet/paypal-consumer-fees'; 
scrapePayPalFees(paypalConsumerUrl,"paypal_consumer_fees.json");
const paypalMerchantUrl = 'https://www.paypal.com/us/business/paypal-business-fees'; 
scrapePayPalFees(paypalMerchantUrl,"paypal_merchant_fees.json");
const paypalBraintreeUrl = 'https://www.paypal.com/us/enterprise/paypal-braintree-fees'; 
scrapePayPalFees(paypalBraintreeUrl,"paypal_braintree_fees.json");
