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
        background: rgba(10, 10, 10, 0.95);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 16px;
        padding: 24px;
        margin: 20px 0;
        color: #e2e8f0;
        backdrop-filter: blur(10px);
      }
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
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER ORDERS PANEL
  // ------------------------------------------------------------------
  function renderOrdersPanel() {
    const db = initDatabase();
    const pendingCount = db.orders.filter(o => o.status === 'pending').length;
    const paidCount = db.orders.filter(o => ['paid', 'shipped', 'delivered'].includes(o.status)).length;
    const totalRevenue = db.payments.reduce((sum, p) => sum + p.amount, 0);

    const panel = document.createElement('div');
    panel.id = 'cc-om-panel';
    panel.className = 'cc-om-panel';
    panel.innerHTML = `
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
        <button class="cc-om-btn cc-om-btn-secondary" id="cc-om-reset-db">
          ↻ Reset Demo Data
        </button>
      </div>

      <div id="cc-om-orders-container"></div>
    `;

    return panel;
  }

  function renderOrdersTable(filter) {
    const db = initDatabase();
    let orders = db.orders;
    if (filter && filter !== 'all') {
      orders = orders.filter(o => o.status === filter);
    }
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const container = document.getElementById('cc-om-orders-container');
    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;font-size:13px">No orders with this status.</div>';
      return;
    }

    container.innerHTML = `
      <div class="cc-om-orders-scroll">
      <table class="cc-om-table">
        <thead>
          <tr>
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
              <td><span class="cc-om-order-id" onclick="window.__ccOM.showOrderDetail('${o.id}')">${o.id}</span></td>
              <td>${o.client_name}<div style="font-size:10px;color:#64748b">${o.client_country}</div></td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.product}</td>
              <td class="cc-om-amount">${formatCurrency(o.amount)}</td>
              <td><span class="cc-om-status cc-om-status-${o.status}">${o.status}</span></td>
              <td style="font-size:11px;color:#64748b">${new Date(o.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}</td>
              <td>
                ${o.status === 'pending' || o.status === 'processing'
                  ? `<button class="cc-om-btn cc-om-btn-primary" onclick="window.__ccOM.openPaymentModal('${o.id}')">💳 Accept Payment</button>`
                  : o.status === 'paid' || o.status === 'shipped'
                  ? `<button class="cc-om-btn cc-om-btn-secondary" onclick="window.__ccOM.showOrderDetail('${o.id}')">View</button>`
                  : `<button class="cc-om-btn cc-om-btn-secondary" onclick="window.__ccOM.showOrderDetail('${o.id}')">View</button>`
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
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
  }

  function resetDatabase() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(EMAIL_LOG_KEY);
    location.reload();
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
      resetDatabase: resetDatabase
    };

    function findAndInject() {
      // Try to find the main content area where Orders would appear
      // The SPA renders content dynamically, so we look for the overview/monitoring area
      const mainContent = document.querySelector('main, [class*="main-content"], [class*="overview"], [class*="Overview"]');

      // If we can't find the main content, inject after the auth bar / top area
      let target = mainContent;
      if (!target) {
        // Look for the content area after the sidebar
        const contentArea = document.querySelector('[class*="flex-1"], [class*="content-area"]');
        target = contentArea || document.body;
      }

      // Check if already injected
      if (document.getElementById('cc-om-panel')) return;

      // Inject the panel
      const panel = renderOrdersPanel();
      if (mainContent && mainContent.tagName !== 'BODY') {
        mainContent.appendChild(panel);
      } else {
        // Insert near the top of the content area
        const contentDiv = document.querySelector('[class*="flex-1"] > div, main > div');
        if (contentDiv) {
          contentDiv.parentElement.insertBefore(panel, contentDiv.nextSibling);
        } else {
          document.body.appendChild(panel);
        }
      }

      // Render initial orders table
      renderOrdersTable('all');

      // Wire up tab clicks
      document.querySelectorAll('.cc-om-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.cc-om-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          renderOrdersTable(tab.dataset.filter);
        });
      });

      // Wire up reset button
      const resetBtn = document.getElementById('cc-om-reset-db');
      if (resetBtn) {
        resetBtn.addEventListener('click', function() {
          if (confirm('Reset all demo data? This will regenerate the synthetic database with fresh orders.')) {
            resetDatabase();
          }
        });
      }

      console.log('[order-management.js] Order management system injected. 12 synthetic orders loaded.');
    }

    // The SPA takes time to render — retry injection
    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-om-panel')) return;
      if (attempts > 20) {
        // Fallback: just append to body
        if (!document.getElementById('cc-om-panel')) {
          const panel = renderOrdersPanel();
          document.body.appendChild(panel);
          renderOrdersTable('all');
          wireUpEvents();
        }
        return;
      }
      findAndInject();
      if (!document.getElementById('cc-om-panel')) {
        setTimeout(tryInject, 500);
      }
    }

    function wireUpEvents() {
      document.querySelectorAll('.cc-om-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.cc-om-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          renderOrdersTable(tab.dataset.filter);
        });
      });
      const resetBtn = document.getElementById('cc-om-reset-db');
      if (resetBtn) {
        resetBtn.addEventListener('click', function() {
          if (confirm('Reset all demo data?')) resetDatabase();
        });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(tryInject, 1000);
      });
    } else {
      setTimeout(tryInject, 1000);
    }
  }

  init();
})();
