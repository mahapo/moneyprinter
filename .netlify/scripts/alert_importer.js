const puppeteer = require('puppeteer');
const symbols = require('./symbols.json');


const message = 'ticker:{{ticker}};interval:{{interval}};buy:{{plot("Buy")}};sell:{{plot("Sell")}};buy_strong:{{plot("Strong Buy")}};sell_strong:{{plot("Strong Sell")}};close:{{close}};timenow:{{timenow}}';
const interval = 15;

(async () => {
  const markets = symbols
    .sort((a, b) => b.quoteVolume - a.quoteVolume)
    .filter(market => market.symbol.endsWith('USDT'))
    .map(market => market.symbol)
    .slice(0,100)
  console.table(markets)

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    // args: ['--disable-dev-shm-usage'],
    // slowMo: 2
  })
  const page = await browser.newPage();

  const waitAndlick = async (selector) => {
    await page.waitForSelector(selector)
    await page.click(selector, {
      delay: 200
    })
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  await page.goto('https://www.tradingview.com/')
  await page.waitForSelector('.js-header-user-menu-button')
  await page.click('.js-header-user-menu-button')
  await page.waitForSelector('[data-name="header-user-menu-sign-in"]')
  await page.click('[data-name="header-user-menu-sign-in"]')
  await page.waitForSelector('.tv-signin-dialog__social')
  await page.click('.js-show-email')
  await page.type('input[name="username"]', "mahapo1991")
  await page.type('input[name="password"]', "wortKenn_91")
  await page.click('button[type="submit"]')
  await page.waitForSelector('.widgetbar-pages')

  await page.goto(
    'https://www.tradingview.com/chart/UofOIzEh/', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    }
  )
  // await waitAndlick('[data-name="alerts"]')
  
  await waitAndlick(`#header-toolbar-intervals [data-value="${interval}"]`)

  for (const market of markets) {
    await waitAndlick('#header-toolbar-symbol-search')
    await page.waitForSelector('[data-name="symbol-search-items-dialog"]')
    await page.type('input[data-role="search"]', market + "PERP")
    await page.keyboard.press('Enter'); // Enter Key
    
    await sleep(3000)
    // await waitAndlick('.widgetbar-widget-alerts_manage [class^="title"]')
    try {
      page.click('.widgetbar-widget-alerts_manage [data-name="set-alert-button"]', {delay: 2000})
    } catch (error) {
    }
    await page.keyboard.down('Alt')
    await page.keyboard.press('A')
    await page.keyboard.up('Alt')
    await sleep(2000)
    await waitAndlick('.js-main-series-select-wrap')
    await waitAndlick('.js-main-series-select-wrap [data-id="2"]')
    await waitAndlick('.js-condition-operator-input-wrap')
    await waitAndlick('.js-condition-operator-input-wrap [data-id="1"]')
    await waitAndlick('.js-buttons-group-option [data-title="Once Per Bar"]')
    // await waitAndlick('.js-buttons-group-option [data-title="Once Per Bar Close"]')
    // await page.type('input[name="alert_exp_date"]', "2021-10-20")
    await page.type('input[name="alert-name"]', `${market} ${interval}m`)
    await page.click('.tv-control-textarea', { clickCount: 3 })
    await page.type('.tv-control-textarea', message)
    await page.click('[data-name="submit"]')
  }
})()