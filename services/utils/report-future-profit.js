const _ = require("lodash");
let filter = (profit) =>
  profit.incomeType == "FUNDING_FEE" ||
  profit.incomeType == "COMMISSION" ||
  profit.incomeType == "REALIZED_PNL" ||
  profit.incomeType == "REFERRAL_KICKBACK" ||
  profit.incomeType == "COMMISSION_REBATE";
const { sleep } = require("./helper");
const MongoDb = require("./../database/mongodb");
const reportFutureProfit = async (futuresApis) => {
  let FuturesProfitModel = MongoDb.getFuturesProfitModel();
  let responseCommand;
  let totalProfits = {};
  let now = new Date();
  var d = new Date();
  let today = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  let dayStart = new Date(today);
  await Promise.all(
    _.map(futuresApis, async (futuresClient, key) => {
      try {
        let profits = await futuresClient.futuresIncome({
          startTime: dayStart.getTime(),
          limit: 1000,
        });
        await sleep(200);
        if (profits.code) {
          return;
        }
        let newIncome = profits; //.filter(filter);

        let dayProfit = 0;
        for (var i = 0, _len = newIncome.length; i < _len; i++) {
          dayProfit += parseFloat(newIncome[i].income);
        }
        totalProfits[key] = dayProfit;
        await FuturesProfitModel.findOneAndUpdate(
          { env: key, day: dayStart },
          {
            env: key,
            day: dayStart,
            profit: parseFloat(dayProfit.toFixed(3)),
            status: dayProfit < 0 ? "LOSE" : dayProfit > 0 ? "WIN" : "DRAW",
          },
          { upsert: true }
        );
      } catch (error) {
        console.log(error);
      }
    })
  );
  let totalProfit = 0;
  totalProfits = Object.entries(totalProfits)
    .sort((a, b) => (a[1] <= b[1] ? -1 : 1))
    .reduce((acc, pair) => {
      acc[pair[0]] = pair[1];
      return acc;
    }, {});
  _.map(totalProfits, (profit) => {
    totalProfit += profit;
  });
  _.map(totalProfits, (profit, key) => {
    totalProfits[key] = profit.toFixed(1) + " USDT";
  });
  let profit = JSON.stringify(totalProfits, null, 2);
  responseCommand = `Thời gian: ${now.toLocaleTimeString()} ${now.toLocaleDateString()}`;
  responseCommand += `\nTổng lãi/lỗ ngày ${today}: ${totalProfit.toFixed(
    3
  )}USDT `;
  responseCommand += `\n${profit}`;
  return responseCommand;
};
module.exports = reportFutureProfit;
