export const config = { maxDuration: 30 };

const BASE = "https://paper-api.alpaca.markets/v2";

export default async function handler(req, res) {
  const { endpoint } = req.query;

  if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });

  if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
    return res.status(500).json({ error: "Alpaca API keys not configured. Add ALPACA_API_KEY and ALPACA_SECRET_KEY to Vercel environment variables." });
  }

  const urlMap = {
    account:   `${BASE}/account`,
    positions: `${BASE}/positions`,
    orders:    `${BASE}/orders?status=all&limit=20&direction=desc`,
  };

  const url = urlMap[endpoint];
  if (!url) return res.status(400).json({ error: `Unknown endpoint: ${endpoint}` });

  try {
    const response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID":     process.env.ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY,
      },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Alpaca API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
