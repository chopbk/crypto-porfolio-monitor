const _ = require("lodash");
const { sleep } = require("./helper");
const { calculateFuturesProfit } = require("./futures-profit");
const MongoDb = require("./../database/mongodb");
const reportFutureProfit = async (futuresApis, params = {}) => {
  let FuturesProfitModel = MongoDb.getFuturesProfitModel();
  let responseCommand;
  let totalProfits = {};
  let balances = {};
  let now = new Date();
  var d = new Date();
  let todayString =
    d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  if (!params.start) {
    params.start = todayString;
  }

  await Promise.all(
    _.map(futuresApis, async (futuresClient, env) => {
      let dayStart = new Date(params.start);
      let dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      let end = !params.end ? new Date() : new Date(params.end);

      try {
        let accountBalances = await futuresClient.futuresBalance();
        accountBalance = accountBalances.find((b) => b.asset == "USDT");
        let balance = parseFloat(accountBalance.balance).toFixed(2);
        let accProfit = 0;
        let dayProfit = 0;
        let dayProfitDbs = await FuturesProfitModel.find({
          env: env,
          day: { $gte: dayStart.toLocaleDateString() },
        });
        do {
          dayProfit = 0;
          let today = new Date(todayString);
          let dayProfitDb = dayProfitDbs.find(
            (profit) => profit.day.valueOf() === dayStart.valueOf()
          );
          if (today.valueOf() === dayStart.valueOf()) dayProfitDb = false;
          if (!dayProfitDb) {
            let params = {
              startTime: dayStart.getTime(),
              endTime: dayEnd.getTime(),
              limit: 1000,
            };
            dayProfit = await calculateFuturesProfit(futuresClient, params);
            await FuturesProfitModel.findOneAndUpdate(
              { env: env, day: dayStart },
              {
                env: env,
                day: dayStart,
                profit: parseFloat(dayProfit.toFixed(3)),
                status: dayProfit < 0 ? "LOSE" : dayProfit > 0 ? "WIN" : "DRAW",
              },
              { upsert: true }
            );
            await sleep(1000);
          } else {
            dayProfit = dayProfitDb.profit;
          }
          accProfit += dayProfit;
          dayStart = dayEnd;
          dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        } while (dayStart <= end);
        totalProfits[env] = accProfit;
        accProfit = 0;
        balances[env] = balance;
      } catch (error) {
        console.log(error.message);
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
    totalProfits[key] =
      profit.toFixed(1) + " USDT" + " - " + balances[key] + "USDT";
  });

  let profit = JSON.stringify(totalProfits, null, 2);
  responseCommand = `Thời gian: ${now.toLocaleTimeString()} ${now.toLocaleDateString()}`;
  responseCommand += `\nTổng lãi/lỗ từ ngày ${
    params.start
  }: ${totalProfit.toFixed(3)}USDT Đóng họ:  ${(totalProfit*0.1).toFixed(3)} (10%)`;
  responseCommand += `\n${profit}`;
  return responseCommand;
};
module.exports = reportFutureProfit;
