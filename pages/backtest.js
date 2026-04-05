import { useState } from "react";
import { callClaude } from "../lib/claude";

const BACKTEST_PROMPT = (ticker, weeks) => `Swing trading backtester for SwingDesk.

Simulate what would have happened if our system analyzed ${ticker} starting ${weeks} weeks ago.
Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}

Rules: Enter only score ≥75. Stop within 7%. Target 1 ~10-15%, Target 2 ~20-25%. Max hold 35 days. Exit before earnings.

Use web search to get ${ticker}'s actual price history over the last ${weeks} weeks, news, and technicals.

Output JSON only: {"ticker":"${ticker}","backtestWeeks":${weeks},"startDate":"","endDate":"","startPrice":0,"endPrice":0,"systemScore":0,"wouldHaveEntered":true,"entrySignalDate":"","entryPrice":0,"stopPrice":0,"target1Price":0,"target2Price":0,"outcome":"WIN_T1|WIN_T2|WIN_FULL|STOPPED_OUT|TIME_STOP|NO_ENTRY|EARNINGS_EXIT","exitPrice":0,"exitDate":"","pnlPercent":0,"holdDays":0,"stoppedOut":false,"hitTarget1":false,"hitTarget2":false,"weekByWeek":[{"week":1,"price":0,"action":"HOLD|ENTER|EXIT|WATCH","note":""}],"systemAccuracy":"","whatWorked":"","whatFailed":"","improvementSuggestion":"","verdict":"SYSTEM VALIDATED|SYSTEM NEEDS TUNING|INCONCLUSIVE"}`;

const WEEKLY_AUTOPSY_PROMPT = `Weekly trade autopsy for SwingDesk.
Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}

Use web search to check: major index performance this week, leading/lagging sectors, significant moves in our universe (NVDA META AAPL MSFT GOOGL AMZN PLTR CRWD DDOG XLK XLE QQQ), major macro events, and what setups our system would have flagged Monday vs actual Friday outcomes.

Output JSON only: {"weekOf":"","overallMarket":"BULLISH|CHOPPY|BEARISH","indexPerformance":{"spy":"","qqq":"","iwm":""},"leadingSectors":[],"laggingSectors":[],"systemGrade":"A|B|C|D|F","gradeReason":"","hypotheticalTrades":[{"ticker":"","wouldHaveEntered":true,"entryDay":"","fridayPrice":"","result":"WIN|LOSS|FLAT","pnlEstimate":"","note":""}],"bestCallThisWeek":"","worstMissThisWeek":"","macroSurprises":[],"systemTweaks":[],"nextWeekWatch":[],"traderNote":""}`;

const outcomeColor = o => {
  if (!o) return "#8aa0b0";
  if (o.includes("WIN")) return "#00ff88";
  if (o.includes("STOP")) return "#ff6b6b";
  if (o.includes("TIME")) return "#ffd700";
  return "#8aa0b0";
};
const gradeColor = g => ({ A:"#00ff88", B:"#7dffb3", C:"#ffd700", D:"#fb923c", F:"#ff6b6b" }[g] || "#8aa0b0");

export default function BacktestPage() {
  const [mode, setMode]           = useState("backtest"); // backtest | autopsy
  const [ticker, setTicker]       = useState("");
  const [weeks, setWeeks]         = useState(5);
  const [btResult, setBtResult]   = useState(null);
  const [atResult, setAtResult]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [history, setHistory]     = useState([]);

  const runBacktest = async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setBtResult(null);
    try {
      const result = await callClaude({ prompt: BACKTEST_PROMPT(ticker.trim().toUpperCase(), weeks) });
      setBtResult(result);
      setHistory(prev => [{ ...result, type: "backtest", runAt: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const runAutopsy = async () => {
    setLoading(true);
    setAtResult(null);
    try {
      const result = await callClaude({ prompt: WEEKLY_AUTOPSY_PROMPT });
      setAtResult(result);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05080c", color: "#d4dde8", fontFamily: "'Rajdhani', sans-serif" }}>
      <style>{`
        .mode-btn { background:none; border:1px solid #131f2e; cursor:pointer; font-family:'Orbitron',monospace; font-size:10px; letter-spacing:.15em; text-transform:uppercase; padding:10px 20px; color:#2a4050; transition:all .15s; }
        .mode-btn.active { border-color:#00c8ff; color:#00c8ff; background:#00c8ff10; }
        .run-btn { background:#00ff88; color:#05080c; border:none; cursor:pointer; font-family:'Orbitron',monospace; font-weight:700; font-size:11px; letter-spacing:.12em; text-transform:uppercase; padding:12px 28px; transition:all .15s; }
        .run-btn:hover { background:#33ffaa; }
        .run-btn:disabled { background:#1a2535; color:#2a3d50; cursor:not-allowed; }
        .card { background:#090e15; border:1px solid #131f2e; padding:18px; margin-bottom:10px; }
        .lbl { font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#2a4050; margin-bottom:5px; }
        .t-input { background:#090e15; border:1px solid #131f2e; color:#d4dde8; font-family:'Rajdhani',sans-serif; font-size:20px; font-weight:600; letter-spacing:.08em; padding:0 16px; height:46px; outline:none; text-transform:uppercase; width:150px; }
        .t-input:focus { border-color:#00c8ff; }
        .t-input::placeholder { color:#1a2535; font-size:14px; }
        .week-select { background:#090e15; border:1px solid #131f2e; color:#d4dde8; font-family:'Rajdhani',sans-serif; font-size:14px; padding:0 14px; height:46px; outline:none; cursor:pointer; }
        .grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .week-row { display:flex; gap:10px; align-items:center; padding:8px 0; border-bottom:1px solid #0d1a24; }
        .week-row:last-child { border-bottom:none; }
        @media(max-width:600px){.grid3{grid-template-columns:1fr 1fr;}.grid2{grid-template-columns:1fr;}}
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
          <button className={`mode-btn ${mode==="backtest"?"active":""}`} onClick={() => setMode("backtest")}>
            ◈ Backtest a Ticker
          </button>
          <button className={`mode-btn ${mode==="autopsy"?"active":""}`} onClick={() => setMode("autopsy")}>
            ⊞ Weekly Autopsy
          </button>
        </div>

        {/* ── BACKTEST MODE ── */}
        {mode === "backtest" && (
          <>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 14, color: "#d4dde8", marginBottom: 6 }}>Backtest a Ticker</div>
              <div style={{ fontSize: 13, color: "#3a5568", lineHeight: 1.5 }}>
                Pick any stock and a lookback period. We'll simulate what our system would have done — scored it, entered, managed stops and targets — and show you the actual outcome. No money at risk.
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              <input className="t-input" placeholder="NVDA" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key==="Enter" && !loading && runBacktest()} />
              <select className="week-select" value={weeks} onChange={e => setWeeks(parseInt(e.target.value))}>
                {[2,3,4,5,6,8,10,12].map(w => <option key={w} value={w}>{w} weeks ago</option>)}
              </select>
              <button className="run-btn" onClick={runBacktest} disabled={loading || !ticker.trim()}>
                {loading ? "Running..." : "Run Trial"}
              </button>
            </div>

            {loading && (
              <div style={{ textAlign: "center", padding: "60px 0", fontSize: 11, color: "#3a5568", letterSpacing: "0.15em", animation: "pulse 2s infinite" }}>
                SIMULATING {ticker} OVER {weeks} WEEKS...
              </div>
            )}

            {btResult && (
              <div style={{ animation: "fadein 0.4s ease" }}>
                {/* Outcome banner */}
                <div className="card" style={{ borderColor: `${outcomeColor(btResult.outcome)}30` }}>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center", minWidth: 80 }}>
                      <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 24, color: outcomeColor(btResult.outcome), lineHeight: 1 }}>
                        {btResult.pnlPercent > 0 ? "+" : ""}{btResult.pnlPercent}%
                      </div>
                      <div style={{ fontSize: 10, color: "#2a4050", letterSpacing: "0.1em", marginTop: 4 }}>P&L</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ background: `${outcomeColor(btResult.outcome)}18`, color: outcomeColor(btResult.outcome), padding: "3px 10px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                          {btResult.outcome?.replace(/_/g," ")}
                        </span>
                        <span style={{ background: "#0d1a25", color: "#3a5568", padding: "3px 10px", fontSize: 11 }}>
                          {btResult.holdDays} days held
                        </span>
                        <span style={{ background: "#0d1a25", color: "#3a5568", padding: "3px 10px", fontSize: 11 }}>
                          SCORE {btResult.systemScore}
                        </span>
                        <span style={{ background: btResult.verdict?.includes("VALIDATED") ? "#00ff8818" : "#ffd70018", color: btResult.verdict?.includes("VALIDATED") ? "#00ff88" : "#ffd700", padding: "3px 10px", fontSize: 11 }}>
                          {btResult.verdict}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#5a7888", lineHeight: 1.5 }}>{btResult.systemAccuracy}</div>
                    </div>
                    {!btResult.wouldHaveEntered && (
                      <div style={{ background: "#ffd70015", border: "1px solid #ffd70030", padding: "10px 14px", fontSize: 12, color: "#ffd700", maxWidth: 200 }}>
                        ⚠ System would NOT have entered — score below 75
                      </div>
                    )}
                  </div>
                </div>

                {/* Price levels */}
                {btResult.wouldHaveEntered && (
                  <div className="grid3" style={{ marginBottom: 10 }}>
                    {[
                      { l: "Start Price", v: `$${btResult.startPrice}`, c: "#8aa0b0" },
                      { l: "Entry Price", v: `$${btResult.entryPrice}`, c: "#d4dde8" },
                      { l: "Exit Price",  v: `$${btResult.exitPrice}`,  c: outcomeColor(btResult.outcome) },
                      { l: "Stop Loss",   v: `$${btResult.stopPrice}`,  c: "#ff6b6b" },
                      { l: "Target 1",    v: `$${btResult.target1Price}`,c: btResult.hitTarget1 ? "#00ff88" : "#2a4050" },
                      { l: "Target 2",    v: `$${btResult.target2Price}`,c: btResult.hitTarget2 ? "#7dffb3" : "#2a4050" },
                    ].map(s => (
                      <div key={s.l} className="card" style={{ padding: "10px 12px" }}>
                        <div className="lbl">{s.l}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Week by week */}
                {btResult.weekByWeek?.length > 0 && (
                  <div className="card" style={{ marginBottom: 10 }}>
                    <div className="lbl" style={{ marginBottom: 12 }}>Week by Week</div>
                    {btResult.weekByWeek.map((w, i) => (
                      <div key={i} className="week-row">
                        <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 12, color: "#2a4050", minWidth: 60 }}>W{w.week}</div>
                        <div style={{ fontSize: 13, color: "#d4dde8", minWidth: 70 }}>${w.price}</div>
                        <div style={{ fontSize: 11, color: w.action==="ENTER"?"#00ff88":w.action==="EXIT"?"#ff6b6b":"#3a5568", minWidth: 60, letterSpacing: "0.1em" }}>{w.action}</div>
                        <div style={{ fontSize: 12, color: "#5a7888" }}>{w.note}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* What worked / failed */}
                <div className="grid2">
                  <div className="card">
                    <div className="lbl" style={{ color: "#007a40" }}>What Worked</div>
                    <div style={{ fontSize: 13, color: "#6a9880", lineHeight: 1.6 }}>{btResult.whatWorked}</div>
                  </div>
                  <div className="card">
                    <div className="lbl" style={{ color: "#7a2020" }}>What Failed / Missed</div>
                    <div style={{ fontSize: 13, color: "#907070", lineHeight: 1.6 }}>{btResult.whatFailed}</div>
                  </div>
                </div>

                <div className="card" style={{ borderColor: "#00c8ff20" }}>
                  <div className="lbl" style={{ color: "#006080" }}>System Improvement Suggestion</div>
                  <div style={{ fontSize: 13, color: "#6a9ab0", lineHeight: 1.6 }}>{btResult.improvementSuggestion}</div>
                </div>

                {/* History sidebar hint */}
                {history.length > 1 && (
                  <div className="card">
                    <div className="lbl" style={{ marginBottom: 10 }}>Backtest History</div>
                    {history.slice(0, 6).map((h, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #0d1a24" }}>
                        <span style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 13, color: "#d4dde8" }}>{h.ticker}</span>
                        <span style={{ fontSize: 11, color: "#2a4050" }}>{h.backtestWeeks}w</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: outcomeColor(h.outcome) }}>
                          {h.pnlPercent > 0 ? "+" : ""}{h.pnlPercent}%
                        </span>
                        <span style={{ fontSize: 10, color: h.verdict?.includes("VALIDATED") ? "#00ff88" : "#ffd700", letterSpacing: "0.08em" }}>
                          {h.verdict?.split(" ")[1] || ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── AUTOPSY MODE ── */}
        {mode === "autopsy" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 14, color: "#d4dde8", marginBottom: 6 }}>Weekly Trade Autopsy</div>
              <div style={{ fontSize: 13, color: "#3a5568", lineHeight: 1.5 }}>
                An honest audit of how our system performed this week. What we would have called, what actually happened, and what to tune. Run this every Sunday.
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <button className="run-btn" onClick={runAutopsy} disabled={loading}>
                {loading ? "Auditing..." : "Run This Week's Autopsy"}
              </button>
            </div>

            {loading && (
              <div style={{ textAlign: "center", padding: "60px 0", fontSize: 11, color: "#3a5568", letterSpacing: "0.15em", animation: "pulse 2s infinite" }}>
                AUDITING THIS WEEK'S MARKET ACTION...
              </div>
            )}

            {atResult && (
              <div style={{ animation: "fadein 0.4s ease" }}>
                {/* Grade */}
                <div className="card" style={{ borderColor: `${gradeColor(atResult.systemGrade)}30` }}>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center", minWidth: 70 }}>
                      <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 52, color: gradeColor(atResult.systemGrade), lineHeight: 1 }}>
                        {atResult.systemGrade}
                      </div>
                      <div style={{ fontSize: 9, color: "#2a4050", letterSpacing: "0.1em" }}>SYSTEM GRADE</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#2a4050", letterSpacing: "0.1em", marginBottom: 4 }}>{atResult.weekOf}</div>
                      <div style={{ fontSize: 14, color: "#8aa0b0", lineHeight: 1.6 }}>{atResult.gradeReason}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: atResult.overallMarket==="BULLISH"?"#00ff88":atResult.overallMarket==="CHOPPY"?"#ffd700":"#ff6b6b" }}>
                          {atResult.overallMarket} WEEK
                        </span>
                        {Object.entries(atResult.indexPerformance || {}).map(([k,v]) => (
                          <span key={k} style={{ fontSize: 12, color: v?.startsWith("-") ? "#ff6b6b" : "#00ff88" }}>
                            {k.toUpperCase()} {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hypothetical trades */}
                {atResult.hypotheticalTrades?.length > 0 && (
                  <div className="card" style={{ marginBottom: 10 }}>
                    <div className="lbl" style={{ marginBottom: 12 }}>Hypothetical Trades This Week</div>
                    {atResult.hypotheticalTrades.map((t, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #0d1a24", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 16, color: "#d4dde8", minWidth: 70 }}>{t.ticker}</span>
                        <span style={{ fontSize: 11, color: "#2a4050" }}>MON {t.entryDay} → FRI {t.fridayPrice}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: t.result==="WIN"?"#00ff88":t.result==="LOSS"?"#ff6b6b":"#ffd700" }}>
                          {t.pnlEstimate}
                        </span>
                        <span style={{ fontSize: 12, color: "#5a7888", flex: 1 }}>{t.note}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sector rotation */}
                <div className="grid2" style={{ marginBottom: 10 }}>
                  <div className="card">
                    <div className="lbl" style={{ color: "#007a40" }}>Leading Sectors</div>
                    {atResult.leadingSectors?.map((s,i) => <div key={i} style={{ fontSize: 13, color: "#6a9880", marginBottom: 4 }}>↑ {s}</div>)}
                  </div>
                  <div className="card">
                    <div className="lbl" style={{ color: "#7a2020" }}>Lagging Sectors</div>
                    {atResult.laggingSectors?.map((s,i) => <div key={i} style={{ fontSize: 13, color: "#907070", marginBottom: 4 }}>↓ {s}</div>)}
                  </div>
                </div>

                {/* Best call / worst miss */}
                <div className="grid2" style={{ marginBottom: 10 }}>
                  <div className="card" style={{ borderColor: "#00ff8820" }}>
                    <div className="lbl" style={{ color: "#007a40" }}>Best Call This Week</div>
                    <div style={{ fontSize: 13, color: "#6a9880", lineHeight: 1.6 }}>{atResult.bestCallThisWeek}</div>
                  </div>
                  <div className="card" style={{ borderColor: "#ff6b6b20" }}>
                    <div className="lbl" style={{ color: "#7a2020" }}>Worst Miss This Week</div>
                    <div style={{ fontSize: 13, color: "#907070", lineHeight: 1.6 }}>{atResult.worstMissThisWeek}</div>
                  </div>
                </div>

                {/* System tweaks + next week */}
                <div className="grid2" style={{ marginBottom: 10 }}>
                  <div className="card">
                    <div className="lbl" style={{ marginBottom: 8 }}>System Tweaks to Consider</div>
                    {atResult.systemTweaks?.map((t,i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <span style={{ color: "#00c8ff", fontSize: 12 }}>→</span>
                        <span style={{ fontSize: 12, color: "#5a7888", lineHeight: 1.5 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <div className="lbl" style={{ marginBottom: 8 }}>Watch Next Week</div>
                    {atResult.nextWeekWatch?.map((t,i) => (
                      <div key={i} style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 14, color: "#ffd700", marginBottom: 6 }}>{t}</div>
                    ))}
                  </div>
                </div>

                {/* Macro surprises */}
                {atResult.macroSurprises?.length > 0 && (
                  <div className="card" style={{ marginBottom: 10, borderColor: "#ffd70020" }}>
                    <div className="lbl" style={{ marginBottom: 8, color: "#8a7020" }}>Macro Surprises — Flag Earlier Next Time</div>
                    {atResult.macroSurprises.map((s,i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <span style={{ color: "#ffd700", fontSize: 12 }}>!</span>
                        <span style={{ fontSize: 12, color: "#8a7888", lineHeight: 1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Trader note */}
                {atResult.traderNote && (
                  <div className="card" style={{ borderColor: "#00c8ff20" }}>
                    <div className="lbl" style={{ marginBottom: 8 }}>Weekly Summary</div>
                    <div style={{ fontSize: 13, color: "#6a8898", lineHeight: 1.8, fontStyle: "italic" }}>{atResult.traderNote}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #0a1520", textAlign: "center", fontSize: 10, color: "#0d1820", letterSpacing: "0.15em" }}>
          SWINGDESK · BACKTESTING IS SIMULATED · PAST PERFORMANCE DOES NOT GUARANTEE FUTURE RESULTS · NOT FINANCIAL ADVICE
        </div>
      </div>
    </div>
  );
}
