// ====================================================================
// supplier-management.js — Global Supplier Management Module
// ====================================================================
// Comprehensive supplier management with:
//   1. Supplier profiles (847 suppliers — name, country, category, tier, value)
//   2. Performance scoring (on-time delivery, quality, cost, responsiveness)
//   3. Risk assessment (financial, operational, geopolitical, compliance)
//   4. Contract management (active contracts, expiry dates, value)
//   5. Compliance status (ISO, GDPR, certifications)
//   6. Supplier comparison matrix (side-by-side compare)
//   7. Filter tabs: All / Tier 1 / Tier 2 / Tier 3 / At Risk / High Performer
//   8. Analytics charts: by tier, by risk level
//   9. CSV export, bulk actions, search
//
// Architecture: reuses IIFE + modal + table + chart patterns from dispatch-dashboard.js
// Data: synthetic, persisted to localStorage
// ====================================================================
(function() {
  'use strict';

  if (window.__supplierMgmtLoaded) return;
  window.__supplierMgmtLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_supplier_db_v1';

  function generateId(prefix) {
    return prefix + '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(a) {
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'k';
    return '$' + a.toFixed(0);
  }

  // ------------------------------------------------------------------
  // STATIC DATA
  // ------------------------------------------------------------------
  const SUPPLIER_NAMES_A = ['Global', 'Pacific', 'Atlantic', 'Nordic', 'Summit', 'Apex', 'Vertex', 'Pinnacle', 'Meridian', 'Sterling', 'Cardinal', 'Imperial', 'Alliance', 'Pioneer', 'Frontier', 'Heritage', 'Liberty', 'Crown', 'Prime', 'Summit'];
  const SUPPLIER_NAMES_B = ['Industries', 'Manufacturing', 'Logistics', 'Technologies', 'Materials', 'Components', 'Systems', 'Solutions', 'Supplies', 'Group', 'Holdings', 'Trading', 'Corp', 'Partners', 'International', 'Enterprises', 'Works', 'Fabrication', 'Distribution', 'Networks'];
  const COUNTRIES = [
    { name: 'China', region: 'Asia' },
    { name: 'Germany', region: 'Europe' },
    { name: 'United States', region: 'Americas' },
    { name: 'Japan', region: 'Asia' },
    { name: 'South Korea', region: 'Asia' },
    { name: 'United Kingdom', region: 'Europe' },
    { name: 'France', region: 'Europe' },
    { name: 'Italy', region: 'Europe' },
    { name: 'Netherlands', region: 'Europe' },
    { name: 'Singapore', region: 'Asia' },
    { name: 'Mexico', region: 'Americas' },
    { name: 'Brazil', region: 'Americas' },
    { name: 'India', region: 'Asia' },
    { name: 'Vietnam', region: 'Asia' },
    { name: 'Thailand', region: 'Asia' },
    { name: 'Canada', region: 'Americas' },
    { name: 'Spain', region: 'Europe' },
    { name: 'Sweden', region: 'Europe' },
    { name: 'UAE', region: 'ME/Africa' },
    { name: 'South Africa', region: 'ME/Africa' }
  ];
  const CATEGORIES = ['Electronics', 'Raw Materials', 'Components', 'Logistics', 'Packaging', 'Chemicals', 'Machinery', 'Textiles', 'Pharmaceuticals', 'Automotive Parts', 'Steel & Metals', 'Plastics', 'Energy', 'Food & Beverage'];
  const CERTIFICATIONS = ['ISO 9001', 'ISO 14001', 'ISO 27001', 'ISO 45001', 'GDPR', 'REACH', 'RoHS', 'SA8000', 'OEKO-TEX', 'FDA Registered', 'IATF 16949', 'AS9100'];

  // ------------------------------------------------------------------
  // DATABASE INITIALIZATION
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.suppliers && db.suppliers.length > 0) return db;

    db = {
      suppliers: [],
      contracts: [],
      audits: [],
      meta: { created: new Date().toISOString(), version: 1, lastUpdate: new Date().toISOString() }
    };

    const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];
    const tierWeights = [0.35, 0.45, 0.20];

    for (let i = 0; i < 847; i++) {
      const nameA = SUPPLIER_NAMES_A[Math.floor(Math.random() * SUPPLIER_NAMES_A.length)];
      const nameB = SUPPLIER_NAMES_B[Math.floor(Math.random() * SUPPLIER_NAMES_B.length)];
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

      // Tier weighted distribution
      const rnd = Math.random();
      let tierIdx = 0;
      let cum = 0;
      for (let t = 0; t < tierWeights.length; t++) {
        cum += tierWeights[t];
        if (rnd <= cum) { tierIdx = t; break; }
      }
      const tier = TIERS[tierIdx];

      // Performance metrics — Tier 1 skews higher
      const tierBonus = tierIdx === 0 ? 6 : tierIdx === 1 ? 0 : -6;
      const onTimeDelivery = Math.min(99.5, Math.max(72, Math.round((82 + Math.random() * 16 + tierBonus) * 10) / 10));
      const quality = Math.min(99.5, Math.max(70, Math.round((84 + Math.random() * 14 + tierBonus) * 10) / 10));
      const costCompetitiveness = Math.min(98, Math.max(60, Math.round((72 + Math.random() * 24) * 10) / 10));
      const responsiveness = Math.min(98, Math.max(65, Math.round((78 + Math.random() * 18 + tierBonus) * 10) / 10));

      const performanceScore = Math.round((onTimeDelivery * 0.35 + quality * 0.30 + costCompetitiveness * 0.20 + responsiveness * 0.15) * 10) / 10;

      // Risk metrics (lower = better)
      const financialRisk = Math.min(95, Math.max(8, Math.round((20 + Math.random() * 50 - tierBonus * 1.5) * 10) / 10));
      const operationalRisk = Math.min(90, Math.max(10, Math.round((18 + Math.random() * 45 - tierBonus) * 10) / 10));
      const geopoliticalRisk = country.region === 'ME/Africa' ? Math.round((35 + Math.random() * 45) * 10) / 10 : Math.round((12 + Math.random() * 35) * 10) / 10;
      const complianceRisk = Math.min(88, Math.max(5, Math.round((15 + Math.random() * 40 - tierBonus) * 10) / 10));

      const riskScore = Math.round((financialRisk + operationalRisk + geopoliticalRisk + complianceRisk) / 4 * 10) / 10;

      // Contract value scales with tier
      const baseValue = tierIdx === 0 ? 800000 : tierIdx === 1 ? 200000 : 50000;
      const contractValue = Math.floor(baseValue * (0.3 + Math.random() * 1.8));

      // Contract dates
      const contractStart = new Date(Date.now() - Math.random() * 1095 * 86400000);
      const contractEnd = new Date(contractStart.getTime() + (365 + Math.floor(Math.random() * 730)) * 86400000);

      // Compliance certifications (random subset)
      const certCount = tierIdx === 0 ? 4 + Math.floor(Math.random() * 5) : tierIdx === 1 ? 2 + Math.floor(Math.random() * 4) : 1 + Math.floor(Math.random() * 3);
      const certs = [];
      const certPool = [...CERTIFICATIONS];
      for (let c = 0; c < certCount && certPool.length > 0; c++) {
        const idx = Math.floor(Math.random() * certPool.length);
        certs.push(certPool.splice(idx, 1)[0]);
      }

      const isAtRisk = riskScore > 55;
      const isHighPerformer = performanceScore >= 92 && riskScore < 30;

      db.suppliers.push({
        id: 'SUP-' + String(10001 + i),
        name: nameA + ' ' + nameB + ' ' + (Math.floor(Math.random() * 900) + 100),
        country: country.name,
        region: country.region,
        category: category,
        tier: tier,
        tier_idx: tierIdx,
        contract_value: contractValue,
        performance_score: performanceScore,
        risk_score: riskScore,
        on_time_delivery: onTimeDelivery,
        quality: quality,
        cost_competitiveness: costCompetitiveness,
        responsiveness: responsiveness,
        financial_risk: financialRisk,
        operational_risk: operationalRisk,
        geopolitical_risk: geopoliticalRisk,
        compliance_risk: complianceRisk,
        contract_start: contractStart.toISOString(),
        contract_end: contractEnd.toISOString(),
        certifications: certs,
        is_at_risk: isAtRisk,
        is_high_performer: isHighPerformer,
        active_contracts: Math.floor(Math.random() * 5) + 1,
        last_audit: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString(),
        status: 'active'
      });
    }

    // Generate recent audit records
    for (let i = 0; i < 80; i++) {
      const sup = db.suppliers[Math.floor(Math.random() * db.suppliers.length)];
      db.audits.push({
        id: generateId('aud'),
        supplier_id: sup.id,
        supplier_name: sup.name,
        type: ['Performance', 'Compliance', 'Financial', 'Operational'][Math.floor(Math.random() * 4)],
        result: ['Passed', 'Passed', 'Passed', 'Warning', 'Failed'][Math.floor(Math.random() * 5)],
        score: Math.round((70 + Math.random() * 30) * 10) / 10,
        findings: Math.floor(Math.random() * 8),
        auditor: ['KPMG', 'Deloitte', 'PwC', 'EY', 'Internal QA'][Math.floor(Math.random() * 5)],
        date: new Date(Date.now() - Math.random() * 180 * 86400000).toISOString()
      });
    }

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
  let currentTab = 'all';
  let currentSearch = '';
  let compareList = [];

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-sm-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-sm-styles';
    style.textContent = `
      .cc-sm-modal {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 10006; background: rgba(8,10,16,0.99);
        display: flex; overflow: hidden;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        color: #e2e8f0;
      }
      .cc-sm-sidebar {
        width: 220px; flex-shrink: 0; background: rgba(15,23,42,0.6);
        border-right: 1px solid rgba(255,255,255,0.06);
        padding: 60px 0 20px; overflow-y: auto;
        display: flex; flex-direction: column;
      }
      .cc-sm-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; }
      .cc-sm-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
      .cc-sm-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-sm-nav-item {
        display: flex; align-items: center; gap: 10px;
        padding: 11px 20px; font-size: 13px; font-weight: 600;
        color: #94a3b8; cursor: pointer; transition: all 0.2s;
        border-left: 3px solid transparent; text-decoration: none;
        font-family: inherit; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left;
      }
      .cc-sm-nav-item:hover { background: rgba(255,255,255,0.03); color: #e2e8f0; }
      .cc-sm-nav-item.active { background: rgba(34,197,94,0.08); color: #22c55e; border-left-color: #22c55e; }
      .cc-sm-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-sm-nav-badge { margin-left: auto; font-size: 9px; padding: 1px 6px; border-radius: 8px; background: rgba(239,68,68,0.2); color: #ef4444; font-weight: 700; }
      .cc-sm-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-sm-close {
        position: fixed; top: 16px; right: 20px; z-index: 10007;
        width: 40px; height: 40px; border-radius: 10px;
        background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
        color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1;
        display: flex; align-items: center; justify-content: center;
      }
      .cc-sm-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-sm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 12px; }
      .cc-sm-page-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-sm-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #22c55e, #f59e0b); color: #fff; font-weight: 600; letter-spacing: 0.03em; }
      .cc-sm-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #22c55e; font-weight: 600; }
      .cc-sm-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: cc-sm-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-sm-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

      .cc-sm-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-sm-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px; }
      .cc-sm-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
      .cc-sm-card-value { font-size: 24px; font-weight: 800; color: #fff; }
      .cc-sm-card-delta { font-size: 11px; margin-top: 4px; }
      .cc-sm-delta-up { color: #22c55e; }
      .cc-sm-delta-down { color: #ef4444; }
      .cc-sm-delta-neutral { color: #64748b; }

      .cc-sm-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
      .cc-sm-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }

      .cc-sm-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-sm-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .cc-sm-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-sm-table tr:hover td { background: rgba(34,197,94,0.04); }
      .cc-sm-scroll { max-height: 520px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(34,197,94,0.4) transparent; }
      .cc-sm-scroll::-webkit-scrollbar { width: 8px; }
      .cc-sm-scroll::-webkit-scrollbar-track { background: transparent; }
      .cc-sm-scroll::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.3); border-radius: 4px; }

      .cc-sm-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-sm-status-tier1 { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-sm-status-tier2 { background: rgba(6,182,212,0.15); color: #06B6D4; border: 1px solid rgba(6,182,212,0.3); }
      .cc-sm-status-tier3 { background: rgba(148,163,184,0.15); color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); }
      .cc-sm-status-atrisk { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-sm-status-high { background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); }

      .cc-sm-bar-track { display: inline-block; width: 80px; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; vertical-align: middle; margin-right: 6px; }
      .cc-sm-bar-fill { height: 100%; border-radius: 4px; }

      .cc-sm-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
      .cc-sm-tab { padding: 8px 16px; font-size: 12px; font-weight: 600; background: none; border: none; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: inherit; }
      .cc-sm-tab.active { color: #22c55e; border-bottom-color: #22c55e; }
      .cc-sm-tab:hover { color: #e2e8f0; }

      .cc-sm-search { padding: 8px 14px 8px 36px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #fff; font-size: 13px; font-family: inherit; width: 280px; max-width: 100%; box-sizing: border-box; }
      .cc-sm-search:focus { outline: none; border-color: #22c55e; }
      .cc-sm-search-wrap { position: relative; display: inline-block; }
      .cc-sm-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; }

      .cc-sm-bars { display: flex; align-items: flex-end; gap: 6px; height: 140px; padding: 0 4px; }
      .cc-sm-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
      .cc-sm-bar { width: 100%; max-width: 36px; border-radius: 4px 4px 0 0; min-height: 4px; position: relative; cursor: pointer; transition: opacity 0.2s; }
      .cc-sm-bar:hover { opacity: 0.8; }
      .cc-sm-bar-tooltip { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: #1e293b; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; margin-bottom: 4px; z-index: 5; }
      .cc-sm-bar:hover .cc-sm-bar-tooltip { opacity: 1; }
      .cc-sm-bar-label { font-size: 9px; color: #64748b; text-align: center; }
      .cc-sm-bar-value { font-size: 11px; font-weight: 700; color: #e2e8f0; }

      .cc-sm-donut { width: 120px; height: 120px; border-radius: 50%; position: relative; flex-shrink: 0; }
      .cc-sm-donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; }
      .cc-sm-donut-center-value { font-size: 20px; font-weight: 800; color: #fff; }
      .cc-sm-donut-center-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
      .cc-sm-legend { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 160px; }
      .cc-sm-legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
      .cc-sm-legend-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
      .cc-sm-legend-label { color: #cbd5e1; flex: 1; }
      .cc-sm-legend-value { color: #64748b; font-weight: 600; }
      .cc-sm-donut-row { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }

      .cc-sm-btn { padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s; font-family: inherit; display: inline-flex; align-items: center; gap: 4px; }
      .cc-sm-btn-primary { background: linear-gradient(135deg, #22c55e, #f59e0b); color: #fff; }
      .cc-sm-btn-secondary { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
      .cc-sm-btn-danger { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }

      .cc-sm-compare-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .cc-sm-compare-col { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px; }
      .cc-sm-compare-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 12px; }
      .cc-sm-compare-row:last-child { border-bottom: none; }
      .cc-sm-compare-label { color: #64748b; }
      .cc-sm-compare-value { color: #e2e8f0; font-weight: 600; }

      .cc-sm-checkbox { width: 16px; height: 16px; cursor: pointer; }

      @media (max-width: 767px) {
        .cc-sm-modal { flex-direction: column; }
        .cc-sm-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-sm-sidebar-brand { display: none; }
        .cc-sm-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-sm-nav-item.active { border-bottom-color: #22c55e; border-left-color: transparent; }
        .cc-sm-main { padding: 12px 12px 20px; }
        .cc-sm-cards { grid-template-columns: repeat(2, 1fr); }
      }

      /* Light mode overrides */
      html:not(.dark) .cc-sm-modal { background: rgba(248,250,252,0.99); color: #1e293b; }
      html:not(.dark) .cc-sm-sidebar { background: rgba(241,245,249,0.8); border-right-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-sm-sidebar-title { color: #0f172a; }
      html:not(.dark) .cc-sm-nav-item { color: #64748b; }
      html:not(.dark) .cc-sm-nav-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
      html:not(.dark) .cc-sm-nav-item.active { background: rgba(34,197,94,0.08); color: #16a34a; }
      html:not(.dark) .cc-sm-page-title { color: #0f172a; }
      html:not(.dark) .cc-sm-header { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-sm-card { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-sm-card-label { color: #64748b; }
      html:not(.dark) .cc-sm-card-value { color: #0f172a; }
      html:not(.dark) .cc-sm-card-delta { color: #64748b; }
      html:not(.dark) .cc-sm-section { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-sm-section-title { color: #1e293b; }
      html:not(.dark) .cc-sm-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-sm-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-sm-table tr:hover td { background: rgba(34,197,94,0.04); }
      html:not(.dark) .cc-sm-scroll { border-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-sm-search { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.1); color: #1e293b; }
      html:not(.dark) .cc-sm-bar-label { color: #94a3b8; }
      html:not(.dark) .cc-sm-bar-value { color: #1e293b; }
      html:not(.dark) .cc-sm-legend-label { color: #334155; }
      html:not(.dark) .cc-sm-legend-value { color: #64748b; }
      html:not(.dark) .cc-sm-donut-center-value { color: #0f172a; }
      html:not(.dark) .cc-sm-donut-center-label { color: #64748b; }
      html:not(.dark) .cc-sm-btn-secondary { background: rgba(0,0,0,0.04); color: #475569; border-color: rgba(0,0,0,0.1); }
      html:not(.dark) .cc-sm-compare-col { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-sm-compare-label { color: #64748b; }
      html:not(.dark) .cc-sm-compare-value { color: #1e293b; }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    const db = initDatabase();
    const atRiskCount = db.suppliers.filter(s => s.is_at_risk).length;

    const overlay = document.createElement('div');
    overlay.id = 'cc-sm-overlay';
    overlay.className = 'cc-sm-modal';
    overlay.innerHTML = `
      <button class="cc-sm-close" onclick="window.__ccSM.close()">×</button>
      <div class="cc-sm-sidebar">
        <div class="cc-sm-sidebar-brand">
          <div class="cc-sm-sidebar-title">🏭 Supplier Management</div>
          <div class="cc-sm-sidebar-sub">${db.suppliers.length} suppliers tracked</div>
        </div>
        <button class="cc-sm-nav-item ${currentView === 'overview' ? 'active' : ''}" onclick="window.__ccSM.setView('overview')">
          <span class="cc-sm-nav-icon">📊</span> Overview
        </button>
        <button class="cc-sm-nav-item ${currentView === 'directory' ? 'active' : ''}" onclick="window.__ccSM.setView('directory')">
          <span class="cc-sm-nav-icon">📋</span> Supplier Directory
          ${atRiskCount > 0 ? '<span class="cc-sm-nav-badge">' + atRiskCount + '</span>' : ''}
        </button>
        <button class="cc-sm-nav-item ${currentView === 'performance' ? 'active' : ''}" onclick="window.__ccSM.setView('performance')">
          <span class="cc-sm-nav-icon">📈</span> Performance
        </button>
        <button class="cc-sm-nav-item ${currentView === 'risk' ? 'active' : ''}" onclick="window.__ccSM.setView('risk')">
          <span class="cc-sm-nav-icon">⚠️</span> Risk Assessment
        </button>
        <button class="cc-sm-nav-item ${currentView === 'contracts' ? 'active' : ''}" onclick="window.__ccSM.setView('contracts')">
          <span class="cc-sm-nav-icon">📄</span> Contracts
        </button>
        <button class="cc-sm-nav-item ${currentView === 'compliance' ? 'active' : ''}" onclick="window.__ccSM.setView('compliance')">
          <span class="cc-sm-nav-icon">✅</span> Compliance
        </button>
        <button class="cc-sm-nav-item ${currentView === 'compare' ? 'active' : ''}" onclick="window.__ccSM.setView('compare')">
          <span class="cc-sm-nav-icon">⚖️</span> Compare (${compareList.length})
        </button>
        <button class="cc-sm-nav-item ${currentView === 'audits' ? 'active' : ''}" onclick="window.__ccSM.setView('audits')">
          <span class="cc-sm-nav-icon">🔍</span> Audit Trail
        </button>
      </div>
      <div class="cc-sm-main" id="cc-sm-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-sm-content');
    if (!container) return;
    if (currentView === 'overview') renderOverview(container);
    else if (currentView === 'directory') renderDirectory(container);
    else if (currentView === 'performance') renderPerformance(container);
    else if (currentView === 'risk') renderRisk(container);
    else if (currentView === 'contracts') renderContracts(container);
    else if (currentView === 'compliance') renderCompliance(container);
    else if (currentView === 'compare') renderCompare(container);
    else if (currentView === 'audits') renderAudits(container);

    document.querySelectorAll('.cc-sm-nav-item').forEach(item => {
      const onclick = item.getAttribute('onclick') || '';
      item.classList.toggle('active', onclick.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // 1. OVERVIEW
  // ------------------------------------------------------------------
  function renderOverview(container) {
    const db = initDatabase();
    const total = db.suppliers.length;
    const tier1 = db.suppliers.filter(s => s.tier === 'Tier 1').length;
    const tier2 = db.suppliers.filter(s => s.tier === 'Tier 2').length;
    const tier3 = db.suppliers.filter(s => s.tier === 'Tier 3').length;
    const atRisk = db.suppliers.filter(s => s.is_at_risk).length;
    const highPerf = db.suppliers.filter(s => s.is_high_performer).length;
    const avgPerf = Math.round(db.suppliers.reduce((s, x) => s + x.performance_score, 0) / total * 10) / 10;
    const avgRisk = Math.round(db.suppliers.reduce((s, x) => s + x.risk_score, 0) / total * 10) / 10;
    const totalValue = db.suppliers.reduce((s, x) => s + x.contract_value, 0);

    container.innerHTML = `
      <div class="cc-sm-header">
        <h2 class="cc-sm-page-title">📊 Supplier Overview <span class="cc-sm-page-badge">${total} SUPPLIERS</span></h2>
        <div class="cc-sm-live-indicator"><div class="cc-sm-live-dot"></div> Real-time monitoring</div>
      </div>

      <div class="cc-sm-cards">
        <div class="cc-sm-card"><div class="cc-sm-card-label">Total Suppliers</div><div class="cc-sm-card-value">${total}</div><div class="cc-sm-card-delta cc-sm-delta-neutral">${tier1} Tier 1 · ${tier2} Tier 2 · ${tier3} Tier 3</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Avg Performance</div><div class="cc-sm-card-value" style="color:#22c55e">${avgPerf}</div><div class="cc-sm-card-delta cc-sm-delta-up">${highPerf} high performers</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Avg Risk Score</div><div class="cc-sm-card-value" style="color:${avgRisk > 45 ? '#ef4444' : '#f59e0b'}">${avgRisk}</div><div class="cc-sm-card-delta cc-sm-delta-${atRisk > 50 ? 'down' : 'neutral'}">${atRisk} at-risk suppliers</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Total Contract Value</div><div class="cc-sm-card-value">${formatCurrency(totalValue)}</div><div class="cc-sm-card-delta cc-sm-delta-neutral">across all suppliers</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">High Performers</div><div class="cc-sm-card-value" style="color:#22c55e">${highPerf}</div><div class="cc-sm-card-delta cc-sm-delta-up">${Math.round(highPerf / total * 100)}% of network</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">At-Risk Suppliers</div><div class="cc-sm-card-value" style="color:${atRisk > 50 ? '#ef4444' : '#f59e0b'}">${atRisk}</div><div class="cc-sm-card-delta cc-sm-delta-down">requires attention</div></div>
      </div>

      <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px">
        <div class="cc-sm-section" style="flex:1;min-width:300px">
          <div class="cc-sm-section-title">🥧 Suppliers by Tier</div>
          <div class="cc-sm-donut-row">
            ${renderDonut({'Tier 1': tier1, 'Tier 2': tier2, 'Tier 3': tier3}, {'Tier 1': '#22c55e', 'Tier 2': '#06B6D4', 'Tier 3': '#94a3b8'}, total, 'Tiers')}
            <div class="cc-sm-legend">
              <div class="cc-sm-legend-item"><div class="cc-sm-legend-dot" style="background:#22c55e"></div><div class="cc-sm-legend-label">Tier 1 — Strategic</div><div class="cc-sm-legend-value">${tier1} (${Math.round(tier1/total*100)}%)</div></div>
              <div class="cc-sm-legend-item"><div class="cc-sm-legend-dot" style="background:#06B6D4"></div><div class="cc-sm-legend-label">Tier 2 — Preferred</div><div class="cc-sm-legend-value">${tier2} (${Math.round(tier2/total*100)}%)</div></div>
              <div class="cc-sm-legend-item"><div class="cc-sm-legend-dot" style="background:#94a3b8"></div><div class="cc-sm-legend-label">Tier 3 — Approved</div><div class="cc-sm-legend-value">${tier3} (${Math.round(tier3/total*100)}%)</div></div>
            </div>
          </div>
        </div>
        <div class="cc-sm-section" style="flex:1;min-width:300px">
          <div class="cc-sm-section-title">⚠️ Suppliers by Risk Level</div>
          <div class="cc-sm-donut-row">
            ${renderDonut({'Low Risk': db.suppliers.filter(s => s.risk_score < 30).length, 'Medium Risk': db.suppliers.filter(s => s.risk_score >= 30 && s.risk_score < 55).length, 'High Risk': db.suppliers.filter(s => s.risk_score >= 55).length}, {'Low Risk': '#22c55e', 'Medium Risk': '#f59e0b', 'High Risk': '#ef4444'}, total, 'Risk')}
            <div class="cc-sm-legend">
              <div class="cc-sm-legend-item"><div class="cc-sm-legend-dot" style="background:#22c55e"></div><div class="cc-sm-legend-label">Low Risk (&lt;30)</div><div class="cc-sm-legend-value">${db.suppliers.filter(s => s.risk_score < 30).length}</div></div>
              <div class="cc-sm-legend-item"><div class="cc-sm-legend-dot" style="background:#f59e0b"></div><div class="cc-sm-legend-label">Medium Risk (30-55)</div><div class="cc-sm-legend-value">${db.suppliers.filter(s => s.risk_score >= 30 && s.risk_score < 55).length}</div></div>
              <div class="cc-sm-legend-item"><div class="cc-sm-legend-dot" style="background:#ef4444"></div><div class="cc-sm-legend-label">High Risk (&gt;=55)</div><div class="cc-sm-legend-value">${db.suppliers.filter(s => s.risk_score >= 55).length}</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="cc-sm-section">
        <div class="cc-sm-section-title">📈 Top 10 Suppliers by Contract Value</div>
        <div class="cc-sm-bars">
          ${db.suppliers.slice().sort((a,b) => b.contract_value - a.contract_value).slice(0,10).map(s => {
            const maxVal = Math.max(...db.suppliers.map(x => x.contract_value));
            const pct = (s.contract_value / maxVal) * 100;
            return `
              <div class="cc-sm-bar-wrap">
                <div class="cc-sm-bar-value">${formatCurrency(s.contract_value)}</div>
                <div class="cc-sm-bar" style="height:${pct}%;background:linear-gradient(180deg,#22c55e,#f59e0b)">
                  <div class="cc-sm-bar-tooltip">${s.name}: ${formatCurrency(s.contract_value)} · ${s.tier}</div>
                </div>
                <div class="cc-sm-bar-label" style="max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.name.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 2. SUPPLIER DIRECTORY
  // ------------------------------------------------------------------
  function renderDirectory(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-sm-header">
        <h2 class="cc-sm-page-title">📋 Supplier Directory <span class="cc-sm-page-badge">${db.suppliers.length} RECORDS</span></h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <div class="cc-sm-search-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input class="cc-sm-search" placeholder="Search suppliers..." value="${currentSearch}" oninput="window.__ccSM.search(this.value)" />
          </div>
          <button class="cc-sm-btn cc-sm-btn-secondary" onclick="window.__ccSM.exportCSV()">⬇ Export CSV</button>
          <button class="cc-sm-btn cc-sm-btn-primary" onclick="window.__ccSM.clearCompare()">↻ Clear Compare</button>
        </div>
      </div>

      <div class="cc-sm-tabs">
        <button class="cc-sm-tab ${currentTab === 'all' ? 'active' : ''}" onclick="window.__ccSM.setTab('all')">All (${db.suppliers.length})</button>
        <button class="cc-sm-tab ${currentTab === 'tier1' ? 'active' : ''}" onclick="window.__ccSM.setTab('tier1')">Tier 1 (${db.suppliers.filter(s => s.tier === 'Tier 1').length})</button>
        <button class="cc-sm-tab ${currentTab === 'tier2' ? 'active' : ''}" onclick="window.__ccSM.setTab('tier2')">Tier 2 (${db.suppliers.filter(s => s.tier === 'Tier 2').length})</button>
        <button class="cc-sm-tab ${currentTab === 'tier3' ? 'active' : ''}" onclick="window.__ccSM.setTab('tier3')">Tier 3 (${db.suppliers.filter(s => s.tier === 'Tier 3').length})</button>
        <button class="cc-sm-tab ${currentTab === 'at_risk' ? 'active' : ''}" onclick="window.__ccSM.setTab('at_risk')">At Risk (${db.suppliers.filter(s => s.is_at_risk).length})</button>
        <button class="cc-sm-tab ${currentTab === 'high_perf' ? 'active' : ''}" onclick="window.__ccSM.setTab('high_perf')">High Performer (${db.suppliers.filter(s => s.is_high_performer).length})</button>
      </div>

      <div id="cc-sm-table-wrap"></div>
    `;
    renderTable();
  }

  function renderTable() {
    const db = initDatabase();
    let list = db.suppliers;
    if (currentTab === 'tier1') list = list.filter(s => s.tier === 'Tier 1');
    else if (currentTab === 'tier2') list = list.filter(s => s.tier === 'Tier 2');
    else if (currentTab === 'tier3') list = list.filter(s => s.tier === 'Tier 3');
    else if (currentTab === 'at_risk') list = list.filter(s => s.is_at_risk);
    else if (currentTab === 'high_perf') list = list.filter(s => s.is_high_performer);

    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().indexOf(q) !== -1 || s.country.toLowerCase().indexOf(q) !== -1 || s.category.toLowerCase().indexOf(q) !== -1 || s.id.toLowerCase().indexOf(q) !== -1);
    }

    const wrap = document.getElementById('cc-sm-table-wrap');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="cc-sm-scroll">
        <table class="cc-sm-table">
          <thead>
            <tr>
              <th style="width:32px"></th>
              <th>Supplier</th>
              <th>Country</th>
              <th>Category</th>
              <th>Tier</th>
              <th>Contract Value</th>
              <th>Performance</th>
              <th>Risk Score</th>
              <th>On-Time %</th>
              <th>Quality %</th>
              <th>Contract Expiry</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${list.slice(0, 200).map(s => {
              const tierClass = s.tier === 'Tier 1' ? 'cc-sm-status-tier1' : s.tier === 'Tier 2' ? 'cc-sm-status-tier2' : 'cc-sm-status-tier3';
              const perfColor = s.performance_score >= 90 ? '#22c55e' : s.performance_score >= 75 ? '#f59e0b' : '#ef4444';
              const riskColor = s.risk_score < 30 ? '#22c55e' : s.risk_score < 55 ? '#f59e0b' : '#ef4444';
              const checked = compareList.indexOf(s.id) !== -1 ? 'checked' : '';
              const expiryDate = new Date(s.contract_end);
              const expiryStatus = expiryDate < new Date(Date.now() + 90 * 86400000) ? 'color:#ef4444;font-weight:600' : '';
              return `
                <tr>
                  <td><input type="checkbox" class="cc-sm-checkbox" ${checked} onchange="window.__ccSM.toggleCompare('${s.id}')" /></td>
                  <td style="font-weight:600;color:#22c55e" title="${s.name}">${s.name.length > 28 ? s.name.substr(0, 25) + '...' : s.name}<div style="font-size:9px;color:#64748b">${s.id}</div></td>
                  <td>${s.country}<div style="font-size:9px;color:#64748b">${s.region}</div></td>
                  <td>${s.category}</td>
                  <td><span class="cc-sm-status ${tierClass}">${s.tier}</span></td>
                  <td style="text-align:right;font-weight:600">${formatCurrency(s.contract_value)}</td>
                  <td><span class="cc-sm-bar-track"><span class="cc-sm-bar-fill" style="width:${s.performance_score}%;background:${perfColor}"></span></span>${s.performance_score}</td>
                  <td><span class="cc-sm-bar-track"><span class="cc-sm-bar-fill" style="width:${s.risk_score}%;background:${riskColor}"></span></span>${s.risk_score}</td>
                  <td style="text-align:center">${s.on_time_delivery}%</td>
                  <td style="text-align:center">${s.quality}%</td>
                  <td style="${expiryStatus}">${expiryDate.toISOString().substr(0,10)}</td>
                  <td>${s.is_at_risk ? '<span class="cc-sm-status cc-sm-status-atrisk">At Risk</span>' : s.is_high_performer ? '<span class="cc-sm-status cc-sm-status-high">High Perf</span>' : '<span class="cc-sm-status cc-sm-status-tier2">Active</span>'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:8px;font-size:11px;color:#64748b;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <span>Showing ${Math.min(200, list.length)} of ${list.length} suppliers ${compareList.length > 0 ? '· ' + compareList.length + ' selected for comparison' : ''}</span>
        ${compareList.length >= 2 ? '<button class="cc-sm-btn cc-sm-btn-primary" onclick="window.__ccSM.setView(\'compare\')">⚖️ Compare ' + compareList.length + ' Suppliers</button>' : ''}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 3. PERFORMANCE
  // ------------------------------------------------------------------
  function renderPerformance(container) {
    const db = initDatabase();
    const top10 = db.suppliers.slice().sort((a,b) => b.performance_score - a.performance_score).slice(0,10);
    const bottom10 = db.suppliers.slice().sort((a,b) => a.performance_score - b.performance_score).slice(0,10);

    container.innerHTML = `
      <div class="cc-sm-header">
        <h2 class="cc-sm-page-title">📈 Supplier Performance <span class="cc-sm-page-badge">SCORING</span></h2>
      </div>

      <div class="cc-sm-cards">
        <div class="cc-sm-card"><div class="cc-sm-card-label">Avg On-Time Delivery</div><div class="cc-sm-card-value" style="color:#22c55e">${(db.suppliers.reduce((s,x) => s + x.on_time_delivery, 0) / db.suppliers.length).toFixed(1)}%</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Avg Quality Score</div><div class="cc-sm-card-value" style="color:#22c55e">${(db.suppliers.reduce((s,x) => s + x.quality, 0) / db.suppliers.length).toFixed(1)}%</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Avg Cost Competitiveness</div><div class="cc-sm-card-value">${(db.suppliers.reduce((s,x) => s + x.cost_competitiveness, 0) / db.suppliers.length).toFixed(1)}%</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Avg Responsiveness</div><div class="cc-sm-card-value">${(db.suppliers.reduce((s,x) => s + x.responsiveness, 0) / db.suppliers.length).toFixed(1)}%</div></div>
      </div>

      <div class="cc-sm-section">
        <div class="cc-sm-section-title">🏆 Top 10 Performing Suppliers</div>
        <div class="cc-sm-scroll" style="max-height:360px">
          <table class="cc-sm-table">
            <thead><tr><th>Rank</th><th>Supplier</th><th>Tier</th><th>Performance Score</th><th>On-Time</th><th>Quality</th><th>Cost</th><th>Responsive</th></tr></thead>
            <tbody>
              ${top10.map((s, i) => `
                <tr>
                  <td style="font-weight:700;color:#f59e0b">#${i+1}</td>
                  <td style="font-weight:600;color:#22c55e">${s.name}<div style="font-size:9px;color:#64748b">${s.country}</div></td>
                  <td>${s.tier}</td>
                  <td><span class="cc-sm-bar-track"><span class="cc-sm-bar-fill" style="width:${s.performance_score}%;background:#22c55e"></span></span><strong>${s.performance_score}</strong></td>
                  <td style="text-align:center">${s.on_time_delivery}%</td>
                  <td style="text-align:center">${s.quality}%</td>
                  <td style="text-align:center">${s.cost_competitiveness}%</td>
                  <td style="text-align:center">${s.responsiveness}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="cc-sm-section">
        <div class="cc-sm-section-title">⚠️ Bottom 10 — Improvement Needed</div>
        <div class="cc-sm-scroll" style="max-height:360px">
          <table class="cc-sm-table">
            <thead><tr><th>Rank</th><th>Supplier</th><th>Tier</th><th>Performance Score</th><th>On-Time</th><th>Quality</th><th>Cost</th><th>Responsive</th></tr></thead>
            <tbody>
              ${bottom10.map((s, i) => `
                <tr>
                  <td style="font-weight:700;color:#ef4444">#${i+1}</td>
                  <td style="font-weight:600">${s.name}<div style="font-size:9px;color:#64748b">${s.country}</div></td>
                  <td>${s.tier}</td>
                  <td><span class="cc-sm-bar-track"><span class="cc-sm-bar-fill" style="width:${s.performance_score}%;background:#ef4444"></span></span><strong>${s.performance_score}</strong></td>
                  <td style="text-align:center">${s.on_time_delivery}%</td>
                  <td style="text-align:center">${s.quality}%</td>
                  <td style="text-align:center">${s.cost_competitiveness}%</td>
                  <td style="text-align:center">${s.responsiveness}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="cc-sm-section">
        <div class="cc-sm-section-title">📊 Performance Score Distribution</div>
        <div class="cc-sm-bars">
          ${[0,1,2,3,4].map(bucket => {
            const min = 60 + bucket * 8;
            const max = min + 8;
            const count = db.suppliers.filter(s => s.performance_score >= min && s.performance_score < max).length;
            const maxCount = Math.max(...[0,1,2,3,4].map(b => db.suppliers.filter(s => s.performance_score >= 60 + b*8 && s.performance_score < 60 + (b+1)*8).length));
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const color = bucket >= 3 ? '#22c55e' : bucket >= 2 ? '#f59e0b' : '#ef4444';
            return `
              <div class="cc-sm-bar-wrap">
                <div class="cc-sm-bar-value">${count}</div>
                <div class="cc-sm-bar" style="height:${pct}%;background:${color}">
                  <div class="cc-sm-bar-tooltip">${min}-${max} score range: ${count} suppliers</div>
                </div>
                <div class="cc-sm-bar-label">${min}-${max}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4. RISK ASSESSMENT
  // ------------------------------------------------------------------
  function renderRisk(container) {
    const db = initDatabase();
    const highRisk = db.suppliers.filter(s => s.risk_score >= 55).sort((a,b) => b.risk_score - a.risk_score).slice(0, 50);

    container.innerHTML = `
      <div class="cc-sm-header">
        <h2 class="cc-sm-page-title">⚠️ Risk Assessment <span class="cc-sm-page-badge">4-DIMENSIONAL</span></h2>
      </div>

      <div class="cc-sm-cards">
        <div class="cc-sm-card"><div class="cc-sm-card-label">Avg Financial Risk</div><div class="cc-sm-card-value" style="color:#f59e0b">${(db.suppliers.reduce((s,x) => s + x.financial_risk, 0) / db.suppliers.length).toFixed(1)}</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Avg Operational Risk</div><div class="cc-sm-card-value" style="color:#f59e0b">${(db.suppliers.reduce((s,x) => s + x.operational_risk, 0) / db.suppliers.length).toFixed(1)}</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Avg Geopolitical Risk</div><div class="cc-sm-card-value" style="color:#ef4444">${(db.suppliers.reduce((s,x) => s + x.geopolitical_risk, 0) / db.suppliers.length).toFixed(1)}</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Avg Compliance Risk</div><div class="cc-sm-card-value">${(db.suppliers.reduce((s,x) => s + x.compliance_risk, 0) / db.suppliers.length).toFixed(1)}</div></div>
      </div>

      <div class="cc-sm-section">
        <div class="cc-sm-section-title">📊 Risk Score Distribution</div>
        <div class="cc-sm-bars">
          ${[0,1,2,3,4,5].map(bucket => {
            const min = bucket * 20;
            const max = min + 20;
            const count = db.suppliers.filter(s => s.risk_score >= min && s.risk_score < max).length;
            const maxCount = Math.max(...[0,1,2,3,4,5].map(b => db.suppliers.filter(s => s.risk_score >= b*20 && s.risk_score < (b+1)*20).length));
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const color = bucket <= 1 ? '#22c55e' : bucket <= 3 ? '#f59e0b' : '#ef4444';
            return `
              <div class="cc-sm-bar-wrap">
                <div class="cc-sm-bar-value">${count}</div>
                <div class="cc-sm-bar" style="height:${pct}%;background:${color}">
                  <div class="cc-sm-bar-tooltip">${min}-${max} risk: ${count} suppliers</div>
                </div>
                <div class="cc-sm-bar-label">${min}-${max}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="cc-sm-section">
        <div class="cc-sm-section-title">🚨 High-Risk Suppliers (Risk Score ≥ 55)</div>
        <div class="cc-sm-scroll" style="max-height:480px">
          <table class="cc-sm-table">
            <thead><tr><th>Supplier</th><th>Country</th><th>Tier</th><th>Financial</th><th>Operational</th><th>Geopolitical</th><th>Compliance</th><th>Overall Risk</th></tr></thead>
            <tbody>
              ${highRisk.slice(0, 50).map(s => `
                <tr>
                  <td style="font-weight:600;color:#ef4444">${s.name}<div style="font-size:9px;color:#64748b">${s.id}</div></td>
                  <td>${s.country}</td>
                  <td>${s.tier}</td>
                  <td style="text-align:center">${s.financial_risk}</td>
                  <td style="text-align:center">${s.operational_risk}</td>
                  <td style="text-align:center">${s.geopolitical_risk}</td>
                  <td style="text-align:center">${s.compliance_risk}</td>
                  <td><span class="cc-sm-status cc-sm-status-atrisk">${s.risk_score}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 5. CONTRACTS
  // ------------------------------------------------------------------
  function renderContracts(container) {
    const db = initDatabase();
    const now = Date.now();
    const expiring90 = db.suppliers.filter(s => new Date(s.contract_end).getTime() < now + 90 * 86400000 && new Date(s.contract_end).getTime() > now);
    const expiring30 = db.suppliers.filter(s => new Date(s.contract_end).getTime() < now + 30 * 86400000 && new Date(s.contract_end).getTime() > now);
    const expired = db.suppliers.filter(s => new Date(s.contract_end).getTime() < now);

    container.innerHTML = `
      <div class="cc-sm-header">
        <h2 class="cc-sm-page-title">📄 Contract Management <span class="cc-sm-page-badge">${db.suppliers.length} CONTRACTS</span></h2>
      </div>

      <div class="cc-sm-cards">
        <div class="cc-sm-card"><div class="cc-sm-card-label">Total Contract Value</div><div class="cc-sm-card-value" style="color:#22c55e">${formatCurrency(db.suppliers.reduce((s,x) => s + x.contract_value, 0))}</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Expiring in 30 days</div><div class="cc-sm-card-value" style="color:#ef4444">${expiring30.length}</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Expiring in 90 days</div><div class="cc-sm-card-value" style="color:#f59e0b">${expiring90.length}</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Expired</div><div class="cc-sm-card-value" style="color:#ef4444">${expired.length}</div></div>
      </div>

      <div class="cc-sm-section">
        <div class="cc-sm-section-title">⏰ Contracts Expiring Within 90 Days</div>
        <div class="cc-sm-scroll" style="max-height:520px">
          <table class="cc-sm-table">
            <thead><tr><th>Supplier</th><th>Country</th><th>Tier</th><th>Contract Value</th><th>Start Date</th><th>Expiry Date</th><th>Days Remaining</th><th>Status</th></tr></thead>
            <tbody>
              ${expiring90.concat(expired).sort((a,b) => new Date(a.contract_end) - new Date(b.contract_end)).slice(0,100).map(s => {
                const days = Math.floor((new Date(s.contract_end).getTime() - now) / 86400000);
                const urgency = days < 0 ? '#ef4444' : days < 30 ? '#ef4444' : '#f59e0b';
                const status = days < 0 ? 'Expired' : days < 30 ? 'Critical' : 'Expiring';
                return `
                  <tr>
                    <td style="font-weight:600">${s.name}</td>
                    <td>${s.country}</td>
                    <td>${s.tier}</td>
                    <td style="text-align:right;font-weight:600">${formatCurrency(s.contract_value)}</td>
                    <td>${new Date(s.contract_start).toISOString().substr(0,10)}</td>
                    <td style="color:${urgency};font-weight:600">${new Date(s.contract_end).toISOString().substr(0,10)}</td>
                    <td style="text-align:center;color:${urgency};font-weight:700">${days < 0 ? '(' + Math.abs(days) + ' ago)' : days + ' days'}</td>
                    <td><span class="cc-sm-status ${days < 0 ? 'cc-sm-status-atrisk' : 'cc-sm-status-tier2'}">${status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 6. COMPLIANCE
  // ------------------------------------------------------------------
  function renderCompliance(container) {
    const db = initDatabase();
    const certCounts = {};
    CERTIFICATIONS.forEach(c => {
      certCounts[c] = db.suppliers.filter(s => s.certifications.indexOf(c) !== -1).length;
    });
    const fullCompliant = db.suppliers.filter(s => s.certifications.length >= 5).length;
    const partialCompliant = db.suppliers.filter(s => s.certifications.length >= 2 && s.certifications.length < 5).length;
    const minimalCompliant = db.suppliers.filter(s => s.certifications.length < 2).length;

    container.innerHTML = `
      <div class="cc-sm-header">
        <h2 class="cc-sm-page-title">✅ Compliance Status <span class="cc-sm-page-badge">CERTIFICATIONS</span></h2>
      </div>

      <div class="cc-sm-cards">
        <div class="cc-sm-card"><div class="cc-sm-card-label">Full Compliance (5+ certs)</div><div class="cc-sm-card-value" style="color:#22c55e">${fullCompliant}</div><div class="cc-sm-card-delta cc-sm-delta-up">${Math.round(fullCompliant / db.suppliers.length * 100)}% of network</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Partial Compliance (2-4)</div><div class="cc-sm-card-value" style="color:#f59e0b">${partialCompliant}</div><div class="cc-sm-card-delta cc-sm-delta-neutral">${Math.round(partialCompliant / db.suppliers.length * 100)}% of network</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Minimal Compliance (&lt;2)</div><div class="cc-sm-card-value" style="color:#ef4444">${minimalCompliant}</div><div class="cc-sm-card-delta cc-sm-delta-down">${Math.round(minimalCompliant / db.suppliers.length * 100)}% of network</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">GDPR Compliant</div><div class="cc-sm-card-value">${certCounts['GDPR'] || 0}</div><div class="cc-sm-card-delta cc-sm-delta-neutral">suppliers with GDPR</div></div>
      </div>

      <div class="cc-sm-section">
        <div class="cc-sm-section-title">📋 Certification Coverage</div>
        <div class="cc-sm-bars">
          ${Object.entries(certCounts).map(([cert, count]) => {
            const maxCount = Math.max(...Object.values(certCounts));
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const color = cert.indexOf('ISO') !== -1 ? '#22c55e' : cert === 'GDPR' ? '#06B6D4' : '#f59e0b';
            return `
              <div class="cc-sm-bar-wrap">
                <div class="cc-sm-bar-value">${count}</div>
                <div class="cc-sm-bar" style="height:${pct}%;background:${color}">
                  <div class="cc-sm-bar-tooltip">${cert}: ${count} suppliers (${Math.round(count/db.suppliers.length*100)}%)</div>
                </div>
                <div class="cc-sm-bar-label" style="max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cert}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="cc-sm-section">
        <div class="cc-sm-section-title">🔍 Compliance Distribution</div>
        <div class="cc-sm-donut-row">
          ${renderDonut({'Full': fullCompliant, 'Partial': partialCompliant, 'Minimal': minimalCompliant}, {'Full': '#22c55e', 'Partial': '#f59e0b', 'Minimal': '#ef4444'}, db.suppliers.length, 'Compliance')}
          <div class="cc-sm-legend">
            <div class="cc-sm-legend-item"><div class="cc-sm-legend-dot" style="background:#22c55e"></div><div class="cc-sm-legend-label">Full Compliance (5+ certs)</div><div class="cc-sm-legend-value">${fullCompliant}</div></div>
            <div class="cc-sm-legend-item"><div class="cc-sm-legend-dot" style="background:#f59e0b"></div><div class="cc-sm-legend-label">Partial Compliance (2-4)</div><div class="cc-sm-legend-value">${partialCompliant}</div></div>
            <div class="cc-sm-legend-item"><div class="cc-sm-legend-dot" style="background:#ef4444"></div><div class="cc-sm-legend-label">Minimal Compliance (&lt;2)</div><div class="cc-sm-legend-value">${minimalCompliant}</div></div>
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 7. COMPARE
  // ------------------------------------------------------------------
  function renderCompare(container) {
    const db = initDatabase();
    const selected = db.suppliers.filter(s => compareList.indexOf(s.id) !== -1);

    container.innerHTML = `
      <div class="cc-sm-header">
        <h2 class="cc-sm-page-title">⚖️ Supplier Comparison Matrix <span class="cc-sm-page-badge">${selected.length} SELECTED</span></h2>
        <button class="cc-sm-btn cc-sm-btn-secondary" onclick="window.__ccSM.clearCompare()">Clear All</button>
      </div>

      ${selected.length < 2 ? `
        <div class="cc-sm-section" style="text-align:center;padding:60px 20px">
          <div style="font-size:48px;margin-bottom:12px">⚖️</div>
          <div style="font-size:16px;color:#e2e8f0;font-weight:600;margin-bottom:8px">Select 2 or more suppliers to compare</div>
          <div style="font-size:13px;color:#64748b">Use the checkboxes in the Supplier Directory to add suppliers to the comparison matrix.</div>
          <button class="cc-sm-btn cc-sm-btn-primary" style="margin-top:16px" onclick="window.__ccSM.setView('directory')">Go to Directory</button>
        </div>
      ` : `
        <div class="cc-sm-compare-grid">
          ${selected.map(s => {
            const tierClass = s.tier === 'Tier 1' ? 'cc-sm-status-tier1' : s.tier === 'Tier 2' ? 'cc-sm-status-tier2' : 'cc-sm-status-tier3';
            const perfColor = s.performance_score >= 90 ? '#22c55e' : s.performance_score >= 75 ? '#f59e0b' : '#ef4444';
            const riskColor = s.risk_score < 30 ? '#22c55e' : s.risk_score < 55 ? '#f59e0b' : '#ef4444';
            return `
              <div class="cc-sm-compare-col">
                <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08)">
                  <div style="font-size:14px;font-weight:700;color:#22c55e">${s.name}</div>
                  <div style="font-size:10px;color:#64748b;margin-top:2px">${s.id}</div>
                  <span class="cc-sm-status ${tierClass}" style="margin-top:6px;display:inline-block">${s.tier}</span>
                </div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Country</div><div class="cc-sm-compare-value">${s.country}</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Category</div><div class="cc-sm-compare-value">${s.category}</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Contract Value</div><div class="cc-sm-compare-value">${formatCurrency(s.contract_value)}</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Performance Score</div><div class="cc-sm-compare-value" style="color:${perfColor}">${s.performance_score}</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Risk Score</div><div class="cc-sm-compare-value" style="color:${riskColor}">${s.risk_score}</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">On-Time Delivery</div><div class="cc-sm-compare-value">${s.on_time_delivery}%</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Quality Score</div><div class="cc-sm-compare-value">${s.quality}%</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Cost Competitiveness</div><div class="cc-sm-compare-value">${s.cost_competitiveness}%</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Responsiveness</div><div class="cc-sm-compare-value">${s.responsiveness}%</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Financial Risk</div><div class="cc-sm-compare-value">${s.financial_risk}</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Operational Risk</div><div class="cc-sm-compare-value">${s.operational_risk}</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Geopolitical Risk</div><div class="cc-sm-compare-value">${s.geopolitical_risk}</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Compliance Risk</div><div class="cc-sm-compare-value">${s.compliance_risk}</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Certifications</div><div class="cc-sm-compare-value" style="font-size:10px">${s.certifications.length} certs</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Contract Expiry</div><div class="cc-sm-compare-value">${new Date(s.contract_end).toISOString().substr(0,10)}</div></div>
                <div class="cc-sm-compare-row"><div class="cc-sm-compare-label">Last Audit</div><div class="cc-sm-compare-value" style="font-size:10px">${new Date(s.last_audit).toISOString().substr(0,10)}</div></div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  }

  // ------------------------------------------------------------------
  // 8. AUDIT TRAIL
  // ------------------------------------------------------------------
  function renderAudits(container) {
    const db = initDatabase();
    const sortedAudits = db.audits.slice().sort((a,b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
      <div class="cc-sm-header">
        <h2 class="cc-sm-page-title">🔍 Audit Trail <span class="cc-sm-page-badge">${db.audits.length} AUDITS</span></h2>
      </div>

      <div class="cc-sm-cards">
        <div class="cc-sm-card"><div class="cc-sm-card-label">Total Audits</div><div class="cc-sm-card-value">${db.audits.length}</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Passed</div><div class="cc-sm-card-value" style="color:#22c55e">${db.audits.filter(a => a.result === 'Passed').length}</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Warnings</div><div class="cc-sm-card-value" style="color:#f59e0b">${db.audits.filter(a => a.result === 'Warning').length}</div></div>
        <div class="cc-sm-card"><div class="cc-sm-card-label">Failed</div><div class="cc-sm-card-value" style="color:#ef4444">${db.audits.filter(a => a.result === 'Failed').length}</div></div>
      </div>

      <div class="cc-sm-section">
        <div class="cc-sm-section-title">📜 Recent Audit Records</div>
        <div class="cc-sm-scroll" style="max-height:560px">
          <table class="cc-sm-table">
            <thead><tr><th>Date</th><th>Supplier</th><th>Type</th><th>Auditor</th><th>Score</th><th>Findings</th><th>Result</th></tr></thead>
            <tbody>
              ${sortedAudits.slice(0, 100).map(a => {
                const resultClass = a.result === 'Passed' ? 'cc-sm-status-high' : a.result === 'Warning' ? 'cc-sm-status-tier2' : 'cc-sm-status-atrisk';
                return `
                  <tr>
                    <td>${formatDate(a.date)}</td>
                    <td style="font-weight:600">${a.supplier_name}</td>
                    <td>${a.type}</td>
                    <td>${a.auditor}</td>
                    <td style="text-align:center;font-weight:600">${a.score}</td>
                    <td style="text-align:center">${a.findings}</td>
                    <td><span class="cc-sm-status ${resultClass}">${a.result}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // DONUT CHART HELPER
  // ------------------------------------------------------------------
  function renderDonut(counts, colors, total, centerLabel) {
    const entries = Object.entries(counts).filter(([k, v]) => v > 0);
    if (entries.length === 0 || total === 0) {
      return `<div class="cc-sm-donut" style="background:#1e293b"><div class="cc-sm-donut-center"><div class="cc-sm-donut-center-value">0</div><div class="cc-sm-donut-center-label">${centerLabel}</div></div></div>`;
    }
    let gradientParts = [];
    let cumulative = 0;
    entries.forEach(([key, count]) => {
      const pct = (count / total) * 100;
      const color = colors[key] || '#64748b';
      gradientParts.push(`${color} ${cumulative}% ${cumulative + pct}%`);
      cumulative += pct;
    });
    return `<div class="cc-sm-donut" style="background:conic-gradient(${gradientParts.join(', ')})">
      <div class="cc-sm-donut-center" style="background:#0a0e1a;width:80px;height:80px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div class="cc-sm-donut-center-value">${total}</div>
        <div class="cc-sm-donut-center-label">${centerLabel}</div>
      </div>
    </div>`;
  }

  // ------------------------------------------------------------------
  // CSV EXPORT
  // ------------------------------------------------------------------
  function exportCSV() {
    const db = initDatabase();
    const headers = ['ID', 'Name', 'Country', 'Region', 'Category', 'Tier', 'Contract Value', 'Performance Score', 'Risk Score', 'On-Time %', 'Quality %', 'Cost %', 'Responsiveness %', 'Contract End', 'Certifications'];
    const rows = db.suppliers.map(s => [
      s.id, s.name, s.country, s.region, s.category, s.tier,
      s.contract_value, s.performance_score, s.risk_score,
      s.on_time_delivery, s.quality, s.cost_competitiveness, s.responsiveness,
      new Date(s.contract_end).toISOString().substr(0, 10),
      s.certifications.join('|')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suppliers-export-' + new Date().toISOString().substr(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-sm-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-sm-overlay');
    if (overlay) overlay.remove();
  }

  function setView(view) {
    currentView = view;
    renderContent();
  }

  function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.cc-sm-tab').forEach(t => t.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    renderTable();
  }

  function search(q) {
    currentSearch = q;
    renderTable();
  }

  function toggleCompare(id) {
    const idx = compareList.indexOf(id);
    if (idx === -1) {
      if (compareList.length >= 4) {
        alert('You can compare up to 4 suppliers at a time.');
        const cb = event && event.target;
        if (cb) cb.checked = false;
        return;
      }
      compareList.push(id);
    } else {
      compareList.splice(idx, 1);
    }
    // Update badge count in sidebar
    const compareNav = document.querySelectorAll('.cc-sm-nav-item');
    compareNav.forEach(n => {
      if ((n.getAttribute('onclick') || '').indexOf("'compare'") !== -1) {
        const icon = n.querySelector('.cc-sm-nav-icon');
        if (icon) {
          n.innerHTML = '<span class="cc-sm-nav-icon">⚖️</span> Compare (' + compareList.length + ')';
        }
      }
    });
    // Update footer
    const wrap = document.getElementById('cc-sm-table-wrap');
    if (wrap) renderTable();
  }

  function clearCompare() {
    compareList = [];
    document.querySelectorAll('.cc-sm-checkbox').forEach(cb => cb.checked = false);
    if (currentView === 'compare') renderContent();
    else renderTable();
    // Update sidebar badge
    const compareNav = document.querySelectorAll('.cc-sm-nav-item');
    compareNav.forEach(n => {
      if ((n.getAttribute('onclick') || '').indexOf("'compare'") !== -1) {
        n.innerHTML = '<span class="cc-sm-nav-icon">⚖️</span> Compare (0)';
      }
    });
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    window.__ccSM = { open, close, setView, setTab, search, toggleCompare, clearCompare, exportCSV };

    function injectButton() {
      if (document.getElementById('cc-sm-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-sm-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 260px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #22c55e, #f59e0b)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Suppliers';
      btn.setAttribute('aria-label', 'Open supplier management module');
      btn.title = 'Open Supplier Management (press S)';
      btn.onclick = open;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-sm-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-sm-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 3500); });
    } else {
      setTimeout(tryInject, 3500);
    }

    // Keyboard shortcut: press "S" to open supplier management
    document.addEventListener('keydown', function(e) {
      if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-sm-overlay')) { open(); e.preventDefault(); }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
