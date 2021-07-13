const ccxt = require("ccxt");
const Binance = require("node-binance-api");
const _ = require("lodash");
const schedule = require("node-schedule");
// load config from .env files
const dotenv = require("dotenv");
dotenv.config();

const loadAccountConfig = require("./loader/account-config.loader");
const telegramBotLoader = require("./loader/telegram.loader");
const reportBalance = require("./services/utils/report-balance");
const reportFutureProfit = require("./services/utils/report-future-profit");
const { error } = require("winston");
const { isBuffer } = require("lodash");

const getExchangeById = (exchangeId, exchanges) => {
  let accountName = _.findKey(exchanges, { id: exchangeId });
  return exchanges[accountName];
};

const createCcxtExchange = (configs) => {
  let exchanges = {};
  configs.map((config) => {
    let exchangeConfig = {
      apiKey: config.api.api_key,
      secret: config.api.api_secret,
      enableRateLimit: true,
      rateLimit: 5000,
    };
    if (config.api.hedgeMode) exchangeConfig.hedgeMode = config.api.hedgeMode;
    if (config.api.password) exchangeConfig.password = config.api.password;
    let ccxtExchange = ccxt[config.exchange];
    exchanges[config.env] = new ccxtExchange(exchangeConfig);
  });
  return exchanges;
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
let username = process.env.ENV;
let allTikers = {};
let exchangeIds = [];
let userExchanges = {};
let futuresApis = {};

(async () => {
  try {
    await require("./loader/database.loader")();
    let telegramBot = await telegramBotLoader(process.env.TELE);
    let userAccountConfigs = await loadAccountConfig([username]);

    userExchanges = createCcxtExchange(userAccountConfigs[username]);
    futuresApis = createBinanceFuturesApi(userAccountConfigs[username]);
    //find name of exchange
    _.map(userExchanges, async (value, key) => {
      if (!exchangeIds.includes(value.id)) {
        exchangeIds.push(value.id);
      }
    });
    let exchanges = userExchanges;
    const getBalance = async () => {
      console.log("GET BALANCE");
      await Promise.all(
        exchangeIds.map(async (exchangeId) => {
          allTikers[exchangeId] = await getExchangeById(
            exchangeId,
            userExchanges
          ).fetchTickers();
        })
      );
      let msg = await reportBalance(exchanges, allTikers);
      console.log(msg);
      telegramBot.sendReport(msg, "-1001497467742");
    };
    const getFuturesProfit = async (params, cmd = false) => {
      console.log("GET FUTURES PROFIT");
      let msg = await reportFutureProfit(futuresApis, params);
      if (cmd) telegramBot.sendReportCommand(msg, cmd);
      else telegramBot.sendReport(msg, "-1001497467742");
    };
    // await getBalance();
    // await getFuturesProfit();
    const job = schedule.scheduleJob("0 */8 * * *", getBalance);
    const job2 = schedule.scheduleJob("0 */2 * * *", getFuturesProfit);
    const job3 = schedule.scheduleJob("59 23 * * *", getFuturesProfit);
    telegramBot.bot.on("message", async (msg) => {
      let messageText = msg.text || msg.caption;
      if (!messageText) return;
      messageText = messageText.toLowerCase();
      let commandParameter = messageText.split("?").join(" ").split(" ");
      const params = Object.fromEntries(
        new URLSearchParams(commandParameter[1])
      );
      for (const [key, value] of Object.entries(params)) {
        params[key] = value.toLowerCase();
      }
      if (commandParameter[0] == "balance") {
        getBalance().catch((error) => {});
      } else if (commandParameter[0] == "profit") {
        getFuturesProfit(params).catch((error) => {});
      }
    });
    // maybe get more speed
    telegramBot.bot.on("channel_post", async (msg) => {
      let messageText = msg.text || msg.caption;
      if (!messageText) return;
      messageText = messageText.toLowerCase();
      let commandParameter = messageText.split("?").join(" ").split(" ");
      const params = Object.fromEntries(
        new URLSearchParams(commandParameter[1])
      );
      for (const [key, value] of Object.entries(params)) {
        params[key] = value.toLowerCase();
      }
      if (commandParameter[0] == "balance") {
        getBalance(msg).catch((error) => {});
      } else if (commandParameter[0] == "profit") {
        getFuturesProfit(params, msg).catch((error) => {});
      }
    });
  } catch (error) {
    console.error(`[index] ` + error.message);
  }
})();
