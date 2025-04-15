const puppeteer = require('/home/ella/.nvm/versions/node/v23.5.0/lib/node_modules/puppeteer');
const axios = require('axios');
const fs = require('fs').promises;

async function download() {
  // Launch Puppeteer to navigate to the target page and extract image URL
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1400,900']
  });
  const page = await browser.newPage();
  await page.goto('https://en.savefrom.net/#url=https://www.youtube.com/watch?v=YcBnq6lltnA', {
    waitUntil: ['networkidle0','domcontentloaded'],
    timeout: 0
  });
  // Wait for the image element to appear
  await page.waitForSelector("#output-captcha-dialog > div.a11y-dialog-content.captcha-dialog__document > div img");

  let imageUrl = await page.evaluate(() => {
    return document.querySelector("#output-captcha-dialog > div.a11y-dialog-content.captcha-dialog__document > div > form > div.captcha-dialog__img__ctr > img").src;
  });
  
  // Download the image data
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imagePath = 'downloaded_image.png';
  await fs.writeFile(imagePath, imageResponse.data);
  

  // Convert image to Base64 data URL
  const base64Image = imageResponse.data.toString('base64');
  const dataUrl = `data:image/png;base64,${base64Image}`;

  // Prepare your Optiic API key. Replace with your actual key.
  const apiKey = '5FmYujH2igfE27hbk9b8gDS4s92oLVybiw3ncXoiQH5N';

  // Send OCR request to Optiic API
  // According to Optiic's docs, the endpoint is https://api.optiic.dev/process
  // You can pass the image as a URL or as a file.
  // Here we pass the image as a Base64 string using the "image" parameter.
  try {
    const ocrResponse = await axios.post(
      'https://api.optiic.dev/process',
      {
        apiKey: apiKey,
        // Passing the image as a Base64 string; Optiic accepts local file paths too.
        image: dataUrl,
        mode: 'ocr'  // Specifies that you want OCR processing
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.dir(ocrResponse.data, { depth: null });
  } catch (error) {
    console.error('Error during OCR:', error.response ? error.response.data : error.message);
  }
}

download();

