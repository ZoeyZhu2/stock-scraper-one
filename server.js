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

async function getHistory(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1mo&interval=1d`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json();
  const result = data.chart.result[0];

  const timestamps = result.timestamp;
  const closes = result.indicators.quote[0].close;

  const labels = timestamps.map((t) => new Date(t * 1000).toLocaleDateString());

  return { labels, closes }; // shorthand for {labels: labels, closes: closes}
}


const server = http.createServer(async (request, response) => {
    if (request.url != "/") {
        response.writeHead(404);
        response.end("Not found");
        return;
    }

    try {
        const quote = await getQuote("CAKE");
        const history = await getHistory("CAKE");

        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(`
        <h1>${quote.symbol}</h1>
        <p>Price: $${quote.price}</p>
        <p>Previous close: $${quote.previousClose}</p>
        <p>Day range: $${quote.dayLow} - $${quote.dayHigh}</p>
        <p>Volume: ${quote.volume}</p>
        <button onclick="location.reload()">Refresh</button>
        
        <div style="max-width: 700px">
        <canvas id="chart"></canvas>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        const labels = ${JSON.stringify(history.labels)};
        const closes = ${JSON.stringify(history.closes)};

        new Chart(document.getElementById("chart"), {
          type: "line",
          data: {
            labels: labels,
            datasets: [{ label: "Close price ($)", data: closes }],
          },
        });
      </script>
        `);
    } catch (err) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end(`Something went wrong: ${err.message}`);
    }
});


server.listen(3000, () => {
  console.log("Open http://localhost:3000 in your browser");
});