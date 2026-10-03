// server

const http = require("http"); //loads toolkit that comes built into Node for handling web traffic

// should be async bc can take time
async function getQuote(ticker) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;

    const response = await fetch(url, {headers: {"User-Agent": "Mozilla/5.0"}})

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
    }

    const data = await response.json();
    const meta = data.chart.result[0].meta;

    return {
        symbol: meta.symbol,
        price: meta.regularMarketPrice,
        previousClose: meta.chartPreviousClose,
        dayHigh: meta.regularMarketDayHigh,
        dayLow: meta.regularMarketDayLow,
        volume: meta.regularMarketVolume,
    };
}

const server = http.createServer(async (request, response) => {
    if (request.url != "/") {
        response.writeHead(404);
        response.end("Not found");
        return;
    }

    try {
        const quote = await getQuote("CAKE");

        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(`
        <h1>${quote.symbol}</h1>
        <p>Price: $${quote.price}</p>
        <p>Previous close: $${quote.previousClose}</p>
        <p>Day range: $${quote.dayLow} - $${quote.dayHigh}</p>
        <p>Volume: ${quote.volume}</p>
        <button onclick="location.reload()">Refresh</button>
        `);
    } catch (err) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end(`Something went wrong: ${err.message}`);
    }
});


server.listen(3000, () => {
  console.log("Open http://localhost:3000 in your browser");
});