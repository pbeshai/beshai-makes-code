const rp = require('request-promise-native');
const fs = require('fs');

async function delay() {
  const durationMs = Math.random() * 800 + 300;
  return new Promise(resolve => {
    setTimeout(() => resolve(), durationMs);
  });
}

async function fetchPlayerYearOverYear(playerId) {
  console.log(`Making API Request for ${playerId}...`);

  const results = await rp({
    uri:
      'https://stats.nba.com/stats/playerdashboardbyyearoveryear?DateFrom=&DateTo=&GameSegment=&LastNGames=0&LeagueID=00&Location=&MeasureType=Base&Month=0&OpponentTeamID=0&Outcome=&PORound=0&PaceAdjust=N&PerMode=PerGame&Period=0&' +
      `PlayerID=${playerId}` +
      '&PlusMinus=N&Rank=N&Season=2019-20&SeasonSegment=&SeasonType=Regular+Season&ShotClockRange=&Split=yoy&VsConference=&VsDivision=',
    headers: {
      Connection: 'keep-alive',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
      'x-nba-stats-origin': 'stats',
      Referer: `https://stats.nba.com/player/${playerId}/`,
    },
    json: true,
  });

  await fs.promises.writeFile(
    `${playerId}.json`,
    JSON.stringify(results, null, 2)
  );
}

async function main() {
  const playerIds = [2544, 201935, 202695, 1629029];
  console.log('Starting script for players', playerIds);

  for (const playerId of playerIds) {
    await fetchPlayerYearOverYear(playerId);
    await delay();
  }

  console.log('Done!');
}

main();
