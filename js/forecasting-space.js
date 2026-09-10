// ====================================================================
// forecasting-space.js — 2030+ Futuristic Vision Module
// ====================================================================
// Forward-looking supply chain intelligence with:
//   1. Predictive market trends (commodity prices, trade volumes, currency rates)
//   2. Emerging technology impact (AI, blockchain, IoT, autonomous vehicles, 3D printing)
//   3. 5-year supply chain evolution timeline (2026-2031)
//   4. Technology adoption curve chart
//   5. Market opportunity matrix
//   6. Futuristic scenario cards (autonomous shipping, drone delivery, AI procurement)
//
// Architecture: reuses IIFE + modal + table + chart patterns from dispatch-dashboard.js
// Data: synthetic projections persisted to localStorage
// ====================================================================
(function() {
  'use strict';

  if (window.__forecastingSpaceLoaded) return;
  window.__forecastingSpaceLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_forecast_space_db_v1';

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(a) {
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'k';
    return '$' + a.toFixed(0);
  }

  // ------------------------------------------------------------------
  // STATIC REFERENCE DATA
  // ------------------------------------------------------------------
  const TECH_INNOVATIONS = [
    { id: 'ai', name: 'AI Procurement Agents', category: 'AI/ML', icon: '🤖', current_adoption: 35, projected_2030: 88, impact: 'High', description: 'Autonomous AI agents that negotiate contracts, place orders, and optimize supplier selection in real-time.' },
    { id: 'blockchain', name: 'Blockchain Provenance', category: 'Blockchain', icon: '🔗', current_adoption: 18, projected_2030: 72, impact: 'High', description: 'End-to-end immutable supply chain tracking with smart contracts for automated compliance.' },
    { id: 'iot', name: 'Industrial IoT Sensors', category: 'IoT', icon: '📡', current_adoption: 52, projected_2030: 95, impact: 'High', description: 'Real-time telemetry on every shipment, container, and warehouse asset for predictive maintenance.' },
    { id: 'autonomous', name: 'Autonomous Vehicles', category: 'Transport', icon: '🚛', current_adoption: 12, projected_2030: 65, impact: 'High', description: 'Self-driving trucks and vessels reducing logistics costs by 40% with 24/7 operations.' },
    { id: '3dprint', name: '3D Printing at Scale', category: 'Manufacturing', icon: '🖨️', current_adoption: 22, projected_2030: 58, impact: 'Medium', description: 'On-demand manufacturing of parts and components at distribution centers, eliminating lead times.' },
    { id: 'drone', name: 'Drone Delivery', category: 'Transport', icon: '🚁', current_adoption: 8, projected_2030: 45, impact: 'Medium', description: 'Last-mile drone delivery networks for urban centers, reducing delivery times to under 30 minutes.' },
    { id: 'quantum', name: 'Quantum Optimization', category: 'Computing', icon: '⚛️', current_adoption: 3, projected_2030: 28, impact: 'High', description: 'Quantum computing for solving NP-hard logistics routing and inventory optimization problems.' },
    { id: 'digitaltwin', name: 'Digital Twin Networks', category: 'Simulation', icon: '🌐', current_adoption: 28, projected_2030: 82, impact: 'High', description: 'Full virtual replicas of supply chains enabling scenario simulation and predictive analytics.' },
    { id: 'ar', name: 'AR Warehouse Picking', category: 'AR/VR', icon: '👓', current_adoption: 15, projected_2030: 60, impact: 'Medium', description: 'Augmented reality glasses for warehouse workers showing optimal pick paths and item details.' },
    { id: 'biotech', name: 'Biotech Materials', category: 'Materials', icon: '🧬', current_adoption: 6, projected_2030: 35, impact: 'Medium', description: 'Bio-engineered sustainable materials replacing petroleum-based packaging and components.' }
  ];

  const MARKET_TRENDS = [
    { id: 'oil', name: 'Crude Oil', unit: '$/barrel', current: 78.50, projected_2030: 92.30, change: 17.6, trend: 'up', volatility: 'Medium' },
    { id: 'steel', name: 'Steel', unit: '$/ton', current: 720, projected_2030: 880, change: 22.2, trend: 'up', volatility: 'Medium' },
    { id: 'lithium', name: 'Lithium', unit: '$/kg', current: 85, projected_2030: 145, change: 70.6, trend: 'up', volatility: 'High' },
    { id: 'semicon', name: 'Semiconductors', unit: 'index', current: 100, projected_2030: 168, change: 68.0, trend: 'up', volatility: 'High' },
    { id: 'copper', name: 'Copper', unit: '$/ton', current: 8400, projected_2030: 11200, change: 33.3, trend: 'up', volatility: 'Medium' },
    { id: 'cotton', name: 'Cotton', unit: '$/lb', current: 0.85, projected_2030: 1.10, change: 29.4, trend: 'up', volatility: 'Low' },
    { id: 'shipping', name: 'Container Shipping', unit: '$/TEU', current: 2400, projected_2030: 1850, change: -22.9, trend: 'down', volatility: 'Medium' },
    { id: 'usd', name: 'USD Index', unit: 'DXY', current: 104.2, projected_2030: 95.8, change: -8.1, trend: 'down', volatility: 'Low' }
  ];

  const TIMELINE_EVENTS = [
    { year: 2026, title: 'AI Procurement Mainstream', description: 'AI agents handle 60% of routine procurement decisions autonomously.', icon: '🤖' },
    { year: 2027, title: 'Autonomous Truck Corridors', description: 'First cross-border autonomous truck corridors open between major ports.', icon: '🚛' },
    { year: 2028, title: 'Blockchain Compliance Standard', description: 'Blockchain becomes the default standard for cross-border compliance documentation.', icon: '🔗' },
    { year: 2029, title: 'Drone Delivery at Scale', description: 'Urban drone delivery networks handle 25% of last-mile logistics in major cities.', icon: '🚁' },
    { year: 2030, title: 'Quantum Logistics', description: 'Quantum computing solves real-time global routing optimization for major shippers.', icon: '⚛️' },
    { year: 2031, title: 'Bio-Material Supply Chains', description: '30% of packaging materials are bio-engineered and fully biodegradable.', icon: '🧬' }
  ];

  const SCENARIOS = [
    { id: 'auto-ship', title: 'Autonomous Shipping Fleets', icon: '🚢', timeframe: '2027-2030', impact: '$2.8T savings globally', probability: 78, description: 'Container vessels operate autonomously on major trade lanes with AI captains and predictive maintenance. Crews shrink to remote supervisors managing 10+ vessels each.' },
    { id: 'drone-last', title: 'Drone Last-Mile Networks', icon: '🚁', timeframe: '2028-2031', impact: '$58B market by 2031', probability: 85, description: 'Urban drone corridors handle 25% of last-mile deliveries. Sub-30-minute delivery becomes the new standard for e-commerce in 50+ cities worldwide.' },
    { id: 'ai-proc', title: 'AI Procurement Agents', icon: '🤖', timeframe: '2026-2029', impact: '$1.2T productivity gain', probability: 92, description: 'Autonomous AI agents negotiate contracts, manage supplier relationships, and execute purchases with minimal human oversight. Procurement teams shift to strategic oversight.' },
    { id: '3d-dist', title: 'Distributed 3D Printing', icon: '🖨️', timeframe: '2028-2031', impact: '40% lead-time reduction', probability: 65, description: 'On-demand 3D printing at distribution centers eliminates the need for spare parts inventory. Custom components are produced within hours of order placement.' },
    { id: 'blockchain', title: 'Blockchain Trade Finance', icon: '🔗', timeframe: '2027-2030', impact: '$1.5T trade finance market', probability: 72, description: 'Smart contracts automate letters of credit, customs clearance, and payment release. Trade finance transaction times drop from days to minutes.' },
    { id: 'circular', title: 'Circular Supply Chains', icon: '♻️', timeframe: '2026-2031', impact: '$4.5T circular economy', probability: 80, description: 'End-of-life products flow back through dedicated reverse logistics networks. 50% of materials in new products come from recycled supply chains.' }
  ];

  // ------------------------------------------------------------------
  // DATABASE INITIALIZATION
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.generated) return db;

    db = {
      technologies: TECH_INNOVATIONS,
      market_trends: MARKET_TRENDS,
      timeline: TIMELINE_EVENTS,
      scenarios: SCENARIOS,
      generated: true,
      meta: { created: new Date().toISOString(), version: 1, lastUpdate: new Date().toISOString() }
    };

    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }

  // ------------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------------
  let currentView = 'overview';

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-fs-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-fs-styles';
    style.textContent = `
      .cc-fs-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10012; background: rgba(8,10,16,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-fs-sidebar { width: 220px; flex-shrink: 0; background: rgba(15,23,42,0.6); border-right: 1px solid rgba(255,255,255,0.06); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-fs-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; }
      .cc-fs-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-fs-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-fs-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; text-decoration: none; font-family: inherit; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; }
      .cc-fs-nav-item:hover { background: rgba(255,255,255,0.03); color: #e2e8f0; }
      .cc-fs-nav-item.active { background: rgba(168,85,247,0.08); color: #a855f7; border-left-color: #a855f7; }
      .cc-fs-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-fs-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-fs-close { position: fixed; top: 16px; right: 20px; z-index: 10013; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-fs-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-fs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 12px; }
      .cc-fs-page-title { font-size: 22px; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-fs-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #ec4899); color: #fff; font-weight: 600; letter-spacing: 0.03em; -webkit-text-fill-color: #fff; }
      .cc-fs-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #a855f7; font-weight: 600; }
      .cc-fs-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #a855f7; animation: cc-fs-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-fs-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-fs-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-fs-card { background: linear-gradient(135deg, rgba(168,85,247,0.05), rgba(236,72,153,0.05)); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px; padding: 16px; }
      .cc-fs-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px; }
      .cc-fs-card-value { font-size: 24px; font-weight: 800; color: #fff; }
      .cc-fs-card-delta { font-size: 11px; margin-top: 4px; color: #94a3b8; }
      .cc-fs-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(168,85,247,0.15); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
      .cc-fs-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-fs-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-fs-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(168,85,247,0.15); }
      .cc-fs-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-fs-table tr:hover td { background: rgba(168,85,247,0.04); }
      .cc-fs-scroll { max-height: 520px; overflow-y: auto; border: 1px solid rgba(168,85,247,0.15); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(168,85,247,0.4) transparent; }
      .cc-fs-scroll::-webkit-scrollbar { width: 8px; }
      .cc-fs-scroll::-webkit-scrollbar-track { background: transparent; }
      .cc-fs-scroll::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 4px; }
      .cc-fs-bar-track { display: inline-block; width: 100px; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; vertical-align: middle; margin-right: 6px; }
      .cc-fs-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #a855f7, #ec4899); }
      .cc-fs-bars { display: flex; align-items: flex-end; gap: 8px; height: 200px; padding: 0 4px; }
      .cc-fs-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
      .cc-fs-bar { width: 100%; max-width: 50px; border-radius: 4px 4px 0 0; min-height: 4px; position: relative; cursor: pointer; transition: opacity 0.2s; background: linear-gradient(180deg, #a855f7, #ec4899); }
      .cc-fs-bar:hover { opacity: 0.85; }
      .cc-fs-bar-tooltip { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: #1e293b; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; margin-bottom: 4px; z-index: 5; }
      .cc-fs-bar:hover .cc-fs-bar-tooltip { opacity: 1; }
      .cc-fs-bar-label { font-size: 9px; color: #94a3b8; text-align: center; }
      .cc-fs-bar-value { font-size: 11px; font-weight: 700; color: #e2e8f0; }
      .cc-fs-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-fs-status-high { background: rgba(168,85,247,0.15); color: #a855f7; border: 1px solid rgba(168,85,247,0.3); }
      .cc-fs-status-med { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-fs-status-up { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-fs-status-down { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-fs-tech-card { background: linear-gradient(135deg, rgba(168,85,247,0.04), rgba(236,72,153,0.04)); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px; padding: 16px; transition: all 0.2s; }
      .cc-fs-tech-card:hover { border-color: rgba(168,85,247,0.5); transform: translateY(-2px); }
      .cc-fs-tech-icon { font-size: 28px; margin-bottom: 8px; }
      .cc-fs-tech-name { font-size: 14px; font-weight: 700; color: #fff; }
      .cc-fs-tech-cat { font-size: 10px; color: #a855f7; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
      .cc-fs-tech-desc { font-size: 11px; color: #94a3b8; margin-top: 8px; line-height: 1.5; }
      .cc-fs-timeline { position: relative; padding-left: 32px; }
      .cc-fs-timeline::before { content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, #a855f7, #ec4899); }
      .cc-fs-timeline-item { position: relative; padding: 16px 0 16px 24px; }
      .cc-fs-timeline-item::before { content: ''; position: absolute; left: -22px; top: 22px; width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #ec4899); box-shadow: 0 0 0 4px rgba(168,85,247,0.2); }
      .cc-fs-timeline-year { font-size: 16px; font-weight: 800; color: #a855f7; }
      .cc-fs-timeline-title { font-size: 14px; font-weight: 700; color: #fff; margin-top: 2px; }
      .cc-fs-timeline-desc { font-size: 12px; color: #94a3b8; margin-top: 4px; line-height: 1.5; }
      .cc-fs-scenario-card { background: linear-gradient(135deg, rgba(168,85,247,0.05), rgba(236,72,153,0.05)); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px; padding: 18px; margin-bottom: 12px; transition: all 0.2s; }
      .cc-fs-scenario-card:hover { border-color: rgba(168,85,247,0.5); }
      .cc-fs-scenario-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
      .cc-fs-scenario-icon { font-size: 28px; }
      .cc-fs-scenario-title { font-size: 15px; font-weight: 700; color: #fff; flex: 1; }
      .cc-fs-scenario-meta { font-size: 11px; color: #94a3b8; margin-top: 8px; }
      .cc-fs-scenario-desc { font-size: 12px; color: #cbd5e1; line-height: 1.5; }
      .cc-fs-probability { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #a855f7; font-weight: 600; }
      .cc-fs-probability-bar { width: 60px; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.1); overflow: hidden; }
      .cc-fs-probability-fill { height: 100%; background: linear-gradient(90deg, #a855f7, #ec4899); }
      @media (max-width: 767px) {
        .cc-fs-modal { flex-direction: column; }
        .cc-fs-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-fs-sidebar-brand { display: none; }
        .cc-fs-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-fs-nav-item.active { border-bottom-color: #a855f7; border-left-color: transparent; }
        .cc-fs-main { padding: 12px 12px 20px; }
        .cc-fs-cards { grid-template-columns: repeat(2, 1fr); }
      }
      /* Light mode overrides */
      html:not(.dark) .cc-fs-modal { background: rgba(248,250,252,0.99); color: #1e293b; }
      html:not(.dark) .cc-fs-sidebar { background: rgba(241,245,249,0.8); border-right-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-fs-sidebar-title { background: linear-gradient(135deg, #9333ea, #db2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-fs-nav-item { color: #64748b; }
      html:not(.dark) .cc-fs-nav-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
      html:not(.dark) .cc-fs-nav-item.active { background: rgba(168,85,247,0.08); color: #9333ea; }
      html:not(.dark) .cc-fs-page-title { background: linear-gradient(135deg, #9333ea, #db2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-fs-header { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-fs-card { background: rgba(168,85,247,0.04); border-color: rgba(168,85,247,0.2); }
      html:not(.dark) .cc-fs-card-label { color: #64748b; }
      html:not(.dark) .cc-fs-card-value { color: #0f172a; }
      html:not(.dark) .cc-fs-card-delta { color: #64748b; }
      html:not(.dark) .cc-fs-section { background: rgba(0,0,0,0.02); border-color: rgba(168,85,247,0.15); }
      html:not(.dark) .cc-fs-section-title { color: #1e293b; }
      html:not(.dark) .cc-fs-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-fs-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-fs-table tr:hover td { background: rgba(168,85,247,0.04); }
      html:not(.dark) .cc-fs-scroll { border-color: rgba(168,85,247,0.15); }
      html:not(.dark) .cc-fs-bar-label { color: #94a3b8; }
      html:not(.dark) .cc-fs-bar-value { color: #1e293b; }
      html:not(.dark) .cc-fs-tech-card { background: rgba(168,85,247,0.04); border-color: rgba(168,85,247,0.2); }
      html:not(.dark) .cc-fs-tech-name { color: #0f172a; }
      html:not(.dark) .cc-fs-tech-desc { color: #64748b; }
      html:not(.dark) .cc-fs-timeline-title { color: #0f172a; }
      html:not(.dark) .cc-fs-timeline-desc { color: #64748b; }
      html:not(.dark) .cc-fs-scenario-card { background: rgba(168,85,247,0.04); border-color: rgba(168,85,247,0.2); }
      html:not(.dark) .cc-fs-scenario-title { color: #0f172a; }
      html:not(.dark) .cc-fs-scenario-meta { color: #94a3b8; }
      html:not(.dark) .cc-fs-scenario-desc { color: #334155; }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    const db = initDatabase();
    const overlay = document.createElement('div');
    overlay.id = 'cc-fs-overlay';
    overlay.className = 'cc-fs-modal';
    overlay.innerHTML = `
      <button class="cc-fs-close" onclick="window.__ccFS.close()">×</button>
      <div class="cc-fs-sidebar">
        <div class="cc-fs-sidebar-brand">
          <div class="cc-fs-sidebar-title">🔮 2030+ Forecasting Space</div>
          <div class="cc-fs-sidebar-sub">Future supply chain vision</div>
        </div>
        <button class="cc-fs-nav-item ${currentView === 'overview' ? 'active' : ''}" onclick="window.__ccFS.setView('overview')"><span class="cc-fs-nav-icon">📊</span> Overview</button>
        <button class="cc-fs-nav-item ${currentView === 'trends' ? 'active' : ''}" onclick="window.__ccFS.setView('trends')"><span class="cc-fs-nav-icon">📈</span> Market Trends</button>
        <button class="cc-fs-nav-item ${currentView === 'tech' ? 'active' : ''}" onclick="window.__ccFS.setView('tech')"><span class="cc-fs-nav-icon">🚀</span> Technology Impact</button>
        <button class="cc-fs-nav-item ${currentView === 'timeline' ? 'active' : ''}" onclick="window.__ccFS.setView('timeline')"><span class="cc-fs-nav-icon">🗓️</span> Evolution Timeline</button>
        <button class="cc-fs-nav-item ${currentView === 'scenarios' ? 'active' : ''}" onclick="window.__ccFS.setView('scenarios')"><span class="cc-fs-nav-icon">🌌</span> Future Scenarios</button>
      </div>
      <div class="cc-fs-main" id="cc-fs-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-fs-content');
    if (!container) return;
    if (currentView === 'overview') renderOverview(container);
    else if (currentView === 'trends') renderTrends(container);
    else if (currentView === 'tech') renderTech(container);
    else if (currentView === 'timeline') renderTimeline(container);
    else if (currentView === 'scenarios') renderScenarios(container);

    document.querySelectorAll('.cc-fs-nav-item').forEach(item => {
      const onclick = item.getAttribute('onclick') || '';
      item.classList.toggle('active', onclick.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // 1. OVERVIEW
  // ------------------------------------------------------------------
  function renderOverview(container) {
    const db = initDatabase();
    const avgAdoption2030 = Math.round(db.technologies.reduce((s, t) => s + t.projected_2030, 0) / db.technologies.length);
    const highImpactCount = db.technologies.filter(t => t.impact === 'High').length;
    const upTrends = db.market_trends.filter(t => t.trend === 'up').length;
    const downTrends = db.market_trends.filter(t => t.trend === 'down').length;
    container.innerHTML = `
      <div class="cc-fs-header">
        <h2 class="cc-fs-page-title">🔮 2030+ Forecasting Overview <span class="cc-fs-page-badge">2026-2031</span></h2>
        <div class="cc-fs-live-indicator"><div class="cc-fs-live-dot"></div> Predictive intelligence</div>
      </div>
      <div class="cc-fs-cards">
        <div class="cc-fs-card"><div class="cc-fs-card-label">Technologies Tracked</div><div class="cc-fs-card-value">${db.technologies.length}</div><div class="cc-fs-card-delta">${highImpactCount} high-impact</div></div>
        <div class="cc-fs-card"><div class="cc-fs-card-label">Avg Adoption by 2030</div><div class="cc-fs-card-value" style="color:#a855f7">${avgAdoption2030}%</div><div class="cc-fs-card-delta">across all technologies</div></div>
        <div class="cc-fs-card"><div class="cc-fs-card-label">Market Trends Tracked</div><div class="cc-fs-card-value">${db.market_trends.length}</div><div class="cc-fs-card-delta">${upTrends} up · ${downTrends} down</div></div>
        <div class="cc-fs-card"><div class="cc-fs-card-label">Future Scenarios</div><div class="cc-fs-card-value" style="color:#ec4899">${db.scenarios.length}</div><div class="cc-fs-card-delta">modeled for 2030+</div></div>
      </div>
      <div class="cc-fs-section">
        <div class="cc-fs-section-title">📊 Technology Adoption Curve — Current vs 2030 Projection</div>
        <div class="cc-fs-bars">
          ${db.technologies.map(t => {
            const pct = t.projected_2030;
            return `
              <div class="cc-fs-bar-wrap">
                <div class="cc-fs-bar-value">${t.projected_2030}%</div>
                <div class="cc-fs-bar" style="height:${pct}%">
                  <div class="cc-fs-bar-tooltip">${t.name}: ${t.current_adoption}% now → ${t.projected_2030}% by 2030 (${t.impact} impact)</div>
                </div>
                <div class="cc-fs-bar-label" style="max-width:50px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.icon} ${t.name.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="cc-fs-section">
        <div class="cc-fs-section-title">🚀 Top High-Impact Technologies</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
          ${db.technologies.filter(t => t.impact === 'High').slice(0, 6).map(t => `
            <div class="cc-fs-tech-card">
              <div class="cc-fs-tech-icon">${t.icon}</div>
              <div class="cc-fs-tech-name">${t.name}</div>
              <div class="cc-fs-tech-cat">${t.category}</div>
              <div class="cc-fs-tech-desc">${t.description}</div>
              <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8">
                <span>Now: ${t.current_adoption}%</span>
                <span style="color:#a855f7;font-weight:700">2030: ${t.projected_2030}%</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 2. MARKET TRENDS
  // ------------------------------------------------------------------
  function renderTrends(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-fs-header">
        <h2 class="cc-fs-page-title">📈 Predictive Market Trends <span class="cc-fs-page-badge">2026-2031</span></h2>
      </div>
      <div class="cc-fs-section">
        <div class="cc-fs-section-title">💰 Commodity & Currency Projections</div>
        <div class="cc-fs-scroll">
          <table class="cc-fs-table">
            <thead><tr><th>Commodity/Currency</th><th>Unit</th><th>Current</th><th>2030 Projected</th><th>Change %</th><th>Trend</th><th>Volatility</th><th>Adoption Bar</th></tr></thead>
            <tbody>
              ${db.market_trends.map(t => {
                const trendClass = t.trend === 'up' ? 'cc-fs-status-up' : 'cc-fs-status-down';
                const changeColor = t.change > 0 ? '#22c55e' : '#ef4444';
                const barPct = Math.min(100, Math.abs(t.change));
                return `
                  <tr>
                    <td style="font-weight:600;color:#a855f7">${t.name}</td>
                    <td style="color:#64748b">${t.unit}</td>
                    <td style="font-weight:600">${t.current}</td>
                    <td style="font-weight:700">${t.projected_2030}</td>
                    <td style="color:${changeColor};font-weight:700">${t.change > 0 ? '+' : ''}${t.change}%</td>
                    <td><span class="cc-fs-status ${trendClass}">${t.trend}</span></td>
                    <td>${t.volatility}</td>
                    <td><span class="cc-fs-bar-track"><span class="cc-fs-bar-fill" style="width:${barPct}%"></span></span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="cc-fs-section">
        <div class="cc-fs-section-title">📊 Projected Price Changes by 2030</div>
        <div class="cc-fs-bars">
          ${db.market_trends.map(t => {
            const pct = Math.min(100, Math.abs(t.change));
            const color = t.change > 0 ? 'linear-gradient(180deg, #22c55e, #14b8a6)' : 'linear-gradient(180deg, #ef4444, #f59e0b)';
            return `
              <div class="cc-fs-bar-wrap">
                <div class="cc-fs-bar-value" style="color:${t.change > 0 ? '#22c55e' : '#ef4444'}">${t.change > 0 ? '+' : ''}${t.change}%</div>
                <div class="cc-fs-bar" style="height:${pct}%;background:${color}">
                  <div class="cc-fs-bar-tooltip">${t.name}: ${t.current} → ${t.projected_2030} (${t.change > 0 ? '+' : ''}${t.change}%)</div>
                </div>
                <div class="cc-fs-bar-label" style="max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.name}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 3. TECHNOLOGY IMPACT
  // ------------------------------------------------------------------
  function renderTech(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-fs-header">
        <h2 class="cc-fs-page-title">🚀 Emerging Technology Impact <span class="cc-fs-page-badge">${db.technologies.length} INNOVATIONS</span></h2>
      </div>
      <div class="cc-fs-section">
        <div class="cc-fs-section-title">🚀 Technology Adoption Matrix</div>
        <div class="cc-fs-scroll">
          <table class="cc-fs-table">
            <thead><tr><th>Technology</th><th>Category</th><th>Current Adoption</th><th>2030 Projection</th><th>Growth</th><th>Impact</th><th>Description</th></tr></thead>
            <tbody>
              ${db.technologies.map(t => {
                const growth = t.projected_2030 - t.current_adoption;
                const impactClass = t.impact === 'High' ? 'cc-fs-status-high' : 'cc-fs-status-med';
                return `
                  <tr>
                    <td style="font-weight:600;color:#a855f7">${t.icon} ${t.name}</td>
                    <td>${t.category}</td>
                    <td><span class="cc-fs-bar-track" style="width:60px"><span class="cc-fs-bar-fill" style="width:${t.current_adoption}%"></span></span>${t.current_adoption}%</td>
                    <td><span class="cc-fs-bar-track" style="width:80px"><span class="cc-fs-bar-fill" style="width:${t.projected_2030}%"></span></span><strong>${t.projected_2030}%</strong></td>
                    <td style="color:#22c55e;font-weight:600">+${growth}%</td>
                    <td><span class="cc-fs-status ${impactClass}">${t.impact}</span></td>
                    <td style="font-size:11px;color:#94a3b8;max-width:340px">${t.description}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="cc-fs-section">
        <div class="cc-fs-section-title">🌟 Technology Cards</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
          ${db.technologies.map(t => `
            <div class="cc-fs-tech-card">
              <div class="cc-fs-tech-icon">${t.icon}</div>
              <div class="cc-fs-tech-name">${t.name}</div>
              <div class="cc-fs-tech-cat">${t.category}</div>
              <div class="cc-fs-tech-desc">${t.description}</div>
              <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8">
                <span>Now: ${t.current_adoption}%</span>
                <span style="color:#a855f7;font-weight:700">2030: ${t.projected_2030}%</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4. TIMELINE
  // ------------------------------------------------------------------
  function renderTimeline(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-fs-header">
        <h2 class="cc-fs-page-title">🗓️ 5-Year Supply Chain Evolution <span class="cc-fs-page-badge">2026-2031</span></h2>
      </div>
      <div class="cc-fs-section">
        <div class="cc-fs-section-title">📅 Projected Milestones</div>
        <div class="cc-fs-timeline">
          ${db.timeline.map(e => `
            <div class="cc-fs-timeline-item">
              <div class="cc-fs-timeline-year">${e.icon} ${e.year}</div>
              <div class="cc-fs-timeline-title">${e.title}</div>
              <div class="cc-fs-timeline-desc">${e.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 5. SCENARIOS
  // ------------------------------------------------------------------
  function renderScenarios(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-fs-header">
        <h2 class="cc-fs-page-title">🌌 Futuristic Scenario Models <span class="cc-fs-page-badge">${db.scenarios.length} SCENARIOS</span></h2>
      </div>
      <div class="cc-fs-section">
        <div class="cc-fs-section-title">🔮 Modeled Future Scenarios</div>
        ${db.scenarios.map(s => `
          <div class="cc-fs-scenario-card">
            <div class="cc-fs-scenario-header">
              <div class="cc-fs-scenario-icon">${s.icon}</div>
              <div class="cc-fs-scenario-title">${s.title}</div>
              <div class="cc-fs-probability">
                <span>Probability:</span>
                <div class="cc-fs-probability-bar"><div class="cc-fs-probability-fill" style="width:${s.probability}%"></div></div>
                <strong>${s.probability}%</strong>
              </div>
            </div>
            <div class="cc-fs-scenario-desc">${s.description}</div>
            <div class="cc-fs-scenario-meta">⏱️ Timeframe: ${s.timeframe} · 💰 Impact: ${s.impact}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-fs-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-fs-overlay');
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
    window.__ccFS = { open, close, setView };

    function injectButton() {
      if (document.getElementById('cc-fs-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-fs-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 440px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #a855f7, #ec4899)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="M2 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="M12 18a6 6 0 0 0 0-12 6 6 0 0 0 0 12z"/><path d="M12 22v-4"/></svg> 2030+';
      btn.setAttribute('aria-label', 'Open 2030+ forecasting space');
      btn.title = 'Open 2030+ Forecasting Space (press F)';
      btn.onclick = open;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(168, 85, 247, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-fs-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-fs-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 5000); });
    } else {
      setTimeout(tryInject, 5000);
    }

    // Keyboard shortcut: press "F" to open forecasting space
    document.addEventListener('keydown', function(e) {
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-fs-overlay')) { open(); e.preventDefault(); }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
