/* 
    This script was written by Ella {https://telegram.com/daniella45}
    You can contact me for any web service, (site scraping, backend design and others)
*/

const puppeteer = require('puppeteer'); // You have to install nodejs and then run 'npm i puppeteer' to use this dependency

//      <-------------------------------------->        //
//      Tweak all values here to make the script work to your style

    const number = '12345678'; // Change to your number
    const password = 'myPassword'; // Change to your password

    const laxTime = 3; // Wait 3 seconds before starting to scrape the site, change this value depending on the script's speed

//      <-------------------------------------->        // 

//      <-------------------------------------->        // 
//              Actual Working Code                     //

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto('https://kickassanime.com.es/', {
            waitUntil: 'domcontentloaded',
        });
    } catch (error) {
        console.error('Error:', error);
    }
})();

//                                                      //
//      <-------------------------------------->        // 

/* Dont tweak this */

async function waitXSeconds(timeInSeconds) {
    return new Promise(resolve => setTimeout(resolve, timeInSeconds*1000));
}
