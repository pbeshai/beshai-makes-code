const rp = require('request-promise-native');
const fs = require('fs');
const cheerio = require('cheerio');

async function downloadBoxScoreHtml() {
  // where to download the HTML from
  const uri = 'https://www.espn.com/nba/boxscore?gameId=401160888';
  // the output filename
  const filename = 'boxscore.html';

  // check if we already have the file
  const fileExists = fs.existsSync(filename);
  if (fileExists) {
    console.log(
      `Skipping download for ${uri} since ${filename} already exists.`
    );
    return;
  }

  // download the HTML from the web server
  console.log(`Downloading HTML from ${uri}...`);
  const results = await rp({ uri: uri });

  // save the HTML to disk
  await fs.promises.writeFile(filename, results);
}

async function parseBoxScore() {
  console.log('Parsing box score HTML...');

  // the input filename
  const htmlFilename = 'boxscore.html';
  // read the HTML from disk
  const html = await fs.promises.readFile(htmlFilename);
  // parse the HTML with Cheerio
  const $ = cheerio.load(html);

  // Get our rows
  const $trs = $('.gamepackage-away-wrap tbody tr:not(.highlight)');

  const values = $trs.toArray().map(tr => {
    // find all children <td>
    const tds = $(tr)
      .find('td')
      .toArray();

    // create a player object based on the <td> values
    const player = {};
    for (td of tds) {
      const $td = $(td);

      // map the td class attr to its value
      const key = $td.attr('class');
      let value;
      if (key === 'name') {
        value = $td.find('a span:first-child').text();
      } else {
        value = $td.text();
      }
      player[key] = isNaN(+value) ? value : +value;
    }

    return player;
  });

  return values;
}

async function main() {
  console.log('Starting...');

  await downloadBoxScoreHtml();
  const boxScore = await parseBoxScore();

  // save the scraped results to disk
  await fs.promises.writeFile(
    'boxscore.json',
    JSON.stringify(boxScore, null, 2)
  );

  console.log('Done!');
}

main();
