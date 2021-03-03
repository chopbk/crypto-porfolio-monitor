const calculateAsset = (currency, tickers, amount) => {
  let value = 0;
  const convertTo = "USDT";
  if (currency === convertTo) {
    value += parseFloat(amount);
  } else {
    let symbol = currency + "/" + convertTo;
    // if (symbol in tickers) {
    if (tickers[symbol]) {
      const ticker = tickers[symbol];
      value += parseFloat(amount * ticker["last"]);
    } else {
      symbol = currency + "/" + "BTC";
      if (tickers[symbol]) {
        let ticker = tickers[symbol];
        let ticker2 = tickers["BTC/USDT"];
        value += parseFloat(amount * ticker["last"] * ticker2["last"]);
      } else {
        symbol = currency + "/" + "BNB";
        if (tickers[symbol]) {
          let ticker = tickers[symbol];
          let ticker2 = tickers["BNB/USDT"];
          value += parseFloat(amount * ticker["last"] * ticker2["last"]);
        } else {
          symbol = currency + "/" + "ETH";
          if (tickers[symbol]) {
            let ticker = tickers[symbol];
            let ticker2 = tickers["ETH/USDT"];
            value += parseFloat(amount * ticker["last"] * ticker2["last"]);
          }
        }
      }
    }
  }
  return value;
};
module.exports = calculateAsset;
