// ====================================================================
// market-intelligence.js — Real-Time Market Intelligence Feed
// ====================================================================
// Bloomberg-terminal-style real-time market intelligence:
//   1. Market Feed: scrollable real-time news/events with impact scores
//   2. Commodities: 10+ commodities with prices, 24h change, 7-day trend
//   3. Currencies: 8 major pairs with rates and hedging recommendations
//   4. Trade Policy: tariffs, sanctions, FTAs with supply chain impact
//   5. Shipping Rates: SCFI, BDI, WCI indices with trends
//   6. Alerts: market events triggering supply chain actions
//
// Architecture: reuses IIFE + modal + sidebar patterns from api-marketplace.js
// CSS prefix: cc-mi-  ·  Floating button: rose/pink gradient, shortcut "M"
// ====================================================================
(function() {
  'use strict';

  if (window.__marketIntelLoaded) return;
  window.__marketIntelLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_market_intel_db_v1';

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(a) {
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'k';
    return '$' + a.toFixed(0);
  }

  // ------------------------------------------------------------------
  // MARKET FEED EVENTS (Bloomberg-terminal style)
  // ------------------------------------------------------------------
  const FEED_EVENTS = [
    { ts: '2026-02-08T09:14:32Z', category: 'Geopolitical', headline: 'Red Sea shipping lane risk elevated — Houthi activity resumes near Bab-el-Mandeb', impact: 9, source: 'Everstream', region: 'Middle East' },
    { ts: '2026-02-08T08:47:11Z', category: 'Commodity', headline: 'HRC steel prices spike +3.2% on US Section 232 review announcement', impact: 8, source: 'S&P Platts', region: 'Global' },
    { ts: '2026-02-08T08:22:54Z', category: 'Currency', headline: 'USD/CNY breaks 7.32 — PBOC intervenes with FX fix at strongest since Nov', impact: 7, source: 'Reuters', region: 'Asia' },
    { ts: '2026-02-08T07:58:21Z', category: 'Shipping', headline: 'SCFI jumps 4.8% — Asia-Europe spot rates surge on Red Sea diversions', impact: 9, source: 'Shanghai Shipping Exchange', region: 'Global' },
    { ts: '2026-02-08T07:31:09Z', category: 'Trade Policy', headline: 'EU CBAM Phase 2 enforcement begins — embedded emissions reporting mandatory', impact: 8, source: 'EU Commission', region: 'Europe' },
    { ts: '2026-02-08T06:48:43Z', category: 'Weather', headline: 'Typhoon forming near Philippines — vessel routing advisories issued for week 7', impact: 6, source: 'StormGeo', region: 'Asia-Pacific' },
    { ts: '2026-02-08T06:14:55Z', category: 'Commodity', headline: 'Lithium carbonate spot up 5.1% — CATL announces Q2 cell price increase', impact: 9, source: 'Benchmark Mineral Intelligence', region: 'Global' },
    { ts: '2026-02-08T05:42:18Z', category: 'Logistics', headline: 'LA/LB port queue hits 38 vessels — wait time extends to 14 days', impact: 9, source: 'MarineTraffic', region: 'North America' },
    { ts: '2026-02-08T04:31:07Z', category: 'Currency', headline: 'EUR/USD weakens below 1.07 — ECB dovish signals on rate cuts', impact: 5, source: 'Bloomberg', region: 'Europe' },
    { ts: '2026-02-08T03:58:32Z', category: 'Geopolitical', headline: 'US adds 14 Chinese entities to Entity List — semiconductor export controls tighten', impact: 8, source: 'BIS', region: 'North America' },
    { ts: '2026-02-08T03:14:21Z', category: 'Commodity', headline: 'Brent crude +2.4% on OPEC+ production cut extension through Q2', impact: 7, source: 'ICE Futures', region: 'Global' },
    { ts: '2026-02-08T02:47:09Z', category: 'Shipping', headline: 'BDI falls 3.1% — cape-size rates soften on weaker iron ore demand', impact: 5, source: 'Baltic Exchange', region: 'Global' },
    { ts: '2026-02-08T02:18:44Z', category: 'Trade Policy', headline: 'RCEP cumulative rules of origin updated — 92% tariff lines now cumulated', impact: 6, source: 'ASEAN Secretariat', region: 'Asia-Pacific' },
    { ts: '2026-02-08T01:31:55Z', category: 'Weather', headline: 'Winter storm warning — US Midwest intermodal delays expected 36-48h', impact: 6, source: 'NOAA', region: 'North America' },
    { ts: '2026-02-08T00:48:11Z', category: 'Logistics', headline: 'Shanghai Yangshan port Phase IV automation goes live — capacity +20%', impact: 4, source: 'SIPG', region: 'Asia' },
    { ts: '2026-02-07T23:22:38Z', category: 'Commodity', headline: 'Copper LME inventory drops to 3-year low — Chile Codelco output guidance cut', impact: 7, source: 'LME', region: 'Global' }
  ];

  // ------------------------------------------------------------------
  // COMMODITIES (10+)
  // ------------------------------------------------------------------
  const COMMODITIES = [
    { name: 'HRC Steel', unit: 'USD/MT', price: 845, change24: 3.2, trend7: [820, 825, 830, 838, 842, 845, 845], impact: 'High', impactNote: 'Direct material cost' },
    { name: 'Lithium Carbonate', unit: 'USD/t', price: 14850, change24: 5.1, trend7: [13900, 14100, 14300, 14450, 14600, 14750, 14850], impact: 'Critical', impactNote: 'EV battery cell cost' },
    { name: 'Brent Crude', unit: 'USD/bbl', price: 87.4, change24: 2.4, trend7: [84, 84.5, 85.2, 85.8, 86.4, 86.9, 87.4], impact: 'High', impactNote: 'Freight fuel surcharge' },
    { name: 'Copper (LME)', unit: 'USD/t', price: 9240, change24: 1.8, trend7: [9100, 9140, 9180, 9210, 9190, 9220, 9240], impact: 'Medium', impactNote: 'Electronics manufacturing' },
    { name: 'Aluminum LME', unit: 'USD/t', price: 2380, change24: -0.6, trend7: [2410, 2400, 2395, 2390, 2385, 2382, 2380], impact: 'Medium', impactNote: 'Packaging & structures' },
    { name: 'Natural Gas (Henry)', unit: 'USD/MMBtu', price: 3.42, change24: -1.2, trend7: [3.55, 3.50, 3.48, 3.45, 3.44, 3.43, 3.42], impact: 'Low', impactNote: 'Energy cost' },
    { name: 'Corn (CBOT)', unit: 'USD/bu', price: 4.78, change24: 0.4, trend7: [4.72, 4.74, 4.75, 4.76, 4.77, 4.78, 4.78], impact: 'Low', impactNote: 'Food & feed inputs' },
    { name: 'Soybeans', unit: 'USD/bu', price: 12.84, change24: 1.1, trend7: [12.55, 12.62, 12.70, 12.75, 12.78, 12.82, 12.84], impact: 'Low', impactNote: 'Biofuel & feed' },
    { name: 'Gold (COMEX)', unit: 'USD/oz', price: 2158, change24: 0.8, trend7: [2120, 2130, 2140, 2145, 2150, 2155, 2158], impact: 'Low', impactNote: 'Hedge indicator' },
    { name: 'Containerboard', unit: 'USD/MT', price: 620, change24: -0.3, trend7: [628, 626, 624, 622, 621, 620, 620], impact: 'Medium', impactNote: 'Packaging cost' },
    { name: 'DRAM 8GB', unit: 'USD/unit', price: 2.84, change24: 1.4, trend7: [2.75, 2.77, 2.79, 2.80, 2.81, 2.83, 2.84], impact: 'High', impactNote: 'Electronics BOM' },
    { name: 'Cobalt', unit: 'USD/lb', price: 14.20, change24: -2.1, trend7: [14.85, 14.65, 14.50, 14.40, 14.30, 14.25, 14.20], impact: 'Medium', impactNote: 'Battery chemistry' }
  ];

  // ------------------------------------------------------------------
  // CURRENCIES (8 majors)
  // ------------------------------------------------------------------
  const CURRENCIES = [
    { pair: 'USD/CNY', rate: 7.3247, change: 0.42, exposure: 4200000, hedge: 'Hedge 60% via 90-day forward', hedgeStatus: 'Under-hedged (40%)' },
    { pair: 'USD/EUR', rate: 0.9284, change: -0.18, exposure: 2800000, hedge: 'Maintain natural hedge (€-denominated revenue)', hedgeStatus: 'Adequate' },
    { pair: 'USD/JPY', rate: 152.34, change: 0.32, exposure: 1200000, hedge: 'Hedge 50% via 60-day forward', hedgeStatus: 'Under-hedged (30%)' },
    { pair: 'USD/KRW', rate: 1342.18, change: 0.21, exposure: 980000, hedge: 'Hedge 40% via rolling forwards', hedgeStatus: 'Adequate' },
    { pair: 'GBP/USD', rate: 1.2647, change: -0.12, exposure: 740000, hedge: 'No action — natural hedge', hedgeStatus: 'Adequate' },
    { pair: 'USD/INR', rate: 83.14, change: 0.08, exposure: 560000, hedge: 'Maintain 35% rolling hedge', hedgeStatus: 'Adequate' },
    { pair: 'USD/MXN', rate: 17.08, change: -0.42, exposure: 480000, hedge: 'Hedge 45% — USMCA risk elevation', hedgeStatus: 'Under-hedged (25%)' },
    { pair: 'AUD/USD', rate: 0.6534, change: 0.24, exposure: 320000, hedge: 'Maintain 30% hedge — commodity proxy', hedgeStatus: 'Adequate' }
  ];

  // ------------------------------------------------------------------
  // TRADE POLICY EVENTS
  // ------------------------------------------------------------------
  const TRADE_POLICY = [
    { title: 'EU CBAM Phase 2 Enforcement', effective: '2026-02-08', scope: 'EU imports of steel, aluminum, cement, fertilizers, hydrogen, electricity', impact: 'High', costImpact: '+2-4% landed cost on affected imports', action: 'Embed emissions reporting in PO template' },
    { title: 'US Entity List Expansion (14 Chinese entities)', effective: '2026-02-08', scope: 'Semiconductors, AI chips, quantum computing exports', impact: 'Critical', costImpact: 'Alt sourcing required for 3 SKUs ($420k impact)', action: 'Qualify TSMC Arizona fab as backup' },
    { title: 'OPEC+ Production Cut Extension', effective: '2026-02-01', scope: 'Crude oil supply — 2.2M bpd cuts extended through Q2', impact: 'High', costImpact: 'Freight fuel surcharge +$0.04/ton-km', action: 'Lock 90-day fuel surcharge cap with carriers' },
    { title: 'RCEP Cumulative RoO Update', effective: '2026-02-01', scope: '92% of tariff lines now eligible for cumulation across 15 RCEP members', impact: 'Medium', costImpact: 'Tariff savings potential $180k/year', action: 'Restructure ASEAN sourcing to maximize cumulation' },
    { title: 'US Section 232 Steel Review', effective: '2026-03-01', scope: 'Possible tariff increase from 25% to 30% on steel imports', impact: 'High', costImpact: '+$620k annual steel cost', action: 'Pre-buy 60-day inventory; qualify Canadian mill' },
    { title: 'India PLI Scheme 2.0 (Auto Components)', effective: '2026-04-01', scope: 'Production-linked incentives for EV component manufacturing in India', impact: 'Medium', costImpact: 'Potential 8-12% savings on India-sourced EV parts', action: 'Evaluate India Tier-2 supplier expansion' },
    { title: 'UK CPTPP Accession Finalized', effective: '2026-02-15', scope: 'UK joins CPTPP — 95% tariff lines at zero', impact: 'Low', costImpact: 'Tariff savings $48k/year on UK trade', action: 'Update preference rules in customs engine' }
  ];

  // ------------------------------------------------------------------
  // SHIPPING RATE INDICES
  // ------------------------------------------------------------------
  const SHIPPING_INDICES = [
    { name: 'SCFI (Shanghai Containerized Freight Index)', value: 2847.6, change: 4.8, trend: [2717, 2735, 2752, 2768, 2789, 2814, 2847], desc: 'Spot container freight — Asia export routes' },
    { name: 'BDI (Baltic Dry Index)', value: 1547, change: -3.1, trend: [1597, 1589, 1582, 1574, 1568, 1559, 1547], desc: 'Dry bulk shipping — iron ore, coal, grain' },
    { name: 'WCI (Drewry World Container Index)', value: 3842, change: 3.2, trend: [3723, 3752, 3781, 3798, 3812, 3827, 3842], desc: 'Composite container freight — 8 major routes' },
    { name: 'FBX (Freightos Baltic Index)', value: 3192, change: 2.7, trend: [3108, 3132, 3156, 3174, 3181, 3186, 3192], desc: 'Container spot rates — 12 trade lanes' },
    { name: 'CCFI (China Containerized Freight Index)', value: 1132.4, change: 1.4, trend: [1117, 1121, 1126, 1129, 1130, 1131, 1132], desc: 'China containerized export freight composite' }
  ];

  // ------------------------------------------------------------------
  // ALERTS — market events triggering supply chain actions
  // ------------------------------------------------------------------
  const ALERTS = [
    { ts: '2026-02-08T09:14:32Z', severity: 'critical', title: 'Red Sea risk elevated — activate Cape routing fallback', action: 'Reroute 25% of Asia-Europe volume via Cape of Good Hope', module: 'Logistics', status: 'active' },
    { ts: '2026-02-08T08:22:54Z', severity: 'high', title: 'USD/CNY breaches 7.32 — hedge coverage gap detected', action: 'Increase USD/CNY hedge from 40% to 60% via 90-day forward', module: 'Finance', status: 'active' },
    { ts: '2026-02-08T07:31:09Z', severity: 'high', title: 'EU CBAM Phase 2 begins — embedded emissions reporting mandatory', action: 'Update PO template to capture emissions data from suppliers', module: 'Compliance', status: 'active' },
    { ts: '2026-02-08T06:14:55Z', severity: 'critical', title: 'Lithium carbonate +5.1% — CATL Q2 cell price increase announced', action: 'Lock Q2 cell pricing now; evaluate LFP chemistry substitution', module: 'Procurement', status: 'active' },
    { ts: '2026-02-08T03:58:32Z', severity: 'high', title: '14 Chinese entities added to US Entity List', action: 'Verify Tier-2/3 supplier exposure; qualify alternatives', module: 'Compliance', status: 'active' },
    { ts: '2026-02-08T03:14:21Z', severity: 'medium', title: 'Brent crude +2.4% on OPEC+ cut extension', action: 'Negotiate fuel surcharge cap with top 3 carriers', module: 'Logistics', status: 'pending' },
    { ts: '2026-02-08T02:18:44Z', severity: 'medium', title: 'RCEP cumulative rules updated — tariff savings opportunity', action: 'Restructure ASEAN sourcing to maximize cumulation', module: 'Procurement', status: 'pending' },
    { ts: '2026-02-07T22:09:17Z', severity: 'medium', title: 'Steel HRC +3.2% on Section 232 review', action: 'Pre-buy 60-day steel inventory before March 1', module: 'Procurement', status: 'pending' }
  ];

  // ------------------------------------------------------------------
  // DATABASE INITIALIZATION
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.feed) return db;
    db = {
      feed: FEED_EVENTS,
      commodities: COMMODITIES,
      currencies: CURRENCIES,
      tradePolicy: TRADE_POLICY,
      shippingIndices: SHIPPING_INDICES,
      alerts: ALERTS,
      meta: { created: new Date().toISOString(), version: 1, lastUpdate: new Date().toISOString() }
    };
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }

  function saveDB(db) {
    db.meta.lastUpdate = new Date().toISOString();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  // ------------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------------
  let currentView = 'feed';
  let currentFeedFilter = 'all';

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-mi-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-mi-styles';
    style.textContent = `
      .cc-mi-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10022; background: rgba(8,10,16,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-mi-sidebar { width: 220px; flex-shrink: 0; background: rgba(15,23,42,0.6); border-right: 1px solid rgba(255,255,255,0.06); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-mi-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; }
      .cc-mi-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
      .cc-mi-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-mi-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; font-family: inherit; }
      .cc-mi-nav-item:hover { background: rgba(255,255,255,0.03); color: #e2e8f0; }
      .cc-mi-nav-item.active { background: rgba(225,29,72,0.08); color: #f43f5e; border-left-color: #f43f5e; }
      .cc-mi-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-mi-nav-badge { margin-left: auto; font-size: 9px; padding: 1px 6px; border-radius: 8px; background: rgba(225,29,72,0.2); color: #f43f5e; font-weight: 700; }
      .cc-mi-nav-badge.urgent { background: rgba(239,68,68,0.2); color: #ef4444; animation: cc-mi-blink 1.5s ease-in-out infinite; }
      @keyframes cc-mi-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      .cc-mi-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-mi-close { position: fixed; top: 16px; right: 20px; z-index: 10023; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-mi-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-mi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 12px; }
      .cc-mi-page-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-mi-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #e11d48, #ec4899); color: #fff; font-weight: 600; letter-spacing: 0.03em; }
      .cc-mi-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #f43f5e; font-weight: 600; }
      .cc-mi-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #f43f5e; animation: cc-mi-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-mi-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-mi-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-mi-card { background: rgba(225,29,72,0.04); border: 1px solid rgba(225,29,72,0.15); border-radius: 10px; padding: 16px; }
      .cc-mi-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
      .cc-mi-card-value { font-size: 22px; font-weight: 800; color: #fff; }
      .cc-mi-card-delta { font-size: 11px; margin-top: 4px; color: #64748b; }
      .cc-mi-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
      .cc-mi-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-mi-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-mi-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .cc-mi-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-mi-table tr:hover td { background: rgba(225,29,72,0.04); }
      .cc-mi-scroll { max-height: 580px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(225,29,72,0.4) transparent; }
      .cc-mi-scroll::-webkit-scrollbar { width: 8px; }
      .cc-mi-scroll::-webkit-scrollbar-thumb { background: rgba(225,29,72,0.3); border-radius: 4px; }
      .cc-mi-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
      .cc-mi-tab { padding: 8px 16px; font-size: 12px; font-weight: 600; background: none; border: none; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: inherit; }
      .cc-mi-tab.active { color: #f43f5e; border-bottom-color: #f43f5e; }
      .cc-mi-tab:hover { color: #e2e8f0; }
      .cc-mi-feed-item { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; gap: 12px; align-items: flex-start; }
      .cc-mi-feed-item:hover { background: rgba(225,29,72,0.04); }
      .cc-mi-feed-time { font-size: 10px; color: #64748b; font-family: 'Monaco', 'Menlo', monospace; min-width: 80px; padding-top: 2px; }
      .cc-mi-feed-cat { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 10px; min-width: 90px; text-align: center; }
      .cc-mi-cat-Geopolitical { background: rgba(239,68,68,0.15); color: #ef4444; }
      .cc-mi-cat-Commodity { background: rgba(245,158,11,0.15); color: #f59e0b; }
      .cc-mi-cat-Currency { background: rgba(6,182,212,0.15); color: #06B6D4; }
      .cc-mi-cat-Shipping { background: rgba(99,102,241,0.15); color: #818cf8; }
      .cc-mi-cat-Trade { background: rgba(168,85,247,0.15); color: #a855f7; }
      .cc-mi-cat-Weather { background: rgba(14,165,233,0.15); color: #0ea5e9; }
      .cc-mi-cat-Logistics { background: rgba(20,184,166,0.15); color: #14b8a6; }
      .cc-mi-feed-headline { font-size: 12px; color: #e2e8f0; line-height: 1.5; flex: 1; }
      .cc-mi-feed-impact { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; }
      .cc-mi-impact-high { background: rgba(239,68,68,0.2); color: #ef4444; }
      .cc-mi-impact-med { background: rgba(245,158,11,0.2); color: #f59e0b; }
      .cc-mi-impact-low { background: rgba(34,197,94,0.2); color: #22c55e; }
      .cc-mi-trend { display: inline-flex; align-items: flex-end; gap: 2px; height: 28px; }
      .cc-mi-trend-bar { width: 4px; background: #f43f5e; border-radius: 1px; opacity: 0.8; }
      .cc-mi-trend-bar.last { opacity: 1; }
      .cc-mi-delta-up { color: #ef4444; font-weight: 700; }
      .cc-mi-delta-down { color: #22c55e; font-weight: 700; }
      .cc-mi-impact-tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
      .cc-mi-impact-tag-Critical { background: rgba(239,68,68,0.2); color: #ef4444; }
      .cc-mi-impact-tag-High { background: rgba(245,158,11,0.2); color: #f59e0b; }
      .cc-mi-impact-tag-Medium { background: rgba(6,182,212,0.2); color: #06B6D4; }
      .cc-mi-impact-tag-Low { background: rgba(148,163,184,0.2); color: #94a3b8; }
      .cc-mi-alert { padding: 12px 14px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid; }
      .cc-mi-alert-critical { background: rgba(239,68,68,0.06); border-left-color: #ef4444; }
      .cc-mi-alert-high { background: rgba(245,158,11,0.06); border-left-color: #f59e0b; }
      .cc-mi-alert-medium { background: rgba(6,182,212,0.06); border-left-color: #06B6D4; }
      .cc-mi-alert-title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px; }
      .cc-mi-alert-action { font-size: 12px; color: #cbd5e1; line-height: 1.5; }
      .cc-mi-alert-meta { font-size: 10px; color: #64748b; margin-top: 6px; }
      .cc-mi-policy-card { padding: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 10px; }
      .cc-mi-policy-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px; }
      .cc-mi-policy-meta { font-size: 10px; color: #64748b; margin-bottom: 8px; }
      .cc-mi-policy-row { font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 4px 0; }
      .cc-mi-policy-row strong { color: #e2e8f0; }
      @media (max-width: 767px) {
        .cc-mi-modal { flex-direction: column; }
        .cc-mi-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-mi-sidebar-brand { display: none; }
        .cc-mi-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-mi-nav-item.active { border-bottom-color: #f43f5e; border-left-color: transparent; }
        .cc-mi-main { padding: 12px 12px 20px; }
        .cc-mi-cards { grid-template-columns: repeat(2, 1fr); }
        .cc-mi-feed-time { min-width: 60px; }
        .cc-mi-feed-cat { min-width: 70px; }
      }
      /* Light mode overrides */
      html:not(.dark) .cc-mi-modal { background: rgba(248,250,252,0.99); color: #1e293b; }
      html:not(.dark) .cc-mi-sidebar { background: rgba(241,245,249,0.8); border-right-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-mi-sidebar-title { color: #0f172a; }
      html:not(.dark) .cc-mi-nav-item { color: #64748b; }
      html:not(.dark) .cc-mi-nav-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
      html:not(.dark) .cc-mi-nav-item.active { background: rgba(225,29,72,0.08); color: #be123c; }
      html:not(.dark) .cc-mi-page-title { color: #0f172a; }
      html:not(.dark) .cc-mi-header { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-mi-card { background: rgba(225,29,72,0.04); border-color: rgba(225,29,72,0.15); }
      html:not(.dark) .cc-mi-card-label { color: #64748b; }
      html:not(.dark) .cc-mi-card-value { color: #0f172a; }
      html:not(.dark) .cc-mi-card-delta { color: #64748b; }
      html:not(.dark) .cc-mi-section { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-mi-section-title { color: #1e293b; }
      html:not(.dark) .cc-mi-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-mi-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-mi-table tr:hover td { background: rgba(225,29,72,0.04); }
      html:not(.dark) .cc-mi-scroll { border-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-mi-tabs { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-mi-tab { color: #64748b; }
      html:not(.dark) .cc-mi-tab:hover { color: #1e293b; }
      html:not(.dark) .cc-mi-tab.active { color: #be123c; }
      html:not(.dark) .cc-mi-feed-item:hover { background: rgba(225,29,72,0.04); }
      html:not(.dark) .cc-mi-feed-headline { color: #1e293b; }
      html:not(.dark) .cc-mi-alert-title { color: #0f172a; }
      html:not(.dark) .cc-mi-alert-action { color: #334155; }
      html:not(.dark) .cc-mi-policy-card { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-mi-policy-title { color: #0f172a; }
      html:not(.dark) .cc-mi-policy-row { color: #475569; }
      html:not(.dark) .cc-mi-policy-row strong { color: #1e293b; }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    const db = initDatabase();
    const alertCount = db.alerts.filter(function(a) { return a.status === 'active'; }).length;
    const overlay = document.createElement('div');
    overlay.id = 'cc-mi-overlay';
    overlay.className = 'cc-mi-modal';
    overlay.innerHTML = `
      <button class="cc-mi-close" onclick="window.__ccMI.close()">×</button>
      <div class="cc-mi-sidebar">
        <div class="cc-mi-sidebar-brand">
          <div class="cc-mi-sidebar-title">📈 Market Intelligence</div>
          <div class="cc-mi-sidebar-sub">Real-time global feed</div>
        </div>
        <button class="cc-mi-nav-item ${currentView === 'feed' ? 'active' : ''}" onclick="window.__ccMI.setView('feed')"><span class="cc-mi-nav-icon">📡</span> Market Feed</button>
        <button class="cc-mi-nav-item ${currentView === 'commodities' ? 'active' : ''}" onclick="window.__ccMI.setView('commodities')"><span class="cc-mi-nav-icon">🛢️</span> Commodities</button>
        <button class="cc-mi-nav-item ${currentView === 'currencies' ? 'active' : ''}" onclick="window.__ccMI.setView('currencies')"><span class="cc-mi-nav-icon">💱</span> Currencies</button>
        <button class="cc-mi-nav-item ${currentView === 'policy' ? 'active' : ''}" onclick="window.__ccMI.setView('policy')"><span class="cc-mi-nav-icon">📋</span> Trade Policy</button>
        <button class="cc-mi-nav-item ${currentView === 'shipping' ? 'active' : ''}" onclick="window.__ccMI.setView('shipping')"><span class="cc-mi-nav-icon">🚢</span> Shipping Rates</button>
        <button class="cc-mi-nav-item ${currentView === 'alerts' ? 'active' : ''}" onclick="window.__ccMI.setView('alerts')"><span class="cc-mi-nav-icon">🚨</span> Alerts ${alertCount > 0 ? '<span class="cc-mi-nav-badge urgent">' + alertCount + '</span>' : ''}</button>
      </div>
      <div class="cc-mi-main" id="cc-mi-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const c = document.getElementById('cc-mi-content');
    if (!c) return;
    if (currentView === 'feed') renderFeed(c);
    else if (currentView === 'commodities') renderCommodities(c);
    else if (currentView === 'currencies') renderCurrencies(c);
    else if (currentView === 'policy') renderPolicy(c);
    else if (currentView === 'shipping') renderShipping(c);
    else if (currentView === 'alerts') renderAlerts(c);
    document.querySelectorAll('.cc-mi-nav-item').forEach(function(item) {
      var onclick = item.getAttribute('onclick') || '';
      item.classList.toggle('active', onclick.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // TREND BAR CHART HELPER
  // ------------------------------------------------------------------
  function renderTrend(values, color) {
    var max = Math.max.apply(null, values);
    var min = Math.min.apply(null, values);
    var range = max - min || 1;
    return '<div class="cc-mi-trend">' + values.map(function(v, i) {
      var h = Math.max(4, Math.round((v - min) / range * 24));
      return '<div class="cc-mi-trend-bar' + (i === values.length - 1 ? ' last' : '') + '" style="height:' + h + 'px;background:' + color + '"></div>';
    }).join('') + '</div>';
  }

  // ------------------------------------------------------------------
  // FEED VIEW
  // ------------------------------------------------------------------
  function renderFeed(c) {
    const db = initDatabase();
    const cats = ['all', 'Geopolitical', 'Commodity', 'Currency', 'Shipping', 'Trade Policy', 'Weather', 'Logistics'];
    c.innerHTML = `
      <div class="cc-mi-header">
        <h2 class="cc-mi-page-title">📡 Market Feed <span class="cc-mi-page-badge">LIVE</span></h2>
        <div class="cc-mi-live-indicator"><div class="cc-mi-live-dot"></div> Streaming · ${db.feed.length} events today</div>
      </div>
      <div class="cc-mi-cards">
        <div class="cc-mi-card"><div class="cc-mi-card-label">Events Today</div><div class="cc-mi-card-value">${db.feed.length}</div><div class="cc-mi-card-delta">across 7 categories</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">High Impact</div><div class="cc-mi-card-value" style="color:#ef4444">${db.feed.filter(function(e) { return e.impact >= 8; }).length}</div><div class="cc-mi-card-delta">impact score ≥ 8</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">Active Alerts</div><div class="cc-mi-card-value" style="color:#f59e0b">${db.alerts.filter(function(a) { return a.status === 'active'; }).length}</div><div class="cc-mi-card-delta">awaiting action</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">Sources</div><div class="cc-mi-card-value">14</div><div class="cc-mi-card-delta">curated feeds</div></div>
      </div>
      <div class="cc-mi-tabs">
        ${cats.map(function(cat) {
          var count = cat === 'all' ? db.feed.length : db.feed.filter(function(e) { return e.category === cat; }).length;
          return '<button class="cc-mi-tab ' + (currentFeedFilter === cat ? 'active' : '') + '" onclick="window.__ccMI.setFeedFilter(\'' + cat + '\')">' + (cat === 'all' ? 'All' : cat) + ' (' + count + ')</button>';
        }).join('')}
      </div>
      <div class="cc-mi-section">
        <div class="cc-mi-section-title">📡 Real-Time Feed</div>
        <div class="cc-mi-scroll" style="max-height:600px">
          ${filterFeed(db.feed).map(function(e) {
            var cls = e.category.split(' ')[0];
            var impactCls = e.impact >= 8 ? 'cc-mi-impact-high' : e.impact >= 6 ? 'cc-mi-impact-med' : 'cc-mi-impact-low';
            return '<div class="cc-mi-feed-item"><div class="cc-mi-feed-time">' + e.ts.substr(11, 5) + '</div><div class="cc-mi-feed-cat cc-mi-cat-' + cls + '">' + e.category + '</div><div class="cc-mi-feed-headline">' + e.headline + '<div style="font-size:10px;color:#64748b;margin-top:4px">' + e.source + ' · ' + e.region + '</div></div><div class="cc-mi-feed-impact ' + impactCls + '">' + e.impact + '/10</div></div>';
          }).join('')}
        </div>
      </div>
    `;
  }

  function filterFeed(list) {
    if (currentFeedFilter === 'all') return list;
    return list.filter(function(e) { return e.category === currentFeedFilter; });
  }

  function setFeedFilter(f) {
    currentFeedFilter = f;
    renderContent();
  }

  // ------------------------------------------------------------------
  // COMMODITIES VIEW
  // ------------------------------------------------------------------
  function renderCommodities(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-mi-header">
        <h2 class="cc-mi-page-title">🛢️ Commodities <span class="cc-mi-page-badge">${db.commodities.length} TRACKED</span></h2>
        <div class="cc-mi-live-indicator"><div class="cc-mi-live-dot"></div> Live spot prices</div>
      </div>
      <div class="cc-mi-section">
        <div class="cc-mi-section-title">🛢️ Spot Prices & 7-Day Trends</div>
        <div class="cc-mi-scroll">
          <table class="cc-mi-table">
            <thead><tr><th>Commodity</th><th>Unit</th><th>Price</th><th>24h Δ</th><th>7-Day Trend</th><th>SC Impact</th><th>Impact Note</th></tr></thead>
            <tbody>
              ${db.commodities.map(function(com) {
                var deltaCls = com.change24 >= 0 ? 'cc-mi-delta-up' : 'cc-mi-delta-down';
                var arrow = com.change24 >= 0 ? '▲' : '▼';
                var trendColor = com.change24 >= 0 ? '#ef4444' : '#22c55e';
                return '<tr><td style="font-weight:700;color:#fff">' + com.name + '</td><td style="font-size:10px;color:#64748b">' + com.unit + '</td><td style="font-weight:700">' + com.price.toLocaleString() + '</td><td class="' + deltaCls + '">' + arrow + ' ' + Math.abs(com.change24) + '%</td><td>' + renderTrend(com.trend7, trendColor) + '</td><td><span class="cc-mi-impact-tag cc-mi-impact-tag-' + com.impact + '">' + com.impact + '</span></td><td style="font-size:11px;color:#94a3b8">' + com.impactNote + '</td></tr>';
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // CURRENCIES VIEW
  // ------------------------------------------------------------------
  function renderCurrencies(c) {
    const db = initDatabase();
    const totalExposure = db.currencies.reduce(function(s, x) { return s + x.exposure; }, 0);
    c.innerHTML = `
      <div class="cc-mi-header">
        <h2 class="cc-mi-page-title">💱 Currencies <span class="cc-mi-page-badge">${db.currencies.length} PAIRS</span></h2>
      </div>
      <div class="cc-mi-cards">
        <div class="cc-mi-card"><div class="cc-mi-card-label">Pairs Tracked</div><div class="cc-mi-card-value">${db.currencies.length}</div><div class="cc-mi-card-delta">majors + EM</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">Total Exposure</div><div class="cc-mi-card-value">${formatCurrency(totalExposure)}</div><div class="cc-mi-card-delta">across all pairs</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">Under-Hedged</div><div class="cc-mi-card-value" style="color:#f59e0b">${db.currencies.filter(function(x) { return x.hedgeStatus.indexOf('Under') !== -1; }).length}</div><div class="cc-mi-card-delta">action recommended</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">Adequately Hedged</div><div class="cc-mi-card-value" style="color:#22c55e">${db.currencies.filter(function(x) { return x.hedgeStatus === 'Adequate'; }).length}</div><div class="cc-mi-card-delta">no action needed</div></div>
      </div>
      <div class="cc-mi-section">
        <div class="cc-mi-section-title">💱 Exchange Rates & Hedging Recommendations</div>
        <div class="cc-mi-scroll">
          <table class="cc-mi-table">
            <thead><tr><th>Pair</th><th>Rate</th><th>24h Δ</th><th>Exposure</th><th>Hedge Recommendation</th><th>Hedge Status</th></tr></thead>
            <tbody>
              ${db.currencies.map(function(cur) {
                var deltaCls = cur.change >= 0 ? 'cc-mi-delta-up' : 'cc-mi-delta-down';
                var arrow = cur.change >= 0 ? '▲' : '▼';
                var statusColor = cur.hedgeStatus === 'Adequate' ? '#22c55e' : '#f59e0b';
                return '<tr><td style="font-weight:700;color:#fff">' + cur.pair + '</td><td style="font-weight:700">' + cur.rate + '</td><td class="' + deltaCls + '">' + arrow + ' ' + Math.abs(cur.change) + '%</td><td>' + formatCurrency(cur.exposure) + '</td><td style="font-size:11px;color:#94a3b8">' + cur.hedge + '</td><td><span style="color:' + statusColor + ';font-weight:600;font-size:11px">' + cur.hedgeStatus + '</span></td></tr>';
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // TRADE POLICY VIEW
  // ------------------------------------------------------------------
  function renderPolicy(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-mi-header">
        <h2 class="cc-mi-page-title">📋 Trade Policy <span class="cc-mi-page-badge">${db.tradePolicy.length} ACTIVE</span></h2>
      </div>
      <div class="cc-mi-cards">
        <div class="cc-mi-card"><div class="cc-mi-card-label">Active Policies</div><div class="cc-mi-card-value">${db.tradePolicy.length}</div><div class="cc-mi-card-delta">being monitored</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">Critical Impact</div><div class="cc-mi-card-value" style="color:#ef4444">${db.tradePolicy.filter(function(p) { return p.impact === 'Critical'; }).length}</div><div class="cc-mi-card-delta">immediate action</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">High Impact</div><div class="cc-mi-card-value" style="color:#f59e0b">${db.tradePolicy.filter(function(p) { return p.impact === 'High'; }).length}</div><div class="cc-mi-card-delta">monitor closely</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">Tariff Exposure</div><div class="cc-mi-card-value">+$848k</div><div class="cc-mi-card-delta">annual cost impact</div></div>
      </div>
      <div class="cc-mi-section">
        <div class="cc-mi-section-title">📋 Recent Policy Changes</div>
        ${db.tradePolicy.map(function(p) {
          return '<div class="cc-mi-policy-card"><div class="cc-mi-policy-title">' + p.title + '</div><div class="cc-mi-policy-meta">Effective: ' + p.effective + ' · <span class="cc-mi-impact-tag cc-mi-impact-tag-' + p.impact + '">' + p.impact + ' Impact</span></div><div class="cc-mi-policy-row"><strong>Scope:</strong> ' + p.scope + '</div><div class="cc-mi-policy-row"><strong>Cost Impact:</strong> ' + p.costImpact + '</div><div class="cc-mi-policy-row"><strong>Action:</strong> ' + p.action + '</div></div>';
        }).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // SHIPPING RATES VIEW
  // ------------------------------------------------------------------
  function renderShipping(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-mi-header">
        <h2 class="cc-mi-page-title">🚢 Shipping Rate Indices <span class="cc-mi-page-badge">${db.shippingIndices.length} INDICES</span></h2>
        <div class="cc-mi-live-indicator"><div class="cc-mi-live-dot"></div> Real-time freight rates</div>
      </div>
      <div class="cc-mi-section">
        <div class="cc-mi-section-title">🚢 Freight Rate Indices</div>
        ${db.shippingIndices.map(function(idx) {
          var deltaCls = idx.change >= 0 ? 'cc-mi-delta-up' : 'cc-mi-delta-down';
          var arrow = idx.change >= 0 ? '▲' : '▼';
          var trendColor = idx.change >= 0 ? '#ef4444' : '#22c55e';
          return '<div class="cc-mi-policy-card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div style="flex:1;min-width:240px"><div class="cc-mi-policy-title">' + idx.name + '</div><div class="cc-mi-policy-meta">' + idx.desc + '</div></div><div style="text-align:right"><div style="font-size:24px;font-weight:800;color:#fff">' + idx.value.toLocaleString() + '</div><div class="' + deltaCls + '" style="font-size:12px">' + arrow + ' ' + Math.abs(idx.change) + '% (24h)</div></div></div><div style="margin-top:10px"><div style="font-size:10px;color:#64748b;margin-bottom:4px">7-DAY TREND</div>' + renderTrend(idx.trend, trendColor) + '</div></div>';
        }).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // ALERTS VIEW
  // ------------------------------------------------------------------
  function renderAlerts(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-mi-header">
        <h2 class="cc-mi-page-title">🚨 Market Alerts <span class="cc-mi-page-badge">${db.alerts.filter(function(a) { return a.status === 'active'; }).length} ACTIVE</span></h2>
      </div>
      <div class="cc-mi-cards">
        <div class="cc-mi-card"><div class="cc-mi-card-label">Active Alerts</div><div class="cc-mi-card-value" style="color:#ef4444">${db.alerts.filter(function(a) { return a.status === 'active'; }).length}</div><div class="cc-mi-card-delta">action required</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">Critical</div><div class="cc-mi-card-value" style="color:#ef4444">${db.alerts.filter(function(a) { return a.severity === 'critical'; }).length}</div><div class="cc-mi-card-delta">immediate response</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">High</div><div class="cc-mi-card-value" style="color:#f59e0b">${db.alerts.filter(function(a) { return a.severity === 'high'; }).length}</div><div class="cc-mi-card-delta">priority response</div></div>
        <div class="cc-mi-card"><div class="cc-mi-card-label">Pending</div><div class="cc-mi-card-value">${db.alerts.filter(function(a) { return a.status === 'pending'; }).length}</div><div class="cc-mi-card-delta">awaiting triage</div></div>
      </div>
      <div class="cc-mi-section">
        <div class="cc-mi-section-title">🚨 Market-Triggered Supply Chain Actions</div>
        ${db.alerts.map(function(a) {
          return '<div class="cc-mi-alert cc-mi-alert-' + a.severity + '"><div class="cc-mi-alert-title">' + a.title + '</div><div class="cc-mi-alert-action"><strong>Recommended Action:</strong> ' + a.action + '</div><div class="cc-mi-alert-meta">' + formatDate(a.ts) + ' · Module: ' + a.module + ' · Severity: ' + a.severity.toUpperCase() + ' · Status: ' + a.status.toUpperCase() + '</div></div>';
        }).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-mi-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-mi-overlay');
    if (overlay) overlay.remove();
  }

  function setView(view) {
    currentView = view;
    renderContent();
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    window.__ccMI = { open: open, close: close, setView: setView, setFeedFilter: setFeedFilter };

    function injectButton() {
      if (document.getElementById('cc-mi-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-mi-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 740px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #e11d48, #ec4899)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(225, 29, 72, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Market Intel';
      btn.setAttribute('aria-label', 'Open market intelligence');
      btn.title = 'Open Market Intelligence (press M)';
      btn.onclick = open;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(225, 29, 72, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(225, 29, 72, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-mi-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-mi-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 7500); });
    } else {
      setTimeout(tryInject, 7500);
    }

    document.addEventListener('keydown', function(e) {
      if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-mi-overlay')) { open(); e.preventDefault(); }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
