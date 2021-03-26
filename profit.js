const Binance = require("node-binance-api");
const _ = require("lodash");
const schedule = require("node-schedule");
// load config from .env files
const dotenv = require("dotenv");
dotenv.config();

const loadAccountConfig = require("./loader/account-config.loader");
const telegramBotLoader = require("./loader/telegram.loader");
const reportFutureProfit = require("./services/utils/report-future-profit");

const getFuturesProfit = async (futuresApis, telegramBot, params = {}) => {
  console.log("GET FUTURES PROFIT");
  let msg = await reportFutureProfit(futuresApis, params);
  console.log(msg);
  telegramBot.sendReport(msg, "-1001348705247");
};
const createBinanceFuturesApi = (configs) => {
  let futuresApis = {};
  configs.map((config) => {
    if (config.exchange != "binance") return;
    let futuresConfig = {
      APIKEY: config.api.api_key,
      APISECRET: config.api.api_secret,
      hedgeMode: true,
    };
    futuresApis[config.env] = new Binance(futuresConfig);
  });
  return futuresApis;
};
let usernames = [
  "my",
  "an",
  "hai",
  "thuyen",
"tam",
  "dan",
  "na",
  "hoan",
  "thao",
"tan",
"chien"
];
let futuresApis = {};

let userAccountConfigs = {};
(async () => {
  try {
    await require("./loader/database.loader")();
    let telegramBot = await telegramBotLoader("profit");

    userAccountConfigs = await loadAccountConfig(usernames);
    usernames.map((username) => {
      futuresApis[username] = createBinanceFuturesApi(
        userAccountConfigs[username]
      );
    });
    const reportAllProfit = async () => {
      usernames.forEach(async (username) => {
        await getFuturesProfit(futuresApis[username], telegramBot);
      });
    };
    const job1 = schedule.scheduleJob("59 23 * * *", reportAllProfit);
    const job2 = schedule.scheduleJob("0 7 * * *", reportAllProfit);

    telegramBot.bot.on("message", async (msg) => {
      let messageText = msg.text || msg.caption;
      if (!messageText || !messageText.startsWith("/")) return;
      let msgArr = messageText.toLowerCase().split("/");
      let commandParameter = msgArr[1].split("?").join(" ").split(" ");
      const params = Object.fromEntries(
        new URLSearchParams(commandParameter[1])
      );
      for (const [key, value] of Object.entries(params)) {
        params[key] = value.toLowerCase();
      }
      if (commandParameter[0] == "profit") {
        if (!!params.user) {
          await getFuturesProfit(futuresApis[params.user], telegramBot, params);
        } else {
          reportAllProfit();
        }
      }
      //responseCommand = await getFuturesProfit(params);
    });
    // maybe get more speed
    telegramBot.bot.on("channel_post", async (msg) => {
      let messageText = msg.text || msg.caption;
      if (!messageText) return;
      if (messageText == "profit") {
        getFuturesProfit().catch((error) => {});
      }
    });
  } catch (error) {
    console.error(`[index] ` + error.message);
  }
})();
