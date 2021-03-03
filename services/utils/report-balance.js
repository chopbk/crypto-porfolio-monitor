const {
  calculateSpotBalances,
  calculateFuturesBalance,
  calculateCrossMarginBalance,
  calculateIsolatedMarginBalance,
} = require("./get-balance");
const _ = require("lodash");

const reportBalance = async (exchanges, allTikers) => {
  console.log("calculate spot balance");
  let now = new Date();
  let msg = `Thời gian: ${now.toLocaleTimeString()} ${now.toLocaleDateString()}`;
  let spotBalanceInfo = await calculateSpotBalances(exchanges, allTikers);
  let anotherBalances = {
    metamask: 1600,
    mxc: 1000,
    trust: 1000,
    pool: 1000,
    binancePool: 2000,
  };
  // calculate total spot balance
  _.map(anotherBalances, (balance) => {
    spotBalanceInfo.balance += balance;
  });
  console.log(spotBalanceInfo);
  msg += "\nSpot";
  msg += msg += JSON.stringify(spotBalanceInfo.balances, null, 2);
  console.log("calculate futures balance");
  let futuresBalances = await calculateFuturesBalance(exchanges, allTikers);
  console.log(futuresBalances);
  console.log("calculate margin balance");
  let crossMarginBalances = await calculateCrossMarginBalance(
    exchanges,
    allTikers
  );
  console.log(crossMarginBalances);

  console.log("calculate isolated balance");
  let isolatedMarginBalances = await calculateIsolatedMarginBalance(
    exchanges,
    allTikers
  );
  console.log(isolatedMarginBalances);

  msg += `\nSố dư Spot: ${spotBalanceInfo.balance} USDT`;
  msg += "\nFutures";
  msg += JSON.stringify(futuresBalances.asset, null, 2);
  msg += `\nSố dư Futures: ${futuresBalances.balance} USDT`;
  msg += `\nSố dư Cross margin: ${crossMarginBalances.balance} USDT`;
  msg += `\nSố dư Isolated Margin: ${isolatedMarginBalances.balance} USDT`;
  msg += `\nNợ Cross Margin: ${crossMarginBalances.liability} USDT`;
  msg += `\nNợ Isolated Margin: ${isolatedMarginBalances.liability} USDT`;
  let totalBalance =
    spotBalanceInfo.balance +
    futuresBalances.balance +
    crossMarginBalances.balance +
    isolatedMarginBalances.balance;
  let totalLiabilityBalance =
    isolatedMarginBalances.liability + crossMarginBalances.liability;
  msg += `\nTổng tài sản: ${totalBalance} USDT`;
  msg += `\nTổng nợ: ${totalLiabilityBalance} USDT`;
  return msg;
};

module.exports = reportBalance;
