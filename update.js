const dotenv = require("dotenv");
const schedule = require("node-schedule");
dotenv.config();
const MongoDb = require("./services/database/mongodb");
const { sleep } = require("./services/utils/helper");
const { calculateFuturesProfit } = require("./services/utils/futures-profit");
const Binance = require("node-binance-api");
let users = [
  "b1",
  "b2",
  "b3",
  "b4",
  "b5",
  "b6",
  "b11",
  "b22",
  "b33",
  "b44",
  "r1",
  "r2",
  "r3",
  "r4",
  "local",
  "linh",
  "qa",
  "tien",
  "zen",
  "trung",
  "hien",
  "can",
  "manh",
  "h1",
  "h2",
  "my",
  "my2",
  "chien",
  "chien2",
  "binh",
  "binh2",
  "dan",
  "dan2",
  "tan",
  "tan2",
  "hai",
  "hai2",
  "an",
  "an2",
  "na",
  "na2",
  "thuyen",
  "thuyen2",
  "thao",
  "thao2",
];

const updateProfit = async function (futuresClient, params) {
  let d = new Date();
  let todayString =
    d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  if (!params.start) {
    params.start = todayString;
  }
  let FuturesProfitModel = MongoDb.getFuturesProfitModel();
  let dayStart = new Date(params.start);
  let dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  let end = !params.end ? new Date() : new Date(params.end);
  let totalProfit = 0;

  let profit = 0;
  do {
    let params = {
      startTime: dayStart.getTime(),
      endTime: dayEnd.getTime(),
      limit: 1000,
    };
    profit = await calculateFuturesProfit(futuresClient, params);
    console.log(`[${futuresClient.env}]: ${profit}$ in  ${dayStart}`);
    await FuturesProfitModel.findOneAndUpdate(
      { env: futuresClient.env, day: dayStart },
      {
        env: futuresClient.env,
        day: dayStart,
        profit: parseFloat(profit.toFixed(3)),
        status: profit < 0 ? "LOSE" : profit > 0 ? "WIN" : "DRAW",
      },
      { upsert: true }
    );
    await sleep(2000);

    totalProfit += profit;
    dayStart = dayEnd;
    dayEnd = new Date(dayStart.getTime() + 48 * 60 * 60 * 1000);
  } while (dayStart <= end);
  return totalProfit;
};

const updateAllProfit = async () => {
  try {
    await MongoDb.init();

    let futuresClients = [];
    let accountConfigs = await MongoDb.getAccountConfigModel().find({
      env: { $in: users },
    });
    accountConfigs.map((accountConfig) => {
      if (accountConfig.exchange != "binance") return;
      let futuresConfig = {
        APIKEY: accountConfig.api.api_key,
        APISECRET: accountConfig.api.api_secret,
        hedgeMode: true,
      };
      let futuresClient = new Binance(futuresConfig);
      futuresClient.env = accountConfig.env;
      futuresClients.push(futuresClient);
    });
    let d = new Date(Date.now() - 60 * 60 * 24 * 1000);
    let start = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    let params = {
      start: start,
      update: true,
    };
    for (const futuresClient of futuresClients) {
      console.log(await updateProfit(futuresClient, params));
      await sleep(5000);
    }
  } catch (error) {
    console.log(error.message);
  }
};
(async () => {
  const job1 = schedule.scheduleJob("0 0 * * *", updateAllProfit);
})();
