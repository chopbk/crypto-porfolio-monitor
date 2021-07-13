let filterProfit = (profit) =>
  profit.incomeType == "FUNDING_FEE" ||
  profit.incomeType == "COMMISSION" ||
  profit.incomeType == "REALIZED_PNL" ||
  profit.incomeType == "REFERRAL_KICKBACK" ||
  profit.incomeType == "COMMISSION_REBATE";
const calculateFuturesProfit = async (futuresClient, params) => {
  let dayProfit = 0;
  let profits = await futuresClient.futuresIncome(params);
  if (profits.code) {
    responseCommand = profits;
    return responseCommand;
  }
  let length = profits.length;
  while (length === 1000) {
    params.startTime = profits[profits.length - 1].time;
    let temp = await futuresClient.futuresIncome(params);
    length = temp.length;
    profits = profits.concat(temp);
  }
  let newIncome = profits.filter(filterProfit);

  for (var i = 0, _len = newIncome.length; i < _len; i++) {
    dayProfit += parseFloat(newIncome[i].income);
  }
  return dayProfit;
};
module.exports = {
  calculateFuturesProfit,
};
