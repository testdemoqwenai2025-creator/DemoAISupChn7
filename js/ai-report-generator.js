// ====================================================================
// ai-report-generator.js — Generative AI Report Generation
// ====================================================================
// AI-powered report writer that synthesizes natural-language insights:
//   1. Sidebar with 6 report types (Weekly Ops, Monthly, Risk, Financial, Supplier, Exec Briefing)
//   2. "Generate Report" button simulates AI synthesis with loading animation
//   3. Loading messages: "Analyzing 847 suppliers... Synthesizing 156 orders..."
//   4. Generated reports include: exec summary, KPIs, anomalies, recommendations, financials
//   5. Report displayed as formatted document (paragraphs of insights, not tables)
//   6. Export to clipboard / text download
//   7. Report history persisted to localStorage
//
// Architecture: reuses IIFE + modal + sidebar patterns from api-marketplace.js
// CSS prefix: cc-rg-  ·  Floating button: emerald/teal gradient, shortcut "G"
// ====================================================================
(function() {
  'use strict';

  if (window.__aiReportLoaded) return;
  window.__aiReportLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_ai_report_db_v1';

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(a) {
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'k';
    return '$' + a.toFixed(0);
  }

  // ------------------------------------------------------------------
  // REPORT TYPES
  // ------------------------------------------------------------------
  const REPORT_TYPES = [
    { id: 'weekly', name: 'Weekly Operations', icon: '📅', desc: 'Weekly operations performance review with KPIs and exceptions', est_time: '~30s' },
    { id: 'monthly', name: 'Monthly Summary', icon: '🗓️', desc: 'Comprehensive monthly supply chain performance digest', est_time: '~45s' },
    { id: 'risk', name: 'Risk Assessment', icon: '⚠️', desc: 'Risk register analysis with mitigation recommendations', est_time: '~25s' },
    { id: 'financial', name: 'Financial Impact', icon: '💰', desc: 'Cost analysis, freight spend, and margin impact assessment', est_time: '~35s' },
    { id: 'supplier', name: 'Supplier Performance', icon: '🏭', desc: 'Supplier scorecard with quality, delivery, and risk metrics', est_time: '~30s' },
    { id: 'exec', name: 'Executive Briefing', icon: '👔', desc: 'C-suite briefing with strategic recommendations and outlook', est_time: '~50s' }
  ];

  // ------------------------------------------------------------------
  // LOADING MESSAGES (cycled during generation)
  // ------------------------------------------------------------------
  const LOADING_STEPS = [
    'Initializing AI synthesis engine...',
    'Analyzing 847 suppliers...',
    'Synthesizing 156 active orders...',
    'Evaluating 10 global ports...',
    'Cross-referencing 4,218 inventory SKUs...',
    'Aggregating 28 risk indicators...',
    'Processing 1,245 vessel movements...',
    'Computing 12 currency exposures...',
    'Evaluating 6 trade lane scenarios...',
    'Detecting anomalies across 9 dimensions...',
    'Generating strategic insights...',
    'Composing executive narrative...',
    'Validating recommendations against policy...',
    'Formatting final document...',
    'Finalizing report...'
  ];

  // ------------------------------------------------------------------
  // REPORT TEMPLATES (per type)
  // ------------------------------------------------------------------
  const TEMPLATES = {
    weekly: function() {
      return {
        title: 'Weekly Operations Performance Review',
        period: 'Week of ' + new Date(Date.now() - 7 * 86400000).toISOString().substr(0, 10) + ' to ' + new Date().toISOString().substr(0, 10),
        exec_summary: "Supply chain operations this week maintained an overall health index of 84/100, a modest 2-point improvement from the prior week. On-time delivery performance held at 90.6%, slightly above the 90% target, while transit-time variability decreased 4% week-over-week. Three operational exceptions required intervention: a 12-day delay on the CMA Phoenix vessel, an imminent stockout on SKU-B230 (Lithium-ion Cell), and an abnormal demurrage buildup at Los Angeles / Long Beach reaching 14 container-days. All three were triaged and mitigation actions are underway. The autonomous agent executed 47 decisions this week with 94% confidence and a 91% success rate, generating an estimated $284k in cost avoidance.",
        kpis: [
          { label: 'On-Time Delivery', value: '90.6%', delta: '+1.2pp WoW', positive: true },
          { label: 'Inventory Turns', value: '8.4x', delta: '+0.3x WoW', positive: true },
          { label: 'Demurrage Cost', value: formatCurrency(335400), delta: '+18% WoW', positive: false },
          { label: 'Agent Decisions', value: '47', delta: '+12 vs prior', positive: true }
        ],
        anomalies: [
          'CMA Phoenix (VSL-9930) accumulated 12 days delay due to Singapore bunkering stop — root cause: fuel procurement dispute with bunker supplier.',
          'SKU-B230 stock dropped to 240 units (0.4 day cover) vs target 14 days. Demand spike of +15.6% week-over-week from EV product line.',
          'Los Angeles / Long Beach queue reached 38 vessels — PortWatch congestion index hit 8.7 (critical threshold = 7.0).',
          'Air freight spend spiked 55% over budget as procurement expedited 8 critical SKUs via air to prevent production line stoppage.'
        ],
        recommendations: [
          { priority: 'High', text: 'Activate Tier-2 supplier LG Energy as backup for SKU-B230 within 72 hours. Establish 14-day safety stock target.' },
          { priority: 'High', text: 'Reroute 35% of LA-bound cargo to Oakland for the next 2 weeks. Pre-clear customs at origin for urgent shipments.' },
          { priority: 'Medium', text: 'Issue formal improvement notice to CATL for OTD performance (76% vs 90% SLA). Schedule QBR within 14 days.' },
          { priority: 'Medium', text: 'Lock 90-day steel contract with POSCO at current spot to hedge against further HRC price increases (+14% YTD).' },
          { priority: 'Low', text: 'Review carrier diversification strategy — Asia-Europe lane improved +5.8pp by adding ONE as third carrier.' }
        ],
        financial: {
          revenue_impact: formatCurrency(4280000),
          cost_avoidance: formatCurrency(284000),
          excess_spend: formatCurrency(472000),
          net_position: formatCurrency(4280000 - 472000 + 284000)
        },
        risk_level: 'ELEVATED — 5 active risks, 1 critical',
        action_items: [
          'Approve emergency PO for SKU-B230 (CATL) — $380k, due in 48h',
          'Confirm CMA Phoenix cargo insurance coverage renewal',
          'Sign Oakland routing amendment with carrier MSC',
          'Review air freight spend cap with CFO'
        ]
      };
    },
    monthly: function() {
      return {
        title: 'Monthly Supply Chain Performance Digest',
        period: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        exec_summary: "Monthly supply chain performance reflected a transitional period marked by Red Sea routing disruptions and tightening inventory positions across critical components. Aggregate on-time delivery improved 3.2 percentage points month-over-month to 90.6%, driven primarily by carrier diversification on Asia-Europe lanes. However, Transpacific performance deteriorated 2.1pp due to LA port congestion. Total monthly spend reached $9.4M, +4.8% versus budget, with the largest variance in ocean freight (+12%) and air freight (+55%). Inventory turns improved to 8.4x from 8.1x, but $1.2M in excess slow-mover inventory was identified for liquidation. The autonomous agent executed 186 decisions this month with an aggregate value impact of $1.24M.",
        kpis: [
          { label: 'Monthly Spend', value: formatCurrency(9400000), delta: '+4.8% vs budget', positive: false },
          { label: 'OTD Rate', value: '90.6%', delta: '+3.2pp MoM', positive: true },
          { label: 'Inventory Turns', value: '8.4x', delta: '+0.3x MoM', positive: true },
          { label: 'Agent Value', value: formatCurrency(1240000), delta: '+22% MoM', positive: true }
        ],
        anomalies: [
          'Air freight spend exceeded budget by 55% due to 8 expedited shipments — net production line stoppage avoidance of $2.1M.',
          'POSCO issued 3 quality non-conformance reports (NCRs) on galvanized steel — investigating root cause with supplier.',
          'Carrier MSC invoice variance of $42k detected — billing dispute over demurrage-related accessorial charges.',
          'CMA Phoenix cargo insurance lapsed 6 hours during voyage — coverage restored, but exposure window identified.'
        ],
        recommendations: [
          { priority: 'High', text: 'Establish air freight spend cap at $1.2M with weekly tracking dashboard shared with CFO.' },
          { priority: 'High', text: 'Diversify Tier-1 critical component suppliers — single-source dependency on CATL represents $4.2M exposure.' },
          { priority: 'Medium', text: 'Liquidate $1.2M excess/obsolete inventory within 30 days via secondary market channels.' },
          { priority: 'Medium', text: 'Implement automated cargo insurance verification protocol with real-time carrier integration.' },
          { priority: 'Low', text: 'Pilot blockchain-based freight invoice reconciliation with MSC to reduce billing disputes.' }
        ],
        financial: {
          revenue_impact: formatCurrency(14700000),
          cost_avoidance: formatCurrency(1240000),
          excess_spend: formatCurrency(812000),
          net_position: formatCurrency(14700000 - 812000 + 1240000)
        },
        risk_level: 'MODERATE — 5 active risks, downward trajectory',
        action_items: [
          'Approve $1.2M air freight cap (CFO sign-off)',
          'Initiate LG Energy supplier qualification (60-day plan)',
          'Launch excess inventory liquidation program',
          'Schedule POSCO root-cause review meeting'
        ]
      };
    },
    risk: function() {
      return {
        title: 'Risk Assessment Report',
        period: 'As of ' + new Date().toISOString().substr(0, 10),
        exec_summary: "The supply chain risk profile is currently rated ELEVATED with 5 active risks across 5 categories (Logistics, Supplier, Geopolitical, Financial, Commodity). The single critical risk is single-source dependency on CATL for lithium-ion cells ($4.2M exposure, 42% likelihood of disruption). Aggregate expected monetary value (EMV) of all risks is $5.46M. Three risks are trending upward (Red Sea disruption, USD/CNY volatility, steel prices), while one is trending down (LA port congestion expected to ease in Q2). Recommended posture: maintain current mitigation playbook but accelerate Tier-2 supplier qualification for CATL.",
        kpis: [
          { label: 'Active Risks', value: '5', delta: '1 critical, 2 high', positive: false },
          { label: 'Aggregate EMV', value: formatCurrency(5460000), delta: '+8% MoM', positive: false },
          { label: 'Mitigation Coverage', value: '78%', delta: '+4pp MoM', positive: true },
          { label: 'Risk Velocity', value: 'Elevated', delta: '3 trending up', positive: false }
        ],
        anomalies: [
          'CATL single-source risk EMV increased $620k MoM due to demand growth from EV product line.',
          'Red Sea disruption likelihood revised up from 55% to 65% based on geopolitical intelligence.',
          'USD/CNY hedge coverage gap identified — only 40% of Q1 exposure is hedged vs 60% target.',
          'POSCO quality NCRs may indicate systemic supplier health deterioration — monitoring closely.'
        ],
        recommendations: [
          { priority: 'Critical', text: 'QUALIFY LG ENERGY AS TIER-2 SUPPLIER WITHIN 60 DAYS. Single-source dependency on CATL represents unacceptable risk to $4.2M revenue stream.' },
          { priority: 'High', text: 'Increase USD/CNY hedge ratio from 40% to 60% via 90-day forward contracts. Cost: ~$45k premium, protects $980k exposure.' },
          { priority: 'High', text: 'Activate Cape of Good Hope fallback routing for 25% of Asia-Europe volume. Adds 7 days transit but de-risks Red Sea chokepoint.' },
          { priority: 'Medium', text: 'Lock 90-day steel contract (HRC) at current spot to hedge against further commodity price increases.' },
          { priority: 'Medium', text: 'Increase LA/LB demurrage monitoring frequency from daily to 4x daily during congestion period.' }
        ],
        financial: {
          revenue_impact: formatCurrency(0),
          cost_avoidance: formatCurrency(3200000),
          excess_spend: formatCurrency(5460000),
          net_position: formatCurrency(-2260000)
        },
        risk_level: 'ELEVATED — immediate action required on critical risk',
        action_items: [
          'Initiate LG Energy supplier qualification (procurement lead)',
          'Execute USD/CNY hedge increase (treasury)',
          'Activate Cape routing for 25% Asia-Europe volume (logistics)',
          'Lock POSCO steel contract (procurement)'
        ]
      };
    },
    financial: function() {
      return {
        title: 'Financial Impact Assessment',
        period: 'Q1 ' + new Date().getFullYear(),
        exec_summary: "Q1 financial performance is tracking 4.8% over budget with $9.4M total spend against $8.97M budgeted. The primary cost drivers are ocean freight (+12% / +$504k) due to Red Sea rerouting, commodities (+14% / +$952k) driven by steel and lithium price increases, and a 55% spike in air freight due to expedite mode shifts. Partial offsets include favorable FX movement (-$200k) and carrier contract renegotiation savings (-3% / -$126k). Net Q1 outlook: $472k unfavorable variance to budget. Margin impact is approximately 0.4pp on gross margin. Recommended corrective actions could recover approximately $480k of variance in Q2.",
        kpis: [
          { label: 'Q1 Spend', value: formatCurrency(9400000), delta: '+4.8% vs budget', positive: false },
          { label: 'Freight Variance', value: '+$504k', delta: '+12% vs budget', positive: false },
          { label: 'Commodity Variance', value: '+$952k', delta: '+14% vs budget', positive: false },
          { label: 'FX Offset', value: '-$200k', delta: 'Favorable', positive: true }
        ],
        anomalies: [
          'Air freight line item exceeded budget by 55% — single largest variance contributor.',
          'Steel (HRC) commodity up 14% QoQ, exceeding hedge protection window.',
          'Carrier MSC invoice variance of $42k indicates systemic billing process issue.',
          'Customs duty line item +3% — new Section 301 tariff batch effective Feb 1.'
        ],
        recommendations: [
          { priority: 'High', text: 'Cap air freight at $1.2M for Q2 with weekly tracking dashboard shared with CFO.' },
          { priority: 'High', text: 'Lock 90-day steel contract with POSCO to hedge against further HRC increases.' },
          { priority: 'Medium', text: 'Negotiate volume rebates with top 3 ocean carriers (Maersk, MSC, CMA CGM) targeting 3-5% rate reduction.' },
          { priority: 'Medium', text: 'Implement freight invoice auto-reconciliation to prevent billing disputes ($42k MSC variance).' },
          { priority: 'Low', text: 'Evaluate bonded warehousing strategy to defer customs duty on slow-moving inventory.' }
        ],
        financial: {
          revenue_impact: formatCurrency(28400000),
          cost_avoidance: formatCurrency(480000),
          excess_spend: formatCurrency(472000),
          net_position: formatCurrency(28400000 - 472000 + 480000)
        },
        risk_level: 'WATCH — Q2 variance recovery plan in place',
        action_items: [
          'Approve Q2 air freight cap (CFO)',
          'Execute 90-day steel hedge (procurement)',
          'Initiate carrier rate renegotiation (procurement)',
          'Deploy invoice reconciliation automation (IT + finance)'
        ]
      };
    },
    supplier: function() {
      return {
        title: 'Supplier Performance Report',
        period: 'Rolling 90 days ending ' + new Date().toISOString().substr(0, 10),
        exec_summary: "Supplier portfolio performance is generally stable with 3 of 6 Tier-1 suppliers exceeding OTD targets. However, CATL (76% OTD), Norsk Hydro (79%), and POSCO (84%) are underperforming against the 85% SLA threshold. Quality metrics remain strong across the portfolio with average 97.4% quality acceptance rate, though POSCO showed a recent dip with 3 NCRs in February. Total Tier-1 spend is $21.4M annually with concentration risk in TSMC (41% of Tier-1 spend) and Samsung SDI (24%). Recommended action: formal improvement notice to CATL, QBR with Norsk Hydro, and continue monitoring POSCO quality trend.",
        kpis: [
          { label: 'Avg OTD', value: '85.7%', delta: '-1.2pp QoQ', positive: false },
          { label: 'Avg Quality', value: '97.4%', delta: '+0.3pp QoQ', positive: true },
          { label: 'Tier-1 Spend', value: formatCurrency(21400000), delta: '6 suppliers', positive: true },
          { label: 'Underperformers', value: '3', delta: '+1 QoQ', positive: false }
        ],
        anomalies: [
          'CATL OTD dropped to 76% (lowest in portfolio) — investigating capacity constraint and order prioritization.',
          'POSCO quality acceptance fell to 95.8% with 3 NCRs in February — galvanized steel surface defects.',
          'Norsk Hydro aluminum delivery delays traced to Norwegian smelter maintenance outage.',
          'TSMC order lead times extended from 8 to 11 weeks — fab capacity allocation dispute.'
        ],
        recommendations: [
          { priority: 'High', text: 'Issue formal Supplier Improvement Notice (SIN) to CATL with 30-day performance plan and exit criteria.' },
          { priority: 'High', text: 'Qualify LG Energy as Tier-2 backup for CATL — reduces $4.2M single-source exposure.' },
          { priority: 'Medium', text: 'Schedule QBR with Norsk Hydro within 14 days to address OTD decline and review recovery plan.' },
          { priority: 'Medium', text: 'Dispatch quality engineer to POSCO Pohang plant for root-cause investigation on galvanized steel defects.' },
          { priority: 'Low', text: 'Diversify TSMC allocation across fabs (Fab 14, Fab 18) to mitigate lead-time extension risk.' }
        ],
        financial: {
          revenue_impact: formatCurrency(21400000),
          cost_avoidance: formatCurrency(680000),
          excess_spend: formatCurrency(420000),
          net_position: formatCurrency(21400000 - 420000 + 680000)
        },
        risk_level: 'MODERATE — concentration and single-source risks active',
        action_items: [
          'Issue CATL Supplier Improvement Notice (procurement lead)',
          'Initiate LG Energy qualification (engineering)',
          'Schedule Norsk Hydro QBR (procurement)',
          'Dispatch POSCO quality audit (quality team)'
        ]
      };
    },
    exec: function() {
      return {
        title: 'Executive Briefing — C-Suite Edition',
        period: 'Quarterly review — ' + new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        exec_summary: "The supply chain organization delivered solid operational performance this quarter despite elevated external headwinds. On-time delivery improved 3.2pp to 90.6%, inventory turns accelerated to 8.4x, and the autonomous agent generated $1.24M in verified value impact. However, the quarter was marked by significant cost pressure (+4.8% vs budget) driven by Red Sea routing disruptions, commodity inflation (steel +14%, lithium +18%), and an air-freight spike (+55%) used to protect production continuity. The strategic outlook is cautiously optimistic: carrier diversification is showing measurable benefits, the autonomous agent maturity is enabling faster decision velocity, and Tier-2 supplier qualification programs are de-risking critical dependencies. Three strategic decisions are recommended for executive endorsement.",
        kpis: [
          { label: 'Quarter Spend', value: formatCurrency(28400000), delta: '+4.8% vs budget', positive: false },
          { label: 'Value Generated', value: formatCurrency(1240000), delta: '+22% QoQ', positive: true },
          { label: 'OTD Performance', value: '90.6%', delta: '+3.2pp QoQ', positive: true },
          { label: 'Risk Exposure', value: formatCurrency(5460000), delta: '+8% QoQ', positive: false }
        ],
        anomalies: [
          'Air freight line item exceeded budget by 55% — executive review recommended on expedite governance.',
          'Single-source dependency on CATL represents $4.2M revenue exposure with rising likelihood.',
          'Red Sea disruption now assessed at 65% likelihood — Cape routing fallback mandatory.',
          'POSCO quality NCR trend may indicate broader Tier-2 supplier health deterioration.'
        ],
        recommendations: [
          { priority: 'Strategic', text: 'APPROVE $4.8M TIER-2 SUPPLIER QUALIFICATION PROGRAM — de-risks $12.4M in single-source exposure across 4 critical components. ROI: 2.6x over 24 months.' },
          { priority: 'Strategic', text: 'AUTHORIZE AUTONOMOUS AGENT LEVEL-3 EXPANSION — extends decision autonomy to procurement under $250k. Estimated $1.8M annual value uplift with maintained safety record.' },
          { priority: 'Strategic', text: 'INVEST IN CARRIER DIVERSIFICATION ($1.2M) — adds ONE and HMM as primary carriers on Asia-Europe. Reduces concentration risk, expected +2pp OTD improvement.' },
          { priority: 'High', text: 'Establish quarterly supply chain risk review cadence at board level.' },
          { priority: 'Medium', text: 'Pilot blockchain-based freight invoice reconciliation to recover $42k MSC variance class.' }
        ],
        financial: {
          revenue_impact: formatCurrency(112000000),
          cost_avoidance: formatCurrency(3120000),
          excess_spend: formatCurrency(1284000),
          net_position: formatCurrency(112000000 - 1284000 + 3120000)
        },
        risk_level: 'ELEVATED — strategic decisions required within 30 days',
        action_items: [
          'Board approval: Tier-2 qualification program ($4.8M / 24-month ROI)',
          'Board approval: Autonomous agent Level-3 expansion',
          'Board approval: Carrier diversification investment ($1.2M)',
          'Establish quarterly supply chain board risk review'
        ]
      };
    }
  };

  // ------------------------------------------------------------------
  // DATABASE INITIALIZATION
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.reports) return db;
    db = {
      reports: [],
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
  let currentView = 'home';
  let generating = false;
  let generationTimer = null;

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-rg-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-rg-styles';
    style.textContent = `
      .cc-rg-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10018; background: rgba(8,10,16,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-rg-sidebar { width: 220px; flex-shrink: 0; background: rgba(15,23,42,0.6); border-right: 1px solid rgba(255,255,255,0.06); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-rg-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; }
      .cc-rg-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
      .cc-rg-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-rg-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; font-family: inherit; }
      .cc-rg-nav-item:hover { background: rgba(255,255,255,0.03); color: #e2e8f0; }
      .cc-rg-nav-item.active { background: rgba(5,150,105,0.08); color: #14b8a6; border-left-color: #14b8a6; }
      .cc-rg-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-rg-nav-badge { margin-left: auto; font-size: 9px; padding: 1px 6px; border-radius: 8px; background: rgba(5,150,105,0.2); color: #14b8a6; font-weight: 700; }
      .cc-rg-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-rg-close { position: fixed; top: 16px; right: 20px; z-index: 10019; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-rg-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-rg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 12px; }
      .cc-rg-page-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-rg-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #059669, #14b8a6); color: #fff; font-weight: 600; letter-spacing: 0.03em; }
      .cc-rg-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-rg-card { background: rgba(5,150,105,0.04); border: 1px solid rgba(5,150,105,0.15); border-radius: 10px; padding: 16px; }
      .cc-rg-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
      .cc-rg-card-value { font-size: 22px; font-weight: 800; color: #fff; }
      .cc-rg-card-delta { font-size: 11px; margin-top: 4px; color: #64748b; }
      .cc-rg-card-delta.positive { color: #22c55e; }
      .cc-rg-card-delta.negative { color: #ef4444; }
      .cc-rg-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
      .cc-rg-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
      .cc-rg-btn { padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 700; transition: all 0.2s; font-family: inherit; display: inline-flex; align-items: center; gap: 6px; }
      .cc-rg-btn-primary { background: linear-gradient(135deg, #059669, #14b8a6); color: #fff; box-shadow: 0 4px 14px rgba(5,150,105,0.3); }
      .cc-rg-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(5,150,105,0.4); }
      .cc-rg-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .cc-rg-btn-secondary { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
      .cc-rg-btn-secondary:hover { background: rgba(255,255,255,0.08); }
      .cc-rg-type-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
      .cc-rg-type-card { background: rgba(5,150,105,0.04); border: 1px solid rgba(5,150,105,0.15); border-radius: 10px; padding: 16px; cursor: pointer; transition: all 0.2s; }
      .cc-rg-type-card:hover { border-color: rgba(5,150,105,0.4); transform: translateY(-2px); }
      .cc-rg-type-card.selected { border-color: #14b8a6; background: rgba(5,150,105,0.1); }
      .cc-rg-type-icon { font-size: 28px; margin-bottom: 8px; }
      .cc-rg-type-name { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px; }
      .cc-rg-type-desc { font-size: 11px; color: #94a3b8; line-height: 1.5; margin-bottom: 8px; }
      .cc-rg-type-meta { font-size: 10px; color: #14b8a6; font-weight: 600; }
      .cc-rg-loading { text-align: center; padding: 60px 20px; }
      .cc-rg-loading-icon { font-size: 48px; margin-bottom: 16px; animation: cc-rg-spin 2s linear infinite; display: inline-block; }
      @keyframes cc-rg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .cc-rg-loading-msg { font-size: 16px; font-weight: 700; color: #14b8a6; margin-bottom: 8px; min-height: 22px; }
      .cc-rg-loading-sub { font-size: 12px; color: #64748b; }
      .cc-rg-progress { width: 100%; max-width: 400px; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 16px auto; overflow: hidden; }
      .cc-rg-progress-bar { height: 100%; background: linear-gradient(90deg, #059669, #14b8a6); border-radius: 3px; transition: width 0.4s ease; }
      .cc-rg-doc { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 28px; max-width: 880px; margin: 0 auto; }
      .cc-rg-doc-title { font-size: 24px; font-weight: 800; color: #fff; margin: 0 0 4px; }
      .cc-rg-doc-period { font-size: 12px; color: #64748b; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .cc-rg-doc-h2 { font-size: 14px; font-weight: 700; color: #14b8a6; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 0.05em; }
      .cc-rg-doc-p { font-size: 13px; line-height: 1.7; color: #cbd5e1; margin-bottom: 12px; }
      .cc-rg-anomaly { padding: 10px 12px; background: rgba(245,158,11,0.06); border-left: 3px solid #f59e0b; border-radius: 6px; font-size: 12px; color: #fcd34d; margin-bottom: 6px; line-height: 1.5; }
      .cc-rg-rec { padding: 10px 12px; background: rgba(5,150,105,0.05); border-left: 3px solid #14b8a6; border-radius: 6px; font-size: 12px; color: #cbd5e1; margin-bottom: 6px; line-height: 1.5; }
      .cc-rg-rec strong { color: #14b8a6; }
      .cc-rg-rec-pri { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-right: 6px; }
      .cc-rg-rec-pri-critical { background: rgba(239,68,68,0.2); color: #ef4444; }
      .cc-rg-rec-pri-high { background: rgba(245,158,11,0.2); color: #f59e0b; }
      .cc-rg-rec-pri-medium { background: rgba(6,182,212,0.2); color: #06B6D4; }
      .cc-rg-rec-pri-low { background: rgba(148,163,184,0.2); color: #94a3b8; }
      .cc-rg-rec-pri-strategic { background: linear-gradient(135deg, #059669, #14b8a6); color: #fff; }
      .cc-rg-action { padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; color: #cbd5e1; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
      .cc-rg-action::before { content: '☐'; color: #14b8a6; font-size: 14px; }
      .cc-rg-finance-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; }
      .cc-rg-finance-row:last-child { border-bottom: none; font-weight: 800; color: #14b8a6; }
      .cc-rg-history-item { padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
      .cc-rg-history-item:hover { background: rgba(5,150,105,0.04); border-color: rgba(5,150,105,0.3); }
      .cc-rg-history-title { font-size: 13px; font-weight: 700; color: #fff; }
      .cc-rg-history-meta { font-size: 10px; color: #64748b; margin-top: 4px; }
      .cc-rg-empty { text-align: center; padding: 60px 20px; color: #64748b; font-size: 13px; }
      .cc-rg-empty-icon { font-size: 48px; margin-bottom: 12px; }
      .cc-rg-toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #059669, #14b8a6); color: #fff; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; z-index: 10020; box-shadow: 0 8px 24px rgba(5,150,105,0.4); font-family: inherit; }
      @media (max-width: 767px) {
        .cc-rg-modal { flex-direction: column; }
        .cc-rg-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-rg-sidebar-brand { display: none; }
        .cc-rg-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-rg-nav-item.active { border-bottom-color: #14b8a6; border-left-color: transparent; }
        .cc-rg-main { padding: 12px 12px 20px; }
        .cc-rg-cards { grid-template-columns: repeat(2, 1fr); }
        .cc-rg-doc { padding: 18px; }
      }
      /* Light mode overrides */
      html:not(.dark) .cc-rg-modal { background: rgba(248,250,252,0.99); color: #1e293b; }
      html:not(.dark) .cc-rg-sidebar { background: rgba(241,245,249,0.8); border-right-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-rg-sidebar-title { color: #0f172a; }
      html:not(.dark) .cc-rg-nav-item { color: #64748b; }
      html:not(.dark) .cc-rg-nav-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
      html:not(.dark) .cc-rg-nav-item.active { background: rgba(5,150,105,0.08); color: #0d9488; }
      html:not(.dark) .cc-rg-page-title { color: #0f172a; }
      html:not(.dark) .cc-rg-header { border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-rg-card { background: rgba(5,150,105,0.04); border-color: rgba(5,150,105,0.15); }
      html:not(.dark) .cc-rg-card-label { color: #64748b; }
      html:not(.dark) .cc-rg-card-value { color: #0f172a; }
      html:not(.dark) .cc-rg-card-delta { color: #64748b; }
      html:not(.dark) .cc-rg-section { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.05); }
      html:not(.dark) .cc-rg-section-title { color: #1e293b; }
      html:not(.dark) .cc-rg-btn-secondary { background: rgba(0,0,0,0.04); color: #475569; border-color: rgba(0,0,0,0.1); }
      html:not(.dark) .cc-rg-type-card { background: rgba(5,150,105,0.04); border-color: rgba(5,150,105,0.15); }
      html:not(.dark) .cc-rg-type-card:hover { border-color: rgba(5,150,105,0.4); }
      html:not(.dark) .cc-rg-type-name { color: #0f172a; }
      html:not(.dark) .cc-rg-type-desc { color: #64748b; }
      html:not(.dark) .cc-rg-doc { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-rg-doc-title { color: #0f172a; }
      html:not(.dark) .cc-rg-doc-period { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-rg-doc-h2 { color: #0d9488; }
      html:not(.dark) .cc-rg-doc-p { color: #334155; }
      html:not(.dark) .cc-rg-anomaly { background: rgba(245,158,11,0.06); color: #92400e; }
      html:not(.dark) .cc-rg-rec { background: rgba(5,150,105,0.05); color: #334155; }
      html:not(.dark) .cc-rg-rec strong { color: #0d9488; }
      html:not(.dark) .cc-rg-action { background: rgba(0,0,0,0.02); color: #334155; }
      html:not(.dark) .cc-rg-finance-row { border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-rg-finance-row:last-child { color: #0d9488; }
      html:not(.dark) .cc-rg-history-item { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
      html:not(.dark) .cc-rg-history-item:hover { background: rgba(5,150,105,0.04); border-color: rgba(5,150,105,0.2); }
      html:not(.dark) .cc-rg-history-title { color: #0f172a; }
      html:not(.dark) .cc-rg-loading-msg { color: #0d9488; }
      html:not(.dark) .cc-rg-loading-sub { color: #64748b; }
      html:not(.dark) .cc-rg-progress { background: rgba(0,0,0,0.06); }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    const db = initDatabase();
    const overlay = document.createElement('div');
    overlay.id = 'cc-rg-overlay';
    overlay.className = 'cc-rg-modal';
    overlay.innerHTML = `
      <button class="cc-rg-close" onclick="window.__ccRG.close()">×</button>
      <div class="cc-rg-sidebar">
        <div class="cc-rg-sidebar-brand">
          <div class="cc-rg-sidebar-title">📄 AI Report Generator</div>
          <div class="cc-rg-sidebar-sub">${db.reports.length} reports saved</div>
        </div>
        <button class="cc-rg-nav-item ${currentView === 'home' ? 'active' : ''}" onclick="window.__ccRG.setView('home')"><span class="cc-rg-nav-icon">🏠</span> Report Types</button>
        <button class="cc-rg-nav-item ${currentView === 'history' ? 'active' : ''}" onclick="window.__ccRG.setView('history')"><span class="cc-rg-nav-icon">📚</span> History ${db.reports.length > 0 ? '<span class="cc-rg-nav-badge">' + db.reports.length + '</span>' : ''}</button>
        <button class="cc-rg-nav-item ${currentView === 'templates' ? 'active' : ''}" onclick="window.__ccRG.setView('templates')"><span class="cc-rg-nav-icon">📐</span> Templates</button>
        <button class="cc-rg-nav-item ${currentView === 'schedule' ? 'active' : ''}" onclick="window.__ccRG.setView('schedule')"><span class="cc-rg-nav-icon">⏰</span> Schedule</button>
        <button class="cc-rg-nav-item ${currentView === 'export' ? 'active' : ''}" onclick="window.__ccRG.setView('export')"><span class="cc-rg-nav-icon">📤</span> Export Hub</button>
      </div>
      <div class="cc-rg-main" id="cc-rg-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const c = document.getElementById('cc-rg-content');
    if (!c) return;
    if (currentView === 'home') renderHome(c);
    else if (currentView === 'history') renderHistory(c);
    else if (currentView === 'templates') renderTemplates(c);
    else if (currentView === 'schedule') renderSchedule(c);
    else if (currentView === 'export') renderExport(c);
    else if (currentView === 'loading') renderLoading(c);
    else if (currentView === 'view') renderReport(c);
    document.querySelectorAll('.cc-rg-nav-item').forEach(function(item) {
      var onclick = item.getAttribute('onclick') || '';
      item.classList.toggle('active', onclick.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // HOME — Report Type Selector
  // ------------------------------------------------------------------
  let selectedType = 'weekly';

  function renderHome(c) {
    c.innerHTML = `
      <div class="cc-rg-header">
        <h2 class="cc-rg-page-title">📄 AI Report Generator <span class="cc-rg-page-badge">GENERATIVE AI</span></h2>
        <button class="cc-rg-btn cc-rg-btn-primary" ${generating ? 'disabled' : ''} onclick="window.__ccRG.generate()">
          <span style="font-size:14px">✨</span> Generate Report
        </button>
      </div>
      <div class="cc-rg-cards">
        <div class="cc-rg-card"><div class="cc-rg-card-label">Reports Available</div><div class="cc-rg-card-value">${REPORT_TYPES.length}</div><div class="cc-rg-card-delta">templates</div></div>
        <div class="cc-rg-card"><div class="cc-rg-card-label">Generated YTD</div><div class="cc-rg-card-value">${(initDatabase().reports.length + 47)}</div><div class="cc-rg-card-delta positive">+12 this month</div></div>
        <div class="cc-rg-card"><div class="cc-rg-card-label">Avg Generation</div><div class="cc-rg-card-value">32s</div><div class="cc-rg-card-delta">across all types</div></div>
        <div class="cc-rg-card"><div class="cc-rg-card-label">Insights/Report</div><div class="cc-rg-card-value">~24</div><div class="cc-rg-card-delta">avg per report</div></div>
      </div>
      <div class="cc-rg-section">
        <div class="cc-rg-section-title">📋 Select Report Type</div>
        <div class="cc-rg-type-grid">
          ${REPORT_TYPES.map(function(t) {
            return '<div class="cc-rg-type-card ' + (selectedType === t.id ? 'selected' : '') + '" onclick="window.__ccRG.selectType(\'' + t.id + '\')"><div class="cc-rg-type-icon">' + t.icon + '</div><div class="cc-rg-type-name">' + t.name + '</div><div class="cc-rg-type-desc">' + t.desc + '</div><div class="cc-rg-type-meta">⏱ Generation time: ' + t.est_time + '</div></div>';
          }).join('')}
        </div>
      </div>
    `;
  }

  function selectType(id) {
    selectedType = id;
    renderContent();
  }

  // ------------------------------------------------------------------
  // LOADING — AI Generation Animation
  // ------------------------------------------------------------------
  function generate() {
    if (generating) return;
    generating = true;
    currentView = 'loading';
    renderContent();
    let step = 0;
    function tick() {
      step++;
      const msgEl = document.getElementById('cc-rg-loading-msg');
      const barEl = document.getElementById('cc-rg-loading-bar');
      const subEl = document.getElementById('cc-rg-loading-sub');
      if (msgEl && barEl && subEl) {
        msgEl.textContent = LOADING_STEPS[Math.min(step, LOADING_STEPS.length - 1)];
        barEl.style.width = Math.min(100, (step / LOADING_STEPS.length) * 100) + '%';
        subEl.textContent = 'Step ' + step + ' of ' + LOADING_STEPS.length + ' · ' + Math.min(100, Math.round((step / LOADING_STEPS.length) * 100)) + '% complete';
      }
      if (step >= LOADING_STEPS.length) {
        clearInterval(generationTimer);
        finishGeneration();
      }
    }
    generationTimer = setInterval(tick, 600);
    tick();
  }

  function finishGeneration() {
    generating = false;
    const tpl = TEMPLATES[selectedType]();
    const db = initDatabase();
    const report = {
      id: 'RPT-' + Date.now(),
      type: selectedType,
      type_name: REPORT_TYPES.filter(function(t) { return t.id === selectedType; })[0].name,
      generated_at: new Date().toISOString(),
      content: tpl
    };
    db.reports.unshift(report);
    if (db.reports.length > 20) db.reports = db.reports.slice(0, 20);
    saveDB(db);
    currentView = 'view';
    window.__ccRG_currentReport = report;
    renderContent();
    showToast('Report generated successfully');
  }

  function renderLoading(c) {
    c.innerHTML = `
      <div class="cc-rg-loading">
        <div class="cc-rg-loading-icon">📄</div>
        <div class="cc-rg-loading-msg" id="cc-rg-loading-msg">Initializing AI synthesis engine...</div>
        <div class="cc-rg-progress"><div class="cc-rg-progress-bar" id="cc-rg-loading-bar" style="width:0%"></div></div>
        <div class="cc-rg-loading-sub" id="cc-rg-loading-sub">Step 1 of ${LOADING_STEPS.length} · 0% complete</div>
        <div style="margin-top:24px;font-size:11px;color:#64748b">Synthesizing ${REPORT_TYPES.filter(function(t){return t.id===selectedType;})[0].name} report</div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // VIEW REPORT — Document display
  // ------------------------------------------------------------------
  function renderReport(c) {
    const r = window.__ccRG_currentReport;
    if (!r) { currentView = 'home'; renderContent(); return; }
    const t = r.content;
    c.innerHTML = `
      <div class="cc-rg-header">
        <h2 class="cc-rg-page-title">📄 ${t.title} <span class="cc-rg-page-badge">${r.type_name.toUpperCase()}</span></h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="cc-rg-btn cc-rg-btn-secondary" onclick="window.__ccRG.copyReport()">📋 Copy</button>
          <button class="cc-rg-btn cc-rg-btn-secondary" onclick="window.__ccRG.downloadReport()">⬇ Download</button>
          <button class="cc-rg-btn cc-rg-btn-primary" onclick="window.__ccRG.setView('home')">← Back to Types</button>
        </div>
      </div>
      <div class="cc-rg-doc">
        <h1 class="cc-rg-doc-title">${t.title}</h1>
        <div class="cc-rg-doc-period">Period: ${t.period} · Generated: ${formatDate(r.generated_at)} · Risk Level: <strong style="color:#f59e0b">${t.risk_level}</strong></div>

        <div class="cc-rg-doc-h2">📊 Executive Summary</div>
        <div class="cc-rg-doc-p">${t.exec_summary}</div>

        <div class="cc-rg-doc-h2">📈 Key Metrics</div>
        <div class="cc-rg-cards">
          ${t.kpis.map(function(k) {
            return '<div class="cc-rg-card"><div class="cc-rg-card-label">' + k.label + '</div><div class="cc-rg-card-value">' + k.value + '</div><div class="cc-rg-card-delta ' + (k.positive ? 'positive' : 'negative') + '">' + k.delta + '</div></div>';
          }).join('')}
        </div>

        <div class="cc-rg-doc-h2">⚠️ Anomalies Detected</div>
        ${t.anomalies.map(function(a) { return '<div class="cc-rg-anomaly">⚠️ ' + a + '</div>'; }).join('')}

        <div class="cc-rg-doc-h2">💡 Recommendations</div>
        ${t.recommendations.map(function(rec) {
          var pri = rec.priority.toLowerCase();
          var cls = 'cc-rg-rec-pri-' + pri;
          return '<div class="cc-rg-rec"><span class="cc-rg-rec-pri ' + cls + '">' + rec.priority + '</span>' + rec.text + '</div>';
        }).join('')}

        <div class="cc-rg-doc-h2">💰 Financial Summary</div>
        <div class="cc-rg-section" style="padding:14px 16px">
          <div class="cc-rg-finance-row"><span>Revenue Impact</span><strong style="color:#22c55e">${t.financial.revenue_impact}</strong></div>
          <div class="cc-rg-finance-row"><span>Cost Avoidance</span><strong style="color:#22c55e">${t.financial.cost_avoidance}</strong></div>
          <div class="cc-rg-finance-row"><span>Excess Spend</span><strong style="color:#ef4444">${t.financial.excess_spend}</strong></div>
          <div class="cc-rg-finance-row"><span>Net Position</span><strong>${t.financial.net_position}</strong></div>
        </div>

        <div class="cc-rg-doc-h2">🚨 Risk Assessment</div>
        <div class="cc-rg-doc-p"><strong style="color:#f59e0b">${t.risk_level}</strong></div>

        <div class="cc-rg-doc-h2">✅ Action Items</div>
        ${t.action_items.map(function(a) { return '<div class="cc-rg-action">' + a + '</div>'; }).join('')}

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);font-size:10px;color:#64748b;text-align:center">
          Generated by AI Supply Chain Report Engine · ${formatDate(r.generated_at)} · Report ID: ${r.id}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // HISTORY
  // ------------------------------------------------------------------
  function renderHistory(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-rg-header">
        <h2 class="cc-rg-page-title">📚 Report History <span class="cc-rg-page-badge">${db.reports.length} SAVED</span></h2>
        ${db.reports.length > 0 ? '<button class="cc-rg-btn cc-rg-btn-secondary" onclick="window.__ccRG.clearHistory()">🗑 Clear All</button>' : ''}
      </div>
      ${db.reports.length === 0
        ? '<div class="cc-rg-empty"><div class="cc-rg-empty-icon">📚</div>No reports generated yet. Select a report type and click Generate to get started.</div>'
        : db.reports.map(function(r) {
          return '<div class="cc-rg-history-item" onclick="window.__ccRG.viewReport(\'' + r.id + '\')"><div class="cc-rg-history-title">📄 ' + r.content.title + '</div><div class="cc-rg-history-meta">Type: ' + r.type_name + ' · Generated: ' + formatDate(r.generated_at) + ' · Risk: ' + r.content.risk_level + '</div></div>';
        }).join('')
      }
    `;
  }

  function viewReport(id) {
    const db = initDatabase();
    const r = db.reports.filter(function(x) { return x.id === id; })[0];
    if (!r) return;
    window.__ccRG_currentReport = r;
    currentView = 'view';
    renderContent();
  }

  function clearHistory() {
    const db = initDatabase();
    db.reports = [];
    saveDB(db);
    renderContent();
    showToast('Report history cleared');
  }

  // ------------------------------------------------------------------
  // TEMPLATES VIEW
  // ------------------------------------------------------------------
  function renderTemplates(c) {
    c.innerHTML = `
      <div class="cc-rg-header"><h2 class="cc-rg-page-title">📐 Report Templates <span class="cc-rg-page-badge">${REPORT_TYPES.length} AVAILABLE</span></h2></div>
      <div class="cc-rg-section">
        <div class="cc-rg-section-title">📋 Template Library</div>
        <div class="cc-rg-type-grid">
          ${REPORT_TYPES.map(function(t) {
            return '<div class="cc-rg-type-card" onclick="window.__ccRG.selectType(\'' + t.id + '\');window.__ccRG.setView(\'home\');setTimeout(function(){window.__ccRG.generate();},200)"><div class="cc-rg-type-icon">' + t.icon + '</div><div class="cc-rg-type-name">' + t.name + '</div><div class="cc-rg-type-desc">' + t.desc + '</div><div class="cc-rg-type-meta">⏱ ' + t.est_time + ' · Click to generate</div></div>';
          }).join('')}
        </div>
      </div>
      <div class="cc-rg-section">
        <div class="cc-rg-section-title">🧠 AI Synthesis Pipeline</div>
        <div style="font-size:12px;color:#94a3b8;line-height:1.7">Each report is synthesized through a 15-step pipeline that analyzes suppliers, orders, ports, SKUs, risks, vessels, currencies, and trade lanes. The AI then aggregates findings, detects anomalies, generates strategic recommendations, validates against policy, and composes the executive narrative. Average insight density: 24 actionable items per report.</div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // SCHEDULE VIEW
  // ------------------------------------------------------------------
  function renderSchedule(c) {
    c.innerHTML = `
      <div class="cc-rg-header"><h2 class="cc-rg-page-title">⏰ Report Scheduling <span class="cc-rg-page-badge">AUTOMATED</span></h2></div>
      <div class="cc-rg-cards">
        <div class="cc-rg-card"><div class="cc-rg-card-label">Scheduled</div><div class="cc-rg-card-value">8</div><div class="cc-rg-card-delta">active schedules</div></div>
        <div class="cc-rg-card"><div class="cc-rg-card-label">Next Run</div><div class="cc-rg-card-value">2h 14m</div><div class="cc-rg-card-delta">Weekly Ops · 09:00 UTC</div></div>
        <div class="cc-rg-card"><div class="cc-rg-card-label">Recipients</div><div class="cc-rg-card-value">24</div><div class="cc-rg-card-delta">across 6 distros</div></div>
        <div class="cc-rg-card"><div class="cc-rg-card-label">Avg Delivery</div><div class="cc-rg-card-value">98.4%</div><div class="cc-rg-card-delta positive">last 30 days</div></div>
      </div>
      <div class="cc-rg-section">
        <div class="cc-rg-section-title">📅 Active Schedules</div>
        ${[
          { name: 'Weekly Operations Digest', cadence: 'Every Monday 09:00', recipients: 8, next: 'In 2h 14m' },
          { name: 'Monthly Executive Briefing', cadence: '1st of month 08:00', recipients: 5, next: 'In 12 days' },
          { name: 'Daily Risk Snapshot', cadence: 'Daily 06:00', recipients: 12, next: 'In 18h' },
          { name: 'Quarterly Supplier Review', cadence: 'Quarterly', recipients: 6, next: 'In 47 days' },
          { name: 'Weekly Financial Impact', cadence: 'Every Friday 16:00', recipients: 4, next: 'In 4 days' }
        ].map(function(s) {
          return '<div class="cc-rg-history-item"><div class="cc-rg-history-title">📅 ' + s.name + '</div><div class="cc-rg-history-meta">Cadence: ' + s.cadence + ' · Recipients: ' + s.recipients + ' · Next run: ' + s.next + '</div></div>';
        }).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // EXPORT VIEW
  // ------------------------------------------------------------------
  function renderExport(c) {
    c.innerHTML = `
      <div class="cc-rg-header"><h2 class="cc-rg-page-title">📤 Export Hub <span class="cc-rg-page-badge">MULTI-FORMAT</span></h2></div>
      <div class="cc-rg-cards">
        <div class="cc-rg-card"><div class="cc-rg-card-label">Exports YTD</div><div class="cc-rg-card-value">142</div><div class="cc-rg-card-delta">across all formats</div></div>
        <div class="cc-rg-card"><div class="cc-rg-card-label">PDF Exports</div><div class="cc-rg-card-value">68</div><div class="cc-rg-card-delta">most popular</div></div>
        <div class="cc-rg-card"><div class="cc-rg-card-label">Email Sends</div><div class="cc-rg-card-value">54</div><div class="cc-rg-card-delta">direct from app</div></div>
        <div class="cc-rg-card"><div class="cc-rg-card-label">API Integrations</div><div class="cc-rg-card-value">3</div><div class="cc-rg-card-delta">Slack, Teams, Email</div></div>
      </div>
      <div class="cc-rg-section">
        <div class="cc-rg-section-title">📤 Export Formats</div>
        <div class="cc-rg-type-grid">
          ${[
            { icon: '📄', name: 'PDF Document', desc: 'Formatted PDF with branding, headers, and page breaks. Best for executive distribution.' },
            { icon: '📝', name: 'Plain Text', desc: 'Markdown-formatted text for clipboard, email body, or wiki integration.' },
            { icon: '📊', name: 'Excel Workbook', desc: 'Multi-sheet Excel with report content, KPIs, and raw data tables.' },
            { icon: '📧', name: 'Email', desc: 'Direct email send with HTML formatting. Supports distribution lists.' },
            { icon: '💬', name: 'Slack Message', desc: 'Post to Slack channel with summary card and link to full report.' },
            { icon: '🔗', name: 'API Webhook', desc: 'POST report payload to configured webhook endpoint for downstream processing.' }
          ].map(function(f) {
            return '<div class="cc-rg-type-card"><div class="cc-rg-type-icon">' + f.icon + '</div><div class="cc-rg-type-name">' + f.name + '</div><div class="cc-rg-type-desc">' + f.desc + '</div></div>';
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // EXPORT ACTIONS
  // ------------------------------------------------------------------
  function reportToText(r) {
    if (!r) return '';
    const t = r.content;
    let out = '===== ' + t.title + ' =====\n';
    out += 'Period: ' + t.period + '\n';
    out += 'Generated: ' + formatDate(r.generated_at) + '\n';
    out += 'Risk Level: ' + t.risk_level + '\n\n';
    out += '--- EXECUTIVE SUMMARY ---\n' + t.exec_summary + '\n\n';
    out += '--- KEY METRICS ---\n';
    t.kpis.forEach(function(k) { out += '  ' + k.label + ': ' + k.value + ' (' + k.delta + ')\n'; });
    out += '\n--- ANOMALIES DETECTED ---\n';
    t.anomalies.forEach(function(a) { out += '  * ' + a + '\n'; });
    out += '\n--- RECOMMENDATIONS ---\n';
    t.recommendations.forEach(function(rec) { out += '  [' + rec.priority + '] ' + rec.text + '\n'; });
    out += '\n--- FINANCIAL SUMMARY ---\n';
    out += '  Revenue Impact: ' + t.financial.revenue_impact + '\n';
    out += '  Cost Avoidance: ' + t.financial.cost_avoidance + '\n';
    out += '  Excess Spend: ' + t.financial.excess_spend + '\n';
    out += '  Net Position: ' + t.financial.net_position + '\n\n';
    out += '--- ACTION ITEMS ---\n';
    t.action_items.forEach(function(a) { out += '  [ ] ' + a + '\n'; });
    out += '\n===== End of Report (ID: ' + r.id + ') =====\n';
    return out;
  }

  function copyReport() {
    const r = window.__ccRG_currentReport;
    if (!r) return;
    const text = reportToText(r);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() { showToast('Report copied to clipboard'); });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('Report copied to clipboard'); } catch (e) { showToast('Copy failed'); }
      ta.remove();
    }
  }

  function downloadReport() {
    const r = window.__ccRG_currentReport;
    if (!r) return;
    const text = reportToText(r);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (r.type_name.replace(/\s+/g, '_') + '_' + r.generated_at.substr(0, 10) + '.txt').toLowerCase();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Report downloaded');
  }

  function showToast(msg) {
    const existing = document.querySelector('.cc-rg-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'cc-rg-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.4s'; }, 2200);
    setTimeout(function() { toast.remove(); }, 2700);
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-rg-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    if (generationTimer) { clearInterval(generationTimer); generationTimer = null; }
    generating = false;
    const overlay = document.getElementById('cc-rg-overlay');
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
    window.__ccRG = { open: open, close: close, setView: setView, generate: generate, selectType: selectType, viewReport: viewReport, clearHistory: clearHistory, copyReport: copyReport, downloadReport: downloadReport };

    function injectButton() {
      if (document.getElementById('cc-rg-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-rg-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 620px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #059669, #14b8a6)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg> AI Reports';
      btn.setAttribute('aria-label', 'Open AI report generator');
      btn.title = 'Open AI Report Generator (press G)';
      btn.onclick = open;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(5, 150, 105, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(5, 150, 105, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-rg-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-rg-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 6500); });
    } else {
      setTimeout(tryInject, 6500);
    }

    document.addEventListener('keydown', function(e) {
      if ((e.key === 'g' || e.key === 'G') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-rg-overlay')) { open(); e.preventDefault(); }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
