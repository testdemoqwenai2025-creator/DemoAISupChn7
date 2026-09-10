// ====================================================================
// collaboration.js — Team Collaboration Module
// ====================================================================
// Real-time team collaboration with:
//   1. Activity feed (recent actions across orders, tenders, shipments)
//   2. Team chat/comments (synthetic messages on orders)
//   3. Task assignment and tracking (assigned to, due date, priority, status)
//   4. Shared dashboards list
//   5. Team member list with online status
//   6. Filter tabs: Activity / Tasks / Messages / Team
//
// Architecture: reuses IIFE + modal + table + chart patterns from dispatch-dashboard.js
// Data: synthetic, persisted to localStorage
// ====================================================================
(function() {
  'use strict';

  if (window.__collaborationLoaded) return;
  window.__collaborationLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_collab_db_v1';

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

  function timeAgo(d) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days < 30) return days + 'd ago';
    return new Date(d).toISOString().substr(0, 10);
  }

  // ------------------------------------------------------------------
  // STATIC REFERENCE DATA
  // ------------------------------------------------------------------
  const TEAM_MEMBERS = [
    { id: 'u01', name: 'Sarah Chen', role: 'Supply Chain Director', avatar: 'SC', color: '#3b82f6', department: 'Operations', timezone: 'PST' },
    { id: 'u02', name: 'Marcus Webb', role: 'Procurement Lead', avatar: 'MW', color: '#22c55e', department: 'Procurement', timezone: 'EST' },
    { id: 'u03', name: 'Priya Patel', role: 'Logistics Manager', avatar: 'PP', color: '#f59e0b', department: 'Logistics', timezone: 'IST' },
    { id: 'u04', name: 'David Kim', role: 'Compliance Officer', avatar: 'DK', color: '#ef4444', department: 'Legal', timezone: 'KST' },
    { id: 'u05', name: 'Anna Rodriguez', role: 'Operations Analyst', avatar: 'AR', color: '#a855f7', department: 'Operations', timezone: 'CET' },
    { id: 'u06', name: 'James O\'Brien', role: 'Warehouse Manager', avatar: 'JO', color: '#06B6D4', department: 'Warehouse', timezone: 'GMT' },
    { id: 'u07', name: 'Yuki Tanaka', role: 'Trade Specialist', avatar: 'YT', color: '#ec4899', department: 'Trade', timezone: 'JST' },
    { id: 'u08', name: 'Olga Petrov', role: 'Risk Analyst', avatar: 'OP', color: '#14b8a6', department: 'Risk', timezone: 'MSK' }
  ];

  const SHARED_DASHBOARDS = [
    { id: 'd1', name: 'Executive Supply Chain Overview', owner: 'Sarah Chen', shared_with: 6, last_viewed: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'd2', name: 'Procurement Performance Q1', owner: 'Marcus Webb', shared_with: 4, last_viewed: new Date(Date.now() - 5 * 3600000).toISOString() },
    { id: 'd3', name: 'Warehouse Operations Live', owner: 'James O\'Brien', shared_with: 8, last_viewed: new Date(Date.now() - 30 * 60000).toISOString() },
    { id: 'd4', name: 'Compliance Status Board', owner: 'David Kim', shared_with: 5, last_viewed: new Date(Date.now() - 12 * 3600000).toISOString() },
    { id: 'd5', name: 'Risk Intelligence Feed', owner: 'Olga Petrov', shared_with: 3, last_viewed: new Date(Date.now() - 1 * 3600000).toISOString() },
    { id: 'd6', name: 'Trade Lane Analytics', owner: 'Yuki Tanaka', shared_with: 4, last_viewed: new Date(Date.now() - 8 * 3600000).toISOString() }
  ];

  // ------------------------------------------------------------------
  // DATABASE INITIALIZATION
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.activities && db.activities.length > 0) return db;

    db = {
      activities: [],
      messages: [],
      tasks: [],
      team: TEAM_MEMBERS.map(m => ({ ...m, online: Math.random() > 0.4, last_seen: new Date(Date.now() - Math.random() * 86400000).toISOString() })),
      dashboards: SHARED_DASHBOARDS,
      meta: { created: new Date().toISOString(), version: 1, lastUpdate: new Date().toISOString() }
    };

    // Generate activity feed (60 entries)
    const activityTemplates = [
      { type: 'order', icon: '🛒', text: 'approved order {order} for {client}', module: 'Orders' },
      { type: 'order', icon: '🛒', text: 'flagged order {order} for review', module: 'Orders' },
      { type: 'tender', icon: '📋', text: 'submitted bid for tender {tender}', module: 'Tenders' },
      { type: 'tender', icon: '📋', text: 'awarded tender {tender} to {client}', module: 'Tenders' },
      { type: 'shipment', icon: '🚢', text: 'updated ETA for shipment {shipment}', module: 'Shipments' },
      { type: 'shipment', icon: '🚢', text: 'cleared customs for shipment {shipment}', module: 'Shipments' },
      { type: 'supplier', icon: '🏭', text: 'added supplier {client} to Tier 1', module: 'Suppliers' },
      { type: 'compliance', icon: '✅', text: 'passed compliance audit for {regulation}', module: 'Compliance' },
      { type: 'warehouse', icon: '🏭', text: 'completed cycle count at {warehouse}', module: 'Warehouse' },
      { type: 'comment', icon: '💬', text: 'commented on order {order}', module: 'Comments' },
      { type: 'task', icon: '✓', text: 'completed task "{task}"', module: 'Tasks' },
      { type: 'task', icon: '✓', text: 'assigned task "{task}" to {user}', module: 'Tasks' }
    ];
    const clients = ['Global Logistics Corp', 'Pacific Trade Partners', 'European Manufacturing Group', 'Nordic Energy Solutions', 'Atlas Pharma Distribution'];
    const regulations = ['GDPR', 'ISO 27001', 'ISO 9001', 'REACH', 'SOX', 'CCPA'];
    const warehouses = ['Rotterdam DC-1', 'Singapore Hub', 'LA Distribution Center', 'Dubai Logistics City'];
    const tasks = ['Review supplier performance', 'Approve procurement budget', 'Update compliance documentation', 'Coordinate shipping schedules', 'Audit warehouse inventory', 'Negotiate contract renewal'];

    for (let i = 0; i < 60; i++) {
      const tmpl = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
      const user = TEAM_MEMBERS[Math.floor(Math.random() * TEAM_MEMBERS.length)];
      const orderNum = 'ORD-' + (10001 + Math.floor(Math.random() * 50));
      const tenderNum = 'TND-' + (20001 + Math.floor(Math.random() * 30));
      const shipmentNum = 'SHP-' + (30001 + Math.floor(Math.random() * 40));
      const client = clients[Math.floor(Math.random() * clients.length)];
      const regulation = regulations[Math.floor(Math.random() * regulations.length)];
      const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      const targetUser = TEAM_MEMBERS[Math.floor(Math.random() * TEAM_MEMBERS.length)];
      let text = tmpl.text
        .replace('{order}', orderNum)
        .replace('{tender}', tenderNum)
        .replace('{shipment}', shipmentNum)
        .replace('{client}', client)
        .replace('{regulation}', regulation)
        .replace('{warehouse}', warehouse)
        .replace('{task}', task)
        .replace('{user}', targetUser.name);

      db.activities.push({
        id: generateId('act'),
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.avatar,
        user_color: user.color,
        type: tmpl.type,
        icon: tmpl.icon,
        text: text,
        module: tmpl.module,
        timestamp: new Date(Date.now() - i * (Math.random() * 4 * 3600000)).toISOString()
      });
    }
    db.activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Generate messages/comments (40 entries across orders)
    const orderIds = ['ORD-10001', 'ORD-10002', 'ORD-10003', 'ORD-10004', 'ORD-10005', 'ORD-10012', 'ORD-10015'];
    const msgTemplates = [
      'Looks good — let\'s proceed with shipping.',
      'Need to verify the shipping address with the client.',
      'Customs documentation pending, ETA delayed by 2 days.',
      'Payment received, processing order now.',
      'Inventory confirmed at Rotterdam DC-1.',
      'Reach out to the supplier for updated lead times.',
      'Flagging this for compliance review.',
      'Approved — moving to next stage.',
      'Customer requested expedited shipping.',
      'Quality check passed at origin warehouse.'
    ];
    for (let i = 0; i < 40; i++) {
      const user = TEAM_MEMBERS[Math.floor(Math.random() * TEAM_MEMBERS.length)];
      const order = orderIds[Math.floor(Math.random() * orderIds.length)];
      db.messages.push({
        id: generateId('msg'),
        order_id: order,
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.avatar,
        user_color: user.color,
        text: msgTemplates[Math.floor(Math.random() * msgTemplates.length)],
        timestamp: new Date(Date.now() - i * (Math.random() * 6 * 3600000)).toISOString()
      });
    }
    db.messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Generate tasks (30 entries)
    const taskTitles = [
      'Review Q1 procurement budget', 'Approve supplier onboarding for Acme Corp',
      'Coordinate shipping schedule for Asia-Pacific lanes', 'Update GDPR compliance documentation',
      'Audit Rotterdam DC-1 inventory', 'Negotiate renewal with Global Logistics Corp',
      'Finalize tender response for Pacific Trade Partners', 'Review warehouse capacity planning',
      'Approve overtime for Singapore Hub', 'Update customs documentation template',
      'Schedule supplier performance review', 'Coordinate cross-dock operations at LA DC',
      'Review risk assessment for ME/Africa suppliers', 'Update demand forecast model parameters',
      'Prepare compliance report for board meeting', 'Approve purchase order ORD-10025',
      'Reconcile Q4 supplier invoices', 'Train team on new WMS module',
      'Investigate stockout at Dubai Logistics City', 'Review carrier performance metrics'
    ];
    const priorities = ['high', 'high', 'medium', 'medium', 'medium', 'low', 'low'];
    const statuses = ['pending', 'in-progress', 'in-progress', 'completed', 'completed', 'blocked'];
    for (let i = 0; i < 30; i++) {
      const user = TEAM_MEMBERS[Math.floor(Math.random() * TEAM_MEMBERS.length)];
      const assigner = TEAM_MEMBERS[Math.floor(Math.random() * TEAM_MEMBERS.length)];
      db.tasks.push({
        id: generateId('tsk'),
        title: taskTitles[i % taskTitles.length],
        description: 'Auto-generated task for supply chain operations.',
        assigned_to: user.name,
        assigned_to_id: user.id,
        assigned_to_avatar: user.avatar,
        assigned_to_color: user.color,
        assigned_by: assigner.name,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        due_date: new Date(Date.now() + (Math.random() * 30 - 5) * 86400000).toISOString(),
        created: new Date(Date.now() - Math.random() * 14 * 86400000).toISOString(),
        module: ['Orders', 'Tenders', 'Shipments', 'Compliance', 'Warehouse'][Math.floor(Math.random() * 5)]
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
  let currentView = 'activity';

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-cl-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-cl-styles';
    style.textContent = `
      .cc-cl-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10010; background: rgba(8,10,16,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-cl-sidebar { width: 220px; flex-shrink: 0; background: rgba(15,23,42,0.6); border-right: 1px solid rgba(255,255,255,0.06); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-cl-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; }
      .cc-cl-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
      .cc-cl-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-cl-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; text-decoration: none; font-family: inherit; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; }
      .cc-cl-nav-item:hover { background: rgba(255,255,255,0.03); color: #e2e8f0; }
      .cc-cl-nav-item.active { background: rgba(59,130,246,0.08); color: #3b82f6; border-left-color: #3b82f6; }
      .cc-cl-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-cl-nav-badge { margin-left: auto; font-size: 9px; padding: 1px 6px; border-radius: 8px; background: rgba(168,85,247,0.2); color: #a855f7; font-weight: 700; }
      .cc-cl-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-cl-close { position: fixed; top: 16px; right: 20px; z-index: 10011; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-cl-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-cl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 12px; }
      .cc-cl-page-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-cl-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #a855f7); color: #fff; font-weight: 600; letter-spacing: 0.03em; }
      .cc-cl-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #3b82f6; font-weight: 600; }
      .cc-cl-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; animation: cc-cl-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-cl-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-cl-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-cl-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px; }
      .cc-cl-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
      .cc-cl-card-value { font-size: 24px; font-weight: 800; color: #fff; }
      .cc-cl-card-delta { font-size: 11px; margin-top: 4px; color: #64748b; }
      .cc-cl-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
      .cc-cl-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-cl-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-cl-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .cc-cl-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-cl-table tr:hover td { background: rgba(59,130,246,0.04); }
      .cc-cl-scroll { max-height: 520px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(59,130,246,0.4) transparent; }
      .cc-cl-scroll::-webkit-scrollbar { width: 8px; }
      .cc-cl-scroll::-webkit-scrollbar-track { background: transparent; }
      .cc-cl-scroll::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.3); border-radius: 4px; }
      .cc-cl-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-cl-status-pending { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-cl-status-progress { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
      .cc-cl-status-completed { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-cl-status-blocked { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-cl-priority-high { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-cl-priority-medium { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-cl-priority-low { background: rgba(148,163,184,0.15); color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); }
      .cc-cl-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
      .cc-cl-tab { padding: 8px 16px; font-size: 12px; font-weight: 600; background: none; border: none; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: inherit; }
      .cc-cl-tab.active { color: #3b82f6; border-bottom-color: #3b82f6; }
      .cc-cl-tab:hover { color: #e2e8f0; }
      .cc-cl-btn { padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s; font-family: inherit; display: inline-flex; align-items: center; gap: 4px; }
      .cc-cl-btn-primary { background: linear-gradient(135deg, #3b82f6, #a855f7); color: #fff; }
      .cc-cl-btn-secondary { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
      .cc-cl-avatar { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: #fff; flex-shrink: 0; }
      .cc-cl-avatar-sm { width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; color: #fff; flex-shrink: 0; }
      .cc-cl-online-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.2); margin-left: -8px; margin-bottom: -2px; vertical-align: bottom; }
      .cc-cl-offline-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #64748b; box-shadow: 0 0 0 2px rgba(100,116,139,0.2); margin-left: -8px; margin-bottom: -2px; vertical-align: bottom; }
      .cc-cl-activity-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
      .cc-cl-activity-item:last-child { border-bottom: none; }
      .cc-cl-activity-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(59,130,246,0.1); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
      .cc-cl-activity-content { flex: 1; min-width: 0; }
      .cc-cl-activity-text { font-size: 13px; color: #e2e8f0; }
      .cc-cl-activity-text strong { color: #3b82f6; }
      .cc-cl-activity-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
      .cc-cl-msg-item { display: flex; gap: 12px; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.02); margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.04); }
      .cc-cl-msg-content { flex: 1; }
      .cc-cl-msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
      .cc-cl-msg-name { font-size: 12px; font-weight: 700; color: #e2e8f0; }
      .cc-cl-msg-tag { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(59,130,246,0.15); color: #3b82f6; font-weight: 600; }
      .cc-cl-msg-time { font-size: 10px; color: #64748b; margin-left: auto; }
      .cc-cl-msg-text { font-size: 13px; color: #cbd5e1; }
      .cc-cl-team-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; margin-bottom: 8px; }
      .cc-cl-team-info { flex: 1; }
      .cc-cl-team-name { font-size: 13px; font-weight: 700; color: #e2e8f0; }
      .cc-cl-team-role { font-size: 11px; color: #64748b; margin-top: 1px; }
      .cc-cl-team-meta { font-size: 10px; color: #64748b; margin-top: 4px; }
      .cc-cl-dash-card { padding: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; margin-bottom: 8px; transition: all 0.2s; cursor: pointer; }
      .cc-cl-dash-card:hover { background: rgba(59,130,246,0.04); border-color: rgba(59,130,246,0.2); }
      .cc-cl-dash-name { font-size: 13px; font-weight: 700; color: #e2e8f0; }
      .cc-cl-dash-meta { font-size: 11px; color: #64748b; margin-top: 4px; }
      @media (max-width: 767px) {
        .cc-cl-modal { flex-direction: column; }
        .cc-cl-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-cl-sidebar-brand { display: none; }
        .cc-cl-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-cl-nav-item.active { border-bottom-color: #3b82f6; border-left-color: transparent; }
        .cc-cl-main { padding: 12px 12px 20px; }
        .cc-cl-cards { grid-template-columns: repeat(2, 1fr); }
      }
      /* Light mode overrides */
      html:not(.dark) .cc-cl-modal { background: rgba(248,250,252,0.99); color: #1e293b; }
      html:not(.dark) .cc-cl-sidebar { background: rgba(241,245,249,0.8); border-right-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-cl-sidebar-title { color: #0f172a; }
      html:not(.dark) .cc-cl-nav-item { color: #64748b; }
      html:not(.dark) .cc-cl-nav-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
      html:not(.dark) .cc-cl-nav-item.active { background: rgba(59,130,246,0.08); color: #2563eb; }
      html:not(.dark) .cc-cl-page-title { color: #0f172a; }
      html:not(.dark) .cc-cl-header { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-cl-card { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-cl-card-label { color: #64748b; }
      html:not(.dark) .cc-cl-card-value { color: #0f172a; }
      html:not(.dark) .cc-cl-card-delta { color: #64748b; }
      html:not(.dark) .cc-cl-section { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-cl-section-title { color: #1e293b; }
      html:not(.dark) .cc-cl-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-cl-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-cl-table tr:hover td { background: rgba(59,130,246,0.04); }
      html:not(.dark) .cc-cl-scroll { border-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-cl-btn-secondary { background: rgba(0,0,0,0.04); color: #475569; border-color: rgba(0,0,0,0.1); }
      html:not(.dark) .cc-cl-activity-text { color: #1e293b; }
      html:not(.dark) .cc-cl-activity-text strong { color: #2563eb; }
      html:not(.dark) .cc-cl-activity-meta { color: #94a3b8; }
      html:not(.dark) .cc-cl-activity-icon { background: rgba(59,130,246,0.1); }
      html:not(.dark) .cc-cl-msg-item { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-cl-msg-name { color: #1e293b; }
      html:not(.dark) .cc-cl-msg-text { color: #334155; }
      html:not(.dark) .cc-cl-team-card { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-cl-team-name { color: #1e293b; }
      html:not(.dark) .cc-cl-team-role { color: #64748b; }
      html:not(.dark) .cc-cl-team-meta { color: #94a3b8; }
      html:not(.dark) .cc-cl-dash-card { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-cl-dash-name { color: #1e293b; }
      html:not(.dark) .cc-cl-dash-meta { color: #64748b; }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    const db = initDatabase();
    const onlineCount = db.team.filter(t => t.online).length;
    const pendingTasks = db.tasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length;

    const overlay = document.createElement('div');
    overlay.id = 'cc-cl-overlay';
    overlay.className = 'cc-cl-modal';
    overlay.innerHTML = `
      <button class="cc-cl-close" onclick="window.__ccCL.close()">×</button>
      <div class="cc-cl-sidebar">
        <div class="cc-cl-sidebar-brand">
          <div class="cc-cl-sidebar-title">💬 Team Collaboration</div>
          <div class="cc-cl-sidebar-sub">${onlineCount} online · ${db.team.length} members</div>
        </div>
        <button class="cc-cl-nav-item ${currentView === 'activity' ? 'active' : ''}" onclick="window.__ccCL.setView('activity')"><span class="cc-cl-nav-icon">📡</span> Activity Feed</button>
        <button class="cc-cl-nav-item ${currentView === 'tasks' ? 'active' : ''}" onclick="window.__ccCL.setView('tasks')"><span class="cc-cl-nav-icon">✓</span> Tasks ${pendingTasks > 0 ? '<span class="cc-cl-nav-badge">' + pendingTasks + '</span>' : ''}</button>
        <button class="cc-cl-nav-item ${currentView === 'messages' ? 'active' : ''}" onclick="window.__ccCL.setView('messages')"><span class="cc-cl-nav-icon">💬</span> Messages</button>
        <button class="cc-cl-nav-item ${currentView === 'team' ? 'active' : ''}" onclick="window.__ccCL.setView('team')"><span class="cc-cl-nav-icon">👥</span> Team</button>
        <button class="cc-cl-nav-item ${currentView === 'dashboards' ? 'active' : ''}" onclick="window.__ccCL.setView('dashboards')"><span class="cc-cl-nav-icon">📊</span> Shared Dashboards</button>
      </div>
      <div class="cc-cl-main" id="cc-cl-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-cl-content');
    if (!container) return;
    if (currentView === 'activity') renderActivity(container);
    else if (currentView === 'tasks') renderTasks(container);
    else if (currentView === 'messages') renderMessages(container);
    else if (currentView === 'team') renderTeam(container);
    else if (currentView === 'dashboards') renderDashboards(container);

    document.querySelectorAll('.cc-cl-nav-item').forEach(item => {
      const onclick = item.getAttribute('onclick') || '';
      item.classList.toggle('active', onclick.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // 1. ACTIVITY FEED
  // ------------------------------------------------------------------
  function renderActivity(container) {
    const db = initDatabase();
    const todayCount = db.activities.filter(a => new Date(a.timestamp) > new Date(Date.now() - 86400000)).length;
    container.innerHTML = `
      <div class="cc-cl-header">
        <h2 class="cc-cl-page-title">📡 Activity Feed <span class="cc-cl-page-badge">${db.activities.length} EVENTS</span></h2>
        <div class="cc-cl-live-indicator"><div class="cc-cl-live-dot"></div> Live activity stream</div>
      </div>
      <div class="cc-cl-cards">
        <div class="cc-cl-card"><div class="cc-cl-card-label">Total Activities</div><div class="cc-cl-card-value">${db.activities.length}</div><div class="cc-cl-card-delta">last 30 days</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Today</div><div class="cc-cl-card-value" style="color:#3b82f6">${todayCount}</div><div class="cc-cl-card-delta">activities in last 24h</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Active Users</div><div class="cc-cl-card-value" style="color:#22c55e">${db.team.filter(t => t.online).length}</div><div class="cc-cl-card-delta">of ${db.team.length} team members</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Modules Touched</div><div class="cc-cl-card-value">${new Set(db.activities.map(a => a.module)).size}</div><div class="cc-cl-card-delta">cross-functional activity</div></div>
      </div>
      <div class="cc-cl-section">
        <div class="cc-cl-section-title">🗞️ Recent Activity</div>
        <div class="cc-cl-scroll" style="max-height:600px">
          ${db.activities.slice(0, 50).map(a => `
            <div class="cc-cl-activity-item">
              <div class="cc-cl-activity-icon">${a.icon}</div>
              <div class="cc-cl-activity-content">
                <div class="cc-cl-activity-text"><strong>${a.user_name}</strong> ${a.text}</div>
                <div class="cc-cl-activity-meta">${formatDate(a.timestamp)} · ${timeAgo(a.timestamp)} · ${a.module}</div>
              </div>
              <div class="cc-cl-avatar-sm" style="background:${a.user_color}">${a.user_avatar}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 2. TASKS
  // ------------------------------------------------------------------
  function renderTasks(container) {
    const db = initDatabase();
    const pending = db.tasks.filter(t => t.status === 'pending').length;
    const inProgress = db.tasks.filter(t => t.status === 'in-progress').length;
    const completed = db.tasks.filter(t => t.status === 'completed').length;
    const blocked = db.tasks.filter(t => t.status === 'blocked').length;
    const overdue = db.tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed').length;
    container.innerHTML = `
      <div class="cc-cl-header">
        <h2 class="cc-cl-page-title">✓ Tasks & Assignments <span class="cc-cl-page-badge">${db.tasks.length} TASKS</span></h2>
      </div>
      <div class="cc-cl-cards">
        <div class="cc-cl-card"><div class="cc-cl-card-label">Pending</div><div class="cc-cl-card-value" style="color:#f59e0b">${pending}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">In Progress</div><div class="cc-cl-card-value" style="color:#3b82f6">${inProgress}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Completed</div><div class="cc-cl-card-value" style="color:#22c55e">${completed}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Blocked</div><div class="cc-cl-card-value" style="color:#ef4444">${blocked}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Overdue</div><div class="cc-cl-card-value" style="color:#ef4444">${overdue}</div></div>
      </div>
      <div class="cc-cl-section">
        <div class="cc-cl-section-title">📋 All Tasks</div>
        <div class="cc-cl-scroll" style="max-height:560px">
          <table class="cc-cl-table">
            <thead><tr><th>Task</th><th>Assigned To</th><th>Assigned By</th><th>Priority</th><th>Status</th><th>Module</th><th>Due Date</th><th>Created</th></tr></thead>
            <tbody>
              ${db.tasks.map(t => {
                const priClass = t.priority === 'high' ? 'cc-cl-priority-high' : t.priority === 'medium' ? 'cc-cl-priority-medium' : 'cc-cl-priority-low';
                const statusClass = t.status === 'pending' ? 'cc-cl-status-pending' : t.status === 'in-progress' ? 'cc-cl-status-progress' : t.status === 'completed' ? 'cc-cl-status-completed' : 'cc-cl-status-blocked';
                const overdueFlag = new Date(t.due_date) < new Date() && t.status !== 'completed';
                return `
                  <tr>
                    <td style="font-weight:600;color:#e2e8f0">${t.title}</td>
                    <td><div style="display:flex;align-items:center;gap:6px"><span class="cc-cl-avatar-sm" style="background:${t.assigned_to_color}">${t.assigned_to_avatar}</span>${t.assigned_to}</div></td>
                    <td>${t.assigned_by}</td>
                    <td><span class="cc-cl-status ${priClass}">${t.priority}</span></td>
                    <td><span class="cc-cl-status ${statusClass}">${t.status}</span></td>
                    <td>${t.module}</td>
                    <td style="${overdueFlag ? 'color:#ef4444;font-weight:600' : ''}">${new Date(t.due_date).toISOString().substr(0,10)}${overdueFlag ? ' (overdue)' : ''}</td>
                    <td style="font-size:10px;color:#64748b">${new Date(t.created).toISOString().substr(0,10)}</td>
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
  // 3. MESSAGES
  // ------------------------------------------------------------------
  function renderMessages(container) {
    const db = initDatabase();
    const orderGroups = {};
    db.messages.forEach(m => {
      if (!orderGroups[m.order_id]) orderGroups[m.order_id] = [];
      orderGroups[m.order_id].push(m);
    });

    container.innerHTML = `
      <div class="cc-cl-header">
        <h2 class="cc-cl-page-title">💬 Team Messages <span class="cc-cl-page-badge">${db.messages.length} COMMENTS</span></h2>
      </div>
      <div class="cc-cl-cards">
        <div class="cc-cl-card"><div class="cc-cl-card-label">Total Messages</div><div class="cc-cl-card-value">${db.messages.length}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Active Threads</div><div class="cc-cl-card-value" style="color:#3b82f6">${Object.keys(orderGroups).length}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Participants</div><div class="cc-cl-card-value" style="color:#22c55e">${new Set(db.messages.map(m => m.user_id)).size}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Last 24h</div><div class="cc-cl-card-value">${db.messages.filter(m => new Date(m.timestamp) > new Date(Date.now() - 86400000)).length}</div></div>
      </div>
      <div class="cc-cl-section">
        <div class="cc-cl-section-title">📨 Recent Conversations</div>
        <div class="cc-cl-scroll" style="max-height:600px">
          ${db.messages.slice(0, 40).map(m => `
            <div class="cc-cl-msg-item">
              <div class="cc-cl-avatar" style="background:${m.user_color}">${m.user_avatar}</div>
              <div class="cc-cl-msg-content">
                <div class="cc-cl-msg-header">
                  <span class="cc-cl-msg-name">${m.user_name}</span>
                  <span class="cc-cl-msg-tag">${m.order_id}</span>
                  <span class="cc-cl-msg-time">${timeAgo(m.timestamp)} · ${formatDate(m.timestamp)}</span>
                </div>
                <div class="cc-cl-msg-text">${m.text}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4. TEAM
  // ------------------------------------------------------------------
  function renderTeam(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-cl-header">
        <h2 class="cc-cl-page-title">👥 Team Members <span class="cc-cl-page-badge">${db.team.length} MEMBERS</span></h2>
      </div>
      <div class="cc-cl-cards">
        <div class="cc-cl-card"><div class="cc-cl-card-label">Total Members</div><div class="cc-cl-card-value">${db.team.length}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Online Now</div><div class="cc-cl-card-value" style="color:#22c55e">${db.team.filter(t => t.online).length}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Departments</div><div class="cc-cl-card-value" style="color:#3b82f6">${new Set(db.team.map(t => t.department)).size}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Timezones</div><div class="cc-cl-card-value">${new Set(db.team.map(t => t.timezone)).size}</div></div>
      </div>
      <div class="cc-cl-section">
        <div class="cc-cl-section-title">🌟 Team Roster</div>
        <div class="cc-cl-scroll" style="max-height:600px">
          ${db.team.map(t => `
            <div class="cc-cl-team-card">
              <div style="position:relative">
                <div class="cc-cl-avatar" style="background:${t.color};width:48px;height:48px;font-size:16px">${t.avatar}</div>
                <span class="${t.online ? 'cc-cl-online-dot' : 'cc-cl-offline-dot'}" style="position:absolute;bottom:0;right:0;margin:0"></span>
              </div>
              <div class="cc-cl-team-info">
                <div class="cc-cl-team-name">${t.name}</div>
                <div class="cc-cl-team-role">${t.role}</div>
                <div class="cc-cl-team-meta">${t.department} · ${t.timezone} · ${t.online ? 'Online' : 'Last seen ' + timeAgo(t.last_seen)}</div>
              </div>
              <button class="cc-cl-btn cc-cl-btn-secondary">Message</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 5. SHARED DASHBOARDS
  // ------------------------------------------------------------------
  function renderDashboards(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-cl-header">
        <h2 class="cc-cl-page-title">📊 Shared Dashboards <span class="cc-cl-page-badge">${db.dashboards.length} DASHBOARDS</span></h2>
      </div>
      <div class="cc-cl-cards">
        <div class="cc-cl-card"><div class="cc-cl-card-label">Total Dashboards</div><div class="cc-cl-card-value">${db.dashboards.length}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Total Shares</div><div class="cc-cl-card-value" style="color:#3b82f6">${db.dashboards.reduce((s, d) => s + d.shared_with, 0)}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Avg Viewers</div><div class="cc-cl-card-value">${Math.round(db.dashboards.reduce((s, d) => s + d.shared_with, 0) / db.dashboards.length)}</div></div>
        <div class="cc-cl-card"><div class="cc-cl-card-label">Recently Viewed</div><div class="cc-cl-card-value" style="color:#22c55e">${db.dashboards.filter(d => new Date(d.last_viewed) > new Date(Date.now() - 6 * 3600000)).length}</div></div>
      </div>
      <div class="cc-cl-section">
        <div class="cc-cl-section-title">📁 All Shared Dashboards</div>
        ${db.dashboards.map(d => `
          <div class="cc-cl-dash-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div style="flex:1">
                <div class="cc-cl-dash-name">📊 ${d.name}</div>
                <div class="cc-cl-dash-meta">Owner: ${d.owner} · Shared with ${d.shared_with} members · Last viewed ${timeAgo(d.last_viewed)}</div>
              </div>
              <button class="cc-cl-btn cc-cl-btn-primary">Open</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-cl-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-cl-overlay');
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
    window.__ccCL = { open, close, setView };

    function injectButton() {
      if (document.getElementById('cc-cl-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-cl-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 380px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #3b82f6, #a855f7)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg> Collaboration';
      btn.setAttribute('aria-label', 'Open team collaboration module');
      btn.title = 'Open Team Collaboration (press B)';
      btn.onclick = open;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-cl-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-cl-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 4500); });
    } else {
      setTimeout(tryInject, 4500);
    }

    // Keyboard shortcut: press "B" to open collaboration
    document.addEventListener('keydown', function(e) {
      if ((e.key === 'b' || e.key === 'B') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-cl-overlay')) { open(); e.preventDefault(); }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
