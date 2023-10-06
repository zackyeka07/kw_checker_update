const puppeteer = require('puppeteer-extra');
const { executablePath } = require('puppeteer')
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const baseUrl = "https://www.google.com/";
puppeteer.use(StealthPlugin());
const fs = require('fs');
const { title } = require('process');

let page;
let browser;

let stop = false;
const proccess = async (logToTextarea, logToTable, proggress, list, headless) => {
    browser = await puppeteer.launch({
        executablePath: executablePath(),
        headless: headless,
        defaultViewport: null,
        args: ["--force-device-scale-factor=0.5"]
    });
    
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://www.google.com/', ["geolocation", "notifications"]);
    
    page = await browser.newPage();
    await page.goto(baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 120000
    });
    logToTextarea("[INFO] Membuka google...\n")

    const rawKeywords = fs.readFileSync(list, 'utf-8').split('\n');
    for (let i = 0; i < rawKeywords.length; i++) {
        const data = rawKeywords[i].split(';');
        await searchKeyword(page, data[0],data[1], logToTextarea, logToTable);
        const progressPercentage = parseInt(((i + 1) / rawKeywords.length) * 100);
        proggress(progressPercentage);
    }

    await browser.close();
};

async function searchKeyword(page, keyword, targetUrl, logToTextarea, logToTable) {
    logToTextarea(keyword,targetUrl);
    await page.type('textarea[name="q"]', keyword, {
        delay: 100
    });
    
    await Promise.all([
        page.keyboard.press("Enter"),
        page.waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: 120000
        })
    ]);

    await scrollDownToBottom(page);
    
    const results = [];
    const searchResults = await page.$$('[jsname="UWckNb"]');
    logToTextarea("Search : " + targetUrl)
    logToTextarea("Panjang Baris : " + searchResults.length);

    for (let i = 0; i < searchResults.length; i++) {
        const title = await searchResults[i].evaluate(node => node.getAttribute("href"));
        if (title === targetUrl) {
            results.push({
                index: i,
                title
            });
            break;
        }
    }

    if (results.length > 0) {
        logToTextarea(`Website diindex ke : ${results[0].index}`);
        logToTextarea(`Url : ${results[0].title}\n`);
        logToTable(results[0].index,results[0].title);
        const hasil = results[0].index
        const search = results[0].title
        logToTable(hasil,search)
    } else {
        logToTextarea("Website tidak ditemukan.");
        logToTable("Tidak Ditemukan", targetUrl);
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

const stopProccess = (logToTextarea) => {
    stop = true;
}

module.exports = {
    proccess,
    stopProccess
}
