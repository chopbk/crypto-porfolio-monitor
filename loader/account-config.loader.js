const MongoDb = require("./../services/database/mongodb");

module.exports = async function (users) {
  let userAccountConfigs = {};
  let userAccounts = await MongoDb.getUserAccountModel().find({
    username: { $in: users },
  });
  await Promise.all(
    userAccounts.map(async (userAccount) => {
      let accountConfigs = await MongoDb.getAccountConfigModel().find({
        env: { $in: userAccount.accounts },
      });
      userAccountConfigs[userAccount.username] = accountConfigs;
    })
  );
  return userAccountConfigs;
};
