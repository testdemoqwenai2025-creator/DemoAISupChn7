// ====================================================================
// order-management.js — Full order management system for cc-app
// ====================================================================
// Injects an interactive Orders panel into the Command Center with:
//   - Synthetic database (localStorage) with clients, orders, payments, emails
//   - Orders table with status, amounts, client info
//   - "Accept Payment" button per order → opens payment modal
//   - Payment modal with card form + synthetic processing
//   - Confirmation email simulation with preview
//   - Order detail view with full audit trail
//   - All data is synthetic — no real transactions
// ====================================================================
(function() {
  'use strict';

  if (window.__orderMgmtLoaded) return;
  window.__orderMgmtLoaded = true;

  // ------------------------------------------------------------------
  // SYNTHETIC DATABASE (localStorage-backed)
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_order_db_v1';
  const EMAIL_LOG_KEY = 'cc_email_log_v1';

  function generateId(prefix) {
    return prefix + '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Synthetic clients
  const SYNTHETIC_CLIENTS = [
    { id: 'cli_001', name: 'Global Logistics Corp', email: 'procurement@globallogistics.com', country: 'United States', industry: 'Logistics' },
    { id: 'cli_002', name: 'European Manufacturing Group', email: 'orders@euro-mfg.eu', country: 'Germany', industry: 'Manufacturing' },
    { id: 'cli_003', name: 'Pacific Trade Partners', email: 'finance@pacifictrade.cn', country: 'Singapore', industry: 'Trading' },
    { id: 'cli_004', name: 'Nordic Energy Solutions', email: 'supply@nordic-energy.no', country: 'Norway', industry: 'Energy' },
    { id: 'cli_005', name: 'Mediterranean Foods Ltd', email: 'purchasing@medfoods.gr', country: 'Greece', industry: 'Food & Beverage' },
    { id: 'cli_006', name: 'Atlas Pharma Distribution', email: 'supply-chain@atlaspharma.com', country: 'United Kingdom', industry: 'Pharmaceuticals' },
    { id: 'cli_007', name: 'Sahara Minerals & Mining', email: 'logistics@saharaminerals.ma', country: 'Morocco', industry: 'Mining' },
    { id: 'cli_008', name: 'Andean Textile Mills', email: 'compras@andean-textiles.co', country: 'Colombia', industry: 'Textiles' }
  ];

  // Synthetic order templates
  const ORDER_TEMPLATES = [
    { product: 'AI Risk Intelligence Suite — Enterprise License', basePrice: 48000, category: 'Software' },
    { product: 'Supply Chain Monitoring — Annual Subscription', basePrice: 36000, category: 'Subscription' },
    { product: 'Compliance Automation Module — 3 Year', basePrice: 72000, category: 'Software' },
    { product: 'Predictive Analytics Dashboard — Pro Plan', basePrice: 28500, category: 'Subscription' },
    { product: 'Command Center Deployment — On-Premise', basePrice: 125000, category: 'Service' },
    { product: 'API Integration Package — Custom', basePrice: 18000, category: 'Service' },
    { product: 'Tender Management Module — Annual', basePrice: 22500, category: 'Subscription' },
    { product: 'Document Intelligence Suite — Enterprise', basePrice: 54000, category: 'Software' },
    { product: 'Risk Monitoring Add-on — Per Region', basePrice: 15000, category: 'Subscription' },
    { product: 'Training & Certification Package', basePrice: 8500, category: 'Service' }
  ];

  function initDatabase() {
    let db = localStorage.getItem(DB_KEY);
    if (db) {
      try { return JSON.parse(db); } catch(e) { /* fall through to create new */ }
    }

    // Create fresh synthetic database
    db = {
      clients: SYNTHETIC_CLIENTS,
      orders: [],
      payments: [],
      emails: [],
      audit_log: [],
      meta: { created: new Date().toISOString(), version: 1 }
    };

    // Generate 12 synthetic orders
    const statuses = ['pending', 'pending', 'pending', 'processing', 'processing', 'paid', 'paid', 'paid', 'shipped', 'delivered', 'delivered', 'cancelled'];
    for (let i = 0; i < 12; i++) {
      const client = SYNTHETIC_CLIENTS[i % SYNTHETIC_CLIENTS.length];
      const template = ORDER_TEMPLATES[Math.floor(Math.random() * ORDER_TEMPLATES.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const amount = template.basePrice * quantity;
      const status = statuses[i];
      const orderDate = new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000));

      const order = {
        id: 'ORD-' + String(10001 + i),
        client_id: client.id,
        client_name: client.name,
        client_email: client.email,
        client_country: client.country,
        product: template.product,
        category: template.category,
        quantity: quantity,
        amount: amount,
        currency: 'USD',
        status: status,
        created_at: orderDate.toISOString(),
        updated_at: orderDate.toISOString(),
        payment_id: null,
        tracking_number: status === 'shipped' || status === 'delivered' ? 'TRK' + Math.floor(Math.random() * 9000000 + 1000000) : null,
        notes: ''
      };
      db.orders.push(order);

      // Add audit log entry for order creation
      db.audit_log.push({
        id: generateId('aud'),
        order_id: order.id,
        event: 'order_created',
        timestamp: order.created_at,
        details: 'Order created for ' + client.name
      });

      // For paid/shipped/delivered orders, add payment history
      if (status === 'paid' || status === 'shipped' || status === 'delivered') {
        const paymentId = generateId('pay');
        const payment = {
          id: paymentId,
          order_id: order.id,
          amount: amount,
          currency: 'USD',
          method: ['Visa •••• 4242', 'Mastercard •••• 5555', 'Amex •••• 3782', 'Bank Transfer'][Math.floor(Math.random() * 4)],
          status: 'completed',
          transaction_id: 'txn_' + Math.random().toString(36).substr(2, 12),
          processed_at: new Date(orderDate.getTime() + 3600000).toISOString(),
          processor: 'Stripe (Synthetic)'
        };
        db.payments.push(payment);
        order.payment_id = paymentId;

        // Add confirmation email
        db.emails.push({
          id: generateId('eml'),
          order_id: order.id,
          to: client.email,
          subject: 'Order Confirmation — ' + order.id,
          template: 'order_confirmation',
          sent_at: new Date(orderDate.getTime() + 3600000).toISOString(),
          status: 'delivered'
        });

        db.audit_log.push({
          id: generateId('aud'),
          order_id: order.id,
          event: 'payment_received',
          timestamp: payment.processed_at,
          details: 'Payment of ' + formatCurrency(amount) + ' via ' + payment.method
        });

        db.audit_log.push({
          id: generateId('aud'),
          order_id: order.id,
          event: 'confirmation_email_sent',
          timestamp: new Date(orderDate.getTime() + 3600000).toISOString(),
          details: 'Confirmation email sent to ' + client.email
        });
      }

      if (status === 'shipped' || status === 'delivered') {
        db.audit_log.push({
          id: generateId('aud'),
          order_id: order.id,
          event: 'order_shipped',
          timestamp: new Date(orderDate.getTime() + 86400000).toISOString(),
          details: 'Order shipped. Tracking: ' + order.tracking_number
        });
      }

      if (status === 'delivered') {
        db.audit_log.push({
          id: generateId('aud'),
          order_id: order.id,
          event: 'order_delivered',
          timestamp: new Date(orderDate.getTime() + 4 * 86400000).toISOString(),
          details: 'Order delivered to ' + client.name
        });
      }
    }

    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }

  function saveDatabase(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function logEmail(db, email) {
    db.emails.push(email);
    let emailLog = [];
    try { emailLog = JSON.parse(localStorage.getItem(EMAIL_LOG_KEY) || '[]'); } catch(e) {}
    emailLog.unshift(email);
    if (emailLog.length > 50) emailLog = emailLog.slice(0, 50);
    localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(emailLog));
  }

  function logAudit(db, orderId, event, details) {
    db.audit_log.push({
      id: generateId('aud'),
      order_id: orderId,
      event: event,
      timestamp: new Date().toISOString(),
      details: details
    });
  }

  // ------------------------------------------------------------------
  // STYLING
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-om-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-om-styles';
    style.textContent = `
      /* Order Management Panel */
      .cc-om-panel {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        background: rgba(10, 10, 10, 0.98);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 16px;
        padding: 24px;
        margin: 20px 0;
        color: #e2e8f0;
        backdrop-filter: blur(10px);
      }
      /* When used as a full-screen modal */
      .cc-om-panel-modal {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 10004; margin: 0; border-radius: 0;
        overflow-y: auto; padding: 80px 24px 24px;
        background: rgba(10, 10, 10, 0.99);
      }
      .cc-om-panel-modal .cc-om-panel-inner {
        max-width: 1200px; margin: 0 auto;
      }
      .cc-om-close-panel {
        position: fixed; top: 16px; right: 20px; z-index: 10005;
        width: 40px; height: 40px; border-radius: 10px;
        background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
      }
      .cc-om-close-panel:hover { background: rgba(239, 68, 68, 0.25); transform: scale(1.05); }
      .cc-om-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 20px; padding-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      .cc-om-title { font-size: 18px; font-weight: 700; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-om-title-badge {
        font-size: 10px; padding: 3px 8px; border-radius: 10px;
        background: linear-gradient(135deg, #10B981, #06B6D4);
        color: #fff; font-weight: 600; letter-spacing: 0.03em;
      }
      .cc-om-stats { display: flex; gap: 16px; flex-wrap: wrap; }
      .cc-om-stat { text-align: right; }
      .cc-om-stat-value { font-size: 20px; font-weight: 700; color: #10B981; }
      .cc-om-stat-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

      /* Orders Table */
      .cc-om-orders-scroll {
        max-height: 420px;
        min-height: 280px;
        overflow-y: auto;
        overflow-x: auto;
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 8px;
        scrollbar-width: thin;
        scrollbar-color: rgba(16, 185, 129, 0.4) rgba(255,255,255,0.05);
      }
      .cc-om-orders-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
      .cc-om-orders-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 4px; }
      .cc-om-orders-scroll::-webkit-scrollbar-thumb {
        background: rgba(16, 185, 129, 0.3); border-radius: 4px;
      }
      .cc-om-orders-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(16, 185, 129, 0.5);
      }
      /* Search box */
      .cc-om-search {
        padding: 8px 14px 8px 36px; border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
        color: #fff; font-size: 13px; font-family: inherit;
        width: 280px; max-width: 100%; transition: border 0.2s;
        box-sizing: border-box;
      }
      .cc-om-search:focus { outline: none; border-color: #10B981; }
      .cc-om-search::placeholder { color: #475569; }
      .cc-om-search-wrap {
        position: relative; display: inline-block;
      }
      .cc-om-search-wrap svg {
        position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
        color: #64748b; pointer-events: none;
      }
      .cc-om-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-om-table thead { position: sticky; top: 0; z-index: 1; }
      .cc-om-table th {
        text-align: left; padding: 10px 8px; font-size: 10px;
        text-transform: uppercase; letter-spacing: 0.05em;
        color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.08);
        background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(4px);
      }
      .cc-om-table td {
        padding: 12px 8px; border-bottom: 1px solid rgba(255,255,255,0.05);
        color: #cbd5e1; vertical-align: middle;
      }
      .cc-om-table tr:hover td { background: rgba(16, 185, 129, 0.05); }
      .cc-om-order-id { font-weight: 600; color: #06B6D4; cursor: pointer; }
      .cc-om-order-id:hover { text-decoration: underline; }
      .cc-om-amount { font-weight: 600; color: #10B981; font-family: 'Monaco', 'Menlo', monospace; }
      .cc-om-status {
        display: inline-block; padding: 3px 10px; border-radius: 12px;
        font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;
      }
      .cc-om-status-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
      .cc-om-status-processing { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
      .cc-om-status-paid { background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
      .cc-om-status-shipped { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); }
      .cc-om-status-delivered { background: rgba(20, 184, 166, 0.15); color: #14b8a6; border: 1px solid rgba(20, 184, 166, 0.3); }
      .cc-om-status-cancelled { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

      /* Buttons */
      .cc-om-btn {
        padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer;
        font-size: 11px; font-weight: 600; transition: all 0.2s;
        font-family: inherit; display: inline-flex; align-items: center; gap: 4px;
      }
      .cc-om-btn-primary {
        background: linear-gradient(135deg, #10B981, #06B6D4); color: #fff;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      }
      .cc-om-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }
      .cc-om-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
      .cc-om-btn-secondary {
        background: rgba(255,255,255,0.05); color: #94a3b8;
        border: 1px solid rgba(255,255,255,0.1);
      }
      .cc-om-btn-secondary:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
      .cc-om-btn-danger {
        background: rgba(239, 68, 68, 0.15); color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      .cc-om-btn-danger:hover { background: rgba(239, 68, 68, 0.25); }

      /* Modal */
      .cc-om-modal-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.75); z-index: 10003;
        display: flex; align-items: center; justify-content: center; padding: 20px;
        backdrop-filter: blur(4px);
      }
      .cc-om-modal {
        background: #0f172a; border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 16px; max-width: 560px; width: 100%;
        max-height: 85vh; overflow-y: auto; padding: 32px;
        color: #e2e8f0; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
      }
      .cc-om-modal h2 { margin: 0 0 4px; font-size: 22px; color: #fff; }
      .cc-om-modal h3 { margin: 20px 0 10px; font-size: 14px; color: #10B981; }
      .cc-om-modal-subtitle { font-size: 13px; color: #94a3b8; margin-bottom: 20px; }
      .cc-om-modal-close {
        position: absolute; top: 16px; right: 16px;
        width: 32px; height: 32px; border-radius: 8px;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
        color: #94a3b8; font-size: 18px; cursor: pointer; line-height: 1;
      }
      .cc-om-modal-close:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }

      /* Form Fields */
      .cc-om-field { margin-bottom: 16px; }
      .cc-om-label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; font-weight: 600; }
      .cc-om-input {
        width: 100%; padding: 10px 14px; border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
        color: #fff; font-size: 13px; font-family: inherit;
        transition: border 0.2s; box-sizing: border-box;
      }
      .cc-om-input:focus { outline: none; border-color: #10B981; }
      .cc-om-input::placeholder { color: #475569; }
      .cc-om-field-row { display: flex; gap: 12px; }
      .cc-om-field-row .cc-om-field { flex: 1; }

      /* Order Detail */
      .cc-om-detail-section {
        background: rgba(255,255,255,0.03); border-radius: 10px;
        padding: 16px; margin-bottom: 16px;
      }
      .cc-om-detail-row {
        display: flex; justify-content: space-between; padding: 6px 0;
        font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .cc-om-detail-row:last-child { border-bottom: none; }
      .cc-om-detail-label { color: #94a3b8; }
      .cc-om-detail-value { color: #e2e8f0; font-weight: 500; }

      /* Audit Timeline */
      .cc-om-timeline { position: relative; padding-left: 20px; }
      .cc-om-timeline::before {
        content: ''; position: absolute; left: 6px; top: 0; bottom: 0;
        width: 2px; background: rgba(16, 185, 129, 0.2);
      }
      .cc-om-timeline-item {
        position: relative; padding: 8px 0 8px 16px; font-size: 12px;
      }
      .cc-om-timeline-item::before {
        content: ''; position: absolute; left: -20px; top: 14px;
        width: 10px; height: 10px; border-radius: 50%;
        background: #10B981; border: 2px solid #0f172a;
      }
      .cc-om-timeline-event { color: #e2e8f0; font-weight: 500; }
      .cc-om-timeline-time { color: #64748b; font-size: 11px; }
      .cc-om-timeline-details { color: #94a3b8; font-size: 11px; margin-top: 2px; }

      /* Payment Processing Animation */
      .cc-om-processing {
        text-align: center; padding: 40px 20px;
      }
      .cc-om-spinner {
        width: 48px; height: 48px; border-radius: 50%;
        border: 4px solid rgba(16, 185, 129, 0.2);
        border-top-color: #10B981;
        animation: cc-om-spin 0.8s linear infinite;
        margin: 0 auto 20px;
      }
      @keyframes cc-om-spin { to { transform: rotate(360deg); } }
      .cc-om-processing-text { color: #94a3b8; font-size: 14px; }

      /* Success State */
      .cc-om-success {
        text-align: center; padding: 30px 20px;
      }
      .cc-om-success-icon {
        width: 64px; height: 64px; border-radius: 50%;
        background: rgba(16, 185, 129, 0.15); color: #10B981;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 16px; font-size: 32px;
      }
      .cc-om-success-title { font-size: 18px; color: #fff; margin-bottom: 8px; }
      .cc-om-success-text { color: #94a3b8; font-size: 13px; margin-bottom: 20px; }

      /* Email Preview */
      .cc-om-email-preview {
        background: #fff; color: #1e293b; border-radius: 8px;
        padding: 20px; font-family: 'Inter', system-ui, sans-serif;
        font-size: 13px; line-height: 1.6; margin-top: 12px;
      }
      .cc-om-email-header {
        border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;
      }
      .cc-om-email-from { color: #64748b; font-size: 11px; margin-bottom: 4px; }
      .cc-om-email-subject { font-size: 16px; font-weight: 700; color: #0f172a; }
      .cc-om-email-body h4 { color: #0f172a; margin: 16px 0 8px; }
      .cc-om-email-body p { margin: 8px 0; color: #334155; }
      .cc-om-email-order-table {
        width: 100%; border-collapse: collapse; margin: 12px 0;
        font-size: 12px;
      }
      .cc-om-email-order-table th {
        text-align: left; padding: 8px; background: #f1f5f9;
        color: #475569; font-size: 11px; text-transform: uppercase;
      }
      .cc-om-email-order-table td {
        padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;
      }
      .cc-om-email-footer {
        margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0;
        font-size: 11px; color: #94a3b8;
      }

      /* Tabs */
      .cc-om-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .cc-om-tab {
        padding: 8px 16px; font-size: 12px; font-weight: 600;
        background: none; border: none; color: #94a3b8; cursor: pointer;
        border-bottom: 2px solid transparent; transition: all 0.2s;
        font-family: inherit;
      }
      .cc-om-tab.active { color: #10B981; border-bottom-color: #10B981; }
      .cc-om-tab:hover { color: #e2e8f0; }

      /* Filter dropdown */
      .cc-om-filter {
        padding: 6px 12px; border-radius: 6px; font-size: 12px;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
        color: #e2e8f0; font-family: inherit; cursor: pointer;
      }
      .cc-om-filter:focus { outline: none; border-color: #10B981; }

      /* Analytics Chart */
      .cc-om-chart {
        display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px;
        padding: 16px; background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.05); border-radius: 10px;
      }
      .cc-om-chart-section { flex: 1; min-width: 280px; }
      .cc-om-chart-title {
        font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;
        color: #64748b; margin-bottom: 10px; font-weight: 600;
      }
      .cc-om-chart-bars {
        display: flex; align-items: flex-end; gap: 6px; height: 80px;
        padding: 0 4px;
      }
      .cc-om-chart-bar-wrap {
        flex: 1; display: flex; flex-direction: column; align-items: center;
        gap: 4px; height: 100%; justify-content: flex-end;
      }
      .cc-om-chart-bar {
        width: 100%; max-width: 36px; border-radius: 4px 4px 0 0;
        transition: height 0.4s ease, opacity 0.2s; min-height: 4px;
        position: relative; cursor: pointer;
      }
      .cc-om-chart-bar:hover { opacity: 0.85; }
      .cc-om-chart-bar-tooltip {
        position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
        background: #1e293b; color: #fff; padding: 4px 8px; border-radius: 4px;
        font-size: 10px; white-space: nowrap; opacity: 0; pointer-events: none;
        transition: opacity 0.2s; margin-bottom: 4px; z-index: 5;
      }
      .cc-om-chart-bar:hover .cc-om-chart-bar-tooltip { opacity: 1; }
      .cc-om-chart-label {
        font-size: 9px; color: #64748b; text-transform: uppercase;
        letter-spacing: 0.03em; text-align: center;
      }
      .cc-om-chart-value {
        font-size: 11px; font-weight: 700; color: #e2e8f0;
      }
      /* Revenue sparkline */
      .cc-om-sparkline {
        display: flex; align-items: flex-end; gap: 3px; height: 60px;
      }
      .cc-om-sparkline-bar {
        flex: 1; background: linear-gradient(180deg, #10B981, #06B6D4);
        border-radius: 2px 2px 0 0; min-height: 3px; opacity: 0.7;
        transition: opacity 0.2s;
      }
      .cc-om-sparkline-bar:hover { opacity: 1; }
      .cc-om-sparkline-label {
        font-size: 9px; color: #64748b; text-align: center; margin-top: 4px;
      }

      /* Bulk Actions Bar */
      .cc-om-bulk-bar {
        display: none; align-items: center; justify-content: space-between;
        padding: 10px 14px; margin-bottom: 12px;
        background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 8px; flex-wrap: wrap; gap: 8px;
      }
      .cc-om-bulk-bar.active { display: flex; }
      .cc-om-bulk-count { font-size: 13px; color: #93c5fd; font-weight: 600; }
      .cc-om-bulk-actions { display: flex; gap: 6px; flex-wrap: wrap; }
      .cc-om-checkbox {
        width: 16px; height: 16px; cursor: pointer; accent-color: #10B981;
      }
      .cc-om-checkbox-cell { width: 32px; text-align: center; }

      /* Mobile responsive — card layout for screens < 768px */
      @media (max-width: 767px) {
        .cc-om-panel { padding: 16px; }
        .cc-om-panel-modal { padding: 60px 12px 16px; }
        .cc-om-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        .cc-om-stats { width: 100%; justify-content: space-between; }
        .cc-om-stat { text-align: left; }
        .cc-om-tabs { flex-wrap: wrap; gap: 2px; }
        .cc-om-tab { padding: 6px 10px; font-size: 11px; }
        .cc-om-search { width: 100%; }
        .cc-om-search-wrap { display: block; width: 100%; }
        /* Hide table, show cards on mobile */
        .cc-om-orders-scroll { border: none; max-height: none; min-height: 0; overflow: visible; }
        .cc-om-table { display: none; }
        .cc-om-cards { display: flex; flex-direction: column; gap: 12px; }
        .cc-om-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 14px;
        }
        .cc-om-card-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 10px; padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .cc-om-card-id { font-weight: 700; color: #06B6D4; font-size: 13px; cursor: pointer; }
        .cc-om-card-row {
          display: flex; justify-content: space-between; padding: 4px 0;
          font-size: 12px;
        }
        .cc-om-card-label { color: #64748b; }
        .cc-om-card-value { color: #e2e8f0; text-align: right; max-width: 60%; }
        .cc-om-card-actions { margin-top: 10px; display: flex; gap: 8px; }
        .cc-om-card-actions .cc-om-btn { flex: 1; justify-content: center; }
      }
      /* Show table on desktop, hide cards */
      .cc-om-cards { display: none; }
      @media (max-width: 767px) {
        .cc-om-cards { display: flex; }
      }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER ORDERS PANEL (as a full-screen modal)
  // ------------------------------------------------------------------
  function renderOrdersPanel() {
    const db = initDatabase();
    const pendingCount = db.orders.filter(o => o.status === 'pending').length;
    const paidCount = db.orders.filter(o => ['paid', 'shipped', 'delivered'].includes(o.status)).length;
    const totalRevenue = db.payments.reduce((sum, p) => sum + p.amount, 0);

    // Create the full-screen modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'cc-om-panel-overlay';
    overlay.className = 'cc-om-panel-modal';
    overlay.innerHTML = `
      <button class="cc-om-close-panel" onclick="window.__ccOM.closePanel()" aria-label="Close order management">×</button>
      <div class="cc-om-panel-inner">
        <div class="cc-om-panel">
          <div class="cc-om-header">
            <div>
              <h3 class="cc-om-title">
                Order Management
                <span class="cc-om-title-badge">LIVE DEMO</span>
              </h3>
              <div style="font-size:11px;color:#64748b;margin-top:4px">
                Synthetic database · ${db.orders.length} orders · ${db.clients.length} clients · Payments & confirmation emails
              </div>
            </div>
            <div class="cc-om-stats">
              <div class="cc-om-stat">
                <div class="cc-om-stat-value">${pendingCount}</div>
                <div class="cc-om-stat-label">Pending</div>
              </div>
              <div class="cc-om-stat">
                <div class="cc-om-stat-value">${paidCount}</div>
                <div class="cc-om-stat-label">Paid</div>
              </div>
              <div class="cc-om-stat">
                <div class="cc-om-stat-value">${formatCurrency(totalRevenue)}</div>
                <div class="cc-om-stat-label">Revenue</div>
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
            <div class="cc-om-tabs">
              <button class="cc-om-tab active" data-filter="all">All Orders</button>
              <button class="cc-om-tab" data-filter="pending">Pending</button>
              <button class="cc-om-tab" data-filter="processing">Processing</button>
              <button class="cc-om-tab" data-filter="paid">Paid</button>
              <button class="cc-om-tab" data-filter="shipped">Shipped</button>
              <button class="cc-om-tab" data-filter="delivered">Delivered</button>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="cc-om-btn cc-om-btn-primary" id="cc-om-new-order">
                + New Order
              </button>
              <button class="cc-om-btn cc-om-btn-secondary" id="cc-om-export-csv">
                ⬇ Export CSV
              </button>
              <button class="cc-om-btn cc-om-btn-secondary" id="cc-om-reset-db">
                ↻ Reset Data
              </button>
            </div>
          </div>

          <div id="cc-om-chart-container"></div>

          <div class="cc-om-bulk-bar" id="cc-om-bulk-bar">
            <span class="cc-om-bulk-count" id="cc-om-bulk-count">0 selected</span>
            <div class="cc-om-bulk-actions">
              <button class="cc-om-btn cc-om-btn-primary" style="background:linear-gradient(135deg,#8b5cf6,#3b82f6)" onclick="window.__ccOM.bulkShip()">📦 Ship Selected</button>
              <button class="cc-om-btn cc-om-btn-primary" style="background:linear-gradient(135deg,#14b8a6,#06B6D4)" onclick="window.__ccOM.bulkDeliver()">✓ Deliver Selected</button>
              <button class="cc-om-btn cc-om-btn-secondary" onclick="window.__ccOM.bulkExportCSV()">⬇ Export Selected</button>
              <button class="cc-om-btn cc-om-btn-danger" onclick="window.__ccOM.clearSelection()">✕ Clear</button>
            </div>
          </div>

          <div style="margin-bottom:12px">
            <div class="cc-om-search-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" class="cc-om-search" id="cc-om-search-input" placeholder="Search by order ID, client name, or product...">
            </div>
            <span id="cc-om-search-count" style="font-size:11px;color:#64748b;margin-left:12px"></span>
          </div>

          <div id="cc-om-orders-container"></div>
        </div>
      </div>
    `;

    return overlay;
  }

  // Current filter + search state
  let currentFilter = 'all';
  let currentSearch = '';

  function renderOrdersTable(filter, search) {
    const db = initDatabase();
    if (filter !== undefined) currentFilter = filter;
    if (search !== undefined) currentSearch = search;

    let orders = db.orders;
    if (currentFilter && currentFilter !== 'all') {
      orders = orders.filter(o => o.status === currentFilter);
    }
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      orders = orders.filter(o =>
        o.id.toLowerCase().indexOf(q) !== -1 ||
        o.client_name.toLowerCase().indexOf(q) !== -1 ||
        o.product.toLowerCase().indexOf(q) !== -1 ||
        o.client_email.toLowerCase().indexOf(q) !== -1
      );
    }
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const container = document.getElementById('cc-om-orders-container');
    if (!container) return;

    // Update search count
    const countEl = document.getElementById('cc-om-search-count');
    if (countEl) {
      countEl.textContent = 'Showing ' + orders.length + ' order' + (orders.length !== 1 ? 's' : '');
    }

    if (orders.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:60px 40px;color:#64748b;font-size:13px;min-height:280px;display:flex;align-items:center;justify-content:center"><div><div style="font-size:32px;margin-bottom:8px;opacity:0.4">🔍</div>No orders match your filter or search.<br><span style="font-size:11px">Try a different tab or clear the search box.</span></div></div>';
      return;
    }

    container.innerHTML = `
      <div class="cc-om-orders-scroll">
      <table class="cc-om-table">
        <thead>
          <tr>
            <th class="cc-om-checkbox-cell"><input type="checkbox" class="cc-om-checkbox" id="cc-om-select-all" onchange="window.__ccOM.toggleSelectAll(this.checked)"></th>
            <th>Order ID</th>
            <th>Client</th>
            <th>Product</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td class="cc-om-checkbox-cell"><input type="checkbox" class="cc-om-checkbox cc-om-row-checkbox" value="${o.id}" onchange="window.__ccOM.updateBulkBar()"></td>
              <td><span class="cc-om-order-id" onclick="window.__ccOM.showOrderDetail('${o.id}')">${o.id}</span></td>
              <td>${o.client_name}<div style="font-size:10px;color:#64748b">${o.client_country}</div></td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.product}</td>
              <td class="cc-om-amount">${formatCurrency(o.amount)}</td>
              <td><span class="cc-om-status cc-om-status-${o.status}">${o.status}</span></td>
              <td style="font-size:11px;color:#64748b">${new Date(o.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}</td>
              <td>
                ${o.status === 'pending' || o.status === 'processing'
                  ? `<button class="cc-om-btn cc-om-btn-primary" onclick="window.__ccOM.openPaymentModal('${o.id}')">💳 Accept Payment</button>`
                  : o.status === 'paid'
                  ? `<button class="cc-om-btn cc-om-btn-primary" style="background:linear-gradient(135deg,#8b5cf6,#3b82f6)" onclick="window.__ccOM.markAsShipped('${o.id}')">📦 Ship</button>`
                  : o.status === 'shipped'
                  ? `<button class="cc-om-btn cc-om-btn-primary" style="background:linear-gradient(135deg,#14b8a6,#06B6D4)" onclick="window.__ccOM.markAsDelivered('${o.id}')">✓ Deliver</button>`
                  : ``
                }
                ${o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered'
                  ? `<button class="cc-om-btn cc-om-btn-secondary" onclick="window.__ccOM.downloadReceipt('${o.id}')" title="Download receipt PDF">🧾</button>`
                  : ``}
                <button class="cc-om-btn cc-om-btn-secondary" onclick="window.__ccOM.showOrderDetail('${o.id}')">View</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </div>
      <div class="cc-om-cards">
        ${orders.map(o => `
          <div class="cc-om-card">
            <div class="cc-om-card-header">
              <span class="cc-om-card-id" onclick="window.__ccOM.showOrderDetail('${o.id}')">${o.id}</span>
              <span class="cc-om-status cc-om-status-${o.status}">${o.status}</span>
            </div>
            <div class="cc-om-card-row"><span class="cc-om-card-label">Client</span><span class="cc-om-card-value">${o.client_name}</span></div>
            <div class="cc-om-card-row"><span class="cc-om-card-label">Product</span><span class="cc-om-card-value" style="font-size:11px">${o.product}</span></div>
            <div class="cc-om-card-row"><span class="cc-om-card-label">Amount</span><span class="cc-om-card-value" style="color:#10B981;font-weight:700">${formatCurrency(o.amount)}</span></div>
            <div class="cc-om-card-row"><span class="cc-om-card-label">Date</span><span class="cc-om-card-value" style="font-size:11px">${new Date(o.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}</span></div>
            <div class="cc-om-card-actions">
              ${o.status === 'pending' || o.status === 'processing'
                ? `<button class="cc-om-btn cc-om-btn-primary" onclick="window.__ccOM.openPaymentModal('${o.id}')">💳 Pay</button>`
                : o.status === 'paid'
                ? `<button class="cc-om-btn cc-om-btn-primary" style="background:linear-gradient(135deg,#8b5cf6,#3b82f6)" onclick="window.__ccOM.markAsShipped('${o.id}')">📦 Ship</button>`
                : o.status === 'shipped'
                ? `<button class="cc-om-btn cc-om-btn-primary" style="background:linear-gradient(135deg,#14b8a6,#06B6D4)" onclick="window.__ccOM.markAsDelivered('${o.id}')">✓ Deliver</button>`
                : ``
              }
              ${o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered'
                ? `<button class="cc-om-btn cc-om-btn-secondary" onclick="window.__ccOM.downloadReceipt('${o.id}')">🧾 Receipt</button>`
                : ``
              }
              <button class="cc-om-btn cc-om-btn-secondary" onclick="window.__ccOM.showOrderDetail('${o.id}')">View</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // PAYMENT MODAL
  // ------------------------------------------------------------------
  function openPaymentModal(orderId) {
    const db = initDatabase();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return;

    const client = db.clients.find(c => c.id === order.client_id);

    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'cc-om-modal-overlay';
    overlay.id = 'cc-om-modal-overlay';
    overlay.innerHTML = `
      <div class="cc-om-modal" style="position:relative">
        <button class="cc-om-modal-close" onclick="window.__ccOM.closeModal()">×</button>
        <h2>Accept Payment</h2>
        <div class="cc-om-modal-subtitle">Order ${order.id} · ${client.name}</div>

        <div class="cc-om-detail-section">
          <div class="cc-om-detail-row">
            <span class="cc-om-detail-label">Order ID</span>
            <span class="cc-om-detail-value">${order.id}</span>
          </div>
          <div class="cc-om-detail-row">
            <span class="cc-om-detail-label">Client</span>
            <span class="cc-om-detail-value">${order.client_name}</span>
          </div>
          <div class="cc-om-detail-row">
            <span class="cc-om-detail-label">Email</span>
            <span class="cc-om-detail-value">${order.client_email}</span>
          </div>
          <div class="cc-om-detail-row">
            <span class="cc-om-detail-label">Product</span>
            <span class="cc-om-detail-value" style="text-align:right;max-width:300px">${order.product}</span>
          </div>
          <div class="cc-om-detail-row">
            <span class="cc-om-detail-label">Quantity</span>
            <span class="cc-om-detail-value">${order.quantity}</span>
          </div>
          <div class="cc-om-detail-row" style="border-top:1px solid rgba(16,185,129,0.2);padding-top:12px;margin-top:8px">
            <span class="cc-om-detail-label" style="font-weight:700;color:#10B981">Total Due</span>
            <span class="cc-om-detail-value" style="font-size:18px;color:#10B981;font-weight:700">${formatCurrency(order.amount)} ${order.currency}</span>
          </div>
        </div>

        <h3>Payment Method</h3>
        <div class="cc-om-field">
          <select class="cc-om-input" id="cc-om-payment-method">
            <option value="card">Credit / Debit Card</option>
            <option value="bank">Bank Transfer (ACH/SEPA)</option>
            <option value="wire">International Wire Transfer</option>
          </select>
        </div>

        <div id="cc-om-card-fields">
          <div class="cc-om-field">
            <label class="cc-om-label">Cardholder Name</label>
            <input class="cc-om-input" type="text" id="cc-om-card-name" placeholder="John Smith" value="${client.name.split(' ')[0]} ${client.name.split(' ').slice(-1)[0]}">
          </div>
          <div class="cc-om-field">
            <label class="cc-om-label">Card Number</label>
            <input class="cc-om-input" type="text" id="cc-om-card-number" placeholder="4242 4242 4242 4242" maxlength="19" value="4242 4242 4242 4242">
          </div>
          <div class="cc-om-field-row">
            <div class="cc-om-field">
              <label class="cc-om-label">Expiry</label>
              <input class="cc-om-input" type="text" id="cc-om-card-expiry" placeholder="MM/YY" maxlength="5" value="12/28">
            </div>
            <div class="cc-om-field">
              <label class="cc-om-label">CVC</label>
              <input class="cc-om-input" type="text" id="cc-om-card-cvc" placeholder="123" maxlength="4" value="123">
            </div>
          </div>
        </div>

        <div id="cc-om-bank-fields" style="display:none">
          <div class="cc-om-field">
            <label class="cc-om-label">Bank Account Number</label>
            <input class="cc-om-input" type="text" placeholder="GB29 NWBK 6016 1331 9268 19" value="GB29 NWBK 6016 1331 9268 19">
          </div>
          <div class="cc-om-field">
            <label class="cc-om-label">Bank Name</label>
            <input class="cc-om-input" type="text" placeholder="Barclays Bank PLC" value="Barclays Bank PLC">
          </div>
        </div>

        <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:12px;margin:16px 0">
          <div style="font-size:11px;color:#f59e0b;font-weight:600;margin-bottom:4px">⚠ DEMO MODE</div>
          <div style="font-size:12px;color:#94a3b8">This is a synthetic payment. No real transaction will occur. A confirmation email will be simulated and logged to the database.</div>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="cc-om-btn cc-om-btn-secondary" onclick="window.__ccOM.closeModal()" style="flex:1">Cancel</button>
          <button class="cc-om-btn cc-om-btn-primary" onclick="window.__ccOM.processPayment('${order.id}')" style="flex:2">
            🔒 Process Payment · ${formatCurrency(order.amount)}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Handle payment method toggle
    const methodSelect = document.getElementById('cc-om-payment-method');
    methodSelect.addEventListener('change', function() {
      document.getElementById('cc-om-card-fields').style.display = this.value === 'card' ? 'block' : 'none';
      document.getElementById('cc-om-bank-fields').style.display = this.value !== 'card' ? 'block' : 'none';
    });

    // Card number formatting
    const cardInput = document.getElementById('cc-om-card-number');
    cardInput.addEventListener('input', function() {
      let v = this.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      this.value = v;
    });
  }

  // ------------------------------------------------------------------
  // PROCESS PAYMENT
  // ------------------------------------------------------------------
  function processPayment(orderId) {
    const db = initDatabase();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return;

    const method = document.getElementById('cc-om-payment-method').value;
    const methodLabel = method === 'card'
      ? document.getElementById('cc-om-card-number').value.replace(/\d(?=\d{4})/g, '•') .substr(-12)
      : method === 'bank' ? 'Bank Transfer' : 'Wire Transfer';

    // Show processing state
    const modal = document.querySelector('.cc-om-modal');
    if (!modal) return;
    modal.innerHTML = `
      <div class="cc-om-processing">
        <div class="cc-om-spinner"></div>
        <div class="cc-om-processing-text">Processing payment…</div>
        <div style="font-size:11px;color:#475569;margin-top:8px">Connecting to payment gateway · Encrypting card details · Authorizing transaction</div>
      </div>
    `;

    // Simulate processing steps
    setTimeout(function() {
      const modal2 = document.querySelector('.cc-om-modal');
      if (modal2) {
        modal2.querySelector('.cc-om-processing-text').textContent = 'Authorizing with bank…';
      }
    }, 800);

    setTimeout(function() {
      const modal3 = document.querySelector('.cc-om-modal');
      if (modal3) {
        modal3.querySelector('.cc-om-processing-text').textContent = 'Sending confirmation email…';
      }
    }, 1600);

    // Complete after 2.4s
    setTimeout(function() {
      // Generate payment record
      const paymentId = generateId('pay');
      const payment = {
        id: paymentId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        method: method === 'card' ? 'Visa ' + methodLabel : methodLabel,
        status: 'completed',
        transaction_id: 'txn_' + Math.random().toString(36).substr(2, 12),
        processed_at: new Date().toISOString(),
        processor: 'Stripe (Synthetic Demo)'
      };
      db.payments.push(payment);

      // Update order
      order.status = 'paid';
      order.payment_id = paymentId;
      order.updated_at = new Date().toISOString();
      logAudit(db, order.id, 'payment_received', 'Payment of ' + formatCurrency(order.amount) + ' via ' + payment.method + ' (Txn: ' + payment.transaction_id + ')');

      // Generate and log confirmation email
      const email = {
        id: generateId('eml'),
        order_id: order.id,
        to: order.client_email,
        from: 'orders@aisupplychain-advanced.com',
        subject: 'Order Confirmation — ' + order.id,
        template: 'order_confirmation',
        sent_at: new Date().toISOString(),
        status: 'delivered',
        body: generateConfirmationEmailBody(order, payment, db)
      };
      logEmail(db, email);
      logAudit(db, order.id, 'confirmation_email_sent', 'Confirmation email sent to ' + order.client_email);

      saveDatabase(db);

      // Show success
      const modal4 = document.querySelector('.cc-om-modal');
      if (modal4) {
        modal4.innerHTML = `
          <div class="cc-om-success">
            <div class="cc-om-success-icon">✓</div>
            <div class="cc-om-success-title">Payment Successful</div>
            <div class="cc-om-success-text">
              ${formatCurrency(order.amount)} charged successfully.<br>
              Transaction ID: <strong style="color:#10B981">${payment.transaction_id}</strong><br>
              Confirmation email sent to ${order.client_email}
            </div>
          </div>

          <h3>📧 Confirmation Email Preview</h3>
          <div class="cc-om-email-preview">
            <div class="cc-om-email-header">
              <div class="cc-om-email-from">From: ${email.from}</div>
              <div class="cc-om-email-from">To: ${email.to}</div>
              <div class="cc-om-email-from">Sent: ${formatDate(email.sent_at)}</div>
              <div class="cc-om-email-subject">${email.subject}</div>
            </div>
            <div class="cc-om-email-body">
              ${email.body}
            </div>
            <div class="cc-om-email-footer">
              This is an automated confirmation email from AI Supply Chain Advanced.<br>
              © 2026 AI Supply Chain Advanced. All rights reserved.
            </div>
          </div>

          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="cc-om-btn cc-om-btn-secondary" onclick="window.__ccOM.closeModal()" style="flex:1">Close</button>
            <button class="cc-om-btn cc-om-btn-primary" onclick="window.__ccOM.showOrderDetail('${order.id}')" style="flex:1">View Order Details</button>
          </div>
        `;
      }

      // Refresh the orders table
      const activeTab = document.querySelector('.cc-om-tab.active');
      renderOrdersTable(activeTab ? activeTab.dataset.filter : 'all');
      refreshPanelStats();
    }, 2400);
  }

  // ------------------------------------------------------------------
  // CONFIRMATION EMAIL BODY
  // ------------------------------------------------------------------
  function generateConfirmationEmailBody(order, payment, db) {
    return `
      <p>Dear ${order.client_name},</p>
      <p>Thank you for your order. We've received your payment and your order is now confirmed.</p>

      <h4>Order Summary</h4>
      <table class="cc-om-email-order-table">
        <tr><th>Order ID</th><td><strong>${order.id}</strong></td></tr>
        <tr><th>Date</th><td>${formatDate(order.created_at)}</td></tr>
        <tr><th>Product</th><td>${order.product}</td></tr>
        <tr><th>Quantity</th><td>${order.quantity}</td></tr>
        <tr><th>Amount</th><td><strong>${formatCurrency(order.amount)} ${order.currency}</strong></td></tr>
      </table>

      <h4>Payment Details</h4>
      <table class="cc-om-email-order-table">
        <tr><th>Transaction ID</th><td>${payment.transaction_id}</td></tr>
        <tr><th>Method</th><td>${payment.method}</td></tr>
        <tr><th>Status</th><td><strong style="color:#059669">Completed</strong></td></tr>
        <tr><th>Processed At</th><td>${formatDate(payment.processed_at)}</td></tr>
      </table>

      <h4>What Happens Next?</h4>
      <p>1. Your order is now being processed by our team.</p>
      <p>2. You'll receive a shipping notification with tracking details within 1-2 business days.</p>
      <p>3. Access your digital products and dashboards via the Command Center.</p>

      <h4>Need Help?</h4>
      <p>If you have any questions about your order, reply to this email or contact our support team:</p>
      <p>📧 contact@aisupplychain-advanced.com<br>
         📧 testdemoqwenai2025@gmail.com<br>
         📞 +44 (0) 20 7946 0958</p>

      <p>Thank you for choosing AI Supply Chain Advanced.</p>
      <p>Best regards,<br><strong>The AI Supply Chain Advanced Team</strong></p>
    `;
  }

  // ------------------------------------------------------------------
  // ORDER DETAIL MODAL
  // ------------------------------------------------------------------
  function showOrderDetail(orderId) {
    const db = initDatabase();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return;

    const payment = db.payments.find(p => p.id === order.payment_id);
    const emails = db.emails.filter(e => e.order_id === orderId);
    const audit = db.audit_log.filter(a => a.order_id === orderId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'cc-om-modal-overlay';
    overlay.id = 'cc-om-modal-overlay';
    overlay.innerHTML = `
      <div class="cc-om-modal" style="position:relative;max-width:640px">
        <button class="cc-om-modal-close" onclick="window.__ccOM.closeModal()">×</button>
        <h2>Order ${order.id}</h2>
        <div class="cc-om-modal-subtitle">
          ${order.client_name} · <span class="cc-om-status cc-om-status-${order.status}">${order.status}</span>
        </div>

        <div class="cc-om-detail-section">
          <div class="cc-om-detail-row"><span class="cc-om-detail-label">Client</span><span class="cc-om-detail-value">${order.client_name}</span></div>
          <div class="cc-om-detail-row"><span class="cc-om-detail-label">Email</span><span class="cc-om-detail-value">${order.client_email}</span></div>
          <div class="cc-om-detail-row"><span class="cc-om-detail-label">Country</span><span class="cc-om-detail-value">${order.client_country}</span></div>
          <div class="cc-om-detail-row"><span class="cc-om-detail-label">Product</span><span class="cc-om-detail-value" style="text-align:right;max-width:340px">${order.product}</span></div>
          <div class="cc-om-detail-row"><span class="cc-om-detail-label">Category</span><span class="cc-om-detail-value">${order.category}</span></div>
          <div class="cc-om-detail-row"><span class="cc-om-detail-label">Quantity</span><span class="cc-om-detail-value">${order.quantity}</span></div>
          <div class="cc-om-detail-row"><span class="cc-om-detail-label">Amount</span><span class="cc-om-detail-value" style="color:#10B981;font-weight:700">${formatCurrency(order.amount)} ${order.currency}</span></div>
          <div class="cc-om-detail-row"><span class="cc-om-detail-label">Created</span><span class="cc-om-detail-value">${formatDate(order.created_at)}</span></div>
          <div class="cc-om-detail-row"><span class="cc-om-detail-label">Updated</span><span class="cc-om-detail-value">${formatDate(order.updated_at)}</span></div>
          ${order.tracking_number ? `<div class="cc-om-detail-row"><span class="cc-om-detail-label">Tracking</span><span class="cc-om-detail-value">${order.tracking_number}</span></div>` : ''}
        </div>

        ${payment ? `
          <h3>💳 Payment</h3>
          <div class="cc-om-detail-section">
            <div class="cc-om-detail-row"><span class="cc-om-detail-label">Transaction ID</span><span class="cc-om-detail-value">${payment.transaction_id}</span></div>
            <div class="cc-om-detail-row"><span class="cc-om-detail-label">Method</span><span class="cc-om-detail-value">${payment.method}</span></div>
            <div class="cc-om-detail-row"><span class="cc-om-detail-label">Amount</span><span class="cc-om-detail-value">${formatCurrency(payment.amount)}</span></div>
            <div class="cc-om-detail-row"><span class="cc-om-detail-label">Processor</span><span class="cc-om-detail-value">${payment.processor}</span></div>
            <div class="cc-om-detail-row"><span class="cc-om-detail-label">Processed At</span><span class="cc-om-detail-value">${formatDate(payment.processed_at)}</span></div>
            <div class="cc-om-detail-row"><span class="cc-om-detail-label">Status</span><span class="cc-om-detail-value"><span class="cc-om-status cc-om-status-paid">completed</span></span></div>
          </div>
        ` : ''}

        ${emails.length > 0 ? `
          <h3>📧 Emails Sent (${emails.length})</h3>
          <div class="cc-om-detail-section">
            ${emails.map(e => `
              <div class="cc-om-detail-row">
                <span class="cc-om-detail-label">${e.subject}</span>
                <span class="cc-om-detail-value" style="font-size:11px">${formatDate(e.sent_at)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <h3>📋 Audit Trail</h3>
        <div class="cc-om-timeline">
          ${audit.map(a => `
            <div class="cc-om-timeline-item">
              <div class="cc-om-timeline-event">${a.event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
              <div class="cc-om-timeline-time">${formatDate(a.timestamp)}</div>
              <div class="cc-om-timeline-details">${a.details}</div>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="cc-om-btn cc-om-btn-secondary" onclick="window.__ccOM.closeModal()" style="flex:1">Close</button>
          ${(order.status === 'pending' || order.status === 'processing') ? `
            <button class="cc-om-btn cc-om-btn-primary" onclick="window.__ccOM.openPaymentModal('${order.id}')" style="flex:1">💳 Accept Payment</button>
          ` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  function closeModal() {
    const overlay = document.getElementById('cc-om-modal-overlay');
    if (overlay) overlay.remove();
  }

  function closePanel() {
    const overlay = document.getElementById('cc-om-panel-overlay');
    if (overlay) overlay.remove();
  }

  function exportCSV() {
    const db = initDatabase();
    let orders = db.orders;
    if (currentFilter && currentFilter !== 'all') {
      orders = orders.filter(o => o.status === currentFilter);
    }
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      orders = orders.filter(o =>
        o.id.toLowerCase().indexOf(q) !== -1 ||
        o.client_name.toLowerCase().indexOf(q) !== -1 ||
        o.product.toLowerCase().indexOf(q) !== -1 ||
        o.client_email.toLowerCase().indexOf(q) !== -1
      );
    }
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const headers = ['Order ID', 'Client', 'Email', 'Country', 'Product', 'Category', 'Quantity', 'Amount', 'Currency', 'Status', 'Created', 'Tracking Number'];
    const rows = orders.map(o => [
      o.id,
      '"' + o.client_name.replace(/"/g, '""') + '"',
      o.client_email,
      o.client_country,
      '"' + o.product.replace(/"/g, '""') + '"',
      o.category,
      o.quantity,
      o.amount.toFixed(2),
      o.currency,
      o.status,
      o.created_at,
      o.tracking_number || ''
    ]);

    const csv = [headers.join(',')].concat(rows.map(r => r.join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'orders-export-' + new Date().toISOString().substr(0, 10) + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function createNewOrder() {
    const db = initDatabase();
    const client = SYNTHETIC_CLIENTS[Math.floor(Math.random() * SYNTHETIC_CLIENTS.length)];
    const template = ORDER_TEMPLATES[Math.floor(Math.random() * ORDER_TEMPLATES.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const amount = template.basePrice * quantity;
    const orderNum = 10001 + db.orders.length;
    const order = {
      id: 'ORD-' + String(orderNum),
      client_id: client.id,
      client_name: client.name,
      client_email: client.email,
      client_country: client.country,
      product: template.product,
      category: template.category,
      quantity: quantity,
      amount: amount,
      currency: 'USD',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payment_id: null,
      tracking_number: null,
      notes: 'Created via Create Order button'
    };
    db.orders.push(order);
    logAudit(db, order.id, 'order_created', 'Order created for ' + client.name + ' via Create Order button');
    saveDatabase(db);

    // Refresh the panel
    refreshPanelStats();
    renderOrdersTable(currentFilter, currentSearch);

    // Show a brief toast
    showToast('Order ' + order.id + ' created for ' + client.name + ' — ' + formatCurrency(amount));

    // Open the payment modal for the new order
    setTimeout(function() {
      openPaymentModal(order.id);
    }, 800);
  }

  // ------------------------------------------------------------------
  // STATUS PROGRESSION: paid → shipped → delivered
  // ------------------------------------------------------------------
  function markAsShipped(orderId) {
    const db = initDatabase();
    const order = db.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'paid') return;

    order.status = 'shipped';
    order.tracking_number = 'TRK' + Math.floor(Math.random() * 9000000 + 1000000);
    order.updated_at = new Date().toISOString();
    logAudit(db, order.id, 'order_shipped', 'Order shipped. Tracking: ' + order.tracking_number);

    // Send shipping confirmation email
    const email = {
      id: generateId('eml'),
      order_id: order.id,
      to: order.client_email,
      from: 'orders@aisupplychain-advanced.com',
      subject: 'Shipping Confirmation — ' + order.id + ' (Tracking: ' + order.tracking_number + ')',
      template: 'shipping_confirmation',
      sent_at: new Date().toISOString(),
      status: 'delivered',
      body: '<p>Dear ' + order.client_name + ',</p><p>Your order has been shipped!</p><p><strong>Tracking Number:</strong> ' + order.tracking_number + '</p><p>You can track your shipment using the tracking number above. Expected delivery within 2-3 business days.</p>'
    };
    logEmail(db, email);
    logAudit(db, order.id, 'shipping_email_sent', 'Shipping confirmation sent to ' + order.client_email);
    saveDatabase(db);

    showToast('Order ' + order.id + ' shipped — Tracking: ' + order.tracking_number);
    refreshPanelStats();
    renderOrdersTable(currentFilter, currentSearch);
  }

  function markAsDelivered(orderId) {
    const db = initDatabase();
    const order = db.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'shipped') return;

    order.status = 'delivered';
    order.updated_at = new Date().toISOString();
    logAudit(db, order.id, 'order_delivered', 'Order delivered to ' + order.client_name);

    // Send delivery confirmation email
    const email = {
      id: generateId('eml'),
      order_id: order.id,
      to: order.client_email,
      from: 'orders@aisupplychain-advanced.com',
      subject: 'Delivery Confirmed — ' + order.id,
      template: 'delivery_confirmation',
      sent_at: new Date().toISOString(),
      status: 'delivered',
      body: '<p>Dear ' + order.client_name + ',</p><p>Your order has been successfully delivered!</p><p>We hope you enjoy your purchase. If you have any questions or need support, please don\'t hesitate to contact us.</p><p>Thank you for choosing AI Supply Chain Advanced.</p>'
    };
    logEmail(db, email);
    logAudit(db, order.id, 'delivery_email_sent', 'Delivery confirmation sent to ' + order.client_email);
    saveDatabase(db);

    showToast('Order ' + order.id + ' delivered to ' + order.client_name);
    refreshPanelStats();
    renderOrdersTable(currentFilter, currentSearch);
  }

  // ------------------------------------------------------------------
  // RECEIPT PDF DOWNLOAD (via print-to-PDF)
  // ------------------------------------------------------------------
  function downloadReceipt(orderId) {
    const db = initDatabase();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return;
    const payment = db.payments.find(p => p.id === order.payment_id);
    if (!payment) {
      showToast('No payment found for order ' + orderId);
      return;
    }

    // Build a print-friendly receipt HTML
    const receiptHTML = generateReceiptHTML(order, payment);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to download the receipt');
      return;
    }
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    // Trigger print dialog after a short delay (allows rendering)
    setTimeout(function() {
      printWindow.print();
    }, 500);
  }

  function generateReceiptHTML(order, payment) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Receipt — ${order.id}</title>
<style>
  @page { margin: 20mm; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b; max-width: 600px; margin: 0 auto; padding: 40px 20px;
    line-height: 1.6;
  }
  .header {
    text-align: center; border-bottom: 3px solid #10B981;
    padding-bottom: 20px; margin-bottom: 30px;
  }
  .logo {
    font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px;
  }
  .logo span { color: #10B981; }
  .tagline { font-size: 12px; color: #64748b; }
  .receipt-title {
    font-size: 20px; font-weight: 700; color: #0f172a;
    margin: 30px 0 8px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .receipt-meta {
    font-size: 12px; color: #64748b; margin-bottom: 24px;
    display: flex; justify-content: space-between;
  }
  .section { margin-bottom: 24px; }
  .section h3 {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
    color: #64748b; margin: 0 0 8px; border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
  }
  .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .label { color: #64748b; }
  .value { color: #1e293b; font-weight: 500; }
  .total {
    background: #f0fdf4; border: 1px solid #10B981; border-radius: 8px;
    padding: 12px 16px; margin: 16px 0; display: flex; justify-content: space-between;
    align-items: center;
  }
  .total-label { font-size: 14px; font-weight: 700; color: #065f46; }
  .total-value { font-size: 20px; font-weight: 800; color: #10B981; }
  .status-badge {
    display: inline-block; padding: 3px 10px; border-radius: 12px;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    background: #dcfce7; color: #065f46; border: 1px solid #10B981;
  }
  .footer {
    margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;
    text-align: center; font-size: 11px; color: #94a3b8;
  }
  .footer a { color: #10B981; text-decoration: none; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">AI Supply Chain <span>Advanced</span></div>
    <div class="tagline">Enterprise Intelligence Platform</div>
  </div>

  <div class="receipt-title">Payment Receipt</div>
  <div class="receipt-meta">
    <span>Receipt #: ${payment.id.substr(-12).toUpperCase()}</span>
    <span>Date: ${formatDate(payment.processed_at)}</span>
  </div>

  <div class="section">
    <h3>Order Information</h3>
    <div class="row"><span class="label">Order ID</span><span class="value">${order.id}</span></div>
    <div class="row"><span class="label">Order Date</span><span class="value">${formatDate(order.created_at)}</span></div>
    <div class="row"><span class="label">Status</span><span class="value"><span class="status-badge">${order.status}</span></span></div>
    ${order.tracking_number ? '<div class="row"><span class="label">Tracking Number</span><span class="value">' + order.tracking_number + '</span></div>' : ''}
  </div>

  <div class="section">
    <h3>Client</h3>
    <div class="row"><span class="label">Name</span><span class="value">${order.client_name}</span></div>
    <div class="row"><span class="label">Email</span><span class="value">${order.client_email}</span></div>
    <div class="row"><span class="label">Country</span><span class="value">${order.client_country}</span></div>
  </div>

  <div class="section">
    <h3>Product</h3>
    <div class="row"><span class="label">Product</span><span class="value">${order.product}</span></div>
    <div class="row"><span class="label">Category</span><span class="value">${order.category}</span></div>
    <div class="row"><span class="label">Quantity</span><span class="value">${order.quantity}</span></div>
    <div class="row"><span class="label">Unit Price</span><span class="value">${formatCurrency(order.amount / order.quantity)}</span></div>
  </div>

  <div class="total">
    <span class="total-label">Total Paid</span>
    <span class="total-value">${formatCurrency(order.amount)} ${order.currency}</span>
  </div>

  <div class="section">
    <h3>Payment Details</h3>
    <div class="row"><span class="label">Transaction ID</span><span class="value">${payment.transaction_id}</span></div>
    <div class="row"><span class="label">Payment Method</span><span class="value">${payment.method}</span></div>
    <div class="row"><span class="label">Processor</span><span class="value">${payment.processor}</span></div>
    <div class="row"><span class="label">Processed At</span><span class="value">${formatDate(payment.processed_at)}</span></div>
    <div class="row"><span class="label">Payment Status</span><span class="value"><span class="status-badge">Completed</span></span></div>
  </div>

  <div class="footer">
    <p>This is a computer-generated receipt from AI Supply Chain Advanced.</p>
    <p>© 2026 AI Supply Chain Advanced. All rights reserved.</p>
    <p>71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</p>
    <p>Email: testdemoqwenai2025@gmail.com · Phone: +44 (0) 20 7946 0958</p>
    <p class="no-print" style="margin-top:16px;font-size:10px;color:#cbd5e1">Use your browser's "Save as PDF" option in the print dialog to save this receipt.</p>
  </div>
</body>
</html>`;
  }

  function showToast(message) {
    let toast = document.getElementById('cc-om-toast');
    if (toast) toast.remove();
    toast = document.createElement('div');
    toast.id = 'cc-om-toast';
    toast.style.cssText = [
      'position: fixed', 'bottom: 30px', 'left: 50%',
      "transform: translateX(-50%)",
      'background: linear-gradient(135deg, #10B981, #06B6D4)',
      'color: #fff', 'padding: 12px 24px', 'border-radius: 10px',
      'font-size: 13px', 'font-weight: 600', 'z-index: 10006',
      'box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4)',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'transition: opacity 0.3s, transform 0.3s',
      'max-width: 90vw', "text-align: center"
    ].join(';');
    toast.textContent = '✓ ' + message;
    document.body.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
  }

  function refreshPanelStats() {
    const db = initDatabase();
    const pendingCount = db.orders.filter(o => o.status === 'pending').length;
    const paidCount = db.orders.filter(o => ['paid', 'shipped', 'delivered'].includes(o.status)).length;
    const totalRevenue = db.payments.reduce((sum, p) => sum + p.amount, 0);

    const panel = document.getElementById('cc-om-panel');
    if (!panel) return;
    const stats = panel.querySelectorAll('.cc-om-stat-value');
    if (stats[0]) stats[0].textContent = pendingCount;
    if (stats[1]) stats[1].textContent = paidCount;
    if (stats[2]) stats[2].textContent = formatCurrency(totalRevenue);

    // Also refresh the chart
    renderChart();
  }

  // ------------------------------------------------------------------
  // ANALYTICS CHART
  // ------------------------------------------------------------------
  function renderChart() {
    const db = initDatabase();
    const chartContainer = document.getElementById('cc-om-chart-container');
    if (!chartContainer) return;

    // Orders by status
    const statusCounts = {
      pending: 0, processing: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0
    };
    db.orders.forEach(o => { if (statusCounts[o.status] !== undefined) statusCounts[o.status]++; });

    const maxCount = Math.max(...Object.values(statusCounts), 1);
    const statusColors = {
      pending: '#f59e0b', processing: '#3b82f6', paid: '#10B981',
      shipped: '#8b5cf6', delivered: '#14b8a6', cancelled: '#ef4444'
    };

    // Revenue last 7 days sparkline
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dayKey = d.toISOString().substr(0, 10);
      const dayRevenue = db.payments
        .filter(p => p.processed_at.substr(0, 10) === dayKey)
        .reduce((sum, p) => sum + p.amount, 0);
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayRevenue,
        date: dayKey
      });
    }
    const maxRevenue = Math.max(...days.map(d => d.revenue), 1);

    chartContainer.innerHTML = `
      <div class="cc-om-chart">
        <div class="cc-om-chart-section">
          <div class="cc-om-chart-title">Orders by Status</div>
          <div class="cc-om-chart-bars">
            ${Object.entries(statusCounts).map(([status, count]) => `
              <div class="cc-om-chart-bar-wrap">
                <div class="cc-om-chart-value">${count}</div>
                <div class="cc-om-chart-bar" style="height: ${(count / maxCount * 100)}%; background: ${statusColors[status]}" onclick="window.__ccOM.filterByStatus('${status}')">
                  <div class="cc-om-chart-bar-tooltip">${status}: ${count} order${count !== 1 ? 's' : ''}</div>
                </div>
                <div class="cc-om-chart-label">${status.substr(0, 4)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="cc-om-chart-section">
          <div class="cc-om-chart-title">Revenue — Last 7 Days</div>
          <div class="cc-om-chart-bars">
            ${days.map(d => `
              <div class="cc-om-chart-bar-wrap">
                <div class="cc-om-chart-value">${d.revenue > 0 ? '$' + (d.revenue / 1000).toFixed(0) + 'k' : ''}</div>
                <div class="cc-om-chart-bar" style="height: ${(d.revenue / maxRevenue * 100)}%; background: linear-gradient(180deg, #10B981, #06B6D4)" onclick="window.__ccOM.showDayRevenue('${d.date}', ${d.revenue})">
                  <div class="cc-om-chart-bar-tooltip">${d.label}: ${formatCurrency(d.revenue)}</div>
                </div>
                <div class="cc-om-chart-label">${d.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function filterByStatus(status) {
    // Switch to the tab for the clicked status
    const tab = document.querySelector('.cc-om-tab[data-filter="' + status + '"]');
    if (tab) tab.click();
  }

  function showDayRevenue(date, revenue) {
    showToast(formatCurrency(revenue) + ' revenue on ' + date);
  }

  // ------------------------------------------------------------------
  // BULK ACTIONS
  // ------------------------------------------------------------------
  let selectedOrderIds = new Set();

  function toggleSelectAll(checked) {
    document.querySelectorAll('.cc-om-row-checkbox').forEach(cb => {
      cb.checked = checked;
      if (checked) selectedOrderIds.add(cb.value);
      else selectedOrderIds.delete(cb.value);
    });
    updateBulkBar();
  }

  function updateBulkBar() {
    // Rebuild selected set from checkboxes
    selectedOrderIds = new Set();
    document.querySelectorAll('.cc-om-row-checkbox:checked').forEach(cb => {
      selectedOrderIds.add(cb.value);
    });

    const bulkBar = document.getElementById('cc-om-bulk-bar');
    const countEl = document.getElementById('cc-om-bulk-count');
    if (bulkBar && countEl) {
      const count = selectedOrderIds.size;
      countEl.textContent = count + ' order' + (count !== 1 ? 's' : '') + ' selected';
      if (count > 0) {
        bulkBar.classList.add('active');
      } else {
        bulkBar.classList.remove('active');
      }
    }
  }

  function clearSelection() {
    document.querySelectorAll('.cc-om-row-checkbox').forEach(cb => { cb.checked = false; });
    const selectAll = document.getElementById('cc-om-select-all');
    if (selectAll) selectAll.checked = false;
    selectedOrderIds = new Set();
    updateBulkBar();
  }

  function getSelectedOrders() {
    const db = initDatabase();
    return db.orders.filter(o => selectedOrderIds.has(o.id));
  }

  function bulkShip() {
    const orders = getSelectedOrders();
    const shippable = orders.filter(o => o.status === 'paid');
    if (shippable.length === 0) {
      showToast('No paid orders selected (only paid orders can be shipped)');
      return;
    }
    if (!confirm('Ship ' + shippable.length + ' order' + (shippable.length !== 1 ? 's' : '') + '?')) return;
    shippable.forEach(o => markAsShipped(o.id));
    clearSelection();
  }

  function bulkDeliver() {
    const orders = getSelectedOrders();
    const deliverable = orders.filter(o => o.status === 'shipped');
    if (deliverable.length === 0) {
      showToast('No shipped orders selected (only shipped orders can be delivered)');
      return;
    }
    if (!confirm('Deliver ' + deliverable.length + ' order' + (deliverable.length !== 1 ? 's' : '') + '?')) return;
    deliverable.forEach(o => markAsDelivered(o.id));
    clearSelection();
  }

  function bulkExportCSV() {
    const orders = getSelectedOrders();
    if (orders.length === 0) {
      showToast('No orders selected');
      return;
    }
    const headers = ['Order ID', 'Client', 'Email', 'Country', 'Product', 'Category', 'Quantity', 'Amount', 'Currency', 'Status', 'Created', 'Tracking Number'];
    const rows = orders.map(o => [
      o.id,
      '"' + o.client_name.replace(/"/g, '""') + '"',
      o.client_email,
      o.client_country,
      '"' + o.product.replace(/"/g, '""') + '"',
      o.category,
      o.quantity,
      o.amount.toFixed(2),
      o.currency,
      o.status,
      o.created_at,
      o.tracking_number || ''
    ]);
    const csv = [headers.join(',')].concat(rows.map(r => r.join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'selected-orders-' + new Date().toISOString().substr(0, 10) + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported ' + orders.length + ' order' + (orders.length !== 1 ? 's' : '') + ' to CSV');
    clearSelection();
  }

  function resetDatabase() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(EMAIL_LOG_KEY);
    closePanel();
    openPanel();
  }

  // ------------------------------------------------------------------
  // OPEN PANEL (replaces the old auto-inject)
  // ------------------------------------------------------------------
  function openPanel() {
    // Remove any existing panel
    closePanel();
    // Clear any previous selection
    selectedOrderIds = new Set();
    // Render and append the panel
    const panel = renderOrdersPanel();
    document.body.appendChild(panel);
    // Render chart + initial orders table
    renderChart();
    renderOrdersTable('all', '');
    // Wire up events
    wireUpPanelEvents();
  }

  function wireUpPanelEvents() {
    // Tab clicks
    document.querySelectorAll('.cc-om-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.cc-om-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderOrdersTable(tab.dataset.filter, currentSearch);
      });
    });
    // Search input
    const searchInput = document.getElementById('cc-om-search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          renderOrdersTable(currentFilter, searchInput.value);
        }, 200);
      });
    }
    // Export CSV
    const exportBtn = document.getElementById('cc-om-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportCSV);
    }
    // New Order
    const newOrderBtn = document.getElementById('cc-om-new-order');
    if (newOrderBtn) {
      newOrderBtn.addEventListener('click', createNewOrder);
    }
    // Reset Data
    const resetBtn = document.getElementById('cc-om-reset-db');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        if (confirm('Reset all demo data? This will regenerate the synthetic database with fresh orders.')) {
          resetDatabase();
        }
      });
    }
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();

    // Expose API for onclick handlers
    window.__ccOM = {
      openPaymentModal: openPaymentModal,
      processPayment: processPayment,
      showOrderDetail: showOrderDetail,
      closeModal: closeModal,
      closePanel: closePanel,
      openPanel: openPanel,
      exportCSV: exportCSV,
      createNewOrder: createNewOrder,
      markAsShipped: markAsShipped,
      markAsDelivered: markAsDelivered,
      downloadReceipt: downloadReceipt,
      filterByStatus: filterByStatus,
      showDayRevenue: showDayRevenue,
      toggleSelectAll: toggleSelectAll,
      updateBulkBar: updateBulkBar,
      clearSelection: clearSelection,
      bulkShip: bulkShip,
      bulkDeliver: bulkDeliver,
      bulkExportCSV: bulkExportCSV,
      resetDatabase: resetDatabase
    };

    // Inject a "Create Order" button into the SPA
    function injectCreateOrderButton() {
      if (document.getElementById('cc-om-trigger-btn')) return;

      const btn = document.createElement('button');
      btn.id = 'cc-om-trigger-btn';
      btn.style.cssText = [
        'position: fixed',
        'bottom: 200px',
        'right: 20px',
        'z-index: 9999',
        'padding: 14px 24px',
        'border-radius: 12px',
        'background: linear-gradient(135deg, #10B981, #06B6D4)',
        'color: #fff',
        'border: none',
        'font-size: 14px',
        'font-weight: 700',
        'cursor: pointer',
        'box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4)',
        'transition: all 0.2s',
        'display: flex',
        'align-items: center',
        'gap: 8px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> Create Order';
      btn.setAttribute('aria-label', 'Open Order Management — create a new order');
      btn.onmouseover = function() {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.5)';
      };
      btn.onmouseout = function() {
        btn.style.transform = '';
        btn.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
      };
      btn.onclick = function() { openPanel(); };
      document.body.appendChild(btn);

      // Also add a small badge showing pending order count
      const db = initDatabase();
      const pendingCount = db.orders.filter(o => o.status === 'pending').length;
      if (pendingCount > 0) {
        const badge = document.createElement('span');
        badge.style.cssText = [
          'position: absolute',
          'top: -6px',
          'right: -6px',
          'background: #ef4444',
          'color: #fff',
          'font-size: 10px',
          'font-weight: 700',
          'padding: 2px 6px',
          'border-radius: 10px',
          'min-width: 18px',
          'text-align: center',
          'border: 2px solid #0a0a0a'
        ].join(';');
        badge.textContent = pendingCount;
        btn.style.position = 'fixed';
        btn.appendChild(badge);
      }

      console.log('[order-management.js] "Create Order" button injected. Click to open the order management panel.');
    }

    // The SPA takes time to render — retry button injection
    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-om-trigger-btn')) return;
      if (attempts > 20) return;
      injectCreateOrderButton();
      if (!document.getElementById('cc-om-trigger-btn')) {
        setTimeout(tryInject, 500);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(tryInject, 1500);
      });
    } else {
      setTimeout(tryInject, 1500);
    }

    // Keyboard shortcut: press "O" to open order management
    document.addEventListener('keydown', function(e) {
      if (e.key === 'o' || e.key === 'O') {
        // Don't trigger if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
        if (e.metaKey || e.ctrlKey) return;
        if (!document.getElementById('cc-om-panel-overlay')) {
          openPanel();
          e.preventDefault();
        }
      }
      // ESC to close panel
      if (e.key === 'Escape') {
        if (document.getElementById('cc-om-panel-overlay')) {
          closePanel();
        }
      }
    });
  }

  init();
})();
