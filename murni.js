const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const baseUrl = "https://www.google.com/";

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.goto(baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 120000
    });
    console.log('Opening Google...');

    const rawKeywords = fs.readFileSync('iya.txt', 'utf-8').split('\n');
    for (let item of rawKeywords) {
        const [keyword, target] = item.split(';');
        await searchKeyword(page, keyword.trim(), target.trim());
    }
    await browser.close();
})();

async function searchKeyword(page, keyword, targetUrl) {
    await page.type('textarea[name="q"]', keyword, {
        delay: 100
    });
    console.log(`Typing: ${keyword}...`);
    await Promise.all([
        page.keyboard.press("Enter"),
        await page.waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: 120000
        })
    ]);

    console.log('Searching for websites...');
    const searchResults = await page.$$('[data-ved] a');
    console.log("Number of Search Results: " + searchResults.length);

    for (let i = 0; i < searchResults.length; i++) {
        const href = await searchResults[i].evaluate(node => node.getAttribute("href"));
        if (href === targetUrl) {
            console.log("Website found at index:", i + 1);
            console.log('Found the website...✔\n');
            return;
        }
    }

    console.log("Website not found...❌\n");
}