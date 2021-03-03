const _ = require("lodash");
const calculateAsset = require("./calculate-asset");
const { sleep } = require("./helper");
const calculateSpotBalances = async (exchanges, allTikers) => {
  let allAssets = {};
  let totalBalances = {};
  console.log("spotBalance");

  await Promise.all(
    _.map(exchanges, async (exchange, key) => {
      let spotBalance = [];
      let assets = {};
      let balance = 0;
      try {
        spotBalance = await exchange.fetchBalance({});
        await sleep(100);
        spotBalance = _.pickBy(spotBalance.total, (value, key) => {
          return value > 0;
        });
        if (_.isEmpty(spotBalance)) return;
        for (let [key, value] of Object.entries(spotBalance)) {
          let totalUsdt = calculateAsset(key, allTikers[exchange.id], value);
          if (totalUsdt > 10)
            assets[key] = {
              amount: value,
              asset: totalUsdt,
            };
        }
        _.map(assets, (value) => {
          balance += value.asset;
        });
        allAssets[key] = assets;
        totalBalances[key] = balance;
      } catch (error) {
        console.log(error.message);
      }
    })
  );
  totalBalances = _.pickBy(totalBalances, (value, key) => {
    return value > 0;
  });
  let balance = 0;
  let balances = {};
  // calculate total spot balance
  _.map(totalBalances, (b, key) => {
    balances[key] = b.toFixed(3) + " USDT";
    balance += b;
  });
  return {
    asset: allAssets,
    balances: balances,
    balance: balance,
  };
};
const calculateFuturesBalance = async (exchanges) => {
  let futuresBalances = {};
  let totalFuturesBalance = 0;
  await Promise.all(
    _.map(exchanges, async (exchange, key) => {
      if (exchange.id != "binance") return;
      try {
        futuresBalances[key] = (
          await exchange.fetchBalance({
            type: "future",
          })
        ).total;
        await sleep(100);
      } catch (error) {
        console.log(error);
        return;
      }
    })
  );
  let balances = {};
  _.map(futuresBalances, (futuresBalance, key) => {
    if (futuresBalance.USDT) {
      balances[key] = futuresBalance.USDT.toFixed(3) + " USDT";
      totalFuturesBalance += futuresBalance.USDT;
    }
  });
  return {
    asset: balances,
    balance: totalFuturesBalance,
  };
};
const calculateCrossMarginBalance = async (exchanges, allTikers) => {
  let crossMarginBalances = {};
  crossMarginBalances.balance = 0;
  crossMarginBalances.liability = 0;
  crossMarginBalances.total = 0;
  await Promise.all(
    _.map(exchanges, async (exchange, key) => {
      if (exchange.id != "binance") return;
      try {
        let crossMarginInfo = (
          await exchange.fetchBalance({
            type: "margin",
          })
        ).info;
        if (
          crossMarginInfo.tradeEnabled &&
          crossMarginInfo.totalNetAssetOfBtc > 0
        )
          crossMarginBalances[key] = {
            total: calculateAsset(
              "BTC",
              allTikers.binance,
              crossMarginInfo.totalAssetOfBtc
            ),
            liability: calculateAsset(
              "BTC",
              allTikers.binance,
              crossMarginInfo.totalLiabilityOfBtc
            ),
            balance: calculateAsset(
              "BTC",
              allTikers.binance,
              crossMarginInfo.totalNetAssetOfBtc
            ),
          };
      } catch (error) {
        return;
      }
    })
  );
  _.map(crossMarginBalances, (marginBalance) => {
    if (marginBalance.balance && marginBalance.liability) {
      crossMarginBalances.balance += marginBalance.balance;
      crossMarginBalances.liability += marginBalance.liability;
      crossMarginBalances.total += marginBalance.total;
    }
  });
  return crossMarginBalances;
};
const calculateIsolatedMarginBalance = async (exchanges, allTikers) => {
  let isolatedMarginBalances = {};
  isolatedMarginBalances.balance = 0;
  isolatedMarginBalances.liability = 0;
  isolatedMarginBalances.total = 0;
  await Promise.all(
    _.map(exchanges, async (exchange, key) => {
      if (exchange.id != "binance") return;
      try {
        let isolatedMarginInfo = await exchange.sapi_get_margin_isolated_account();
        if (parseFloat(isolatedMarginInfo.totalNetAssetOfBtc) > 0) {
          isolatedMarginBalances[key] = {
            total: calculateAsset(
              "BTC",
              allTikers.binance,
              isolatedMarginInfo.totalAssetOfBtc
            ),
            liability: calculateAsset(
              "BTC",
              allTikers.binance,
              isolatedMarginInfo.totalLiabilityOfBtc
            ),
            balance: calculateAsset(
              "BTC",
              allTikers.binance,
              isolatedMarginInfo.totalNetAssetOfBtc
            ),
          };
        }
      } catch (error) {
        return;
      }
    })
  );
  _.map(isolatedMarginBalances, (marginBalance) => {
    if (marginBalance.balance && marginBalance.liability) {
      isolatedMarginBalances.balance += marginBalance.balance;
      isolatedMarginBalances.liability += marginBalance.liability;
      isolatedMarginBalances.total += marginBalance.total;
    }
  });
  return isolatedMarginBalances;
};
module.exports = {
  calculateSpotBalances,
  calculateFuturesBalance,
  calculateCrossMarginBalance,
  calculateIsolatedMarginBalance,
};
