const fs = require('fs');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const TIMEOUT = 20000; // 20s timeout with puppeteer operations
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36';

async function newPage(browser) {
  // get a new page
  page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT);

  // spoof user agent
  await page.setUserAgent(USER_AGENT);

  // pretend to be desktop
  await page.setViewport({
    width: 1980,
    height: 1080,
  });

  return page;
}

async function fetchUrl(browser, url) {
  const page = await newPage(browser);

  await page.goto(url, { timeout: TIMEOUT, waitUntil: 'domcontentloaded' });
  const html = await page.content(); // sometimes this seems to hang, so now we create a new page each time
  await page.close();

  return html;
}

async function downloadShootingData(browser) {
  const url =
    'https://www.basketball-reference.com/players/c/curryst01/shooting/2020';
  const htmlFilename = 'shots.html';

  // check if we already have the file
  const fileExists = fs.existsSync(htmlFilename);
  if (fileExists) {
    console.log(
      `Skipping download for ${url} since ${htmlFilename} already exists.`
    );
    return;
  }

  // download the HTML from the web server
  console.log(`Downloading HTML from ${url}...`);
  const html = await fetchUrl(browser, url);

  // save the HTML to disk
  await fs.promises.writeFile(htmlFilename, html);
}

async function parseShots() {
  console.log('Parsing box score HTML...');

  // the input filename
  const htmlFilename = 'shots.html';
  // read the HTML from disk
  const html = await fs.promises.readFile(htmlFilename);
  // parse the HTML with Cheerio
  const $ = cheerio.load(html);

  // for each of the shot divs, convert to JSON
  const divs = $('.shot-area > div').toArray();
  const shots = divs.map(div => {
    const $div = $(div);

    // style="left:50px;top:120px" -> x = 50, y = 120
    const x = +$div.css('left').slice(0, -2);
    const y = +$div.css('top').slice(0, -2);

    // class="tooltip make" or "tooltip miss"
    const madeShot = $div.hasClass('make');

    // tip="...Made 3-pointer..."
    const shotPts = $div.attr('tip').includes('3-pointer') ? 3 : 2;

    return {
      x,
      y,
      madeShot,
      shotPts,
    };
  });

  return shots;
}

async function main() {
  console.log('Starting...');

  // download the HTML after javascript has run
  const browser = await puppeteer.launch();
  await downloadShootingData(browser);
  await browser.close();

  // parse the HTML
  const shots = await parseShots();

  // save the scraped results to disk
  await fs.promises.writeFile('shots.json', JSON.stringify(shots, null, 2));

  console.log('Done!');
}

main();
