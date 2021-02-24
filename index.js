const ccxt = require("ccxt");
const _ = require("lodash");
process.env.API_KEY =
  "dBjdvgJzHy7rRFJUVRmEORPVxswFAWhfkNReB4eOEPyAUmEmXCDfJ6k9iBdCljcv";
process.env.API_SECRET =
  "j0N2UnXB8GVbYHKNc11VFHhN3b0ZWM3nZ2Mjxb4fuO2IXsfTZ9ummtUWZQzLIdii";
const binanceClient = new ccxt.binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
});
const coinmarketcapClient = new ccxt.coinmarketcap();
(async () => {
  binanceClient.options = {
    adjustForTimeDifference: true,
  };
  let balanceSpot = await binanceClient.fetchBalance();
  //   for (const [key, value] of Object.entries(balanceSpot)) {
  //     console.log(`${key}: ${value}`);
  //   }
  let balanceSpotFilter = _.pickBy(balanceSpot.total, (value, key) => {
    return value > 0;
  });
  let balanceSpotArrays = [];
  _.each(balanceSpotFilter, (value, key) => {
    balanceSpotArrays.push({
      symbol: key + "/USDT",
      amount: value,
    });
  });
  console.log(balanceSpotArrays);
  //   let balances = await Promise.all(
  //     balanceSpotArrays.map(async (s) => {
  //       let priceInfo = await coinmarketcapClient.fetchTicker(s.symbol);
  //       let symbolBalance = priceInfo.last * amount;
  //       return symbolBalance;
  //     })
  //   );
  //   let total = balances.reduce((a, b) => a + b, 0);
  //   console.log(total);
  //   let test2 = _.pickBy(balances.used, (value, key) => {
  //     return value > 0;
  //   });
  //   let marginBlance = await binanceClient.sapi_get_margin_isolated_account();

  //   for (const [key, value] of Object.entries(marginBlance)) {
  //     //if (value > 0)
  //     console.log(`${key}: ${value}`);
  //   }
  //   let filter = _.pickBy(marginBlance.assets, (value, key) => {
  //     return parseFloat(value.baseAsset.netAsset) > 0;
  //   });
  //   console.log(filter);
  //console.log(await coinmarketcapClient.fetchTicker("BTC/USDT"));
})();
