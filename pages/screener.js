import { useState } from "react";
import { callClaude } from "../lib/claude";

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

const SWING_SYSTEM = {
  stock: `You are an elite swing trading analyst. Swing trades only — holds of 1 day to 8 weeks. Zero day-trading logic. No VWAP, no opening range. Very low risk tolerance. Score honestly.

SCORING (100pts):
TREND (25pts): Price above 50-day EMA (+10), EMA sloping up 3 weeks (+8), outperforming sector 4 weeks (+7)
MOMENTUM (20pts): Weekly RSI 45-65 (+8), MACD histogram positive weekly (+6), RS vs S&P improving 4 weeks (+6)
SETUP QUALITY (20pts): Base pattern on weekly chart (+10), volatility compression (+10)
VOLUME (15pts): More accumulation weeks last 4 weeks (+8), volume drying up in base (+7)
FUNDAMENTALS (10pts): Revenue growing YoY (+5), profitable or clear path (+5)
RISK (10pts): Earnings 3+ weeks away [HARD — if not, cap at 55] (+5), stop within 6-8% (+5)

OUTPUT JSON only, no markdown:
{"ticker":"","assetType":"stock","companyName":"","sector":"","currentPrice":"","swingScore":0,"verdict":"STRONG BUY|BUY|WATCH|SKIP","suggestedHold":"","entryZone":"","stopLoss":"","target1":"","target2":"","riskReward":"","earningsDate":"","earningsRisk":"CLEAR|CAUTION|AVOID","setupType":"","trendHealth":"STRONG|MODERATE|WEAK","momentumStatus":"BUILDING|NEUTRAL|FADING","summary":"","swingEdge":"","greenFlags":[],"redFlags":[],"swingVsDayNote":""}`,

  etf: `You are an elite swing trading analyst specializing in ETF swings. 1 day to 8 weeks holds. No earnings risk on ETFs.

SCORING (100pts):
SECTOR MOMENTUM (30pts): Positive money flow this month (+10), outperforming SPY 4 weeks (+10), sector rotation coming into favor (+10)
TREND STRUCTURE (25pts): Price above 50-day EMA (+10), EMA sloping up (+8), higher highs/lows on weekly (+7)
SETUP QUALITY (25pts): Clean base/consolidation on weekly (+12), ATR compression (+13)
MACRO ALIGNMENT (20pts): Theme fits current macro environment (+10), institutional flow INTO sector (+10)

OUTPUT JSON only:
{"ticker":"","assetType":"etf","companyName":"","sector":"","theme":"","currentPrice":"","swingScore":0,"verdict":"STRONG BUY|BUY|WATCH|SKIP","suggestedHold":"","entryZone":"","stopLoss":"","target1":"","target2":"","riskReward":"","earningsRisk":"CLEAR","setupType":"","trendHealth":"STRONG|MODERATE|WEAK","momentumStatus":"BUILDING|NEUTRAL|FADING","macroAlignment":"ALIGNED|NEUTRAL|HEADWIND","summary":"","swingEdge":"","greenFlags":[],"redFlags":[],"swingVsDayNote":""}`,

  options: `You are an elite swing trading analyst specializing in options for swing trades. 1 day to 8 weeks. NO 0DTE. Minimum 30 DTE preferred 45-90. Never sell naked. Only defined risk.

SCORING (100pts):
UNDERLYING SETUP (35pts): Clean swing setup on underlying (+15), clear directional bias 2-6 weeks (+10), at key technical level (+10)
OPTIONS-SPECIFIC (35pts): IV Rank below 50 — buy when cheap (+15), 45+ DTE available (+10), liquid chain OI>500 tight spread (+10)
RISK/REWARD (30pts): Max 2% account risk (+10), min 2:1 R/R (+10), clear 5-7 day exit if wrong (+10)

OUTPUT JSON only:
{"ticker":"","assetType":"options","companyName":"","sector":"","currentPrice":"","swingScore":0,"verdict":"STRONG BUY|BUY|WATCH|SKIP","bias":"BULLISH|BEARISH|NEUTRAL","recommendedStrategy":"Long Call|Long Put|Bull Call Spread|Bear Put Spread","suggestedExpiry":"","suggestedStrike":"","estimatedPremium":"","target1":"","target2":"","ivRankStatus":"LOW (good to buy)|MODERATE|HIGH (expensive)","earningsDate":"","earningsRisk":"CLEAR|CAUTION|AVOID","suggestedHold":"","stopRule":"","trendHealth":"STRONG|MODERATE|WEAK","summary":"","swingEdge":"","greenFlags":[],"redFlags":[],"beginnerWarning":""}`
};

const verdictMeta = (v) => {
  if (!v) return { color: "#4a6070", bg: "#4a607015", label: "—" };
  if (v.includes("STRONG")) return { color: "#00ff88", bg: "#00ff8818", label: "STRONG BUY" };
  if (v.includes("BUY"))    return { color: "#7dffb3", bg: "#7dffb315", label: "BUY" };
  if (v.includes("WATCH"))  return { color: "#ffd700", bg: "#ffd70015", label: "WATCH" };
  return { color: "#ff6b6b", bg: "#ff6b6b15", label: "SKIP" };
};
const scoreColor = s => s >= 75 ? "#00ff88" : s >= 55 ? "#ffd700" : "#ff6b6b";
const earningsColor = e => e === "CLEAR" ? "#00ff88" : e === "CAUTION" ? "#ffd700" : "#ff6b6b";

export default function ScreenerPage() {
  const [assetType, setAssetType] = useState("stock");
  const [ticker, setTicker]       = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [history, setHistory]     = useState([]);

  const analyze = async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setResult(null);
    const sym = ticker.trim().toUpperCase();
    try {
      const parsed = await callClaude({
        system: SWING_SYSTEM[assetType],
        prompt: `Analyze ${sym} for a swing trade. Use web search for current price, recent price action, technicals, sector context, relevant news. Today is ${TODAY}.`,
      });
      setResult(parsed);
      setHistory(prev => [{ ...parsed, analyzedAt: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const vm = result ? verdictMeta(result.verdict) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#06090d", color: "#dde4ec", fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        .type-pill { background:none; border:1px solid #1a2c3a; cursor:pointer; font-family:'DM Mono',monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; padding:8px 18px; color:#3a5568; transition:all .15s; }
        .type-pill.active { background:#0d1e2c; border-color:#00c8ff; color:#00c8ff; }
        .type-pill:hover:not(.active) { border-color:#2a4050; color:#6a8898; }
        .scan-btn { background:#00c8ff; color:#06090d; border:none; cursor:pointer; font-family:'DM Mono',monospace; font-weight:500; font-size:12px; letter-spacing:.1em; text-transform:uppercase; padding:0 28px; height:48px; transition:all .15s; flex-shrink:0; }
        .scan-btn:hover { background:#33d4ff; }
        .scan-btn:disabled { background:#1a2c3a; color:#2a4050; cursor:not-allowed; }
        .t-input { background:#0a1520; border:1px solid #1a2c3a; border-right:none; color:#dde4ec; font-family:'DM Mono',monospace; font-size:22px; font-weight:500; letter-spacing:.08em; padding:0 18px; height:48px; outline:none; text-transform:uppercase; width:180px; }
        .t-input:focus { border-color:#00c8ff; }
        .t-input::placeholder { color:#1e3040; font-size:14px; }
        .panel { background:#0a1520; border:1px solid #152030; padding:18px; margin-bottom:10px; }
        .lbl { font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:#3a5568; margin-bottom:5px; }
        .badge { display:inline-flex; align-items:center; padding:3px 10px; font-size:10px; letter-spacing:.1em; text-transform:uppercase; font-weight:500; }
        .hist-row { display:flex; align-items:center; gap:12px; padding:10px 14px; border-bottom:1px solid #0d1a24; cursor:pointer; transition:background .1s; }
        .hist-row:hover { background:#0d1a24; }
        .hist-row:last-child { border-bottom:none; }
        .grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .flag-row { display:flex; gap:10px; align-items:flex-start; margin-bottom:7px; }
        @media(max-width:580px){.grid3{grid-template-columns:1fr 1fr;}.grid2{grid-template-columns:1fr;}}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #0f1e2a", padding: "18px 24px 0" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#00c8ff" }}>SWING SCREENER</span>
            <span style={{ fontSize: 10, color: "#2a4050", letterSpacing: "0.15em" }}>1D — 8W HOLDS ONLY</span>
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {[{ id:"stock",label:"Stocks",icon:"▲"},{ id:"etf",label:"ETFs",icon:"◈"},{ id:"options",label:"Options",icon:"⊕"}].map(t => (
              <button key={t.id} className={`type-pill ${assetType===t.id?"active":""}`} onClick={() => { setAssetType(t.id); setResult(null); }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
          <input className="t-input" placeholder="ticker" value={ticker} onChange={e => setTicker(e.target.value)} onKeyDown={e => e.key==="Enter" && !loading && analyze()} />
          <button className="scan-btn" onClick={analyze} disabled={loading || !ticker.trim()}>{loading ? "Scanning..." : "Scan"}</button>
        </div>
        <div style={{ fontSize: 10, color: "#2a4050", letterSpacing: "0.12em", marginBottom: 20, marginTop: -12 }}>
          {assetType==="stock" && "SCORING: Trend · Momentum · Setup Quality · Volume · Fundamentals · Risk"}
          {assetType==="etf"   && "SCORING: Sector Momentum · Trend Structure · Setup Quality · Macro Alignment"}
          {assetType==="options" && "SCORING: Underlying Setup · IV Rank · Liquidity · Risk/Reward · Exit Plan"}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: result||loading ? "1fr 240px" : "1fr", gap: 16, alignItems: "start" }}>
          <div>
            {loading && (
              <div style={{ textAlign: "center", padding: "70px 0", fontSize: 10, color: "#3a5568", letterSpacing: "0.2em", animation: "pulse 1.8s infinite" }}>
                RUNNING SWING ANALYSIS
              </div>
            )}

            {!result && !loading && (
              <div style={{ padding: "60px 0", textAlign: "center" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 48, color: "#0d1e2c", marginBottom: 12 }}>SCAN</div>
                <div style={{ fontSize: 10, color: "#1e3040", letterSpacing: "0.2em" }}>ENTER ANY TICKER TO RUN SWING ANALYSIS</div>
              </div>
            )}

            {result && vm && (
              <div style={{ animation: "fadein 0.35s ease" }}>
                {/* Score header */}
                <div className="panel" style={{ border: `1px solid ${vm.color}28` }}>
                  <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", width:90, height:90, flexShrink:0 }}>
                      <svg width="90" height="90" viewBox="0 0 90 90" style={{ position:"absolute", top:0, left:0 }}>
                        <circle cx="45" cy="45" r="36" fill="none" stroke="#0f1e2a" strokeWidth="5" />
                        <circle cx="45" cy="45" r="36" fill="none" stroke={scoreColor(result.swingScore)} strokeWidth="5"
                          strokeDasharray={`${(result.swingScore/100)*226} 226`} strokeLinecap="round" transform="rotate(-90 45 45)" />
                      </svg>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color:scoreColor(result.swingScore), lineHeight:1 }}>{result.swingScore}</div>
                      <div style={{ fontSize:8, color:"#3a5568", letterSpacing:"0.1em" }}>SCORE</div>
                    </div>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap", marginBottom:8 }}>
                        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:"#dde4ec" }}>{result.ticker}</span>
                        <span style={{ fontSize:12, color:"#3a5568" }}>{result.companyName}</span>
                        {result.currentPrice && <span style={{ fontSize:14, color:"#dde4ec", marginLeft:"auto" }}>{result.currentPrice}</span>}
                      </div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                        <span className="badge" style={{ background:vm.bg, color:vm.color }}>{vm.label}</span>
                        {result.bias && <span className="badge" style={{ background:"#1a2c3a", color:"#8ab0c8" }}>{result.bias}</span>}
                        {result.setupType && <span className="badge" style={{ background:"#1a2c3a", color:"#6a8898" }}>{result.setupType}</span>}
                        {result.earningsRisk && <span className="badge" style={{ background:`${earningsColor(result.earningsRisk)}15`, color:earningsColor(result.earningsRisk) }}>EARNINGS: {result.earningsRisk}</span>}
                      </div>
                      <div style={{ fontSize:12, color:"#7a9ab0", lineHeight:1.6 }}>{result.summary}</div>
                    </div>
                  </div>
                  <div style={{ height:1, background:"#152030", margin:"14px 0" }} />
                  <div style={{ fontSize:11, color:"#00c8ff", lineHeight:1.5 }}>
                    <span style={{ color:"#3a5568", marginRight:8 }}>SWING EDGE:</span>{result.swingEdge}
                  </div>
                </div>

                {/* Trade levels */}
                {result.assetType !== "options" ? (
                  <div className="grid3" style={{ marginBottom:10 }}>
                    {[
                      { label:"Entry Zone",    val:result.entryZone,    color:"#dde4ec" },
                      { label:"Target 1",      val:result.target1,      color:"#00ff88" },
                      { label:"Target 2",      val:result.target2,      color:"#7dffb3" },
                      { label:"Stop Loss",     val:result.stopLoss,     color:"#ff6b6b" },
                      { label:"Risk/Reward",   val:result.riskReward,   color:"#ffd700" },
                      { label:"Hold",          val:result.suggestedHold,color:"#8ab0c8" },
                    ].map(s => (
                      <div key={s.label} className="panel" style={{ padding:"12px 14px" }}>
                        <div className="lbl">{s.label}</div>
                        <div style={{ fontSize:13, fontWeight:500, color:s.color }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="panel" style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:"#2a4050", marginBottom:12 }}>Options Setup</div>
                    <div className="grid3">
                      {[
                        { label:"Strategy",     val:result.recommendedStrategy, color:"#00c8ff" },
                        { label:"Expiry",        val:result.suggestedExpiry,     color:"#dde4ec" },
                        { label:"Strike",        val:result.suggestedStrike,     color:"#dde4ec" },
                        { label:"Est Premium",   val:result.estimatedPremium,    color:"#ffd700" },
                        { label:"IV Rank",        val:result.ivRankStatus,        color:result.ivRankStatus?.includes("LOW")?"#00ff88":result.ivRankStatus?.includes("HIGH")?"#ff6b6b":"#ffd700" },
                        { label:"Hold",          val:result.suggestedHold,       color:"#8ab0c8" },
                      ].map(s => (
                        <div key={s.label} style={{ padding:"10px 0", borderBottom:"1px solid #0f1e2a" }}>
                          <div className="lbl">{s.label}</div>
                          <div style={{ fontSize:12, fontWeight:500, color:s.color }}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                    {result.stopRule && <div style={{ marginTop:14, fontSize:11, color:"#ff6b6b" }}><span style={{color:"#3a5568",marginRight:8}}>EXIT RULE:</span>{result.stopRule}</div>}
                    {result.beginnerWarning && <div style={{ marginTop:8, fontSize:11, color:"#ffd700" }}><span style={{color:"#3a5568",marginRight:8}}>⚠ WATCH:</span>{result.beginnerWarning}</div>}
                  </div>
                )}

                {/* Status row */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                  {[
                    result.trendHealth && { label:"Trend Health", val:result.trendHealth, color:result.trendHealth==="STRONG"?"#00ff88":result.trendHealth==="MODERATE"?"#ffd700":"#ff6b6b" },
                    result.momentumStatus && { label:"Momentum", val:result.momentumStatus, color:result.momentumStatus==="BUILDING"?"#00ff88":result.momentumStatus==="NEUTRAL"?"#ffd700":"#ff6b6b" },
                    result.macroAlignment && { label:"Macro", val:result.macroAlignment, color:result.macroAlignment==="ALIGNED"?"#00ff88":result.macroAlignment==="NEUTRAL"?"#ffd700":"#ff6b6b" },
                    result.earningsDate && result.earningsDate!=="unknown" && { label:"Earnings", val:result.earningsDate, color:earningsColor(result.earningsRisk) },
                  ].filter(Boolean).map(s => (
                    <div key={s.label} className="panel" style={{ padding:"10px 14px", flex:1 }}>
                      <div className="lbl">{s.label}</div>
                      <div style={{ fontSize:12, fontWeight:500, color:s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Flags */}
                <div className="grid2">
                  <div className="panel">
                    <div style={{ fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:"#007a40", marginBottom:12 }}>Green Flags</div>
                    {result.greenFlags?.map((f,i) => (
                      <div key={i} className="flag-row">
                        <div style={{ width:6, height:6, borderRadius:"50%", background:"#00ff88", flexShrink:0, marginTop:5 }} />
                        <span style={{ fontSize:11, color:"#6a9880", lineHeight:1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="panel">
                    <div style={{ fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:"#7a2020", marginBottom:12 }}>Red Flags</div>
                    {result.redFlags?.length > 0 ? result.redFlags.map((f,i) => (
                      <div key={i} className="flag-row">
                        <div style={{ width:6, height:6, borderRadius:"50%", background:"#ff6b6b", flexShrink:0, marginTop:5 }} />
                        <span style={{ fontSize:11, color:"#907070", lineHeight:1.5 }}>{f}</span>
                      </div>
                    )) : <div style={{ fontSize:11, color:"#2a4050" }}>No major red flags.</div>}
                  </div>
                </div>

                {result.swingVsDayNote && (
                  <div className="panel" style={{ borderColor:"#1a3040" }}>
                    <div className="lbl">Swing vs Day Trade</div>
                    <div style={{ fontSize:11, color:"#5a7888", lineHeight:1.6 }}>{result.swingVsDayNote}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          {(result||loading||history.length>0) && (
            <div>
              <div className="panel" style={{ padding:0 }}>
                <div style={{ padding:"12px 14px", borderBottom:"1px solid #0f1e2a", fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:"#2a4050" }}>Recent Scans</div>
                {history.length===0 ? (
                  <div style={{ padding:14, fontSize:10, color:"#1e3040" }}>No scans yet</div>
                ) : history.map((h,i) => {
                  const hvm = verdictMeta(h.verdict);
                  return (
                    <div key={i} className="hist-row" onClick={() => setResult(h)}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:"#dde4ec" }}>{h.ticker}</div>
                        <div style={{ fontSize:9, color:"#2a4050" }}>{h.analyzedAt}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:16, fontWeight:600, color:scoreColor(h.swingScore) }}>{h.swingScore}</div>
                        <div style={{ fontSize:9, color:hvm.color }}>{hvm.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="panel" style={{ marginTop:10 }}>
                <div style={{ fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:"#2a4050", marginBottom:12 }}>Score Guide</div>
                {[{r:"75-100",l:"Strong buy",c:"#00ff88"},{r:"55-74",l:"Watch",c:"#ffd700"},{r:"0-54",l:"Skip",c:"#ff6b6b"}].map(s=>(
                  <div key={s.r} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:10, color:s.c }}>{s.r}</span>
                    <span style={{ fontSize:10, color:"#3a5568" }}>{s.l}</span>
                  </div>
                ))}
                <div style={{ height:1, background:"#152030", margin:"10px 0" }} />
                <div style={{ fontSize:9, color:"#1e3040", lineHeight:1.6 }}>No $25k required.<br/>No day-trading rules.<br/>All account sizes.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop:40, paddingTop:16, borderTop:"1px solid #0a1520", textAlign:"center", fontSize:10, color:"#0d1820", letterSpacing:"0.15em", padding:"16px 24px 40px" }}>
        SWINGDESK · FOR EDUCATIONAL PURPOSES ONLY · NOT FINANCIAL ADVICE · ALL TRADES CARRY RISK
      </div>
    </div>
  );
}
