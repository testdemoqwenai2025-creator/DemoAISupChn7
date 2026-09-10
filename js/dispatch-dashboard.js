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
    else if (currentView === 'tower') renderTower(container);

    // Update sidebar active states
    document.querySelectorAll('.cc-dd-nav-item').forEach(item => {
      item.classList.toggle('active', item.textContent.trim().toLowerCase().indexOf(currentView) !== -1);
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
    `;

    renderVesselsTable('all');
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
    window.__ccDD = { open, close, setView, filterVessels };

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
