// ====================================================================
// dispatch-dashboard.js — Global Dispatch Dashboard
// ====================================================================
// Unified dispatch dashboard with 5 modules:
//   1. Overview — Supply chain health scorecard
//   2. Ports — Top 10 world ports with real-time vessel/berth/congestion
//   3. WMS — 4 warehouses with inventory, pick/pack/ship, labor
//   4. AI Forecasting — Demand prediction with ML accuracy metrics
//   5. Control Tower — Unified alerts + event timeline
//
// Architecture: 90% reusable from order/tender management pattern
// Data: Synthetic real-time (updates every 30s for ports/vessels)
// ====================================================================
(function() {
  'use strict';

  if (window.__dispatchDashboardLoaded) return;
  window.__dispatchDashboardLoaded = true;

  // ------------------------------------------------------------------
  // DATABASE
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_dispatch_db_v1';

  function generateId(prefix) {
    return prefix + '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(amount) {
    if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return '$' + (amount / 1000).toFixed(0) + 'k';
    return '$' + amount.toFixed(0);
  }

  function formatTEU(teu) {
    if (teu >= 1000000) return (teu / 1000000).toFixed(1) + 'M TEU';
    if (teu >= 1000) return (teu / 1000).toFixed(0) + 'k TEU';
    return teu + ' TEU';
  }

  // Top 10 world ports by container throughput (real-world data)
  const WORLD_PORTS = [
    { id: 'p01', name: 'Port of Shanghai', country: 'China', region: 'Asia', annualTEU: 47000000, berths: 125, lat: 31.2, lng: 121.5 },
    { id: 'p02', name: 'Port of Singapore', country: 'Singapore', region: 'Asia', annualTEU: 37200000, berths: 67, lat: 1.3, lng: 103.8 },
    { id: 'p03', name: 'Port of Ningbo-Zhoushan', country: 'China', region: 'Asia', annualTEU: 33400000, berths: 98, lat: 29.9, lng: 121.6 },
    { id: 'p04', name: 'Port of Shenzhen', country: 'China', region: 'Asia', annualTEU: 30000000, berths: 89, lat: 22.5, lng: 113.9 },
    { id: 'p05', name: 'Port of Guangzhou', country: 'China', region: 'Asia', annualTEU: 24200000, berths: 76, lat: 23.1, lng: 113.3 },
    { id: 'p06', name: 'Port of Busan', country: 'South Korea', region: 'Asia', annualTEU: 22100000, berths: 62, lat: 35.1, lng: 129.0 },
    { id: 'p07', name: 'Port of Qingdao', country: 'China', region: 'Asia', annualTEU: 24000000, berths: 71, lat: 36.1, lng: 120.3 },
    { id: 'p08', name: 'Port of Rotterdam', country: 'Netherlands', region: 'Europe', annualTEU: 15300000, berths: 54, lat: 51.9, lng: 4.5 },
    { id: 'p09', name: 'Port of Los Angeles', country: 'United States', region: 'Americas', annualTEU: 10600000, berths: 48, lat: 33.7, lng: -118.3 },
    { id: 'p10', name: 'Port of Hamburg', country: 'Germany', region: 'Europe', annualTEU: 8300000, berths: 42, lat: 53.5, lng: 10.0 }
  ];

  const VESSEL_NAMES = ['Ever Given', 'Maersk Seletar', 'MSC Gulgun', 'CMA CGM Marco Polo', 'Cosco Shipping Universe', 'HMM Rotterdam', 'ONE Innovation', 'Hapag-Lloyd Berlin', 'OOCL Hong Kong', 'Yang Ming TipTop', 'Ever Lotus', 'Maersk Halifax', 'MSC Altair', 'CMA CGM Antoine', 'Zim USA', 'Matson Kodiak', 'Wan Hai 321', 'SITC Osaka', 'X-Press Pearl', 'NYK Constellation'];

  const VESSEL_TYPES = ['Container Ship', 'Bulk Carrier', 'Tanker', 'RoRo', 'Reefer'];

  const WAREHOUSES = [
    { id: 'wh01', name: 'Rotterdam DC-1', location: 'Rotterdam, Netherlands', capacity: 50000, lat: 51.9, lng: 4.5, zone: 'Europe' },
    { id: 'wh02', name: 'Singapore Hub', location: 'Singapore', capacity: 65000, lat: 1.3, lng: 103.8, zone: 'Asia' },
    { id: 'wh03', name: 'LA Distribution Center', location: 'Los Angeles, USA', capacity: 45000, lat: 33.7, lng: -118.3, zone: 'Americas' },
    { id: 'wh04', name: 'Dubai Logistics City', location: 'Dubai, UAE', capacity: 55000, lat: 25.0, lng: 55.3, zone: 'ME/Africa' }
  ];

  const SKU_CATEGORIES = ['Electronics', 'Apparel', 'Food & Beverage', 'Pharma', 'Automotive', 'Industrial', 'Consumer Goods', 'Chemicals'];

  const SKU_NAMES = [
    'Laptop 15" Pro', 'Wireless Earbuds', 'USB-C Hub', '4K Monitor', 'Gaming Mouse',
    'Cotton T-Shirt', 'Denim Jeans', 'Winter Jacket', 'Running Shoes', 'Leather Belt',
    'Organic Coffee 1kg', 'Bottled Water 24pk', 'Chocolate Box', 'Green Tea 100pk', 'Olive Oil 500ml',
    'Paracetamol 500mg', 'Vitamin D3', 'First Aid Kit', 'Surgical Gloves 100pk', 'Insulin Vials',
    'Brake Pads Set', 'Oil Filter', 'Spark Plugs 4pk', 'Wiper Blades', 'Engine Coolant',
    'Steel Pipes 2m', 'Cement Bag 25kg', 'PVC Fittings', 'Electrical Wire 100m', 'Paint 5L',
    'Smartphone Case', 'Power Bank 20000mAh', 'Phone Charger', 'Bluetooth Speaker', 'Phone Stand',
    'Industrial Solvent 1L', 'Cleaning Solution 5L', 'Safety Goggles', 'Nitrile Gloves 100pk', 'Dust Mask 50pk'
  ];

  const FORECAST_MODELS = ['ARIMA', 'Prophet', 'LSTM Neural Net', 'XGBoost', 'Ensemble'];

  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch(e) {}
    if (db && db.ports && db.ports.length > 0) return db;

    db = {
      ports: [], vessels: [], warehouses: [], inventory: [], operations: [],
      forecasts: [], alerts: [], events: [],
      meta: { created: new Date().toISOString(), version: 1, lastUpdate: new Date().toISOString() }
    };

    // Generate port data
    WORLD_PORTS.forEach((port, i) => {
      const vesselsInPort = Math.floor(Math.random() * 30) + 15;
      const vesselsApproaching = Math.floor(Math.random() * 12) + 3;
      const berthsOccupied = Math.floor(port.berths * (0.6 + Math.random() * 0.3));
      const congestionLevel = berthsOccupied / port.berths > 0.85 ? 'high' : berthsOccupied / port.berths > 0.7 ? 'medium' : 'low';
      const avgWaitTime = congestionLevel === 'high' ? Math.floor(Math.random() * 24) + 24 : congestionLevel === 'medium' ? Math.floor(Math.random() * 12) + 8 : Math.floor(Math.random() * 6) + 2;

      db.ports.push({
        ...port,
        vessels_in_port: vesselsInPort,
        vessels_approaching: vesselsApproaching,
        berths_occupied: berthsOccupied,
        berths_available: port.berths - berthsOccupied,
        berth_utilization: Math.round(berthsOccupied / port.berths * 100),
        congestion_level: congestionLevel,
        avg_wait_hours: avgWaitTime,
        daily_throughput: Math.floor(port.annualTEU / 365 * (0.8 + Math.random() * 0.4)),
        customs_clearance_rate: Math.round((85 + Math.random() * 12) * 10) / 10,
        demurrage_rate: Math.floor(Math.random() * 50) + 75,
        status: congestionLevel === 'high' ? 'congested' : 'operational',
        last_update: new Date().toISOString()
      });

      // Generate vessels for each port
      for (let v = 0; v < vesselsInPort; v++) {
        db.vessels.push({
          id: generateId('vsl'),
          name: VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)] + ' ' + (Math.floor(Math.random() * 900) + 100),
          port_id: port.id,
          port_name: port.name,
          type: VESSEL_TYPES[Math.floor(Math.random() * VESSEL_TYPES.length)],
          status: ['berthed', 'anchored', 'maneuvering', 'departing'][Math.floor(Math.random() * 4)],
          berth_number: Math.random() > 0.4 ? 'B-' + (Math.floor(Math.random() * port.berths) + 1) : null,
          eta: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 48 * 3600000).toISOString() : null,
          atd: Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 12 * 3600000).toISOString() : null,
          cargo_teu: Math.floor(Math.random() * 15000) + 1000,
          vessel_length: Math.floor(Math.random() * 200) + 200,
          flag: ['Panama', 'Liberia', 'Marshall Islands', 'Singapore', 'Hong Kong', 'Malta'][Math.floor(Math.random() * 6)],
          agent: ['Maersk', 'MSC', 'CMA CGM', 'COSCO', 'Hapag-Lloyd', 'ONE'][Math.floor(Math.random() * 6)]
        });
      }
    });

    // Generate warehouse data
    WAREHOUSES.forEach(wh => {
      const utilization = Math.floor(Math.random() * 25) + 65;
      const staff = Math.floor(Math.random() * 20) + 25;
      const activeStaff = Math.floor(staff * (0.8 + Math.random() * 0.15));

      db.warehouses.push({
        ...wh,
        utilized: Math.floor(wh.capacity * utilization / 100),
        utilization_pct: utilization,
        total_staff: staff,
        active_staff: activeStaff,
        pending_inbound: Math.floor(Math.random() * 15) + 5,
        pending_outbound: Math.floor(Math.random() * 20) + 10,
        orders_today: Math.floor(Math.random() * 150) + 80,
        picks_today: Math.floor(Math.random() * 300) + 200,
        packs_today: Math.floor(Math.random() * 250) + 180,
        ships_today: Math.floor(Math.random() * 200) + 150,
        pick_accuracy: Math.round((96 + Math.random() * 3.5) * 10) / 10,
        avg_pick_time: Math.floor(Math.random() * 30) + 35,
        status: utilization > 85 ? 'high-capacity' : 'operational'
      });

      // Generate inventory for each warehouse
      SKU_NAMES.forEach((skuName, si) => {
        const maxQty = Math.floor(Math.random() * 800) + 200;
        const currentQty = Math.floor(Math.random() * maxQty);
        const category = SKU_CATEGORIES[si % SKU_CATEGORIES.length];
        db.inventory.push({
          id: generateId('inv'),
          warehouse_id: wh.id,
          warehouse_name: wh.name,
          sku: 'SKU-' + String(10001 + si),
          name: skuName,
          category: category,
          quantity: currentQty,
          max_quantity: maxQty,
          reorder_point: Math.floor(maxQty * 0.2),
          unit_value: Math.floor(Math.random() * 500) + 5,
          location: 'A-' + (Math.floor(Math.random() * 20) + 1) + '-' + (Math.floor(Math.random() * 10) + 1),
          last_count: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
          status: currentQty < maxQty * 0.2 ? 'low-stock' : currentQty < maxQty * 0.1 ? 'critical' : 'in-stock'
        });
      });
    });

    // Generate AI demand forecasts for top 10 SKUs
    const topSkus = SKU_NAMES.slice(0, 10).map((name, i) => ({
      sku: 'SKU-' + String(10001 + i),
      name: name,
      category: SKU_CATEGORIES[i % SKU_CATEGORIES.length]
    }));

    topSkus.forEach(sku => {
      const model = FORECAST_MODELS[Math.floor(Math.random() * FORECAST_MODELS.length)];
      const historical = [];
      const forecast = [];
      const confidenceLow = [];
      const confidenceHigh = [];

      // Generate 30 days historical
      let baseDemand = Math.floor(Math.random() * 200) + 50;
      for (let d = 29; d >= 0; d--) {
        const date = new Date(Date.now() - d * 86400000);
        const demand = Math.max(0, Math.floor(baseDemand + (Math.random() - 0.5) * 80 + Math.sin(d / 3) * 30));
        historical.push({ date: date.toISOString().substr(0, 10), value: demand });
        baseDemand = demand * 0.3 + baseDemand * 0.7;
      }

      // Generate 7-day forecast with confidence intervals
      const lastValue = historical[historical.length - 1].value;
      const trend = (historical[historical.length - 1].value - historical[0].value) / 30;
      for (let d = 1; d <= 7; d++) {
        const date = new Date(Date.now() + d * 86400000);
        const predicted = Math.max(0, Math.floor(lastValue + trend * d + (Math.random() - 0.5) * 40));
        const confidence = Math.floor(15 + d * 3);
        forecast.push({ date: date.toISOString().substr(0, 10), value: predicted });
        confidenceLow.push({ date: date.toISOString().substr(0, 10), value: Math.max(0, predicted - confidence) });
        confidenceHigh.push({ date: date.toISOString().substr(0, 10), value: predicted + confidence });
      }

      const mape = Math.round((5 + Math.random() * 12) * 10) / 10;
      const accuracy = Math.round((100 - mape) * 10) / 10;
      const stockoutRisk = Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low';

      db.forecasts.push({
        id: generateId('fc'),
        sku: sku.sku,
        sku_name: sku.name,
        category: sku.category,
        model: model,
        historical: historical,
        forecast: forecast,
        confidence_low: confidenceLow,
        confidence_high: confidenceHigh,
        mape: mape,
        accuracy: accuracy,
        stockout_risk: stockoutRisk,
        predicted_stockout_date: stockoutRisk === 'high' ? new Date(Date.now() + Math.random() * 5 * 86400000).toISOString() : null,
        reorder_recommended: stockoutRisk !== 'low',
        last_trained: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString()
      });
    });

    // Generate alerts
    db.ports.forEach(p => {
      if (p.congestion_level === 'high') {
        db.alerts.push({
          id: generateId('alt'),
          severity: 'high',
          module: 'ports',
          source: p.name,
          title: 'Port Congestion Critical',
          message: p.name + ' at ' + p.berth_utilization + '% berth utilization. Average wait: ' + p.avg_wait_hours + 'h',
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          acknowledged: false
        });
      }
    });
    db.warehouses.forEach(w => {
      if (w.utilization_pct > 80) {
        db.alerts.push({
          id: generateId('alt'),
          severity: 'medium',
          module: 'wms',
          source: w.name,
          title: 'Warehouse Near Capacity',
          message: w.name + ' at ' + w.utilization_pct + '% capacity. Consider redistributing inventory.',
          timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
          acknowledged: false
        });
      }
    });
    db.forecasts.forEach(f => {
      if (f.stockout_risk === 'high') {
        db.alerts.push({
          id: generateId('alt'),
          severity: 'high',
          module: 'forecast',
          source: f.sku_name,
          title: 'Stockout Predicted',
          message: f.sku_name + ' (' + f.sku + ') predicted to stock out by ' + new Date(f.predicted_stockout_date).toLocaleDateString() + '. Reorder recommended.',
          timestamp: new Date(Date.now() - Math.random() * 10800000).toISOString(),
          acknowledged: false
        });
      }
    });

    // Generate event timeline (20 recent events)
    const eventTemplates = [
      { module: 'ports', text: 'Vessel {vessel} berthed at {port}', type: 'info' },
      { module: 'ports', text: 'Vessel {vessel} departed from {port}', type: 'info' },
      { module: 'ports', text: 'Congestion alert raised at {port}', type: 'warning' },
      { module: 'wms', text: 'Inbound shipment received at {warehouse}', type: 'info' },
      { module: 'wms', text: 'Pick accuracy milestone: {pct}% at {warehouse}', type: 'success' },
      { module: 'wms', text: 'Low stock alert: {sku} at {warehouse}', type: 'warning' },
      { module: 'forecast', text: 'ML model retrained for {sku} (accuracy: {pct}%)', type: 'info' },
      { module: 'forecast', text: 'Stockout prediction: {sku} in {days} days', type: 'warning' },
      { module: 'system', text: 'Dispatch dashboard sync completed', type: 'info' },
      { module: 'system', text: 'AI forecast batch job completed (10 SKUs)', type: 'success' }
    ];

    for (let i = 0; i < 20; i++) {
      const tmpl = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const port = WORLD_PORTS[Math.floor(Math.random() * WORLD_PORTS.length)];
      const wh = WAREHOUSES[Math.floor(Math.random() * WAREHOUSES.length)];
      const sku = SKU_NAMES[Math.floor(Math.random() * 10)];
      const vessel = VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)];
      let text = tmpl.text
        .replace('{port}', port.name)
        .replace('{warehouse}', wh.name)
        .replace('{sku}', sku)
        .replace('{vessel}', vessel)
        .replace('{pct}', (95 + Math.floor(Math.random() * 5)))
        .replace('{days}', Math.floor(Math.random() * 5) + 1);

      db.events.push({
        id: generateId('evt'),
        module: tmpl.module,
        type: tmpl.type,
        text: text,
        timestamp: new Date(Date.now() - i * Math.random() * 3600000).toISOString()
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
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-dd-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-dd-styles';
    style.textContent = `
      .cc-dd-modal {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 10004; background: rgba(8,10,16,0.99);
        display: flex; overflow: hidden;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        color: #e2e8f0;
      }
      .cc-dd-sidebar {
        width: 220px; flex-shrink: 0; background: rgba(15,23,42,0.6);
        border-right: 1px solid rgba(255,255,255,0.06);
        padding: 60px 0 20px; overflow-y: auto;
        display: flex; flex-direction: column;
      }
      .cc-dd-sidebar-brand {
        padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
        margin-bottom: 12px;
      }
      .cc-dd-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
      .cc-dd-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-dd-nav-item {
        display: flex; align-items: center; gap: 10px;
        padding: 11px 20px; font-size: 13px; font-weight: 600;
        color: #94a3b8; cursor: pointer; transition: all 0.2s;
        border-left: 3px solid transparent; text-decoration: none;
        font-family: inherit;
      }
      .cc-dd-nav-item:hover { background: rgba(255,255,255,0.03); color: #e2e8f0; }
      .cc-dd-nav-item.active {
        background: rgba(6,182,212,0.08); color: #06B6D4;
        border-left-color: #06B6D4;
      }
      .cc-dd-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-dd-nav-badge {
        margin-left: auto; font-size: 9px; padding: 1px 6px;
        border-radius: 8px; background: rgba(239,68,68,0.2); color: #ef4444; font-weight: 700;
      }
      .cc-dd-main {
        flex: 1; overflow-y: auto; padding: 60px 24px 24px;
      }
      .cc-dd-close {
        position: fixed; top: 16px; right: 20px; z-index: 10005;
        width: 40px; height: 40px; border-radius: 10px;
        background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
        color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1;
        display: flex; align-items: center; justify-content: center;
      }
      .cc-dd-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-dd-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 20px; padding-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 12px;
      }
      .cc-dd-page-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-dd-page-badge {
        font-size: 10px; padding: 3px 8px; border-radius: 10px;
        background: linear-gradient(135deg, #06B6D4, #3b82f6); color: #fff;
        font-weight: 600; letter-spacing: 0.03em;
      }
      .cc-dd-live-indicator {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 11px; color: #10B981; font-weight: 600;
      }
      .cc-dd-live-dot {
        width: 8px; height: 8px; border-radius: 50%; background: #10B981;
        animation: cc-dd-pulse 1.5s ease-in-out infinite;
      }
      @keyframes cc-dd-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

      .cc-dd-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-dd-card {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px; padding: 16px;
      }
      .cc-dd-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
      .cc-dd-card-value { font-size: 24px; font-weight: 800; color: #fff; }
      .cc-dd-card-delta { font-size: 11px; margin-top: 4px; }
      .cc-dd-delta-up { color: #10B981; }
      .cc-dd-delta-down { color: #ef4444; }
      .cc-dd-delta-neutral { color: #64748b; }

      .cc-dd-section {
        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
        border-radius: 10px; padding: 20px; margin-bottom: 20px;
      }
      .cc-dd-section-title {
        font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px;
        display: flex; align-items: center; gap: 6px;
      }

      .cc-dd-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-dd-table th {
        text-align: left; padding: 10px 8px; font-size: 10px;
        text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      .cc-dd-table td {
        padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04);
        color: #cbd5e1; vertical-align: middle;
      }
      .cc-dd-table tr:hover td { background: rgba(6,182,212,0.04); }
      .cc-dd-scroll {
        max-height: 420px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06);
        border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(6,182,212,0.4) transparent;
      }
      .cc-dd-scroll::-webkit-scrollbar { width: 8px; }
      .cc-dd-scroll::-webkit-scrollbar-track { background: transparent; }
      .cc-dd-scroll::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 4px; }

      .cc-dd-status {
        display: inline-block; padding: 3px 10px; border-radius: 12px;
        font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
      }
      .cc-dd-status-operational { background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); }
      .cc-dd-status-congested { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-dd-status-high-capacity { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-dd-status-low { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-dd-status-critical { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-dd-status-in-stock { background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); }

      .cc-dd-congestion-bar {
        display: inline-block; width: 80px; height: 8px; border-radius: 4px;
        background: rgba(255,255,255,0.08); overflow: hidden; vertical-align: middle; margin-right: 6px;
      }
      .cc-dd-congestion-fill { height: 100%; border-radius: 4px; }

      .cc-dd-tabs {
        display: flex; gap: 4px; margin-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap;
      }
      .cc-dd-tab {
        padding: 8px 16px; font-size: 12px; font-weight: 600;
        background: none; border: none; color: #94a3b8; cursor: pointer;
        border-bottom: 2px solid transparent; transition: all 0.2s; font-family: inherit;
      }
      .cc-dd-tab.active { color: #06B6D4; border-bottom-color: #06B6D4; }
      .cc-dd-tab:hover { color: #e2e8f0; }

      .cc-dd-search {
        padding: 8px 14px 8px 36px; border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
        color: #fff; font-size: 13px; font-family: inherit;
        width: 280px; max-width: 100%; box-sizing: border-box;
      }
      .cc-dd-search:focus { outline: none; border-color: #06B6D4; }
      .cc-dd-search-wrap { position: relative; display: inline-block; }
      .cc-dd-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; }

      .cc-dd-bars { display: flex; align-items: flex-end; gap: 6px; height: 140px; padding: 0 4px; }
      .cc-dd-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
      .cc-dd-bar {
        width: 100%; max-width: 36px; border-radius: 4px 4px 0 0;
        min-height: 4px; position: relative; cursor: pointer; transition: opacity 0.2s;
      }
      .cc-dd-bar:hover { opacity: 0.8; }
      .cc-dd-bar-tooltip {
        position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
        background: #1e293b; color: #fff; padding: 4px 8px; border-radius: 4px;
        font-size: 10px; white-space: nowrap; opacity: 0; pointer-events: none;
        transition: opacity 0.2s; margin-bottom: 4px; z-index: 5;
      }
      .cc-dd-bar:hover .cc-dd-bar-tooltip { opacity: 1; }
      .cc-dd-bar-label { font-size: 9px; color: #64748b; text-align: center; }
      .cc-dd-bar-value { font-size: 11px; font-weight: 700; color: #e2e8f0; }

      .cc-dd-donut { width: 120px; height: 120px; border-radius: 50%; position: relative; flex-shrink: 0; }
      .cc-dd-donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; }
      .cc-dd-donut-center-value { font-size: 20px; font-weight: 800; color: #fff; }
      .cc-dd-donut-center-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
      .cc-dd-legend { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 160px; }
      .cc-dd-legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
      .cc-dd-legend-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
      .cc-dd-legend-label { color: #cbd5e1; flex: 1; }
      .cc-dd-legend-value { color: #64748b; font-weight: 600; }
      .cc-dd-donut-row { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }

      .cc-dd-alert-item {
        display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px;
        border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.06);
      }
      .cc-dd-alert-high { background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.15); }
      .cc-dd-alert-medium { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.15); }
      .cc-dd-alert-low { background: rgba(6,182,212,0.06); border-color: rgba(6,182,212,0.15); }
      .cc-dd-alert-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
      .cc-dd-alert-content { flex: 1; }
      .cc-dd-alert-title { font-size: 13px; font-weight: 700; color: #e2e8f0; }
      .cc-dd-alert-msg { font-size: 12px; color: #94a3b8; margin-top: 2px; }
      .cc-dd-alert-time { font-size: 10px; color: #64748b; margin-top: 4px; }

      .cc-dd-timeline { position: relative; padding-left: 20px; }
      .cc-dd-timeline::before { content: ''; position: absolute; left: 6px; top: 0; bottom: 0; width: 2px; background: rgba(6,182,212,0.2); }
      .cc-dd-timeline-item { position: relative; padding: 8px 0 8px 16px; font-size: 12px; }
      .cc-dd-timeline-item::before { content: ''; position: absolute; left: -20px; top: 14px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #0a0e1a; }
      .cc-dd-timeline-info::before { background: #3b82f6; }
      .cc-dd-timeline-success::before { background: #10B981; }
      .cc-dd-timeline-warning::before { background: #f59e0b; }
      .cc-dd-timeline-text { color: #e2e8f0; }
      .cc-dd-timeline-time { color: #64748b; font-size: 11px; }

      .cc-dd-forecast-chart {
        display: flex; align-items: flex-end; gap: 3px; height: 120px;
        padding: 0 4px; position: relative;
      }
      .cc-dd-forecast-bar {
        flex: 1; min-width: 4px; border-radius: 2px 2px 0 0; min-height: 3px;
        transition: opacity 0.2s;
      }
      .cc-dd-forecast-bar:hover { opacity: 0.7; }
      .cc-dd-forecast-actual { background: #3b82f6; }
      .cc-dd-forecast-predicted { background: #10B981; }
      .cc-dd-forecast-confidence { background: rgba(16,185,129,0.15); border: 1px dashed rgba(16,185,129,0.3); }

      .cc-dd-health-score {
        width: 160px; height: 160px; border-radius: 50%; position: relative;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .cc-dd-health-score-inner {
        width: 120px; height: 120px; border-radius: 50%; background: #0a0e1a;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
      }
      .cc-dd-health-score-value { font-size: 36px; font-weight: 900; color: #fff; }
      .cc-dd-health-score-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

      .cc-dd-btn {
        padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer;
        font-size: 11px; font-weight: 600; transition: all 0.2s;
        font-family: inherit; display: inline-flex; align-items: center; gap: 4px;
      }
      .cc-dd-btn-primary { background: linear-gradient(135deg, #06B6D4, #3b82f6); color: #fff; }
      .cc-dd-btn-secondary { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }

      @media (max-width: 767px) {
        .cc-dd-modal { flex-direction: column; }
        .cc-dd-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-dd-sidebar-brand { display: none; }
        .cc-dd-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-dd-nav-item.active { border-bottom-color: #06B6D4; border-left-color: transparent; }
        .cc-dd-main { padding: 12px 12px 20px; }
        .cc-dd-cards { grid-template-columns: repeat(2, 1fr); }
      }

      /* Light mode overrides */
      html:not(.dark) .cc-dd-modal { background: rgba(248,250,252,0.99); color: #1e293b; }
      html:not(.dark) .cc-dd-sidebar { background: rgba(241,245,249,0.8); border-right-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-dd-sidebar-title { color: #0f172a; }
      html:not(.dark) .cc-dd-nav-item { color: #64748b; }
      html:not(.dark) .cc-dd-nav-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
      html:not(.dark) .cc-dd-nav-item.active { background: rgba(6,182,212,0.08); color: #0891b2; }
      html:not(.dark) .cc-dd-page-title { color: #0f172a; }
      html:not(.dark) .cc-dd-header { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-dd-card { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-dd-card-label { color: #64748b; }
      html:not(.dark) .cc-dd-card-value { color: #0f172a; }
      html:not(.dark) .cc-dd-card-delta { color: #64748b; }
      html:not(.dark) .cc-dd-section { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-dd-section-title { color: #1e293b; }
      html:not(.dark) .cc-dd-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-dd-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-dd-table tr:hover td { background: rgba(6,182,212,0.04); }
      html:not(.dark) .cc-dd-scroll { border-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-dd-search { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.1); color: #1e293b; }
      html:not(.dark) .cc-dd-bar-label { color: #94a3b8; }
      html:not(.dark) .cc-dd-bar-value { color: #1e293b; }
      html:not(.dark) .cc-dd-legend-label { color: #334155; }
      html:not(.dark) .cc-dd-legend-value { color: #64748b; }
      html:not(.dark) .cc-dd-donut-center-value { color: #0f172a; }
      html:not(.dark) .cc-dd-donut-center-label { color: #64748b; }
      html:not(.dark) .cc-dd-alert-title { color: #1e293b; }
      html:not(.dark) .cc-dd-alert-msg { color: #64748b; }
      html:not(.dark) .cc-dd-alert-time { color: #94a3b8; }
      html:not(.dark) .cc-dd-timeline-text { color: #1e293b; }
      html:not(.dark) .cc-dd-timeline-time { color: #94a3b8; }
      html:not(.dark) .cc-dd-health-score-inner { background: #fff; }
      html:not(.dark) .cc-dd-health-score-value { color: #0f172a; }
      html:not(.dark) .cc-dd-health-score-label { color: #64748b; }
      html:not(.dark) .cc-dd-btn-secondary { background: rgba(0,0,0,0.04); color: #475569; border-color: rgba(0,0,0,0.1); }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------------
  let currentView = 'overview';
  let currentTab = {};
  let currentSearch = {};

  // ------------------------------------------------------------------
  // RENDER MAIN MODAL
  // ------------------------------------------------------------------
  function renderModal() {
    const db = initDatabase();
    const alertCount = db.alerts.filter(a => !a.acknowledged).length;

    const overlay = document.createElement('div');
    overlay.id = 'cc-dd-overlay';
    overlay.className = 'cc-dd-modal';
    overlay.innerHTML = `
      <button class="cc-dd-close" onclick="window.__ccDD.close()">×</button>
      <div class="cc-dd-sidebar">
        <div class="cc-dd-sidebar-brand">
          <div class="cc-dd-sidebar-title">🚢 Dispatch Dashboard</div>
          <div class="cc-dd-sidebar-sub">Global Supply Chain Operations</div>
        </div>
        <button class="cc-dd-nav-item ${currentView === 'overview' ? 'active' : ''}" onclick="window.__ccDD.setView('overview')">
          <span class="cc-dd-nav-icon">📊</span> Overview
        </button>
        <button class="cc-dd-nav-item ${currentView === 'ports' ? 'active' : ''}" onclick="window.__ccDD.setView('ports')">
          <span class="cc-dd-nav-icon">⚓</span> Ports
          ${alertCount > 0 ? '<span class="cc-dd-nav-badge">' + alertCount + '</span>' : ''}
        </button>
        <button class="cc-dd-nav-item ${currentView === 'wms' ? 'active' : ''}" onclick="window.__ccDD.setView('wms')">
          <span class="cc-dd-nav-icon">🏭</span> Warehouses
        </button>
        <button class="cc-dd-nav-item ${currentView === 'forecast' ? 'active' : ''}" onclick="window.__ccDD.setView('forecast')">
          <span class="cc-dd-nav-icon">🤖</span> AI Forecasting
        </button>
        <button class="cc-dd-nav-item ${currentView === 'weather' ? 'active' : ''}" onclick="window.__ccDD.setView('weather')">
          <span class="cc-dd-nav-icon">🌤️</span> Weather
        </button>
        <button class="cc-dd-nav-item ${currentView === 'geo' ? 'active' : ''}" onclick="window.__ccDD.setView('geo')">
          <span class="cc-dd-nav-icon">🗺️</span> Geo Intelligence
        </button>
        <button class="cc-dd-nav-item ${currentView === 'departures' ? 'active' : ''}" onclick="window.__ccDD.setView('departures')">
          <span class="cc-dd-nav-icon">🚢</span> Departures
        </button>
        <button class="cc-dd-nav-item ${currentView === 'automation' ? 'active' : ''}" onclick="window.__ccDD.setView('automation')">
          <span class="cc-dd-nav-icon">⚙️</span> AI Automations
        </button>
        <button class="cc-dd-nav-item ${currentView === 'tower' ? 'active' : ''}" onclick="window.__ccDD.setView('tower')">
          <span class="cc-dd-nav-icon">🗼</span> Control Tower
          ${alertCount > 0 ? '<span class="cc-dd-nav-badge">' + alertCount + '</span>' : ''}
        </button>
      </div>
      <div class="cc-dd-main" id="cc-dd-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-dd-content');
    if (!container) return;

    if (currentView === 'overview') renderOverview(container);
    else if (currentView === 'ports') renderPorts(container);
    else if (currentView === 'wms') renderWMS(container);
    else if (currentView === 'forecast') renderForecast(container);
    else if (currentView === 'weather') renderWeather(container);
    else if (currentView === 'geo') renderGeo(container);
    else if (currentView === 'departures') renderDepartures(container);
    else if (currentView === 'automation') renderAutomation(container);
    else if (currentView === 'tower') renderTower(container);

    // Update sidebar active states
    document.querySelectorAll('.cc-dd-nav-item').forEach(item => {
      const onclick = item.getAttribute('onclick') || '';
      item.classList.toggle('active', onclick.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // 1. OVERVIEW
  // ------------------------------------------------------------------
  function renderOverview(container) {
    const db = initDatabase();
    const totalVessels = db.vessels.length;
    const totalPorts = db.ports.length;
    const congestedPorts = db.ports.filter(p => p.congestion_level === 'high').length;
    const totalWarehouses = db.warehouses.length;
    const avgUtilization = Math.round(db.warehouses.reduce((s, w) => s + w.utilization_pct, 0) / db.warehouses.length);
    const totalInventory = db.inventory.length;
    const lowStock = db.inventory.filter(i => i.status !== 'in-stock').length;
    const highRiskForecasts = db.forecasts.filter(f => f.stockout_risk === 'high').length;
    const avgAccuracy = Math.round(db.forecasts.reduce((s, f) => s + f.accuracy, 0) / db.forecasts.length * 10) / 10;
    const activeAlerts = db.alerts.filter(a => !a.acknowledged).length;
    const healthScore = Math.round(100 - (congestedPorts * 5) - (lowStock * 0.5) - (highRiskForecasts * 3) - (activeAlerts * 2));

    container.innerHTML = `
      <div class="cc-dd-header">
        <h2 class="cc-dd-page-title">📊 Supply Chain Overview <span class="cc-dd-page-badge">LIVE DEMO</span></h2>
        <div class="cc-dd-live-indicator"><div class="cc-dd-live-dot"></div> Real-time sync active</div>
      </div>

      <div class="cc-dd-cards">
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Health Score</div>
          <div class="cc-dd-card-value" style="color:${healthScore >= 80 ? '#10B981' : healthScore >= 60 ? '#f59e0b' : '#ef4444'}">${healthScore}/100</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">Overall supply chain health</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Active Ports</div>
          <div class="cc-dd-card-value">${totalPorts}</div>
          <div class="cc-dd-card-delta cc-dd-delta-${congestedPorts > 2 ? 'down' : 'up'}">${congestedPorts} congested</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Vessels Tracked</div>
          <div class="cc-dd-card-value">${totalVessels}</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">across all ports</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Warehouses</div>
          <div class="cc-dd-card-value">${totalWarehouses}</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">Avg ${avgUtilization}% utilized</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">SKUs Tracked</div>
          <div class="cc-dd-card-value">${totalInventory}</div>
          <div class="cc-dd-card-delta cc-dd-delta-${lowStock > 5 ? 'down' : 'neutral'}">${lowStock} low/critical stock</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">AI Accuracy</div>
          <div class="cc-dd-card-value" style="color:#10B981">${avgAccuracy}%</div>
          <div class="cc-dd-card-delta cc-dd-delta-down">${highRiskForecasts} stockout predictions</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Active Alerts</div>
          <div class="cc-dd-card-value" style="color:${activeAlerts > 3 ? '#ef4444' : '#f59e0b'}">${activeAlerts}</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">requires attention</div>
        </div>
      </div>

      <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px">
        <div class="cc-dd-section" style="flex:1;min-width:300px">
          <div class="cc-dd-section-title">🎯 Supply Chain Health Score</div>
          <div style="display:flex;align-items:center;justify-content:center;padding:20px">
            ${renderHealthScore(healthScore)}
          </div>
        </div>
        <div class="cc-dd-section" style="flex:2;min-width:400px">
          <div class="cc-dd-section-title">🚨 Active Alerts (${activeAlerts})</div>
          ${db.alerts.filter(a => !a.acknowledged).slice(0, 5).map(a => `
            <div class="cc-dd-alert-item cc-dd-alert-${a.severity}">
              <div class="cc-dd-alert-icon">${a.severity === 'high' ? '🔴' : a.severity === 'medium' ? '🟡' : '🔵'}</div>
              <div class="cc-dd-alert-content">
                <div class="cc-dd-alert-title">${a.title}</div>
                <div class="cc-dd-alert-msg">${a.message}</div>
                <div class="cc-dd-alert-time">${formatDate(a.timestamp)} · Source: ${a.source}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📡 Recent Events</div>
        <div class="cc-dd-timeline">
          ${db.events.slice(0, 10).map(e => `
            <div class="cc-dd-timeline-item cc-dd-timeline-${e.type}">
              <div class="cc-dd-timeline-text">${e.text}</div>
              <div class="cc-dd-timeline-time">${formatDate(e.timestamp)} · ${e.module.toUpperCase()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderHealthScore(score) {
    const color = score >= 80 ? '#10B981' : score >= 60 ? '#f59e0b' : '#ef4444';
    const gradient = `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.05) ${score * 3.6}deg)`;
    return `
      <div class="cc-dd-health-score" style="background: ${gradient}">
        <div class="cc-dd-health-score-inner">
          <div class="cc-dd-health-score-value" style="color:${color}">${score}</div>
          <div class="cc-dd-health-score-label">Health Score</div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 2. PORTS
  // ------------------------------------------------------------------
  function renderPorts(container) {
    const db = initDatabase();
    const totalVessels = db.vessels.length;
    const congested = db.ports.filter(p => p.congestion_level === 'high').length;
    const avgUtilization = Math.round(db.ports.reduce((s, p) => s + p.berth_utilization, 0) / db.ports.length);
    const totalThroughput = db.ports.reduce((s, p) => s + p.daily_throughput, 0);

    container.innerHTML = `
      <div class="cc-dd-header">
        <h2 class="cc-dd-page-title">⚓ Global Port Operations <span class="cc-dd-page-badge">TOP 10 PORTS</span></h2>
        <div class="cc-dd-live-indicator"><div class="cc-dd-live-dot"></div> Vessel data updating</div>
      </div>

      <div class="cc-dd-cards">
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Ports Monitored</div>
          <div class="cc-dd-card-value">${db.ports.length}</div>
          <div class="cc-dd-card-delta cc-dd-delta-${congested > 2 ? 'down' : 'neutral'}">${congested} congested</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Vessels In Port</div>
          <div class="cc-dd-card-value">${totalVessels}</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">real-time tracked</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Avg Berth Utilization</div>
          <div class="cc-dd-card-value" style="color:${avgUtilization > 80 ? '#ef4444' : '#f59e0b'}">${avgUtilization}%</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">across all ports</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Daily Throughput</div>
          <div class="cc-dd-card-value">${formatTEU(totalThroughput)}</div>
          <div class="cc-dd-card-delta cc-dd-delta-up">containers processed today</div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">🌐 Port Congestion Map — Top 10 World Ports</div>
        <div class="cc-dd-bars">
          ${db.ports.map(p => {
            const color = p.congestion_level === 'high' ? '#ef4444' : p.congestion_level === 'medium' ? '#f59e0b' : '#10B981';
            return `
              <div class="cc-dd-bar-wrap">
                <div class="cc-dd-bar-value">${p.berth_utilization}%</div>
                <div class="cc-dd-bar" style="height:${p.berth_utilization}%;background:${color}">
                  <div class="cc-dd-bar-tooltip">${p.name}: ${p.berth_utilization}% utilized · ${p.vessels_in_port} vessels · ${p.avg_wait_hours}h avg wait</div>
                </div>
                <div class="cc-dd-bar-label" style="max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name.replace('Port of ', '').split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📋 Port Operations Table</div>
        <div class="cc-dd-scroll">
          <table class="cc-dd-table">
            <thead>
              <tr>
                <th>Port</th>
                <th>Country</th>
                <th>Region</th>
                <th>Vessels In Port</th>
                <th>Approaching</th>
                <th>Berth Utilization</th>
                <th>Avg Wait</th>
                <th>Daily Throughput</th>
                <th>Customs %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${db.ports.map(p => `
                <tr>
                  <td style="font-weight:600;color:#06B6D4">${p.name}</td>
                  <td>${p.country}</td>
                  <td>${p.region}</td>
                  <td style="text-align:center">${p.vessels_in_port}</td>
                  <td style="text-align:center">${p.vessels_approaching}</td>
                  <td>
                    <span class="cc-dd-congestion-bar"><span class="cc-dd-congestion-fill" style="width:${p.berth_utilization}%;background:${p.congestion_level === 'high' ? '#ef4444' : p.congestion_level === 'medium' ? '#f59e0b' : '#10B981'}"></span></span>
                    ${p.berth_utilization}%
                  </td>
                  <td style="text-align:center;color:${p.avg_wait_hours > 20 ? '#ef4444' : '#e2e8f0'}">${p.avg_wait_hours}h</td>
                  <td style="text-align:right">${formatTEU(p.daily_throughput)}</td>
                  <td style="text-align:center">${p.customs_clearance_rate}%</td>
                  <td><span class="cc-dd-status cc-dd-status-${p.status}">${p.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">🚢 Vessel Tracking — Live Feed</div>
        <div class="cc-dd-tabs">
          <button class="cc-dd-tab active" onclick="window.__ccDD.filterVessels('all')">All Vessels</button>
          <button class="cc-dd-tab" onclick="window.__ccDD.filterVessels('berthed')">Berthed</button>
          <button class="cc-dd-tab" onclick="window.__ccDD.filterVessels('anchored')">Anchored</button>
          <button class="cc-dd-tab" onclick="window.__ccDD.filterVessels('maneuvering')">Maneuvering</button>
          <button class="cc-dd-tab" onclick="window.__ccDD.filterVessels('departing')">Departing</button>
        </div>
        <div id="cc-dd-vessels-container"></div>
      </div>

      <div id="cc-dd-berth-gantt-container">
        ${renderBerthGantt(db.ports[0].id)}
      </div>

      <div style="margin-bottom:16px">
        <div class="cc-dd-search-wrap" style="margin-bottom:8px">
          <span style="font-size:12px;color:#64748b;margin-right:8px">Select port for berth schedule:</span>
          <select class="cc-dd-search" style="width:auto;padding:6px 12px 6px 12px" onchange="window.__ccDD.showBerthGantt(this.value)">
            ${db.ports.map(p => `<option value="${p.id}" ${p.id === db.ports[0].id ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
        </div>
      </div>
    `;

    renderVesselsTable('all');
  }

  function showBerthGantt(portId) {
    const container = document.getElementById('cc-dd-berth-gantt-container');
    if (container) {
      container.innerHTML = renderBerthGantt(portId);
    }
  }

  function renderVesselsTable(filter) {
    const db = initDatabase();
    let vessels = db.vessels;
    if (filter && filter !== 'all') vessels = vessels.filter(v => v.status === filter);
    vessels = vessels.slice(0, 50); // Limit for performance

    const container = document.getElementById('cc-dd-vessels-container');
    if (!container) return;

    container.innerHTML = `
      <div class="cc-dd-scroll" style="max-height:320px">
        <table class="cc-dd-table">
          <thead>
            <tr>
              <th>Vessel Name</th>
              <th>Type</th>
              <th>Port</th>
              <th>Status</th>
              <th>Berth</th>
              <th>Cargo (TEU)</th>
              <th>Agent</th>
              <th>Flag</th>
            </tr>
          </thead>
          <tbody>
            ${vessels.map(v => `
              <tr>
                <td style="font-weight:600">${v.name}</td>
                <td style="font-size:11px">${v.type}</td>
                <td style="font-size:11px">${v.port_name.replace('Port of ', '')}</td>
                <td><span class="cc-dd-status cc-dd-status-${v.status === 'berthed' ? 'operational' : v.status === 'anchored' ? 'high-capacity' : 'congested'}" style="font-size:9px">${v.status}</span></td>
                <td style="text-align:center">${v.berth_number || '—'}</td>
                <td style="text-align:right">${v.cargo_teu.toLocaleString()}</td>
                <td style="font-size:11px">${v.agent}</td>
                <td style="font-size:11px">${v.flag}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 2A. BERTH GANTT CHART
  // ------------------------------------------------------------------
  function renderBerthGantt(portId) {
    const db = initDatabase();
    const port = db.ports.find(p => p.id === portId) || db.ports[0];
    const berthCount = Math.min(port.berths, 15); // Limit for display
    const hours = 24; // Next 24 hours

    // Generate berth schedule
    const schedule = [];
    for (let b = 0; b < berthCount; b++) {
      const berthSchedule = [];
      let currentHour = 0;
      while (currentHour < hours) {
        const occupied = Math.random() > (b < port.berths_occupied ? 0.3 : 0.6);
        const duration = occupied ? Math.floor(Math.random() * 6) + 2 : Math.floor(Math.random() * 3) + 1;
        const vessel = occupied ? db.vessels.filter(v => v.port_id === port.id)[Math.floor(Math.random() * 10)] : null;
        berthSchedule.push({
          start: currentHour,
          end: Math.min(currentHour + duration, hours),
          occupied: occupied,
          vessel: vessel ? vessel.name.split(' ').slice(0, 2).join(' ') : null,
          vesselType: vessel ? vessel.type : null
        });
        currentHour += duration;
      }
      schedule.push({ berth: b + 1, slots: berthSchedule });
    }

    const berthColors = ['#3b82f6', '#8b5cf6', '#06B6D4', '#10B981', '#f59e0b', '#ec4899', '#14b8a6'];

    return `
      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📅 Berth Schedule — Gantt Chart (${port.name}, Next 24 Hours)</div>
        <div style="overflow-x:auto">
          <div style="min-width:700px">
            <!-- Hour headers -->
            <div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:4px;margin-bottom:4px">
              <div style="width:80px;font-size:10px;color:#64748b;font-weight:600">Berth</div>
              <div style="flex:1;display:flex">
                ${Array.from({length: hours}, (_, h) => `<div style="flex:1;text-align:center;font-size:9px;color:#64748b;border-left:1px solid rgba(255,255,255,0.04)">${h.toString().padStart(2,'0')}</div>`).join('')}
              </div>
            </div>
            <!-- Berth rows -->
            ${schedule.map((berth, bi) => {
              const color = berthColors[bi % berthColors.length];
              return `
                <div style="display:flex;align-items:center;height:28px;margin-bottom:2px">
                  <div style="width:80px;font-size:11px;color:#cbd5e1;font-weight:600">B-${berth.berth}</div>
                  <div style="flex:1;display:flex;position:relative;height:24px;background:rgba(255,255,255,0.02);border-radius:4px">
                    ${berth.slots.map(slot => {
                      const width = ((slot.end - slot.start) / hours) * 100;
                      const left = (slot.start / hours) * 100;
                      if (slot.occupied) {
                        return `<div style="position:absolute;left:${left}%;width:${width}%;top:2px;height:20px;background:${color};border-radius:3px;opacity:0.8;display:flex;align-items:center;padding:0 4px;overflow:hidden" title="${slot.vessel} (${slot.vesselType}) — ${slot.start}:00 to ${slot.end}:00">
                          <span style="font-size:8px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${slot.vessel || 'Vessel'}</span>
                        </div>`;
                      } else {
                        return `<div style="position:absolute;left:${left}%;width:${width}%;top:2px;height:20px;background:rgba(16,185,129,0.08);border:1px dashed rgba(16,185,129,0.2);border-radius:3px;display:flex;align-items:center;justify-content:center" title="Available ${slot.start}:00 to ${slot.end}:00">
                          <span style="font-size:8px;color:#10B981">Free</span>
                        </div>`;
                      }
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:12px;height:12px;border-radius:3px;background:#3b82f6;opacity:0.8"></div> Occupied (vessel berthed)</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:12px;height:12px;border-radius:3px;background:rgba(16,185,129,0.08);border:1px dashed rgba(16,185,129,0.2)"></div> Available (open slot)</div>
          <div style="font-size:11px;color:#64748b">Showing ${berthCount} of ${port.berths} berths · ${port.berths_occupied} currently occupied</div>
        </div>
      </div>

      <!-- Pilot/Tug Services Status Board -->
      <div class="cc-dd-section">
        <div class="cc-dd-section-title">🚢 Pilot & Tug Services — ${port.name}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
          ${renderPilotTugCard('Pilot Boats', port, 3, 5)}
          ${renderPilotTugCard('Tug Boats', port, 4, 6)}
          ${renderPilotTugCard('Line Handlers', port, 8, 12)}
          ${renderPilotTugCard('Mooring Boats', port, 2, 3)}
        </div>
      </div>

      <!-- Container Tracking + Customs Pipeline -->
      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📦 Container Tracking & Customs Pipeline — ${port.name}</div>
        ${renderContainerPipeline(port)}
      </div>

      <!-- Demurrage Calculator -->
      <div class="cc-dd-section">
        <div class="cc-dd-section-title">💰 Demurrage Calculator — ${port.name}</div>
        ${renderDemurrageCalculator(port)}
      </div>
    `;
  }

  function renderPilotTugCard(serviceName, port, active, total) {
    const utilization = Math.round(active / total * 100);
    const color = utilization > 80 ? '#ef4444' : utilization > 60 ? '#f59e0b' : '#10B981';
    const assignments = ['Vessel Ever Given', 'Vessel Maersk Seletar', 'Vessel MSC Gulgun', 'Standby', 'Vessel CMA CGM Marco Polo', 'Standby', 'Vessel Cosco Universe'];
    return `
      <div style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:13px;font-weight:700;color:#e2e8f0">${serviceName}</div>
          <div class="cc-dd-status cc-dd-status-${utilization > 80 ? 'congested' : utilization > 60 ? 'high-capacity' : 'operational'}">${utilization > 80 ? 'Busy' : 'Available'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,0.08);overflow:hidden">
            <div style="height:100%;width:${utilization}%;background:${color};border-radius:4px;transition:width 0.4s"></div>
          </div>
          <div style="font-size:12px;font-weight:700;color:${color}">${active}/${total}</div>
        </div>
        <div style="font-size:10px;color:#64748b;margin-bottom:6px">Current Assignments:</div>
        ${Array.from({length: Math.min(active, 4)}, (_, i) => `
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;margin-bottom:3px">
            <div style="width:6px;height:6px;border-radius:50%;background:${color}"></div>
            <span>${assignments[i % assignments.length]}</span>
          </div>
        `).join('')}
        ${active > 4 ? `<div style="font-size:10px;color:#64748b;margin-top:4px">+${active - 4} more active</div>` : ''}
      </div>
    `;
  }

  function renderContainerPipeline(port) {
    const stages = [
      { id: 'discharged', name: 'Discharged', icon: 'Crane', color: '#3b82f6', count: Math.floor(Math.random() * 200) + 150 },
      { id: 'in_yard', name: 'In Yard', icon: 'Yard', color: '#06B6D4', count: Math.floor(Math.random() * 300) + 400 },
      { id: 'customs_review', name: 'Customs Review', icon: 'Customs', color: '#f59e0b', count: Math.floor(Math.random() * 80) + 40 },
      { id: 'cleared', name: 'Cleared', icon: 'Cleared', color: '#10B981', count: Math.floor(Math.random() * 200) + 250 },
      { id: 'gate_out', name: 'Gate Out', icon: 'Gate', color: '#8b5cf6', count: Math.floor(Math.random() * 150) + 180 },
      { id: 'delivered', name: 'Delivered', icon: 'Delivered', color: '#14b8a6', count: Math.floor(Math.random() * 120) + 140 }
    ];
    const totalContainers = stages.reduce((s, st) => s + st.count, 0);

    // Generate sample container tracking numbers
    const sampleContainers = Array.from({length: 8}, (_, i) => {
      const trackingNumber = ['MSCU', 'TGHU', 'CMAU', 'COSU', 'ONEU', 'HLXU'][Math.floor(Math.random() * 6)] + Math.floor(Math.random() * 9000000 + 1000000).toString();
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const blNumber = 'BL-' + Math.floor(Math.random() * 90000 + 10000);
      const vessel = VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)];
      const arrivedAt = new Date(Date.now() - Math.random() * 72 * 3600000);
      const stageSince = new Date(Date.now() - Math.random() * 24 * 3600000);
      return { trackingNumber, stage: stage.id, stageName: stage.name, stageColor: stage.color, blNumber, vessel, arrivedAt, stageSince };
    });

    return `
      <!-- Pipeline visualization -->
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:20px;flex-wrap:wrap">
        ${stages.map((stage, i) => `
          <div style="flex:1;min-width:120px;text-align:center;padding:12px;background:rgba(255,255,255,0.02);border:1px solid ${stage.color}30;border-radius:8px;position:relative">
            <div style="font-size:24px;margin-bottom:4px;opacity:0.8">
              <div style="width:32px;height:32px;border-radius:50%;background:${stage.color}20;display:flex;align-items:center;justify-content:center;margin:0 auto">
                <div style="width:12px;height:12px;border-radius:50%;background:${stage.color}"></div>
              </div>
            </div>
            <div style="font-size:11px;font-weight:700;color:${stage.color}">${stage.name}</div>
            <div style="font-size:20px;font-weight:800;color:#e2e8f0;margin-top:2px">${stage.count}</div>
            <div style="font-size:9px;color:#64748b">${Math.round(stage.count / totalContainers * 100)}% of total</div>
            ${i < stages.length - 1 ? '<div style="position:absolute;right:-8px;top:50%;transform:translateY(-50%);color:#64748b;font-size:14px">→</div>' : ''}
          </div>
        `).join('')}
      </div>

      <!-- Sample container tracking -->
      <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:10px">📋 Sample Container Tracking</div>
      <div class="cc-dd-scroll" style="max-height:280px">
        <table class="cc-dd-table">
          <thead>
            <tr>
              <th>Container #</th>
              <th>B/L #</th>
              <th>Vessel</th>
              <th>Arrived</th>
              <th>Current Stage</th>
              <th>Stage Since</th>
              <th>Time in Stage</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            ${sampleContainers.map(c => {
              const stageIndex = stages.findIndex(s => s.id === c.stage);
              const progressPct = (stageIndex + 1) / stages.length * 100;
              const hoursInStage = Math.round((Date.now() - c.stageSince.getTime()) / 3600000);
              return `
                <tr>
                  <td style="font-weight:600;color:#06B6D4;font-family:monospace">${c.trackingNumber}</td>
                  <td style="font-size:11px;font-family:monospace">${c.blNumber}</td>
                  <td style="font-size:11px">${c.vessel}</td>
                  <td style="font-size:11px;color:#64748b">${c.arrivedAt.toLocaleDateString('en-US', {month:'short',day:'numeric'})} ${c.arrivedAt.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}</td>
                  <td><span class="cc-dd-status" style="background:${c.stageColor}15;color:${c.stageColor};border:1px solid ${c.stageColor}30">${c.stageName}</span></td>
                  <td style="font-size:11px;color:#64748b">${c.stageSince.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}</td>
                  <td style="text-align:center;color:${hoursInStage > 12 ? '#ef4444' : hoursInStage > 6 ? '#f59e0b' : '#e2e8f0'};font-weight:600">${hoursInStage}h</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:4px">
                      <div style="width:60px;height:6px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden">
                        <div style="height:100%;width:${progressPct}%;background:${c.stageColor};border-radius:3px"></div>
                      </div>
                      <span style="font-size:10px;color:#64748b">${Math.round(progressPct)}%</span>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderDemurrageCalculator(port) {
    // Generate sample containers with demurrage exposure
    const containers = Array.from({length: 10}, (_, i) => {
      const trackingNumber = ['MSCU', 'TGHU', 'CMAU', 'COSU'][i % 4] + Math.floor(Math.random() * 9000000 + 1000000).toString();
      const freeTimeDays = [3, 5, 7][Math.floor(Math.random() * 3)];
      const daysInPort = Math.floor(Math.random() * 15) + 1;
      const overdueDays = Math.max(0, daysInPort - freeTimeDays);
      const dailyRate = port.demurrage_rate;
      const totalCharge = overdueDays * dailyRate;
      const vessel = VESSEL_NAMES[i % VESSEL_NAMES.length];
      return { trackingNumber, freeTimeDays, daysInPort, overdueDays, dailyRate, totalCharge, vessel };
    });
    const totalExposure = containers.reduce((s, c) => s + c.totalCharge, 0);
    const atRisk = containers.filter(c => c.overdueDays > 0).length;

    return `
      <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">
        <div style="padding:12px 20px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:8px;flex:1;min-width:160px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Total Exposure</div>
          <div style="font-size:24px;font-weight:800;color:#ef4444">$${totalExposure.toLocaleString()}</div>
          <div style="font-size:11px;color:#64748b">${atRisk} containers accruing charges</div>
        </div>
        <div style="padding:12px 20px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:8px;flex:1;min-width:160px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Demurrage Rate</div>
          <div style="font-size:24px;font-weight:800;color:#f59e0b">$${port.demurrage_rate}</div>
          <div style="font-size:11px;color:#64748b">per container per day</div>
        </div>
        <div style="padding:12px 20px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:8px;flex:1;min-width:160px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Free Time</div>
          <div style="font-size:24px;font-weight:800;color:#10B981">3-7 days</div>
          <div style="font-size:11px;color:#64748b">varies by container type</div>
        </div>
      </div>

      <div class="cc-dd-scroll" style="max-height:320px">
        <table class="cc-dd-table">
          <thead>
            <tr>
              <th>Container #</th>
              <th>Vessel</th>
              <th>Days in Port</th>
              <th>Free Time</th>
              <th>Overdue Days</th>
              <th>Daily Rate</th>
              <th>Total Charge</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${containers.map(c => {
              const status = c.overdueDays === 0 ? 'within-free-time' : c.overdueDays > 3 ? 'critical' : 'accruing';
              return `
                <tr>
                  <td style="font-weight:600;color:#06B6D4;font-family:monospace">${c.trackingNumber}</td>
                  <td style="font-size:11px">${c.vessel}</td>
                  <td style="text-align:center">${c.daysInPort}d</td>
                  <td style="text-align:center">${c.freeTimeDays}d</td>
                  <td style="text-align:center;color:${c.overdueDays > 0 ? '#ef4444' : '#10B981'};font-weight:700">${c.overdueDays > 0 ? '+' + c.overdueDays + 'd' : '—'}</td>
                  <td style="text-align:right">$${c.dailyRate}/day</td>
                  <td style="text-align:right;color:${c.totalCharge > 0 ? '#ef4444' : '#64748b'};font-weight:700">$${c.totalCharge.toLocaleString()}</td>
                  <td><span class="cc-dd-status cc-dd-status-${status === 'critical' ? 'congested' : status === 'accruing' ? 'high-capacity' : 'operational'}">${status === 'critical' ? 'Critical' : status === 'accruing' ? 'Accruing' : 'Free'}</span></td>
                  <td><button class="cc-dd-btn cc-dd-btn-secondary" onclick="alert('Demo: Would auto-generate pickup request for ${c.trackingNumber}')">🚛 Pickup</button></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;padding:10px 14px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:6px;font-size:12px;color:#67e8f9">
        💡 <strong>AI Recommendation:</strong> ${atRisk} containers are accruing demurrage charges totaling $${totalExposure.toLocaleString()}. Auto-generating pickup requests for the ${atRisk} most critical containers would save an estimated $${(atRisk * port.demurrage_rate).toLocaleString()}/day.
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 3. WMS
  // ------------------------------------------------------------------
  function renderWMS(container) {
    const db = initDatabase();
    const totalCapacity = db.warehouses.reduce((s, w) => s + w.capacity, 0);
    const totalUtilized = db.warehouses.reduce((s, w) => s + w.utilized, 0);
    const avgUtilization = Math.round(totalUtilized / totalCapacity * 100);
    const totalStaff = db.warehouses.reduce((s, w) => s + w.total_staff, 0);
    const activeStaff = db.warehouses.reduce((s, w) => s + w.active_staff, 0);
    const totalPicks = db.warehouses.reduce((s, w) => s + w.picks_today, 0);
    const totalShips = db.warehouses.reduce((s, w) => s + w.ships_today, 0);
    const lowStock = db.inventory.filter(i => i.status !== 'in-stock').length;

    container.innerHTML = `
      <div class="cc-dd-header">
        <h2 class="cc-dd-page-title">🏭 Warehouse Management <span class="cc-dd-page-badge">4 GLOBAL HUBS</span></h2>
        <div class="cc-dd-live-indicator"><div class="cc-dd-live-dot"></div> Operations live</div>
      </div>

      <div class="cc-dd-cards">
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Total Capacity</div>
          <div class="cc-dd-card-value">${(totalCapacity / 1000).toFixed(0)}k m²</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">${avgUtilization}% utilized</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Active Staff</div>
          <div class="cc-dd-card-value">${activeStaff}/${totalStaff}</div>
          <div class="cc-dd-card-delta cc-dd-delta-up">${Math.round(activeStaff/totalStaff*100)}% attendance</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Picks Today</div>
          <div class="cc-dd-card-value">${totalPicks.toLocaleString()}</div>
          <div class="cc-dd-card-delta cc-dd-delta-up">across all warehouses</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Shipments Today</div>
          <div class="cc-dd-card-value">${totalShips.toLocaleString()}</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">outbound processed</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">SKUs Tracked</div>
          <div class="cc-dd-card-value">${db.inventory.length}</div>
          <div class="cc-dd-card-delta cc-dd-delta-${lowStock > 10 ? 'down' : 'neutral'}">${lowStock} low/critical</div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📊 Warehouse Utilization & Operations</div>
        <div class="cc-dd-bars">
          ${db.warehouses.map(w => {
            const color = w.utilization_pct > 85 ? '#ef4444' : w.utilization_pct > 75 ? '#f59e0b' : '#10B981';
            return `
              <div class="cc-dd-bar-wrap">
                <div class="cc-dd-bar-value">${w.utilization_pct}%</div>
                <div class="cc-dd-bar" style="height:${w.utilization_pct}%;background:${color}">
                  <div class="cc-dd-bar-tooltip">${w.name}: ${w.utilized}/${w.capacity} m² · ${w.active_staff}/${w.total_staff} staff · ${w.orders_today} orders today</div>
                </div>
                <div class="cc-dd-bar-label" style="max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8px">${w.name.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">🏭 Warehouse Operations Dashboard</div>
        <div class="cc-dd-scroll">
          <table class="cc-dd-table">
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Utilization</th>
                <th>Staff (Active)</th>
                <th>Orders Today</th>
                <th>Picks</th>
                <th>Packs</th>
                <th>Ships</th>
                <th>Pick Accuracy</th>
                <th>Avg Pick Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${db.warehouses.map(w => `
                <tr>
                  <td style="font-weight:600;color:#06B6D4">${w.name}</td>
                  <td style="font-size:11px">${w.location}</td>
                  <td style="text-align:right">${w.capacity.toLocaleString()} m²</td>
                  <td>
                    <span class="cc-dd-congestion-bar"><span class="cc-dd-congestion-fill" style="width:${w.utilization_pct}%;background:${w.utilization_pct > 85 ? '#ef4444' : w.utilization_pct > 75 ? '#f59e0b' : '#10B981'}"></span></span>
                    ${w.utilization_pct}%
                  </td>
                  <td style="text-align:center">${w.active_staff}/${w.total_staff}</td>
                  <td style="text-align:center">${w.orders_today}</td>
                  <td style="text-align:center">${w.picks_today}</td>
                  <td style="text-align:center">${w.packs_today}</td>
                  <td style="text-align:center">${w.ships_today}</td>
                  <td style="text-align:center;color:#10B981;font-weight:600">${w.pick_accuracy}%</td>
                  <td style="text-align:center">${w.avg_pick_time}s</td>
                  <td><span class="cc-dd-status cc-dd-status-${w.status === 'high-capacity' ? 'high-capacity' : 'operational'}">${w.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📦 Inventory Status — Low Stock & Critical Items</div>
        <div class="cc-dd-scroll" style="max-height:320px">
          <table class="cc-dd-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Category</th>
                <th>Warehouse</th>
                <th>Quantity</th>
                <th>Reorder Point</th>
                <th>Max</th>
                <th>Location</th>
                <th>Unit Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${db.inventory.filter(i => i.status !== 'in-stock').sort((a, b) => a.quantity - b.quantity).slice(0, 20).map(i => `
                <tr>
                  <td style="font-weight:600;color:#06B6D4">${i.sku}</td>
                  <td>${i.name}</td>
                  <td style="font-size:11px">${i.category}</td>
                  <td style="font-size:11px">${i.warehouse_name}</td>
                  <td style="text-align:right;color:${i.status === 'critical' ? '#ef4444' : '#f59e0b'};font-weight:700">${i.quantity}</td>
                  <td style="text-align:center">${i.reorder_point}</td>
                  <td style="text-align:center">${i.max_quantity}</td>
                  <td style="font-size:11px;font-family:monospace">${i.location}</td>
                  <td style="text-align:right">$${i.unit_value}</td>
                  <td><span class="cc-dd-status cc-dd-status-${i.status}">${i.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pick Path Optimization -->
      <div class="cc-dd-section">
        <div class="cc-dd-section-title">🗺️ Pick Path Optimization — AI-Optimized Routes</div>
        <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center;flex-wrap:wrap">
          <span style="font-size:12px;color:#64748b">Warehouse:</span>
          <select class="cc-dd-search" style="width:auto;padding:6px 12px" id="cc-dd-pickpath-wh" onchange="window.__ccDD.updatePickPath(this.value)">
            ${db.warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
          </select>
          <div style="display:flex;gap:8px;margin-left:auto">
            <div style="padding:6px 12px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:6px;font-size:11px"><span style="color:#3b82f6;font-weight:700">Current:</span> <span id="cc-dd-pick-current">412m</span> travel</div>
            <div style="padding:6px 12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:6px;font-size:11px"><span style="color:#10B981;font-weight:700">AI-Optimized:</span> <span id="cc-dd-pick-optimized">298m</span> travel</div>
            <div style="padding:6px 12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:6px;font-size:11px"><span style="color:#10B981;font-weight:700">Savings:</span> <span id="cc-dd-pick-savings">28%</span></div>
          </div>
        </div>
        <div id="cc-dd-pickpath-container">${renderPickPath(db.warehouses[0].id)}</div>
      </div>

      <!-- Cycle Counting Schedule -->
      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📋 Cycle Counting Schedule — Daily Counts & Variance Tracking</div>
        ${renderCycleCounting(db)}
      </div>

      <!-- Returns Processing -->
      <div class="cc-dd-section">
        <div class="cc-dd-section-title">↩️ Returns Processing Dashboard — Reverse Logistics</div>
        ${renderReturns(db)}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 3A. PICK PATH VISUALIZATION (SVG warehouse floor map)
  // ------------------------------------------------------------------
  function renderPickPath(warehouseId) {
    const db = initDatabase();
    const wh = db.warehouses.find(w => w.id === warehouseId) || db.warehouses[0];

    // Generate a warehouse grid (rows × columns of shelving)
    const rows = 6, cols = 10;
    const cellW = 55, cellH = 35, offsetX = 30, offsetY = 30;
    const svgW = cols * cellW + offsetX * 2;
    const svgH = rows * cellH + offsetY * 2 + 40;

    // Generate pick locations (random shelves have items to pick)
    const picks = [];
    const pickCount = Math.floor(Math.random() * 6) + 8;
    for (let i = 0; i < pickCount; i++) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      picks.push({ r, c, sku: 'SKU-' + (Math.floor(Math.random() * 40) + 10001), qty: Math.floor(Math.random() * 10) + 1 });
    }

    // Current path (suboptimal — sequential)
    const currentPath = picks.map((p, i) => ({ r: p.r, c: p.c }));
    // Optimized path (serpentine — row by row)
    const optimizedPath = [...picks].sort((a, b) => a.r - b.r || a.c - b.c);

    // Calculate coordinates
    function cellCenter(r, c) {
      return { x: offsetX + c * cellW + cellW / 2, y: offsetY + r * cellH + cellH / 2 };
    }

    // Current path line
    let currentPathStr = '';
    currentPath.forEach((p, i) => {
      const pt = cellCenter(p.r, p.c);
      currentPathStr += (i === 0 ? 'M' : 'L') + pt.x + ',' + pt.y + ' ';
    });

    // Optimized path line
    let optimizedPathStr = '';
    optimizedPath.forEach((p, i) => {
      const pt = cellCenter(p.r, p.c);
      optimizedPathStr += (i === 0 ? 'M' : 'L') + pt.x + ',' + pt.y + ' ';
    });

    // Start point (shipping dock — bottom left)
    const startPoint = { x: offsetX + cellW / 2, y: svgH - 25 };
    currentPathStr = 'M' + startPoint.x + ',' + startPoint.y + ' L' + cellCenter(currentPath[0].r, currentPath[0].c).x + ',' + cellCenter(currentPath[0].r, currentPath[0].c).y + ' ' + currentPathStr;
    optimizedPathStr = 'M' + startPoint.x + ',' + startPoint.y + ' L' + cellCenter(optimizedPath[0].r, optimizedPath[0].c).x + ',' + cellCenter(optimizedPath[0].r, optimizedPath[0].c).y + ' ' + optimizedPathStr;

    // Generate shelf SVG
    let shelvesSvg = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * cellW;
        const y = offsetY + r * cellH;
        const isPick = picks.some(p => p.r === r && p.c === c);
        shelvesSvg += `<rect x="${x + 4}" y="${y + 4}" width="${cellW - 8}" height="${cellH - 8}" rx="3" fill="${isPick ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)'}" stroke="${isPick ? '#3b82f6' : 'rgba(255,255,255,0.08)'}" stroke-width="1"/>`;
        if (isPick) {
          const pick = picks.find(p => p.r === r && p.c === c);
          shelvesSvg += `<text x="${x + cellW/2}" y="${y + cellH/2 + 3}" fill="#93c5fd" font-size="8" text-anchor="middle" font-family="sans-serif">${pick.qty}</text>`;
        } else {
          shelvesSvg += `<text x="${x + cellW/2}" y="${y + cellH/2 + 3}" fill="#334155" font-size="7" text-anchor="middle" font-family="sans-serif">A${r+1}-${c+1}</text>`;
        }
      }
    }

    // Pick markers (numbered circles)
    let pickMarkers = '';
    optimizedPath.forEach((p, i) => {
      const pt = cellCenter(p.r, p.c);
      pickMarkers += `<circle cx="${pt.x}" cy="${pt.y}" r="10" fill="#10B981" stroke="#0a0e1a" stroke-width="2"/>`;
      pickMarkers += `<text x="${pt.x}" y="${pt.y + 3}" fill="#fff" font-size="9" text-anchor="middle" font-family="sans-serif" font-weight="700">${i + 1}</text>`;
    });

    return `
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <!-- Warehouse floor map -->
        <div style="flex:1;min-width:400px">
          <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;height:auto;display:block;background:rgba(255,255,255,0.02);border-radius:8px">
            <!-- Shelves -->
            ${shelvesSvg}

            <!-- Current path (red, dashed) -->
            <path d="${currentPathStr}" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,3" opacity="0.5"/>

            <!-- Optimized path (green, solid) -->
            <path d="${optimizedPathStr}" fill="none" stroke="#10B981" stroke-width="2.5" opacity="0.8"/>

            <!-- Pick markers -->
            ${pickMarkers}

            <!-- Start point (shipping dock) -->
            <rect x="${startPoint.x - 20}" y="${startPoint.y - 12}" width="40" height="20" rx="4" fill="#06B6D4" opacity="0.8"/>
            <text x="${startPoint.x}" y="${startPoint.y + 2}" fill="#fff" font-size="8" text-anchor="middle" font-family="sans-serif" font-weight="700">DOCK</text>
          </svg>
          <div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:16px;height:2px;background:#ef4444;opacity:0.5;border-top:2px dashed #ef4444"></div> Current path</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:16px;height:2px;background:#10B981"></div> AI-optimized path</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:10px;height:10px;border-radius:50%;background:#3b82f6;opacity:0.3;border:1px solid #3b82f6"></div> Pick location</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:10px;height:10px;border-radius:50%;background:#10B981"></div> Optimized pick order</div>
          </div>
        </div>

        <!-- Pick list -->
        <div style="flex:0 0 280px">
          <div style="font-size:12px;font-weight:700;color:#e2e8f0;margin-bottom:8px">📋 Optimized Pick List (${picks.length} items)</div>
          <div class="cc-dd-scroll" style="max-height:280px">
            <table class="cc-dd-table">
              <thead>
                <tr><th>#</th><th>Location</th><th>SKU</th><th>Qty</th></tr>
              </thead>
              <tbody>
                ${optimizedPath.map((p, i) => {
                  const pick = picks.find(pk => pk.r === p.r && pk.c === p.c);
                  return `<tr><td style="text-align:center;color:#10B981;font-weight:700">${i + 1}</td><td style="font-family:monospace;font-size:11px">A${p.r+1}-${p.c+1}</td><td style="font-size:11px;color:#06B6D4">${pick.sku}</td><td style="text-align:center">${pick.qty}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top:10px;padding:10px 12px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:6px;font-size:11px;color:#6ee7b7">
            🤖 <strong>AI Optimization:</strong> Genetic algorithm reduced travel distance by 28% (412m → 298m). Estimated time saved: 3.2 min per batch. At ${wh.picks_today} picks/day, daily savings: ~2.1 hours of labor.
          </div>
        </div>
      </div>
    `;
  }

  function updatePickPath(warehouseId) {
    const container = document.getElementById('cc-dd-pickpath-container');
    if (container) container.innerHTML = renderPickPath(warehouseId);
    // Update stats
    const current = Math.floor(Math.random() * 200) + 350;
    const optimized = Math.floor(current * (0.65 + Math.random() * 0.1));
    const savings = Math.round((1 - optimized / current) * 100);
    const el1 = document.getElementById('cc-dd-pick-current');
    const el2 = document.getElementById('cc-dd-pick-optimized');
    const el3 = document.getElementById('cc-dd-pick-savings');
    if (el1) el1.textContent = current + 'm';
    if (el2) el2.textContent = optimized + 'm';
    if (el3) el3.textContent = savings + '%';
  }

  // ------------------------------------------------------------------
  // 3B. CYCLE COUNTING SCHEDULE
  // ------------------------------------------------------------------
  function renderCycleCounting(db) {
    const zones = ['Zone A (Electronics)', 'Zone B (Apparel)', 'Zone C (Food & Bev)', 'Zone D (Pharma)', 'Zone E (Automotive)', 'Zone F (Industrial)'];
    const counts = zones.map((zone, i) => {
      const expected = Math.floor(Math.random() * 300) + 200;
      const actual = expected + Math.floor(Math.random() * 20) - 10;
      const variance = actual - expected;
      const variancePct = Math.round(Math.abs(variance) / expected * 100 * 10) / 10;
      const countedBy = ['Mike R.', 'Sarah C.', 'Aisha P.', 'David K.', 'Lisa M.', 'Tom B.'][i % 6];
      const status = Math.abs(variance) < 5 ? 'matched' : Math.abs(variance) < 15 ? 'minor-variance' : 'major-variance';
      return { zone, expected, actual, variance, variancePct, countedBy, status, items: Math.floor(Math.random() * 50) + 30 };
    });

    const totalExpected = counts.reduce((s, c) => s + c.expected, 0);
    const totalActual = counts.reduce((s, c) => s + c.actual, 0);
    const totalVariance = totalActual - totalExpected;
    const accuracy = Math.round((1 - Math.abs(totalVariance) / totalExpected) * 1000) / 10;

    return `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="padding:10px 16px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Count Accuracy</div>
          <div style="font-size:22px;font-weight:800;color:#10B981">${accuracy}%</div>
        </div>
        <div style="padding:10px 16px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Total Variance</div>
          <div style="font-size:22px;font-weight:800;color:${totalVariance === 0 ? '#10B981' : '#f59e0b'}">${totalVariance > 0 ? '+' : ''}${totalVariance}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Zones Counted</div>
          <div style="font-size:22px;font-weight:800;color:#3b82f6">${counts.length}/${zones.length}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Items Counted</div>
          <div style="font-size:22px;font-weight:800;color:#8b5cf6">${counts.reduce((s, c) => s + c.items, 0)}</div>
        </div>
      </div>

      <div class="cc-dd-scroll">
        <table class="cc-dd-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Items Counted</th>
              <th>Expected Qty</th>
              <th>Actual Qty</th>
              <th>Variance</th>
              <th>Variance %</th>
              <th>Counted By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${counts.map(c => `
              <tr>
                <td style="font-weight:600">${c.zone}</td>
                <td style="text-align:center">${c.items}</td>
                <td style="text-align:right">${c.expected}</td>
                <td style="text-align:right">${c.actual}</td>
                <td style="text-align:center;color:${c.variance === 0 ? '#10B981' : c.variance > 0 ? '#f59e0b' : '#ef4444'};font-weight:700">${c.variance > 0 ? '+' : ''}${c.variance}</td>
                <td style="text-align:center;color:${c.variancePct < 1 ? '#10B981' : c.variancePct < 3 ? '#f59e0b' : '#ef4444'}">${c.variancePct}%</td>
                <td style="font-size:11px">${c.countedBy}</td>
                <td><span class="cc-dd-status cc-dd-status-${c.status === 'matched' ? 'operational' : c.status === 'minor-variance' ? 'high-capacity' : 'congested'}">${c.status.replace('-', ' ')}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px;padding:10px 14px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:6px;font-size:12px;color:#67e8f9">
        🤖 <strong>AI Insight:</strong> Overall count accuracy is ${accuracy}%. ${counts.filter(c => c.status !== 'matched').length} zones have variances requiring investigation. AI anomaly detection flagged ${Math.floor(Math.random() * 3) + 1} items as potential miscounts or shrinkage.
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 3C. RETURNS PROCESSING DASHBOARD
  // ------------------------------------------------------------------
  function renderReturns(db) {
    const returnReasons = [
      { reason: 'Damaged in transit', count: Math.floor(Math.random() * 30) + 15, color: '#ef4444' },
      { reason: 'Wrong item shipped', count: Math.floor(Math.random() * 20) + 8, color: '#f59e0b' },
      { reason: 'Quality issue', count: Math.floor(Math.random() * 15) + 10, color: '#8b5cf6' },
      { reason: 'Customer changed mind', count: Math.floor(Math.random() * 25) + 20, color: '#3b82f6' },
      { reason: 'Expired/Out of date', count: Math.floor(Math.random() * 8) + 3, color: '#ec4899' },
      { reason: 'Not as described', count: Math.floor(Math.random() * 12) + 6, color: '#06B6D4' },
      { reason: 'Late delivery', count: Math.floor(Math.random() * 10) + 4, color: '#14b8a6' }
    ];
    const totalReturns = returnReasons.reduce((s, r) => s + r.count, 0);
    const returnRate = (Math.random() * 2 + 3).toFixed(1);
    const totalReturnvalue = Math.floor(Math.random() * 50000) + 20000;
    const processedToday = Math.floor(totalReturns * 0.6);
    const pendingProcessing = totalReturns - processedToday;

    const returnSkus = SKU_NAMES.slice(0, 6).map((name, i) => ({
      name, sku: 'SKU-' + (10001 + i), returns: Math.floor(Math.random() * 15) + 3, value: Math.floor(Math.random() * 5000) + 500, returnRate: (Math.random() * 8 + 2).toFixed(1)
    })).sort((a, b) => b.returns - a.returns);

    return `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="padding:10px 16px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Return Rate</div>
          <div style="font-size:22px;font-weight:800;color:#ef4444">${returnRate}%</div>
        </div>
        <div style="padding:10px 16px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Total Returns (30d)</div>
          <div style="font-size:22px;font-weight:800;color:#f59e0b">${totalReturns}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Return Value</div>
          <div style="font-size:22px;font-weight:800;color:#ef4444">$${totalReturnvalue.toLocaleString()}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Processed Today</div>
          <div style="font-size:22px;font-weight:800;color:#10B981">${processedToday}/${totalReturns}</div>
        </div>
      </div>

      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <!-- Return reasons donut + breakdown -->
        <div style="flex:1;min-width:300px">
          <div style="font-size:12px;font-weight:700;color:#e2e8f0;margin-bottom:12px">📊 Returns by Reason</div>
          <div class="cc-dd-donut-row">
            ${renderDonut(
              Object.fromEntries(returnReasons.map(r => [r.reason, r.count])),
              returnReasons.map(r => r.color),
              totalReturns,
              'Returns'
            )}
            <div class="cc-dd-legend">
              ${returnReasons.sort((a, b) => b.count - a.count).map(r => `
                <div class="cc-dd-legend-item">
                  <div class="cc-dd-legend-dot" style="background:${r.color}"></div>
                  <div class="cc-dd-legend-label">${r.reason}</div>
                  <div class="cc-dd-legend-value">${r.count} (${Math.round(r.count / totalReturns * 100)}%)</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- High-return SKUs -->
        <div style="flex:1;min-width:300px">
          <div style="font-size:12px;font-weight:700;color:#e2e8f0;margin-bottom:12px">⚠️ High-Return Products (AI Flagged)</div>
          <div class="cc-dd-scroll" style="max-height:200px">
            <table class="cc-dd-table">
              <thead>
                <tr><th>SKU</th><th>Product</th><th>Returns</th><th>Value</th><th>Return Rate</th></tr>
              </thead>
              <tbody>
                ${returnSkus.map(s => `
                  <tr>
                    <td style="font-weight:600;color:#06B6D4;font-family:monospace">${s.sku}</td>
                    <td style="font-size:11px">${s.name}</td>
                    <td style="text-align:center">${s.returns}</td>
                    <td style="text-align:right;color:#ef4444">$${s.value.toLocaleString()}</td>
                    <td style="text-align:center;color:${s.returnRate > 5 ? '#ef4444' : '#f59e0b'};font-weight:700">${s.returnRate}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Reverse logistics workflow -->
      <div style="margin-top:16px">
        <div style="font-size:12px;font-weight:700;color:#e2e8f0;margin-bottom:10px">🔄 Reverse Logistics Pipeline</div>
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
          ${[
            { name: 'Return Initiated', count: Math.floor(totalReturns * 0.3), color: '#3b82f6' },
            { name: 'Received at WH', count: Math.floor(totalReturns * 0.25), color: '#06B6D4' },
            { name: 'Inspected', count: Math.floor(totalReturns * 0.2), color: '#f59e0b' },
            { name: 'Restocked', count: Math.floor(totalReturns * 0.12), color: '#10B981' },
            { name: 'Refurbished', count: Math.floor(totalReturns * 0.08), color: '#8b5cf6' },
            { name: 'Disposed', count: Math.floor(totalReturns * 0.05), color: '#ef4444' }
          ].map((stage, i, arr) => `
            <div style="flex:1;min-width:110px;text-align:center;padding:10px;background:rgba(255,255,255,0.02);border:1px solid ${stage.color}30;border-radius:8px;position:relative">
              <div style="width:24px;height:24px;border-radius:50%;background:${stage.color}20;margin:0 auto 6px;display:flex;align-items:center;justify-content:center"><div style="width:10px;height:10px;border-radius:50%;background:${stage.color}"></div></div>
              <div style="font-size:10px;font-weight:600;color:${stage.color}">${stage.name}</div>
              <div style="font-size:16px;font-weight:800;color:#e2e8f0">${stage.count}</div>
              ${i < arr.length - 1 ? '<div style="position:absolute;right:-6px;top:50%;transform:translateY(-50%);color:#64748b;font-size:12px">→</div>' : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-top:12px;padding:10px 14px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:6px;font-size:12px;color:#67e8f9">
        🤖 <strong>AI Returns Prediction:</strong> ML model predicts ${Math.floor(Math.random() * 30 + 20)} returns in the next 7 days based on order patterns and seasonal trends. Top return-risk product: ${returnSkus[0].name} (${returnSkus[0].returnRate}% return rate). Recommend quality review for this SKU.
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4. AI FORECASTING
  // ------------------------------------------------------------------
  function renderForecast(container) {
    const db = initDatabase();
    const avgAccuracy = Math.round(db.forecasts.reduce((s, f) => s + f.accuracy, 0) / db.forecasts.length * 10) / 10;
    const avgMAPE = Math.round(db.forecasts.reduce((s, f) => s + f.mape, 0) / db.forecasts.length * 10) / 10;
    const highRisk = db.forecasts.filter(f => f.stockout_risk === 'high').length;
    const reorderRecommended = db.forecasts.filter(f => f.reorder_recommended).length;

    container.innerHTML = `
      <div class="cc-dd-header">
        <h2 class="cc-dd-page-title">🤖 AI Demand Forecasting <span class="cc-dd-page-badge">ML POWERED</span></h2>
        <div class="cc-dd-live-indicator"><div class="cc-dd-live-dot"></div> Models active</div>
      </div>

      <div class="cc-dd-cards">
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">SKUs Forecasted</div>
          <div class="cc-dd-card-value">${db.forecasts.length}</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">7-day horizon</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Avg Accuracy</div>
          <div class="cc-dd-card-value" style="color:#10B981">${avgAccuracy}%</div>
          <div class="cc-dd-card-delta cc-dd-delta-up">MAPE: ${avgMAPE}%</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">High Stockout Risk</div>
          <div class="cc-dd-card-value" style="color:${highRisk > 2 ? '#ef4444' : '#f59e0b'}">${highRisk}</div>
          <div class="cc-dd-card-delta cc-dd-delta-down">requires reorder</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Reorders Recommended</div>
          <div class="cc-dd-card-value" style="color:#f59e0b">${reorderRecommended}</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">AI-generated alerts</div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📊 Forecast Accuracy by ML Model</div>
        <div class="cc-dd-donut-row">
          ${renderDonut(
            FORECAST_MODELS.reduce((acc, m) => {
              acc[m] = db.forecasts.filter(f => f.model === m).length;
              return acc;
            }, {}),
            ['#3b82f6', '#8b5cf6', '#06B6D4', '#10B981', '#f59e0b'],
            db.forecasts.length,
            'Models'
          )}
          <div class="cc-dd-legend">
            ${FORECAST_MODELS.map((m, i) => {
              const count = db.forecasts.filter(f => f.model === m).length;
              const avgAcc = count > 0 ? Math.round(db.forecasts.filter(f => f.model === m).reduce((s, f) => s + f.accuracy, 0) / count * 10) / 10 : 0;
              return `
                <div class="cc-dd-legend-item">
                  <div class="cc-dd-legend-dot" style="background:${['#3b82f6', '#8b5cf6', '#06B6D4', '#10B981', '#f59e0b'][i]}"></div>
                  <div class="cc-dd-legend-label">${m}</div>
                  <div class="cc-dd-legend-value">${count} SKUs · ${avgAcc}% acc</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📈 Demand Forecast Charts — Top 10 SKUs</div>
        ${db.forecasts.map((f, idx) => {
          const allValues = [...f.historical.map(h => h.value), ...f.forecast.map(fc => fc.value)];
          const maxVal = Math.max(...allValues, 1);
          const color = f.stockout_risk === 'high' ? '#ef4444' : f.stockout_risk === 'medium' ? '#f59e0b' : '#10B981';
          return `
            <div style="margin-bottom:24px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <div>
                  <span style="font-size:14px;font-weight:700;color:#e2e8f0">${f.sku_name}</span>
                  <span style="font-size:11px;color:#64748b;margin-left:8px">${f.sku} · ${f.category}</span>
                </div>
                <div style="display:flex;gap:12px;align-items:center">
                  <span style="font-size:11px;color:#64748b">Model: <strong style="color:#06B6D4">${f.model}</strong></span>
                  <span style="font-size:11px;color:#64748b">Accuracy: <strong style="color:#10B981">${f.accuracy}%</strong></span>
                  <span style="font-size:11px;color:#64748b">MAPE: <strong style="color:${f.mape < 10 ? '#10B981' : '#f59e0b'}">${f.mape}%</strong></span>
                  <span class="cc-dd-status cc-dd-status-${f.stockout_risk === 'high' ? 'critical' : f.stockout_risk === 'medium' ? 'low' : 'in-stock'}">${f.stockout_risk} risk</span>
                </div>
              </div>
              <div class="cc-dd-forecast-chart">
                ${f.historical.map(h => `
                  <div class="cc-dd-forecast-bar cc-dd-forecast-actual" style="height:${h.value / maxVal * 100}%" title="${h.date}: ${h.value} units (actual)"></div>
                `).join('')}
                ${f.forecast.map((fc, i) => `
                  <div class="cc-dd-forecast-bar cc-dd-forecast-predicted" style="height:${fc.value / maxVal * 100}%" title="${fc.date}: ${fc.value} units (predicted, ±${f.confidence_high[i].value - fc.value})"></div>
                `).join('')}
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:9px;color:#64748b">
                <span>30 days historical</span>
                <span>↑ 7 days forecast →</span>
              </div>
              ${f.predicted_stockout_date ? `
                <div style="margin-top:8px;padding:8px 12px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:6px;font-size:12px;color:#ef4444">
                  ⚠️ <strong>Stockout predicted:</strong> ${new Date(f.predicted_stockout_date).toLocaleDateString('en-US', {weekday:'long',month:'short',day:'numeric'})} — Reorder recommended immediately.
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📋 Forecast Summary Table</div>
        <div class="cc-dd-scroll">
          <table class="cc-dd-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Category</th>
                <th>ML Model</th>
                <th>Accuracy</th>
                <th>MAPE</th>
                <th>7-Day Forecast (avg)</th>
                <th>Stockout Risk</th>
                <th>Reorder?</th>
                <th>Last Trained</th>
              </tr>
            </thead>
            <tbody>
              ${db.forecasts.sort((a, b) => b.mape - a.mape).map(f => `
                <tr>
                  <td style="font-weight:600;color:#06B6D4">${f.sku}</td>
                  <td>${f.sku_name}</td>
                  <td style="font-size:11px">${f.category}</td>
                  <td style="font-size:11px">${f.model}</td>
                  <td style="text-align:center;color:#10B981;font-weight:600">${f.accuracy}%</td>
                  <td style="text-align:center">${f.mape}%</td>
                  <td style="text-align:right">${Math.round(f.forecast.reduce((s, d) => s + d.value, 0) / 7)} units/day</td>
                  <td><span class="cc-dd-status cc-dd-status-${f.stockout_risk === 'high' ? 'critical' : f.stockout_risk === 'medium' ? 'low' : 'in-stock'}">${f.stockout_risk}</span></td>
                  <td style="text-align:center">${f.reorder_recommended ? '✅ Yes' : '—'}</td>
                  <td style="font-size:11px;color:#64748b">${new Date(f.last_trained).toLocaleDateString('en-US', {month:'short',day:'numeric'})}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- AI Anomaly Detection -->
      <div class="cc-dd-section">
        <div class="cc-dd-section-title">🔍 AI Anomaly Detection — Isolation Forest Model</div>
        ${renderAnomalyDetection(db)}
      </div>

      <!-- AI Labor Forecasting -->
      <div class="cc-dd-section">
        <div class="cc-dd-section-title">👷 AI Labor Forecasting — Staffing Predictions (7-Day)</div>
        ${renderLaborForecast(db)}
      </div>

      <!-- AI Slotting Optimization -->
      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📦 AI Slotting Optimization — ABC Analysis & Reassignment</div>
        ${renderSlottingOptimization(db)}
      </div>

      <!-- AI Returns Prediction -->
      <div class="cc-dd-section">
        <div class="cc-dd-section-title">↩️ AI Returns Prediction — ML Risk Scoring per SKU</div>
        ${renderReturnsPrediction(db)}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4A. AI ANOMALY DETECTION
  // ------------------------------------------------------------------
  function renderAnomalyDetection(db) {
    const anomalies = [
      { id: 'an1', type: 'Inventory Shrinkage', sku: 'SKU-10003', product: '4K Monitor', warehouse: 'Rotterdam DC-1', expected: 320, actual: 298, delta: -22, severity: 'high', confidence: 94, detected: new Date(Date.now() - 3 * 3600000).toISOString(), aiNote: 'Unexplained reduction of 22 units. Possible theft, miscount, or undocumented damage. Recommend physical audit.' },
      { id: 'an2', type: 'Demand Spike', sku: 'SKU-10005', product: 'Gaming Mouse', warehouse: 'Singapore Hub', expected: 45, actual: 128, delta: 183, severity: 'medium', confidence: 87, detected: new Date(Date.now() - 8 * 3600000).toISOString(), aiNote: 'Demand 183% above forecast. Possible viral marketing event or competitor stockout. Consider emergency reorder.' },
      { id: 'an3', type: 'Miscount Detected', sku: 'SKU-10012', product: 'Vitamin D3', warehouse: 'LA Distribution', expected: 500, actual: 547, delta: 47, severity: 'low', confidence: 91, detected: new Date(Date.now() - 14 * 3600000).toISOString(), aiNote: 'Count variance of 47 units exceeds 3-sigma threshold. Likely receiving error. Recommend recount.' },
      { id: 'an4', type: 'Inventory Shrinkage', sku: 'SKU-10008', product: 'Winter Jacket', warehouse: 'Dubai Logistics City', expected: 180, actual: 162, delta: -18, severity: 'medium', confidence: 89, detected: new Date(Date.now() - 20 * 3600000).toISOString(), aiNote: 'Shrinkage of 18 units (10%). Pattern matches seasonal theft trend. Recommend security review.' },
      { id: 'an5', type: 'Demand Drop', sku: 'SKU-10015', product: 'Green Tea 100pk', warehouse: 'Rotterdam DC-1', expected: 210, actual: 89, delta: -58, severity: 'medium', confidence: 85, detected: new Date(Date.now() - 26 * 3600000).toISOString(), aiNote: 'Demand dropped 58% below forecast. Possible expired listing or competitor promotion. Investigate cause.' },
      { id: 'an6', type: 'Price Anomaly', sku: 'SKU-10002', product: 'Wireless Earbuds', warehouse: 'Singapore Hub', expected: 89.99, actual: 49.99, delta: -44, severity: 'high', confidence: 96, detected: new Date(Date.now() - 30 * 3600000).toISOString(), aiNote: 'Unit price dropped 44% unexpectedly. Possible pricing error or unauthorized discount. Immediate review needed.' }
    ];
    const highSeverity = anomalies.filter(a => a.severity === 'high').length;
    const totalValue = Math.floor(Math.random() * 80000) + 40000;

    return `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="padding:10px 16px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Anomalies Detected</div>
          <div style="font-size:22px;font-weight:800;color:#ef4444">${anomalies.length}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">High Severity</div>
          <div style="font-size:22px;font-weight:800;color:#ef4444">${highSeverity}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Est. Value Impact</div>
          <div style="font-size:22px;font-weight:800;color:#f59e0b">$${totalValue.toLocaleString()}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Model Accuracy</div>
          <div style="font-size:22px;font-weight:800;color:#06B6D4">93.2%</div>
        </div>
      </div>

      <div class="cc-dd-scroll">
        <table class="cc-dd-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>SKU</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Delta</th>
              <th>Severity</th>
              <th>Confidence</th>
              <th>AI Note</th>
            </tr>
          </thead>
          <tbody>
            ${anomalies.map(a => `
              <tr>
                <td style="font-weight:600;color:${a.severity === 'high' ? '#ef4444' : a.severity === 'medium' ? '#f59e0b' : '#06B6D4'}">${a.type}</td>
                <td style="font-family:monospace;font-size:11px;color:#06B6D4">${a.sku}</td>
                <td style="font-size:11px">${a.product}</td>
                <td style="font-size:11px">${a.warehouse}</td>
                <td style="text-align:right">${a.expected}</td>
                <td style="text-align:right">${a.actual}</td>
                <td style="text-align:center;color:${a.delta < 0 ? '#ef4444' : a.delta > 50 ? '#f59e0b' : '#10B981'};font-weight:700">${a.delta > 0 ? '+' : ''}${a.delta}${a.type === 'Price Anomaly' ? '%' : ''}</td>
                <td><span class="cc-dd-status cc-dd-status-${a.severity === 'high' ? 'congested' : a.severity === 'medium' ? 'high-capacity' : 'operational'}">${a.severity}</span></td>
                <td style="text-align:center">
                  <span class="cc-dd-congestion-bar"><span class="cc-dd-congestion-fill" style="width:${a.confidence}%;background:${a.confidence > 90 ? '#10B981' : '#f59e0b'}"></span></span>
                  ${a.confidence}%
                </td>
                <td style="font-size:10px;color:#94a3b8;max-width:250px">${a.aiNote}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px;padding:10px 14px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:6px;font-size:12px;color:#67e8f9">
        🔍 <strong>Isolation Forest Model:</strong> Trained on 90 days of historical data across ${db.inventory.length} SKUs and ${db.warehouses.length} warehouses. Detects anomalies using 3-sigma deviation from expected values. Model retrains weekly. ${highSeverity} high-severity anomalies require immediate attention.
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4B. AI LABOR FORECASTING
  // ------------------------------------------------------------------
  function renderLaborForecast(db) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const laborData = db.warehouses.map(wh => {
      const dailyForecast = days.map((day, i) => {
        const predictedVolume = Math.floor(Math.random() * 80) + 120 + (i < 5 ? 50 : -30);
        const recommendedStaff = Math.ceil(predictedVolume / 25);
        const currentStaff = Math.floor(recommendedStaff * (0.85 + Math.random() * 0.3));
        const overtime = Math.max(0, currentStaff - recommendedStaff);
        const gap = recommendedStaff - currentStaff;
        return { day, predictedVolume, recommendedStaff, currentStaff, overtime, gap };
      });
      return { warehouse: wh, daily: dailyForecast };
    });

    const maxVolume = Math.max(...laborData.flatMap(w => w.daily.map(d => d.predictedVolume)));

    return `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="padding:10px 16px;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Total Staff (4 WH)</div>
          <div style="font-size:22px;font-weight:800;color:#3b82f6">${db.warehouses.reduce((s,w) => s + w.total_staff, 0)}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Recommended (7d avg)</div>
          <div style="font-size:22px;font-weight:800;color:#10B981">${Math.round(laborData.flatMap(w=>w.daily).reduce((s,d)=>s+d.recommendedStaff,0)/7)}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Est. Overtime Cost/wk</div>
          <div style="font-size:22px;font-weight:800;color:#f59e0b">$${(Math.random()*8000+5000).toFixed(0)}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Model</div>
          <div style="font-size:14px;font-weight:800;color:#06B6D4">XGBoost Reg.</div>
        </div>
      </div>

      ${laborData.map((wh, wi) => `
        <div style="margin-bottom:20px">
          <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:10px">🏭 ${wh.warehouse.name}</div>
          <div style="display:flex;gap:6px;margin-bottom:8px">
            ${wh.daily.map((d, i) => {
              const heightPct = (d.predictedVolume / maxVolume) * 100;
              const barColor = d.gap > 0 ? '#ef4444' : d.gap === 0 ? '#10B981' : '#f59e0b';
              return `
                <div style="flex:1;text-align:center">
                  <div style="font-size:9px;color:#64748b;margin-bottom:4px">${d.day}</div>
                  <div style="height:60px;display:flex;align-items:flex-end;justify-content:center">
                    <div style="width:80%;height:${heightPct}%;background:linear-gradient(180deg,${barColor},${barColor}80);border-radius:4px 4px 0 0;min-height:8px;transition:height 0.4s" title="${d.day}: ${d.predictedVolume} orders predicted, ${d.recommendedStaff} staff recommended, ${d.currentStaff} scheduled"></div>
                  </div>
                  <div style="font-size:10px;font-weight:700;color:${barColor};margin-top:4px">${d.recommendedStaff}</div>
                  <div style="font-size:8px;color:#64748b">${d.currentStaff} sched</div>
                  <div style="font-size:8px;color:${d.gap > 0 ? '#ef4444' : d.gap === 0 ? '#10B981' : '#64748b'}">${d.gap > 0 ? '⚠️ +' + d.gap + ' needed' : d.gap === 0 ? '✅ optimal' : '↓ ' + Math.abs(d.gap) + ' over'}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}

      <div class="cc-dd-scroll">
        <table class="cc-dd-table">
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>Day</th>
              <th>Predicted Volume</th>
              <th>Recommended Staff</th>
              <th>Currently Scheduled</th>
              <th>Gap</th>
              <th>Overtime Est.</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${laborData.flatMap((wh, wi) => wh.daily.map((d, di) => `
              <tr>
                <td style="font-weight:600;font-size:11px">${wh.warehouse.name}</td>
                <td>${d.day}</td>
                <td style="text-align:center">${d.predictedVolume} orders</td>
                <td style="text-align:center;color:#10B981;font-weight:600">${d.recommendedStaff}</td>
                <td style="text-align:center">${d.currentStaff}</td>
                <td style="text-align:center;color:${d.gap > 0 ? '#ef4444' : d.gap === 0 ? '#10B981' : '#64748b'};font-weight:700">${d.gap > 0 ? '+' + d.gap + ' needed' : d.gap === 0 ? '✅' : '-' + Math.abs(d.gap)}</td>
                <td style="text-align:right;color:${d.overtime > 0 ? '#f59e0b' : '#64748b'}">${d.overtime > 0 ? '$' + (d.overtime * 150) : '—'}</td>
                <td><button class="cc-dd-btn cc-dd-btn-secondary" onclick="alert('Demo: Auto-adjust schedule for ${wh.warehouse.name} ${d.day}')">⚙️ Adjust</button></td>
              </tr>
            `)).slice(0, 14).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px;padding:10px 14px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:6px;font-size:12px;color:#67e8f9">
        👷 <strong>XGBoost Regression Model:</strong> Predicts staffing needs based on order volume forecasts, day-of-week patterns, and seasonal trends. ${laborData.flatMap(w=>w.daily).filter(d=>d.gap>0).length} shifts need additional staff. Estimated overtime savings if adjusted: $${(Math.random()*5000+3000).toFixed(0)}/week.
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4C. AI SLOTTING OPTIMIZATION
  // ------------------------------------------------------------------
  function renderSlottingOptimization(db) {
    // ABC analysis: A = top 20% movers (80% of picks), B = next 30%, C = bottom 50%
    const slotData = SKU_NAMES.slice(0, 20).map((name, i) => {
      const pickFreq = Math.floor(Math.random() * 1000) + 10;
      const abcClass = pickFreq > 500 ? 'A' : pickFreq > 200 ? 'B' : 'C';
      const currentZone = String.fromCharCode(65 + (i % 6)); // A-F
      const currentAisle = Math.floor(Math.random() * 20) + 1;
      const currentDist = Math.floor(Math.random() * 80) + 20;
      const recommendedZone = abcClass === 'A' ? 'A' : abcClass === 'B' ? 'B' : 'F';
      const recommendedAisle = abcClass === 'A' ? Math.floor(Math.random() * 5) + 1 : abcClass === 'B' ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 10) + 11;
      const recommendedDist = abcClass === 'A' ? Math.floor(Math.random() * 15) + 5 : abcClass === 'B' ? Math.floor(Math.random() * 25) + 15 : Math.floor(Math.random() * 40) + 40;
      const savings = Math.max(0, currentDist - recommendedDist);
      const savingsPct = currentDist > 0 ? Math.round(savings / currentDist * 100) : 0;
      return {
        sku: 'SKU-' + (10001 + i), name, pickFreq, abcClass,
        current: `Zone ${currentZone}, Aisle ${currentAisle} (${currentDist}m from dock)`,
        recommended: `Zone ${recommendedZone}, Aisle ${recommendedAisle} (${recommendedDist}m from dock)`,
        currentDist, recommendedDist, savings, savingsPct,
        needsMove: savings > 10
      };
    }).sort((a, b) => b.pickFreq - a.pickFreq);

    const classA = slotData.filter(s => s.abcClass === 'A').length;
    const classB = slotData.filter(s => s.abcClass === 'B').length;
    const classC = slotData.filter(s => s.abcClass === 'C').length;
    const movesNeeded = slotData.filter(s => s.needsMove).length;
    const totalSavings = slotData.reduce((s, x) => s + x.savings, 0);
    const avgSavingsPct = Math.round(slotData.reduce((s, x) => s + x.savingsPct, 0) / slotData.length);

    return `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="padding:10px 16px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Class A (Fast Movers)</div>
          <div style="font-size:22px;font-weight:800;color:#10B981">${classA} SKUs</div>
          <div style="font-size:10px;color:#64748b">${Math.round(classA/20*100)}% of SKUs, 80% of picks</div>
        </div>
        <div style="padding:10px 16px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Class B (Medium)</div>
          <div style="font-size:22px;font-weight:800;color:#f59e0b">${classB} SKUs</div>
          <div style="font-size:10px;color:#64748b">30% of SKUs, 15% of picks</div>
        </div>
        <div style="padding:10px 16px;background:rgba(100,116,139,0.06);border:1px solid rgba(100,116,139,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Class C (Slow)</div>
          <div style="font-size:22px;font-weight:800;color:#64748b">${classC} SKUs</div>
          <div style="font-size:10px;color:#64748b">50% of SKUs, 5% of picks</div>
        </div>
        <div style="padding:10px 16px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Travel Reduction</div>
          <div style="font-size:22px;font-weight:800;color:#10B981">${avgSavingsPct}%</div>
          <div style="font-size:10px;color:#64748b">${movesNeeded} SKUs need reslotting</div>
        </div>
      </div>

      <!-- ABC Distribution donut -->
      <div class="cc-dd-donut-row" style="margin-bottom:20px">
        ${renderDonut({ 'Class A': classA, 'Class B': classB, 'Class C': classC }, ['#10B981', '#f59e0b', '#64748b'], 20, 'SKUs')}
        <div class="cc-dd-legend">
          <div class="cc-dd-legend-item"><div class="cc-dd-legend-dot" style="background:#10B981"></div><div class="cc-dd-legend-label">Class A — Fast movers (near dock)</div><div class="cc-dd-legend-value">${classA} SKUs</div></div>
          <div class="cc-dd-legend-item"><div class="cc-dd-legend-dot" style="background:#f59e0b"></div><div class="cc-dd-legend-label">Class B — Medium (mid-warehouse)</div><div class="cc-dd-legend-value">${classB} SKUs</div></div>
          <div class="cc-dd-legend-item"><div class="cc-dd-legend-dot" style="background:#64748b"></div><div class="cc-dd-legend-label">Class C — Slow (back of warehouse)</div><div class="cc-dd-legend-value">${classC} SKUs</div></div>
        </div>
      </div>

      <div class="cc-dd-scroll">
        <table class="cc-dd-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Pick Freq (30d)</th>
              <th>ABC Class</th>
              <th>Current Location</th>
              <th>AI Recommended</th>
              <th>Distance Saved</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${slotData.map(s => `
              <tr>
                <td style="font-weight:600;color:#06B6D4;font-family:monospace">${s.sku}</td>
                <td style="font-size:11px">${s.name}</td>
                <td style="text-align:center">${s.pickFreq}</td>
                <td style="text-align:center"><span class="cc-dd-status cc-dd-status-${s.abcClass === 'A' ? 'operational' : s.abcClass === 'B' ? 'high-capacity' : 'low'}" style="font-size:10px;padding:2px 8px">${s.abcClass}</span></td>
                <td style="font-size:11px;color:#94a3b8">${s.current}</td>
                <td style="font-size:11px;color:${s.needsMove ? '#10B981' : '#64748b'}">${s.recommended}</td>
                <td style="text-align:center;color:${s.savings > 10 ? '#10B981' : '#64748b'};font-weight:${s.savings > 10 ? '700' : '400'}">${s.savings > 0 ? s.savings + 'm (' + s.savingsPct + '%)' : '—'}</td>
                <td>${s.needsMove ? '<button class="cc-dd-btn cc-dd-btn-primary" style="font-size:10px;padding:4px 10px" onclick="alert(\'Demo: Auto-reslot ' + s.sku + '\')">📦 Reslot</button>' : '<span style="color:#64748b;font-size:10px">✅ Optimal</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px;padding:10px 14px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:6px;font-size:12px;color:#67e8f9">
        📦 <strong>Clustering + Frequency Analysis:</strong> AI analyzed 30 days of pick data and classified ${slotData.length} SKUs using ABC analysis. ${movesNeeded} SKUs are in suboptimal locations. Reslotting all would reduce average pick travel by ${avgSavingsPct}% (${totalSavings}m total savings), saving an estimated ${(totalSavings * 0.5).toFixed(0)} hours of labor per month.
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4D. AI RETURNS PREDICTION
  // ------------------------------------------------------------------
  function renderReturnsPrediction(db) {
    const returnPredictions = SKU_NAMES.slice(0, 12).map((name, i) => {
      const returnRate = (Math.random() * 12 + 1).toFixed(1);
      const riskScore = Math.floor(Math.random() * 100);
      const riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';
      const predictedReturns7d = Math.floor(Math.random() * 15) + 1;
      const historicalReturns30d = Math.floor(Math.random() * 40) + 5;
      const topReason = ['Damaged in transit', 'Wrong item', 'Quality issue', 'Not as described', 'Customer changed mind'][Math.floor(Math.random() * 5)];
      const modelConfidence = Math.floor(Math.random() * 20) + 78;
      const recommendedAction = riskLevel === 'high' ? 'Quality review + packaging audit' : riskLevel === 'medium' ? 'Monitor return trend' : 'No action needed';
      return { sku: 'SKU-' + (10001 + i), name, returnRate: parseFloat(returnRate), riskScore, riskLevel, predictedReturns7d, historicalReturns30d, topReason, modelConfidence, recommendedAction };
    }).sort((a, b) => b.riskScore - a.riskScore);

    const highRisk = returnPredictions.filter(p => p.riskLevel === 'high').length;
    const mediumRisk = returnPredictions.filter(p => p.riskLevel === 'medium').length;
    const totalPredictedReturns = returnPredictions.reduce((s, p) => s + p.predictedReturns7d, 0);
    const avgRiskScore = Math.round(returnPredictions.reduce((s, p) => s + p.riskScore, 0) / returnPredictions.length);

    return `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="padding:10px 16px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">High-Risk SKUs</div>
          <div style="font-size:22px;font-weight:800;color:#ef4444">${highRisk}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Medium-Risk SKUs</div>
          <div style="font-size:22px;font-weight:800;color:#f59e0b">${mediumRisk}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Predicted Returns (7d)</div>
          <div style="font-size:22px;font-weight:800;color:#06B6D4">${totalPredictedReturns}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.15);border-radius:8px;flex:1;min-width:140px">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase">Avg Risk Score</div>
          <div style="font-size:22px;font-weight:800;color:${avgRiskScore > 50 ? '#ef4444' : '#8b5cf6'}">${avgRiskScore}/100</div>
        </div>
      </div>

      <!-- Risk distribution donut -->
      <div class="cc-dd-donut-row" style="margin-bottom:20px">
        ${renderDonut(
          { 'High Risk': highRisk, 'Medium Risk': mediumRisk, 'Low Risk': returnPredictions.filter(p=>p.riskLevel==='low').length },
          ['#ef4444', '#f59e0b', '#10B981'],
          returnPredictions.length,
          'SKUs'
        )}
        <div class="cc-dd-legend">
          <div class="cc-dd-legend-item"><div class="cc-dd-legend-dot" style="background:#ef4444"></div><div class="cc-dd-legend-label">High Risk (score > 70)</div><div class="cc-dd-legend-value">${highRisk} SKUs</div></div>
          <div class="cc-dd-legend-item"><div class="cc-dd-legend-dot" style="background:#f59e0b"></div><div class="cc-dd-legend-label">Medium Risk (40-70)</div><div class="cc-dd-legend-value">${mediumRisk} SKUs</div></div>
          <div class="cc-dd-legend-item"><div class="cc-dd-legend-dot" style="background:#10B981"></div><div class="cc-dd-legend-label">Low Risk (< 40)</div><div class="cc-dd-legend-value">${returnPredictions.filter(p=>p.riskLevel==='low').length} SKUs</div></div>
        </div>
      </div>

      <div class="cc-dd-scroll">
        <table class="cc-dd-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Return Rate</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
              <th>Returns (30d)</th>
              <th>Predicted (7d)</th>
              <th>Top Reason</th>
              <th>Model Conf.</th>
              <th>AI Recommendation</th>
            </tr>
          </thead>
          <tbody>
            ${returnPredictions.map(p => `
              <tr>
                <td style="font-weight:600;color:#06B6D4;font-family:monospace">${p.sku}</td>
                <td style="font-size:11px">${p.name}</td>
                <td style="text-align:center;color:${p.returnRate > 5 ? '#ef4444' : p.returnRate > 3 ? '#f59e0b' : '#10B981'};font-weight:700">${p.returnRate}%</td>
                <td style="text-align:center">
                  <span class="cc-dd-congestion-bar"><span class="cc-dd-congestion-fill" style="width:${p.riskScore}%;background:${p.riskScore > 70 ? '#ef4444' : p.riskScore > 40 ? '#f59e0b' : '#10B981'}"></span></span>
                  ${p.riskScore}
                </td>
                <td><span class="cc-dd-status cc-dd-status-${p.riskLevel === 'high' ? 'congested' : p.riskLevel === 'medium' ? 'high-capacity' : 'operational'}">${p.riskLevel}</span></td>
                <td style="text-align:center">${p.historicalReturns30d}</td>
                <td style="text-align:center;color:#06B6D4;font-weight:600">${p.predictedReturns7d}</td>
                <td style="font-size:11px;color:#94a3b8">${p.topReason}</td>
                <td style="text-align:center;color:${p.modelConfidence > 85 ? '#10B981' : '#f59e0b'}">${p.modelConfidence}%</td>
                <td style="font-size:11px;color:${p.riskLevel === 'high' ? '#ef4444' : '#94a3b8'}">${p.recommendedAction}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px;padding:10px 14px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:6px;font-size:12px;color:#67e8f9">
        🤖 <strong>XGBoost Classification Model:</strong> Predicts return risk using features: historical return rate, product category, price point, seasonality, shipping distance, and customer demographics. ${highRisk} SKUs flagged as high-risk. Top return-risk product: <strong>${returnPredictions[0].name}</strong> (${returnPredictions[0].returnRate}% return rate, risk score ${returnPredictions[0].riskScore}/100). Recommend: ${returnPredictions[0].recommendedAction}.
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 5. CONTROL TOWER
  // ------------------------------------------------------------------
  function renderTower(container) {
    const db = initDatabase();
    const healthScore = Math.round(100 - db.alerts.filter(a => a.severity === 'high' && !a.acknowledged).length * 5 - db.alerts.filter(a => a.severity === 'medium' && !a.acknowledged).length * 2);
    const portAlerts = db.alerts.filter(a => a.module === 'ports');
    const wmsAlerts = db.alerts.filter(a => a.module === 'wms');
    const forecastAlerts = db.alerts.filter(a => a.module === 'forecast');

    container.innerHTML = `
      <div class="cc-dd-header">
        <h2 class="cc-dd-page-title">🗼 Control Tower <span class="cc-dd-page-badge">UNIFIED VIEW</span></h2>
        <div class="cc-dd-live-indicator"><div class="cc-dd-live-dot"></div> All systems monitored</div>
      </div>

      <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px">
        <div class="cc-dd-section" style="flex:0 0 auto">
          <div class="cc-dd-section-title">🎯 Supply Chain Health</div>
          <div style="display:flex;align-items:center;justify-content:center;padding:20px">
            ${renderHealthScore(Math.max(healthScore, 0))}
          </div>
        </div>
        <div class="cc-dd-section" style="flex:1;min-width:300px">
          <div class="cc-dd-section-title">📊 Module Health Summary</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
            <div style="text-align:center;padding:16px;background:rgba(6,182,212,0.05);border-radius:8px">
              <div style="font-size:24px">⚓</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px">Ports</div>
              <div style="font-size:20px;font-weight:800;color:${portAlerts.filter(a=>a.severity==='high').length > 0 ? '#ef4444' : '#10B981'}">${10 - portAlerts.filter(a=>a.severity==='high').length}/10</div>
              <div style="font-size:10px;color:#64748b">${portAlerts.length} alerts</div>
            </div>
            <div style="text-align:center;padding:16px;background:rgba(16,185,129,0.05);border-radius:8px">
              <div style="font-size:24px">🏭</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px">Warehouses</div>
              <div style="font-size:20px;font-weight:800;color:${wmsAlerts.filter(a=>a.severity==='high').length > 0 ? '#ef4444' : '#10B981'}">${4 - wmsAlerts.filter(a=>a.severity==='high').length}/4</div>
              <div style="font-size:10px;color:#64748b">${wmsAlerts.length} alerts</div>
            </div>
            <div style="text-align:center;padding:16px;background:rgba(139,92,246,0.05);border-radius:8px">
              <div style="font-size:24px">🤖</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px">AI Forecast</div>
              <div style="font-size:20px;font-weight:800;color:${forecastAlerts.filter(a=>a.severity==='high').length > 0 ? '#ef4444' : '#10B981'}">${10 - forecastAlerts.filter(a=>a.severity==='high').length}/10</div>
              <div style="font-size:10px;color:#64748b">${forecastAlerts.length} alerts</div>
            </div>
          </div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">🚨 All Active Alerts (${db.alerts.filter(a => !a.acknowledged).length})</div>
        ${db.alerts.filter(a => !a.acknowledged).map(a => `
          <div class="cc-dd-alert-item cc-dd-alert-${a.severity}">
            <div class="cc-dd-alert-icon">${a.severity === 'high' ? '🔴' : a.severity === 'medium' ? '🟡' : '🔵'}</div>
            <div class="cc-dd-alert-content">
              <div class="cc-dd-alert-title">${a.title}</div>
              <div class="cc-dd-alert-msg">${a.message}</div>
              <div class="cc-dd-alert-time">${formatDate(a.timestamp)} · Module: ${a.module.toUpperCase()} · Source: ${a.source}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📡 Unified Event Timeline</div>
        <div class="cc-dd-timeline">
          ${db.events.map(e => `
            <div class="cc-dd-timeline-item cc-dd-timeline-${e.type}">
              <div class="cc-dd-timeline-text">${e.text}</div>
              <div class="cc-dd-timeline-time">${formatDate(e.timestamp)} · ${e.module.toUpperCase()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 6. WEATHER & ENVIRONMENTAL
  // ------------------------------------------------------------------
  function renderWeather(container) {
    const db = initDatabase();
    const weatherConditions = ['☀️ Clear', '⛅ Partly Cloudy', '☁️ Overcast', '🌧️ Rain', '⛈️ Thunderstorm', '🌫️ Fog', '🌪️ Storm'];
    const stormPorts = db.ports.filter(p => Math.random() > 0.7).slice(0, 3);

    container.innerHTML = `
      <div class="cc-dd-header">
        <h2 class="cc-dd-page-title">🌤️ Weather & Environmental Intelligence <span class="cc-dd-page-badge">REAL-TIME</span></h2>
        <div class="cc-dd-live-indicator"><div class="cc-dd-live-dot"></div> Weather data updating</div>
      </div>

      <div class="cc-dd-cards">
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Ports Monitored</div>
          <div class="cc-dd-card-value">${db.ports.length}</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">weather conditions tracked</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Active Storm Alerts</div>
          <div class="cc-dd-card-value" style="color:${stormPorts.length > 0 ? '#ef4444' : '#10B981'}">${stormPorts.length}</div>
          <div class="cc-dd-card-delta cc-dd-delta-${stormPorts.length > 0 ? 'down' : 'neutral'}">${stormPorts.length > 0 ? 'requires attention' : 'all clear'}</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">High-Risk Ports</div>
          <div class="cc-dd-card-value" style="color:#f59e0b">${Math.floor(Math.random() * 3) + 1}</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">weather-impacted operations</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Avg Visibility</div>
          <div class="cc-dd-card-value">${Math.floor(Math.random() * 3000) + 2000}m</div>
          <div class="cc-dd-card-delta cc-dd-delta-up">above minimum (500m)</div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">🌐 Port Weather Conditions — Top 10 Ports</div>
        <div class="cc-dd-scroll">
          <table class="cc-dd-table">
            <thead>
              <tr>
                <th>Port</th>
                <th>Condition</th>
                <th>Temp</th>
                <th>Wind</th>
                <th>Visibility</th>
                <th>Sea State</th>
                <th>Humidity</th>
                <th>Pressure</th>
                <th>Tide (Next)</th>
                <th>Operational Impact</th>
                <th>Climate Risk</th>
              </tr>
            </thead>
            <tbody>
              ${db.ports.map((p, i) => {
                const cond = weatherConditions[Math.floor(Math.random() * (i < 3 ? 5 : 3))];
                const temp = Math.floor(Math.random() * 25) + 10;
                const wind = Math.floor(Math.random() * 35) + 5;
                const visibility = Math.floor(Math.random() * 4000) + 1000;
                const seaState = ['Calm', 'Slight', 'Moderate', 'Rough'][Math.floor(Math.random() * 4)];
                const humidity = Math.floor(Math.random() * 40) + 50;
                const pressure = Math.floor(Math.random() * 30) + 1000;
                const tideTime = new Date(Date.now() + Math.random() * 6 * 3600000);
                const impact = wind > 25 || visibility < 1000 ? 'Suspended' : wind > 15 || visibility < 2000 ? 'Caution' : 'Normal';
                const climateRisk = Math.floor(Math.random() * 60) + 20;
                const riskColor = climateRisk > 60 ? '#ef4444' : climateRisk > 40 ? '#f59e0b' : '#10B981';
                return `
                  <tr>
                    <td style="font-weight:600;color:#06B6D4">${p.name}</td>
                    <td style="font-size:13px">${cond}</td>
                    <td style="text-align:center">${temp}°C</td>
                    <td style="text-align:center;color:${wind > 25 ? '#ef4444' : wind > 15 ? '#f59e0b' : '#e2e8f0'}">${wind} kn</td>
                    <td style="text-align:center;color:${visibility < 1000 ? '#ef4444' : visibility < 2000 ? '#f59e0b' : '#10B981'}">${visibility}m</td>
                    <td style="text-align:center;font-size:11px">${seaState}</td>
                    <td style="text-align:center">${humidity}%</td>
                    <td style="text-align:center">${pressure} hPa</td>
                    <td style="text-align:center;font-size:11px">${tideTime.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})} ${tideTime.getHours() < 12 ? '📈 High' : '📉 Low'}</td>
                    <td><span class="cc-dd-status cc-dd-status-${impact === 'Suspended' ? 'congested' : impact === 'Caution' ? 'high-capacity' : 'operational'}">${impact}</span></td>
                    <td style="text-align:center">
                      <span class="cc-dd-congestion-bar"><span class="cc-dd-congestion-fill" style="width:${climateRisk}%;background:${riskColor}"></span></span>
                      ${climateRisk}/100
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      ${stormPorts.length > 0 ? `
        <div class="cc-dd-section" style="border-color:rgba(239,68,68,0.2)">
          <div class="cc-dd-section-title">🌪️ Active Storm Tracking</div>
          ${stormPorts.map(p => {
            const stormName = ['Typhoon Khanun', 'Hurricane Lee', 'Cyclone Mocha', 'Storm Daniel'][Math.floor(Math.random() * 4)];
            const distance = Math.floor(Math.random() * 500) + 100;
            const approachSpeed = Math.floor(Math.random() * 30) + 15;
            const eta = Math.floor(distance / approachSpeed);
            return `
              <div class="cc-dd-alert-item cc-dd-alert-high">
                <div class="cc-dd-alert-icon">🌪️</div>
                <div class="cc-dd-alert-content">
                  <div class="cc-dd-alert-title">${stormName} approaching ${p.name}</div>
                  <div class="cc-dd-alert-msg">Currently ${distance}km away, moving at ${approachSpeed} km/h. ETA to ${p.name}: ~${eta} hours. Wind speeds up to ${Math.floor(Math.random() * 50) + 80} km/h expected.</div>
                  <div class="cc-dd-alert-time">Recommended actions: Secure cranes, expedite cargo ops for departing vessels, notify approaching ships to reroute.</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📅 7-Day Weather Forecast — Key Ports</div>
        <div class="cc-dd-scroll" style="max-height:300px">
          <table class="cc-dd-table">
            <thead>
              <tr>
                <th>Port</th>
                ${['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6','Day 7'].map(d => `<th style="text-align:center">${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${db.ports.slice(0, 5).map(p => `
                <tr>
                  <td style="font-weight:600">${p.name.replace('Port of ', '')}</td>
                  ${[1,2,3,4,5,6,7].map(d => {
                    const c = weatherConditions[Math.floor(Math.random() * 5)];
                    const t = Math.floor(Math.random() * 25) + 8;
                    return `<td style="text-align:center;font-size:11px"><div style="font-size:18px">${c.split(' ')[0]}</div><div style="color:#64748b">${t}°C</div></td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 7. GEOGRAPHICAL INTELLIGENCE
  // ------------------------------------------------------------------
  function renderGeo(container) {
    const db = initDatabase();
    const regions = ['Asia', 'Europe', 'Americas', 'Middle East', 'Africa', 'Oceania'];
    const regionColors = { 'Asia': '#3b82f6', 'Europe': '#10B981', 'Americas': '#f59e0b', 'Middle East': '#8b5cf6', 'Africa': '#ec4899', 'Oceania': '#06B6D4' };

    const portsByRegion = {};
    regions.forEach(r => { portsByRegion[r] = db.ports.filter(p => p.region === r || (r === 'Middle East' && p.country === 'UAE')); });
    // Fix region mapping
    portsByRegion['Asia'] = db.ports.filter(p => ['China','Singapore','South Korea'].includes(p.country));
    portsByRegion['Europe'] = db.ports.filter(p => ['Netherlands','Germany'].includes(p.country));
    portsByRegion['Americas'] = db.ports.filter(p => p.country === 'United States');

    container.innerHTML = `
      <div class="cc-dd-header">
        <h2 class="cc-dd-page-title">🗺️ Geographical Intelligence <span class="cc-dd-page-badge">GLOBAL VIEW</span></h2>
        <div class="cc-dd-live-indicator"><div class="cc-dd-live-dot"></div> Live geo-tracking</div>
      </div>

      <div class="cc-dd-cards">
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Regions Monitored</div>
          <div class="cc-dd-card-value">${regions.length}</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">global coverage</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Active Trade Routes</div>
          <div class="cc-dd-card-value">${db.ports.length * 2}</div>
          <div class="cc-dd-card-delta cc-dd-delta-up">major shipping lanes</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">High-Risk Zones</div>
          <div class="cc-dd-card-value" style="color:#f59e0b">${Math.floor(Math.random() * 3) + 2}</div>
          <div class="cc-dd-card-delta cc-dd-delta-down">geopolitical + weather risks</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Avg Transit Time</div>
          <div class="cc-dd-card-value">${Math.floor(Math.random() * 10) + 18}d</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">major routes</div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">🌍 Regional Port Distribution</div>
        <div class="cc-dd-donut-row">
          ${renderDonut(
            Object.fromEntries(Object.entries(portsByRegion).map(([r, ports]) => [r, ports.length])),
            regions.map(r => regionColors[r]),
            db.ports.length,
            'Ports'
          )}
          <div class="cc-dd-legend">
            ${regions.map(r => {
              const count = portsByRegion[r] ? portsByRegion[r].length : 0;
              const ports = portsByRegion[r] || [];
              return `
                <div class="cc-dd-legend-item">
                  <div class="cc-dd-legend-dot" style="background:${regionColors[r]}"></div>
                  <div class="cc-dd-legend-label">${r}</div>
                  <div class="cc-dd-legend-value">${count} ports · ${ports.reduce((s,p) => s + p.vessels_in_port, 0)} vessels</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">🗺️ World Map — Port Locations & Congestion (SVG)</div>
        <div style="position:relative;background:linear-gradient(135deg,#0c1320,#101e35);border-radius:8px;padding:20px;overflow:hidden">
          <svg viewBox="0 0 800 400" style="width:100%;height:auto;display:block">
            <!-- Simplified world map background -->
            <rect width="800" height="400" fill="rgba(6,182,212,0.02)"/>
            <!-- Continents (simplified shapes) -->
            <path d="M120,80 Q200,60 280,90 L290,180 Q230,200 180,190 L130,160 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <path d="M300,60 Q400,50 500,80 L520,200 Q450,220 380,200 L320,150 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <path d="M520,100 Q620,90 700,120 L710,250 Q650,270 580,250 L540,180 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <path d="M180,220 Q260,210 320,240 L330,340 Q270,360 220,340 L170,290 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <path d="M400,250 Q460,240 500,270 L490,360 Q440,370 410,350 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <path d="M620,280 Q680,270 710,300 L700,370 Q660,380 630,360 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

            <!-- Trade routes (dashed lines) -->
            <line x1="580" y1="180" x2="400" y2="150" stroke="rgba(6,182,212,0.2)" stroke-width="1" stroke-dasharray="4,4"/>
            <line x1="400" y1="150" x2="240" y2="160" stroke="rgba(6,182,212,0.2)" stroke-width="1" stroke-dasharray="4,4"/>
            <line x1="580" y1="180" x2="240" y2="160" stroke="rgba(6,182,212,0.15)" stroke-width="1" stroke-dasharray="4,4"/>
            <line x1="580" y1="180" x2="160" y2="140" stroke="rgba(6,182,212,0.1)" stroke-width="1" stroke-dasharray="4,4"/>

            <!-- Port dots -->
            ${db.ports.map(p => {
              // Map lat/lng to SVG coordinates (simplified projection)
              const x = ((p.lng + 180) / 360) * 800;
              const y = ((90 - p.lat) / 180) * 400;
              const color = p.congestion_level === 'high' ? '#ef4444' : p.congestion_level === 'medium' ? '#f59e0b' : '#10B981';
              const radius = 4 + (p.vessels_in_port / 15);
              return `
                <circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="0.9">
                  <animate attributeName="r" values="${radius};${radius * 1.5};${radius}" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${color}" stroke-width="1" opacity="0.3">
                  <animate attributeName="r" values="${radius};${radius * 2.5}" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.3;0" dur="2s" repeatCount="indefinite"/>
                </circle>
                <text x="${x + 8}" y="${y + 4}" fill="rgba(255,255,255,0.5)" font-size="9" font-family="sans-serif">${p.name.replace('Port of ', '').split(' ')[0]}</text>
              `;
            }).join('')}
          </svg>
          <div style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:10px;height:10px;border-radius:50%;background:#10B981"></div> Low congestion</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:10px;height:10px;border-radius:50%;background:#f59e0b"></div> Medium congestion</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:10px;height:10px;border-radius:50%;background:#ef4444"></div> High congestion</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:20px;height:1px;background:rgba(6,182,212,0.4);border-top:1px dashed rgba(6,182,212,0.4)"></div> Trade route</div>
          </div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📏 Port-to-Port Distance & Transit Calculator</div>
        <div class="cc-dd-scroll">
          <table class="cc-dd-table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Distance (nm)</th>
                <th>Avg Speed (kn)</th>
                <th>Transit Time</th>
                <th>Fuel Est.</th>
                <th>CO₂ Est.</th>
                <th>Route Status</th>
              </tr>
            </thead>
            <tbody>
              ${[
                ['Shanghai','Singapore'],['Shanghai','Los Angeles'],['Singapore','Rotterdam'],
                ['Rotterdam','Los Angeles'],['Busan','Hamburg'],['Shenzhen','Dubai'],
                ['Singapore','Los Angeles'],['Ningbo-Zhoushan','Rotterdam']
              ].map((route, i) => {
                const from = db.ports.find(p => p.name.includes(route[0]));
                const to = db.ports.find(p => p.name.includes(route[1]));
                if (!from || !to) return '';
                const dist = Math.floor(Math.random() * 10000) + 2000;
                const speed = Math.floor(Math.random() * 5) + 18;
                const days = Math.round(dist / speed / 24);
                const fuel = Math.floor(dist * 0.8);
                const co2 = Math.floor(fuel * 3.1);
                const status = ['Operational','Operational','Caution','Operational','Disrupted','Operational'][i % 6];
                return `
                  <tr>
                    <td style="font-weight:600;color:#06B6D4">${route[0]}</td>
                    <td style="font-weight:600;color:#06B6D4">${route[1]}</td>
                    <td style="text-align:right">${dist.toLocaleString()} nm</td>
                    <td style="text-align:center">${speed} kn</td>
                    <td style="text-align:center;font-weight:600">${days} days</td>
                    <td style="text-align:right">${fuel.toLocaleString()} L</td>
                    <td style="text-align:right;color:#f59e0b">${co2.toLocaleString()} kg</td>
                    <td><span class="cc-dd-status cc-dd-status-${status === 'Disrupted' ? 'congested' : status === 'Caution' ? 'high-capacity' : 'operational'}">${status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">⚠️ Regional Risk Assessment</div>
        <div class="cc-dd-bars">
          ${regions.map(r => {
            const risk = Math.floor(Math.random() * 60) + 20;
            const color = risk > 60 ? '#ef4444' : risk > 40 ? '#f59e0b' : '#10B981';
            return `
              <div class="cc-dd-bar-wrap">
                <div class="cc-dd-bar-value">${risk}</div>
                <div class="cc-dd-bar" style="height:${risk}%;background:${color}">
                  <div class="cc-dd-bar-tooltip">${r}: Risk score ${risk}/100</div>
                </div>
                <div class="cc-dd-bar-label" style="max-width:60px;font-size:8px">${r}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 8. VESSEL DEPARTURE PREDICTIONS
  // ------------------------------------------------------------------
  function renderDepartures(container) {
    const db = initDatabase();
    const vessels = db.vessels.filter(v => v.status === 'berthed' || v.status === 'anchored').slice(0, 20);

    container.innerHTML = `
      <div class="cc-dd-header">
        <h2 class="cc-dd-page-title">🚢 Vessel Departure Predictions <span class="cc-dd-page-badge">AI POWERED</span></h2>
        <div class="cc-dd-live-indicator"><div class="cc-dd-live-dot"></div> ML predictions active</div>
      </div>

      <div class="cc-dd-cards">
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Vessels Awaiting Departure</div>
          <div class="cc-dd-card-value">${vessels.length}</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">berthed + anchored</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">On-Time Departures</div>
          <div class="cc-dd-card-value" style="color:#10B981">${Math.floor(vessels.length * 0.65)}</div>
          <div class="cc-dd-card-delta cc-dd-delta-up">65% predicted on-time</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Delayed Departures</div>
          <div class="cc-dd-card-value" style="color:#f59e0b">${Math.floor(vessels.length * 0.25)}</div>
          <div class="cc-dd-card-delta cc-dd-delta-down">25% predicted delayed</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">High-Risk Delays</div>
          <div class="cc-dd-card-value" style="color:#ef4444">${Math.floor(vessels.length * 0.1)}</div>
          <div class="cc-dd-card-delta cc-dd-delta-down">10% critical risk</div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📅 Departure Timeline — Next 72 Hours</div>
        <div style="position:relative;background:rgba(255,255,255,0.02);border-radius:8px;padding:16px;overflow-x:auto">
          <div style="display:flex;gap:4px;min-width:800px">
            ${[0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72].map(h => `
              <div style="flex:1;text-align:center;font-size:10px;color:#64748b;padding:4px 0;border-left:1px solid rgba(255,255,255,0.04)">${h}h</div>
            `).join('')}
          </div>
          ${vessels.slice(0, 12).map((v, i) => {
            const departureHour = Math.floor(Math.random() * 60) + 6;
            const delayProb = Math.floor(Math.random() * 80) + 10;
            const color = delayProb > 50 ? '#ef4444' : delayProb > 25 ? '#f59e0b' : '#10B981';
            const width = (departureHour / 72) * 100;
            return `
              <div style="display:flex;align-items:center;gap:8px;margin-top:6px;min-width:800px">
                <div style="width:120px;font-size:11px;color:#cbd5e1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${v.name}</div>
                <div style="flex:1;position:relative;height:20px;background:rgba(255,255,255,0.03);border-radius:4px">
                  <div style="position:absolute;left:0;top:2px;height:16px;width:${width}%;background:${color};border-radius:4px;opacity:0.7" title="Predicted departure: +${departureHour}h"></div>
                  <div style="position:absolute;left:${width}%;top:0;height:20px;width:2px;background:${color}" title="Departure"></div>
                </div>
                <div style="width:50px;font-size:10px;color:${color};font-weight:600;text-align:right">${delayProb}%</div>
              </div>
            `;
          }).join('')}
          <div style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:12px;height:12px;border-radius:3px;background:#10B981;opacity:0.7"></div> Low delay risk (<25%)</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:12px;height:12px;border-radius:3px;background:#f59e0b;opacity:0.7"></div> Medium delay risk (25-50%)</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8"><div style="width:12px;height:12px;border-radius:3px;background:#ef4444;opacity:0.7"></div> High delay risk (>50%)</div>
          </div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📋 Departure Predictions Detail</div>
        <div class="cc-dd-scroll">
          <table class="cc-dd-table">
            <thead>
              <tr>
                <th>Vessel</th>
                <th>Port</th>
                <th>Current Status</th>
                <th>Scheduled Departure</th>
                <th>AI Predicted Departure</th>
                <th>Delay Probability</th>
                <th>Likely Delay Cause</th>
                <th>Cargo Ops</th>
                <th>Customs</th>
                <th>Tide Window</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              ${vessels.slice(0, 15).map(v => {
                const scheduledH = Math.floor(Math.random() * 48) + 2;
                const predictedH = scheduledH + Math.floor(Math.random() * 12);
                const delayProb = Math.floor(Math.random() * 80) + 10;
                const causes = ['Cargo ops ongoing','Customs inspection','Tide window','Weather delay','Pilot unavailable','Port congestion'];
                const cause = causes[Math.floor(Math.random() * causes.length)];
                const cargoPct = Math.floor(Math.random() * 40) + 50;
                const customs = ['Cleared','Pending','Inspection'][Math.floor(Math.random() * 3)];
                const tideWindow = new Date(Date.now() + Math.random() * 12 * 3600000).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'});
                const rec = delayProb > 50 ? 'Expedite ops' : delayProb > 25 ? 'Monitor' : 'On schedule';
                return `
                  <tr>
                    <td style="font-weight:600">${v.name}</td>
                    <td style="font-size:11px">${v.port_name.replace('Port of ', '')}</td>
                    <td><span class="cc-dd-status cc-dd-status-${v.status === 'berthed' ? 'operational' : 'high-capacity'}" style="font-size:9px">${v.status}</span></td>
                    <td style="text-align:center;font-size:11px">+${scheduledH}h</td>
                    <td style="text-align:center;font-size:11px;color:${predictedH > scheduledH + 4 ? '#ef4444' : '#f59e0b'};font-weight:600">+${predictedH}h</td>
                    <td style="text-align:center">
                      <span class="cc-dd-congestion-bar"><span class="cc-dd-congestion-fill" style="width:${delayProb}%;background:${delayProb > 50 ? '#ef4444' : delayProb > 25 ? '#f59e0b' : '#10B981'}"></span></span>
                      ${delayProb}%
                    </td>
                    <td style="font-size:11px">${cause}</td>
                    <td style="text-align:center">${cargoPct}%</td>
                    <td style="text-align:center"><span class="cc-dd-status cc-dd-status-${customs === 'Cleared' ? 'operational' : customs === 'Pending' ? 'high-capacity' : 'congested'}" style="font-size:9px">${customs}</span></td>
                    <td style="text-align:center;font-size:11px">${tideWindow}</td>
                    <td style="font-size:11px;color:${delayProb > 50 ? '#ef4444' : delayProb > 25 ? '#f59e0b' : '#10B981'};font-weight:600">${rec}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">🔄 Cascading Delay Impact Analysis</div>
        <div class="cc-dd-info-banner" style="display:flex;gap:12px;padding:12px 16px;border-radius:8px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);margin-bottom:12px;font-size:12px;color:#67e8f9">
          <div style="font-size:16px">💡</div>
          <div>When a vessel departs late, it impacts downstream operations: the destination berth may be occupied, the next vessel's arrival is delayed, and warehouse receiving must be rescheduled. This AI model predicts cascading impacts.</div>
        </div>
        <div class="cc-dd-scroll">
          <table class="cc-dd-table">
            <thead>
              <tr>
                <th>Delayed Vessel</th>
                <th>Delay (hours)</th>
                <th>Destination Port</th>
                <th>Downstream Vessel Affected</th>
                <th>Berth Conflict</th>
                <th>Warehouse Impact</th>
                <th>Customer Impact</th>
                <th>Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              ${vessels.slice(0, 8).map((v, i) => {
                const delay = Math.floor(Math.random() * 24) + 4;
                const destPort = db.ports[Math.floor(Math.random() * db.ports.length)];
                const affectedVessel = VESSEL_NAMES[(i + 3) % VESSEL_NAMES.length];
                const berthConflict = Math.random() > 0.5;
                const warehouseImpact = `${Math.floor(Math.random() * 50) + 10} containers delayed`;
                const customerImpact = `${Math.floor(Math.random() * 8) + 2} customers affected`;
                const cost = Math.floor(Math.random() * 50000) + 10000;
                return `
                  <tr>
                    <td style="font-weight:600">${v.name}</td>
                    <td style="text-align:center;color:${delay > 12 ? '#ef4444' : '#f59e0b'};font-weight:700">+${delay}h</td>
                    <td style="font-size:11px">${destPort.name.replace('Port of ', '')}</td>
                    <td style="font-size:11px">${affectedVessel}</td>
                    <td style="text-align:center">${berthConflict ? '⚠️ Yes' : '✅ No'}</td>
                    <td style="font-size:11px">${warehouseImpact}</td>
                    <td style="font-size:11px;color:${customerImpact.startsWith('0') ? '#10B981' : '#f59e0b'}">${customerImpact}</td>
                    <td style="text-align:right;color:#ef4444;font-weight:600">${formatCurrency(cost)}</td>
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
  // 9. AI AUTOMATION LAYER
  // ------------------------------------------------------------------
  function renderAutomation(container) {
    const db = initDatabase();
    const automations = [
      { id: 'auto1', name: 'Vessel Rerouting', trigger: 'Port congestion > 85%', action: 'Suggest alternative port', status: 'monitoring', executions: 12, savings: 340000, confidence: 80, autoExecute: true },
      { id: 'auto2', name: 'Inventory Reorder', trigger: 'AI predicts stockout < 7 days', action: 'Auto-generate purchase order', status: 'executed', executions: 28, savings: 125000, confidence: 90, autoExecute: true },
      { id: 'auto3', name: 'Berth Allocation', trigger: 'Vessel arriving + berth available', action: 'Auto-assign optimal berth', status: 'executed', executions: 45, savings: 89000, confidence: 95, autoExecute: true },
      { id: 'auto4', name: 'Weather Proactive Action', trigger: 'Storm predicted < 48h', action: 'Notify vessels + secure port', status: 'monitoring', executions: 6, savings: 560000, confidence: 85, autoExecute: true },
      { id: 'auto5', name: 'Demurrage Alert', trigger: 'Container free time < 24h', action: 'Auto-generate pickup request', status: 'executed', executions: 18, savings: 78000, confidence: 88, autoExecute: true },
      { id: 'auto6', name: 'Pick Path Optimization', trigger: 'New pick batch created', action: 'Optimize picker routes', status: 'executed', executions: 156, savings: 210000, confidence: 92, autoExecute: true },
      { id: 'auto7', name: 'Inventory Rebalancing', trigger: 'Warehouse utilization > 85%', action: 'Redistribute to available warehouse', status: 'monitoring', executions: 9, savings: 95000, confidence: 75, autoExecute: false },
      { id: 'auto8', name: 'Daily Operations Report', trigger: 'Daily at 08:00 UTC', action: 'Auto-generate and distribute report', status: 'executed', executions: 30, savings: 45000, confidence: 100, autoExecute: true },
      { id: 'auto9', name: 'Customs Documentation', trigger: 'Shipment ready for export', action: 'Auto-generate customs docs', status: 'executed', executions: 89, savings: 167000, confidence: 93, autoExecute: true },
      { id: 'auto10', name: 'Critical Alert Escalation', trigger: 'Alert severity = high', action: 'Escalate to procurement officer', status: 'monitoring', executions: 14, savings: 0, confidence: 100, autoExecute: true }
    ];
    const totalSavings = automations.reduce((s, a) => s + a.savings, 0);
    const totalExecutions = automations.reduce((s, a) => s + a.executions, 0);
    const monitoringCount = automations.filter(a => a.status === 'monitoring').length;
    const executedCount = automations.filter(a => a.status === 'executed').length;

    container.innerHTML = `
      <div class="cc-dd-header">
        <h2 class="cc-dd-page-title">⚙️ AI Automation Engine <span class="cc-dd-page-badge">AUTONOMOUS</span></h2>
        <div class="cc-dd-live-indicator"><div class="cc-dd-live-dot"></div> ${monitoringCount} rules monitoring</div>
      </div>

      <div class="cc-dd-cards">
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Active Automations</div>
          <div class="cc-dd-card-value">${automations.length}</div>
          <div class="cc-dd-card-delta cc-dd-delta-up">${monitoringCount} monitoring · ${executedCount} executed</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Total Executions</div>
          <div class="cc-dd-card-value">${totalExecutions}</div>
          <div class="cc-dd-card-delta cc-dd-delta-up">all-time</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Total Savings</div>
          <div class="cc-dd-card-value" style="color:#10B981">${formatCurrency(totalSavings)}</div>
          <div class="cc-dd-card-delta cc-dd-delta-up">estimated value generated</div>
        </div>
        <div class="cc-dd-card">
          <div class="cc-dd-card-label">Avg Confidence</div>
          <div class="cc-dd-card-value">${Math.round(automations.reduce((s,a) => s + a.confidence, 0) / automations.length)}%</div>
          <div class="cc-dd-card-delta cc-dd-delta-neutral">AI prediction confidence</div>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">⚙️ Automation Rules Engine</div>
        <div class="cc-dd-info-banner" style="display:flex;gap:12px;padding:12px 16px;border-radius:8px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);margin-bottom:12px;font-size:12px;color:#67e8f9">
          <div style="font-size:16px">💡</div>
          <div>Automation Workflow: <strong>Observe</strong> (detect condition) → <strong>Analyze</strong> (AI evaluates) → <strong>Recommend</strong> (suggest action) → <strong>Execute</strong> (auto if confidence > threshold) → <strong>Monitor</strong> (track outcome)</div>
        </div>
        <div class="cc-dd-scroll">
          <table class="cc-dd-table">
            <thead>
              <tr>
                <th>Automation</th>
                <th>Trigger Condition</th>
                <th>Action</th>
                <th>Status</th>
                <th>Executions</th>
                <th>Confidence</th>
                <th>Auto-Execute</th>
                <th>Est. Savings</th>
              </tr>
            </thead>
            <tbody>
              ${automations.map(a => `
                <tr>
                  <td style="font-weight:600;color:#06B6D4">${a.name}</td>
                  <td style="font-size:11px">${a.trigger}</td>
                  <td style="font-size:11px">${a.action}</td>
                  <td><span class="cc-dd-status cc-dd-status-${a.status === 'executed' ? 'operational' : 'high-capacity'}">${a.status}</span></td>
                  <td style="text-align:center">${a.executions}</td>
                  <td style="text-align:center">
                    <span class="cc-dd-congestion-bar"><span class="cc-dd-congestion-fill" style="width:${a.confidence}%;background:${a.confidence > 85 ? '#10B981' : a.confidence > 70 ? '#f59e0b' : '#ef4444'}"></span></span>
                    ${a.confidence}%
                  </td>
                  <td style="text-align:center">${a.autoExecute ? '✅ Yes' : '❌ Manual'}</td>
                  <td style="text-align:right;color:#10B981;font-weight:600">${a.savings > 0 ? formatCurrency(a.savings) : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📊 Savings by Automation</div>
        <div class="cc-dd-bars">
          ${automations.filter(a => a.savings > 0).sort((a, b) => b.savings - a.savings).map(a => {
            const maxSavings = Math.max(...automations.map(x => x.savings));
            const pct = (a.savings / maxSavings) * 100;
            return `
              <div class="cc-dd-bar-wrap">
                <div class="cc-dd-bar-value" style="font-size:10px">${formatCurrency(a.savings)}</div>
                <div class="cc-dd-bar" style="height:${pct}%;background:linear-gradient(180deg,#10B981,#06B6D4)">
                  <div class="cc-dd-bar-tooltip">${a.name}: ${formatCurrency(a.savings)} (${a.executions} executions)</div>
                </div>
                <div class="cc-dd-bar-label" style="max-width:60px;font-size:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.name.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="cc-dd-section">
        <div class="cc-dd-section-title">📜 Recent Automation Executions</div>
        <div class="cc-dd-timeline">
          ${automations.slice(0, 8).map((a, i) => `
            <div class="cc-dd-timeline-item cc-dd-timeline-${a.status === 'executed' ? 'success' : 'info'}">
              <div class="cc-dd-timeline-text"><strong>${a.name}</strong> — ${a.action} (confidence: ${a.confidence}%)</div>
              <div class="cc-dd-timeline-time">${formatDate(new Date(Date.now() - i * Math.random() * 3600000).toISOString())} · ${a.status.toUpperCase()} · Savings: ${a.savings > 0 ? formatCurrency(a.savings) : 'N/A'}</div>
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
      return `<div class="cc-dd-donut" style="background:#1e293b"><div class="cc-dd-donut-center"><div class="cc-dd-donut-center-value">0</div><div class="cc-dd-donut-center-label">${centerLabel}</div></div></div>`;
    }
    let gradientParts = [];
    let cumulative = 0;
    const colorMap = {};
    if (Array.isArray(colors)) {
      entries.forEach(([key, _], i) => { colorMap[key] = colors[i % colors.length]; });
    } else {
      Object.assign(colorMap, colors);
    }
    entries.forEach(([key, count]) => {
      const pct = (count / total) * 100;
      const color = colorMap[key] || '#64748b';
      gradientParts.push(`${color} ${cumulative}% ${cumulative + pct}%`);
      cumulative += pct;
    });
    return `<div class="cc-dd-donut" style="background:conic-gradient(${gradientParts.join(', ')})">
      <div class="cc-dd-donut-center" style="background:#0a0e1a;width:80px;height:80px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div class="cc-dd-donut-center-value">${total}</div>
        <div class="cc-dd-donut-center-label">${centerLabel}</div>
      </div>
    </div>`;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-dd-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-dd-overlay');
    if (overlay) overlay.remove();
  }

  function setView(view) {
    currentView = view;
    // Update sidebar
    document.querySelectorAll('.cc-dd-nav-item').forEach(item => {
      const icon = item.querySelector('.cc-dd-nav-icon');
      if (!icon) return;
      const text = item.textContent.toLowerCase();
      item.classList.toggle('active', text.indexOf(view) !== -1);
    });
    renderContent();
  }

  function filterVessels(filter) {
    document.querySelectorAll('.cc-dd-tab').forEach(t => t.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    renderVesselsTable(filter);
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    window.__ccDD = { open, close, setView, filterVessels, showBerthGantt, updatePickPath };

    function injectButton() {
      if (document.getElementById('cc-dd-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-dd-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 200px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #06B6D4, #3b82f6)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Dispatch';
      btn.setAttribute('aria-label', 'Open global dispatch dashboard');
      btn.onclick = open;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(6, 182, 212, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(6, 182, 212, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-dd-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-dd-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 3000); });
    } else {
      setTimeout(tryInject, 3000);
    }

    // Keyboard shortcut: press "D" to open dispatch dashboard
    document.addEventListener('keydown', function(e) {
      if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-dd-overlay')) { open(); e.preventDefault(); }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
