const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const baseUrl = "https://www.google.com/";
const {
    title
} = require('process');

let browser;
let page;

let stop = false;
const proccess = async (logToTextarea, logToTable, proggress, list, headless) => {
    browser = await puppeteer.launch({
        headless: headless,
        args: ["--force-device-scale-factor=0.5"]
    });

    const context = browser.defaultBrowserContext();
    await context.overridePermissions(baseUrl, ["geolocation", "notifications"]);

    page = await browser.newPage();
    await page.goto(baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 120000
    });
    logToTextarea('[INFO] Opening Google...\n');

    const rawKeywords = fs.readFileSync(list, 'utf-8').split('\n');
    for (let i = 0; i < rawKeywords.length; i++) {
        const item = rawKeywords[i];
        const [keyword, target] = item.split(';');
        if (keyword && target) {
            await searchKeyword(page, keyword.trim(), target.trim(), logToTextarea, logToTable);
            const progressPercentage = parseInt(((i + 1) / rawKeywords.length) * 100);
            proggress(progressPercentage);
        } else {
            logToTextarea('Invalid line in the input file:', item);
        }

    }

    await browser.close();
};

async function searchKeyword(page, keyword, target, logToTextarea, logToTable) {
    await page.type('textarea[name="q"]', keyword, {
        delay: 10
    });
    logToTextarea(`Typing: ${keyword}...`);

    await Promise.all([
        page.keyboard.press("Enter"),
        page.waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: 120000
        })
    ]);

    await scrollDownToBottom(page);
    let currentPage = 1;

    logToTextarea(`Searching for websites on page ${currentPage}...`);
    const searchResults = await page.$$('.N54PNb.BToiNc.cvP2Ce');
    logToTextarea("Number of Search Results: " + searchResults.length + '\n')

    let found = false;

    for (let i = 0; i < searchResults.length; i++) {
        let links = await searchResults[i].$('[jsname="UWckNb"]');
        const href = await links.evaluate(e => e.getAttribute('href'));

        if (href == target) {
            logToTextarea("Website found at index: " + i);
            logToTextarea('Found the website...✔\n');

            const index = i + 1;
            const titleElement = await links.$('h3');
            const title = await titleElement.evaluate(e => e.innerText);
            logToTable(index, target);

            found = true;
            break;
        }
    }

    if (!found) {
        logToTextarea('Website not found in search results.\n');
        logToTable('Not Found', keyword);
    }

    const cancelSelector = '[role="button"]';
    const cancel = await page.waitForSelector(cancelSelector, {
        visible: true,
        timeout: 5000
    });
    logToTextarea("Menekan tombol silang");
    if (cancel) {
        await cancel.click();
        await page.waitForTimeout(5000);
    }

    await page.waitForTimeout(3000);
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

const stopProccess = (logToTextarea) => {
    stop = true;
}

module.exports = {
    proccess,
    stopProccess
}