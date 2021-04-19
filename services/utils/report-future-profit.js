const _ = require("lodash");
let filter = (profit) =>
  profit.incomeType == "FUNDING_FEE" ||
  profit.incomeType == "COMMISSION" ||
  profit.incomeType == "REALIZED_PNL" ||
  profit.incomeType == "REFERRAL_KICKBACK" ||
  profit.incomeType == "COMMISSION_REBATE";
const { sleep } = require("./helper");
const MongoDb = require("./../database/mongodb");
const reportFutureProfit = async (futuresApis, params = {}) => {
  let FuturesProfitModel = MongoDb.getFuturesProfitModel();
  let responseCommand;
  let totalProfits = {};
  let now = new Date();
  var d = new Date();
  let todayString =
    d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  if (!params.start) {
    params.start = todayString;
  }

  await Promise.all(
    _.map(futuresApis, async (futuresClient, key) => {
      console.log(key);
      let dayStart = new Date(params.start);
      let dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      let end = !params.end ? new Date() : new Date(params.end);
      try {
        let accProfit = 0;
        let dayProfit = 0;
        let dayProfitDbs = await FuturesProfitModel.find({
          env: key,
          day: { $gte: dayStart.toLocaleDateString() },
        });
        do {
          let today = new Date(todayString);
          let dayProfitDb = dayProfitDbs.find(
            (profit) => profit.day.valueOf() === dayStart.valueOf()
          );
          if (today.valueOf() === dayStart.valueOf()) dayProfitDb = false;
          if (!dayProfitDb) {
            dayProfit = 0;
            let profits = await futuresClient.futuresIncome({
              startTime: dayStart.getTime(),
              endTime: dayEnd.getTime(),
              limit: 1000,
            });
            if (profits.code) {
              responseCommand = profits;
              return responseCommand;
            }
            let length = profits.length;
          while (length === 1000) {
            let temp = await futuresClient.futuresIncome({
                startTime: profits[profits.length - 1].time,
                endTime: dayEnd.getTime(),
                limit: 1000,
            });
            length = temp.length;
            profits = profits.concat(temp);
        }
            let newIncome = profits.filter(filter);

            for (var i = 0, _len = newIncome.length; i < _len; i++) {
              //console.log(this[i][prop]);
              dayProfit += parseFloat(newIncome[i].income);
            }
            await FuturesProfitModel.findOneAndUpdate(
              { env: this.env, day: dayStart },
              {
                env: this.env,
                day: dayStart,
                profit: parseFloat(dayProfit.toFixed(3)),
                status: dayProfit < 0 ? "LOSE" : dayProfit > 0 ? "WIN" : "DRAW",
              },
              { upsert: true }
            );
            await sleep(200);
          } else {
            dayProfit = dayProfitDb.profit;
          }
          accProfit += dayProfit;
          dayStart = dayEnd;
          dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        } while (dayStart <= end);
        // let profits = await futuresClient.futuresIncome({
        //   startTime: dayStart.getTime(),
        //   limit: 1000,
        // });
        // await sleep(200);
        // if (profits.code) {
        //   return;
        // }
        // let newIncome = profits.filter(filter);

        // let dayProfit = 0;
        // for (var i = 0, _len = newIncome.length; i < _len; i++) {
        //   dayProfit += parseFloat(newIncome[i].income);
        // }
        totalProfits[key] = accProfit;
        // await FuturesProfitModel.findOneAndUpdate(
        //   { env: key, day: dayStart },
        //   {
        //     env: key,
        //     day: dayStart,
        //     profit: parseFloat(dayProfit.toFixed(3)),
        //     status: dayProfit < 0 ? "LOSE" : dayProfit > 0 ? "WIN" : "DRAW",
        //   },
        //   { upsert: true }
        // );
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
  responseCommand += `\nTổng lãi/lỗ từ ngày ${
    params.start
  }: ${totalProfit.toFixed(3)}USDT `;
  responseCommand += `\n${profit}`;
  return responseCommand;
};
module.exports = reportFutureProfit;
