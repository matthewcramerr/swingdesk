import { useState, useEffect } from "react";

const pnlColor = p => parseFloat(p) >= 0 ? "#00ff88" : "#ff6b6b";

export default function PortfolioPage() {
  const [account, setAccount]     = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [tab, setTab]             = useState("positions");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [acctRes, posRes, ordRes] = await Promise.all([
        fetch("/api/alpaca?endpoint=account"),
        fetch("/api/alpaca?endpoint=positions"),
        fetch("/api/alpaca?endpoint=orders"),
      ]);
      const [acct, pos, ord] = await Promise.all([acctRes.json(), posRes.json(), ordRes.json()]);
      if (acct.error) throw new Error(acct.error);
      setAccount(acct);
      setPositions(Array.isArray(pos) ? pos : []);
      setOrders(Array.isArray(ord) ? ord : []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const totalPnl = positions.reduce((sum, p) => sum + parseFloat(p.unrealized_pl || 0), 0);
  const totalPnlPct = account ? ((totalPnl / parseFloat(account.portfolio_value)) * 100).toFixed(2) : "0";

  return (
    <div style={{ minHeight: "100vh", background: "#05080c", color: "#d4dde8", fontFamily: "'Rajdhani', sans-serif" }}>
      <style>{`
        .card { background:#090e15; border:1px solid #131f2e; padding:18px; }
        .lbl { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:#2a4050; margin-bottom:6px; font-weight:600; }
        .tab-btn { background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; font-family:'Orbitron',monospace; font-size:10px; letter-spacing:.15em; text-transform:uppercase; padding:10px 16px; color:#2a4050; transition:all .15s; }
        .tab-btn.active { color:#00ff88; border-bottom-color:#00ff88; }
        .refresh-btn { background:none; border:1px solid #131f2e; color:#2a4050; cursor:pointer; font-family:'Rajdhani',sans-serif; font-size:11px; letter-spacing:.12em; text-transform:uppercase; padding:7px 16px; transition:all .15s; }
        .refresh-btn:hover { border-color:#00ff88; color:#00ff88; }
        .pos-row { background:#090e15; border:1px solid #131f2e; padding:14px 16px; margin-bottom:8px; border-left:3px solid; }
        .order-row { display:flex; gap:12px; align-items:center; padding:10px 0; border-bottom:1px solid #0d1a24; flex-wrap:wrap; }
        .order-row:last-child { border-bottom:none; }
        .badge { display:inline-flex; align-items:center; padding:3px 10px; font-size:10px; letter-spacing:.1em; text-transform:uppercase; font-weight:500; }
        .stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px; }
        @media(max-width:640px){.stat-grid{grid-template-columns:repeat(2,1fr);}}
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 16, color: "#00ff88", marginBottom: 2 }}>MATTHEW'S PORTFOLIO</div>
            <div style={{ fontSize: 11, color: "#2a4050", letterSpacing: "0.12em" }}>
              {account?.account_number ? `Alpaca Paper · ${account.account_number}` : "Alpaca Paper Trading"}
            </div>
          </div>
          <button className="refresh-btn" onClick={loadAll}>↻ Refresh</button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", fontSize: 11, color: "#2a4050", letterSpacing: "0.2em", animation: "pulse 2s infinite" }}>
            LOADING PORTFOLIO...
          </div>
        )}

        {error && (
          <div style={{ background: "#1a0a0a", border: "1px solid #ff6b6b30", padding: "20px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#ff6b6b", marginBottom: 8 }}>Could not connect to Alpaca</div>
            <div style={{ fontSize: 11, color: "#5a3030" }}>{error}</div>
            <div style={{ fontSize: 11, color: "#3a2020", marginTop: 8 }}>
              Make sure ALPACA_API_KEY and ALPACA_SECRET_KEY are set in Vercel environment variables.
            </div>
          </div>
        )}

        {!loading && !error && account && (
          <>
            {/* Account stats */}
            <div className="stat-grid">
              {[
                { label: "Portfolio Value", val: `$${parseFloat(account.portfolio_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#d4dde8" },
                { label: "Buying Power",    val: `$${parseFloat(account.buying_power).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#00c8ff" },
                { label: "Today's P&L",     val: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`, color: pnlColor(totalPnl) },
                { label: "P&L %",           val: `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct}%`, color: pnlColor(totalPnlPct) },
              ].map(s => (
                <div key={s.label} className="card">
                  <div className="lbl">{s.label}</div>
                  <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 16, color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Account status badges */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <span style={{ background: account.status === "ACTIVE" ? "#00ff8818" : "#ff6b6b18", color: account.status === "ACTIVE" ? "#00ff88" : "#ff6b6b", padding: "3px 10px", fontSize: 11, letterSpacing: "0.1em" }}>
                {account.status}
              </span>
              <span style={{ background: "#1a2535", color: "#4a6070", padding: "3px 10px", fontSize: 11 }}>
                {account.pattern_day_trader ? "PDT FLAGGED" : "NO PDT RESTRICTION"}
              </span>
              <span style={{ background: "#1a2535", color: "#4a6070", padding: "3px 10px", fontSize: 11 }}>
                PAPER TRADING
              </span>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: "1px solid #131f2e", marginBottom: 16 }}>
              {["positions", "orders"].map(t => (
                <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                  {t === "positions" ? `Positions (${positions.length})` : `Recent Orders (${orders.length})`}
                </button>
              ))}
            </div>

            {/* Positions */}
            {tab === "positions" && (
              <>
                {positions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#2a4050", fontSize: 13 }}>
                    No open positions. Run the screener to find setups.
                  </div>
                ) : positions.map((p, i) => {
                  const pl = parseFloat(p.unrealized_pl || 0);
                  const plPct = parseFloat(p.unrealized_plpc || 0) * 100;
                  return (
                    <div key={i} className="pos-row" style={{ borderLeftColor: pl >= 0 ? "#00ff88" : "#ff6b6b" }}>
                      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                        <div style={{ minWidth: 100 }}>
                          <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 20, color: "#d4dde8" }}>{p.symbol}</div>
                          <div style={{ fontSize: 10, color: "#2a4050", letterSpacing: "0.1em", marginTop: 2 }}>{p.asset_class?.toUpperCase()}</div>
                          <div style={{ fontSize: 11, color: "#3a5060", marginTop: 4 }}>{p.qty} shares</div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, flex: 1, minWidth: 280 }}>
                          {[
                            { l: "Avg Entry", v: `$${parseFloat(p.avg_entry_price).toFixed(2)}`, c: "#d4dde8" },
                            { l: "Current",   v: `$${parseFloat(p.current_price).toFixed(2)}`,   c: "#d4dde8" },
                            { l: "Market Val",v: `$${parseFloat(p.market_value).toFixed(2)}`,    c: "#8aa0b0" },
                            { l: "Unrealized P&L", v: `${pl >= 0 ? "+" : ""}$${pl.toFixed(2)}`, c: pnlColor(pl) },
                            { l: "P&L %",     v: `${plPct >= 0 ? "+" : ""}${plPct.toFixed(2)}%`, c: pnlColor(plPct) },
                            { l: "Side",      v: p.side?.toUpperCase(), c: p.side === "long" ? "#00ff88" : "#ff6b6b" },
                          ].map(s => (
                            <div key={s.l} style={{ background: "#05080c", padding: "8px 10px" }}>
                              <div className="lbl" style={{ marginBottom: 2 }}>{s.l}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: s.c }}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Orders */}
            {tab === "orders" && (
              <div className="card" style={{ padding: 0 }}>
                {orders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#2a4050", fontSize: 13 }}>No recent orders.</div>
                ) : orders.slice(0, 20).map((o, i) => (
                  <div key={i} className="order-row" style={{ padding: "12px 16px" }}>
                    <span style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 16, color: "#d4dde8", minWidth: 80 }}>{o.symbol}</span>
                    <span style={{ background: o.side === "buy" ? "#00ff8818" : "#ff6b6b18", color: o.side === "buy" ? "#00ff88" : "#ff6b6b", padding: "2px 8px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>{o.side}</span>
                    <span style={{ fontSize: 12, color: "#5a7888" }}>{o.qty} shares @ {o.filled_avg_price ? `$${parseFloat(o.filled_avg_price).toFixed(2)}` : o.limit_price ? `$${parseFloat(o.limit_price).toFixed(2)} limit` : "market"}</span>
                    <span style={{ fontSize: 11, color: o.status === "filled" ? "#00ff88" : o.status === "canceled" ? "#ff6b6b" : "#ffd700", letterSpacing: "0.08em", textTransform: "uppercase", marginLeft: "auto" }}>{o.status}</span>
                    <span style={{ fontSize: 10, color: "#2a4050" }}>{new Date(o.submitted_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #0a1520", textAlign: "center", fontSize: 10, color: "#0d1820", letterSpacing: "0.15em" }}>
          SWINGDESK · PAPER TRADING · FOR EDUCATIONAL PURPOSES ONLY · NOT FINANCIAL ADVICE
        </div>
      </div>
    </div>
  );
}
