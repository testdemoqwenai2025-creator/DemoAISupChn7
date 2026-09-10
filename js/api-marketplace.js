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
    window.__ccAM = { open, close, setView, setTab, search, filterByCategory };

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
