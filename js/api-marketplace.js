// ====================================================================
// api-marketplace.js — Integration Catalog & API Marketplace
// ====================================================================
// Developer integration hub with:
//   1. API categories: Ports, WMS, TMS, Weather, Geopolitical, Financial, Customs
//   2. Each API: name, provider, status (connected/available/coming-soon), description, endpoint
//   3. Integration status indicators (connected/available/coming-soon)
//   4. Developer documentation preview
//   5. Connection count summary
//   6. Filter tabs: All / Connected / Available / Coming Soon
//
// Architecture: reuses IIFE + modal + table + chart patterns from dispatch-dashboard.js
// Data: synthetic, persisted to localStorage
// ====================================================================
(function() {
  'use strict';

  if (window.__apiMarketplaceLoaded) return;
  window.__apiMarketplaceLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_api_marketplace_db_v1';

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(a) {
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'k';
    return '$' + a.toFixed(0);
  }

  // ------------------------------------------------------------------
  // STATIC API CATALOG
  // ------------------------------------------------------------------
  const API_CATALOG = [
    // Ports
    { id: 'api01', category: 'Ports', name: 'MarineTraffic Vessel Tracking', provider: 'MarineTraffic', status: 'connected', description: 'Real-time vessel positions, port calls, and ETA predictions for 100k+ vessels worldwide.', endpoint: '/api/v1/vessels/positions', auth: 'API Key', requests: '12500/day', latency: '120ms', icon: '🚢', docs: 'Full REST API with WebSocket streaming. Returns AIS data with 60s refresh rate.' },
    { id: 'api02', category: 'Ports', name: 'PortWatch Congestion Index', provider: 'IMF', status: 'connected', description: 'Port congestion indices and waiting time analytics for top 500 global ports.', endpoint: '/api/v1/ports/congestion', auth: 'OAuth 2.0', requests: '5000/day', latency: '350ms', icon: '⚓', docs: 'Daily aggregated port congestion data with 7-day forecast horizon.' },
    { id: 'api03', category: 'Ports', name: 'S&P Global Port Calls', provider: 'S&P Global', status: 'available', description: 'Historical and scheduled port call data with vessel and cargo details.', endpoint: '/api/v2/portcalls', auth: 'API Key', requests: '10000/day', latency: '280ms', icon: '🛳️', docs: 'Comprehensive port call database with 5-year history. Bulk export available.' },

    // WMS
    { id: 'api04', category: 'WMS', name: 'SAP EWM Connector', provider: 'SAP', status: 'connected', description: 'Extended Warehouse Management integration for real-time inventory and pick/pack operations.', endpoint: '/api/wms/operations', auth: 'OAuth 2.0', requests: '50000/day', latency: '85ms', icon: '🏭', docs: 'Native SAP EWM connector supporting inbound, outbound, and stock movements.' },
    { id: 'api05', category: 'WMS', name: 'Manhattan Active WM', provider: 'Manhattan Associates', status: 'connected', description: 'Cloud-native WMS integration with slotting optimization and labor management.', endpoint: '/api/mawm/sync', auth: 'OAuth 2.0', requests: '30000/day', latency: '95ms', icon: '📦', docs: 'Bi-directional sync with Manhattan Active WM. Supports wave planning and slotting.' },
    { id: 'api06', category: 'WMS', name: 'Oracle WMS Cloud', provider: 'Oracle', status: 'available', description: 'Oracle Warehouse Management Cloud integration with cycle counting and RF scanning.', endpoint: '/api/wmscloud/v3', auth: 'JWT', requests: '20000/day', latency: '110ms', icon: '🏗️', docs: 'REST API for Oracle WMS Cloud. Supports cycle counts, receipts, and picks.' },

    // TMS
    { id: 'api07', category: 'TMS', name: 'Project44 Multi-Modal', provider: 'project44', status: 'connected', description: 'Multi-modal shipment tracking across ocean, air, rail, and road carriers.', endpoint: '/api/v3/shipments/track', auth: 'API Key', requests: '100000/day', latency: '150ms', icon: '🚛', docs: 'Unified tracking API covering 200+ carriers. Real-time webhook callbacks available.' },
    { id: 'api08', category: 'TMS', name: 'FourKites ETA Engine', provider: 'FourKites', status: 'connected', description: 'ML-powered ETA predictions for over-the-road and ocean shipments.', endpoint: '/api/v2/eta/predict', auth: 'OAuth 2.0', requests: '25000/day', latency: '200ms', icon: '📍', docs: 'Predictive ETA engine with 92% accuracy at 24h horizon. Provides confidence intervals.' },
    { id: 'api09', category: 'TMS', name: 'Samsara Fleet Tracking', provider: 'Samsara', status: 'available', description: 'IoT-based fleet tracking with vehicle telemetry, driver behavior, and fuel monitoring.', endpoint: '/api/fleet/vehicles', auth: 'API Key', requests: '40000/day', latency: '90ms', icon: '🚚', docs: 'Real-time fleet telemetry with dashcam integration and driver safety scoring.' },

    // Weather
    { id: 'api10', category: 'Weather', name: 'OpenWeather Marine', provider: 'OpenWeather', status: 'connected', description: 'Marine weather forecasts including wave height, wind speed, and storm warnings.', endpoint: '/api/marine/forecast', auth: 'API Key', requests: '60000/day', latency: '60ms', icon: '🌤️', docs: '7-day marine forecasts with 3-hour granularity. Storm alerts via webhook.' },
    { id: 'api11', category: 'Weather', name: 'StormGeo Route Optimizer', provider: 'StormGeo', status: 'available', description: 'Vessel route optimization based on weather conditions and fuel consumption models.', endpoint: '/api/route/optimize', auth: 'OAuth 2.0', requests: '5000/day', latency: '450ms', icon: '🌊', docs: 'AI-powered route optimization reducing fuel consumption by 5-12% per voyage.' },
    { id: 'api12', category: 'Weather', name: 'NOAA Severe Weather', provider: 'NOAA', status: 'connected', description: 'Severe weather alerts including hurricanes, typhoons, and winter storms.', endpoint: '/api/noaa/alerts', auth: 'None', requests: '100000/day', latency: '40ms', icon: '⛈️', docs: 'Free public API for severe weather alerts. Polygon-based geographic filtering.' },

    // Geopolitical
    { id: 'api13', category: 'Geopolitical', name: 'RiskLayer Country Risk', provider: 'RiskLayer', status: 'connected', description: 'Real-time country risk scores covering political, economic, and security dimensions.', endpoint: '/api/v2/countries/risk', auth: 'API Key', requests: '8000/day', latency: '180ms', icon: '🗺️', docs: 'Daily-updated country risk scores with 12-month outlook. Sub-national risk data.' },
    { id: 'api14', category: 'Geopolitical', name: 'Everstream Trade Sanctions', provider: 'Everstream', status: 'connected', description: 'Trade sanctions screening and restricted party list checks across 200+ jurisdictions.', endpoint: '/api/sanctions/screen', auth: 'OAuth 2.0', requests: '15000/day', latency: '220ms', icon: '🛡️', docs: 'Real-time sanctions screening against OFAC, EU, UN, and country-specific lists.' },
    { id: 'api15', category: 'Geopolitical', name: 'GPSovereign Conflict Map', provider: 'GPSovereign', status: 'coming-soon', description: 'Live conflict mapping with supply chain impact assessment. Expected Q2 2026.', endpoint: '/api/conflicts/map', auth: 'OAuth 2.0', requests: '5000/day', latency: '300ms', icon: '⚡', docs: 'Coming Q2 2026. Beta access available for enterprise customers.' },

    // Financial
    { id: 'api16', category: 'Financial', name: 'FXRate Live Currency', provider: 'FXRate', status: 'connected', description: 'Real-time foreign exchange rates for 168 currencies with historical data.', endpoint: '/api/v1/fx/latest', auth: 'API Key', requests: '100000/day', latency: '50ms', icon: '💱', docs: 'Real-time FX rates updated every 60s. Historical data going back 20 years.' },
    { id: 'api17', category: 'Financial', name: 'CommodityDesk Prices', provider: 'CommodityDesk', status: 'connected', description: 'Live commodity prices for oil, steel, copper, lithium, and 50+ other commodities.', endpoint: '/api/commodities/spot', auth: 'API Key', requests: '20000/day', latency: '110ms', icon: '🛢️', docs: 'Spot and futures prices for major commodities. Exchange-quality data feed.' },
    { id: 'api18', category: 'Financial', name: 'TradeFinance Blockchain', provider: 'We.Trade', status: 'coming-soon', description: 'Blockchain-based trade finance with smart contract letters of credit. Expected Q3 2026.', endpoint: '/api/tf/letters', auth: 'OAuth 2.0', requests: '5000/day', latency: '500ms', icon: '⛓️', docs: 'Coming Q3 2026. Pilot program with 8 major banks. Smart contract automation.' },

    // Customs
    { id: 'api19', category: 'Customs', name: 'Descartes Customs Filings', provider: 'Descartes', status: 'connected', description: 'Automated customs filings for 60+ countries with HS code classification.', endpoint: '/api/customs/file', auth: 'OAuth 2.0', requests: '30000/day', latency: '250ms', icon: '🛃', docs: 'Single API for multi-country customs filings. Automated HS code suggestion engine.' },
    { id: 'api20', category: 'Customs', name: 'ACE/AES US Filing', provider: 'CBP', status: 'connected', description: 'US Automated Commercial Environment and AES filing for imports and exports.', endpoint: '/api/ace/file', auth: 'OAuth 2.0', requests: '15000/day', latency: '320ms', icon: '🇺🇸', docs: 'Direct integration with US CBP ACE system. Real-time filing status callbacks.' },
    { id: 'api21', category: 'Customs', name: 'EU ICS2 Filing', provider: 'EU Commission', status: 'available', description: 'EU Import Control System 2 pre-arrival filing for all modes of transport.', endpoint: '/api/ics2/file', auth: 'OAuth 2.0', requests: '10000/day', latency: '290ms', icon: '🇪🇺', docs: 'EU ICS2 compliance for air, sea, and road. Pre-arrival security filing automation.' }
  ];

  // ------------------------------------------------------------------
  // DATABASE INITIALIZATION
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.apis && db.apis.length > 0) return db;

    db = {
      apis: API_CATALOG.map(a => ({
        ...a,
        connected_at: a.status === 'connected' ? new Date(Date.now() - Math.random() * 365 * 86400000).toISOString() : null,
        last_call: a.status === 'connected' ? new Date(Date.now() - Math.random() * 3600000).toISOString() : null,
        uptime_30d: a.status === 'connected' ? Math.round((95 + Math.random() * 5) * 100) / 100 : null,
        success_rate: a.status === 'connected' ? Math.round((96 + Math.random() * 4) * 100) / 100 : null
      })),
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
  let currentTab = 'all';
  let currentSearch = '';

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-am-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-am-styles';
    style.textContent = `
      .cc-am-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10014; background: rgba(8,10,16,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-am-sidebar { width: 220px; flex-shrink: 0; background: rgba(15,23,42,0.6); border-right: 1px solid rgba(255,255,255,0.06); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-am-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; }
      .cc-am-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
      .cc-am-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-am-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; text-decoration: none; font-family: inherit; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; }
      .cc-am-nav-item:hover { background: rgba(255,255,255,0.03); color: #e2e8f0; }
      .cc-am-nav-item.active { background: rgba(20,184,166,0.08); color: #14b8a6; border-left-color: #14b8a6; }
      .cc-am-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-am-nav-badge { margin-left: auto; font-size: 9px; padding: 1px 6px; border-radius: 8px; background: rgba(20,184,166,0.2); color: #14b8a6; font-weight: 700; }
      .cc-am-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-am-close { position: fixed; top: 16px; right: 20px; z-index: 10015; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-am-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-am-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 12px; }
      .cc-am-page-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-am-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #14b8a6, #06B6D4); color: #fff; font-weight: 600; letter-spacing: 0.03em; }
      .cc-am-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #14b8a6; font-weight: 600; }
      .cc-am-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #14b8a6; animation: cc-am-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-am-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-am-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-am-card { background: rgba(20,184,166,0.04); border: 1px solid rgba(20,184,166,0.15); border-radius: 10px; padding: 16px; }
      .cc-am-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
      .cc-am-card-value { font-size: 24px; font-weight: 800; color: #fff; }
      .cc-am-card-delta { font-size: 11px; margin-top: 4px; color: #64748b; }
      .cc-am-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
      .cc-am-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-am-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-am-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .cc-am-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-am-table tr:hover td { background: rgba(20,184,166,0.04); }
      .cc-am-scroll { max-height: 520px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(20,184,166,0.4) transparent; }
      .cc-am-scroll::-webkit-scrollbar { width: 8px; }
      .cc-am-scroll::-webkit-scrollbar-track { background: transparent; }
      .cc-am-scroll::-webkit-scrollbar-thumb { background: rgba(20,184,166,0.3); border-radius: 4px; }
      .cc-am-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-am-status-connected { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-am-status-available { background: rgba(6,182,212,0.15); color: #06B6D4; border: 1px solid rgba(6,182,212,0.3); }
      .cc-am-status-coming { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-am-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
      .cc-am-tab { padding: 8px 16px; font-size: 12px; font-weight: 600; background: none; border: none; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: inherit; }
      .cc-am-tab.active { color: #14b8a6; border-bottom-color: #14b8a6; }
      .cc-am-tab:hover { color: #e2e8f0; }
      .cc-am-search { padding: 8px 14px 8px 36px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #fff; font-size: 13px; font-family: inherit; width: 280px; max-width: 100%; box-sizing: border-box; }
      .cc-am-search:focus { outline: none; border-color: #14b8a6; }
      .cc-am-search-wrap { position: relative; display: inline-block; }
      .cc-am-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; }
      .cc-am-btn { padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s; font-family: inherit; display: inline-flex; align-items: center; gap: 4px; }
      .cc-am-btn-primary { background: linear-gradient(135deg, #14b8a6, #06B6D4); color: #fff; }
      .cc-am-btn-secondary { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
      .cc-am-api-card { background: rgba(20,184,166,0.04); border: 1px solid rgba(20,184,166,0.15); border-radius: 10px; padding: 16px; margin-bottom: 12px; transition: all 0.2s; }
      .cc-am-api-card:hover { border-color: rgba(20,184,166,0.4); }
      .cc-am-api-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
      .cc-am-api-icon { font-size: 24px; }
      .cc-am-api-name { font-size: 14px; font-weight: 700; color: #fff; flex: 1; }
      .cc-am-api-provider { font-size: 10px; color: #14b8a6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
      .cc-am-api-desc { font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 10px; }
      .cc-am-api-meta { font-size: 11px; color: #64748b; display: flex; flex-wrap: wrap; gap: 12px; }
      .cc-am-api-endpoint { font-family: 'Monaco', 'Menlo', monospace; font-size: 11px; color: #14b8a6; background: rgba(20,184,166,0.08); padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 6px; }
      .cc-am-api-docs { font-size: 11px; color: #94a3b8; margin-top: 8px; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 3px solid #14b8a6; }
      .cc-am-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
      .cc-am-cat-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px; text-align: center; transition: all 0.2s; cursor: pointer; }
      .cc-am-cat-card:hover { background: rgba(20,184,166,0.04); border-color: rgba(20,184,166,0.3); }
      .cc-am-cat-icon { font-size: 32px; margin-bottom: 8px; }
      .cc-am-cat-name { font-size: 13px; font-weight: 700; color: #fff; }
      .cc-am-cat-count { font-size: 11px; color: #64748b; margin-top: 4px; }
      @media (max-width: 767px) {
        .cc-am-modal { flex-direction: column; }
        .cc-am-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-am-sidebar-brand { display: none; }
        .cc-am-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-am-nav-item.active { border-bottom-color: #14b8a6; border-left-color: transparent; }
        .cc-am-main { padding: 12px 12px 20px; }
        .cc-am-cards { grid-template-columns: repeat(2, 1fr); }
      }
      /* Light mode overrides */
      html:not(.dark) .cc-am-modal { background: rgba(248,250,252,0.99); color: #1e293b; }
      html:not(.dark) .cc-am-sidebar { background: rgba(241,245,249,0.8); border-right-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-am-sidebar-title { color: #0f172a; }
      html:not(.dark) .cc-am-nav-item { color: #64748b; }
      html:not(.dark) .cc-am-nav-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
      html:not(.dark) .cc-am-nav-item.active { background: rgba(20,184,166,0.08); color: #0d9488; }
      html:not(.dark) .cc-am-page-title { color: #0f172a; }
      html:not(.dark) .cc-am-header { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-am-card { background: rgba(20,184,166,0.04); border-color: rgba(20,184,166,0.15); }
      html:not(.dark) .cc-am-card-label { color: #64748b; }
      html:not(.dark) .cc-am-card-value { color: #0f172a; }
      html:not(.dark) .cc-am-card-delta { color: #64748b; }
      html:not(.dark) .cc-am-section { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-am-section-title { color: #1e293b; }
      html:not(.dark) .cc-am-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-am-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-am-table tr:hover td { background: rgba(20,184,166,0.04); }
      html:not(.dark) .cc-am-scroll { border-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-am-search { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.1); color: #1e293b; }
      html:not(.dark) .cc-am-btn-secondary { background: rgba(0,0,0,0.04); color: #475569; border-color: rgba(0,0,0,0.1); }
      html:not(.dark) .cc-am-api-card { background: rgba(20,184,166,0.04); border-color: rgba(20,184,166,0.15); }
      html:not(.dark) .cc-am-api-name { color: #0f172a; }
      html:not(.dark) .cc-am-api-desc { color: #64748b; }
      html:not(.dark) .cc-am-api-meta { color: #94a3b8; }
      html:not(.dark) .cc-am-api-endpoint { background: rgba(20,184,166,0.08); color: #0d9488; }
      html:not(.dark) .cc-am-api-docs { color: #64748b; background: rgba(0,0,0,0.02); }
      html:not(.dark) .cc-am-cat-card { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-am-cat-card:hover { background: rgba(20,184,166,0.04); border-color: rgba(20,184,166,0.2); }
      html:not(.dark) .cc-am-cat-name { color: #0f172a; }
      html:not(.dark) .cc-am-cat-count { color: #64748b; }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    const db = initDatabase();
    const connectedCount = db.apis.filter(a => a.status === 'connected').length;

    const overlay = document.createElement('div');
    overlay.id = 'cc-am-overlay';
    overlay.className = 'cc-am-modal';
    overlay.innerHTML = `
      <button class="cc-am-close" onclick="window.__ccAM.close()">×</button>
      <div class="cc-am-sidebar">
        <div class="cc-am-sidebar-brand">
          <div class="cc-am-sidebar-title">🔌 API Marketplace</div>
          <div class="cc-am-sidebar-sub">${connectedCount} of ${db.apis.length} connected</div>
        </div>
        <button class="cc-am-nav-item ${currentView === 'overview' ? 'active' : ''}" onclick="window.__ccAM.setView('overview')"><span class="cc-am-nav-icon">📊</span> Overview</button>
        <button class="cc-am-nav-item ${currentView === 'catalog' ? 'active' : ''}" onclick="window.__ccAM.setView('catalog')"><span class="cc-am-nav-icon">📚</span> All APIs ${connectedCount > 0 ? '<span class="cc-am-nav-badge">' + connectedCount + '</span>' : ''}</button>
        <button class="cc-am-nav-item ${currentView === 'categories' ? 'active' : ''}" onclick="window.__ccAM.setView('categories')"><span class="cc-am-nav-icon">🗂️</span> Categories</button>
        <button class="cc-am-nav-item ${currentView === 'health' ? 'active' : ''}" onclick="window.__ccAM.setView('health')"><span class="cc-am-nav-icon">💚</span> Integration Health</button>
        <button class="cc-am-nav-item ${currentView === 'code' ? 'active' : ''}" onclick="window.__ccAM.setView('code')"><span class="cc-am-nav-icon">💻</span> Code Samples</button>
        <button class="cc-am-nav-item ${currentView === 'webhooks' ? 'active' : ''}" onclick="window.__ccAM.setView('webhooks')"><span class="cc-am-nav-icon">🔗</span> Webhooks</button>
      </div>
      <div class="cc-am-main" id="cc-am-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-am-content');
    if (!container) return;
    if (currentView === 'overview') renderOverview(container);
    else if (currentView === 'catalog') renderCatalog(container);
    else if (currentView === 'categories') renderCategories(container);
    else if (currentView === 'health') renderHealth(container);
    else if (currentView === 'code') renderCodeSamples(container);
    else if (currentView === 'webhooks') renderWebhooks(container);

    document.querySelectorAll('.cc-am-nav-item').forEach(item => {
      const onclick = item.getAttribute('onclick') || '';
      item.classList.toggle('active', onclick.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // 1. OVERVIEW
  // ------------------------------------------------------------------
  function renderOverview(container) {
    const db = initDatabase();
    const connected = db.apis.filter(a => a.status === 'connected').length;
    const available = db.apis.filter(a => a.status === 'available').length;
    const coming = db.apis.filter(a => a.status === 'coming-soon').length;
    const categories = new Set(db.apis.map(a => a.category));
    const totalRequests = db.apis.filter(a => a.status === 'connected').reduce((s, a) => {
      const m = a.requests.match(/(\d+)/);
      return s + (m ? parseInt(m[1]) : 0);
    }, 0);
    const avgUptime = db.apis.filter(a => a.status === 'connected' && a.uptime_30d).reduce((s, a) => s + a.uptime_30d, 0) / connected;
    const avgLatency = db.apis.filter(a => a.status === 'connected').reduce((s, a) => s + parseInt(a.latency), 0) / connected;

    container.innerHTML = `
      <div class="cc-am-header">
        <h2 class="cc-am-page-title">🔌 API Marketplace Overview <span class="cc-am-page-badge">${db.apis.length} INTEGRATIONS</span></h2>
        <div class="cc-am-live-indicator"><div class="cc-am-live-dot"></div> ${connected} live connections</div>
      </div>
      <div class="cc-am-cards">
        <div class="cc-am-card"><div class="cc-am-card-label">Total APIs</div><div class="cc-am-card-value">${db.apis.length}</div><div class="cc-am-card-delta">${categories.size} categories</div></div>
        <div class="cc-am-card"><div class="cc-am-card-label">Connected</div><div class="cc-am-card-value" style="color:#22c55e">${connected}</div><div class="cc-am-card-delta">${Math.round(connected/db.apis.length*100)}% of catalog</div></div>
        <div class="cc-am-card"><div class="cc-am-card-label">Available</div><div class="cc-am-card-value" style="color:#06B6D4">${available}</div><div class="cc-am-card-delta">ready to connect</div></div>
        <div class="cc-am-card"><div class="cc-am-card-label">Coming Soon</div><div class="cc-am-card-value" style="color:#f59e0b">${coming}</div><div class="cc-am-card-delta">in development</div></div>
        <div class="cc-am-card"><div class="cc-am-card-label">Avg 30d Uptime</div><div class="cc-am-card-value" style="color:#22c55e">${avgUptime.toFixed(2)}%</div><div class="cc-am-card-delta">across all connections</div></div>
        <div class="cc-am-card"><div class="cc-am-card-label">Avg Latency</div><div class="cc-am-card-value" style="color:#14b8a6">${Math.round(avgLatency)}ms</div><div class="cc-am-card-delta">total: ${totalRequests.toLocaleString()} req/day</div></div>
      </div>
      <div class="cc-am-section">
        <div class="cc-am-section-title">📚 Recently Connected APIs</div>
        <div class="cc-am-scroll" style="max-height:400px">
          <table class="cc-am-table">
            <thead><tr><th>API</th><th>Provider</th><th>Category</th><th>Status</th><th>Endpoint</th><th>Auth</th><th>Requests</th><th>Latency</th><th>Uptime 30d</th><th>Last Call</th></tr></thead>
            <tbody>
              ${db.apis.filter(a => a.status === 'connected').map(a => `
                <tr>
                  <td style="font-weight:600;color:#14b8a6">${a.icon} ${a.name}</td>
                  <td>${a.provider}</td>
                  <td>${a.category}</td>
                  <td><span class="cc-am-status cc-am-status-connected">${a.status}</span></td>
                  <td style="font-family:monospace;font-size:10px;color:#14b8a6">${a.endpoint}</td>
                  <td>${a.auth}</td>
                  <td style="text-align:center">${a.requests}</td>
                  <td style="text-align:center">${a.latency}</td>
                  <td style="text-align:center;color:#22c55e;font-weight:600">${a.uptime_30d}%</td>
                  <td style="font-size:10px;color:#64748b">${a.last_call ? formatDate(a.last_call) : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 2. CATALOG (with tabs and search)
  // ------------------------------------------------------------------
  function renderCatalog(container) {
    const db = initDatabase();
    container.innerHTML = `
      <div class="cc-am-header">
        <h2 class="cc-am-page-title">📚 API Catalog <span class="cc-am-page-badge">${db.apis.length} APIS</span></h2>
        <div class="cc-am-search-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input class="cc-am-search" placeholder="Search APIs..." value="${currentSearch}" oninput="window.__ccAM.search(this.value)" />
        </div>
      </div>
      <div class="cc-am-tabs">
        <button class="cc-am-tab ${currentTab === 'all' ? 'active' : ''}" onclick="window.__ccAM.setTab('all')">All (${db.apis.length})</button>
        <button class="cc-am-tab ${currentTab === 'connected' ? 'active' : ''}" onclick="window.__ccAM.setTab('connected')">Connected (${db.apis.filter(a => a.status === 'connected').length})</button>
        <button class="cc-am-tab ${currentTab === 'available' ? 'active' : ''}" onclick="window.__ccAM.setTab('available')">Available (${db.apis.filter(a => a.status === 'available').length})</button>
        <button class="cc-am-tab ${currentTab === 'coming-soon' ? 'active' : ''}" onclick="window.__ccAM.setTab('coming-soon')">Coming Soon (${db.apis.filter(a => a.status === 'coming-soon').length})</button>
      </div>
      <div id="cc-am-catalog-wrap"></div>
    `;
    renderCatalogList();
  }

  function renderCatalogList() {
    const db = initDatabase();
    let list = db.apis;
    if (currentTab === 'connected') list = list.filter(a => a.status === 'connected');
    else if (currentTab === 'available') list = list.filter(a => a.status === 'available');
    else if (currentTab === 'coming-soon') list = list.filter(a => a.status === 'coming-soon');

    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().indexOf(q) !== -1 || a.provider.toLowerCase().indexOf(q) !== -1 || a.category.toLowerCase().indexOf(q) !== -1 || a.description.toLowerCase().indexOf(q) !== -1);
    }

    const wrap = document.getElementById('cc-am-catalog-wrap');
    if (!wrap) return;
    wrap.innerHTML = `
      ${list.map(a => {
        const statusClass = a.status === 'connected' ? 'cc-am-status-connected' : a.status === 'available' ? 'cc-am-status-available' : 'cc-am-status-coming';
        const actionBtn = a.status === 'connected'
          ? '<button class="cc-am-btn cc-am-btn-secondary">View Details</button>'
          : a.status === 'available'
            ? '<button class="cc-am-btn cc-am-btn-primary">Connect</button>'
            : '<button class="cc-am-btn cc-am-btn-secondary" disabled>Notify Me</button>';
        return `
          <div class="cc-am-api-card">
            <div class="cc-am-api-header">
              <div class="cc-am-api-icon">${a.icon}</div>
              <div style="flex:1">
                <div class="cc-am-api-name">${a.name}</div>
                <div class="cc-am-api-provider">${a.provider} · ${a.category}</div>
              </div>
              <span class="cc-am-status ${statusClass}">${a.status}</span>
              ${actionBtn}
            </div>
            <div class="cc-am-api-desc">${a.description}</div>
            <div class="cc-am-api-meta">
              <span>🔑 Auth: ${a.auth}</span>
              <span>📊 Rate: ${a.requests}</span>
              <span>⚡ Latency: ${a.latency}</span>
              ${a.uptime_30d ? '<span style="color:#22c55e">✓ Uptime: ' + a.uptime_30d + '%</span>' : ''}
            </div>
            <div class="cc-am-api-endpoint">${a.endpoint}</div>
            <div class="cc-am-api-docs"><strong>📖 Docs:</strong> ${a.docs}</div>
          </div>
        `;
      }).join('')}
      <div style="margin-top:8px;font-size:11px;color:#64748b">Showing ${list.length} of ${db.apis.length} APIs</div>
    `;
  }

  // ------------------------------------------------------------------
  // 3. CATEGORIES
  // ------------------------------------------------------------------
  function renderCategories(container) {
    const db = initDatabase();
    const categories = ['Ports', 'WMS', 'TMS', 'Weather', 'Geopolitical', 'Financial', 'Customs'];
    const catIcons = { 'Ports': '⚓', 'WMS': '🏭', 'TMS': '🚛', 'Weather': '🌤️', 'Geopolitical': '🗺️', 'Financial': '💱', 'Customs': '🛃' };

    container.innerHTML = `
      <div class="cc-am-header">
        <h2 class="cc-am-page-title">🗂️ API Categories <span class="cc-am-page-badge">${categories.length} DOMAINS</span></h2>
      </div>
      <div class="cc-am-section">
        <div class="cc-am-section-title">📚 Browse by Category</div>
        <div class="cc-am-cat-grid">
          ${categories.map(cat => {
            const catApis = db.apis.filter(a => a.category === cat);
            const connected = catApis.filter(a => a.status === 'connected').length;
            return `
              <div class="cc-am-cat-card" onclick="window.__ccAM.filterByCategory('${cat}')">
                <div class="cc-am-cat-icon">${catIcons[cat]}</div>
                <div class="cc-am-cat-name">${cat}</div>
                <div class="cc-am-cat-count">${catApis.length} APIs · ${connected} connected</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ${categories.map(cat => {
        const catApis = db.apis.filter(a => a.category === cat);
        if (catApis.length === 0) return '';
        return `
          <div class="cc-am-section">
            <div class="cc-am-section-title">${catIcons[cat]} ${cat} APIs (${catApis.length})</div>
            <div class="cc-am-scroll" style="max-height:340px">
              <table class="cc-am-table">
                <thead><tr><th>API</th><th>Provider</th><th>Status</th><th>Endpoint</th><th>Auth</th><th>Requests</th><th>Latency</th></tr></thead>
                <tbody>
                  ${catApis.map(a => {
                    const statusClass = a.status === 'connected' ? 'cc-am-status-connected' : a.status === 'available' ? 'cc-am-status-available' : 'cc-am-status-coming';
                    return `
                      <tr>
                        <td style="font-weight:600;color:#14b8a6">${a.icon} ${a.name}</td>
                        <td>${a.provider}</td>
                        <td><span class="cc-am-status ${statusClass}">${a.status}</span></td>
                        <td style="font-family:monospace;font-size:10px;color:#14b8a6">${a.endpoint}</td>
                        <td>${a.auth}</td>
                        <td style="text-align:center">${a.requests}</td>
                        <td style="text-align:center">${a.latency}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  // ------------------------------------------------------------------
  // 4. INTEGRATION HEALTH MONITOR
  // ------------------------------------------------------------------
  function renderHealth(container) {
    const db = initDatabase();
    const connected = db.apis.filter(a => a.status === 'connected');

    container.innerHTML = `
      <div class="cc-am-header">
        <h2 class="cc-am-page-title">💚 Integration Health Monitor <span class="cc-am-page-badge">REAL-TIME</span></h2>
        <div class="cc-am-live-indicator"><div class="cc-am-live-dot"></div> Monitoring ${connected.length} connections</div>
      </div>

      <div class="cc-am-cards">
        <div class="cc-am-card"><div class="cc-am-card-label">Avg Uptime (30d)</div><div class="cc-am-card-value" style="color:#10B981">${(connected.reduce((s,a) => s + (a.uptime_30d || 99), 0) / connected.length).toFixed(2)}%</div><div class="cc-am-card-delta">across all connections</div></div>
        <div class="cc-am-card"><div class="cc-am-card-label">Avg Latency</div><div class="cc-am-card-value" style="color:#06B6D4">${Math.round(connected.reduce((s,a) => s + parseInt(a.latency), 0) / connected.length)}ms</div><div class="cc-am-card-delta">response time</div></div>
        <div class="cc-am-card"><div class="cc-am-card-label">Total Requests (24h)</div><div class="cc-am-card-value">${(connected.reduce((s,a) => { const m = a.requests.match(/(\d+)/); return s + (m ? parseInt(m[1]) : 0); }, 0) / 1000).toFixed(0)}k</div><div class="cc-am-card-delta">across all APIs</div></div>
        <div class="cc-am-card"><div class="cc-am-card-label">Error Rate</div><div class="cc-am-card-value" style="color:#10B981">${(Math.random() * 0.5).toFixed(2)}%</div><div class="cc-am-card-delta">below SLA threshold</div></div>
      </div>

      <div class="cc-am-section">
        <div class="cc-am-section-title">💚 Connected API Health Status</div>
        <div class="cc-am-scroll">
          <table class="cc-am-table">
            <thead>
              <tr><th>API</th><th>Provider</th><th>Status</th><th>Uptime 30d</th><th>Avg Latency</th><th>Requests Today</th><th>Error Rate</th><th>Last Sync</th><th>SLA</th><th>Health</th></tr>
            </thead>
            <tbody>
              ${connected.map(a => {
                const uptime = a.uptime_30d || (99 + Math.random() * 0.9);
                const latency = parseInt(a.latency);
                const errorRate = (Math.random() * 0.3).toFixed(2);
                const lastSync = new Date(Date.now() - Math.random() * 300000);
                const sla = uptime > 99.5 ? 'Met' : uptime > 99 ? 'Warning' : 'Breached';
                const healthScore = Math.round((uptime * 0.4) + ((100 - latency / 10) * 0.3) + ((100 - parseFloat(errorRate) * 100) * 0.3));
                const healthColor = healthScore > 95 ? '#10B981' : healthScore > 85 ? '#f59e0b' : '#ef4444';
                const reqToday = Math.floor(Math.random() * 5000) + 500;
                return `
                  <tr>
                    <td style="font-weight:600;color:#14b8a6">${a.icon} ${a.name}</td>
                    <td style="font-size:11px">${a.provider}</td>
                    <td><span class="cc-am-status cc-am-status-connected">connected</span></td>
                    <td style="text-align:center;color:${uptime > 99.5 ? '#10B981' : '#f59e0b'};font-weight:600">${uptime.toFixed(2)}%</td>
                    <td style="text-align:center;color:${latency < 100 ? '#10B981' : latency < 200 ? '#f59e0b' : '#ef4444'}">${latency}ms</td>
                    <td style="text-align:center">${reqToday.toLocaleString()}</td>
                    <td style="text-align:center;color:#10B981">${errorRate}%</td>
                    <td style="text-align:center;font-size:11px;color:#64748b">${lastSync.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</td>
                    <td style="text-align:center"><span class="cc-am-status cc-am-status-${sla === 'Met' ? 'connected' : sla === 'Warning' ? 'available' : 'coming'}">${sla}</span></td>
                    <td style="text-align:center">
                      <div style="display:flex;align-items:center;gap:4px;justify-content:center">
                        <div style="width:50px;height:6px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden"><div style="height:100%;width:${healthScore}%;background:${healthColor};border-radius:3px"></div></div>
                        <span style="font-size:11px;font-weight:700;color:${healthColor}">${healthScore}</span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="cc-am-section">
        <div class="cc-am-section-title">📊 Request Volume (24h) by API</div>
        <div class="cc-am-bars">
          ${connected.slice(0, 12).map(a => {
            const reqToday = Math.floor(Math.random() * 5000) + 500;
            const maxReq = 5500;
            const pct = (reqToday / maxReq) * 100;
            return `
              <div class="cc-am-bar-wrap">
                <div class="cc-am-bar-value" style="font-size:10px">${(reqToday / 1000).toFixed(1)}k</div>
                <div class="cc-am-bar" style="height:${pct}%;background:linear-gradient(180deg,#14b8a6,#06B6D4)" title="${a.name}: ${reqToday.toLocaleString()} requests today">
                  <div class="cc-am-bar-tooltip">${a.name}: ${reqToday.toLocaleString()} requests · ${a.latency} avg latency</div>
                </div>
                <div class="cc-am-bar-label" style="max-width:50px;font-size:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.name.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 5. CODE SAMPLES
  // ------------------------------------------------------------------
  function renderCodeSamples(container) {
    const db = initDatabase();
    const connected = db.apis.filter(a => a.status === 'connected').slice(0, 6);

    container.innerHTML = `
      <div class="cc-am-header">
        <h2 class="cc-am-page-title">💻 Code Samples & Developer Documentation</h2>
      </div>

      <div class="cc-am-section">
        <div class="cc-am-section-title">🚀 Quick Start — Authentication</div>
        <div style="background:#0d1117;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;font-family:'Monaco','Menlo','Courier New',monospace;font-size:12px;color:#e2e8f0;overflow-x:auto;line-height:1.6">
          <span style="color:#64748b">// 1. Get your API key from Settings and API Keys</span><br>
          <span style="color:#7ee787">const</span> API_KEY = <span style="color:#a5d6ff">'sk_live_aisupplychain_xxxxxxxxxxxx'</span>;<br><br>
          <span style="color:#64748b">// 2. Base URL</span><br>
          <span style="color:#7ee787">const</span> BASE_URL = <span style="color:#a5d6ff">'https://api.aisupplychain-advanced.com/v1'</span>;<br><br>
          <span style="color:#64748b">// 3. Authenticate</span><br>
          <span style="color:#7ee787">const</span> response = <span style="color:#7ee787">await</span> fetch(BASE_URL + <span style="color:#a5d6ff">'/auth/verify'</span>, {<br>
          &nbsp;&nbsp;headers: { <span style="color:#a5d6ff">'Authorization'</span>: <span style="color:#a5d6ff">'Bearer '</span> + API_KEY }<br>
          });<br><br>
          <span style="color:#7ee787">const</span> data = <span style="color:#7ee787">await</span> response.json();<br>
          console.log(data); <span style="color:#64748b">// { status: "ok", plan: "enterprise", rate_limit: 100000 }</span>
        </div>
      </div>

      ${connected.map(api => {
        const sampleCode = generateCodeSample(api);
        return `
          <div class="cc-am-section">
            <div class="cc-am-section-title">${api.icon} ${api.name} — Code Sample (${api.provider})</div>
            <div style="display:flex;gap:6px;margin-bottom:8px">
              <button class="cc-am-tab active" onclick="window.__ccAM.switchLang(this,'${api.id}','js')">JavaScript</button>
              <button class="cc-am-tab" onclick="window.__ccAM.switchLang(this,'${api.id}','py')">Python</button>
              <button class="cc-am-tab" onclick="window.__ccAM.switchLang(this,'${api.id}','curl')">cURL</button>
            </div>
            <div id="code-${api.id}" style="background:#0d1117;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;font-family:'Monaco','Menlo','Courier New',monospace;font-size:11px;color:#e2e8f0;overflow-x:auto;line-height:1.6;white-space:pre">${sampleCode}</div>
            <div style="margin-top:8px;display:flex;gap:8px">
              <button class="cc-am-btn cc-am-btn-secondary" onclick="window.__ccAM.copyCode('${api.id}')">📋 Copy Code</button>
              <span style="font-size:11px;color:#64748b;align-self:center">Endpoint: <code style="color:#14b8a6">${api.endpoint}</code> · Auth: ${api.auth} · Rate: ${api.requests}</span>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  function generateCodeSample(api) {
    const lang = 'js';
    if (lang === 'js') {
      return `// ${api.name} — ${api.provider}
// ${api.description}

const API_KEY = 'sk_live_aisupplychain_xxxxxxxxxxxx';
const BASE_URL = 'https://api.aisupplychain-advanced.com/v1';

// Fetch ${api.name} data
const response = await fetch(\`\${BASE_URL}${api.endpoint}\`, {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);

// Response example:
// {
//   "status": "success",
//   "data": { ... },
//   "meta": {
//     "request_id": "req_abc123",
//     "timestamp": "${new Date().toISOString()}",
//     "rate_remaining": 99845
//   }
// }`;
    }
    return '// Code sample';
  }

  function switchLang(btn, apiId, lang) {
    btn.parentElement.querySelectorAll('.cc-am-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const api = initDatabase().apis.find(a => a.id === apiId);
    if (!api) return;
    let code = '';
    if (lang === 'js') {
      code = generateCodeSample(api);
    } else if (lang === 'py') {
      code = `# ${api.name} — ${api.provider}
# ${api.description}

import requests

API_KEY = 'sk_live_aisupplychain_xxxxxxxxxxxx'
BASE_URL = 'https://api.aisupplychain-advanced.com/v1'

# Fetch ${api.name} data
response = requests.get(
    f'{BASE_URL}${api.endpoint}',
    headers={
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
)

data = response.json()
print(data)`;
    } else if (lang === 'curl') {
      code = `# ${api.name} — ${api.provider}
# ${api.description}

curl -X GET 'https://api.aisupplychain-advanced.com/v1${api.endpoint}' \\
  -H 'Authorization: Bearer sk_live_aisupplychain_xxxxxxxxxxxx' \\
  -H 'Content-Type: application/json'`;
    }
    const el = document.getElementById('code-' + apiId);
    if (el) el.textContent = code;
  }

  function copyCode(apiId) {
    const el = document.getElementById('code-' + apiId);
    if (el) {
      navigator.clipboard.writeText(el.textContent).then(() => {
        alert('Code copied to clipboard!');
      }).catch(() => {
        alert('Copy failed. Please select and copy manually.');
      });
    }
  }

  // ------------------------------------------------------------------
  // 6. WEBHOOK MANAGEMENT
  // ------------------------------------------------------------------
  function renderWebhooks(container) {
    const db = initDatabase();
    const webhooks = [
      { id: 'wh1', name: 'Vessel Arrival Notification', event: 'vessel.arrived', url: 'https://your-app.com/webhooks/vessel-arrival', status: 'active', deliveries_24h: 145, success_rate: 99.3, last_delivery: new Date(Date.now() - 120000).toISOString(), api: 'MarineTraffic Vessel Tracking' },
      { id: 'wh2', name: 'Port Congestion Alert', event: 'port.congestion.high', url: 'https://your-app.com/webhooks/congestion', status: 'active', deliveries_24h: 12, success_rate: 100, last_delivery: new Date(Date.now() - 3600000).toISOString(), api: 'PortWatch Congestion Index' },
      { id: 'wh3', name: 'Inventory Low Stock', event: 'inventory.below_reorder', url: 'https://your-app.com/webhooks/low-stock', status: 'active', deliveries_24h: 8, success_rate: 100, last_delivery: new Date(Date.now() - 7200000).toISOString(), api: 'SAP EWM Connector' },
      { id: 'wh4', name: 'Shipment Status Update', event: 'shipment.status.changed', url: 'https://your-app.com/webhooks/shipment-status', status: 'active', deliveries_24h: 320, success_rate: 98.7, last_delivery: new Date(Date.now() - 30000).toISOString(), api: 'Project44 Multi-Modal' },
      { id: 'wh5', name: 'Storm Warning', event: 'weather.storm.alert', url: 'https://your-app.com/webhooks/storm-alert', status: 'active', deliveries_24h: 3, success_rate: 100, last_delivery: new Date(Date.now() - 14400000).toISOString(), api: 'NOAA Severe Weather' },
      { id: 'wh6', name: 'ETA Prediction Updated', event: 'eta.prediction.updated', url: 'https://your-app.com/webhooks/eta-update', status: 'active', deliveries_24h: 89, success_rate: 99.1, last_delivery: new Date(Date.now() - 600000).toISOString(), api: 'FourKites ETA Engine' },
      { id: 'wh7', name: 'Sanctions Match Found', event: 'sanctions.match.detected', url: 'https://your-app.com/webhooks/sanctions', status: 'paused', deliveries_24h: 0, success_rate: 100, last_delivery: new Date(Date.now() - 86400000).toISOString(), api: 'Everstream Trade Sanctions' },
      { id: 'wh8', name: 'FX Rate Threshold', event: 'fx.rate.threshold', url: 'https://your-app.com/webhooks/fx-threshold', status: 'active', deliveries_24h: 5, success_rate: 100, last_delivery: new Date(Date.now() - 1800000).toISOString(), api: 'FXRate Live Currency' }
    ];

    const activeCount = webhooks.filter(w => w.status === 'active').length;
    const totalDeliveries = webhooks.reduce((s, w) => s + w.deliveries_24h, 0);
    const avgSuccess = (webhooks.reduce((s, w) => s + w.success_rate, 0) / webhooks.length).toFixed(1);

    container.innerHTML = `
      <div class="cc-am-header">
        <h2 class="cc-am-page-title">🔗 Webhook Management <span class="cc-am-page-badge">${webhooks.length} WEBHOOKS</span></h2>
        <div class="cc-am-live-indicator"><div class="cc-am-live-dot"></div> ${activeCount} active · ${totalDeliveries} deliveries/24h</div>
      </div>

      <div class="cc-am-cards">
        <div class="cc-am-card"><div class="cc-am-card-label">Active Webhooks</div><div class="cc-am-card-value" style="color:#10B981">${activeCount}/${webhooks.length}</div><div class="cc-am-card-delta">${webhooks.length - activeCount} paused</div></div>
        <div class="cc-am-card"><div class="cc-am-card-label">Deliveries (24h)</div><div class="cc-am-card-value">${totalDeliveries}</div><div class="cc-am-card-delta">webhook events fired</div></div>
        <div class="cc-am-card"><div class="cc-am-card-label">Avg Success Rate</div><div class="cc-am-card-value" style="color:#10B981">${avgSuccess}%</div><div class="cc-am-card-delta">delivery success</div></div>
        <div class="cc-am-card"><div class="cc-am-card-label">Avg Latency</div><div class="cc-am-card-value" style="color:#06B6D4">${Math.floor(Math.random() * 50 + 80)}ms</div><div class="cc-am-card-delta">end-to-end delivery</div></div>
      </div>

      <div class="cc-am-section">
        <div class="cc-am-section-title">🔗 Registered Webhooks</div>
        <div class="cc-am-scroll">
          <table class="cc-am-table">
            <thead>
              <tr><th>Webhook Name</th><th>Event</th><th>Endpoint URL</th><th>Source API</th><th>Status</th><th>Deliveries (24h)</th><th>Success Rate</th><th>Last Delivery</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${webhooks.map(w => {
                const lastDate = new Date(w.last_delivery);
                const minsAgo = Math.floor((Date.now() - lastDate.getTime()) / 60000);
                const timeStr = minsAgo < 60 ? minsAgo + 'm ago' : minsAgo < 1440 ? Math.floor(minsAgo / 60) + 'h ago' : Math.floor(minsAgo / 1440) + 'd ago';
                return `
                  <tr>
                    <td style="font-weight:600;color:#14b8a6">${w.name}</td>
                    <td style="font-family:monospace;font-size:11px;color:#a78bfa">${w.event}</td>
                    <td style="font-family:monospace;font-size:10px;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${w.url}</td>
                    <td style="font-size:11px">${w.api}</td>
                    <td><span class="cc-am-status cc-am-status-${w.status === 'active' ? 'connected' : 'coming'}">${w.status}</span></td>
                    <td style="text-align:center">${w.deliveries_24h}</td>
                    <td style="text-align:center;color:${w.success_rate > 99 ? '#10B981' : '#f59e0b'};font-weight:600">${w.success_rate}%</td>
                    <td style="text-align:center;font-size:11px;color:#64748b">${timeStr}</td>
                    <td>
                      <button class="cc-am-btn cc-am-btn-secondary" style="font-size:10px;padding:3px 8px" onclick="alert('Demo: View delivery log for ${w.name}')">📋 Log</button>
                      ${w.status === 'active'
                        ? `<button class="cc-am-btn cc-am-btn-secondary" style="font-size:10px;padding:3px 8px" onclick="alert('Demo: Pause ${w.name}')">⏸️</button>`
                        : `<button class="cc-am-btn cc-am-btn-primary" style="font-size:10px;padding:3px 8px" onclick="alert('Demo: Resume ${w.name}')">▶️</button>`
                      }
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="cc-am-section">
        <div class="cc-am-section-title">📡 Available Webhook Events</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">
          ${[
            { event: 'vessel.arrived', desc: 'Fired when a vessel arrives at a monitored port', category: 'Ports' },
            { event: 'vessel.departed', desc: 'Fired when a vessel departs from a port', category: 'Ports' },
            { event: 'port.congestion.high', desc: 'Fired when port congestion exceeds 85%', category: 'Ports' },
            { event: 'inventory.below_reorder', desc: 'Fired when SKU quantity drops below reorder point', category: 'WMS' },
            { event: 'inventory.stockout_predicted', desc: 'Fired when AI predicts stockout within 7 days', category: 'WMS' },
            { event: 'shipment.status.changed', desc: 'Fired when shipment status is updated', category: 'TMS' },
            { event: 'eta.prediction.updated', desc: 'Fired when ETA prediction changes by >2 hours', category: 'TMS' },
            { event: 'weather.storm.alert', desc: 'Fired when storm is predicted within 48h of a port', category: 'Weather' },
            { event: 'sanctions.match.detected', desc: 'Fired when a sanctioned party is detected', category: 'Geopolitical' },
            { event: 'fx.rate.threshold', desc: 'Fired when FX rate crosses a configured threshold', category: 'Financial' },
            { event: 'compliance.audit.due', desc: 'Fired 7 days before a compliance audit is due', category: 'Compliance' },
            { event: 'ai.anomaly.detected', desc: 'Fired when AI detects an inventory or demand anomaly', category: 'AI' }
          ].map(e => `
            <div style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px">
              <div style="font-family:monospace;font-size:11px;color:#a78bfa;font-weight:600">${e.event}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:4px">${e.desc}</div>
              <div style="font-size:9px;color:#64748b;margin-top:4px;padding:2px 6px;background:rgba(255,255,255,0.05);border-radius:4px;display:inline-block">${e.category}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="cc-am-section">
        <div class="cc-am-section-title">➕ Register New Webhook</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px">Webhook Name</label>
            <input type="text" class="cc-am-search" style="width:100%" placeholder="My Webhook" />
          </div>
          <div>
            <label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px">Event Type</label>
            <select class="cc-am-search" style="width:100%">
              <option>vessel.arrived</option>
              <option>port.congestion.high</option>
              <option>inventory.below_reorder</option>
              <option>shipment.status.changed</option>
              <option>weather.storm.alert</option>
              <option>ai.anomaly.detected</option>
            </select>
          </div>
          <div style="grid-column:1/-1">
            <label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px">Endpoint URL</label>
            <input type="text" class="cc-am-search" style="width:100%" placeholder="https://your-app.com/webhooks/my-webhook" />
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="cc-am-btn cc-am-btn-primary" onclick="alert('Demo: Webhook registration would create a new webhook endpoint and send a test event.')">🔗 Register Webhook</button>
          <button class="cc-am-btn cc-am-btn-secondary" onclick="alert('Demo: A test event would be sent to your endpoint URL.')">🧪 Send Test Event</button>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-am-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-am-overlay');
    if (overlay) overlay.remove();
  }

  function setView(view) {
    currentView = view;
    renderContent();
  }

  function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.cc-am-tab').forEach(t => t.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    renderCatalogList();
  }

  function search(q) {
    currentSearch = q;
    renderCatalogList();
  }

  function filterByCategory(cat) {
    currentView = 'catalog';
    currentSearch = cat;
    renderContent();
    const search = document.querySelector('.cc-am-search');
    if (search) search.value = cat;
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    window.__ccAM = { open, close, setView, setTab, search, filterByCategory, switchLang, copyCode };

    function injectButton() {
      if (document.getElementById('cc-am-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-am-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 500px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #14b8a6, #06B6D4)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg> APIs';
      btn.setAttribute('aria-label', 'Open API marketplace');
      btn.title = 'Open API Marketplace (press P)';
      btn.onclick = open;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(20, 184, 166, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(20, 184, 166, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-am-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-am-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 5500); });
    } else {
      setTimeout(tryInject, 5500);
    }

    // Keyboard shortcut: press "P" to open API marketplace
    document.addEventListener('keydown', function(e) {
      if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-am-overlay')) { open(); e.preventDefault(); }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
