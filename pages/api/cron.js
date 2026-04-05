export const config = {
  maxDuration: 300,
};

const DAILY_BRIEF_PROMPT = () => `You are the AI brain of SwingDesk — a private swing trading command center.

Your job: Do ALL the analysis so the trader spends MAXIMUM 5 minutes reviewing your output and making decisions. You are not a chatbot. You are a chief of staff delivering a mission briefing.

TODAY'S DATE: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
TIME: Pre-market (approx 9:25 AM ET)

THE SWINGDESK PHILOSOPHY:
- Swing trades only: 3–35 day holds
- Max 5 positions at once
- No trades if macro is bad — cash IS a position
- Score ≥75 to enter, ≥65 to watch
- Never hold through earnings (within 21 days = flag)
- Cut losses fast, let winners run in thirds
- No $25k required — any account size

SCORING SYSTEM (100pts total):
- Trend Quality (22pts): 50-day EMA, slope, Stage 2, sector outperformance
- Momentum (18pts): Weekly RSI 45-65, MACD weekly, RS vs S&P
- Setup Quality (18pts): Base pattern, volatility compression, within 3-5% of pivot
- Volume/Institutions (15pts): Accumulation weeks, volume dry-up, up-day volume
- Fundamentals (12pts): Revenue growth >10% YoY, EPS growth, leading sector
- Sentiment/News (15pts): News tone, macro/political headwinds, social velocity, analyst consensus

HARD GATES (auto-fail regardless of score):
- Earnings within 21 days → cap at 55
- No clear stop within 7% → skip
- Risk/reward below 2:1 → skip
- Avg volume below 500K → skip

UNIVERSE TO SCAN — use web search to check these specific names:
Tier 1 Leaders: NVDA, META, AAPL, MSFT, GOOGL, AMZN, TSM, AVGO, AMD, CRM, NOW, UBER, SPOT, SHOP, CRWD
Tier 2 ETFs: QQQ, SPY, XLK, XLE, XLF, XBI, GLD, SOXX, IWM, XLV
Tier 3 Mid-Cap: PLTR, HOOD, COIN, RBLX, DUOL, CELH, SOUN, IOT, ANET, DDOG
Macro Pulse: VIX level, S&P 500 vs 50-day EMA, put/call ratio, sector rotation

CRITICAL INSTRUCTIONS:
1. Use web search to get CURRENT prices, news, and market data
2. Check for any major macro events TODAY (Fed decisions, CPI, geopolitical, major tweets/statements)
3. Scan Tier 1 first, then ETFs, then mid-caps — only surface names that score 65+
4. Be DIRECT. If nothing qualifies, say so clearly.
5. The trader has 5 minutes. Prioritize ruthlessly.

OUTPUT FORMAT — JSON only, no markdown, no preamble:
{
  "date": "...",
  "generatedAt": "...",
  "commanderCall": {
    "status": "GO | CAUTION | STAND DOWN",
    "headline": "One bold sentence summarizing the entire day",
    "detail": "2-3 sentences on what the market is doing and what to focus on."
  },
  "marketPulse": {
    "overall": "BULLISH | CAUTIOUS | BEARISH",
    "spxVsEma": "ABOVE | AT | BELOW",
    "vix": "number or range",
    "vixStatus": "LOW | ELEVATED | HIGH",
    "sectorRotation": "Brief description of where money is flowing",
    "majorEventsToday": ["list any Fed, CPI, earnings, geopolitical events today"],
    "tradingConditions": "FULL SIZE | HALF SIZE | WATCH ONLY | CASH"
  },
  "actionItems": [
    {
      "priority": 1,
      "action": "ENTER | WATCH | EXIT | HOLD | AVOID",
      "ticker": "...",
      "assetType": "stock | etf | options",
      "score": 0,
      "whyNow": "One sentence — specific reason this is actionable TODAY",
      "entry": "...",
      "stop": "...",
      "target1": "...",
      "target2": "...",
      "riskReward": "1:X",
      "holdWindow": "X-Y days",
      "earningsStatus": "CLEAR | CAUTION",
      "positionSize": "full | half | quarter",
      "urgency": "TODAY | THIS WEEK | NO RUSH"
    }
  ],
  "activePositionAlerts": [
    { "ticker": "...", "alert": "TRAIL STOP | TAKE PARTIAL | EXIT NOW | HOLD", "reason": "One sentence" }
  ],
  "nothingToDoNote": "If no action items, explain why. Empty string if there are action items.",
  "sentimentFlags": ["Major news/tweets/policy that could impact universe in next 1-2 weeks"],
  "weeklyContext": "One sentence on broader trend.",
  "closingThought": "One punchy sentence. The single most important thing today."
}`;

export default async function handler(req, res) {
  // Verify this is being called by Vercel cron or an authorized source
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
    // Allow it through in dev, but protect in prod
    if (process.env.CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  // Don't run on weekends (extra safety check)
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.status(200).json({ skipped: true, reason: "Weekend" });
  }

  try {
    // Generate the briefing
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: DAILY_BRIEF_PROMPT() }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    const claudeData = await claudeRes.json();
    const text = claudeData.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const briefData = JSON.parse(clean);

    // Store it via the brief API
    await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/brief`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: briefData }),
    });

    return res.status(200).json({ ok: true, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Cron error:", err);
    return res.status(500).json({ error: err.message });
  }
}
