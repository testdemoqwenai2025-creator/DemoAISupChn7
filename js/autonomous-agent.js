// ====================================================================
// autonomous-agent.js — Autonomous Supply Chain Agent
// ====================================================================
// Autonomous AI agent that makes and executes supply chain decisions:
//   1. Decision Log: full history of AI-made decisions with reasoning/confidence
//   2. Approval Queue: pending AI decisions awaiting human sign-off
//   3. Autonomy Settings: Level 1-5 slider with per-module toggles
//   4. Performance Scorecard: decisions, success rate, value, confidence
//   5. Agent Timeline: chronological view of all agent actions
//   6. 20+ synthetic decisions with realistic reasoning
//
// Architecture: reuses IIFE + modal + sidebar patterns from api-marketplace.js
// CSS prefix: cc-aa-  ·  Floating button: amber/orange gradient, shortcut "X"
// ====================================================================
(function() {
  'use strict';

  if (window.__autoAgentLoaded) return;
  window.__autoAgentLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_auto_agent_db_v1';

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(a) {
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'k';
    return '$' + a.toFixed(0);
  }

  // ------------------------------------------------------------------
  // DECISION LOG — 22 synthetic AI decisions
  // ------------------------------------------------------------------
  const DECISIONS = [
    { id: 'DEC-2026-001', ts: '2026-02-08T08:14:32Z', module: 'Logistics', decision: 'Reroute MV CMA Phoenix from Suez to Cape of Good Hope', reasoning: 'Red Sea disruption likelihood at 65%. Cape adds 7 days but de-risks $6.2M cargo. Insurance carrier declined Suez transit.', confidence: 92, outcome: 'success', value: 480000, status: 'executed', autonomy: 'L4' },
    { id: 'DEC-2026-002', ts: '2026-02-08T07:42:11Z', module: 'Procurement', decision: 'Trigger emergency PO for SKU-B230 (CATL) — 45,000 units', reasoning: 'Stock cover dropped to 0.4 days. Demand forecast +15.6% WoW. Production line stoppage risk in 48h. Cost of inaction: $2.1M.', confidence: 96, outcome: 'success', value: 380000, status: 'executed', autonomy: 'L3' },
    { id: 'DEC-2026-003', ts: '2026-02-08T06:18:54Z', module: 'Inventory', decision: 'Liquidate $1.2M excess SKU-E712 inventory via secondary market', reasoning: '180+ days cover. Slow-mover pattern. Carrying cost $4.2k/month. Secondary market recovers 68% of value.', confidence: 84, outcome: 'pending', value: 816000, status: 'executing', autonomy: 'L3' },
    { id: 'DEC-2026-004', ts: '2026-02-08T05:33:20Z', module: 'Logistics', decision: 'Expedite 8 critical SKUs via air freight from Shenzhen to Chicago', reasoning: 'Production line stoppage imminent at Chicago plant. Air freight cost $215k vs line stoppage cost $1.8M. ROI: 8.4x.', confidence: 91, outcome: 'success', value: 1585000, status: 'executed', autonomy: 'L4' },
    { id: 'DEC-2026-005', ts: '2026-02-07T22:09:17Z', module: 'Finance', decision: 'Execute USD/CNY hedge — 60% of Q1 exposure via 90-day forward', reasoning: 'USD/CNY volatility at 4.2%. Hedge premium $45k protects $980k exposure. Treasury policy threshold breached.', confidence: 88, outcome: 'success', value: 320000, status: 'executed', autonomy: 'L2' },
    { id: 'DEC-2026-006', ts: '2026-02-07T18:47:02Z', module: 'Procurement', decision: 'Issue Supplier Improvement Notice (SIN) to CATL', reasoning: 'OTD 76% vs 90% SLA over 60-day window. Quality 96.2%. Formal escalation tier 2 triggered per supplier governance policy.', confidence: 94, outcome: 'success', value: 0, status: 'executed', autonomy: 'L2' },
    { id: 'DEC-2026-007', ts: '2026-02-07T15:22:38Z', module: 'Logistics', decision: 'Reroute 35% LA-bound cargo to Oakland for 14 days', reasoning: 'LA/LB congestion at 14d wait, 38 vessels queued. Oakland at 3d wait. Diversion cost $24k, demurrage savings $119k.', confidence: 89, outcome: 'success', value: 95000, status: 'executed', autonomy: 'L4' },
    { id: 'DEC-2026-008', ts: '2026-02-07T11:05:44Z', module: 'Inventory', decision: 'Reduce SKU-C447 next PO by 8% (4,800 → 4,416 units)', reasoning: '7-day forecast revised down 5.4%. Avoid building excess inventory. Saves $48k working capital.', confidence: 79, outcome: 'success', value: 48000, status: 'executed', autonomy: 'L3' },
    { id: 'DEC-2026-009', ts: '2026-02-07T09:31:09Z', module: 'Compliance', decision: 'Block shipment to Entity X (sanctions screening match)', reasoning: 'OFAC SDN list fuzzy match (87%). 14-day hold triggered. Manual compliance review required before release.', confidence: 99, outcome: 'pending', value: 0, status: 'executing', autonomy: 'L5' },
    { id: 'DEC-2026-010', ts: '2026-02-06T20:14:55Z', module: 'Logistics', decision: 'Renegotiate Maersk contract — 4% rate reduction for 12-month commitment', reasoning: 'Volume threshold breached (5,000 TEU/year). Market rate analysis supports 4-6% reduction. Annual savings: $182k.', confidence: 86, outcome: 'success', value: 182000, status: 'executed', autonomy: 'L2' },
    { id: 'DEC-2026-011', ts: '2026-02-06T16:48:12Z', module: 'Procurement', decision: 'Lock 90-day steel contract with POSCO at current spot', reasoning: 'HRC +14% YTD. Forward curve indicates +8% next quarter. 90-day lock hedges $720k exposure. Cost of inaction: $58k.', confidence: 82, outcome: 'success', value: 58000, status: 'executed', autonomy: 'L3' },
    { id: 'DEC-2026-012', ts: '2026-02-06T14:22:37Z', module: 'Inventory', decision: 'Move 1,200 units SKU-A100 from Rotterdam DC to Hamburg DC', reasoning: 'Hamburg demand +18% WoW. Rotterdam stock 4 days cover, Hamburg 1.2 days. Rebalance reduces stockout risk.', confidence: 87, outcome: 'success', value: 42000, status: 'executed', autonomy: 'L4' },
    { id: 'DEC-2026-013', ts: '2026-02-06T10:09:21Z', module: 'Finance', decision: 'Approve carrier MSC invoice variance dispute ($42k)', reasoning: 'Auto-reconciliation flagged demurrage accessorials not in contract. Manual review confirms billing error. Dispute filed.', confidence: 93, outcome: 'success', value: 42000, status: 'executed', autonomy: 'L2' },
    { id: 'DEC-2026-014', ts: '2026-02-06T08:54:08Z', module: 'Logistics', decision: 'Switch SKU-D560 from ocean to rail (China → Europe)', reasoning: 'Rail transit 18 days vs ocean 35 days. Cost +$8k but cycle time reduction unlocks $84k working capital. Net positive.', confidence: 81, outcome: 'pending', value: 76000, status: 'executing', autonomy: 'L3' },
    { id: 'DEC-2026-015', ts: '2026-02-05T22:18:43Z', module: 'Procurement', decision: 'Qualify LG Energy as Tier-2 backup for CATL', reasoning: 'Single-source dependency EMV $4.2M. LG Energy capacity available. Qualification cost $48k. ROI: 87x risk-adjusted.', confidence: 95, outcome: 'pending', value: 4200000, status: 'executing', autonomy: 'L2' },
    { id: 'DEC-2026-016', ts: '2026-02-05T17:33:55Z', module: 'Inventory', decision: 'Auto-reorder SKU-A100 (1,800 → 4,200 units)', reasoning: 'Stock at 4 days cover. Reorder point triggered. Lead time 21 days. Safety stock target 14 days. PO value: $156k.', confidence: 90, outcome: 'success', value: 0, status: 'executed', autonomy: 'L5' },
    { id: 'DEC-2026-017', ts: '2026-02-05T13:47:12Z', module: 'Compliance', decision: 'Auto-file EU ICS2 pre-arrival for shipment SHA-HAM-4521', reasoning: 'EU mandate effective Jan 2026. Manual filing window 24h. Auto-filing reduces $4k/late-filing penalty risk. 99.7% accuracy.', confidence: 98, outcome: 'success', value: 4000, status: 'executed', autonomy: 'L5' },
    { id: 'DEC-2026-018', ts: '2026-02-05T09:21:38Z', module: 'Logistics', decision: 'Pre-clear customs at origin for 12 urgent LA-bound shipments', reasoning: 'LA congestion 14d. Pre-clearance shaves 3-5 days off dwell time. Cost: $1.2k/shipment. Avoided demurrage: $14k/shipment.', confidence: 85, outcome: 'success', value: 153000, status: 'executed', autonomy: 'L4' },
    { id: 'DEC-2026-019', ts: '2026-02-04T19:14:07Z', module: 'Finance', decision: 'Reject spot freight quote from carrier HMM (12% above market)', reasoning: 'Market benchmark analysis: Transpacific spot at $3,850/FEU. HMM quote $4,312. Rejection. Routed to MSC at $3,920.', confidence: 92, outcome: 'success', value: 46000, status: 'executed', autonomy: 'L3' },
    { id: 'DEC-2026-020', ts: '2026-02-04T15:08:24Z', module: 'Procurement', decision: 'Consolidate 6 SKUs from 3 suppliers to single PO (POSCO)', reasoning: 'Order consolidation saves $18k in shipping/processing. POSCO qualifies for all 6 SKUs. Volume rebate unlocked.', confidence: 83, outcome: 'success', value: 28000, status: 'executed', autonomy: 'L3' },
    { id: 'DEC-2026-021', ts: '2026-02-04T11:42:51Z', module: 'Inventory', decision: 'Flag SKU-D560 as critical stockout risk (0.3 days cover)', reasoning: 'Stock 85 units, monthly burn 18,500. POSCO delivery delayed 4 days. Auto-escalated to procurement lead + expedite team.', confidence: 96, outcome: 'pending', value: 0, status: 'executing', autonomy: 'L4' },
    { id: 'DEC-2026-022', ts: '2026-02-04T08:17:39Z', module: 'Logistics', decision: 'Approve premium freight for POSCO shipment (truck vs rail)', reasoning: 'Quality NCR on previous lot. Premium truck transit 4 days vs rail 12 days. Risk-adjusted value: $88k production protection.', confidence: 88, outcome: 'success', value: 88000, status: 'executed', autonomy: 'L3' }
  ];

  // ------------------------------------------------------------------
  // PENDING APPROVAL QUEUE
  // ------------------------------------------------------------------
  const APPROVAL_QUEUE = [
    { id: 'AP-2026-101', ts: '2026-02-08T09:14:00Z', module: 'Procurement', decision: 'Approve $1.2M TIER-2 SUPPLIER QUALIFICATION PROGRAM (LG Energy)', reasoning: 'Strategic decision to qualify LG Energy as backup for CATL. Single-source EMV $4.2M. Qualification cost $1.2M, 24-month ROI 2.6x. Requires executive sign-off (>$1M threshold).', confidence: 95, value: 3000000, urgency: 'high', requester: 'AI Agent', autonomy_needed: 'L2' },
    { id: 'AP-2026-102', ts: '2026-02-08T08:55:21Z', module: 'Logistics', decision: 'Carrier diversification investment — add ONE + HMM as primary ($1.2M)', reasoning: 'Asia-Europe concentration risk. Adding ONE/HMM expected +2pp OTD. 24-month payback. Requires board approval.', confidence: 88, value: 2400000, urgency: 'medium', requester: 'AI Agent', autonomy_needed: 'L1' },
    { id: 'AP-2026-103', ts: '2026-02-08T08:31:09Z', module: 'Finance', decision: 'Increase air freight spend cap from $800k to $1.2M for Q2', reasoning: 'Q1 air freight +55% vs budget. Production line stoppage avoidance value $2.1M. CFO sign-off required for cap increase.', confidence: 86, value: 400000, urgency: 'high', requester: 'AI Agent', autonomy_needed: 'L2' },
    { id: 'AP-2026-104', ts: '2026-02-08T07:18:42Z', module: 'Procurement', decision: 'Issue $380k emergency PO to CATL for SKU-B230 (45,000 units)', reasoning: 'Stockout imminent (0.4 day cover). Production line at risk in 48h. Emergency PO threshold breached ($250k).', confidence: 96, value: 380000, urgency: 'critical', requester: 'AI Agent', autonomy_needed: 'L3' },
    { id: 'AP-2026-105', ts: '2026-02-08T06:42:55Z', module: 'Inventory', decision: 'Liquidate $1.2M excess SKU-E712 inventory (secondary market)', reasoning: '180+ days cover. Carrying cost $4.2k/month. Secondary market recovers 68% = $816k. Requires finance approval for loss recognition.', confidence: 84, value: -384000, urgency: 'low', requester: 'AI Agent', autonomy_needed: 'L2' },
    { id: 'AP-2026-106', ts: '2026-02-08T05:09:11Z', module: 'Compliance', decision: 'Release shipment blocked for OFAC sanctions screening (Entity X)', reasoning: 'Fuzzy match 87%. Manual review indicates false positive (similar name, different entity). Compliance officer sign-off required.', confidence: 78, value: 240000, urgency: 'medium', requester: 'AI Agent', autonomy_needed: 'L1' }
  ];

  // ------------------------------------------------------------------
  // AUTONOMY MODULES (with toggleable per-module autonomy levels)
  // ------------------------------------------------------------------
  const MODULES = [
    { id: 'logistics', name: 'Logistics & Routing', icon: '🚢', level: 4, decisions: 47, value: 1240000 },
    { id: 'procurement', name: 'Procurement & Sourcing', icon: '🏭', level: 3, decisions: 32, value: 880000 },
    { id: 'inventory', name: 'Inventory Optimization', icon: '📦', level: 4, decisions: 58, value: 420000 },
    { id: 'finance', name: 'Finance & Hedging', icon: '💰', level: 2, decisions: 14, value: 360000 },
    { id: 'compliance', name: 'Compliance & Screening', icon: '🛡️', level: 5, decisions: 22, value: 24000 },
    { id: 'planning', name: 'Demand Planning', icon: '📈', level: 3, decisions: 38, value: 180000 }
  ];

  const LEVELS = [
    { level: 1, name: 'Advisory Only', desc: 'Agent recommends, human executes all actions', color: '#94a3b8' },
    { level: 2, name: 'Assisted', desc: 'Agent executes with human approval for >$50k', color: '#06B6D4' },
    { level: 3, name: 'Supervised', desc: 'Agent executes up to $250k, human approves above', color: '#14b8a6' },
    { level: 4, name: 'Managed', desc: 'Agent executes up to $1M, human approves above', color: '#f59e0b' },
    { level: 5, name: 'Fully Autonomous', desc: 'Agent executes all decisions, human reviews post-hoc', color: '#ef4444' }
  ];

  // ------------------------------------------------------------------
  // TIMELINE EVENTS (chronological agent actions)
  // ------------------------------------------------------------------
  const TIMELINE_EVENTS = [
    { ts: '2026-02-08T09:14:00Z', event: 'Submitted approval request AP-2026-101 (Tier-2 qualification)', icon: '📋' },
    { ts: '2026-02-08T08:55:21Z', event: 'Submitted approval request AP-2026-102 (Carrier diversification)', icon: '📋' },
    { ts: '2026-02-08T08:14:32Z', event: 'Executed DEC-2026-001: Cape of Good Hope reroute', icon: '🚢' },
    { ts: '2026-02-08T07:42:11Z', event: 'Executed DEC-2026-002: Emergency CATL PO triggered', icon: '⚡' },
    { ts: '2026-02-08T06:18:54Z', event: 'Executing DEC-2026-003: Inventory liquidation in progress', icon: '📦' },
    { ts: '2026-02-08T05:33:20Z', event: 'Executed DEC-2026-004: Air freight expediting (8 SKUs)', icon: '✈️' },
    { ts: '2026-02-07T22:09:17Z', event: 'Executed DEC-2026-005: USD/CNY hedge execution', icon: '💱' },
    { ts: '2026-02-07T18:47:02Z', event: 'Executed DEC-2026-006: CATL Supplier Improvement Notice issued', icon: '📢' },
    { ts: '2026-02-07T15:22:38Z', event: 'Executed DEC-2026-007: Oakland cargo reroute (35%)', icon: '🚢' },
    { ts: '2026-02-07T11:05:44Z', event: 'Executed DEC-2026-008: SKU-C447 PO reduction (8%)', icon: '📦' },
    { ts: '2026-02-07T09:31:09Z', event: 'Executing DEC-2026-009: Sanctions hold on Entity X shipment', icon: '🛡️' },
    { ts: '2026-02-06T20:14:55Z', event: 'Executed DEC-2026-010: Maersk contract renegotiation', icon: '🤝' },
    { ts: '2026-02-06T16:48:12Z', event: 'Executed DEC-2026-011: POSCO steel hedge (90-day lock)', icon: '💰' },
    { ts: '2026-02-06T14:22:37Z', event: 'Executed DEC-2026-012: DC rebalance (RTM → HAM)', icon: '📦' }
  ];

  // ------------------------------------------------------------------
  // DATABASE INITIALIZATION
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.decisions) return db;
    db = {
      decisions: DECISIONS,
      approvals: APPROVAL_QUEUE,
      modules: MODULES,
      timeline: TIMELINE_EVENTS,
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
  let currentView = 'decision-log';
  let currentFilter = 'all';

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-aa-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-aa-styles';
    style.textContent = `
      .cc-aa-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10020; background: rgba(8,10,16,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-aa-sidebar { width: 220px; flex-shrink: 0; background: rgba(15,23,42,0.6); border-right: 1px solid rgba(255,255,255,0.06); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-aa-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; }
      .cc-aa-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
      .cc-aa-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-aa-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; font-family: inherit; }
      .cc-aa-nav-item:hover { background: rgba(255,255,255,0.03); color: #e2e8f0; }
      .cc-aa-nav-item.active { background: rgba(245,158,11,0.08); color: #f59e0b; border-left-color: #f59e0b; }
      .cc-aa-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-aa-nav-badge { margin-left: auto; font-size: 9px; padding: 1px 6px; border-radius: 8px; background: rgba(245,158,11,0.2); color: #f59e0b; font-weight: 700; }
      .cc-aa-nav-badge.urgent { background: rgba(239,68,68,0.2); color: #ef4444; animation: cc-aa-blink 1.5s ease-in-out infinite; }
      @keyframes cc-aa-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      .cc-aa-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-aa-close { position: fixed; top: 16px; right: 20px; z-index: 10021; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-aa-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-aa-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 12px; }
      .cc-aa-page-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-aa-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff; font-weight: 600; letter-spacing: 0.03em; }
      .cc-aa-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #f59e0b; font-weight: 600; }
      .cc-aa-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; animation: cc-aa-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-aa-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-aa-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-aa-card { background: rgba(245,158,11,0.04); border: 1px solid rgba(245,158,11,0.15); border-radius: 10px; padding: 16px; }
      .cc-aa-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
      .cc-aa-card-value { font-size: 22px; font-weight: 800; color: #fff; }
      .cc-aa-card-delta { font-size: 11px; margin-top: 4px; color: #64748b; }
      .cc-aa-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
      .cc-aa-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-aa-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-aa-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .cc-aa-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-aa-table tr:hover td { background: rgba(245,158,11,0.04); }
      .cc-aa-scroll { max-height: 540px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(245,158,11,0.4) transparent; }
      .cc-aa-scroll::-webkit-scrollbar { width: 8px; }
      .cc-aa-scroll::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.3); border-radius: 4px; }
      .cc-aa-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-aa-status-executed { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-aa-status-executing { background: rgba(6,182,212,0.15); color: #06B6D4; border: 1px solid rgba(6,182,212,0.3); }
      .cc-aa-status-pending { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-aa-status-success { background: rgba(34,197,94,0.15); color: #22c55e; }
      .cc-aa-status-failed { background: rgba(239,68,68,0.15); color: #ef4444; }
      .cc-aa-confidence { display: inline-block; padding: 2px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; }
      .cc-aa-conf-high { background: rgba(34,197,94,0.15); color: #22c55e; }
      .cc-aa-conf-med { background: rgba(245,158,11,0.15); color: #f59e0b; }
      .cc-aa-conf-low { background: rgba(239,68,68,0.15); color: #ef4444; }
      .cc-aa-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
      .cc-aa-tab { padding: 8px 16px; font-size: 12px; font-weight: 600; background: none; border: none; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: inherit; }
      .cc-aa-tab.active { color: #f59e0b; border-bottom-color: #f59e0b; }
      .cc-aa-tab:hover { color: #e2e8f0; }
      .cc-aa-btn { padding: 8px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 11px; font-weight: 700; transition: all 0.2s; font-family: inherit; display: inline-flex; align-items: center; gap: 4px; }
      .cc-aa-btn-approve { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-aa-btn-approve:hover { background: rgba(34,197,94,0.25); }
      .cc-aa-btn-reject { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-aa-btn-reject:hover { background: rgba(239,68,68,0.25); }
      .cc-aa-approval-card { background: rgba(245,158,11,0.04); border: 1px solid rgba(245,158,11,0.15); border-radius: 10px; padding: 16px; margin-bottom: 12px; }
      .cc-aa-approval-card.urgent { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.04); }
      .cc-aa-approval-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 12px; flex-wrap: wrap; }
      .cc-aa-approval-title { font-size: 14px; font-weight: 700; color: #fff; flex: 1; min-width: 240px; }
      .cc-aa-approval-meta { font-size: 10px; color: #64748b; margin-top: 4px; }
      .cc-aa-approval-reasoning { font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.02); border-left: 3px solid #f59e0b; border-radius: 4px; }
      .cc-aa-approval-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; align-items: center; }
      .cc-aa-level-slider { width: 100%; max-width: 600px; }
      .cc-aa-level-bar { display: flex; height: 32px; border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
      .cc-aa-level-seg { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.2s; border-right: 1px solid rgba(255,255,255,0.1); }
      .cc-aa-level-seg:last-child { border-right: none; }
      .cc-aa-level-seg.active { color: #fff; font-weight: 800; }
      .cc-aa-module-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 8px; flex-wrap: wrap; }
      .cc-aa-module-icon { font-size: 24px; }
      .cc-aa-module-name { font-size: 13px; font-weight: 700; color: #fff; }
      .cc-aa-module-meta { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-aa-toggle { position: relative; width: 44px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
      .cc-aa-toggle.on { background: rgba(245,158,11,0.6); }
      .cc-aa-toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: all 0.2s; }
      .cc-aa-toggle.on::after { transform: translateX(20px); }
      .cc-aa-timeline { position: relative; padding-left: 28px; }
      .cc-aa-timeline::before { content: ''; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: rgba(245,158,11,0.2); }
      .cc-aa-timeline-item { position: relative; padding: 10px 0 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
      .cc-aa-timeline-item:last-child { border-bottom: none; }
      .cc-aa-timeline-item::before { content: ''; position: absolute; left: -22px; top: 14px; width: 12px; height: 12px; border-radius: 50%; background: #f59e0b; border: 2px solid rgba(8,10,16,1); }
      .cc-aa-timeline-icon { display: inline-block; margin-right: 8px; font-size: 14px; }
      .cc-aa-timeline-event { font-size: 13px; color: #e2e8f0; font-weight: 600; }
      .cc-aa-timeline-meta { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-aa-bar { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; margin-top: 4px; }
      .cc-aa-bar-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); border-radius: 4px; }
      @media (max-width: 767px) {
        .cc-aa-modal { flex-direction: column; }
        .cc-aa-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-aa-sidebar-brand { display: none; }
        .cc-aa-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-aa-nav-item.active { border-bottom-color: #f59e0b; border-left-color: transparent; }
        .cc-aa-main { padding: 12px 12px 20px; }
        .cc-aa-cards { grid-template-columns: repeat(2, 1fr); }
      }
      /* Light mode overrides */
      html:not(.dark) .cc-aa-modal { background: rgba(248,250,252,0.99); color: #1e293b; }
      html:not(.dark) .cc-aa-sidebar { background: rgba(241,245,249,0.8); border-right-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-aa-sidebar-title { color: #0f172a; }
      html:not(.dark) .cc-aa-nav-item { color: #64748b; }
      html:not(.dark) .cc-aa-nav-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
      html:not(.dark) .cc-aa-nav-item.active { background: rgba(245,158,11,0.08); color: #d97706; }
      html:not(.dark) .cc-aa-page-title { color: #0f172a; }
      html:not(.dark) .cc-aa-header { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-aa-card { background: rgba(245,158,11,0.04); border-color: rgba(245,158,11,0.15); }
      html:not(.dark) .cc-aa-card-label { color: #64748b; }
      html:not(.dark) .cc-aa-card-value { color: #0f172a; }
      html:not(.dark) .cc-aa-card-delta { color: #64748b; }
      html:not(.dark) .cc-aa-section { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-aa-section-title { color: #1e293b; }
      html:not(.dark) .cc-aa-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-aa-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-aa-table tr:hover td { background: rgba(245,158,11,0.04); }
      html:not(.dark) .cc-aa-scroll { border-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-aa-approval-card { background: rgba(245,158,11,0.04); border-color: rgba(245,158,11,0.15); }
      html:not(.dark) .cc-aa-approval-card.urgent { background: rgba(239,68,68,0.04); border-color: rgba(239,68,68,0.3); }
      html:not(.dark) .cc-aa-approval-title { color: #0f172a; }
      html:not(.dark) .cc-aa-approval-reasoning { color: #475569; background: rgba(0,0,0,0.02); border-left-color: #d97706; }
      html:not(.dark) .cc-aa-module-row { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-aa-module-name { color: #0f172a; }
      html:not(.dark) .cc-aa-toggle { background: rgba(0,0,0,0.1); }
      html:not(.dark) .cc-aa-toggle.on { background: rgba(245,158,11,0.6); }
      html:not(.dark) .cc-aa-timeline-event { color: #1e293b; }
      html:not(.dark) .cc-aa-level-seg { color: rgba(0,0,0,0.4); }
      html:not(.dark) .cc-aa-bar { background: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-aa-tabs { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-aa-tab { color: #64748b; }
      html:not(.dark) .cc-aa-tab:hover { color: #1e293b; }
      html:not(.dark) .cc-aa-tab.active { color: #d97706; }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    const db = initDatabase();
    const pendingCount = db.approvals.length;
    const overlay = document.createElement('div');
    overlay.id = 'cc-aa-overlay';
    overlay.className = 'cc-aa-modal';
    overlay.innerHTML = `
      <button class="cc-aa-close" onclick="window.__ccAA.close()">×</button>
      <div class="cc-aa-sidebar">
        <div class="cc-aa-sidebar-brand">
          <div class="cc-aa-sidebar-title">🤖 Autonomous Agent</div>
          <div class="cc-aa-sidebar-sub">Level 3 · Supervised</div>
        </div>
        <button class="cc-aa-nav-item ${currentView === 'decision-log' ? 'active' : ''}" onclick="window.__ccAA.setView('decision-log')"><span class="cc-aa-nav-icon">📋</span> Decision Log</button>
        <button class="cc-aa-nav-item ${currentView === 'approval-queue' ? 'active' : ''}" onclick="window.__ccAA.setView('approval-queue')"><span class="cc-aa-nav-icon">✋</span> Approval Queue ${pendingCount > 0 ? '<span class="cc-aa-nav-badge urgent">' + pendingCount + '</span>' : ''}</button>
        <button class="cc-aa-nav-item ${currentView === 'settings' ? 'active' : ''}" onclick="window.__ccAA.setView('settings')"><span class="cc-aa-nav-icon">⚙️</span> Autonomy Settings</button>
        <button class="cc-aa-nav-item ${currentView === 'scorecard' ? 'active' : ''}" onclick="window.__ccAA.setView('scorecard')"><span class="cc-aa-nav-icon">📊</span> Performance Scorecard</button>
        <button class="cc-aa-nav-item ${currentView === 'timeline' ? 'active' : ''}" onclick="window.__ccAA.setView('timeline')"><span class="cc-aa-nav-icon">⏱️</span> Agent Timeline</button>
      </div>
      <div class="cc-aa-main" id="cc-aa-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const c = document.getElementById('cc-aa-content');
    if (!c) return;
    if (currentView === 'decision-log') renderDecisionLog(c);
    else if (currentView === 'approval-queue') renderApprovalQueue(c);
    else if (currentView === 'settings') renderSettings(c);
    else if (currentView === 'scorecard') renderScorecard(c);
    else if (currentView === 'timeline') renderTimeline(c);
    document.querySelectorAll('.cc-aa-nav-item').forEach(function(item) {
      var onclick = item.getAttribute('onclick') || '';
      item.classList.toggle('active', onclick.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // DECISION LOG
  // ------------------------------------------------------------------
  function renderDecisionLog(c) {
    const db = initDatabase();
    const totalValue = db.decisions.reduce(function(s, d) { return s + d.value; }, 0);
    const successCount = db.decisions.filter(function(d) { return d.outcome === 'success'; }).length;
    c.innerHTML = `
      <div class="cc-aa-header">
        <h2 class="cc-aa-page-title">🤖 Agent Decision Log <span class="cc-aa-page-badge">${db.decisions.length} DECISIONS</span></h2>
        <div class="cc-aa-live-indicator"><div class="cc-aa-live-dot"></div> Active · ${successCount} successful</div>
      </div>
      <div class="cc-aa-cards">
        <div class="cc-aa-card"><div class="cc-aa-card-label">Total Decisions</div><div class="cc-aa-card-value">${db.decisions.length}</div><div class="cc-aa-card-delta">last 7 days</div></div>
        <div class="cc-aa-card"><div class="cc-aa-card-label">Success Rate</div><div class="cc-aa-card-value" style="color:#22c55e">${Math.round(successCount / db.decisions.length * 100)}%</div><div class="cc-aa-card-delta">${successCount} of ${db.decisions.length}</div></div>
        <div class="cc-aa-card"><div class="cc-aa-card-label">Value Generated</div><div class="cc-aa-card-value" style="color:#22c55e">${formatCurrency(totalValue)}</div><div class="cc-aa-card-delta">net positive impact</div></div>
        <div class="cc-aa-card"><div class="cc-aa-card-label">Avg Confidence</div><div class="cc-aa-card-value" style="color:#f59e0b">${Math.round(db.decisions.reduce(function(s, d) { return s + d.confidence; }, 0) / db.decisions.length)}%</div><div class="cc-aa-card-delta">across all decisions</div></div>
      </div>
      <div class="cc-aa-tabs">
        <button class="cc-aa-tab ${currentFilter === 'all' ? 'active' : ''}" onclick="window.__ccAA.setFilter('all')">All (${db.decisions.length})</button>
        <button class="cc-aa-tab ${currentFilter === 'executed' ? 'active' : ''}" onclick="window.__ccAA.setFilter('executed')">Executed (${db.decisions.filter(function(d) { return d.status === 'executed'; }).length})</button>
        <button class="cc-aa-tab ${currentFilter === 'executing' ? 'active' : ''}" onclick="window.__ccAA.setFilter('executing')">In Progress (${db.decisions.filter(function(d) { return d.status === 'executing'; }).length})</button>
        <button class="cc-aa-tab ${currentFilter === 'logistics' ? 'active' : ''}" onclick="window.__ccAA.setFilter('logistics')">Logistics (${db.decisions.filter(function(d) { return d.module === 'Logistics'; }).length})</button>
        <button class="cc-aa-tab ${currentFilter === 'procurement' ? 'active' : ''}" onclick="window.__ccAA.setFilter('procurement')">Procurement (${db.decisions.filter(function(d) { return d.module === 'Procurement'; }).length})</button>
        <button class="cc-aa-tab ${currentFilter === 'inventory' ? 'active' : ''}" onclick="window.__ccAA.setFilter('inventory')">Inventory (${db.decisions.filter(function(d) { return d.module === 'Inventory'; }).length})</button>
      </div>
      <div class="cc-aa-section">
        <div class="cc-aa-section-title">📋 Decision History</div>
        <div class="cc-aa-scroll">
          <table class="cc-aa-table">
            <thead><tr><th>ID</th><th>Timestamp</th><th>Module</th><th>Decision</th><th>Reasoning</th><th>Conf.</th><th>Outcome</th><th>Value</th><th>Status</th></tr></thead>
            <tbody>
              ${filterDecisions(db.decisions).map(function(d) {
                var confClass = d.confidence >= 90 ? 'cc-aa-conf-high' : d.confidence >= 80 ? 'cc-aa-conf-med' : 'cc-aa-conf-low';
                return '<tr><td style="font-family:monospace;font-size:10px;color:#f59e0b">' + d.id + '</td><td style="font-size:10px;color:#64748b">' + formatDate(d.ts) + '</td><td>' + d.module + '</td><td style="font-weight:600;color:#e2e8f0;max-width:300px">' + d.decision + '</td><td style="font-size:11px;color:#94a3b8;max-width:400px">' + d.reasoning + '</td><td><span class="cc-aa-confidence ' + confClass + '">' + d.confidence + '%</span></td><td><span class="cc-aa-status cc-aa-status-' + d.outcome + '">' + d.outcome + '</span></td><td style="font-weight:700;color:' + (d.value > 0 ? '#22c55e' : d.value < 0 ? '#ef4444' : '#94a3b8') + '">' + (d.value > 0 ? '+' : '') + formatCurrency(d.value) + '</td><td><span class="cc-aa-status cc-aa-status-' + d.status + '">' + d.status + '</span></td></tr>';
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function filterDecisions(list) {
    if (currentFilter === 'all') return list;
    if (currentFilter === 'executed') return list.filter(function(d) { return d.status === 'executed'; });
    if (currentFilter === 'executing') return list.filter(function(d) { return d.status === 'executing'; });
    var cap = currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1);
    return list.filter(function(d) { return d.module === cap; });
  }

  function setFilter(f) {
    currentFilter = f;
    renderContent();
  }

  // ------------------------------------------------------------------
  // APPROVAL QUEUE
  // ------------------------------------------------------------------
  function renderApprovalQueue(c) {
    const db = initDatabase();
    const totalValue = db.approvals.reduce(function(s, a) { return s + Math.abs(a.value); }, 0);
    c.innerHTML = `
      <div class="cc-aa-header">
        <h2 class="cc-aa-page-title">✋ Approval Queue <span class="cc-aa-page-badge">${db.approvals.length} PENDING</span></h2>
        <div class="cc-aa-live-indicator"><div class="cc-aa-live-dot"></div> Awaiting human review</div>
      </div>
      <div class="cc-aa-cards">
        <div class="cc-aa-card"><div class="cc-aa-card-label">Pending Approvals</div><div class="cc-aa-card-value" style="color:#f59e0b">${db.approvals.length}</div><div class="cc-aa-card-delta">awaiting review</div></div>
        <div class="cc-aa-card"><div class="cc-aa-card-label">Critical</div><div class="cc-aa-card-value" style="color:#ef4444">${db.approvals.filter(function(a) { return a.urgency === 'critical'; }).length}</div><div class="cc-aa-card-delta">action required now</div></div>
        <div class="cc-aa-card"><div class="cc-aa-card-label">Total Exposure</div><div class="cc-aa-card-value">${formatCurrency(totalValue)}</div><div class="cc-aa-card-delta">aggregate value</div></div>
        <div class="cc-aa-card"><div class="cc-aa-card-label">Avg Confidence</div><div class="cc-aa-card-value" style="color:#f59e0b">${Math.round(db.approvals.reduce(function(s, a) { return s + a.confidence; }, 0) / db.approvals.length)}%</div><div class="cc-aa-card-delta">agent confidence</div></div>
      </div>
      <div class="cc-aa-section">
        <div class="cc-aa-section-title">✋ Awaiting Your Decision</div>
        ${db.approvals.map(function(a) {
          return '<div class="cc-aa-approval-card ' + (a.urgency === 'critical' || a.urgency === 'high' ? 'urgent' : '') + '"><div class="cc-aa-approval-header"><div style="flex:1;min-width:240px"><div class="cc-aa-approval-title">' + a.decision + '</div><div class="cc-aa-approval-meta">' + a.id + ' · ' + a.module + ' · Submitted ' + formatDate(a.ts) + ' · Confidence ' + a.confidence + '%</div></div><div style="text-align:right"><div style="font-size:11px;color:#64748b">Value Impact</div><div style="font-size:18px;font-weight:800;color:' + (a.value > 0 ? '#22c55e' : '#ef4444') + '">' + (a.value > 0 ? '+' : '') + formatCurrency(a.value) + '</div><div style="font-size:10px;color:' + (a.urgency === 'critical' ? '#ef4444' : a.urgency === 'high' ? '#f59e0b' : '#94a3b8') + ';text-transform:uppercase;font-weight:700;margin-top:4px">' + a.urgency + '</div></div></div><div class="cc-aa-approval-reasoning"><strong>Agent Reasoning:</strong> ' + a.reasoning + '</div><div class="cc-aa-approval-actions"><button class="cc-aa-btn cc-aa-btn-approve" onclick="window.__ccAA.approve(\'' + a.id + '\')">✓ Approve</button><button class="cc-aa-btn cc-aa-btn-reject" onclick="window.__ccAA.reject(\'' + a.id + '\')">✗ Reject</button><span style="font-size:10px;color:#64748b;margin-left:auto">Requires autonomy level: ' + a.autonomy_needed + '</span></div></div>';
        }).join('')}
      </div>
    `;
  }

  function approve(id) {
    const db = initDatabase();
    db.approvals = db.approvals.filter(function(a) { return a.id !== id; });
    db.decisions.unshift({ id: 'DEC-' + Date.now(), ts: new Date().toISOString(), module: 'Manual', decision: 'Approved ' + id, reasoning: 'Human approval granted', confidence: 100, outcome: 'success', value: 0, status: 'executed', autonomy: 'L1' });
    saveDB(db);
    renderContent();
    showToast('Decision ' + id + ' approved and executing');
  }

  function reject(id) {
    const db = initDatabase();
    db.approvals = db.approvals.filter(function(a) { return a.id !== id; });
    saveDB(db);
    renderContent();
    showToast('Decision ' + id + ' rejected');
  }

  // ------------------------------------------------------------------
  // AUTONOMY SETTINGS
  // ------------------------------------------------------------------
  let globalLevel = 3;

  function renderSettings(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-aa-header">
        <h2 class="cc-aa-page-title">⚙️ Autonomy Settings <span class="cc-aa-page-badge">LEVEL ${globalLevel}</span></h2>
      </div>
      <div class="cc-aa-section">
        <div class="cc-aa-section-title">🎚️ Global Autonomy Level</div>
        <div class="cc-aa-level-bar">
          ${LEVELS.map(function(l) {
            return '<div class="cc-aa-level-seg ' + (globalLevel === l.level ? 'active' : '') + '" style="' + (globalLevel === l.level ? 'background:' + l.color : '') + '" onclick="window.__ccAA.setLevel(' + l.level + ')">L' + l.level + '</div>';
          }).join('')}
        </div>
        <div style="padding:14px;background:rgba(255,255,255,0.02);border-radius:8px;margin-top:12px">
          <div style="font-size:14px;font-weight:800;color:${LEVELS[globalLevel - 1].color}">Level ${globalLevel}: ${LEVELS[globalLevel - 1].name}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px">${LEVELS[globalLevel - 1].desc}</div>
        </div>
      </div>
      <div class="cc-aa-section">
        <div class="cc-aa-section-title">🧩 Per-Module Autonomy</div>
        ${db.modules.map(function(m) {
          return '<div class="cc-aa-module-row"><div class="cc-aa-module-icon">' + m.icon + '</div><div style="flex:1;min-width:180px"><div class="cc-aa-module-name">' + m.name + '</div><div class="cc-aa-module-meta">' + m.decisions + ' decisions · Value: ' + formatCurrency(m.value) + '</div></div><div class="cc-aa-toggle on" onclick="this.classList.toggle(\'on\')"></div><div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><span>L</span><select style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;border-radius:4px;padding:4px 8px;font-family:inherit" onchange="window.__ccAA.setModuleLevel(\'' + m.id + '\', this.value)">' + [1,2,3,4,5].map(function(l) { return '<option value="' + l + '"' + (m.level === l ? ' selected' : '') + '>L' + l + '</option>'; }).join('') + '</select></div></div>';
        }).join('')}
      </div>
      <div class="cc-aa-section">
        <div class="cc-aa-section-title">🛡️ Safety Guardrails</div>
        <div style="font-size:12px;color:#94a3b8;line-height:1.7">
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">✓ Maximum single-decision value cap: <strong style="color:#f59e0b">$2M</strong> (Level ${globalLevel})</div>
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">✓ Daily aggregate decision cap: <strong style="color:#f59e0b">$8M</strong></div>
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">✓ Mandatory human approval for: <strong style="color:#ef4444">sanctions, contracts >$1M, supplier onboarding</strong></div>
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">✓ Auto-rollback on confidence < 70% or value variance > 15%</div>
          <div style="padding:8px 0">✓ All decisions logged immutably with full audit trail (7-year retention)</div>
        </div>
      </div>
    `;
  }

  function setLevel(l) { globalLevel = l; renderContent(); }
  function setModuleLevel(id, l) {
    const db = initDatabase();
    db.modules.forEach(function(m) { if (m.id === id) m.level = parseInt(l); });
    saveDB(db);
  }

  // ------------------------------------------------------------------
  // PERFORMANCE SCORECARD
  // ------------------------------------------------------------------
  function renderScorecard(c) {
    const db = initDatabase();
    const totalDecisions = db.decisions.length;
    const success = db.decisions.filter(function(d) { return d.outcome === 'success'; }).length;
    const totalValue = db.decisions.reduce(function(s, d) { return s + d.value; }, 0);
    const avgConf = Math.round(db.decisions.reduce(function(s, d) { return s + d.confidence; }, 0) / totalDecisions);
    const moduleValue = {};
    db.modules.forEach(function(m) { moduleValue[m.name] = m.value; });
    const maxModuleValue = Math.max.apply(null, Object.values(moduleValue));

    c.innerHTML = `
      <div class="cc-aa-header">
        <h2 class="cc-aa-page-title">📊 Performance Scorecard <span class="cc-aa-page-badge">LAST 7 DAYS</span></h2>
      </div>
      <div class="cc-aa-cards">
        <div class="cc-aa-card"><div class="cc-aa-card-label">Decisions Made</div><div class="cc-aa-card-value">${totalDecisions}</div><div class="cc-aa-card-delta">avg ${Math.round(totalDecisions/7)}/day</div></div>
        <div class="cc-aa-card"><div class="cc-aa-card-label">Success Rate</div><div class="cc-aa-card-value" style="color:#22c55e">${Math.round(success/totalDecisions*100)}%</div><div class="cc-aa-card-delta">${success} successful</div></div>
        <div class="cc-aa-card"><div class="cc-aa-card-label">Value Generated</div><div class="cc-aa-card-value" style="color:#22c55e">${formatCurrency(totalValue)}</div><div class="cc-aa-card-delta">net positive impact</div></div>
        <div class="cc-aa-card"><div class="cc-aa-card-label">Avg Confidence</div><div class="cc-aa-card-value" style="color:#f59e0b">${avgConf}%</div><div class="cc-aa-card-delta">across all decisions</div></div>
      </div>
      <div class="cc-aa-section">
        <div class="cc-aa-section-title">🧩 Value by Module</div>
        ${db.modules.map(function(m) {
          var pct = Math.round(m.value / maxModuleValue * 100);
          return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="font-weight:600;color:#e2e8f0">' + m.icon + ' ' + m.name + '</span><span style="color:#22c55e;font-weight:700">' + formatCurrency(m.value) + ' · ' + m.decisions + ' decisions</span></div><div class="cc-aa-bar"><div class="cc-aa-bar-fill" style="width:' + pct + '%"></div></div></div>';
        }).join('')}
      </div>
      <div class="cc-aa-section">
        <div class="cc-aa-section-title">📈 7-Day Performance Trend</div>
        <div style="display:flex;align-items:flex-end;gap:8px;height:160px;padding:8px 0">
          ${[42, 38, 51, 47, 39, 52, 47].map(function(v, i) {
            var h = Math.round(v / 60 * 140);
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:100%;background:linear-gradient(180deg, #f59e0b, #ef4444);border-radius:4px 4px 0 0;height:' + h + 'px" title="' + v + ' decisions"></div><div style="font-size:10px;color:#64748b">' + ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i] + '</div><div style="font-size:9px;color:#94a3b8;font-weight:600">' + v + '</div></div>';
          }).join('')}
        </div>
      </div>
      <div class="cc-aa-section">
        <div class="cc-aa-section-title">🏆 Highlights</div>
        <div style="font-size:12px;color:#cbd5e1;line-height:1.7">
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">🥇 <strong style="color:#f59e0b">Highest-value decision:</strong> Cape of Good Hope reroute (+$480k, DEC-2026-001)</div>
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">🎯 <strong style="color:#22c55e">Best module:</strong> Logistics ($1.24M value, 47 decisions)</div>
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">⚡ <strong style="color:#06B6D4">Fastest decision:</strong> Sanctions block (DEC-2026-009, 99% confidence, 0.8s)</div>
          <div style="padding:8px 0">📈 <strong style="color:#14b8a6">Best day:</strong> Friday (52 decisions, $890k value)</div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // TIMELINE
  // ------------------------------------------------------------------
  function renderTimeline(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-aa-header">
        <h2 class="cc-aa-page-title">⏱️ Agent Timeline <span class="cc-aa-page-badge">${db.timeline.length} EVENTS</span></h2>
        <div class="cc-aa-live-indicator"><div class="cc-aa-live-dot"></div> Real-time activity feed</div>
      </div>
      <div class="cc-aa-section">
        <div class="cc-aa-section-title">⏱️ Chronological Activity</div>
        <div class="cc-aa-timeline">
          ${db.timeline.map(function(t) {
            return '<div class="cc-aa-timeline-item"><div class="cc-aa-timeline-event"><span class="cc-aa-timeline-icon">' + t.icon + '</span>' + t.event + '</div><div class="cc-aa-timeline-meta">' + formatDate(t.ts) + '</div></div>';
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // TOAST
  // ------------------------------------------------------------------
  function showToast(msg) {
    var existing = document.querySelector('.cc-aa-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'cc-aa-toast';
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:600;z-index:10022;box-shadow:0 8px 24px rgba(245,158,11,0.4);font-family:inherit';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.4s'; }, 2200);
    setTimeout(function() { toast.remove(); }, 2700);
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-aa-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-aa-overlay');
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
    window.__ccAA = { open: open, close: close, setView: setView, setFilter: setFilter, approve: approve, reject: reject, setLevel: setLevel, setModuleLevel: setModuleLevel };

    function injectButton() {
      if (document.getElementById('cc-aa-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-aa-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 680px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #f59e0b, #ef4444)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/><path d="m21 12-6-3v6z"/></svg> AI Agent';
      btn.setAttribute('aria-label', 'Open autonomous agent');
      btn.title = 'Open AI Agent (press X)';
      btn.onclick = open;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-aa-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-aa-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 7000); });
    } else {
      setTimeout(tryInject, 7000);
    }

    document.addEventListener('keydown', function(e) {
      if ((e.key === 'x' || e.key === 'X') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-aa-overlay')) { open(); e.preventDefault(); }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
