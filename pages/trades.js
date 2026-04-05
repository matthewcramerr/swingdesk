import { useState } from "react";

const SAMPLE_TRADES = [
  { id: 1, ticker: "NVDA", assetType: "stock", entry: 118.50, target1: 132.00, target2: 142.00, stop: 112.00, shares: 10, status: "active", entryDate: "2025-03-28", score: 82, setupType: "Flat Base Breakout", holdWindow: "10-18 days", notes: "" },
  { id: 2, ticker: "XLK",  assetType: "etf",   entry: 195.00, target1: 210.00, target2: 222.00, stop: 188.00, shares: 15, status: "active", entryDate: "2025-03-31", score: 76, setupType: "Sector Rotation", holdWindow: "7-14 days", notes: "" },
  { id: 3, ticker: "META", assetType: "stock", entry: 522.00, target1: 565.00, target2: 598.00, stop: 505.00, shares: 5,  status: "closed", entryDate: "2025-03-10", exitDate: "2025-03-28", exitPrice: 578.00, score: 88, setupType: "Cup & Handle", holdWindow: "18 days", notes: "Exited 1/3 at T1, trailed rest to T2" },
];

const statusColor = s => s === "active" ? "#00c8ff" : s === "closed" ? "#2a4050" : "#ffd700";
const scoreColor  = s => s >= 75 ? "#00ff88" : s >= 60 ? "#ffd700" : "#ff6b6b";
const pnlColor    = p => p > 0 ? "#00ff88" : p < 0 ? "#ff6b6b" : "#8aa0b0";

function calcPnl(trade) {
  if (trade.status !== "closed" || !trade.exitPrice) return null;
  return ((trade.exitPrice - trade.entry) * trade.shares).toFixed(2);
}
function calcPnlPct(trade) {
  if (trade.status !== "closed" || !trade.exitPrice) return null;
  return (((trade.exitPrice - trade.entry) / trade.entry) * 100).toFixed(1);
}

export default function TradesPage() {
  const [trades, setTrades]   = useState(SAMPLE_TRADES);
  const [filter, setFilter]   = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ ticker:"", assetType:"stock", entry:"", target1:"", target2:"", stop:"", shares:"", setupType:"", holdWindow:"", notes:"", score:"" });

  const addTrade = () => {
    if (!form.ticker || !form.entry) return;
    const newTrade = {
      id: Date.now(),
      ...form,
      entry: parseFloat(form.entry),
      target1: parseFloat(form.target1),
      target2: parseFloat(form.target2),
      stop: parseFloat(form.stop),
      shares: parseInt(form.shares) || 0,
      score: parseInt(form.score) || 0,
      status: "active",
      entryDate: new Date().toISOString().split("T")[0],
    };
    setTrades(prev => [newTrade, ...prev]);
    setForm({ ticker:"", assetType:"stock", entry:"", target1:"", target2:"", stop:"", shares:"", setupType:"", holdWindow:"", notes:"", score:"" });
    setShowAdd(false);
  };

  const filtered = filter === "all" ? trades : trades.filter(t => t.status === filter);
  const activeTrades  = trades.filter(t => t.status === "active");
  const closedTrades  = trades.filter(t => t.status === "closed");
  const totalPnl      = closedTrades.reduce((sum, t) => sum + parseFloat(calcPnl(t) || 0), 0);
  const winners       = closedTrades.filter(t => parseFloat(calcPnlPct(t)) > 0);
  const winRate       = closedTrades.length ? ((winners.length / closedTrades.length) * 100).toFixed(0) : "—";

  return (
    <div style={{ minHeight: "100vh", background: "#05080c", color: "#d4dde8", fontFamily: "'Rajdhani', sans-serif" }}>
      <style>{`
        .filter-btn { background:none; border:1px solid #131f2e; cursor:pointer; font-family:'Rajdhani',sans-serif; font-size:11px; letter-spacing:.12em; text-transform:uppercase; padding:7px 16px; color:#2a4050; transition:all .15s; }
        .filter-btn.active { border-color:#00ff88; color:#00ff88; background:#00ff8810; }
        .add-btn { background:#00ff88; color:#05080c; border:none; cursor:pointer; font-family:'Orbitron',monospace; font-weight:700; font-size:11px; letter-spacing:.12em; text-transform:uppercase; padding:8px 20px; transition:all .15s; }
        .add-btn:hover { background:#33ffaa; }
        .trade-card { background:#090e15; border:1px solid #131f2e; padding:16px; margin-bottom:10px; transition:border-color .2s; }
        .stat-box { background:#090e15; border:1px solid #131f2e; padding:14px 18px; }
        .lbl { font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#2a4050; margin-bottom:5px; }
        .form-input { background:#090e15; border:1px solid #131f2e; color:#d4dde8; font-family:'Rajdhani',sans-serif; font-size:14px; padding:8px 12px; outline:none; width:100%; transition:border-color .15s; }
        .form-input:focus { border-color:#00c8ff; }
        .form-input::placeholder { color:#2a4050; }
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        @media(max-width:600px){.form-grid{grid-template-columns:1fr;}}
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Active Trades", val: `${activeTrades.length} / 5`, color: activeTrades.length >= 5 ? "#ffd700" : "#00c8ff" },
            { label: "Closed Trades", val: closedTrades.length, color: "#d4dde8" },
            { label: "Win Rate",      val: `${winRate}%`, color: parseFloat(winRate) >= 55 ? "#00ff88" : "#ffd700" },
            { label: "Total P&L",     val: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`, color: pnlColor(totalPnl) },
          ].map(s => (
            <div key={s.label} className="stat-box">
              <div className="lbl">{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'Orbitron', monospace" }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* 5-slot visual */}
        <div style={{ background: "#090e15", border: "1px solid #131f2e", padding: "14px 18px", marginBottom: 20 }}>
          <div className="lbl" style={{ marginBottom: 10 }}>Position Slots</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1,2,3,4,5].map(i => {
              const t = activeTrades[i-1];
              return (
                <div key={i} style={{
                  flex: 1, padding: "10px 8px", textAlign: "center",
                  background: t ? "#0d1e15" : "#05080c",
                  border: `1px solid ${t ? "#00ff8840" : "#131f2e"}`,
                }}>
                  {t ? (
                    <>
                      <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 13, color: "#00ff88" }}>{t.ticker}</div>
                      <div style={{ fontSize: 9, color: "#2a4050", letterSpacing: "0.1em", marginTop: 2 }}>{t.assetType.toUpperCase()}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 10, color: "#1a2535", letterSpacing: "0.1em" }}>OPEN</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "active", "closed"].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button className="add-btn" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "+ Log Trade"}
          </button>
        </div>

        {/* Add trade form */}
        {showAdd && (
          <div style={{ background: "#090e15", border: "1px solid #00c8ff30", padding: "20px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#00c8ff", marginBottom: 16 }}>Log New Trade</div>
            <div className="form-grid">
              {[
                { key:"ticker",     label:"Ticker",       placeholder:"NVDA" },
                { key:"score",      label:"Score",        placeholder:"82" },
                { key:"entry",      label:"Entry Price",  placeholder:"118.50" },
                { key:"shares",     label:"Shares / Contracts", placeholder:"10" },
                { key:"target1",    label:"Target 1",     placeholder:"132.00" },
                { key:"target2",    label:"Target 2",     placeholder:"142.00" },
                { key:"stop",       label:"Stop Loss",    placeholder:"112.00" },
                { key:"holdWindow", label:"Hold Window",  placeholder:"10-18 days" },
                { key:"setupType",  label:"Setup Type",   placeholder:"Flat Base Breakout" },
              ].map(f => (
                <div key={f.key}>
                  <div className="lbl">{f.label}</div>
                  <input className="form-input" placeholder={f.placeholder} value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: f.key === "ticker" ? e.target.value.toUpperCase() : e.target.value }))} />
                </div>
              ))}
              <div>
                <div className="lbl">Asset Type</div>
                <select className="form-input" value={form.assetType} onChange={e => setForm(p => ({ ...p, assetType: e.target.value }))}>
                  <option value="stock">Stock</option>
                  <option value="etf">ETF</option>
                  <option value="options">Options</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="lbl">Notes</div>
              <input className="form-input" placeholder="Setup notes, why you took this trade..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <button onClick={addTrade} style={{ marginTop: 14, background: "#00ff88", color: "#05080c", border: "none", cursor: "pointer", fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", padding: "10px 24px" }}>
              Add Trade
            </button>
          </div>
        )}

        {/* Trade list */}
        {filtered.map(trade => {
          const pnl    = calcPnl(trade);
          const pnlPct = calcPnlPct(trade);
          const riskPct = trade.entry && trade.stop ? (((trade.entry - trade.stop) / trade.entry) * 100).toFixed(1) : null;
          return (
            <div key={trade.id} className="trade-card" style={{ borderLeft: `3px solid ${statusColor(trade.status)}` }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* Left */}
                <div style={{ minWidth: 100 }}>
                  <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 20, color: "#d4dde8" }}>{trade.ticker}</div>
                  <div style={{ fontSize: 10, color: "#2a4050", letterSpacing: "0.1em", background: "#05080c", padding: "2px 6px", display: "inline-block", marginTop: 4 }}>{trade.assetType?.toUpperCase()}</div>
                  <div style={{ marginTop: 6, fontSize: 10, color: statusColor(trade.status), letterSpacing: "0.12em" }}>{trade.status.toUpperCase()}</div>
                  <div style={{ marginTop: 4, fontSize: 10, color: scoreColor(trade.score) }}>SCORE {trade.score}</div>
                </div>

                {/* Levels */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, flex: 1, minWidth: 240 }}>
                  {[
                    { l: "Entry",    v: `$${trade.entry}`,                    c: "#d4dde8" },
                    { l: "Target 1", v: trade.target1 ? `$${trade.target1}` : "—", c: "#00ff88" },
                    { l: "Target 2", v: trade.target2 ? `$${trade.target2}` : "—", c: "#7dffb3" },
                    { l: "Stop",     v: `$${trade.stop}`,                     c: "#ff6b6b" },
                    { l: "Risk",     v: riskPct ? `${riskPct}%` : "—",        c: "#ff6b6b" },
                    { l: "Shares",   v: trade.shares,                         c: "#8aa0b0" },
                  ].map(s => (
                    <div key={s.l} style={{ background: "#05080c", padding: "6px 8px" }}>
                      <div className="lbl" style={{ marginBottom: 2 }}>{s.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Right: P&L or hold */}
                <div style={{ minWidth: 100, textAlign: "right" }}>
                  {trade.status === "closed" && pnl !== null ? (
                    <>
                      <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 22, color: pnlColor(parseFloat(pnl)), lineHeight: 1 }}>
                        {parseFloat(pnl) >= 0 ? "+" : ""}{pnlPct}%
                      </div>
                      <div style={{ fontSize: 12, color: pnlColor(parseFloat(pnl)), marginTop: 2 }}>
                        {parseFloat(pnl) >= 0 ? "+" : ""}${pnl}
                      </div>
                      <div style={{ fontSize: 10, color: "#2a4050", marginTop: 4 }}>{trade.exitDate}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 10, color: "#2a4050", letterSpacing: "0.1em" }}>ENTERED</div>
                      <div style={{ fontSize: 13, color: "#8aa0b0", marginTop: 2 }}>{trade.entryDate}</div>
                      {trade.holdWindow && <div style={{ fontSize: 10, color: "#2a4050", marginTop: 4 }}>{trade.holdWindow}</div>}
                    </>
                  )}
                </div>
              </div>

              {/* Setup + notes */}
              {(trade.setupType || trade.notes) && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #0d1a24", display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {trade.setupType && <span style={{ fontSize: 11, color: "#3a5568", background: "#05080c", padding: "2px 8px" }}>{trade.setupType}</span>}
                  {trade.notes && <span style={{ fontSize: 11, color: "#5a7888" }}>{trade.notes}</span>}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #0a1520", textAlign: "center", fontSize: 10, color: "#0d1820", letterSpacing: "0.15em" }}>
          SWINGDESK · FOR EDUCATIONAL PURPOSES ONLY · NOT FINANCIAL ADVICE · ALL TRADES CARRY RISK
        </div>
      </div>
    </div>
  );
}
