const logger = require("../utils/logger");
const TelegramBot = require("node-telegram-bot-api");
class TeleBot {
  constructor(CONFIG) {
    this.config = CONFIG;
    this.token = CONFIG.token;
    this.bot = new TelegramBot(this.token, { polling: CONFIG.listen });
  }
  sendReport(message, id) {
    this.bot.sendMessage(id, message); //,{reply_to_message_id: });
    return;
  }
  sendReportCommand(message, cmdInfo) {
    this.bot.sendMessage(cmdInfo.chatId, message, {
      reply_to_message_id: cmdInfo.msgId,
    });
    return;
  }
}

module.exports = TeleBot;
