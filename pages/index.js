import { useState } from "react";
import { callClaude } from "../lib/claude";

const TODAY = new Date().toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric", year: "numeric",
});

const DAILY_BRIEF_PROMPT = `You are the AI brain of SwingDesk — a private swing trading command center.

Your job: Do ALL the analysis so the trader spends MAXIMUM 5 minutes reviewing your output and making decisions. You are not a chatbot. You are a chief of staff delivering a mission briefing.

TODAY'S DATE: ${TODAY}

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

const statusMeta = {
  "GO":           { color: "#00ff88", bg: "#00ff8812", label: "GO",           icon: "▲" },
  "CAUTION":      { color: "#ffd700", bg: "#ffd70012", label: "CAUTION",      icon: "◆" },
  "STAND DOWN":   { color: "#ff6b6b", bg: "#ff6b6b12", label: "STAND DOWN",   icon: "▼" },
};
const actionMeta = {
  ENTER: { color: "#00ff88", bg: "#00ff8820" },
  WATCH: { color: "#ffd700", bg: "#ffd70018" },
  EXIT:  { color: "#ff6b6b", bg: "#ff6b6b18" },
  HOLD:  { color: "#00c8ff", bg: "#00c8ff15" },
  AVOID: { color: "#555",    bg: "#55555515" },
};
const conditionsMeta = {
  "FULL SIZE":  { color: "#00ff88" },
  "HALF SIZE":  { color: "#ffd700" },
  "WATCH ONLY": { color: "#fb923c" },
  "CASH":       { color: "#ff6b6b" },
};
const scoreColor = s => s >= 75 ? "#00ff88" : s >= 60 ? "#ffd700" : "#ff6b6b";
const vixColor   = v => v === "LOW" ? "#00ff88" : v === "ELEVATED" ? "#ffd700" : "#ff6b6b";
const spxColor   = v => v === "ABOVE" ? "#00ff88" : v === "AT" ? "#ffd700" : "#ff6b6b";

const STEPS = [
  "Checking market conditions...",
  "Scanning macro events & sentiment...",
  "Running universe through scoring system...",
  "Filtering setups ≥65...",
  "Building your daily brief...",
];

export default function CommandPage() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [loadStep, setLoadStep] = useState(0);

  const generate = async () => {
    setLoading(true);
    setData(null);
    setLoadStep(0);
    let step = 0;
    const t = setInterval(() => { step = Math.min(step + 1, STEPS.length - 1); setLoadStep(step); }, 2200);
    try {
      const result = await callClaude({ prompt: DAILY_BRIEF_PROMPT });
      setData(result);
    } catch (e) { console.error(e); }
    clearInterval(t);
    setLoading(false);
  };

  const sm = data ? (statusMeta[data.commanderCall?.status] || statusMeta["CAUTION"]) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#05080c", color: "#d4dde8", fontFamily: "'Rajdhani', sans-serif" }}>
      <style>{`
        .briefing-btn { font-family:'Orbitron',monospace; font-weight:700; font-size:12px; letter-spacing:.15em; text-transform:uppercase; background:#00ff88; color:#05080c; border:none; cursor:pointer; padding:14px 36px; transition:all .2s; }
        .briefing-btn:hover { background:#33ffaa; transform:translateY(-1px); }
        .briefing-btn:disabled { background:#1a2535; color:#2a3d50; cursor:not-allowed; transform:none; }
        .card { background:#090e15; border:1px solid #131f2e; padding:18px; }
        .lbl { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:#2a4050; margin-bottom:6px; font-weight:600; }
        .action-card { background:#090e15; border:1px solid #131f2e; padding:16px; margin-bottom:10px; position:relative; overflow:hidden; }
        .badge { display:inline-flex; align-items:center; padding:3px 10px; font-size:11px; letter-spacing:.08em; text-transform:uppercase; font-weight:600; }
        .grid-macro { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .step-dot { width:8px; height:8px; border-radius:50%; background:#1a2535; transition:background .3s; }
        .step-dot.active { background:#00ff88; }
        .step-dot.done { background:#1a4030; }
        @media(max-width:640px) { .grid-macro{grid-template-columns:repeat(2,1fr);} .grid-2{grid-template-columns:1fr;} }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>

        {!data && !loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 11, color: "#0d1e2c", letterSpacing: "0.3em", marginBottom: 32 }}>
              AWAITING DAILY BRIEFING
            </div>
            <button className="briefing-btn" onClick={generate}>Run Today's Briefing</button>
            <div style={{ marginTop: 20, fontSize: 12, color: "#1a2c3a", letterSpacing: "0.1em" }}>
              Scans universe · checks macro · delivers your 5-minute action plan
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 11, color: "#00ff88", letterSpacing: "0.2em", marginBottom: 24, animation: "pulse 2s infinite" }}>
              RUNNING ANALYSIS
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
              {STEPS.map((_, i) => <div key={i} className={`step-dot ${i < loadStep ? "done" : i === loadStep ? "active" : ""}`} />)}
            </div>
            <div style={{ fontSize: 13, color: "#3a5060" }}>{STEPS[loadStep]}</div>
          </div>
        )}

        {data && sm && (
          <div style={{ animation: "fadein 0.5s ease" }}>

            {/* Commander's Call */}
            <div style={{ background: sm.bg, border: `1px solid ${sm.color}30`, padding: "22px 24px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 28, color: sm.color }}>{sm.icon}</div>
                  <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 11, color: sm.color, letterSpacing: "0.1em", marginTop: 4 }}>{sm.label}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 14, color: sm.color, marginBottom: 8, lineHeight: 1.4 }}>{data.commanderCall?.headline}</div>
                  <div style={{ fontSize: 14, color: "#8aa0b0", lineHeight: 1.65 }}>{data.commanderCall?.detail}</div>
                </div>
                {data.marketPulse?.tradingConditions && (
                  <div style={{ textAlign: "center" }}>
                    <div className="lbl">Today's Mode</div>
                    <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 13, color: conditionsMeta[data.marketPulse.tradingConditions]?.color || "#fff" }}>
                      {data.marketPulse.tradingConditions}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Market Pulse */}
            <div className="grid-macro" style={{ marginBottom: 14 }}>
              {[
                { label: "S&P vs 50 EMA", val: data.marketPulse?.spxVsEma, color: spxColor(data.marketPulse?.spxVsEma) },
                { label: "VIX", val: `${data.marketPulse?.vix} · ${data.marketPulse?.vixStatus}`, color: vixColor(data.marketPulse?.vixStatus) },
                { label: "Market", val: data.marketPulse?.overall, color: data.marketPulse?.overall === "BULLISH" ? "#00ff88" : data.marketPulse?.overall === "CAUTIOUS" ? "#ffd700" : "#ff6b6b" },
                { label: "Sector Flow", val: data.marketPulse?.sectorRotation, color: "#8aa0b0", small: true },
              ].map(s => (
                <div key={s.label} className="card">
                  <div className="lbl">{s.label}</div>
                  <div style={{ fontSize: s.small ? 11 : 15, fontWeight: 600, color: s.color, lineHeight: 1.3 }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Major Events */}
            {data.marketPulse?.majorEventsToday?.length > 0 && (
              <div className="card" style={{ marginBottom: 14, borderColor: "#ffd70020" }}>
                <div className="lbl" style={{ color: "#8a7020" }}>⚡ Major Events Today</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {data.marketPulse.majorEventsToday.map((e, i) => (
                    <span key={i} style={{ background: "#ffd70015", color: "#ffd700", padding: "3px 10px", fontSize: 12 }}>{e}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Nothing to do */}
            {data.nothingToDoNote && (
              <div className="card" style={{ marginBottom: 14, textAlign: "center", padding: "32px" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🧘</div>
                <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 12, color: "#2a4050", letterSpacing: "0.15em", marginBottom: 10 }}>NOTHING MEETS CRITERIA TODAY</div>
                <div style={{ fontSize: 14, color: "#4a6070", lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>{data.nothingToDoNote}</div>
              </div>
            )}

            {/* Action Items */}
            {data.actionItems?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div className="lbl" style={{ marginBottom: 10 }}>Action Items — {data.actionItems.length} setup{data.actionItems.length !== 1 ? "s" : ""} qualify today</div>
                {data.actionItems.map((item, i) => {
                  const am = actionMeta[item.action] || actionMeta.WATCH;
                  return (
                    <div key={i} className="action-card" style={{ borderColor: `${am.color}25` }}>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: am.color }} />
                      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                        <div style={{ minWidth: 120 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 20, color: "#d4dde8" }}>{item.ticker}</span>
                            <span style={{ fontSize: 10, color: "#3a5060", background: "#0d1a25", padding: "2px 6px" }}>{item.assetType?.toUpperCase()}</span>
                          </div>
                          <span className="badge" style={{ background: am.bg, color: am.color, fontSize: 13 }}>{item.action}</span>
                          {item.urgency && <div style={{ marginTop: 6, fontSize: 10, color: item.urgency === "TODAY" ? "#ff6b6b" : "#3a5060", letterSpacing: "0.12em" }}>{item.urgency}</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontSize: 14, color: "#8aa0b0", lineHeight: 1.5, marginBottom: 8 }}>{item.whyNow}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {item.earningsStatus && <span className="badge" style={{ background: item.earningsStatus === "CLEAR" ? "#00ff8815" : "#ffd70015", color: item.earningsStatus === "CLEAR" ? "#00ff88" : "#ffd700", fontSize: 10 }}>EARNINGS {item.earningsStatus}</span>}
                            {item.holdWindow && <span className="badge" style={{ background: "#0d1a25", color: "#4a6070", fontSize: 10 }}>{item.holdWindow}</span>}
                            {item.positionSize && <span className="badge" style={{ background: "#0d1a25", color: "#4a6070", fontSize: 10 }}>{item.positionSize} size</span>}
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, minWidth: 200 }}>
                          {[
                            { l: "Score", v: item.score, s: { fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 20, color: scoreColor(item.score) } },
                            { l: "R/R", v: item.riskReward, s: { fontSize: 15, fontWeight: 600, color: "#ffd700" } },
                            { l: "Entry", v: item.entry, s: { fontSize: 13, color: "#d4dde8" } },
                            { l: "Stop", v: item.stop, s: { fontSize: 13, color: "#ff6b6b" } },
                            { l: "Target 1", v: item.target1, s: { fontSize: 13, color: "#00ff88" } },
                            { l: "Target 2", v: item.target2, s: { fontSize: 13, color: "#7dffb3" } },
                          ].map(x => (
                            <div key={x.l} style={{ background: "#05080c", padding: "6px 10px" }}>
                              <div className="lbl" style={{ marginBottom: 2 }}>{x.l}</div>
                              <div style={x.s}>{x.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Position Alerts */}
            {data.activePositionAlerts?.length > 0 && (
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="lbl" style={{ marginBottom: 10 }}>Active Position Alerts</div>
                {data.activePositionAlerts.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: i < data.activePositionAlerts.length - 1 ? "1px solid #0d1a24" : "none" }}>
                    <span style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 14, color: "#d4dde8", minWidth: 60 }}>{a.ticker}</span>
                    <span className="badge" style={{ background: actionMeta[a.alert]?.bg || "#1a2535", color: actionMeta[a.alert]?.color || "#8aa0b0", fontSize: 11 }}>{a.alert}</span>
                    <span style={{ fontSize: 13, color: "#5a7888" }}>{a.reason}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sentiment Flags */}
            {data.sentimentFlags?.length > 0 && (
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="lbl" style={{ marginBottom: 10 }}>Sentiment & News Flags</div>
                {data.sentimentFlags.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 7 }}>
                    <span style={{ color: "#ffd700", fontSize: 12 }}>—</span>
                    <span style={{ fontSize: 13, color: "#5a7888", lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom row */}
            <div className="grid-2">
              <div className="card">
                <div className="lbl">Weekly Context</div>
                <div style={{ fontSize: 13, color: "#5a7888", lineHeight: 1.6 }}>{data.weeklyContext}</div>
              </div>
              <div className="card" style={{ borderColor: `${sm.color}20` }}>
                <div className="lbl">Remember Today</div>
                <div style={{ fontSize: 14, color: sm.color, lineHeight: 1.6, fontWeight: 600 }}>{data.closingThought}</div>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button onClick={generate} style={{ background: "none", border: "1px solid #131f2e", color: "#2a4050", cursor: "pointer", fontFamily: "'Rajdhani'", fontSize: 12, letterSpacing: "0.12em", padding: "8px 20px", textTransform: "uppercase" }}>
                Refresh Briefing
              </button>
              {data.generatedAt && <div style={{ fontSize: 10, color: "#1a2535", marginTop: 8 }}>Generated at {data.generatedAt}</div>}
            </div>
          </div>
        )}

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #0a1520", textAlign: "center", fontSize: 10, color: "#0d1820", letterSpacing: "0.15em" }}>
          SWINGDESK · FOR EDUCATIONAL PURPOSES ONLY · NOT FINANCIAL ADVICE · ALL TRADES CARRY RISK
        </div>
      </div>
    </div>
  );
}
