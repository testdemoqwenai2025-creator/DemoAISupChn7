// ====================================================================
// compliance-monitoring.js — Global Regulatory Compliance Monitoring
// ====================================================================
// Multi-region compliance with:
//   1. Compliance scorecard per region (Europe, Americas, Asia, ME/Africa)
//   2. Regulations tracked: GDPR, ISO 27001, ISO 9001, REACH, Customs, SOX, CCPA, PDPA
//   3. Each regulation: status, score, last audit, next audit, findings
//   4. Audit trail timeline
//   5. Automated compliance alerts
//   6. Compliance donut chart by status
//   7. Regional compliance heatmap (bar chart)
//   8. Filter tabs: All / Compliant / Warning / Non-Compliant
//
// Architecture: reuses IIFE + modal + table + chart patterns from dispatch-dashboard.js
// Data: synthetic, persisted to localStorage
// ====================================================================
(function() {
  'use strict';

  if (window.__complianceMonitorLoaded) return;
  window.__complianceMonitorLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_compliance_db_v1';

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
  // STATIC REFERENCE DATA
  // ------------------------------------------------------------------
  const REGIONS = [
    { id: 'eu', name: 'Europe', icon: '🇪🇺' },
    { id: 'am', name: 'Americas', icon: '🌎' },
    { id: 'as', name: 'Asia', icon: '🌏' },
    { id: 'me', name: 'ME/Africa', icon: '🌍' }
  ];

  const REGULATIONS = [
    { id: 'gdpr', name: 'GDPR', full_name: 'General Data Protection Regulation', category: 'Data Privacy', regions: ['eu', 'am', 'as'], authority: 'EU Commission' },
    { id: 'iso27001', name: 'ISO 27001', full_name: 'Information Security Management', category: 'Security', regions: ['eu', 'am', 'as', 'me'], authority: 'ISO' },
    { id: 'iso9001', name: 'ISO 9001', full_name: 'Quality Management System', category: 'Quality', regions: ['eu', 'am', 'as', 'me'], authority: 'ISO' },
    { id: 'reach', name: 'REACH', full_name: 'Chemicals Registration & Authorization', category: 'Environmental', regions: ['eu'], authority: 'ECHA' },
    { id: 'customs', name: 'Customs', full_name: 'Customs Trade Partnership', category: 'Trade', regions: ['eu', 'am', 'as', 'me'], authority: 'WCO' },
    { id: 'sox', name: 'SOX', full_name: 'Sarbanes-Oxley Act', category: 'Financial', regions: ['am'], authority: 'SEC' },
    { id: 'ccpa', name: 'CCPA', full_name: 'California Consumer Privacy Act', category: 'Data Privacy', regions: ['am'], authority: 'California AG' },
    { id: 'pdpa', name: 'PDPA', full_name: 'Personal Data Protection Act', category: 'Data Privacy', regions: ['as'], authority: 'ASEAN' }
  ];

  // ------------------------------------------------------------------
  // DATABASE INITIALIZATION
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.records && db.records.length > 0) return db;

    db = {
      records: [],
      audits: [],
      alerts: [],
      meta: { created: new Date().toISOString(), version: 1, lastUpdate: new Date().toISOString() }
    };

    // Build compliance records for each region × regulation combination
    REGIONS.forEach(region => {
      REGULATIONS.forEach(reg => {
        if (reg.regions.indexOf(region.id) === -1) return;

        // Synthetic scoring with regional bias
        let baseScore = 75 + Math.random() * 20;
        if (region.id === 'eu') baseScore += 4;
        if (region.id === 'me') baseScore -= 8;
        baseScore = Math.max(50, Math.min(99, baseScore));

        const score = Math.round(baseScore * 10) / 10;
        let status;
        if (score >= 85) status = 'compliant';
        else if (score >= 70) status = 'warning';
        else status = 'non-compliant';

        const lastAudit = new Date(Date.now() - (30 + Math.random() * 180) * 86400000);
        const nextAudit = new Date(lastAudit.getTime() + (180 + Math.random() * 180) * 86400000);
        const findings = status === 'compliant' ? Math.floor(Math.random() * 3) : status === 'warning' ? Math.floor(Math.random() * 6) + 2 : Math.floor(Math.random() * 10) + 5;
        const criticalFindings = status === 'non-compliant' ? Math.floor(Math.random() * 3) + 1 : 0;

        db.records.push({
          id: generateId('cm'),
          region_id: region.id,
          region_name: region.name,
          regulation_id: reg.id,
          regulation_name: reg.name,
          regulation_full: reg.full_name,
          category: reg.category,
          authority: reg.authority,
          status: status,
          score: score,
          last_audit: lastAudit.toISOString(),
          next_audit: nextAudit.toISOString(),
          findings: findings,
          critical_findings: criticalFindings,
          remediation_status: status === 'compliant' ? 'complete' : status === 'warning' ? 'in-progress' : 'pending',
          remediation_due: status !== 'compliant' ? new Date(Date.now() + (30 + Math.random() * 60) * 86400000).toISOString() : null,
          owner: ['Legal Team', 'Compliance Officer', 'Regional Director', 'Internal Audit'][Math.floor(Math.random() * 4)]
        });
      });
    });

    // Build audit trail (40 entries)
    const auditActions = ['Compliance audit initiated', 'Finding raised', 'Remediation plan submitted', 'Remediation completed', 'Audit closed', 'Regulation updated', 'Compliance score recalculated', 'Critical finding escalated'];
    for (let i = 0; i < 40; i++) {
      const rec = db.records[Math.floor(Math.random() * db.records.length)];
      db.audits.push({
        id: generateId('aud'),
        region_id: rec.region_id,
        region_name: rec.region_name,
        regulation_name: rec.regulation_name,
        action: auditActions[Math.floor(Math.random() * auditActions.length)],
        actor: ['Sarah Chen', 'Marcus Webb', 'Priya Patel', 'David Kim', 'Anna Rodriguez', 'James O\'Brien'][Math.floor(Math.random() * 6)],
        severity: ['info', 'info', 'warning', 'critical'][Math.floor(Math.random() * 4)],
        timestamp: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString()
      });
    }
    db.audits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Build alerts for non-compliant records
    db.records.filter(r => r.status === 'non-compliant').forEach(rec => {
      db.alerts.push({
        id: generateId('alt'),
        severity: 'high',
        region: rec.region_name,
        regulation: rec.regulation_name,
        title: 'Non-Compliance Detected',
        message: rec.regulation_full + ' in ' + rec.region_name + ' is non-compliant. Score: ' + rec.score + ' with ' + rec.critical_findings + ' critical findings.',
        timestamp: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
        acknowledged: false
      });
    });
    db.records.filter(r => r.status === 'warning').forEach(rec => {
      db.alerts.push({
        id: generateId('alt'),
        severity: 'medium',
        region: rec.region_name,
        regulation: rec.regulation_name,
        title: 'Compliance Warning',
        message: rec.regulation_full + ' in ' + rec.region_name + ' has ' + rec.findings + ' open findings. Score: ' + rec.score,
        timestamp: new Date(Date.now() - Math.random() * 14 * 86400000).toISOString(),
        acknowledged: false
      });
    });

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

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-cm-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-cm-styles';
    style.textContent = `
      .cc-cm-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10008; background: rgba(8,10,16,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-cm-sidebar { width: 220px; flex-shrink: 0; background: rgba(15,23,42,0.6); border-right: 1px solid rgba(255,255,255,0.06); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-cm-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; }
      .cc-cm-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
      .cc-cm-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-cm-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; text-decoration: none; font-family: inherit; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; }
      .cc-cm-nav-item:hover { background: rgba(255,255,255,0.03); color: #e2e8f0; }
      .cc-cm-nav-item.active { background: rgba(239,68,68,0.08); color: #ef4444; border-left-color: #ef4444; }
      .cc-cm-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-cm-nav-badge { margin-left: auto; font-size: 9px; padding: 1px 6px; border-radius: 8px; background: rgba(239,68,68,0.2); color: #ef4444; font-weight: 700; }
      .cc-cm-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-cm-close { position: fixed; top: 16px; right: 20px; z-index: 10009; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-cm-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-cm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 12px; }
      .cc-cm-page-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-cm-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #ef4444, #f59e0b); color: #fff; font-weight: 600; letter-spacing: 0.03em; }
      .cc-cm-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #ef4444; font-weight: 600; }
      .cc-cm-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: cc-cm-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-cm-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-cm-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-cm-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px; }
      .cc-cm-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
      .cc-cm-card-value { font-size: 24px; font-weight: 800; color: #fff; }
      .cc-cm-card-delta { font-size: 11px; margin-top: 4px; }
      .cc-cm-delta-up { color: #22c55e; }
      .cc-cm-delta-down { color: #ef4444; }
      .cc-cm-delta-neutral { color: #64748b; }
      .cc-cm-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
      .cc-cm-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-cm-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-cm-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .cc-cm-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-cm-table tr:hover td { background: rgba(239,68,68,0.04); }
      .cc-cm-scroll { max-height: 520px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(239,68,68,0.4) transparent; }
      .cc-cm-scroll::-webkit-scrollbar { width: 8px; }
      .cc-cm-scroll::-webkit-scrollbar-track { background: transparent; }
      .cc-cm-scroll::-webkit-scrollbar-thumb { background: rgba(239,68,68,0.3); border-radius: 4px; }
      .cc-cm-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-cm-status-compliant { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-cm-status-warning { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-cm-status-non { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-cm-bar-track { display: inline-block; width: 80px; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; vertical-align: middle; margin-right: 6px; }
      .cc-cm-bar-fill { height: 100%; border-radius: 4px; }
      .cc-cm-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
      .cc-cm-tab { padding: 8px 16px; font-size: 12px; font-weight: 600; background: none; border: none; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: inherit; }
      .cc-cm-tab.active { color: #ef4444; border-bottom-color: #ef4444; }
      .cc-cm-tab:hover { color: #e2e8f0; }
      .cc-cm-search { padding: 8px 14px 8px 36px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #fff; font-size: 13px; font-family: inherit; width: 280px; max-width: 100%; box-sizing: border-box; }
      .cc-cm-search:focus { outline: none; border-color: #ef4444; }
      .cc-cm-search-wrap { position: relative; display: inline-block; }
      .cc-cm-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; }
      .cc-cm-bars { display: flex; align-items: flex-end; gap: 6px; height: 160px; padding: 0 4px; }
      .cc-cm-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
      .cc-cm-bar { width: 100%; max-width: 60px; border-radius: 4px 4px 0 0; min-height: 4px; position: relative; cursor: pointer; transition: opacity 0.2s; }
      .cc-cm-bar:hover { opacity: 0.8; }
      .cc-cm-bar-tooltip { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: #1e293b; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; margin-bottom: 4px; z-index: 5; }
      .cc-cm-bar:hover .cc-cm-bar-tooltip { opacity: 1; }
      .cc-cm-bar-label { font-size: 9px; color: #64748b; text-align: center; }
      .cc-cm-bar-value { font-size: 11px; font-weight: 700; color: #e2e8f0; }
      .cc-cm-donut { width: 120px; height: 120px; border-radius: 50%; position: relative; flex-shrink: 0; }
      .cc-cm-donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; }
      .cc-cm-donut-center-value { font-size: 20px; font-weight: 800; color: #fff; }
      .cc-cm-donut-center-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
      .cc-cm-legend { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 160px; }
      .cc-cm-legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
      .cc-cm-legend-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
      .cc-cm-legend-label { color: #cbd5e1; flex: 1; }
      .cc-cm-legend-value { color: #64748b; font-weight: 600; }
      .cc-cm-donut-row { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }
      .cc-cm-btn { padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s; font-family: inherit; display: inline-flex; align-items: center; gap: 4px; }
      .cc-cm-btn-primary { background: linear-gradient(135deg, #ef4444, #f59e0b); color: #fff; }
      .cc-cm-btn-secondary { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
      .cc-cm-timeline { position: relative; padding-left: 20px; }
      .cc-cm-timeline::before { content: ''; position: absolute; left: 6px; top: 0; bottom: 0; width: 2px; background: rgba(239,68,68,0.2); }
      .cc-cm-timeline-item { position: relative; padding: 8px 0 8px 16px; font-size: 12px; }
      .cc-cm-timeline-item::before { content: ''; position: absolute; left: -20px; top: 14px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #0a0e1a; }
      .cc-cm-timeline-info::before { background: #3b82f6; }
      .cc-cm-timeline-success::before { background: #22c55e; }
      .cc-cm-timeline-warning::before { background: #f59e0b; }
      .cc-cm-timeline-critical::before { background: #ef4444; }
      .cc-cm-timeline-text { color: #e2e8f0; }
      .cc-cm-timeline-time { color: #64748b; font-size: 11px; }
      .cc-cm-alert-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.06); }
      .cc-cm-alert-high { background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.15); }
      .cc-cm-alert-medium { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.15); }
      .cc-cm-alert-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
      .cc-cm-alert-content { flex: 1; }
      .cc-cm-alert-title { font-size: 13px; font-weight: 700; color: #e2e8f0; }
      .cc-cm-alert-msg { font-size: 12px; color: #94a3b8; margin-top: 2px; }
      .cc-cm-alert-time { font-size: 10px; color: #64748b; margin-top: 4px; }
      @media (max-width: 767px) {
        .cc-cm-modal { flex-direction: column; }
        .cc-cm-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-cm-sidebar-brand { display: none; }
        .cc-cm-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-cm-nav-item.active { border-bottom-color: #ef4444; border-left-color: transparent; }
        .cc-cm-main { padding: 12px 12px 20px; }
        .cc-cm-cards { grid-template-columns: repeat(2, 1fr); }
      }
      /* Light mode overrides */
      html:not(.dark) .cc-cm-modal { background: rgba(248,250,252,0.99); color: #1e293b; }
      html:not(.dark) .cc-cm-sidebar { background: rgba(241,245,249,0.8); border-right-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-cm-sidebar-title { color: #0f172a; }
      html:not(.dark) .cc-cm-nav-item { color: #64748b; }
      html:not(.dark) .cc-cm-nav-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
      html:not(.dark) .cc-cm-nav-item.active { background: rgba(239,68,68,0.08); color: #dc2626; }
      html:not(.dark) .cc-cm-page-title { color: #0f172a; }
      html:not(.dark) .cc-cm-header { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-cm-card { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-cm-card-label { color: #64748b; }
      html:not(.dark) .cc-cm-card-value { color: #0f172a; }
      html:not(.dark) .cc-cm-card-delta { color: #64748b; }
      html:not(.dark) .cc-cm-section { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-cm-section-title { color: #1e293b; }
      html:not(.dark) .cc-cm-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-cm-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-cm-table tr:hover td { background: rgba(239,68,68,0.04); }
      html:not(.dark) .cc-cm-scroll { border-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-cm-search { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.1); color: #1e293b; }
      html:not(.dark) .cc-cm-bar-label { color: #94a3b8; }
      html:not(.dark) .cc-cm-bar-value { color: #1e293b; }
      html:not(.dark) .cc-cm-legend-label { color: #334155; }
      html:not(.dark) .cc-cm-legend-value { color: #64748b; }
      html:not(.dark) .cc-cm-donut-center-value { color: #0f172a; }
      html:not(.dark) .cc-cm-donut-center-label { color: #64748b; }
      html:not(.dark) .cc-cm-btn-secondary { background: rgba(0,0,0,0.04); color: #475569; border-color: rgba(0,0,0,0.1); }
      html:not(.dark) .cc-cm-timeline-text { color: #1e293b; }
      html:not(.dark) .cc-cm-timeline-time { color: #94a3b8; }
      html:not(.dark) .cc-cm-alert-title { color: #1e293b; }
      html:not(.dark) .cc-cm-alert-msg { color: #64748b; }
      html:not(.dark) .cc-cm-alert-time { color: #94a3b8; }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    const db = initDatabase();
    const alertCount = db.alerts.filter(a => !a.acknowledged).length;

    const overlay = document.createElement('div');
    overlay.id = 'cc-cm-overlay';
    overlay.className = 'cc-cm-modal';
    overlay.innerHTML = `
      <button class="cc-cm-close" onclick="window.__ccCM.close()">×</button>
      <div class="cc-cm-sidebar">
        <div class="cc-cm-sidebar-brand">
          <div class="cc-cm-sidebar-title">🛡️ Compliance Monitor</div>
          <div class="cc-cm-sidebar-sub">${db.records.length} regulations tracked</div>
        </div>
        <button class="cc-cm-nav-item ${currentView === 'overview' ? 'active' : ''}" onclick="window.__ccCM.setView('overview')"><span class="cc-cm-nav-icon">📊</span> Overview</button>
        <button class="cc-cm-nav-item ${currentView === 'scorecard' ? 'active' : ''}" onclick="window.__ccCM.setView('scorecard')"><span class="cc-cm-nav-icon">🌍</span> Regional Scorecard</button>
        <button class="cc-cm-nav-item ${currentView === 'regulations' ? 'active' : ''}" onclick="window.__ccCM.setView('regulations')"><span class="cc-cm-nav-icon">📋</span> Regulations ${alertCount > 0 ? '<span class="cc-cm-nav-badge">' + alertCount + '</span>' : ''}</button>
        <button class="cc-cm-nav-item ${currentView === 'heatmap' ? 'active' : ''}" onclick="window.__ccCM.setView('heatmap')"><span class="cc-cm-nav-icon">🔥</span> Compliance Heatmap</button>
        <button class="cc-cm-nav-item ${currentView === 'alerts' ? 'active' : ''}" onclick="window.__ccCM.setView('alerts')"><span class="cc-cm-nav-icon">🚨</span> Alerts ${alertCount > 0 ? '<span class="cc-cm-nav-badge">' + alertCount + '</span>' : ''}</button>
        <button class="cc-cm-nav-item ${currentView === 'audit' ? 'active' : ''}" onclick="window.__ccCM.setView('audit')"><span class="cc-cm-nav-icon">📜</span> Audit Trail</button>
      </div>
      <div class="cc-cm-main" id="cc-cm-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-cm-content');
    if (!container) return;
    if (currentView === 'overview') renderOverview(container);
    else if (currentView === 'scorecard') renderScorecard(container);
    else if (currentView === 'regulations') renderRegulations(container);
    else if (currentView === 'heatmap') renderHeatmap(container);
    else if (currentView === 'alerts') renderAlerts(container);
    else if (currentView === 'audit') renderAudit(container);

    document.querySelectorAll('.cc-cm-nav-item').forEach(item => {
      const onclick = item.getAttribute('onclick') || '';
      item.classList.toggle('active', onclick.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // 1. OVERVIEW
  // ------------------------------------------------------------------
  function renderOverview(container) {
    const db = initDatabase();
    const compliant = db.records.filter(r => r.status === 'compliant').length;
    const warning = db.records.filter(r => r.status === 'warning').length;
    const nonCompliant = db.records.filter(r => r.status === 'non-compliant').length;
    const total = db.records.length;
    const avgScore = Math.round(db.records.reduce((s, r) => s + r.score, 0) / total * 10) / 10;
    const openFindings = db.records.reduce((s, r) => s + r.findings, 0);
    const criticalFindings = db.records.reduce((s, r) => s + r.critical_findings, 0);

    container.innerHTML = `
      <div class="cc-cm-header">
        <h2 class="cc-cm-page-title">📊 Compliance Overview <span class="cc-cm-page-badge">${total} REGULATIONS</span></h2>
        <div class="cc-cm-live-indicator"><div class="cc-cm-live-dot"></div> Real-time monitoring</div>
      </div>

      <div class="cc-cm-cards">
        <div class="cc-cm-card"><div class="cc-cm-card-label">Avg Compliance Score</div><div class="cc-cm-card-value" style="color:${avgScore >= 80 ? '#22c55e' : avgScore >= 70 ? '#f59e0b' : '#ef4444'}">${avgScore}</div><div class="cc-cm-card-delta cc-cm-delta-neutral">across all regions</div></div>
        <div class="cc-cm-card"><div class="cc-cm-card-label">Compliant</div><div class="cc-cm-card-value" style="color:#22c55e">${compliant}</div><div class="cc-cm-card-delta cc-cm-delta-up">${Math.round(compliant/total*100)}% of regulations</div></div>
        <div class="cc-cm-card"><div class="cc-cm-card-label">Warning</div><div class="cc-cm-card-value" style="color:#f59e0b">${warning}</div><div class="cc-cm-card-delta cc-cm-delta-down">${Math.round(warning/total*100)}% of regulations</div></div>
        <div class="cc-cm-card"><div class="cc-cm-card-label">Non-Compliant</div><div class="cc-cm-card-value" style="color:#ef4444">${nonCompliant}</div><div class="cc-cm-card-delta cc-cm-delta-down">${Math.round(nonCompliant/total*100)}% of regulations</div></div>
        <div class="cc-cm-card"><div class="cc-cm-card-label">Open Findings</div><div class="cc-cm-card-value" style="color:#f59e0b">${openFindings}</div><div class="cc-cm-card-delta cc-cm-delta-neutral">${criticalFindings} critical</div></div>
        <div class="cc-cm-card"><div class="cc-cm-card-label">Active Alerts</div><div class="cc-cm-card-value" style="color:#ef4444">${db.alerts.filter(a => !a.acknowledged).length}</div><div class="cc-cm-card-delta cc-cm-delta-down">requires action</div></div>
      </div>

      <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px">
        <div class="cc-cm-section" style="flex:1;min-width:300px">
          <div class="cc-cm-section-title">🥧 Compliance Status Distribution</div>
          <div class="cc-cm-donut-row">
            ${renderDonut({'compliant': compliant, 'warning': warning, 'non-compliant': nonCompliant}, {'compliant': '#22c55e', 'warning': '#f59e0b', 'non-compliant': '#ef4444'}, total, 'Records')}
            <div class="cc-cm-legend">
              <div class="cc-cm-legend-item"><div class="cc-cm-legend-dot" style="background:#22c55e"></div><div class="cc-cm-legend-label">Compliant (≥85)</div><div class="cc-cm-legend-value">${compliant} (${Math.round(compliant/total*100)}%)</div></div>
              <div class="cc-cm-legend-item"><div class="cc-cm-legend-dot" style="background:#f59e0b"></div><div class="cc-cm-legend-label">Warning (70-84)</div><div class="cc-cm-legend-value">${warning} (${Math.round(warning/total*100)}%)</div></div>
              <div class="cc-cm-legend-item"><div class="cc-cm-legend-dot" style="background:#ef4444"></div><div class="cc-cm-legend-label">Non-Compliant (&lt;70)</div><div class="cc-cm-legend-value">${nonCompliant} (${Math.round(nonCompliant/total*100)}%)</div></div>
            </div>
          </div>
        </div>
        <div class="cc-cm-section" style="flex:1;min-width:300px">
          <div class="cc-cm-section-title">🚨 Recent Alerts</div>
          ${db.alerts.filter(a => !a.acknowledged).slice(0, 4).map(a => `
            <div class="cc-cm-alert-item cc-cm-alert-${a.severity}">
              <div class="cc-cm-alert-icon">${a.severity === 'high' ? '🔴' : '🟡'}</div>
              <div class="cc-cm-alert-content">
                <div class="cc-cm-alert-title">${a.title}: ${a.regulation}</div>
                <div class="cc-cm-alert-msg">${a.message}</div>
                <div class="cc-cm-alert-time">${formatDate(a.timestamp)} · ${a.region}</div>
              </div>
            </div>
          `).join('') || '<div style="color:#64748b;font-size:12px;text-align:center;padding:20px">No active alerts</div>'}
        </div>
      </div>

      <div class="cc-cm-section">
        <div class="cc-cm-section-title">📜 Recent Audit Activity</div>
        <div class="cc-cm-timeline">
          ${db.audits.slice(0, 10).map(a => `
            <div class="cc-cm-timeline-item cc-cm-timeline-${a.severity}">
              <div class="cc-cm-timeline-text"><strong>${a.action}</strong> — ${a.regulation_name} in ${a.region_name}</div>
              <div class="cc-cm-timeline-time">${formatDate(a.timestamp)} · by ${a.actor}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 2. REGIONAL SCORECARD
  // ------------------------------------------------------------------
  function renderScorecard(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-cm-header">
        <h2 class="cc-cm-page-title">🌍 Regional Compliance Scorecard <span class="cc-cm-page-badge">4 REGIONS</span></h2>
      </div>
      <div class="cc-cm-cards">
        ${REGIONS.map(region => {
          const regionRecords = db.records.filter(r => r.region_id === region.id);
          const avgScore = Math.round(regionRecords.reduce((s, r) => s + r.score, 0) / regionRecords.length * 10) / 10;
          const compliant = regionRecords.filter(r => r.status === 'compliant').length;
          const warning = regionRecords.filter(r => r.status === 'warning').length;
          const nonCompliant = regionRecords.filter(r => r.status === 'non-compliant').length;
          const scoreColor = avgScore >= 80 ? '#22c55e' : avgScore >= 70 ? '#f59e0b' : '#ef4444';
          return `
            <div class="cc-cm-card">
              <div class="cc-cm-card-label">${region.icon} ${region.name}</div>
              <div class="cc-cm-card-value" style="color:${scoreColor}">${avgScore}</div>
              <div class="cc-cm-card-delta cc-cm-delta-neutral">${regionRecords.length} regulations · ${compliant} compliant · ${warning} warning · ${nonCompliant} non-compliant</div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="cc-cm-section">
        <div class="cc-cm-section-title">📋 Regional Compliance Breakdown</div>
        <div class="cc-cm-scroll">
          <table class="cc-cm-table">
            <thead><tr><th>Region</th><th>Regulation</th><th>Category</th><th>Status</th><th>Score</th><th>Findings</th><th>Critical</th><th>Last Audit</th><th>Next Audit</th><th>Owner</th></tr></thead>
            <tbody>
              ${db.records.map(r => {
                const statusClass = r.status === 'compliant' ? 'cc-cm-status-compliant' : r.status === 'warning' ? 'cc-cm-status-warning' : 'cc-cm-status-non';
                const scoreColor = r.score >= 85 ? '#22c55e' : r.score >= 70 ? '#f59e0b' : '#ef4444';
                return `
                  <tr>
                    <td style="font-weight:600">${r.region_name}</td>
                    <td style="font-weight:600;color:#ef4444">${r.regulation_name}<div style="font-size:9px;color:#64748b">${r.regulation_full}</div></td>
                    <td>${r.category}</td>
                    <td><span class="cc-cm-status ${statusClass}">${r.status}</span></td>
                    <td><span class="cc-cm-bar-track"><span class="cc-cm-bar-fill" style="width:${r.score}%;background:${scoreColor}"></span></span><strong>${r.score}</strong></td>
                    <td style="text-align:center">${r.findings}</td>
                    <td style="text-align:center;color:${r.critical_findings > 0 ? '#ef4444' : '#64748b'};font-weight:${r.critical_findings > 0 ? '700' : '400'}">${r.critical_findings}</td>
                    <td>${new Date(r.last_audit).toISOString().substr(0,10)}</td>
                    <td>${new Date(r.next_audit).toISOString().substr(0,10)}</td>
                    <td>${r.owner}</td>
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
  // 3. REGULATIONS (with tabs)
  // ------------------------------------------------------------------
  function renderRegulations(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-cm-header">
        <h2 class="cc-cm-page-title">📋 Regulations Tracked <span class="cc-cm-page-badge">${db.records.length} RECORDS</span></h2>
        <div class="cc-cm-search-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input class="cc-cm-search" placeholder="Search regulations..." value="${currentSearch}" oninput="window.__ccCM.search(this.value)" />
        </div>
      </div>
      <div class="cc-cm-tabs">
        <button class="cc-cm-tab ${currentTab === 'all' ? 'active' : ''}" onclick="window.__ccCM.setTab('all')">All (${db.records.length})</button>
        <button class="cc-cm-tab ${currentTab === 'compliant' ? 'active' : ''}" onclick="window.__ccCM.setTab('compliant')">Compliant (${db.records.filter(r => r.status === 'compliant').length})</button>
        <button class="cc-cm-tab ${currentTab === 'warning' ? 'active' : ''}" onclick="window.__ccCM.setTab('warning')">Warning (${db.records.filter(r => r.status === 'warning').length})</button>
        <button class="cc-cm-tab ${currentTab === 'non-compliant' ? 'active' : ''}" onclick="window.__ccCM.setTab('non-compliant')">Non-Compliant (${db.records.filter(r => r.status === 'non-compliant').length})</button>
      </div>
      <div id="cc-cm-table-wrap"></div>
    `;
    renderTable();
  }

  function renderTable() {
    const db = initDatabase();
    let list = db.records;
    if (currentTab === 'compliant') list = list.filter(r => r.status === 'compliant');
    else if (currentTab === 'warning') list = list.filter(r => r.status === 'warning');
    else if (currentTab === 'non-compliant') list = list.filter(r => r.status === 'non-compliant');

    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      list = list.filter(r => r.regulation_name.toLowerCase().indexOf(q) !== -1 || r.regulation_full.toLowerCase().indexOf(q) !== -1 || r.region_name.toLowerCase().indexOf(q) !== -1 || r.category.toLowerCase().indexOf(q) !== -1);
    }

    const wrap = document.getElementById('cc-cm-table-wrap');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="cc-cm-scroll">
        <table class="cc-cm-table">
          <thead><tr><th>Region</th><th>Regulation</th><th>Authority</th><th>Category</th><th>Status</th><th>Score</th><th>Findings</th><th>Critical</th><th>Last Audit</th><th>Next Audit</th><th>Remediation</th><th>Owner</th></tr></thead>
          <tbody>
            ${list.map(r => {
              const statusClass = r.status === 'compliant' ? 'cc-cm-status-compliant' : r.status === 'warning' ? 'cc-cm-status-warning' : 'cc-cm-status-non';
              const scoreColor = r.score >= 85 ? '#22c55e' : r.score >= 70 ? '#f59e0b' : '#ef4444';
              return `
                <tr>
                  <td style="font-weight:600">${r.region_name}</td>
                  <td style="font-weight:600;color:#ef4444">${r.regulation_name}<div style="font-size:9px;color:#64748b">${r.regulation_full}</div></td>
                  <td>${r.authority}</td>
                  <td>${r.category}</td>
                  <td><span class="cc-cm-status ${statusClass}">${r.status}</span></td>
                  <td><span class="cc-cm-bar-track"><span class="cc-cm-bar-fill" style="width:${r.score}%;background:${scoreColor}"></span></span><strong>${r.score}</strong></td>
                  <td style="text-align:center">${r.findings}</td>
                  <td style="text-align:center;color:${r.critical_findings > 0 ? '#ef4444' : '#64748b'};font-weight:${r.critical_findings > 0 ? '700' : '400'}">${r.critical_findings}</td>
                  <td>${new Date(r.last_audit).toISOString().substr(0,10)}</td>
                  <td>${new Date(r.next_audit).toISOString().substr(0,10)}</td>
                  <td>${r.remediation_status}</td>
                  <td>${r.owner}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:8px;font-size:11px;color:#64748b">Showing ${list.length} of ${db.records.length} compliance records</div>
    `;
  }

  // ------------------------------------------------------------------
  // 4. HEATMAP (regional bar chart)
  // ------------------------------------------------------------------
  function renderHeatmap(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-cm-header">
        <h2 class="cc-cm-page-title">🔥 Compliance Heatmap <span class="cc-cm-page-badge">BY REGION</span></h2>
      </div>
      <div class="cc-cm-section">
        <div class="cc-cm-section-title">📊 Average Compliance Score by Region</div>
        <div class="cc-cm-bars">
          ${REGIONS.map(region => {
            const regionRecords = db.records.filter(r => r.region_id === region.id);
            const avgScore = Math.round(regionRecords.reduce((s, r) => s + r.score, 0) / regionRecords.length * 10) / 10;
            const color = avgScore >= 80 ? '#22c55e' : avgScore >= 70 ? '#f59e0b' : '#ef4444';
            return `
              <div class="cc-cm-bar-wrap">
                <div class="cc-cm-bar-value">${avgScore}</div>
                <div class="cc-cm-bar" style="height:${avgScore}%;background:linear-gradient(180deg,${color},${color}88)">
                  <div class="cc-cm-bar-tooltip">${region.name}: avg score ${avgScore} · ${regionRecords.length} regulations</div>
                </div>
                <div class="cc-cm-bar-label">${region.icon} ${region.name}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${REGIONS.map(region => {
        const regionRecords = db.records.filter(r => r.region_id === region.id);
        return `
          <div class="cc-cm-section">
            <div class="cc-cm-section-title">${region.icon} ${region.name} — Regulation Status Heatmap</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">
              ${regionRecords.map(r => {
                const statusClass = r.status === 'compliant' ? 'cc-cm-status-compliant' : r.status === 'warning' ? 'cc-cm-status-warning' : 'cc-cm-status-non';
                const scoreColor = r.score >= 85 ? '#22c55e' : r.score >= 70 ? '#f59e0b' : '#ef4444';
                const bgColor = r.score >= 85 ? 'rgba(34,197,94,0.08)' : r.score >= 70 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';
                return `
                  <div style="background:${bgColor};border:1px solid ${scoreColor}40;border-radius:8px;padding:12px">
                    <div style="font-size:13px;font-weight:700;color:${scoreColor}">${r.regulation_name}</div>
                    <div style="font-size:10px;color:#64748b;margin-top:2px">${r.regulation_full}</div>
                    <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
                      <span class="cc-cm-status ${statusClass}">${r.status}</span>
                      <span style="font-size:18px;font-weight:800;color:${scoreColor}">${r.score}</span>
                    </div>
                    <div style="font-size:10px;color:#64748b;margin-top:6px">${r.findings} findings · ${r.critical_findings} critical</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  // ------------------------------------------------------------------
  // 5. ALERTS
  // ------------------------------------------------------------------
  function renderAlerts(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-cm-header">
        <h2 class="cc-cm-page-title">🚨 Automated Compliance Alerts <span class="cc-cm-page-badge">${db.alerts.length} TOTAL</span></h2>
        <button class="cc-cm-btn cc-cm-btn-secondary" onclick="window.__ccCM.ackAll()">Acknowledge All</button>
      </div>
      <div class="cc-cm-cards">
        <div class="cc-cm-card"><div class="cc-cm-card-label">High Severity</div><div class="cc-cm-card-value" style="color:#ef4444">${db.alerts.filter(a => a.severity === 'high').length}</div></div>
        <div class="cc-cm-card"><div class="cc-cm-card-label">Medium Severity</div><div class="cc-cm-card-value" style="color:#f59e0b">${db.alerts.filter(a => a.severity === 'medium').length}</div></div>
        <div class="cc-cm-card"><div class="cc-cm-card-label">Unacknowledged</div><div class="cc-cm-card-value" style="color:#ef4444">${db.alerts.filter(a => !a.acknowledged).length}</div></div>
        <div class="cc-cm-card"><div class="cc-cm-card-label">Acknowledged</div><div class="cc-cm-card-value" style="color:#22c55e">${db.alerts.filter(a => a.acknowledged).length}</div></div>
      </div>
      <div class="cc-cm-section">
        <div class="cc-cm-section-title">🔔 Active Alerts</div>
        ${db.alerts.map(a => `
          <div class="cc-cm-alert-item cc-cm-alert-${a.severity}" style="${a.acknowledged ? 'opacity:0.5' : ''}">
            <div class="cc-cm-alert-icon">${a.severity === 'high' ? '🔴' : '🟡'}</div>
            <div class="cc-cm-alert-content">
              <div class="cc-cm-alert-title">${a.title}: ${a.regulation} (${a.region}) ${a.acknowledged ? '· ✓ Acknowledged' : ''}</div>
              <div class="cc-cm-alert-msg">${a.message}</div>
              <div class="cc-cm-alert-time">${formatDate(a.timestamp)}</div>
            </div>
            ${!a.acknowledged ? '<button class="cc-cm-btn cc-cm-btn-secondary" onclick="window.__ccCM.ack(\'' + a.id + '\')">Acknowledge</button>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 6. AUDIT TRAIL
  // ------------------------------------------------------------------
  function renderAudit(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-cm-header">
        <h2 class="cc-cm-page-title">📜 Audit Trail Timeline <span class="cc-cm-page-badge">${db.audits.length} ENTRIES</span></h2>
      </div>
      <div class="cc-cm-section">
        <div class="cc-cm-section-title">🗓️ Recent Compliance Activity</div>
        <div class="cc-cm-timeline">
          ${db.audits.map(a => `
            <div class="cc-cm-timeline-item cc-cm-timeline-${a.severity}">
              <div class="cc-cm-timeline-text"><strong>${a.action}</strong> — ${a.regulation_name} in ${a.region_name}</div>
              <div class="cc-cm-timeline-time">${formatDate(a.timestamp)} · by ${a.actor}</div>
            </div>
          `).join('')}
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
      return `<div class="cc-cm-donut" style="background:#1e293b"><div class="cc-cm-donut-center"><div class="cc-cm-donut-center-value">0</div><div class="cc-cm-donut-center-label">${centerLabel}</div></div></div>`;
    }
    let gradientParts = [];
    let cumulative = 0;
    entries.forEach(([key, count]) => {
      const pct = (count / total) * 100;
      const color = colors[key] || '#64748b';
      gradientParts.push(`${color} ${cumulative}% ${cumulative + pct}%`);
      cumulative += pct;
    });
    return `<div class="cc-cm-donut" style="background:conic-gradient(${gradientParts.join(', ')})">
      <div class="cc-cm-donut-center" style="background:#0a0e1a;width:80px;height:80px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div class="cc-cm-donut-center-value">${total}</div>
        <div class="cc-cm-donut-center-label">${centerLabel}</div>
      </div>
    </div>`;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-cm-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-cm-overlay');
    if (overlay) overlay.remove();
  }

  function setView(view) {
    currentView = view;
    renderContent();
  }

  function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.cc-cm-tab').forEach(t => t.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    renderTable();
  }

  function search(q) {
    currentSearch = q;
    renderTable();
  }

  function ack(id) {
    const db = initDatabase();
    const alert = db.alerts.find(a => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      saveDB(db);
    }
    renderContent();
  }

  function ackAll() {
    const db = initDatabase();
    db.alerts.forEach(a => a.acknowledged = true);
    saveDB(db);
    renderContent();
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    window.__ccCM = { open, close, setView, setTab, search, ack, ackAll };

    function injectButton() {
      if (document.getElementById('cc-cm-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-cm-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 320px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #ef4444, #f59e0b)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg> Compliance';
      btn.setAttribute('aria-label', 'Open compliance monitoring module');
      btn.title = 'Open Compliance Monitor (press C)';
      btn.onclick = open;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-cm-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-cm-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 4000); });
    } else {
      setTimeout(tryInject, 4000);
    }

    // Keyboard shortcut: press "C" to open compliance monitor
    document.addEventListener('keydown', function(e) {
      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-cm-overlay')) { open(); e.preventDefault(); }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
