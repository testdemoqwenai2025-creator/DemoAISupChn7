// ====================================================================
// nl-command.js — Natural Language Command Interface
// ====================================================================
// A ChatGPT-style conversational AI assistant for supply chain:
//   1. Floating chat bar (always visible when modal is open)
//   2. Pre-built question chips for common queries
//   3. 15+ intent matchers that parse user keywords and synthesize responses
//   4. Each response: text summary + KPI cards + mini charts + module links
//   5. Conversation history persisted to localStorage
//   6. Voice command button (Web Speech API) with visual feedback
//   7. Quick action buttons for common queries
//
// Architecture: reuses IIFE + modal + sidebar patterns from api-marketplace.js
// Data: synthetic, persisted to localStorage
// ====================================================================
(function() {
  'use strict';

  if (window.__nlCommandLoaded) return;
  window.__nlCommandLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_nl_command_db_v1';

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(a) {
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'k';
    return '$' + a.toFixed(0);
  }

  // ------------------------------------------------------------------
  // STATIC SYNTHETIC DATA (simulated supply chain knowledge base)
  // ------------------------------------------------------------------
  const VESSELS = [
    { id: 'VSL-7821', name: 'MV Ever Glory', route: 'Shanghai → Los Angeles', eta: '2026-02-18', delay: 5, status: 'delayed', cargo: 'Electronics · 2,400 TEU', value: 4800000 },
    { id: 'VSL-4419', name: 'MSC Aurora', route: 'Rotterdam → New York', eta: '2026-02-10', delay: 0, status: 'on-time', cargo: 'Automotive parts · 1,800 TEU', value: 3200000 },
    { id: 'VSL-9930', name: 'CMA Phoenix', route: 'Singapore → Hamburg', eta: '2026-02-22', delay: 12, status: 'delayed', cargo: 'Machinery · 3,100 TEU', value: 6200000 },
    { id: 'VSL-2247', name: 'Maersk Horizon', route: 'Busan → Long Beach', eta: '2026-02-15', delay: 2, status: 'at-risk', cargo: 'Textiles · 1,200 TEU', value: 1800000 },
    { id: 'VSL-6612', name: 'ONE Trident', route: 'Hong Kong → Rotterdam', eta: '2026-02-25', delay: 0, status: 'on-time', cargo: 'Consumer goods · 2,600 TEU', value: 4100000 },
    { id: 'VSL-3398', name: 'HMM Stellar', route: 'Ningbo → Felixstowe', eta: '2026-02-19', delay: 8, status: 'delayed', cargo: 'Furniture · 1,950 TEU', value: 2900000 }
  ];

  const SKUS = [
    { sku: 'SKU-A100', name: 'Premium OLED Display 6.7"', stock: 1800, cover: 4, risk: 'low', supplier: 'Boe Tech', monthly: 12000 },
    { sku: 'SKU-B230', name: 'Lithium-ion Cell 21700', stock: 240, cover: 0.4, risk: 'critical', supplier: 'CATL', monthly: 45000 },
    { sku: 'SKU-C447', name: 'Wifi 6E Module', stock: 620, cover: 2, risk: 'medium', supplier: 'Broadcom', monthly: 9300 },
    { sku: 'SKU-D560', name: 'Steel Sheet Galvanized', stock: 85, cover: 0.3, risk: 'critical', supplier: 'POSCO', monthly: 18500 },
    { sku: 'SKU-E712', name: 'DRAM 8GB LPDDR4', stock: 4100, cover: 9, risk: 'low', supplier: 'Samsung', monthly: 13500 },
    { sku: 'SKU-F820', name: 'Aluminum Alloy 6061', stock: 320, cover: 1.1, risk: 'high', supplier: 'Norsk Hydro', monthly: 21000 }
  ];

  const RISKS = [
    { id: 'R-101', title: 'Port congestion at LA/LB', severity: 'high', impact: 1850000, likelihood: 0.78, category: 'Logistics', mitigation: 'Reroute 35% to Oakland' },
    { id: 'R-102', title: 'Single-source dependency on CATL', severity: 'critical', impact: 4200000, likelihood: 0.42, category: 'Supplier', mitigation: 'Qualify LG Energy backup' },
    { id: 'R-103', title: 'Red Sea route disruption', severity: 'high', impact: 2400000, likelihood: 0.65, category: 'Geopolitical', mitigation: 'Cape of Good Hope fallback' },
    { id: 'R-104', title: 'USD/CNY volatility exposure', severity: 'medium', impact: 980000, likelihood: 0.55, category: 'Financial', mitigation: 'Hedge 60% via forwards' },
    { id: 'R-105', title: 'Steel price spike (HRC +14%)', severity: 'medium', impact: 720000, likelihood: 0.48, category: 'Commodity', mitigation: 'Lock 90-day contract' }
  ];

  const ORDERS = [
    { id: 'PO-50213', supplier: 'Foxconn', value: 1240000, status: 'in-transit', eta: '2026-02-14', items: 42 },
    { id: 'PO-50456', supplier: 'TSMC', value: 2850000, status: 'delayed', eta: '2026-02-26', items: 18 },
    { id: 'PO-50789', supplier: 'CATL', value: 980000, status: 'at-risk', eta: '2026-02-19', items: 65 },
    { id: 'PO-50934', supplier: 'POSCO', value: 1670000, status: 'delivered', eta: '2026-02-03', items: 12 },
    { id: 'PO-51102', supplier: 'Samsung SDI', value: 2210000, status: 'in-transit', eta: '2026-02-17', items: 28 }
  ];

  const DEMURRAGE = [
    { port: 'Los Angeles', days: 14, daily: 8500, total: 119000 },
    { port: 'Shanghai', days: 9, daily: 7200, total: 64800 },
    { port: 'Rotterdam', days: 6, daily: 6800, total: 40800 },
    { port: 'Singapore', days: 11, daily: 7800, total: 85800 },
    { port: 'Hamburg', days: 4, daily: 6200, total: 24800 }
  ];

  const SUGGESTIONS = [
    "What's our biggest risk?",
    'Show delayed vessels',
    "What's our demurrage exposure?",
    'Which SKUs are at stockout risk?',
    'Generate a summary',
    'Which suppliers are underperforming?',
    'Show pending POs over $1M',
    'What needs my approval today?',
    'Forecast next week demand',
    'Compare on-time delivery vs last month',
    'Show ports with congestion',
    'What is our inventory health?'
  ];

  const QUICK_ACTIONS = [
    { label: 'Risk Briefing', icon: '⚠️', query: "Give me today's risk briefing" },
    { label: 'Exceptions', icon: '🚨', query: 'Show all exceptions requiring attention' },
    { label: 'Daily Summary', icon: '📋', query: 'Generate a daily summary' },
    { label: 'Cost Outlook', icon: '💰', query: "What's our cost outlook this quarter?" }
  ];

  // ------------------------------------------------------------------
  // INTENT MATCHERS — 15+ keyword-based intent parsers
  // ------------------------------------------------------------------
  const INTENTS = [
    {
      id: 'biggest_risk',
      keywords: ['biggest', 'largest', 'highest', 'top', 'main', 'biggest risk', 'major risk'],
      title: 'Biggest Risk Analysis',
      module: 'Compliance Monitoring',
      shortcut: 'C',
      respond: function() {
        const top = RISKS.slice().sort(function(a, b) { return (b.impact * b.likelihood) - (a.impact * a.likelihood); })[0];
        return {
          text: "Your biggest exposure is **" + top.title + "** (" + top.category + "). Expected impact is " + formatCurrency(top.impact) + " with " + Math.round(top.likelihood * 100) + "% likelihood. Recommended action: " + top.mitigation + ".",
          kpis: [
            { label: 'Top Risk', value: top.title, accent: '#ef4444' },
            { label: 'Expected Impact', value: formatCurrency(top.impact), accent: '#f59e0b' },
            { label: 'Likelihood', value: Math.round(top.likelihood * 100) + '%', accent: '#8b5cf6' },
            { label: 'Total Active Risks', value: RISKS.length, accent: '#06B6D4' }
          ],
          table: {
            title: 'Top 5 Risk Exposures',
            headers: ['Risk', 'Category', 'Severity', 'Impact', 'Likelihood', 'Mitigation'],
            rows: RISKS.map(function(r) { return [r.title, r.category, r.severity, formatCurrency(r.impact), Math.round(r.likelihood * 100) + '%', r.mitigation]; })
          },
          recommendation: 'Activate Tier-2 mitigation playbook and schedule executive review within 24 hours.'
        };
      }
    },
    {
      id: 'delayed_vessels',
      keywords: ['delayed', 'delay', 'vessel', 'ship', 'container ship', 'late vessel'],
      title: 'Delayed Vessel Status',
      module: 'Dispatch Dashboard',
      shortcut: 'D',
      respond: function() {
        const delayed = VESSELS.filter(function(v) { return v.delay > 0; });
        const totalDelayCost = delayed.reduce(function(s, v) { return s + v.delay * 18500; }, 0);
        return {
          text: "We have **" + delayed.length + " of " + VESSELS.length + "** vessels delayed, with cumulative delay of " + delayed.reduce(function(s, v) { return s + v.delay; }, 0) + " days. Estimated downstream cost impact: " + formatCurrency(totalDelayCost) + ".",
          kpis: [
            { label: 'Delayed Vessels', value: delayed.length, accent: '#ef4444' },
            { label: 'On Schedule', value: VESSELS.length - delayed.length, accent: '#22c55e' },
            { label: 'Avg Delay', value: Math.round(delayed.reduce(function(s, v) { return s + v.delay; }, 0) / delayed.length) + 'd', accent: '#f59e0b' },
            { label: 'Delay Cost', value: formatCurrency(totalDelayCost), accent: '#8b5cf6' }
          ],
          table: {
            title: 'Delayed Vessels',
            headers: ['Vessel', 'Route', 'ETA', 'Delay', 'Cargo', 'Value'],
            rows: delayed.map(function(v) { return [v.name, v.route, v.eta, v.delay + 'd', v.cargo, formatCurrency(v.value)]; })
          },
          recommendation: 'Prioritize MV CMA Phoenix (12d delay). Consider air freight for high-value SKUs in the cargo manifest.'
        };
      }
    },
    {
      id: 'demurrage',
      keywords: ['demurrage', 'detention', 'port charges', 'port fees', 'storage'],
      title: 'Demurrage Exposure',
      module: 'Order Management',
      shortcut: 'O',
      respond: function() {
        const total = DEMURRAGE.reduce(function(s, d) { return s + d.total; }, 0);
        const totalDays = DEMURRAGE.reduce(function(s, d) { return s + d.days; }, 0);
        return {
          text: "Current demurrage exposure is **" + formatCurrency(total) + "** across " + DEMURRAGE.length + " ports, totaling " + totalDays + " container-days of detention. Los Angeles alone accounts for " + formatCurrency(119000) + " (47% of total).",
          kpis: [
            { label: 'Total Exposure', value: formatCurrency(total), accent: '#ef4444' },
            { label: 'Container-Days', value: totalDays, accent: '#f59e0b' },
            { label: 'Worst Port', value: 'Los Angeles', accent: '#8b5cf6' },
            { label: 'Avg Daily Rate', value: '$7.3k', accent: '#06B6D4' }
          ],
          table: {
            title: 'Demurrage by Port',
            headers: ['Port', 'Days', 'Daily Rate', 'Total', 'Action'],
            rows: DEMURRAGE.map(function(d) { return [d.port, d.days + 'd', formatCurrency(d.daily), formatCurrency(d.total), 'Priority pickup']; })
          },
          recommendation: 'Expedite LA pickup (14d detention). Reassign 2 chassis from Oakland to clear backlog within 72h.'
        };
      }
    },
    {
      id: 'stockout',
      keywords: ['stockout', 'stock out', 'sku', 'inventory', 'at risk', 'out of stock', 'reorder'],
      title: 'SKU Stockout Risk',
      module: 'Order Management',
      shortcut: 'O',
      respond: function() {
        const critical = SKUS.filter(function(s) { return s.risk === 'critical'; });
        const high = SKUS.filter(function(s) { return s.risk === 'high' || s.risk === 'critical'; });
        return {
          text: "**" + critical.length + " SKUs** are at critical stockout risk (<1 day cover). " + high.length + " SKUs need reorder within 48 hours. Highest priority: SKU-B230 (Lithium-ion Cell) and SKU-D560 (Steel Sheet) — both have <0.5 days cover.",
          kpis: [
            { label: 'Critical SKUs', value: critical.length, accent: '#ef4444' },
            { label: 'High Risk', value: high.length, accent: '#f59e0b' },
            { label: 'Total SKUs', value: SKUS.length, accent: '#06B6D4' },
            { label: 'Avg Cover', value: Math.round(SKUS.reduce(function(s, x) { return s + x.cover; }, 0) / SKUS.length * 10) / 10 + 'd', accent: '#22c55e' }
          ],
          table: {
            title: 'SKUs at Risk',
            headers: ['SKU', 'Name', 'Stock', 'Days Cover', 'Risk', 'Supplier'],
            rows: SKUS.filter(function(s) { return s.risk !== 'low'; }).map(function(s) { return [s.sku, s.name, s.stock.toLocaleString(), s.cover + 'd', s.risk.toUpperCase(), s.supplier]; })
          },
          recommendation: 'Issue emergency PO for SKU-B230 (CATL) and SKU-D560 (POSCO). Activate spot buy authorization up to $250k.'
        };
      }
    },
    {
      id: 'summary',
      keywords: ['summary', 'brief', 'overview', 'digest', 'recap', 'summarize', 'generate a summary'],
      title: 'Operations Summary',
      module: 'Dispatch Dashboard',
      shortcut: 'D',
      respond: function() {
        return {
          text: "**Daily Operations Summary — " + formatDate(new Date()).substr(0, 10) + "**\n\nSupply chain is operating with **moderate elevated risk**. Active orders: " + ORDERS.length + " (total value " + formatCurrency(ORDERS.reduce(function(s, o) { return s + o.value; }, 0)) + "). " + VESSELS.filter(function(v) { return v.delay > 0; }).length + " of " + VESSELS.length + " vessels delayed. Demurrage exposure: " + formatCurrency(DEMURRAGE.reduce(function(s, d) { return s + d.total; }, 0)) + ". " + SKUS.filter(function(s) { return s.risk === 'critical'; }).length + " SKUs at critical stockout. Top risk: " + RISKS[1].title + ".",
          kpis: [
            { label: 'Active Orders', value: ORDERS.length, accent: '#06B6D4' },
            { label: 'Order Value', value: formatCurrency(ORDERS.reduce(function(s, o) { return s + o.value; }, 0)), accent: '#22c55e' },
            { label: 'Delayed Vessels', value: VESSELS.filter(function(v) { return v.delay > 0; }).length, accent: '#f59e0b' },
            { label: 'Critical SKUs', value: SKUS.filter(function(s) { return s.risk === 'critical'; }).length, accent: '#ef4444' }
          ],
          table: {
            title: 'Active Purchase Orders',
            headers: ['PO', 'Supplier', 'Value', 'Status', 'ETA', 'Items'],
            rows: ORDERS.map(function(o) { return [o.id, o.supplier, formatCurrency(o.value), o.status, o.eta, o.items]; })
          },
          recommendation: 'Three actions required today: (1) approve emergency SKU-B230 PO, (2) review LA demurrage pickup, (3) confirm CMA Phoenix cargo insurance.'
        };
      }
    },
    {
      id: 'suppliers',
      keywords: ['supplier', 'vendor', 'underperforming', 'performance', 'on-time'],
      title: 'Supplier Performance',
      module: 'Supplier Management',
      shortcut: 'S',
      respond: function() {
        const suppliers = [
          { name: 'Foxconn', otd: 92, quality: 98.4, spend: 4.2e6, tier: 1 },
          { name: 'TSMC', otd: 88, quality: 99.1, spend: 8.7e6, tier: 1 },
          { name: 'CATL', otd: 76, quality: 96.2, spend: 3.4e6, tier: 1 },
          { name: 'POSCO', otd: 84, quality: 95.8, spend: 2.1e6, tier: 2 },
          { name: 'Samsung SDI', otd: 95, quality: 99.3, spend: 5.1e6, tier: 1 },
          { name: 'Norsk Hydro', otd: 79, quality: 94.5, spend: 1.8e6, tier: 2 }
        ];
        const under = suppliers.filter(function(s) { return s.otd < 85; });
        return {
          text: "**" + under.length + " suppliers** are underperforming (OTD < 85%). CATL (76%), Norsk Hydro (79%), and POSCO (84%) need escalation. Combined annual spend with underperformers: " + formatCurrency(under.reduce(function(s, x) { return s + x.spend; }, 0)) + ".",
          kpis: [
            { label: 'Total Suppliers', value: suppliers.length, accent: '#06B6D4' },
            { label: 'Underperforming', value: under.length, accent: '#ef4444' },
            { label: 'Avg OTD', value: Math.round(suppliers.reduce(function(s, x) { return s + x.otd; }, 0) / suppliers.length) + '%', accent: '#f59e0b' },
            { label: 'Tier 1 Spend', value: formatCurrency(suppliers.filter(function(s) { return s.tier === 1; }).reduce(function(s, x) { return s + x.spend; }, 0)), accent: '#22c55e' }
          ],
          table: {
            title: 'Supplier Scorecard',
            headers: ['Supplier', 'OTD %', 'Quality %', 'Annual Spend', 'Tier', 'Status'],
            rows: suppliers.map(function(s) { return [s.name, s.otd + '%', s.quality + '%', formatCurrency(s.spend), 'T' + s.tier, s.otd < 85 ? '⚠ Underperforming' : '✓ On Track']; })
          },
          recommendation: 'Issue formal improvement notice to CATL. Schedule quarterly business review with Norsk Hydro within 2 weeks.'
        };
      }
    },
    {
      id: 'pending_pos',
      keywords: ['pending', 'po', 'purchase order', 'awaiting', 'approval', 'open orders'],
      title: 'Pending Purchase Orders',
      module: 'Order Management',
      shortcut: 'O',
      respond: function() {
        const big = ORDERS.filter(function(o) { return o.value > 1e6; });
        return {
          text: "**" + big.length + " POs** exceed $1M and require executive sign-off. Total pending value: " + formatCurrency(big.reduce(function(s, o) { return s + o.value; }, 0)) + ". Largest: PO-50456 (TSMC, " + formatCurrency(2850000) + ").",
          kpis: [
            { label: 'Open POs', value: ORDERS.length, accent: '#06B6D4' },
            { label: 'High Value', value: big.length, accent: '#f59e0b' },
            { label: 'Total Value', value: formatCurrency(ORDERS.reduce(function(s, o) { return s + o.value; }, 0)), accent: '#22c55e' },
            { label: 'Avg PO Value', value: formatCurrency(ORDERS.reduce(function(s, o) { return s + o.value; }, 0) / ORDERS.length), accent: '#8b5cf6' }
          ],
          table: {
            title: 'POs > $1M',
            headers: ['PO', 'Supplier', 'Value', 'Status', 'ETA', 'Items'],
            rows: big.map(function(o) { return [o.id, o.supplier, formatCurrency(o.value), o.status, o.eta, o.items]; })
          },
          recommendation: 'Expedite approval for PO-50789 (CATL at-risk status). Hold PO-50456 pending TSMC capacity confirmation.'
        };
      }
    },
    {
      id: 'approvals',
      keywords: ['approval', 'approve', 'my approval', 'sign off', 'today', 'inbox'],
      title: 'Pending Approvals',
      module: 'Autonomous Agent',
      shortcut: 'X',
      respond: function() {
        const approvals = [
          { id: 'AP-101', type: 'Carrier swap', amount: 145000, requester: 'AI Agent', age: '4h' },
          { id: 'AP-102', type: 'Emergency PO (CATL)', amount: 380000, requester: 'Procurement', age: '2h' },
          { id: 'AP-103', type: 'Demurrage waiver', amount: 62000, requester: 'Logistics', age: '8h' },
          { id: 'AP-104', type: 'Air freight upgrade', amount: 215000, requester: 'AI Agent', age: '1h' },
          { id: 'AP-105', type: 'Premium freight POSCO', amount: 88000, requester: 'Procurement', age: '6h' }
        ];
        return {
          text: "**" + approvals.length + " approvals** are awaiting your sign-off today. Total exposure: " + formatCurrency(approvals.reduce(function(s, a) { return s + a.amount; }, 0)) + ". 2 items are AI-proposed and need human review.",
          kpis: [
            { label: 'Pending', value: approvals.length, accent: '#f59e0b' },
            { label: 'AI-Proposed', value: 2, accent: '#8b5cf6' },
            { label: 'Total Value', value: formatCurrency(approvals.reduce(function(s, a) { return s + a.amount; }, 0)), accent: '#22c55e' },
            { label: 'Oldest', value: '8h', accent: '#ef4444' }
          ],
          table: {
            title: 'Approval Queue',
            headers: ['ID', 'Type', 'Amount', 'Requester', 'Age', 'Action'],
            rows: approvals.map(function(a) { return [a.id, a.type, formatCurrency(a.amount), a.requester, a.age, 'Approve / Reject']; })
          },
          recommendation: 'Priority: AP-102 (emergency CATL PO, 2h SLA breach risk). Review AI-proposed AP-101 and AP-104 within next hour.'
        };
      }
    },
    {
      id: 'forecast',
      keywords: ['forecast', 'demand', 'predict', 'next week', 'projection', 'planning'],
      title: 'Demand Forecast',
      module: 'Forecasting Space',
      shortcut: 'F',
      respond: function() {
        const fc = [
          { sku: 'SKU-A100', current: 12000, forecast: 13500, delta: '+12.5%' },
          { sku: 'SKU-B230', current: 45000, forecast: 52000, delta: '+15.6%' },
          { sku: 'SKU-C447', current: 9300, forecast: 8800, delta: '-5.4%' },
          { sku: 'SKU-D560', current: 18500, forecast: 19200, delta: '+3.8%' },
          { sku: 'SKU-E712', current: 13500, forecast: 14100, delta: '+4.4%' }
        ];
        return {
          text: "**7-day demand forecast** indicates a **+8.4% average demand increase** across top SKUs. SKU-B230 (Lithium-ion Cell) shows highest growth (+15.6%) — current cover is insufficient. SKU-C447 expected to soften (-5.4%).",
          kpis: [
            { label: 'Avg Forecast Δ', value: '+8.4%', accent: '#22c55e' },
            { label: 'Top Growth', value: 'SKU-B230', accent: '#06B6D4' },
            { label: 'SKUs Tracked', value: fc.length, accent: '#8b5cf6' },
            { label: 'Model Acc.', value: '94.2%', accent: '#f59e0b' }
          ],
          table: {
            title: '7-Day Demand Forecast',
            headers: ['SKU', 'Current Monthly', 'Forecast', 'Delta', 'Action'],
            rows: fc.map(function(f) { return [f.sku, f.current.toLocaleString(), f.forecast.toLocaleString(), f.delta, parseFloat(f.delta) > 10 ? '↑ Reorder' : '— Monitor']; })
          },
          recommendation: 'Trigger replenishment for SKU-B230 immediately. Reduce SKU-C447 next PO by 8%.'
        };
      }
    },
    {
      id: 'otd_compare',
      keywords: ['compare', 'last month', 'mom', 'month over month', 'on-time delivery', 'otd trend'],
      title: 'OTD Month-over-Month',
      module: 'Platform Analytics',
      shortcut: 'A',
      respond: function() {
        return {
          text: "**On-time delivery improved +3.2pp** vs last month (87.4% → 90.6%). Best improvement: Asia-Europe lane (+5.8pp). Worst: Transpacific (-2.1pp) due to LA port congestion.",
          kpis: [
            { label: 'Current OTD', value: '90.6%', accent: '#22c55e' },
            { label: 'Last Month', value: '87.4%', accent: '#94a3b8' },
            { label: 'Δ MoM', value: '+3.2pp', accent: '#22c55e' },
            { label: 'Target', value: '92%', accent: '#f59e0b' }
          ],
          table: {
            title: 'OTD by Lane',
            headers: ['Lane', 'Current', 'Last Month', 'Δ', 'Trend'],
            rows: [
              ['Asia → Europe', '93.1%', '87.3%', '+5.8pp', '↑ Improving'],
              ['Asia → US West', '85.2%', '87.3%', '-2.1pp', '↓ Declining'],
              ['Europe → US East', '91.4%', '88.2%', '+3.2pp', '↑ Improving'],
              ['Intra-Asia', '94.7%', '92.1%', '+2.6pp', '↑ Improving'],
              ['US → Europe', '88.9%', '87.0%', '+1.9pp', '↑ Improving']
            ]
          },
          recommendation: 'Investigate Transpacific decline. Apply Asia-Europe playbook learnings (carrier diversification).'
        };
      }
    },
    {
      id: 'ports',
      keywords: ['port', 'congestion', 'terminal', 'harbor', 'queue'],
      title: 'Port Congestion',
      module: 'Dispatch Dashboard',
      shortcut: 'D',
      respond: function() {
        const ports = [
          { name: 'Los Angeles / Long Beach', wait: 14, vessels: 38, severity: 'critical' },
          { name: 'Shanghai', wait: 9, vessels: 22, severity: 'high' },
          { name: 'Singapore', wait: 5, vessels: 18, severity: 'medium' },
          { name: 'Rotterdam', wait: 4, vessels: 12, severity: 'low' },
          { name: 'Hamburg', wait: 6, vessels: 9, severity: 'medium' },
          { name: 'Busan', wait: 3, vessels: 14, severity: 'low' }
        ];
        return {
          text: "**6 major ports** are currently congested. LA/LB is critical (14d wait, 38 vessels queued). Asia-Europe alternatives: Rotterdam (4d) and Busan (3d) have spare capacity.",
          kpis: [
            { label: 'Ports Tracked', value: ports.length, accent: '#06B6D4' },
            { label: 'Critical', value: ports.filter(function(p) { return p.severity === 'critical'; }).length, accent: '#ef4444' },
            { label: 'Total Vessels', value: ports.reduce(function(s, p) { return s + p.vessels; }, 0), accent: '#8b5cf6' },
            { label: 'Max Wait', value: '14d', accent: '#f59e0b' }
          ],
          table: {
            title: 'Port Congestion Map',
            headers: ['Port', 'Wait (days)', 'Vessels Queued', 'Severity'],
            rows: ports.map(function(p) { return [p.name, p.wait + 'd', p.vessels, p.severity.toUpperCase()]; })
          },
          recommendation: 'Reroute 30% of LA-bound cargo to Oakland. Pre-clear customs at origin for urgent shipments.'
        };
      }
    },
    {
      id: 'inventory_health',
      keywords: ['inventory', 'health', 'turns', 'turnover', 'carrying', 'days of supply'],
      title: 'Inventory Health',
      module: 'Forecasting Space',
      shortcut: 'F',
      respond: function() {
        return {
          text: "**Inventory health score: 78/100** (Good, down 4pts MoM). Turns: 8.4x (target 10x). Days of supply: 38 (target 32). $1.2M excess in slow-mover SKU-E712. Stockout risk on 2 SKUs.",
          kpis: [
            { label: 'Health Score', value: '78/100', accent: '#f59e0b' },
            { label: 'Inventory Turns', value: '8.4x', accent: '#06B6D4' },
            { label: 'Days of Supply', value: '38d', accent: '#8b5cf6' },
            { label: 'Excess Value', value: formatCurrency(1200000), accent: '#ef4444' }
          ],
          table: {
            title: 'Inventory Segmentation',
            headers: ['Segment', 'SKU Count', 'Value', 'Days Cover', 'Action'],
            rows: [
              ['Fast-moving', 18, formatCurrency(3200000), '12d', 'Replenish'],
              ['Standard', 42, formatCurrency(5800000), '32d', 'Maintain'],
              ['Slow-moving', 14, formatCurrency(2400000), '95d', 'Promote'],
              ['Excess/Obsolete', 6, formatCurrency(1200000), '180d+', 'Liquidate']
            ]
          },
          recommendation: 'Liquidate $1.2M excess within 30 days. Tighten reorder points on fast-movers to prevent lost sales.'
        };
      }
    },
    {
      id: 'cost_outlook',
      keywords: ['cost', 'outlook', 'budget', 'spend', 'quarter', 'financial'],
      title: 'Cost Outlook',
      module: 'Platform Analytics',
      shortcut: 'A',
      respond: function() {
        return {
          text: "**Q1 cost outlook: +4.8% vs budget.** Ocean freight +12% (Red Sea rerouting), steel +14%, labor +3.2%. Partially offset by FX gains (USD strength) and carrier contract renegotiation (-3%).",
          kpis: [
            { label: 'YTD Spend', value: formatCurrency(28400000), accent: '#06B6D4' },
            { label: 'vs Budget', value: '+4.8%', accent: '#ef4444' },
            { label: 'Freight Δ', value: '+12%', accent: '#f59e0b' },
            { label: 'FX Offset', value: '-2.1%', accent: '#22c55e' }
          ],
          table: {
            title: 'Cost Drivers (Q1)',
            headers: ['Category', 'Budget', 'Actual', 'Δ', 'Driver'],
            rows: [
              ['Ocean Freight', formatCurrency(4200000), formatCurrency(4704000), '+12%', 'Red Sea reroute'],
              ['Commodities', formatCurrency(6800000), formatCurrency(7752000), '+14%', 'Steel, lithium'],
              ['Warehousing', formatCurrency(2100000), formatCurrency(2163000), '+3%', 'Labor + storage'],
              ['Customs/Duty', formatCurrency(1800000), formatCurrency(1854000), '+3%', 'New tariffs'],
              ['Air Freight', formatCurrency(800000), formatCurrency(1240000), '+55%', 'Expedite mode shift']
            ]
          },
          recommendation: 'Lock 90-day steel contract. Negotiate volume rebates with top 3 carriers. Cap air freight at $1.2M.'
        };
      }
    },
    {
      id: 'exceptions',
      keywords: ['exception', 'attention', 'alert', 'issue', 'problem', 'incident'],
      title: 'Exceptions Requiring Attention',
      module: 'Compliance Monitoring',
      shortcut: 'C',
      respond: function() {
        const exc = [
          { id: 'EX-201', desc: 'PO-50456 TSMC delayed 6 days', sev: 'high', age: '4h' },
          { id: 'EX-202', desc: 'SKU-B230 stockout imminent', sev: 'critical', age: '2h' },
          { id: 'EX-203', desc: 'LA port demurrage > 14d', sev: 'high', age: '8h' },
          { id: 'EX-204', desc: 'Carrier MSC invoice variance $42k', sev: 'medium', age: '1d' },
          { id: 'EX-205', desc: 'POSCO quality NCR (3 lots)', sev: 'medium', age: '2d' },
          { id: 'EX-206', desc: 'CMA Phoenix cargo insurance lapse', sev: 'high', age: '6h' }
        ];
        return {
          text: "**" + exc.length + " exceptions** require attention. 1 critical (stockout), 3 high, 2 medium. Oldest open: 2 days. Auto-resolved today: 14.",
          kpis: [
            { label: 'Open', value: exc.length, accent: '#f59e0b' },
            { label: 'Critical', value: exc.filter(function(e) { return e.sev === 'critical'; }).length, accent: '#ef4444' },
            { label: 'High', value: exc.filter(function(e) { return e.sev === 'high'; }).length, accent: '#f59e0b' },
            { label: 'Resolved Today', value: 14, accent: '#22c55e' }
          ],
          table: {
            title: 'Exception Queue',
            headers: ['ID', 'Description', 'Severity', 'Age'],
            rows: exc.map(function(e) { return [e.id, e.desc, e.sev.toUpperCase(), e.age]; })
          },
          recommendation: 'Triage critical EX-202 first. Auto-escalate any exception >24h old to operations lead.'
        };
      }
    },
    {
      id: 'greeting',
      keywords: ['hello', 'hi', 'hey', 'help', 'what can you do'],
      title: 'How Can I Help?',
      module: '—',
      shortcut: '',
      respond: function() {
        return {
          text: "Hi! I'm your supply chain AI assistant. I can answer questions about risks, vessels, SKUs, demurrage, suppliers, costs, forecasts, and more. Try one of the suggestion chips below or ask me anything in natural language.",
          kpis: [
            { label: 'Intents Available', value: '15+', accent: '#8b5cf6' },
            { label: 'Modules Linked', value: '8', accent: '#06B6D4' },
            { label: 'Data Sources', value: '24', accent: '#22c55e' },
            { label: 'Response Time', value: '<1s', accent: '#f59e0b' }
          ],
          suggestionChips: SUGGESTIONS.slice(0, 6)
        };
      }
    }
  ];

  // ------------------------------------------------------------------
  // DATABASE INITIALIZATION
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.conversations) return db;
    db = {
      conversations: [],
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
  let currentView = 'chat';
  let isListening = false;
  let typingTimer = null;

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-nl-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-nl-styles';
    style.textContent = `
      .cc-nl-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10016; background: rgba(8,10,16,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-nl-sidebar { width: 220px; flex-shrink: 0; background: rgba(15,23,42,0.6); border-right: 1px solid rgba(255,255,255,0.06); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-nl-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; }
      .cc-nl-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
      .cc-nl-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-nl-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; font-family: inherit; }
      .cc-nl-nav-item:hover { background: rgba(255,255,255,0.03); color: #e2e8f0; }
      .cc-nl-nav-item.active { background: rgba(99,102,241,0.08); color: #8b5cf7; border-left-color: #8b5cf7; }
      .cc-nl-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-nl-nav-badge { margin-left: auto; font-size: 9px; padding: 1px 6px; border-radius: 8px; background: rgba(99,102,241,0.2); color: #a78bfa; font-weight: 700; }
      .cc-nl-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 60px 0 0; }
      .cc-nl-close { position: fixed; top: 16px; right: 20px; z-index: 10017; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-nl-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-nl-header { padding: 0 24px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .cc-nl-page-title { font-size: 18px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-nl-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf7); color: #fff; font-weight: 600; letter-spacing: 0.03em; }
      .cc-nl-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #8b5cf7; animation: cc-nl-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-nl-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-nl-content { flex: 1; overflow-y: auto; padding: 20px 24px; }
      .cc-nl-content::-webkit-scrollbar { width: 8px; }
      .cc-nl-content::-webkit-scrollbar-thumb { background: rgba(139,92,247,0.3); border-radius: 4px; }
      .cc-nl-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; margin: 12px 0; }
      .cc-nl-card { background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.15); border-radius: 8px; padding: 12px; }
      .cc-nl-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
      .cc-nl-card-value { font-size: 18px; font-weight: 800; color: #fff; }
      .cc-nl-msg { margin-bottom: 18px; }
      .cc-nl-msg-user { text-align: right; }
      .cc-nl-msg-bubble { display: inline-block; max-width: 80%; padding: 12px 16px; border-radius: 14px; font-size: 13px; line-height: 1.55; text-align: left; }
      .cc-nl-msg-user .cc-nl-msg-bubble { background: linear-gradient(135deg, #6366f1, #8b5cf7); color: #fff; border-bottom-right-radius: 4px; }
      .cc-nl-msg-ai .cc-nl-msg-bubble { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #e2e8f0; border-bottom-left-radius: 4px; }
      .cc-nl-msg-meta { font-size: 10px; color: #64748b; margin-top: 4px; }
      .cc-nl-msg-avatar { display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf7); color: #fff; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 8px; vertical-align: top; }
      .cc-nl-response-body { margin-top: 8px; }
      .cc-nl-response-text { font-size: 13px; line-height: 1.6; color: #cbd5e1; margin-bottom: 10px; white-space: pre-wrap; }
      .cc-nl-response-text strong { color: #fff; font-weight: 700; }
      .cc-nl-table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 8px 0; }
      .cc-nl-table th { text-align: left; padding: 6px 8px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .cc-nl-table td { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; }
      .cc-nl-table tr:hover td { background: rgba(99,102,241,0.04); }
      .cc-nl-rec { margin-top: 10px; padding: 10px 12px; background: rgba(245,158,11,0.06); border-left: 3px solid #f59e0b; border-radius: 6px; font-size: 12px; color: #fcd34d; }
      .cc-nl-rec strong { color: #f59e0b; }
      .cc-nl-link { margin-top: 10px; display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); border-radius: 6px; color: #a78bfa; font-size: 11px; font-weight: 600; cursor: pointer; text-decoration: none; }
      .cc-nl-link:hover { background: rgba(99,102,241,0.25); }
      .cc-nl-chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 24px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .cc-nl-chip { padding: 6px 12px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: 16px; color: #a78bfa; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
      .cc-nl-chip:hover { background: rgba(99,102,241,0.18); transform: translateY(-1px); }
      .cc-nl-quick { display: flex; gap: 8px; padding: 10px 24px; flex-wrap: wrap; }
      .cc-nl-quick-btn { padding: 8px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #cbd5e1; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; }
      .cc-nl-quick-btn:hover { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); }
      .cc-nl-input-bar { padding: 12px 24px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; gap: 8px; align-items: center; background: rgba(15,23,42,0.4); }
      .cc-nl-input { flex: 1; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(99,102,241,0.3); background: rgba(255,255,255,0.04); color: #fff; font-size: 13px; font-family: inherit; }
      .cc-nl-input:focus { outline: none; border-color: #8b5cf7; box-shadow: 0 0 0 3px rgba(139,92,247,0.15); }
      .cc-nl-send { padding: 12px 18px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf7); color: #fff; border: none; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; }
      .cc-nl-send:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99,102,241,0.4); }
      .cc-nl-voice { padding: 12px; border-radius: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; cursor: pointer; font-size: 16px; font-family: inherit; transition: all 0.2s; }
      .cc-nl-voice:hover { background: rgba(239,68,68,0.2); }
      .cc-nl-voice.listening { background: rgba(239,68,68,0.3); border-color: #ef4444; animation: cc-nl-pulse 1s ease-in-out infinite; }
      .cc-nl-typing { display: inline-flex; gap: 4px; padding: 12px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; border-bottom-left-radius: 4px; }
      .cc-nl-typing span { width: 8px; height: 8px; border-radius: 50%; background: #8b5cf7; animation: cc-nl-bounce 1.4s infinite ease-in-out both; }
      .cc-nl-typing span:nth-child(1) { animation-delay: -0.32s; }
      .cc-nl-typing span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes cc-nl-bounce { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1); } }
      .cc-nl-history-item { padding: 12px 16px; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
      .cc-nl-history-item:hover { background: rgba(99,102,241,0.05); border-color: rgba(99,102,241,0.3); }
      .cc-nl-history-q { font-size: 13px; font-weight: 600; color: #fff; }
      .cc-nl-history-meta { font-size: 10px; color: #64748b; margin-top: 4px; }
      .cc-nl-empty { text-align: center; padding: 60px 20px; color: #64748b; font-size: 13px; }
      .cc-nl-empty-icon { font-size: 48px; margin-bottom: 12px; }
      .cc-nl-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
      .cc-nl-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 10px; }
      @media (max-width: 767px) {
        .cc-nl-modal { flex-direction: column; }
        .cc-nl-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-nl-sidebar-brand { display: none; }
        .cc-nl-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-nl-nav-item.active { border-bottom-color: #8b5cf7; border-left-color: transparent; }
        .cc-nl-main { padding: 12px 0 0; }
        .cc-nl-content { padding: 14px; }
        .cc-nl-chips, .cc-nl-quick, .cc-nl-input-bar { padding-left: 14px; padding-right: 14px; }
        .cc-nl-cards { grid-template-columns: repeat(2, 1fr); }
        .cc-nl-msg-bubble { max-width: 92%; }
      }
      /* Light mode overrides */
      html:not(.dark) .cc-nl-modal { background: rgba(248,250,252,0.99); color: #1e293b; }
      html:not(.dark) .cc-nl-sidebar { background: rgba(241,245,249,0.8); border-right-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-nl-sidebar-title { color: #0f172a; }
      html:not(.dark) .cc-nl-nav-item { color: #64748b; }
      html:not(.dark) .cc-nl-nav-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
      html:not(.dark) .cc-nl-nav-item.active { background: rgba(99,102,241,0.08); color: #6366f1; }
      html:not(.dark) .cc-nl-page-title { color: #0f172a; }
      html:not(.dark) .cc-nl-header { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-nl-card { background: rgba(99,102,241,0.04); border-color: rgba(99,102,241,0.15); }
      html:not(.dark) .cc-nl-card-label { color: #64748b; }
      html:not(.dark) .cc-nl-card-value { color: #0f172a; }
      html:not(.dark) .cc-nl-msg-ai .cc-nl-msg-bubble { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.08); color: #1e293b; }
      html:not(.dark) .cc-nl-response-text { color: #334155; }
      html:not(.dark) .cc-nl-response-text strong { color: #0f172a; }
      html:not(.dark) .cc-nl-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-nl-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-nl-table tr:hover td { background: rgba(99,102,241,0.04); }
      html:not(.dark) .cc-nl-input { background: rgba(0,0,0,0.03); color: #1e293b; border-color: rgba(99,102,241,0.3); }
      html:not(.dark) .cc-nl-quick-btn { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.08); color: #475569; }
      html:not(.dark) .cc-nl-quick-btn:hover { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.2); }
      html:not(.dark) .cc-nl-chip { background: rgba(99,102,241,0.06); border-color: rgba(99,102,241,0.2); color: #6366f1; }
      html:not(.dark) .cc-nl-section { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-nl-section-title { color: #1e293b; }
      html:not(.dark) .cc-nl-history-item { border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-nl-history-item:hover { background: rgba(99,102,241,0.04); border-color: rgba(99,102,241,0.2); }
      html:not(.dark) .cc-nl-history-q { color: #0f172a; }
      html:not(.dark) .cc-nl-input-bar { background: rgba(241,245,249,0.6); border-top-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-nl-typing { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-nl-content::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    const db = initDatabase();
    const overlay = document.createElement('div');
    overlay.id = 'cc-nl-overlay';
    overlay.className = 'cc-nl-modal';
    overlay.innerHTML = `
      <button class="cc-nl-close" onclick="window.__ccNL.close()">×</button>
      <div class="cc-nl-sidebar">
        <div class="cc-nl-sidebar-brand">
          <div class="cc-nl-sidebar-title">💬 AI Chat Assistant</div>
          <div class="cc-nl-sidebar-sub">${INTENTS.length} intents · ${db.conversations.length} saved</div>
        </div>
        <button class="cc-nl-nav-item ${currentView === 'chat' ? 'active' : ''}" onclick="window.__ccNL.setView('chat')"><span class="cc-nl-nav-icon">💬</span> Chat</button>
        <button class="cc-nl-nav-item ${currentView === 'suggestions' ? 'active' : ''}" onclick="window.__ccNL.setView('suggestions')"><span class="cc-nl-nav-icon">💡</span> Suggestions</button>
        <button class="cc-nl-nav-item ${currentView === 'history' ? 'active' : ''}" onclick="window.__ccNL.setView('history')"><span class="cc-nl-nav-icon">📚</span> History ${db.conversations.length > 0 ? '<span class="cc-nl-nav-badge">' + db.conversations.length + '</span>' : ''}</button>
        <button class="cc-nl-nav-item ${currentView === 'intents' ? 'active' : ''}" onclick="window.__ccNL.setView('intents')"><span class="cc-nl-nav-icon">🧠</span> Capabilities</button>
        <button class="cc-nl-nav-item ${currentView === 'quick' ? 'active' : ''}" onclick="window.__ccNL.setView('quick')"><span class="cc-nl-nav-icon">⚡</span> Quick Actions</button>
      </div>
      <div class="cc-nl-main">
        <div class="cc-nl-header">
          <h2 class="cc-nl-page-title">💬 Natural Language Command <span class="cc-nl-page-badge">AI ASSISTANT</span></h2>
          <div style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#8b5cf7;font-weight:600">
            <div class="cc-nl-live-dot"></div> Online
          </div>
        </div>
        <div id="cc-nl-content-host"></div>
      </div>
    `;
    return overlay;
  }

  function renderContent() {
    const host = document.getElementById('cc-nl-content-host');
    if (!host) return;
    if (currentView === 'chat') renderChat(host);
    else if (currentView === 'suggestions') renderSuggestions(host);
    else if (currentView === 'history') renderHistory(host);
    else if (currentView === 'intents') renderIntents(host);
    else if (currentView === 'quick') renderQuick(host);
    document.querySelectorAll('.cc-nl-nav-item').forEach(function(item) {
      var onclick = item.getAttribute('onclick') || '';
      item.classList.toggle('active', onclick.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // CHAT VIEW
  // ------------------------------------------------------------------
  function renderChat(host) {
    const db = initDatabase();
    host.innerHTML = `
      <div class="cc-nl-content" id="cc-nl-msgs"></div>
      <div class="cc-nl-chips" id="cc-nl-chips-bar">
        ${SUGGESTIONS.slice(0, 5).map(function(s) { return '<button class="cc-nl-chip" onclick="window.__ccNL.ask(' + JSON.stringify(s) + ')">' + s + '</button>'; }).join('')}
      </div>
      <div class="cc-nl-input-bar">
        <input type="text" class="cc-nl-input" id="cc-nl-input" placeholder="Ask anything about your supply chain..." autocomplete="off" />
        <button class="cc-nl-voice" id="cc-nl-voice" title="Voice command (click and speak)" onclick="window.__ccNL.toggleVoice()">🎙️</button>
        <button class="cc-nl-send" onclick="window.__ccNL.sendInput()">Send <span style="font-size:14px">→</span></button>
      </div>
    `;
    const input = document.getElementById('cc-nl-input');
    if (input) {
      input.addEventListener('keydown', function(e) { if (e.key === 'Enter') window.__ccNL.sendInput(); });
    }
    const msgs = document.getElementById('cc-nl-msgs');
    if (msgs) {
      if (db.conversations.length === 0) {
        msgs.innerHTML = '<div class="cc-nl-empty"><div class="cc-nl-empty-icon">💬</div><div style="font-size:14px;color:#a78bfa;font-weight:700;margin-bottom:6px">Hi! I am your supply chain AI.</div><div>Ask me about risks, vessels, SKUs, costs, or pick a suggestion chip below.</div></div>';
      } else {
        db.conversations.forEach(function(c) { msgs.appendChild(buildMessageNode(c)); });
        msgs.scrollTop = msgs.scrollHeight;
      }
    }
  }

  function buildMessageNode(conv) {
    const wrap = document.createElement('div');
    wrap.className = 'cc-nl-msg cc-nl-msg-' + conv.role;
    if (conv.role === 'ai' && conv.response) {
      const r = conv.response;
      let body = '<div class="cc-nl-msg-bubble"><span class="cc-nl-msg-avatar">AI</span><div class="cc-nl-response-body" style="display:inline-block;width:calc(100% - 32px);vertical-align:top">';
      body += '<div class="cc-nl-response-text">' + (r.text || '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '</div>';
      if (r.kpis && r.kpis.length) {
        body += '<div class="cc-nl-cards">';
        r.kpis.forEach(function(k) {
          body += '<div class="cc-nl-card"><div class="cc-nl-card-label">' + k.label + '</div><div class="cc-nl-card-value" style="color:' + (k.accent || '#fff') + '">' + k.value + '</div></div>';
        });
        body += '</div>';
      }
      if (r.table) {
        body += '<div style="margin:8px 0;max-height:240px;overflow-y:auto;border:1px solid rgba(255,255,255,0.06);border-radius:6px">';
        body += '<table class="cc-nl-table"><thead><tr>' + r.table.headers.map(function(h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>';
        r.table.rows.forEach(function(row) {
          body += '<tr>' + row.map(function(c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
        });
        body += '</tbody></table></div>';
      }
      if (r.recommendation) body += '<div class="cc-nl-rec"><strong>💡 Recommendation:</strong> ' + r.recommendation + '</div>';
      if (r.suggestionChips && r.suggestionChips.length) {
        body += '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">';
        r.suggestionChips.forEach(function(s) { body += '<button class="cc-nl-chip" onclick="window.__ccNL.ask(' + JSON.stringify(s) + ')">' + s + '</button>'; });
        body += '</div>';
      }
      if (r.module && r.module !== '—') {
        body += '<a class="cc-nl-link" onclick="window.__ccNL.openModule(\'' + r.module + '\', \'' + (r.shortcut || '') + '\')">↗ View in ' + r.module + '</a>';
      }
      body += '</div></div>';
      wrap.innerHTML = body + '<div class="cc-nl-msg-meta">' + formatDate(conv.ts) + '</div>';
    } else if (conv.role === 'user') {
      wrap.innerHTML = '<div class="cc-nl-msg-bubble">' + escapeHtml(conv.text) + '</div><div class="cc-nl-msg-meta">' + formatDate(conv.ts) + '</div>';
    } else if (conv.role === 'typing') {
      wrap.innerHTML = '<div class="cc-nl-typing"><span></span><span></span><span></span></div>';
    }
    return wrap;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function sendInput() {
    const input = document.getElementById('cc-nl-input');
    if (!input || !input.value.trim()) return;
    ask(input.value.trim());
    input.value = '';
  }

  function ask(text) {
    if (!text) return;
    const db = initDatabase();
    const userMsg = { role: 'user', text: text, ts: new Date().toISOString() };
    db.conversations.push(userMsg);
    saveDB(db);
    if (currentView !== 'chat') setView('chat');
    setTimeout(function() {
      const msgs = document.getElementById('cc-nl-msgs');
      if (!msgs) return;
      msgs.appendChild(buildMessageNode(userMsg));
      const typingMsg = { role: 'typing', ts: new Date().toISOString() };
      const typingNode = buildMessageNode(typingMsg);
      msgs.appendChild(typingNode);
      msgs.scrollTop = msgs.scrollHeight;
      setTimeout(function() {
        typingNode.remove();
        const response = matchIntent(text);
        const aiMsg = { role: 'ai', text: text, response: response, ts: new Date().toISOString() };
        db.conversations.push(aiMsg);
        saveDB(db);
        msgs.appendChild(buildMessageNode(aiMsg));
        msgs.scrollTop = msgs.scrollHeight;
      }, 700 + Math.random() * 600);
    }, 50);
  }

  function matchIntent(text) {
    const q = text.toLowerCase();
    let best = null;
    let bestScore = 0;
    INTENTS.forEach(function(intent) {
      let score = 0;
      intent.keywords.forEach(function(kw) {
        if (q.indexOf(kw) !== -1) score += kw.split(' ').length;
      });
      if (score > bestScore) { bestScore = score; best = intent; }
    });
    if (best && bestScore > 0) return best.respond();
    return {
      text: "I'm not sure I understood that. I can help with risks, vessels, SKUs, demurrage, suppliers, costs, forecasts, and more. Try one of the suggestion chips or ask 'What can you do?'.",
      kpis: [
        { label: 'Try Asking', value: 'Show delayed vessels', accent: '#8b5cf7' },
        { label: 'Or', value: "What's our biggest risk?", accent: '#ef4444' }
      ],
      suggestionChips: SUGGESTIONS.slice(0, 4)
    };
  }

  function openModule(name, shortcut) {
    close();
    if (shortcut && window.__ccShortcuts && window.__ccShortcuts[shortcut]) {
      window.__ccShortcuts[shortcut]();
    }
  }

  // ------------------------------------------------------------------
  // SUGGESTIONS VIEW
  // ------------------------------------------------------------------
  function renderSuggestions(host) {
    host.innerHTML = '<div class="cc-nl-content"><div class="cc-nl-section"><div class="cc-nl-section-title">💡 Try one of these questions</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">' +
      SUGGESTIONS.map(function(s) {
        return '<button class="cc-nl-history-item" style="text-align:left" onclick="window.__ccNL.ask(' + JSON.stringify(s) + ')"><div class="cc-nl-history-q">💬 ' + s + '</div></button>';
      }).join('') +
      '</div></div></div>';
  }

  // ------------------------------------------------------------------
  // HISTORY VIEW
  // ------------------------------------------------------------------
  function renderHistory(host) {
    const db = initDatabase();
    host.innerHTML = '<div class="cc-nl-content">' +
      (db.conversations.length === 0
        ? '<div class="cc-nl-empty"><div class="cc-nl-empty-icon">📚</div>No conversation history yet. Start chatting to see your history here.</div>'
        : '<div class="cc-nl-section"><div class="cc-nl-section-title">📚 Conversation History (' + db.conversations.length + ')</div>' +
          db.conversations.slice().reverse().map(function(c) {
            if (c.role === 'user') {
              return '<div class="cc-nl-history-item" onclick="window.__ccNL.ask(' + JSON.stringify(c.text) + ')"><div class="cc-nl-history-q">🙋 ' + escapeHtml(c.text) + '</div><div class="cc-nl-history-meta">' + formatDate(c.ts) + '</div></div>';
            }
            if (c.role === 'ai' && c.response) {
              return '<div class="cc-nl-history-item"><div class="cc-nl-history-q">🤖 ' + escapeHtml((c.response.title || 'AI Response')) + '</div><div class="cc-nl-history-meta">' + formatDate(c.ts) + (c.response.module && c.response.module !== '—' ? ' · ' + c.response.module : '') + '</div></div>';
            }
            return '';
          }).join('') +
          '<div style="margin-top:12px"><button class="cc-nl-chip" style="background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);color:#ef4444" onclick="window.__ccNL.clearHistory()">🗑 Clear History</button></div>'
      ) +
      '</div>';
  }

  function clearHistory() {
    const db = initDatabase();
    db.conversations = [];
    saveDB(db);
    renderContent();
  }

  // ------------------------------------------------------------------
  // INTENTS / CAPABILITIES VIEW
  // ------------------------------------------------------------------
  function renderIntents(host) {
    host.innerHTML = '<div class="cc-nl-content"><div class="cc-nl-section"><div class="cc-nl-section-title">🧠 AI Capabilities — ' + INTENTS.length + ' Intents</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">' +
      INTENTS.map(function(i) {
        return '<div class="cc-nl-history-item" onclick="window.__ccNL.ask(\'' + (i.keywords[0] || 'hello') + '\')"><div class="cc-nl-history-q">' + i.title + '</div><div class="cc-nl-history-meta">Keywords: ' + i.keywords.slice(0, 4).join(', ') + (i.module && i.module !== '—' ? ' · Module: ' + i.module : '') + '</div></div>';
      }).join('') +
      '</div></div></div>';
  }

  // ------------------------------------------------------------------
  // QUICK ACTIONS VIEW
  // ------------------------------------------------------------------
  function renderQuick(host) {
    host.innerHTML = '<div class="cc-nl-content"><div class="cc-nl-section"><div class="cc-nl-section-title">⚡ Quick Actions</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">' +
      QUICK_ACTIONS.map(function(a) {
        return '<button class="cc-nl-quick-btn" style="justify-content:center;padding:16px" onclick="window.__ccNL.ask(' + JSON.stringify(a.query) + ')"><span style="font-size:24px">' + a.icon + '</span><div><div style="font-size:12px;color:#fff;font-weight:700">' + a.label + '</div><div style="font-size:10px;color:#64748b">Tap to run</div></div></button>';
      }).join('') +
      '</div></div></div>';
  }

  // ------------------------------------------------------------------
  // VOICE COMMAND (Web Speech API)
  // ------------------------------------------------------------------
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = document.getElementById('cc-nl-voice');
    if (!SR) {
      alert('Voice recognition not supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (isListening) {
      isListening = false;
      if (btn) btn.classList.remove('listening');
      if (window.__ccNL_recog) window.__ccNL_recog.stop();
      return;
    }
    const recog = new SR();
    window.__ccNL_recog = recog;
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onstart = function() {
      isListening = true;
      if (btn) { btn.classList.add('listening'); btn.innerHTML = '🔴'; }
    };
    recog.onresult = function(e) {
      const transcript = e.results[0][0].transcript;
      const input = document.getElementById('cc-nl-input');
      if (input) input.value = transcript;
      ask(transcript);
    };
    recog.onerror = function(e) {
      alert('Voice recognition error: ' + e.error);
    };
    recog.onend = function() {
      isListening = false;
      if (btn) { btn.classList.remove('listening'); btn.innerHTML = '🎙️'; }
    };
    recog.start();
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-nl-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-nl-overlay');
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
    window.__ccNL = { open: open, close: close, setView: setView, ask: ask, sendInput: sendInput, toggleVoice: toggleVoice, openModule: openModule, clearHistory: clearHistory };

    function injectButton() {
      if (document.getElementById('cc-nl-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-nl-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 560px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #6366f1, #8b5cf7)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg> AI Chat';
      btn.setAttribute('aria-label', 'Open AI chat assistant');
      btn.title = 'Open AI Chat (press N)';
      btn.onclick = open;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-nl-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-nl-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 6000); });
    } else {
      setTimeout(tryInject, 6000);
    }

    document.addEventListener('keydown', function(e) {
      if ((e.key === 'n' || e.key === 'N') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-nl-overlay')) { open(); e.preventDefault(); }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
