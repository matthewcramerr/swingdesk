import { useState, useEffect } from "react";

const statusMeta = {
  "GO":         { color: "#00ff88", bg: "#00ff8812", label: "GO",         icon: "▲" },
  "CAUTION":    { color: "#ffd700", bg: "#ffd70012", label: "CAUTION",    icon: "◆" },
  "STAND DOWN": { color: "#ff6b6b", bg: "#ff6b6b12", label: "STAND DOWN", icon: "▼" },
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

function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function isBeforeMarket() {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  return et.getHours() < 9 || (et.getHours() === 9 && et.getMinutes() < 25);
}

function getETTime() {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export default function CommandPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState("checking");

  useEffect(() => {
    if (isWeekend()) {
      setStatus("weekend");
      setLoading(false);
      return;
    }
    fetch("/api/brief")
      .then(r => r.json())
      .then(res => {
        if (res.hasData && res.data) {
          setData(res.data);
          setStatus("ready");
        } else {
          setStatus(isBeforeMarket() ? "pre-market" : "empty");
        }
        setLoading(false);
      })
      .catch(() => { setStatus("empty"); setLoading(false); });
  }, []);

  const sm = data ? (statusMeta[data.commanderCall?.status] || statusMeta["CAUTION"]) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#05080c", color: "#d4dde8", fontFamily: "'Rajdhani', sans-serif" }}>
      <style>{`
        .card { background:#090e15; border:1px solid #131f2e; padding:18px; }
        .lbl { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:#2a4050; margin-bottom:6px; font-weight:600; }
        .action-card { background:#090e15; border:1px solid #131f2e; padding:16px; margin-bottom:10px; position:relative; overflow:hidden; }
        .badge { display:inline-flex; align-items:center; padding:3px 10px; font-size:11px; letter-spacing:.08em; text-transform:uppercase; font-weight:600; }
        .grid-macro { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        @media(max-width:640px){.grid-macro{grid-template-columns:repeat(2,1fr);}.grid-2{grid-template-columns:1fr;}}
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", fontSize: 11, color: "#2a4050", letterSpacing: "0.2em", animation: "pulse 2s infinite" }}>
            LOADING TODAY'S BRIEFING...
          </div>
        )}

        {!loading && status === "weekend" && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏖️</div>
            <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 14, color: "#1a3040", letterSpacing: "0.2em", marginBottom: 12 }}>MARKETS CLOSED</div>
            <div style={{ fontSize: 14, color: "#2a4050" }}>It's the weekend. Rest up.</div>
            <div style={{ fontSize: 12, color: "#1a2535", marginTop: 8 }}>Next briefing: Monday at 9:25 AM ET.</div>
          </div>
        )}

        {!loading && status === "pre-market" && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 14, color: "#1a3040", letterSpacing: "0.2em", marginBottom: 12 }}>BRIEFING GENERATES AT 9:25 AM ET</div>
            <div style={{ fontSize: 14, color: "#2a4050" }}>Current ET time: {getETTime()}</div>
            <div style={{ fontSize: 12, color: "#1a2535", marginTop: 8 }}>Check back after 9:25 AM — ready before the open.</div>
          </div>
        )}

        {!loading && status === "empty" && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
            <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 14, color: "#1a3040", letterSpacing: "0.2em", marginBottom: 12 }}>BRIEFING NOT YET AVAILABLE</div>
            <div style={{ fontSize: 14, color: "#2a4050", maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
              Today's briefing generates automatically at 9:25 AM ET. Check back shortly.
            </div>
          </div>
        )}

        {!loading && status === "ready" && data && sm && (
          <div style={{ animation: "fadein 0.5s ease" }}>

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
              <div style={{ marginTop: 12, fontSize: 10, color: "#1a3040", letterSpacing: "0.1em" }}>
                Generated {data.generatedAt} · {data.date}
              </div>
            </div>

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

            {data.nothingToDoNote && (
              <div className="card" style={{ marginBottom: 14, textAlign: "center", padding: "32px" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🧘</div>
                <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 12, color: "#2a4050", letterSpacing: "0.15em", marginBottom: 10 }}>NOTHING MEETS CRITERIA TODAY</div>
                <div style={{ fontSize: 14, color: "#4a6070", lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>{data.nothingToDoNote}</div>
              </div>
            )}

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

          </div>
        )}

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #0a1520", textAlign: "center", fontSize: 10, color: "#0d1820", letterSpacing: "0.15em" }}>
          SWINGDESK · FOR EDUCATIONAL PURPOSES ONLY · NOT FINANCIAL ADVICE · ALL TRADES CARRY RISK
        </div>
      </div>
    </div>
  );
}
