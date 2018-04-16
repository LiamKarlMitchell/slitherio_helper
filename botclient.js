const puppeteer = require('puppeteer');

const Promise = require('bluebird');

var readFile = Promise.promisify(require("fs").readFile);


(async () => {
  var userScript = await readFile("./slitherio_userscript.js", "utf8");

  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('http://slither.io');

  // Get the "viewport" of the page, as reported by the page.
  const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      deviceScaleFactor: window.devicePixelRatio
    };
  });

  console.log('Dimensions:', dimensions);


  var jQueryHandle = await page.addScriptTag({url: '"http://code.jquery.com/jquery-git.min.js"'})

  await page.evaluate(jQueryHandle);

  await page.evaluate(userScript);

  await page.close();

  await browser.close();
})();


// await page.setRequestInterceptionEnabled(true);

// page.on('request', interceptedRequest => {
//     //some code here that adds this request to ...
//     //a list and checks whether all list items have ...
//     //been successfully completed!
// });