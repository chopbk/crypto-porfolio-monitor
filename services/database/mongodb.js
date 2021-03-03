/**
 * @file  create connection of mongooDB
 * @author tamnd12
 * @date 19/02/2020
 */
const mongoose = require("mongoose");
const logger = require("../utils/logger");
const AccountConfigSchema = require("./schemas/account-config");
const TelegramConfigSchema = require("./schemas/telegram-config");
const UserAccountSchema = require("./schemas/user-account");
const FuturesProfitSchema = require("./schemas/futures-profit");
class MongoDb {
  constructor() {}
  async init() {
    try {
      let url = process.env.MONGODB;
      logger.debug("[mongoLoader] connect to " + url);
      let options = {
        poolSize: 10,
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true,
        autoIndex: true, //this is the code I added that solved it all
        keepAlive: true,
        useFindAndModify: false,
      };
      await mongoose.connect(url, options);
      this.AccountConfigModel = mongoose.model(
        "Account_Config",
        AccountConfigSchema
      );
      this.TelegramConfigModel = mongoose.model(
        "Telegram_Config",
        TelegramConfigSchema
      );
      this.UserAccount = mongoose.model("User_Account", UserAccountSchema);
      this.FuturesProfitModel = mongoose.model(
        "Futures_Profit",
        FuturesProfitSchema
      );
    } catch (error) {
      throw error;
    }
    return mongoose.connection;
  }

  getAccountConfigModel() {
    return this.AccountConfigModel;
  }

  getTelegramConfigModel() {
    return this.TelegramConfigModel;
  }
  getUserAccountModel() {
    return this.UserAccount;
  }
  getFuturesProfitModel() {
    return this.FuturesProfitModel;
  }
}
module.exports = new MongoDb();
