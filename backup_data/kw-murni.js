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
    console.log('membuka google...');

    const rawKeywords = fs.readFileSync('ohiyo.txt', 'utf-8').split('\n');

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
    console.log(`menulis: ${keyword}...`);

    await Promise.all([
        page.keyboard.press("Enter"),
        await page.waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: 120000
        })
    ]);
    await scrollDownToBottom(page);
    console.log('sedang mencari web...');

    const results = [];
    const searchResults = await page.$$('[jsname="UWckNb"]');
    console.log("Panjang Baris : " + searchResults.length);

    for (let i = 0; i < searchResults.length; i++) {
        const title = await searchResults[i].evaluate(node => node.getAttribute("href"));
        console.log("hasil url"+'\n'+ title);
        console.log("target url "+ targetUrl + '\n');
        if (title === targetUrl) {
            results.push({
                index: i + 1,
                title
            });
            break;
        }

    }

    if (results.length > 0) {
        console.log("Website ditemukan:", results);
        console.log('Sudah menemukan web...✔\n');
    } else {
        console.log("Website tidak ditemukan...❌\n");
    }

    const cancel = await page.$("[role='button'].M2vV3.vOY7J");
    await cancel.click();
    await page.waitForTimeout(5000);
}

async function scrollDownToBottom(page) {
    let lastScrollPosition = 0;
    let retries = 3;

    while (retries > 0) {
        const currentScrollPosition = await page.evaluate(() => window.scrollY);
        if (currentScrollPosition === lastScrollPosition) {
            retries--;
        } else {
            retries = 3;
        }

        lastScrollPosition = currentScrollPosition;
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(1000);
    }
}