// ====================================================================
// federated-learning.js — Federated Learning Dashboard
// ====================================================================
// Federated learning control plane for privacy-preserving supply chain AI:
//   1. Overview: KPI cards (models, nodes, accuracy, privacy score)
//   2. Model Training: federated training rounds with node contributions
//   3. Privacy & Governance: differential privacy + audit trail
//   4. Benchmarking: anonymous peer comparison (radar + bars)
//   5. Node Network: participating orgs with contribution scores
//
// Architecture: reuses IIFE + modal + sidebar patterns from api-marketplace.js
// CSS prefix: cc-fl-  ·  Floating button: cyan/blue gradient, shortcut "L"
// ====================================================================
(function() {
  'use strict';

  if (window.__fedLearningLoaded) return;
  window.__fedLearningLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_fed_learning_db_v1';

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(a) {
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'k';
    return '$' + a.toFixed(0);
  }

  // ------------------------------------------------------------------
  // MODELS
  // ------------------------------------------------------------------
  const MODELS = [
    { id: 'M-001', name: 'Demand Forecast XGBoost v3.2', rounds: 47, accuracy: 94.2, nodes: 14, status: 'training', privacy: 'DP-SGD ε=2.4', desc: 'Multi-party demand forecasting across 14 retail partners' },
    { id: 'M-002', name: 'Supplier Risk LSTM v2.1', rounds: 32, accuracy: 89.7, nodes: 11, status: 'training', privacy: 'DP-SGD ε=3.1', desc: 'Supplier default prediction with confidentiality preservation' },
    { id: 'M-003', name: 'ETA Prediction Transformer v4.0', rounds: 68, accuracy: 96.8, nodes: 22, status: 'production', privacy: 'DP-SGD ε=1.8', desc: 'Multi-modal shipment ETA prediction across carriers' },
    { id: 'M-004', name: 'Inventory Opt RL v1.7', rounds: 24, accuracy: 87.4, nodes: 9, status: 'training', privacy: 'DP-SGD ε=4.2', desc: 'Reinforcement learning for inventory rebalancing' },
    { id: 'M-005', name: 'Fraud Detection GNN v2.4', rounds: 51, accuracy: 92.6, nodes: 18, status: 'production', privacy: 'DP-SGD ε=2.0', desc: 'Graph neural network for invoice fraud detection' },
    { id: 'M-006', name: 'CO2 Optimization v1.2', rounds: 18, accuracy: 84.1, nodes: 7, status: 'training', privacy: 'DP-SGD ε=3.8', desc: 'Carbon footprint optimization across logistics network' }
  ];

  // ------------------------------------------------------------------
  // NODES (participating organizations)
  // ------------------------------------------------------------------
  const NODES = [
    { id: 'N01', org: 'Acme Retail Group', region: 'North America', contribution: 94, samples: 1240000, status: 'active', joined: '2025-08-14' },
    { id: 'N02', org: 'EuroLogix Distribution', region: 'Europe', contribution: 87, samples: 980000, status: 'active', joined: '2025-09-02' },
    { id: 'N03', org: 'AsiaPac Trading Co', region: 'Asia-Pacific', contribution: 91, samples: 1850000, status: 'active', joined: '2025-07-22' },
    { id: 'N04', org: 'LATAM Cargo SA', region: 'South America', contribution: 72, samples: 420000, status: 'active', joined: '2025-11-08' },
    { id: 'N05', org: 'MEA Logistics', region: 'Middle East / Africa', contribution: 68, samples: 280000, status: 'paused', joined: '2025-12-14' },
    { id: 'N06', org: 'Nordic Freight AB', region: 'Europe', contribution: 83, samples: 620000, status: 'active', joined: '2025-08-30' },
    { id: 'N07', org: 'Pacific Rim Imports', region: 'Asia-Pacific', contribution: 89, samples: 1140000, status: 'active', joined: '2025-09-19' },
    { id: 'N08', org: 'Andean Mining & Logistics', region: 'South America', contribution: 76, samples: 380000, status: 'active', joined: '2025-10-04' },
    { id: 'N09', org: 'Trans-Siberian Rail', region: 'Europe / Asia', contribution: 81, samples: 540000, status: 'active', joined: '2025-09-25' },
    { id: 'N10', org: 'Sub-Saharan Trade Hub', region: 'Africa', contribution: 64, samples: 210000, status: 'active', joined: '2025-12-22' },
    { id: 'N11', org: 'Aussie Outback Cargo', region: 'Oceania', contribution: 78, samples: 320000, status: 'active', joined: '2025-10-17' },
    { id: 'N12', org: 'Arctic Express Logistics', region: 'Europe / Arctic', contribution: 85, samples: 480000, status: 'active', joined: '2025-08-08' }
  ];

  // ------------------------------------------------------------------
  // TRAINING ROUNDS (last 10 rounds for primary model)
  // ------------------------------------------------------------------
  const TRAINING_ROUNDS = [
    { round: 47, ts: '2026-02-08T09:14:32Z', nodes_participating: 14, accuracy: 94.2, loss: 0.083, epsilon: 2.4, delta: 1e-5, samples: 9200000, duration: '4m 12s' },
    { round: 46, ts: '2026-02-08T07:42:11Z', nodes_participating: 13, accuracy: 93.8, loss: 0.087, epsilon: 2.4, delta: 1e-5, samples: 8950000, duration: '4m 04s' },
    { round: 45, ts: '2026-02-08T06:18:54Z', nodes_participating: 14, accuracy: 93.5, loss: 0.091, epsilon: 2.4, delta: 1e-5, samples: 9100000, duration: '4m 18s' },
    { round: 44, ts: '2026-02-08T04:33:20Z', nodes_participating: 12, accuracy: 93.1, loss: 0.094, epsilon: 2.4, delta: 1e-5, samples: 8700000, duration: '3m 56s' },
    { round: 43, ts: '2026-02-08T02:09:17Z', nodes_participating: 14, accuracy: 92.7, loss: 0.098, epsilon: 2.4, delta: 1e-5, samples: 9200000, duration: '4m 22s' },
    { round: 42, ts: '2026-02-07T22:47:02Z', nodes_participating: 11, accuracy: 92.3, loss: 0.102, epsilon: 2.4, delta: 1e-5, samples: 8400000, duration: '3m 48s' },
    { round: 41, ts: '2026-02-07T19:22:38Z', nodes_participating: 14, accuracy: 91.9, loss: 0.106, epsilon: 2.4, delta: 1e-5, samples: 9200000, duration: '4m 14s' },
    { round: 40, ts: '2026-02-07T16:05:44Z', nodes_participating: 13, accuracy: 91.5, loss: 0.110, epsilon: 2.4, delta: 1e-5, samples: 8950000, duration: '4m 02s' },
    { round: 39, ts: '2026-02-07T13:31:09Z', nodes_participating: 14, accuracy: 91.2, loss: 0.114, epsilon: 2.4, delta: 1e-5, samples: 9200000, duration: '4m 19s' },
    { round: 38, ts: '2026-02-07T10:14:55Z', nodes_participating: 12, accuracy: 90.8, loss: 0.118, epsilon: 2.4, delta: 1e-5, samples: 8700000, duration: '3m 58s' }
  ];

  // ------------------------------------------------------------------
  // AUDIT TRAIL EVENTS
  // ------------------------------------------------------------------
  const AUDIT_TRAIL = [
    { ts: '2026-02-08T09:14:32Z', event: 'Round 47 completed · 14 nodes · Accuracy 94.2%', category: 'Training' },
    { ts: '2026-02-08T08:47:11Z', event: 'Node N05 (MEA Logistics) paused training — compliance review', category: 'Governance' },
    { ts: '2026-02-08T08:22:54Z', event: 'DP-SGD noise calibration verified (ε=2.4, δ=1e-5)', category: 'Privacy' },
    { ts: '2026-02-08T07:42:11Z', event: 'Round 46 completed · 13 nodes · Accuracy 93.8%', category: 'Training' },
    { ts: '2026-02-08T06:18:54Z', event: 'Model M-005 promoted to production (Fraud Detection v2.4)', category: 'Governance' },
    { ts: '2026-02-08T05:33:20Z', event: 'Node N12 (Arctic Express) rejoined after firmware update', category: 'Network' },
    { ts: '2026-02-08T04:33:20Z', event: 'Round 44 completed · 12 nodes · Accuracy 93.1%', category: 'Training' },
    { ts: '2026-02-08T03:14:21Z', event: 'Secure aggregation protocol refreshed (128-bit)', category: 'Security' },
    { ts: '2026-02-08T02:09:17Z', event: 'Round 43 completed · 14 nodes · Accuracy 92.7%', category: 'Training' },
    { ts: '2026-02-07T22:47:02Z', event: 'New node onboarding: N10 Sub-Saharan Trade Hub', category: 'Network' }
  ];

  // ------------------------------------------------------------------
  // PEER BENCHMARKING (anonymous industry comparison)
  // ------------------------------------------------------------------
  const PEER_BENCHMARK = [
    { metric: 'Forecast Accuracy', you: 94.2, peers_avg: 87.4, top_quartile: 91.5 },
    { metric: 'Training Velocity', you: 4.1, peers_avg: 6.8, top_quartile: 5.2 },
    { metric: 'Privacy Score', you: 9.4, peers_avg: 7.2, top_quartile: 8.5 },
    { metric: 'Node Diversity', you: 8.7, peers_avg: 6.1, top_quartile: 7.9 },
    { metric: 'Cost Efficiency', you: 7.8, peers_avg: 6.4, top_quartile: 7.5 },
    { metric: 'Governance Maturity', you: 9.1, peers_avg: 6.8, top_quartile: 8.2 }
  ];

  // ------------------------------------------------------------------
  // DATA SHARING POLICIES
  // ------------------------------------------------------------------
  const POLICIES = [
    { name: 'Differential Privacy (DP-SGD)', status: 'enabled', desc: 'Gradient noise injection — ε=2.4, δ=1e-5 (stringent)', enforced: 'All training rounds' },
    { name: 'Secure Multi-Party Aggregation', status: 'enabled', desc: '128-bit secret sharing — no raw gradients leave node', enforced: 'All rounds' },
    { name: 'Homomorphic Encryption (CKKS)', status: 'enabled', desc: 'Encrypted gradient aggregation without decryption', enforced: 'Production models' },
    { name: 'PII Auto-Redaction', status: 'enabled', desc: 'Personally identifiable info scrubbed before training', enforced: 'All data ingestion' },
    { name: 'GDPR Right-to-Erasure Compliance', status: 'enabled', desc: 'Encrypted sample deletion within 72h on request', enforced: 'All nodes' },
    { name: 'Model Watermarking', status: 'enabled', desc: 'Invisible watermark for IP protection & provenance', enforced: 'Production models' },
    { name: 'Cross-Border Data Transfer Audit', status: 'enabled', desc: 'Per-jurisdiction transfer logging & approval workflow', enforced: 'Cross-region rounds' },
    { name: 'Adversarial Robustness Validation', status: 'enabled', desc: 'Defense against poisoning & model inversion attacks', enforced: 'Pre-production validation' }
  ];

  // ------------------------------------------------------------------
  // DATABASE INITIALIZATION
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.models) return db;
    db = {
      models: MODELS,
      nodes: NODES,
      trainingRounds: TRAINING_ROUNDS,
      auditTrail: AUDIT_TRAIL,
      peerBenchmark: PEER_BENCHMARK,
      policies: POLICIES,
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
  let currentView = 'overview';

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-fl-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-fl-styles';
    style.textContent = `
      .cc-fl-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10024; background: rgba(8,10,16,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-fl-sidebar { width: 220px; flex-shrink: 0; background: rgba(15,23,42,0.6); border-right: 1px solid rgba(255,255,255,0.06); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-fl-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; }
      .cc-fl-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
      .cc-fl-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-fl-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; font-family: inherit; }
      .cc-fl-nav-item:hover { background: rgba(255,255,255,0.03); color: #e2e8f0; }
      .cc-fl-nav-item.active { background: rgba(14,165,233,0.08); color: #0ea5e9; border-left-color: #0ea5e9; }
      .cc-fl-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-fl-nav-badge { margin-left: auto; font-size: 9px; padding: 1px 6px; border-radius: 8px; background: rgba(14,165,233,0.2); color: #0ea5e9; font-weight: 700; }
      .cc-fl-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-fl-close { position: fixed; top: 16px; right: 20px; z-index: 10025; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-fl-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-fl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 12px; }
      .cc-fl-page-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-fl-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: #fff; font-weight: 600; letter-spacing: 0.03em; }
      .cc-fl-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #0ea5e9; font-weight: 600; }
      .cc-fl-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #0ea5e9; animation: cc-fl-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-fl-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-fl-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-fl-card { background: rgba(14,165,233,0.04); border: 1px solid rgba(14,165,233,0.15); border-radius: 10px; padding: 16px; }
      .cc-fl-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
      .cc-fl-card-value { font-size: 22px; font-weight: 800; color: #fff; }
      .cc-fl-card-delta { font-size: 11px; margin-top: 4px; color: #64748b; }
      .cc-fl-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
      .cc-fl-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-fl-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-fl-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .cc-fl-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-fl-table tr:hover td { background: rgba(14,165,233,0.04); }
      .cc-fl-scroll { max-height: 540px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(14,165,233,0.4) transparent; }
      .cc-fl-scroll::-webkit-scrollbar { width: 8px; }
      .cc-fl-scroll::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.3); border-radius: 4px; }
      .cc-fl-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-fl-status-production { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-fl-status-training { background: rgba(14,165,233,0.15); color: #0ea5e9; border: 1px solid rgba(14,165,233,0.3); }
      .cc-fl-status-active { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-fl-status-paused { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-fl-status-enabled { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-fl-model-card { background: rgba(14,165,233,0.04); border: 1px solid rgba(14,165,233,0.15); border-radius: 10px; padding: 16px; margin-bottom: 12px; }
      .cc-fl-model-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
      .cc-fl-model-name { font-size: 14px; font-weight: 700; color: #fff; }
      .cc-fl-model-desc { font-size: 11px; color: #94a3b8; margin-top: 4px; }
      .cc-fl-model-stats { display: flex; gap: 16px; flex-wrap: wrap; font-size: 11px; color: #94a3b8; margin-top: 8px; }
      .cc-fl-model-stat { display: flex; flex-direction: column; }
      .cc-fl-model-stat strong { color: #0ea5e9; font-size: 14px; font-weight: 700; }
      .cc-fl-progress { width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; margin-top: 8px; overflow: hidden; }
      .cc-fl-progress-bar { height: 100%; background: linear-gradient(90deg, #0ea5e9, #3b82f6); border-radius: 3px; }
      .cc-fl-chart { width: 100%; height: 200px; display: flex; align-items: flex-end; gap: 6px; padding: 8px 0; }
      .cc-fl-chart-bar { flex: 1; background: linear-gradient(180deg, #0ea5e9, #3b82f6); border-radius: 4px 4px 0 0; min-height: 4px; transition: all 0.3s; position: relative; }
      .cc-fl-chart-bar:hover { opacity: 0.8; }
      .cc-fl-chart-bar-label { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 9px; color: #64748b; white-space: nowrap; }
      .cc-fl-radar { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
      .cc-fl-radar-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 14px; }
      .cc-fl-radar-metric { font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 6px; }
      .cc-fl-radar-bar-wrap { display: flex; flex-direction: column; gap: 6px; }
      .cc-fl-radar-bar-row { display: flex; align-items: center; gap: 8px; font-size: 11px; }
      .cc-fl-radar-bar-label { width: 70px; color: #94a3b8; font-size: 10px; }
      .cc-fl-radar-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
      .cc-fl-radar-bar-fill { height: 100%; border-radius: 4px; }
      .cc-fl-radar-bar-you { background: linear-gradient(90deg, #0ea5e9, #3b82f6); }
      .cc-fl-radar-bar-peer { background: rgba(148,163,184,0.5); }
      .cc-fl-radar-bar-top { background: rgba(34,197,94,0.6); }
      .cc-fl-radar-bar-val { width: 36px; text-align: right; color: #cbd5e1; font-weight: 600; }
      .cc-fl-policy-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 8px; }
      .cc-fl-policy-icon { font-size: 20px; }
      .cc-fl-policy-name { font-size: 13px; font-weight: 700; color: #fff; }
      .cc-fl-policy-desc { font-size: 11px; color: #94a3b8; margin-top: 2px; line-height: 1.5; }
      .cc-fl-policy-enforced { font-size: 10px; color: #64748b; margin-top: 4px; }
      .cc-fl-timeline { position: relative; padding-left: 28px; }
      .cc-fl-timeline::before { content: ''; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: rgba(14,165,233,0.2); }
      .cc-fl-timeline-item { position: relative; padding: 10px 0 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
      .cc-fl-timeline-item:last-child { border-bottom: none; }
      .cc-fl-timeline-item::before { content: ''; position: absolute; left: -22px; top: 14px; width: 12px; height: 12px; border-radius: 50%; background: #0ea5e9; border: 2px solid rgba(8,10,16,1); }
      .cc-fl-timeline-event { font-size: 13px; color: #e2e8f0; font-weight: 600; }
      .cc-fl-timeline-cat { display: inline-block; padding: 1px 8px; border-radius: 8px; font-size: 9px; font-weight: 700; text-transform: uppercase; margin-left: 6px; background: rgba(14,165,233,0.15); color: #0ea5e9; }
      .cc-fl-timeline-meta { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-fl-node-region { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; background: rgba(14,165,233,0.08); color: #0ea5e9; }
      @media (max-width: 767px) {
        .cc-fl-modal { flex-direction: column; }
        .cc-fl-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-fl-sidebar-brand { display: none; }
        .cc-fl-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-fl-nav-item.active { border-bottom-color: #0ea5e9; border-left-color: transparent; }
        .cc-fl-main { padding: 12px 12px 20px; }
        .cc-fl-cards { grid-template-columns: repeat(2, 1fr); }
        .cc-fl-chart { height: 160px; }
      }
      /* Light mode overrides */
      html:not(.dark) .cc-fl-modal { background: rgba(248,250,252,0.99); color: #1e293b; }
      html:not(.dark) .cc-fl-sidebar { background: rgba(241,245,249,0.8); border-right-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-fl-sidebar-title { color: #0f172a; }
      html:not(.dark) .cc-fl-nav-item { color: #64748b; }
      html:not(.dark) .cc-fl-nav-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
      html:not(.dark) .cc-fl-nav-item.active { background: rgba(14,165,233,0.08); color: #0284c7; }
      html:not(.dark) .cc-fl-page-title { color: #0f172a; }
      html:not(.dark) .cc-fl-header { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-fl-card { background: rgba(14,165,233,0.04); border-color: rgba(14,165,233,0.15); }
      html:not(.dark) .cc-fl-card-label { color: #64748b; }
      html:not(.dark) .cc-fl-card-value { color: #0f172a; }
      html:not(.dark) .cc-fl-card-delta { color: #64748b; }
      html:not(.dark) .cc-fl-section { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-fl-section-title { color: #1e293b; }
      html:not(.dark) .cc-fl-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-fl-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-fl-table tr:hover td { background: rgba(14,165,233,0.04); }
      html:not(.dark) .cc-fl-scroll { border-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-fl-model-card { background: rgba(14,165,233,0.04); border-color: rgba(14,165,233,0.15); }
      html:not(.dark) .cc-fl-model-name { color: #0f172a; }
      html:not(.dark) .cc-fl-model-desc { color: #64748b; }
      html:not(.dark) .cc-fl-model-stats { color: #64748b; }
      html:not(.dark) .cc-fl-radar-card { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-fl-radar-metric { color: #0f172a; }
      html:not(.dark) .cc-fl-radar-bar-label { color: #64748b; }
      html:not(.dark) .cc-fl-radar-bar-val { color: #334155; }
      html:not(.dark) .cc-fl-policy-row { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-fl-policy-name { color: #0f172a; }
      html:not(.dark) .cc-fl-policy-desc { color: #64748b; }
      html:not(.dark) .cc-fl-timeline-event { color: #1e293b; }
      html:not(.dark) .cc-fl-progress { background: rgba(0,0,0,0.06); }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    const db = initDatabase();
    const overlay = document.createElement('div');
    overlay.id = 'cc-fl-overlay';
    overlay.className = 'cc-fl-modal';
    overlay.innerHTML = `
      <button class="cc-fl-close" onclick="window.__ccFL.close()">×</button>
      <div class="cc-fl-sidebar">
        <div class="cc-fl-sidebar-brand">
          <div class="cc-fl-sidebar-title">🌐 Federated AI</div>
          <div class="cc-fl-sidebar-sub">${db.nodes.length} nodes · ${db.models.length} models</div>
        </div>
        <button class="cc-fl-nav-item ${currentView === 'overview' ? 'active' : ''}" onclick="window.__ccFL.setView('overview')"><span class="cc-fl-nav-icon">📊</span> Overview</button>
        <button class="cc-fl-nav-item ${currentView === 'training' ? 'active' : ''}" onclick="window.__ccFL.setView('training')"><span class="cc-fl-nav-icon">🎯</span> Model Training</button>
        <button class="cc-fl-nav-item ${currentView === 'privacy' ? 'active' : ''}" onclick="window.__ccFL.setView('privacy')"><span class="cc-fl-nav-icon">🔒</span> Privacy & Governance</button>
        <button class="cc-fl-nav-item ${currentView === 'benchmark' ? 'active' : ''}" onclick="window.__ccFL.setView('benchmark')"><span class="cc-fl-nav-icon">⚖️</span> Benchmarking</button>
        <button class="cc-fl-nav-item ${currentView === 'nodes' ? 'active' : ''}" onclick="window.__ccFL.setView('nodes')"><span class="cc-fl-nav-icon">🌐</span> Node Network</button>
      </div>
      <div class="cc-fl-main" id="cc-fl-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const c = document.getElementById('cc-fl-content');
    if (!c) return;
    if (currentView === 'overview') renderOverview(c);
    else if (currentView === 'training') renderTraining(c);
    else if (currentView === 'privacy') renderPrivacy(c);
    else if (currentView === 'benchmark') renderBenchmark(c);
    else if (currentView === 'nodes') renderNodes(c);
    document.querySelectorAll('.cc-fl-nav-item').forEach(function(item) {
      var onclick = item.getAttribute('onclick') || '';
      item.classList.toggle('active', onclick.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // OVERVIEW
  // ------------------------------------------------------------------
  function renderOverview(c) {
    const db = initDatabase();
    const prodModels = db.models.filter(function(m) { return m.status === 'production'; }).length;
    const activeNodes = db.nodes.filter(function(n) { return n.status === 'active'; }).length;
    const avgAcc = db.models.reduce(function(s, m) { return s + m.accuracy; }, 0) / db.models.length;
    const totalSamples = db.nodes.reduce(function(s, n) { return s + n.samples; }, 0);
    c.innerHTML = `
      <div class="cc-fl-header">
        <h2 class="cc-fl-page-title">🌐 Federated Learning Overview <span class="cc-fl-page-badge">PRIVACY-PRESERVING AI</span></h2>
        <div class="cc-fl-live-indicator"><div class="cc-fl-live-dot"></div> Training in progress</div>
      </div>
      <div class="cc-fl-cards">
        <div class="cc-fl-card"><div class="cc-fl-card-label">Active Models</div><div class="cc-fl-card-value">${db.models.length}</div><div class="cc-fl-card-delta">${prodModels} in production</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Federated Nodes</div><div class="cc-fl-card-value">${activeNodes}</div><div class="cc-fl-card-delta">across 6 regions</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Avg Accuracy</div><div class="cc-fl-card-value" style="color:#22c55e">${avgAcc.toFixed(1)}%</div><div class="cc-fl-card-delta">across all models</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Privacy Score</div><div class="cc-fl-card-value" style="color:#0ea5e9">9.4/10</div><div class="cc-fl-card-delta">DP-SGD ε=2.4</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Total Samples</div><div class="cc-fl-card-value">${(totalSamples / 1e6).toFixed(1)}M</div><div class="cc-fl-card-delta">federated training data</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Training Rounds</div><div class="cc-fl-card-value">${db.models.reduce(function(s, m) { return s + m.rounds; }, 0)}</div><div class="cc-fl-card-delta">cumulative</div></div>
      </div>
      <div class="cc-fl-section">
        <div class="cc-fl-section-title">🤖 Active Models</div>
        ${db.models.map(function(m) {
          return '<div class="cc-fl-model-card"><div class="cc-fl-model-header"><div style="flex:1;min-width:240px"><div class="cc-fl-model-name">' + m.name + '</div><div class="cc-fl-model-desc">' + m.desc + '</div></div><span class="cc-fl-status cc-fl-status-' + m.status + '">' + m.status + '</span></div><div class="cc-fl-model-stats"><div class="cc-fl-model-stat"><span>Accuracy</span><strong>' + m.accuracy + '%</strong></div><div class="cc-fl-model-stat"><span>Rounds</span><strong>' + m.rounds + '</strong></div><div class="cc-fl-model-stat"><span>Nodes</span><strong>' + m.nodes + '</strong></div><div class="cc-fl-model-stat"><span>Privacy</span><strong style="font-size:12px">' + m.privacy + '</strong></div></div><div class="cc-fl-progress"><div class="cc-fl-progress-bar" style="width:' + m.accuracy + '%"></div></div></div>';
        }).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // TRAINING VIEW
  // ------------------------------------------------------------------
  function renderTraining(c) {
    const db = initDatabase();
    const lastRound = db.trainingRounds[0];
    const firstRound = db.trainingRounds[db.trainingRounds.length - 1];
    const improvement = (lastRound.accuracy - firstRound.accuracy).toFixed(1);
    c.innerHTML = `
      <div class="cc-fl-header">
        <h2 class="cc-fl-page-title">🎯 Model Training <span class="cc-fl-page-badge">LIVE ROUNDS</span></h2>
        <div class="cc-fl-live-indicator"><div class="cc-fl-live-dot"></div> Round ${lastRound.round} in progress</div>
      </div>
      <div class="cc-fl-cards">
        <div class="cc-fl-card"><div class="cc-fl-card-label">Latest Round</div><div class="cc-fl-card-value">#${lastRound.round}</div><div class="cc-fl-card-delta">${lastRound.nodes_participating} nodes participated</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Current Accuracy</div><div class="cc-fl-card-value" style="color:#22c55e">${lastRound.accuracy}%</div><div class="cc-fl-card-delta positive">+${improvement}pp over 10 rounds</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Loss</div><div class="cc-fl-card-value" style="color:#0ea5e9">${lastRound.loss}</div><div class="cc-fl-card-delta">converging</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Avg Duration</div><div class="cc-fl-card-value">4m 08s</div><div class="cc-fl-card-delta">per round</div></div>
      </div>
      <div class="cc-fl-section">
        <div class="cc-fl-section-title">📈 Accuracy Curve (Last 10 Rounds)</div>
        <div class="cc-fl-chart">
          ${db.trainingRounds.slice().reverse().map(function(r) {
            var h = Math.round((r.accuracy - 88) / 8 * 170);
            return '<div class="cc-fl-chart-bar" style="height:' + h + 'px" title="Round ' + r.round + ': ' + r.accuracy + '%"><span class="cc-fl-chart-bar-label">R' + r.round + '</span></div>';
          }).join('')}
        </div>
        <div style="font-size:11px;color:#64748b;text-align:center;margin-top:24px">Accuracy progression from Round ${firstRound.round} (${firstRound.accuracy}%) to Round ${lastRound.round} (${lastRound.accuracy}%)</div>
      </div>
      <div class="cc-fl-section">
        <div class="cc-fl-section-title">🔄 Recent Training Rounds</div>
        <div class="cc-fl-scroll">
          <table class="cc-fl-table">
            <thead><tr><th>Round</th><th>Timestamp</th><th>Nodes</th><th>Accuracy</th><th>Loss</th><th>ε (Privacy)</th><th>δ</th><th>Samples</th><th>Duration</th></tr></thead>
            <tbody>
              ${db.trainingRounds.map(function(r) {
                return '<tr><td style="font-weight:700;color:#0ea5e9">#' + r.round + '</td><td style="font-size:10px;color:#64748b">' + formatDate(r.ts) + '</td><td style="text-align:center">' + r.nodes_participating + '</td><td style="color:#22c55e;font-weight:700">' + r.accuracy + '%</td><td>' + r.loss + '</td><td>' + r.epsilon + '</td><td>' + r.delta + '</td><td>' + (r.samples / 1e6).toFixed(2) + 'M</td><td>' + r.duration + '</td></tr>';
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // PRIVACY & GOVERNANCE VIEW
  // ------------------------------------------------------------------
  function renderPrivacy(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-fl-header">
        <h2 class="cc-fl-page-title">🔒 Privacy & Governance <span class="cc-fl-page-badge">DP-SGD ACTIVE</span></h2>
      </div>
      <div class="cc-fl-cards">
        <div class="cc-fl-card"><div class="cc-fl-card-label">Privacy Score</div><div class="cc-fl-card-value" style="color:#22c55e">9.4/10</div><div class="cc-fl-card-delta">industry-leading</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">ε (Epsilon)</div><div class="cc-fl-card-value" style="color:#0ea5e9">2.4</div><div class="cc-fl-card-delta">stringent (target < 5.0)</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">δ (Delta)</div><div class="cc-fl-card-value">1e-5</div><div class="cc-fl-card-delta">negligible leak probability</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Policies Enforced</div><div class="cc-fl-card-value" style="color:#22c55e">${db.policies.length}</div><div class="cc-fl-card-delta">all enabled</div></div>
      </div>
      <div class="cc-fl-section">
        <div class="cc-fl-section-title">🛡️ Data Sharing Policies</div>
        ${db.policies.map(function(p) {
          return '<div class="cc-fl-policy-row"><div class="cc-fl-policy-icon">🔒</div><div style="flex:1"><div class="cc-fl-policy-name">' + p.name + ' <span class="cc-fl-status cc-fl-status-enabled" style="margin-left:6px">' + p.status + '</span></div><div class="cc-fl-policy-desc">' + p.desc + '</div><div class="cc-fl-policy-enforced">Enforced: ' + p.enforced + '</div></div></div>';
        }).join('')}
      </div>
      <div class="cc-fl-section">
        <div class="cc-fl-section-title">📜 Model Audit Trail</div>
        <div class="cc-fl-timeline">
          ${db.auditTrail.map(function(t) {
            return '<div class="cc-fl-timeline-item"><div class="cc-fl-timeline-event">' + t.event + '<span class="cc-fl-timeline-cat">' + t.category + '</span></div><div class="cc-fl-timeline-meta">' + formatDate(t.ts) + '</div></div>';
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // BENCHMARK VIEW
  // ------------------------------------------------------------------
  function renderBenchmark(c) {
    const db = initDatabase();
    const youWins = db.peerBenchmark.filter(function(b) { return b.you >= b.top_quartile; }).length;
    c.innerHTML = `
      <div class="cc-fl-header">
        <h2 class="cc-fl-page-title">⚖️ Anonymous Peer Benchmarking <span class="cc-fl-page-badge">CONFIDENTIAL</span></h2>
      </div>
      <div class="cc-fl-cards">
        <div class="cc-fl-card"><div class="cc-fl-card-label">Top Quartile</div><div class="cc-fl-card-value" style="color:#22c55e">${youWins}/${db.peerBenchmark.length}</div><div class="cc-fl-card-delta">metrics beat top quartile</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Peer Group Size</div><div class="cc-fl-card-value">142</div><div class="cc-fl-card-delta">anonymous organizations</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Your Percentile</div><div class="cc-fl-card-value" style="color:#0ea5e9">87th</div><div class="cc-fl-card-delta">aggregate ranking</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Industry</div><div class="cc-fl-card-value">SC & Logistics</div><div class="cc-fl-card-delta">vertical benchmark</div></div>
      </div>
      <div class="cc-fl-section">
        <div class="cc-fl-section-title">📊 Metric Comparison (You vs Peers vs Top Quartile)</div>
        <div class="cc-fl-radar">
          ${db.peerBenchmark.map(function(b) {
            var maxVal = Math.max(b.you, b.peers_avg, b.top_quartile) * 1.1;
            return '<div class="cc-fl-radar-card"><div class="cc-fl-radar-metric">' + b.metric + '</div><div class="cc-fl-radar-bar-wrap"><div class="cc-fl-radar-bar-row"><div class="cc-fl-radar-bar-label">You</div><div class="cc-fl-radar-bar"><div class="cc-fl-radar-bar-fill cc-fl-radar-bar-you" style="width:' + (b.you / maxVal * 100) + '%"></div></div><div class="cc-fl-radar-bar-val">' + b.you + '</div></div><div class="cc-fl-radar-bar-row"><div class="cc-fl-radar-bar-label">Peer Avg</div><div class="cc-fl-radar-bar"><div class="cc-fl-radar-bar-fill cc-fl-radar-bar-peer" style="width:' + (b.peers_avg / maxVal * 100) + '%"></div></div><div class="cc-fl-radar-bar-val">' + b.peers_avg + '</div></div><div class="cc-fl-radar-bar-row"><div class="cc-fl-radar-bar-label">Top 25%</div><div class="cc-fl-radar-bar"><div class="cc-fl-radar-bar-fill cc-fl-radar-bar-top" style="width:' + (b.top_quartile / maxVal * 100) + '%"></div></div><div class="cc-fl-radar-bar-val">' + b.top_quartile + '</div></div></div></div>';
          }).join('')}
        </div>
      </div>
      <div class="cc-fl-section">
        <div class="cc-fl-section-title">💡 Benchmark Insights</div>
        <div style="font-size:12px;color:#94a3b8;line-height:1.7">
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">🥇 <strong style="color:#22c55e">Forecast Accuracy</strong> — you outperform top quartile by 2.7pp. Continue model retraining cadence.</div>
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">🚀 <strong style="color:#22c55e">Training Velocity</strong> — 4.1m/round vs peer avg 6.8m. GPU optimization is paying off.</div>
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">🔒 <strong style="color:#22c55e">Privacy Score</strong> — 9.4/10 leads peer group by 2.2 points. Maintain DP-SGD stringency.</div>
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">🌐 <strong style="color:#22c55e">Node Diversity</strong> — 8.7/10 with 6 regions represented. Top quartile is 7.9.</div>
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">💰 <strong style="color:#f59e0b">Cost Efficiency</strong> — 7.8/10 above peer avg but below top quartile. Review compute allocation.</div>
          <div style="padding:8px 0">⚖️ <strong style="color:#22c55e">Governance Maturity</strong> — 9.1/10, exceeds top quartile. Audit trail completeness at 100%.</div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // NODE NETWORK VIEW
  // ------------------------------------------------------------------
  function renderNodes(c) {
    const db = initDatabase();
    const activeCount = db.nodes.filter(function(n) { return n.status === 'active'; }).length;
    const totalContribution = db.nodes.reduce(function(s, n) { return s + n.contribution; }, 0);
    const avgContribution = Math.round(totalContribution / db.nodes.length);
    const totalSamples = db.nodes.reduce(function(s, n) { return s + n.samples; }, 0);
    const regions = new Set(db.nodes.map(function(n) { return n.region; }));
    c.innerHTML = `
      <div class="cc-fl-header">
        <h2 class="cc-fl-page-title">🌐 Federated Node Network <span class="cc-fl-page-badge">${db.nodes.length} NODES</span></h2>
        <div class="cc-fl-live-indicator"><div class="cc-fl-live-dot"></div> ${activeCount} active nodes</div>
      </div>
      <div class="cc-fl-cards">
        <div class="cc-fl-card"><div class="cc-fl-card-label">Total Nodes</div><div class="cc-fl-card-value">${db.nodes.length}</div><div class="cc-fl-card-delta">${regions.size} regions</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Active</div><div class="cc-fl-card-value" style="color:#22c55e">${activeCount}</div><div class="cc-fl-card-delta">${db.nodes.length - activeCount} paused</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Avg Contribution</div><div class="cc-fl-card-value" style="color:#0ea5e9">${avgContribution}</div><div class="cc-fl-card-delta">score out of 100</div></div>
        <div class="cc-fl-card"><div class="cc-fl-card-label">Total Samples</div><div class="cc-fl-card-value">${(totalSamples / 1e6).toFixed(1)}M</div><div class="cc-fl-card-delta">federated training data</div></div>
      </div>
      <div class="cc-fl-section">
        <div class="cc-fl-section-title">🌐 Participating Organizations</div>
        <div class="cc-fl-scroll">
          <table class="cc-fl-table">
            <thead><tr><th>ID</th><th>Organization</th><th>Region</th><th>Contribution</th><th>Samples</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>
              ${db.nodes.map(function(n) {
                var contributionBar = '<div style="display:flex;align-items:center;gap:8px"><div style="width:60px;height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + n.contribution + '%;background:linear-gradient(90deg,#0ea5e9,#3b82f6);border-radius:3px"></div></div><span style="font-weight:700;color:#0ea5e9">' + n.contribution + '</span></div>';
                return '<tr><td style="font-family:monospace;font-size:10px;color:#0ea5e9">' + n.id + '</td><td style="font-weight:600;color:#fff">' + n.org + '</td><td><span class="cc-fl-node-region">' + n.region + '</span></td><td>' + contributionBar + '</td><td>' + (n.samples / 1e6).toFixed(2) + 'M</td><td><span class="cc-fl-status cc-fl-status-' + n.status + '">' + n.status + '</span></td><td style="font-size:10px;color:#64748b">' + n.joined + '</td></tr>';
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="cc-fl-section">
        <div class="cc-fl-section-title">🗺️ Regional Distribution</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
          ${Array.from(regions).map(function(region) {
            var regionNodes = db.nodes.filter(function(n) { return n.region === region; });
            var regionSamples = regionNodes.reduce(function(s, n) { return s + n.samples; }, 0);
            return '<div class="cc-fl-radar-card"><div class="cc-fl-radar-metric">' + region + '</div><div style="font-size:11px;color:#94a3b8;margin-top:4px">' + regionNodes.length + ' nodes · ' + (regionSamples / 1e6).toFixed(2) + 'M samples</div><div class="cc-fl-progress" style="margin-top:8px"><div class="cc-fl-progress-bar" style="width:' + Math.round(regionNodes.length / db.nodes.length * 100) + '%"></div></div></div>';
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-fl-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-fl-overlay');
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
    window.__ccFL = { open: open, close: close, setView: setView };

    function injectButton() {
      if (document.getElementById('cc-fl-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-fl-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 800px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #0ea5e9, #3b82f6)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Federated AI';
      btn.setAttribute('aria-label', 'Open federated learning dashboard');
      btn.title = 'Open Federated Learning (press L)';
      btn.onclick = open;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(14, 165, 233, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-fl-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-fl-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 8000); });
    } else {
      setTimeout(tryInject, 8000);
    }

    document.addEventListener('keydown', function(e) {
      if ((e.key === 'l' || e.key === 'L') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-fl-overlay')) { open(); e.preventDefault(); }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
