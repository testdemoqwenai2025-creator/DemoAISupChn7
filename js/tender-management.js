// ====================================================================
// tender-management.js — Tender management system for cc-app
// ====================================================================
// Adapted from order-management.js with ~90% code reuse.
// Changes:
//   - Data model: clients → suppliers, orders → tenders, payments → bids
//   - Status workflow: draft → open → bidding → awarded → expired
//   - Chart labels: "Tenders by Status" + "Bid Value — Last 7 Days"
//   - Receipt: "Tender Award Receipt" instead of "Payment Receipt"
//
// Features (all reused from order-management pattern):
//   - Synthetic database (localStorage) with suppliers, tenders, bids
//   - Full-screen modal popup via "📋 Tenders" floating button
//   - Search box (filter by tender ID, supplier, title)
//   - Filter tabs (All / Draft / Open / Bidding / Awarded / Expired)
//   - Scrollable table with sticky headers + mobile card layout
//   - Analytics mini-chart (tenders by status + bid value sparkline)
//   - Bulk actions (select-all, bulk award, bulk export)
//   - CSV export (all or selected)
//   - Status progression (open → bidding → awarded)
//   - Tender award receipt PDF (print-to-PDF)
//   - Toast notifications
//   - Keyboard shortcuts (T to open, ESC to close)
// ====================================================================
(function() {
  'use strict';

  if (window.__tenderMgmtLoaded) return;
  window.__tenderMgmtLoaded = true;

  // ------------------------------------------------------------------
  // DATABASE
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_tender_db_v1';

  function generateId(prefix) {
    return prefix + '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const SYNTHETIC_SUPPLIERS = [
    { id: 'sup_001', name: 'Global Logistics Corp', email: 'bids@globallogistics.com', country: 'United States', category: 'Logistics' },
    { id: 'sup_002', name: 'European Manufacturing Group', email: 'tenders@euro-mfg.eu', country: 'Germany', category: 'Manufacturing' },
    { id: 'sup_003', name: 'Pacific Trade Partners', email: 'bids@pacifictrade.cn', country: 'Singapore', category: 'Trading' },
    { id: 'sup_004', name: 'Nordic Energy Solutions', email: 'procurement@nordic-energy.no', country: 'Norway', category: 'Energy' },
    { id: 'sup_005', name: 'Mediterranean Foods Ltd', email: 'tenders@medfoods.gr', country: 'Greece', category: 'Food & Beverage' },
    { id: 'sup_006', name: 'Atlas Pharma Distribution', email: 'bids@atlaspharma.com', country: 'United Kingdom', category: 'Pharmaceuticals' },
    { id: 'sup_007', name: 'Sahara Minerals & Mining', email: 'tenders@saharaminerals.ma', country: 'Morocco', category: 'Mining' },
    { id: 'sup_008', name: 'Andean Textile Mills', email: 'bids@andean-textiles.co', country: 'Colombia', category: 'Textiles' }
  ];

  const TENDER_TEMPLATES = [
    { title: 'Global Logistics Infrastructure Upgrade', baseValue: 250000, category: 'Infrastructure', scope: 'Multi-region deployment of logistics hubs across 12 countries with integrated AI routing and real-time tracking.' },
    { title: 'AI-Powered Supply Chain Analytics Platform', baseValue: 180000, category: 'Technology', scope: 'Enterprise license for predictive analytics platform with 500 seats, API access, and custom model training.' },
    { title: 'Cold Chain Distribution Network — Europe', baseValue: 320000, category: 'Logistics', scope: 'Temperature-controlled distribution network across EU with GDP compliance, IoT monitoring, and 99.5% uptime SLA.' },
    { title: 'Compliance Monitoring System — Multi-Region', baseValue: 145000, category: 'Compliance', scope: 'Automated regulatory compliance monitoring for 8 jurisdictions with real-time alerting and audit trail.' },
    { title: 'Predictive Risk Assessment Module', baseValue: 95000, category: 'Technology', scope: 'ML-powered risk prediction module with geopolitical, weather, and supplier risk models.' },
    { title: 'Sustainable Packaging Supply Contract', baseValue: 78000, category: 'Sustainability', scope: '12-month supply of FSC-certified biodegradable packaging materials with carbon offset reporting.' },
    { title: 'Cross-Border Trade Documentation Automation', baseValue: 112000, category: 'Automation', scope: 'RPA-based automation of customs documentation, certificates of origin, and trade compliance forms.' },
    { title: 'Real-Time Shipment Tracking Platform', baseValue: 165000, category: 'Technology', scope: 'IoT-enabled tracking platform with GPS, temperature, and humidity monitoring for 10,000 shipments/month.' },
    { title: 'Warehouse Management System Integration', baseValue: 210000, category: 'Infrastructure', scope: 'WMS integration with existing ERP, automated put-away, pick optimization, and cycle counting.' },
    { title: 'Supplier Diversity & Inclusion Program', baseValue: 65000, category: 'Consulting', scope: '12-month consulting engagement to develop and implement supplier diversity program with KPI tracking.' }
  ];

  // Document types required for tenders
  const DOCUMENT_TYPES = [
    { id: 'rfp', name: 'Request for Proposal (RFP)', required: true, description: 'Official tender document with requirements' },
    { id: 'specs', name: 'Technical Specifications', required: true, description: 'Detailed technical requirements' },
    { id: 'terms', name: 'Terms & Conditions', required: true, description: 'Legal terms and conditions' },
    { id: 'evaluation', name: 'Evaluation Criteria', required: true, description: 'Scoring methodology and weights' },
    { id: 'compliance', name: 'Compliance Checklist', required: true, description: 'Mandatory compliance requirements' },
    { id: 'nda', name: 'NDA Template', required: false, description: 'Non-disclosure agreement for bidders' },
    { id: 'contract', name: 'Draft Contract', required: false, description: 'Draft contract template' },
    { id: 'addendum', name: 'Addendum/Q&A Log', required: false, description: 'Clarifications and Q&A from bidders' }
  ];

  // Evaluation criteria with weights
  const EVALUATION_CRITERIA = [
    { id: 'price', name: 'Price Competitiveness', weight: 30, description: 'Bid price relative to estimated value and other bids' },
    { id: 'technical', name: 'Technical Capability', weight: 25, description: 'Technical approach, methodology, and solution fit' },
    { id: 'experience', name: 'Relevant Experience', weight: 20, description: 'Track record with similar projects and references' },
    { id: 'timeline', name: 'Delivery Timeline', weight: 15, description: 'Proposed timeline and milestone schedule' },
    { id: 'compliance', name: 'Compliance & Certifications', weight: 10, description: 'Regulatory compliance, ISO certifications, and security' }
  ];

  // Application form fields
  const APPLICATION_FORM_FIELDS = [
    { id: 'company_name', label: 'Company Legal Name', type: 'text', required: true },
    { id: 'company_registration', label: 'Company Registration Number', type: 'text', required: true },
    { id: 'contact_name', label: 'Authorized Contact Person', type: 'text', required: true },
    { id: 'contact_email', label: 'Contact Email', type: 'email', required: true },
    { id: 'contact_phone', label: 'Contact Phone', type: 'tel', required: true },
    { id: 'country', label: 'Country of Incorporation', type: 'text', required: true },
    { id: 'years_experience', label: 'Years of Relevant Experience', type: 'number', required: true },
    { id: 'annual_revenue', label: 'Annual Revenue (USD)', type: 'number', required: true },
    { id: 'bid_value', label: 'Bid Value (USD)', type: 'number', required: true },
    { id: 'delivery_timeline', label: 'Proposed Delivery Timeline (weeks)', type: 'number', required: true },
    { id: 'technical_approach', label: 'Technical Approach Summary', type: 'textarea', required: true },
    { id: 'references', label: 'Client References (min 3)', type: 'textarea', required: true },
    { id: 'certifications', label: 'Certifications (ISO, GDPR, etc.)', type: 'textarea', required: false },
    { id: 'compliance_statement', label: 'Compliance Statement', type: 'textarea', required: true }
  ];

  // Compliance checklist items
  const COMPLIANCE_ITEMS = [
    { id: 'iso9001', name: 'ISO 9001 Quality Management', required: true },
    { id: 'iso27001', name: 'ISO 27001 Information Security', required: true },
    { id: 'gdpr', name: 'GDPR Compliance', required: true },
    { id: 'soc2', name: 'SOC 2 Type II', required: false },
    { id: 'financial_standing', name: 'Financial Standing Declaration', required: true },
    { id: 'insurance', name: 'Professional Indemnity Insurance', required: true },
    { id: 'anti_bribery', name: 'Anti-Bribery & Corruption Policy', required: true },
    { id: 'modern_slavery', name: 'Modern Slavery Statement', required: false },
    { id: 'diversity_policy', name: 'Diversity & Inclusion Policy', required: false },
    { id: 'data_processing', name: 'Data Processing Agreement', required: true }
  ];

  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch(e) {}
    if (db && db.tenders && db.tenders.length > 0 && db.tenders[0].documents) return db;

    db = { suppliers: SYNTHETIC_SUPPLIERS, tenders: [], bids: [], emails: [], audit_log: [], documents: [], evaluations: [], applications: [], meta: { created: new Date().toISOString(), version: 2 } };

    const statuses = ['draft', 'open', 'open', 'bidding', 'bidding', 'awarded', 'awarded', 'expired', 'expired', 'open', 'bidding', 'awarded'];
    for (let i = 0; i < 12; i++) {
      const supplier = SYNTHETIC_SUPPLIERS[i % SYNTHETIC_SUPPLIERS.length];
      const template = TENDER_TEMPLATES[i % TENDER_TEMPLATES.length];
      const estimatedValue = template.baseValue + Math.floor(Math.random() * 50000);
      const status = statuses[i];
      const createdDate = new Date(Date.now() - (Math.random() * 60 * 24 * 60 * 60 * 1000));
      const deadline = new Date(createdDate.getTime() + (14 + Math.floor(Math.random() * 30)) * 86400000);
      const questionDeadline = new Date(createdDate.getTime() + 7 * 86400000);

      const tender = {
        id: 'TND-' + String(20001 + i),
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_email: supplier.email,
        supplier_country: supplier.country,
        supplier_category: supplier.category,
        title: template.title,
        category: template.category,
        scope: template.scope,
        estimated_value: estimatedValue,
        currency: 'USD',
        status: status,
        created_at: createdDate.toISOString(),
        deadline: deadline.toISOString(),
        question_deadline: questionDeadline.toISOString(),
        updated_at: createdDate.toISOString(),
        awarded_bid_id: null,
        description: template.scope,
        procurement_officer: 'Sarah Chen',
        procurement_email: 'procurement@aisupplychain-advanced.com',
        evaluation_committee: ['Sarah Chen (Chair)', 'Mike Rodriguez (Tech)', 'Aisha Patel (Finance)', 'David Kim (Legal)'],
        budget_code: 'BUD-' + (5000 + i),
        region: ['Global', 'Europe', 'Americas', 'APAC'][i % 4]
      };
      db.tenders.push(tender);

      db.audit_log.push({ id: generateId('aud'), tender_id: tender.id, event: 'tender_created', timestamp: tender.created_at, details: 'Tender created by ' + tender.procurement_officer + ' for ' + supplier.name });

      // Generate documents for this tender
      DOCUMENT_TYPES.forEach((docType, di) => {
        if (docType.required || Math.random() > 0.5) {
          db.documents.push({
            id: generateId('doc'),
            tender_id: tender.id,
            type: docType.id,
            type_name: docType.name,
            required: docType.required,
            status: status === 'draft' ? 'pending' : 'uploaded',
            uploaded_at: status === 'draft' ? null : new Date(createdDate.getTime() + di * 3600000).toISOString(),
            uploaded_by: tender.procurement_officer,
            file_name: tender.id + '_' + docType.id + '.pdf',
            file_size: Math.floor(Math.random() * 500000) + 50000,
            version: '1.0'
          });
        }
      });

      // For bidding/awarded tenders, generate bids with evaluation scores
      if (status === 'bidding' || status === 'awarded') {
        const bidCount = Math.floor(Math.random() * 3) + 3; // 3-5 bids
        const usedSuppliers = new Set();
        for (let b = 0; b < bidCount; b++) {
          let bidSupplier;
          do {
            bidSupplier = SYNTHETIC_SUPPLIERS[Math.floor(Math.random() * SYNTHETIC_SUPPLIERS.length)];
          } while (usedSuppliers.has(bidSupplier.id) && usedSuppliers.size < SYNTHETIC_SUPPLIERS.length);
          usedSuppliers.add(bidSupplier.id);

          const bidValue = estimatedValue - Math.floor(Math.random() * 60000) + Math.floor(Math.random() * 20000);
          const timeline = Math.floor(Math.random() * 12) + 8; // 8-20 weeks
          const bid = {
            id: generateId('bid'),
            tender_id: tender.id,
            supplier_id: bidSupplier.id,
            supplier_name: bidSupplier.name,
            supplier_email: bidSupplier.email,
            supplier_country: bidSupplier.country,
            supplier_category: bidSupplier.category,
            bid_value: bidValue,
            currency: 'USD',
            proposed_timeline: timeline,
            status: 'submitted',
            submitted_at: new Date(createdDate.getTime() + (1 + b) * 86400000).toISOString(),
            proposal: 'Comprehensive proposal for ' + template.title + ' with proven expertise in ' + bidSupplier.category,
            technical_approach: 'Phased delivery approach with dedicated team, agile methodology, and continuous integration.',
            references: 'Previous clients: Fortune 500 companies in ' + bidSupplier.category + ' sector with 95%+ satisfaction.',
            certifications: ['ISO 9001', 'ISO 27001', 'GDPR Compliant'],
            application_form: {
              company_name: bidSupplier.name,
              company_registration: 'REG-' + Math.floor(Math.random() * 900000 + 100000),
              contact_name: bidSupplier.name.split(' ')[0] + ' ' + bidSupplier.name.split(' ').slice(-1)[0],
              contact_email: bidSupplier.email,
              contact_phone: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
              country: bidSupplier.country,
              years_experience: Math.floor(Math.random() * 20) + 5,
              annual_revenue: Math.floor(Math.random() * 50 + 10) * 1000000,
              bid_value: bidValue,
              delivery_timeline: timeline,
              technical_approach: 'Phased delivery with agile methodology',
              references: '3 Fortune 500 client references available',
              certifications: 'ISO 9001, ISO 27001, GDPR',
              compliance_statement: 'Full compliance with all tender requirements confirmed'
            },
            compliance_checklist: {}
          };

          // Fill compliance checklist
          COMPLIANCE_ITEMS.forEach(item => {
            bid.compliance_checklist[item.id] = item.required ? Math.random() > 0.15 : Math.random() > 0.5;
          });

          db.bids.push(bid);

          // Generate evaluation scores for each bid
          const evaluation = {
            id: generateId('eval'),
            tender_id: tender.id,
            bid_id: bid.id,
            supplier_name: bidSupplier.name,
            scores: {},
            total_score: 0,
            evaluated_by: tender.evaluation_committee[0],
            evaluated_at: new Date(createdDate.getTime() + 6 * 86400000).toISOString(),
            notes: ''
          };

          EVALUATION_CRITERIA.forEach(criterion => {
            // Generate realistic scores (60-95 range)
            let baseScore = Math.floor(Math.random() * 35) + 60;
            // Price criterion: lower bid = higher score
            if (criterion.id === 'price') {
              const priceRatio = bidValue / estimatedValue;
              baseScore = Math.floor((1 - (priceRatio - 0.7)) * 80) + 15;
              baseScore = Math.max(60, Math.min(95, baseScore));
            }
            evaluation.scores[criterion.id] = baseScore;
          });

          // Calculate weighted total
          evaluation.total_score = Object.entries(evaluation.scores).reduce((sum, [cid, score]) => {
            const criterion = EVALUATION_CRITERIA.find(c => c.id === cid);
            return sum + (score * criterion.weight / 100);
          }, 0);
          evaluation.total_score = Math.round(evaluation.total_score * 10) / 10;

          // Award notes
          if (evaluation.total_score >= 85) evaluation.notes = 'Excellent proposal. Strong technical approach and competitive pricing.';
          else if (evaluation.total_score >= 75) evaluation.notes = 'Good proposal. Meets requirements with minor concerns.';
          else evaluation.notes = 'Below expectations. Concerns about timeline and experience.';

          db.evaluations.push(evaluation);

          if (status === 'awarded' && b === 0) {
            bid.status = 'awarded';
            tender.awarded_bid_id = bid.id;
            // Mark the first bid as having the highest score
            evaluation.total_score = Math.max(...db.evaluations.filter(e => e.tender_id === tender.id).map(e => e.total_score)) + 2;
            evaluation.notes = 'Highest-scoring bid. Awarded by evaluation committee.';
            db.audit_log.push({ id: generateId('aud'), tender_id: tender.id, event: 'bid_awarded', timestamp: new Date(createdDate.getTime() + 7 * 86400000).toISOString(), details: 'Bid awarded to ' + bidSupplier.name + ' for ' + formatCurrency(bidValue) + ' (Score: ' + evaluation.total_score + '/100)' });
            db.emails.push({ id: generateId('eml'), tender_id: tender.id, to: bidSupplier.email, subject: 'Tender Award Notification — ' + tender.id, sent_at: new Date(createdDate.getTime() + 7 * 86400000).toISOString(), status: 'delivered' });
          }
        }
      }

      if (status === 'expired') {
        db.audit_log.push({ id: generateId('aud'), tender_id: tender.id, event: 'tender_expired', timestamp: deadline.toISOString(), details: 'Tender expired — deadline passed without award' });
      }

      // Add questions/clarifications for open/bidding/awarded tenders
      if (status !== 'draft') {
        const qCount = Math.floor(Math.random() * 4) + 1;
        for (let q = 0; q < qCount; q++) {
          const qSupplier = SYNTHETIC_SUPPLIERS[Math.floor(Math.random() * SYNTHETIC_SUPPLIERS.length)];
          db.audit_log.push({
            id: generateId('aud'), tender_id: tender.id,
            event: 'question_asked',
            timestamp: new Date(createdDate.getTime() + (q + 1) * 86400000).toISOString(),
            details: qSupplier.name + ' asked: "' + ['What are the payment terms?', 'Can you clarify the technical requirements for section 3.2?', 'Is there a preferred technology stack?', 'What is the expected team size?'][q % 4] + '"'
          });
          db.audit_log.push({
            id: generateId('aud'), tender_id: tender.id,
            event: 'question_answered',
            timestamp: new Date(createdDate.getTime() + (q + 1) * 86400000 + 7200000).toISOString(),
            details: 'Procurement answered: "' + ['Payment terms are net-30.', 'See addendum #1 for clarification.', 'No preference, but must support our API.', 'Minimum 5 FTEs required.'][q % 4] + '"'
          });
        }
      }
    }

    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }

  function saveDatabase(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

  function logAudit(db, tenderId, event, details) {
    db.audit_log.push({ id: generateId('aud'), tender_id: tenderId, event: event, timestamp: new Date().toISOString(), details: details });
  }

  function logEmail(db, email) {
    db.emails.push(email);
  }

  // ------------------------------------------------------------------
  // STYLES (reused from order-management pattern, prefixed with cc-tm)
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-tm-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-tm-styles';
    style.textContent = `
      .cc-tm-panel { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: rgba(10,10,10,0.98); border: 1px solid rgba(139,92,246,0.3); border-radius: 16px; padding: 24px; margin: 20px 0; color: #e2e8f0; backdrop-filter: blur(10px); }
      .cc-tm-panel-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10004; margin: 0; border-radius: 0; overflow-y: auto; padding: 80px 24px 24px; background: rgba(10,10,10,0.99); }
      .cc-tm-panel-modal .cc-tm-panel-inner { max-width: 1200px; margin: 0 auto; }
      .cc-tm-close-panel { position: fixed; top: 16px; right: 20px; z-index: 10005; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
      .cc-tm-close-panel:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-tm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .cc-tm-title { font-size: 18px; font-weight: 700; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-tm-title-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; font-weight: 600; letter-spacing: 0.03em; }
      .cc-tm-stats { display: flex; gap: 16px; flex-wrap: wrap; }
      .cc-tm-stat { text-align: right; }
      .cc-tm-stat-value { font-size: 20px; font-weight: 700; color: #8b5cf6; }
      .cc-tm-stat-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
      .cc-tm-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; }
      .cc-tm-tab { padding: 8px 16px; font-size: 12px; font-weight: 600; background: none; border: none; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: inherit; }
      .cc-tm-tab.active { color: #8b5cf6; border-bottom-color: #8b5cf6; }
      .cc-tm-tab:hover { color: #e2e8f0; }
      .cc-tm-btn { padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s; font-family: inherit; display: inline-flex; align-items: center; gap: 4px; }
      .cc-tm-btn-primary { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; box-shadow: 0 2px 8px rgba(139,92,246,0.3); }
      .cc-tm-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(139,92,246,0.4); }
      .cc-tm-btn-secondary { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
      .cc-tm-btn-secondary:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
      .cc-tm-btn-danger { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-tm-search { padding: 8px 14px 8px 36px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #fff; font-size: 13px; font-family: inherit; width: 280px; max-width: 100%; box-sizing: border-box; }
 }
      .cc-tm-search:focus { outline: none; border-color: #8b5cf6; }
      .cc-tm-search::placeholder { color: #475569; }
      .cc-tm-search-wrap { position: relative; display: inline-block; }
      .cc-tm-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; }
      .cc-tm-orders-scroll { max-height: 420px; min-height: 280px; overflow-y: auto; overflow-x: auto; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(139,92,246,0.4) rgba(255,255,255,0.05); }
      .cc-tm-orders-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
      .cc-tm-orders-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 4px; }
      .cc-tm-orders-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 4px; }
      .cc-tm-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-tm-table thead { position: sticky; top: 0; z-index: 1; }
      .cc-tm-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(15,23,42,0.95); backdrop-filter: blur(4px); }
      .cc-tm-table td { padding: 12px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #cbd5e1; vertical-align: middle; }
      .cc-tm-table tr:hover td { background: rgba(139,92,246,0.05); }
      .cc-tm-tender-id { font-weight: 600; color: #8b5cf6; cursor: pointer; }
      .cc-tm-tender-id:hover { text-decoration: underline; }
      .cc-tm-amount { font-weight: 600; color: #8b5cf6; font-family: 'Monaco', 'Menlo', monospace; }
      .cc-tm-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-tm-status-draft { background: rgba(100,116,139,0.15); color: #64748b; border: 1px solid rgba(100,116,139,0.3); }
      .cc-tm-status-open { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
      .cc-tm-status-bidding { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-tm-status-awarded { background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); }
      .cc-tm-status-expired { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-tm-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); z-index: 10003; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
      .cc-tm-modal { background: #0f172a; border: 1px solid rgba(139,92,246,0.3); border-radius: 16px; max-width: 640px; width: 100%; max-height: 85vh; overflow-y: auto; padding: 32px; color: #e2e8f0; box-shadow: 0 20px 60px rgba(0,0,0,0.5); position: relative; }
      .cc-tm-modal h2 { margin: 0 0 4px; font-size: 22px; color: #fff; }
      .cc-tm-modal h3 { margin: 20px 0 10px; font-size: 14px; color: #8b5cf6; }
      .cc-tm-modal-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 18px; cursor: pointer; line-height: 1; }
      .cc-tm-detail-section { background: rgba(255,255,255,0.03); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
      .cc-tm-detail-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); }
      .cc-tm-detail-row:last-child { border-bottom: none; }
      .cc-tm-detail-label { color: #94a3b8; }
      .cc-tm-detail-value { color: #e2e8f0; font-weight: 500; }
      .cc-tm-timeline { position: relative; padding-left: 20px; }
      .cc-tm-timeline::before { content: ''; position: absolute; left: 6px; top: 0; bottom: 0; width: 2px; background: rgba(139,92,246,0.2); }
      .cc-tm-timeline-item { position: relative; padding: 8px 0 8px 16px; font-size: 12px; }
      .cc-tm-timeline-item::before { content: ''; position: absolute; left: -20px; top: 14px; width: 10px; height: 10px; border-radius: 50%; background: #8b5cf6; border: 2px solid #0f172a; }
      .cc-tm-timeline-event { color: #e2e8f0; font-weight: 500; }
      .cc-tm-timeline-time { color: #64748b; font-size: 11px; }
      .cc-tm-timeline-details { color: #94a3b8; font-size: 11px; margin-top: 2px; }
      .cc-tm-chart { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; }
      .cc-tm-chart-section { flex: 1; min-width: 280px; }
      .cc-tm-chart-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 10px; font-weight: 600; }
      .cc-tm-chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 80px; padding: 0 4px; }
      .cc-tm-chart-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
      .cc-tm-chart-bar { width: 100%; max-width: 36px; border-radius: 4px 4px 0 0; transition: height 0.4s ease; min-height: 4px; position: relative; cursor: pointer; }
      .cc-tm-chart-bar:hover { opacity: 0.85; }
      .cc-tm-chart-bar-tooltip { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: #1e293b; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; margin-bottom: 4px; z-index: 5; }
      .cc-tm-chart-bar:hover .cc-tm-chart-bar-tooltip { opacity: 1; }
      .cc-tm-chart-label { font-size: 9px; color: #64748b; text-transform: uppercase; text-align: center; }
      .cc-tm-chart-value { font-size: 11px; font-weight: 700; color: #e2e8f0; }
      .cc-tm-bulk-bar { display: none; align-items: center; justify-content: space-between; padding: 10px 14px; margin-bottom: 12px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; flex-wrap: wrap; gap: 8px; }
      .cc-tm-bulk-bar.active { display: flex; }
      .cc-tm-bulk-count { font-size: 13px; color: #c4b5fd; font-weight: 600; }
      .cc-tm-bulk-actions { display: flex; gap: 6px; flex-wrap: wrap; }
      .cc-tm-checkbox { width: 16px; height: 16px; cursor: pointer; accent-color: #8b5cf6; }
      .cc-tm-checkbox-cell { width: 32px; text-align: center; }
      .cc-tm-toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; z-index: 10006; box-shadow: 0 8px 24px rgba(139,92,246,0.4); font-family: -apple-system, BlinkMacSystemFont, sans-serif; transition: opacity 0.3s, transform 0.3s; max-width: 90vw; text-align: center; }
      @media (max-width: 767px) {
        .cc-tm-panel { padding: 16px; }
        .cc-tm-panel-modal { padding: 60px 12px 16px; }
        .cc-tm-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        .cc-tm-stats { width: 100%; justify-content: space-between; }
        .cc-tm-stat { text-align: left; }
        .cc-tm-tabs { flex-wrap: wrap; gap: 2px; }
        .cc-tm-tab { padding: 6px 10px; font-size: 11px; }
        .cc-tm-search { width: 100%; }
        .cc-tm-search-wrap { display: block; width: 100%; }
        .cc-tm-orders-scroll { border: none; max-height: none; min-height: 0; overflow: visible; }
        .cc-tm-table { display: none; }
        .cc-tm-cards { display: flex; flex-direction: column; gap: 12px; }
        .cc-tm-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px; }
        .cc-tm-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .cc-tm-card-id { font-weight: 700; color: #8b5cf6; font-size: 13px; cursor: pointer; }
        .cc-tm-card-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
        .cc-tm-card-label { color: #64748b; }
        .cc-tm-card-value { color: #e2e8f0; text-align: right; max-width: 60%; }
        .cc-tm-card-actions { margin-top: 10px; display: flex; gap: 8px; }
        .cc-tm-card-actions .cc-tm-btn { flex: 1; justify-content: center; }
      }
      .cc-tm-cards { display: none; }
      @media (max-width: 767px) { .cc-tm-cards { display: flex; } }

      /* Detail view tabs */
      .cc-tm-detail-tabs {
        display: flex; gap: 2px; margin-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap;
      }
      .cc-tm-detail-tab {
        padding: 8px 14px; font-size: 12px; font-weight: 600;
        background: none; border: none; color: #94a3b8; cursor: pointer;
        border-bottom: 2px solid transparent; transition: all 0.2s;
        font-family: inherit; display: flex; align-items: center; gap: 4px;
      }
      .cc-tm-detail-tab.active { color: #8b5cf6; border-bottom-color: #8b5cf6; }
      .cc-tm-detail-tab:hover { color: #e2e8f0; }
      .cc-tm-detail-tab-badge {
        font-size: 9px; padding: 1px 6px; border-radius: 8px;
        background: rgba(139,92,246,0.2); color: #c4b5fd; font-weight: 700;
      }

      /* Document checklist */
      .cc-tm-doc-item {
        display: flex; align-items: center; gap: 10px; padding: 10px 12px;
        border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
        margin-bottom: 6px; transition: background 0.2s;
      }
      .cc-tm-doc-item:hover { background: rgba(139,92,246,0.04); }
      .cc-tm-doc-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
      .cc-tm-doc-uploaded { background: rgba(16,185,129,0.15); color: #10B981; }
      .cc-tm-doc-pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
      .cc-tm-doc-info { flex: 1; min-width: 0; }
      .cc-tm-doc-name { font-size: 13px; color: #e2e8f0; font-weight: 600; }
      .cc-tm-doc-desc { font-size: 11px; color: #64748b; }
      .cc-tm-doc-meta { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-tm-doc-required { font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(239,68,68,0.15); color: #ef4444; font-weight: 700; text-transform: uppercase; }
      .cc-tm-doc-optional { font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(100,116,139,0.15); color: #64748b; font-weight: 700; text-transform: uppercase; }

      /* Bid comparison matrix */
      .cc-tm-comparison-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-tm-comparison-table th {
        text-align: center; padding: 10px 8px; font-size: 10px;
        text-transform: uppercase; color: #64748b;
        border-bottom: 2px solid rgba(139,92,246,0.2);
      }
      .cc-tm-comparison-table th:first-child { text-align: left; }
      .cc-tm-comparison-table td {
        padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.05);
        text-align: center; color: #cbd5e1;
      }
      .cc-tm-comparison-table td:first-child { text-align: left; font-weight: 600; color: #94a3b8; }
      .cc-tm-comparison-winner { background: rgba(16,185,129,0.08) !important; }
      .cc-tm-comparison-winner td { color: #10B981 !important; font-weight: 600; }
      .cc-tm-score-bar {
        display: inline-block; width: 60px; height: 6px; border-radius: 3px;
        background: rgba(255,255,255,0.08); position: relative; margin-right: 6px;
        vertical-align: middle;
      }
      .cc-tm-score-fill { height: 100%; border-radius: 3px; }
      .cc-tm-compliance-yes { color: #10B981; font-weight: 700; }
      .cc-tm-compliance-no { color: #ef4444; font-weight: 700; }
      .cc-tm-trophy { font-size: 14px; }

      /* Evaluation scores */
      .cc-tm-eval-row {
        display: flex; align-items: center; gap: 12px; padding: 10px 0;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .cc-tm-eval-criterion { flex: 1; }
      .cc-tm-eval-name { font-size: 13px; color: #e2e8f0; font-weight: 600; }
      .cc-tm-eval-weight { font-size: 10px; color: #64748b; }
      .cc-tm-eval-score { font-size: 18px; font-weight: 800; color: #8b5cf6; min-width: 50px; text-align: right; }
      .cc-tm-eval-bar { width: 100px; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; }
      .cc-tm-eval-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #8b5cf6, #ec4899); }

      /* Application form preview */
      .cc-tm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      @media (max-width: 600px) { .cc-tm-form-grid { grid-template-columns: 1fr; } }
      .cc-tm-form-field { padding: 8px 0; }
      .cc-tm-form-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 2px; }
      .cc-tm-form-value { font-size: 13px; color: #e2e8f0; }

      /* Info banner */
      .cc-tm-info-banner {
        display: flex; gap: 12px; padding: 12px 16px; border-radius: 8px;
        background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2);
        margin-bottom: 16px; font-size: 12px; color: #c4b5fd;
      }
      .cc-tm-info-banner-icon { font-size: 16px; flex-shrink: 0; }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------------
  let currentFilter = 'all';
  let currentSearch = '';
  let selectedTenderIds = new Set();

  // ------------------------------------------------------------------
  // RENDER PANEL
  // ------------------------------------------------------------------
  function renderPanel() {
    const db = initDatabase();
    const openCount = db.tenders.filter(t => t.status === 'open').length;
    const biddingCount = db.tenders.filter(t => t.status === 'bidding').length;
    const awardedCount = db.tenders.filter(t => t.status === 'awarded').length;
    const totalBidValue = db.bids.reduce((sum, b) => sum + b.bid_value, 0);

    const overlay = document.createElement('div');
    overlay.id = 'cc-tm-panel-overlay';
    overlay.className = 'cc-tm-panel-modal';
    overlay.innerHTML = `
      <button class="cc-tm-close-panel" onclick="window.__ccTM.closePanel()" aria-label="Close tender management">×</button>
      <div class="cc-tm-panel-inner">
        <div class="cc-tm-panel">
          <div class="cc-tm-header">
            <div>
              <h3 class="cc-tm-title">Tender Management <span class="cc-tm-title-badge">LIVE DEMO</span></h3>
              <div style="font-size:11px;color:#64748b;margin-top:4px">Synthetic database · ${db.tenders.length} tenders · ${db.suppliers.length} suppliers · ${db.bids.length} bids</div>
            </div>
            <div class="cc-tm-stats">
              <div class="cc-tm-stat"><div class="cc-tm-stat-value">${openCount}</div><div class="cc-tm-stat-label">Open</div></div>
              <div class="cc-tm-stat"><div class="cc-tm-stat-value">${biddingCount}</div><div class="cc-tm-stat-label">Bidding</div></div>
              <div class="cc-tm-stat"><div class="cc-tm-stat-value">${awardedCount}</div><div class="cc-tm-stat-label">Awarded</div></div>
              <div class="cc-tm-stat"><div class="cc-tm-stat-value">${formatCurrency(totalBidValue)}</div><div class="cc-tm-stat-label">Bid Value</div></div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
            <div class="cc-tm-tabs">
              <button class="cc-tm-tab active" data-filter="all">All Tenders</button>
              <button class="cc-tm-tab" data-filter="draft">Draft</button>
              <button class="cc-tm-tab" data-filter="open">Open</button>
              <button class="cc-tm-tab" data-filter="bidding">Bidding</button>
              <button class="cc-tm-tab" data-filter="awarded">Awarded</button>
              <button class="cc-tm-tab" data-filter="expired">Expired</button>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="cc-tm-btn cc-tm-btn-primary" id="cc-tm-new-tender">+ New Tender</button>
              <button class="cc-tm-btn cc-tm-btn-secondary" id="cc-tm-export-csv">⬇ Export CSV</button>
              <button class="cc-tm-btn cc-tm-btn-secondary" id="cc-tm-reset-db">↻ Reset Data</button>
            </div>
          </div>
          <div id="cc-tm-chart-container"></div>
          <div class="cc-tm-bulk-bar" id="cc-tm-bulk-bar">
            <span class="cc-tm-bulk-count" id="cc-tm-bulk-count">0 selected</span>
            <div class="cc-tm-bulk-actions">
              <button class="cc-tm-btn cc-tm-btn-primary" style="background:linear-gradient(135deg,#f59e0b,#ec4899)" onclick="window.__ccTM.bulkOpenBidding()">🔓 Open Bidding</button>
              <button class="cc-tm-btn cc-tm-btn-secondary" onclick="window.__ccTM.bulkExportCSV()">⬇ Export Selected</button>
              <button class="cc-tm-btn cc-tm-btn-danger" onclick="window.__ccTM.clearSelection()">✕ Clear</button>
            </div>
          </div>
          <div style="margin-bottom:12px">
            <div class="cc-tm-search-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" class="cc-tm-search" id="cc-tm-search-input" placeholder="Search by tender ID, supplier, or title...">
            </div>
            <span id="cc-tm-search-count" style="font-size:11px;color:#64748b;margin-left:12px"></span>
          </div>
          <div id="cc-tm-tenders-container"></div>
        </div>
      </div>
    `;
    return overlay;
  }

  // ------------------------------------------------------------------
  // RENDER TABLE
  // ------------------------------------------------------------------
  function renderTable(filter, search) {
    const db = initDatabase();
    if (filter !== undefined) currentFilter = filter;
    if (search !== undefined) currentSearch = search;

    let tenders = db.tenders;
    if (currentFilter && currentFilter !== 'all') tenders = tenders.filter(t => t.status === currentFilter);
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      tenders = tenders.filter(t =>
        t.id.toLowerCase().indexOf(q) !== -1 ||
        t.supplier_name.toLowerCase().indexOf(q) !== -1 ||
        t.title.toLowerCase().indexOf(q) !== -1 ||
        t.supplier_email.toLowerCase().indexOf(q) !== -1
      );
    }
    tenders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const container = document.getElementById('cc-tm-tenders-container');
    if (!container) return;

    const countEl = document.getElementById('cc-tm-search-count');
    if (countEl) countEl.textContent = 'Showing ' + tenders.length + ' tender' + (tenders.length !== 1 ? 's' : '');

    if (tenders.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:60px 40px;color:#64748b;font-size:13px;min-height:280px;display:flex;align-items:center;justify-content:center"><div><div style="font-size:32px;margin-bottom:8px;opacity:0.4">🔍</div>No tenders match your filter or search.<br><span style="font-size:11px">Try a different tab or clear the search box.</span></div></div>';
      return;
    }

    container.innerHTML = `
      <div class="cc-tm-orders-scroll">
      <table class="cc-tm-table">
        <thead>
          <tr>
            <th class="cc-tm-checkbox-cell"><input type="checkbox" class="cc-tm-checkbox" id="cc-tm-select-all" onchange="window.__ccTM.toggleSelectAll(this.checked)"></th>
            <th>Tender ID</th>
            <th>Supplier</th>
            <th>Title</th>
            <th>Est. Value</th>
            <th>Status</th>
            <th>Deadline</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${tenders.map(t => `
            <tr>
              <td class="cc-tm-checkbox-cell"><input type="checkbox" class="cc-tm-checkbox cc-tm-row-checkbox" value="${t.id}" onchange="window.__ccTM.updateBulkBar()"></td>
              <td><span class="cc-tm-tender-id" onclick="window.__ccTM.showDetail('${t.id}')">${t.id}</span></td>
              <td>${t.supplier_name}<div style="font-size:10px;color:#64748b">${t.supplier_country}</div></td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.title}</td>
              <td class="cc-tm-amount">${formatCurrency(t.estimated_value)}</td>
              <td><span class="cc-tm-status cc-tm-status-${t.status}">${t.status}</span></td>
              <td style="font-size:11px;color:#64748b">${new Date(t.deadline).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}</td>
              <td>
                ${t.status === 'draft'
                  ? `<button class="cc-tm-btn cc-tm-btn-primary" onclick="window.__ccTM.openTender('${t.id}')">🔓 Open</button>`
                  : t.status === 'open'
                  ? `<button class="cc-tm-btn cc-tm-btn-primary" style="background:linear-gradient(135deg,#f59e0b,#ec4899)" onclick="window.__ccTM.startBidding('${t.id}')">🔨 Start Bidding</button>`
                  : t.status === 'bidding'
                  ? `<button class="cc-tm-btn cc-tm-btn-primary" style="background:linear-gradient(135deg,#10B981,#06B6D4)" onclick="window.__ccTM.awardTender('${t.id}')">🏆 Award</button>`
                  : ``
                }
                ${t.status === 'awarded' ? `<button class="cc-tm-btn cc-tm-btn-secondary" onclick="window.__ccTM.downloadReceipt('${t.id}')" title="Download award receipt">🧾</button>` : ``}
                <button class="cc-tm-btn cc-tm-btn-secondary" onclick="window.__ccTM.showDetail('${t.id}')">View</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </div>
      <div class="cc-tm-cards">
        ${tenders.map(t => `
          <div class="cc-tm-card">
            <div class="cc-tm-card-header">
              <span class="cc-tm-card-id" onclick="window.__ccTM.showDetail('${t.id}')">${t.id}</span>
              <span class="cc-tm-status cc-tm-status-${t.status}">${t.status}</span>
            </div>
            <div class="cc-tm-card-row"><span class="cc-tm-card-label">Supplier</span><span class="cc-tm-card-value">${t.supplier_name}</span></div>
            <div class="cc-tm-card-row"><span class="cc-tm-card-label">Title</span><span class="cc-tm-card-value" style="font-size:11px">${t.title}</span></div>
            <div class="cc-tm-card-row"><span class="cc-tm-card-label">Value</span><span class="cc-tm-card-value" style="color:#8b5cf6;font-weight:700">${formatCurrency(t.estimated_value)}</span></div>
            <div class="cc-tm-card-row"><span class="cc-tm-card-label">Deadline</span><span class="cc-tm-card-value" style="font-size:11px">${new Date(t.deadline).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}</span></div>
            <div class="cc-tm-card-actions">
              ${t.status === 'draft' ? `<button class="cc-tm-btn cc-tm-btn-primary" onclick="window.__ccTM.openTender('${t.id}')">🔓 Open</button>` : ''}
              ${t.status === 'open' ? `<button class="cc-tm-btn cc-tm-btn-primary" style="background:linear-gradient(135deg,#f59e0b,#ec4899)" onclick="window.__ccTM.startBidding('${t.id}')">🔨 Bid</button>` : ''}
              ${t.status === 'bidding' ? `<button class="cc-tm-btn cc-tm-btn-primary" style="background:linear-gradient(135deg,#10B981,#06B6D4)" onclick="window.__ccTM.awardTender('${t.id}')">🏆 Award</button>` : ''}
              ${t.status === 'awarded' ? `<button class="cc-tm-btn cc-tm-btn-secondary" onclick="window.__ccTM.downloadReceipt('${t.id}')">🧾 Receipt</button>` : ''}
              <button class="cc-tm-btn cc-tm-btn-secondary" onclick="window.__ccTM.showDetail('${t.id}')">View</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // CHART
  // ------------------------------------------------------------------
  function renderChart() {
    const db = initDatabase();
    const chartContainer = document.getElementById('cc-tm-chart-container');
    if (!chartContainer) return;

    const statusCounts = { draft: 0, open: 0, bidding: 0, awarded: 0, expired: 0 };
    db.tenders.forEach(t => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });
    const maxCount = Math.max(...Object.values(statusCounts), 1);
    const statusColors = { draft: '#64748b', open: '#3b82f6', bidding: '#f59e0b', awarded: '#10B981', expired: '#ef4444' };

    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dayKey = d.toISOString().substr(0, 10);
      const dayValue = db.bids.filter(b => b.submitted_at.substr(0, 10) === dayKey).reduce((sum, b) => sum + b.bid_value, 0);
      days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: dayValue, date: dayKey });
    }
    const maxValue = Math.max(...days.map(d => d.value), 1);

    chartContainer.innerHTML = `
      <div class="cc-tm-chart">
        <div class="cc-tm-chart-section">
          <div class="cc-tm-chart-title">Tenders by Status</div>
          <div class="cc-tm-chart-bars">
            ${Object.entries(statusCounts).map(([status, count]) => `
              <div class="cc-tm-chart-bar-wrap">
                <div class="cc-tm-chart-value">${count}</div>
                <div class="cc-tm-chart-bar" style="height: ${(count / maxCount * 100)}%; background: ${statusColors[status]}" onclick="window.__ccTM.filterByStatus('${status}')">
                  <div class="cc-tm-chart-bar-tooltip">${status}: ${count} tender${count !== 1 ? 's' : ''}</div>
                </div>
                <div class="cc-tm-chart-label">${status.substr(0, 4)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="cc-tm-chart-section">
          <div class="cc-tm-chart-title">Bid Value — Last 7 Days</div>
          <div class="cc-tm-chart-bars">
            ${days.map(d => `
              <div class="cc-tm-chart-bar-wrap">
                <div class="cc-tm-chart-value">${d.value > 0 ? '$' + (d.value / 1000).toFixed(0) + 'k' : ''}</div>
                <div class="cc-tm-chart-bar" style="height: ${(d.value / maxValue * 100)}%; background: linear-gradient(180deg, #8b5cf6, #ec4899)">
                  <div class="cc-tm-chart-bar-tooltip">${d.label}: ${formatCurrency(d.value)}</div>
                </div>
                <div class="cc-tm-chart-label">${d.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function filterByStatus(status) {
    const tab = document.querySelector('.cc-tm-tab[data-filter="' + status + '"]');
    if (tab) tab.click();
  }

  // ------------------------------------------------------------------
  // STATUS PROGRESSION: draft → open → bidding → awarded
  // ------------------------------------------------------------------
  function openTender(tenderId) {
    const db = initDatabase();
    const tender = db.tenders.find(t => t.id === tenderId);
    if (!tender || tender.status !== 'draft') return;
    tender.status = 'open';
    tender.updated_at = new Date().toISOString();
    logAudit(db, tender.id, 'tender_opened', 'Tender opened for bidding');
    saveDatabase(db);
    showToast('Tender ' + tender.id + ' opened for bidding');
    refreshStats(); renderChart(); renderTable(currentFilter, currentSearch);
  }

  function startBidding(tenderId) {
    const db = initDatabase();
    const tender = db.tenders.find(t => t.id === tenderId);
    if (!tender || tender.status !== 'open') return;
    tender.status = 'bidding';
    tender.updated_at = new Date().toISOString();
    // Generate 2-4 synthetic bids
    const bidCount = Math.floor(Math.random() * 3) + 2;
    for (let b = 0; b < bidCount; b++) {
      const supplier = SYNTHETIC_SUPPLIERS[Math.floor(Math.random() * SYNTHETIC_SUPPLIERS.length)];
      const bidValue = tender.estimated_value - Math.floor(Math.random() * 40000) + Math.floor(Math.random() * 20000);
      db.bids.push({
        id: generateId('bid'), tender_id: tender.id, supplier_id: supplier.id,
        supplier_name: supplier.name, supplier_email: supplier.email,
        bid_value: bidValue, currency: 'USD', status: 'submitted',
        submitted_at: new Date().toISOString(), proposal: 'Synthetic bid proposal'
      });
    }
    logAudit(db, tender.id, 'bidding_started', 'Bidding started — ' + bidCount + ' bids submitted');
    logEmail(db, { id: generateId('eml'), tender_id: tender.id, to: tender.supplier_email, subject: 'Bidding Opened — ' + tender.id, sent_at: new Date().toISOString(), status: 'delivered' });
    saveDatabase(db);
    showToast('Bidding started for ' + tender.id + ' — ' + bidCount + ' bids received');
    refreshStats(); renderChart(); renderTable(currentFilter, currentSearch);
  }

  function awardTender(tenderId) {
    const db = initDatabase();
    const tender = db.tenders.find(t => t.id === tenderId);
    if (!tender || tender.status !== 'bidding') return;
    const bids = db.bids.filter(b => b.tender_id === tenderId && b.status === 'submitted');
    if (bids.length === 0) { showToast('No bids to award'); return; }
    // Award to lowest bid
    bids.sort((a, b) => a.bid_value - b.bid_value);
    const winningBid = bids[0];
    winningBid.status = 'awarded';
    tender.awarded_bid_id = winningBid.id;
    tender.status = 'awarded';
    tender.updated_at = new Date().toISOString();
    bids.forEach(b => { if (b.id !== winningBid.id) b.status = 'rejected'; });
    logAudit(db, tender.id, 'tender_awarded', 'Tender awarded to ' + winningBid.supplier_name + ' for ' + formatCurrency(winningBid.bid_value));
    logEmail(db, { id: generateId('eml'), tender_id: tender.id, to: winningBid.supplier_email, subject: 'Tender Award Notification — ' + tender.id, sent_at: new Date().toISOString(), status: 'delivered' });
    saveDatabase(db);
    showToast('Tender ' + tender.id + ' awarded to ' + winningBid.supplier_name);
    refreshStats(); renderChart(); renderTable(currentFilter, currentSearch);
  }

  // ------------------------------------------------------------------
  // TENDER DETAIL MODAL
  // ------------------------------------------------------------------
  function showDetail(tenderId, activeTab) {
    const db = initDatabase();
    const tender = db.tenders.find(t => t.id === tenderId);
    if (!tender) return;
    const bids = db.bids.filter(b => b.tender_id === tenderId).sort((a, b) => a.bid_value - b.bid_value);
    const evaluations = db.evaluations.filter(e => e.tender_id === tenderId).sort((a, b) => b.total_score - a.total_score);
    const documents = db.documents.filter(d => d.tender_id === tenderId);
    const emails = db.emails.filter(e => e.tender_id === tenderId);
    const audit = db.audit_log.filter(a => a.tender_id === tenderId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const awardedBid = tender.awarded_bid_id ? db.bids.find(b => b.id === tender.awarded_bid_id) : null;

    const tab = activeTab || 'overview';

    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'cc-tm-modal-overlay';
    overlay.id = 'cc-tm-modal-overlay';
    overlay.innerHTML = `
      <div class="cc-tm-modal" style="position:relative;max-width:880px">
        <button class="cc-tm-modal-close" onclick="window.__ccTM.closeModal()">×</button>
        <h2>${tender.title}</h2>
        <div style="font-size:13px;color:#94a3b8;margin-bottom:16px">
          ${tender.id} · <span class="cc-tm-status cc-tm-status-${tender.status}">${tender.status}</span>
          ${awardedBid ? ' · <span style="color:#10B981">🏆 Awarded to ' + awardedBid.supplier_name + '</span>' : ''}
        </div>

        <div class="cc-tm-info-banner">
          <div class="cc-tm-info-banner-icon">ℹ️</div>
          <div>
            <strong>Scope:</strong> ${tender.scope || tender.description}<br>
            <strong>Procurement Officer:</strong> ${tender.procurement_officer} · <strong>Budget:</strong> ${tender.budget_code} · <strong>Region:</strong> ${tender.region}
          </div>
        </div>

        <div class="cc-tm-detail-tabs">
          <button class="cc-tm-detail-tab ${tab === 'overview' ? 'active' : ''}" onclick="window.__ccTM.showDetail('${tender.id}', 'overview')">📋 Overview</button>
          <button class="cc-tm-detail-tab ${tab === 'documents' ? 'active' : ''}" onclick="window.__ccTM.showDetail('${tender.id}', 'documents')">📎 Documents <span class="cc-tm-detail-tab-badge">${documents.length}</span></button>
          <button class="cc-tm-detail-tab ${tab === 'bids' ? 'active' : ''}" onclick="window.__ccTM.showDetail('${tender.id}', 'bids')">🔨 Bids <span class="cc-tm-detail-tab-badge">${bids.length}</span></button>
          <button class="cc-tm-detail-tab ${tab === 'evaluation' ? 'active' : ''}" onclick="window.__ccTM.showDetail('${tender.id}', 'evaluation')">📊 Evaluation <span class="cc-tm-detail-tab-badge">${evaluations.length}</span></button>
          <button class="cc-tm-detail-tab ${tab === 'compliance' ? 'active' : ''}" onclick="window.__ccTM.showDetail('${tender.id}', 'compliance')">✅ Compliance</button>
          <button class="cc-tm-detail-tab ${tab === 'timeline' ? 'active' : ''}" onclick="window.__ccTM.showDetail('${tender.id}', 'timeline')">📅 Timeline</button>
        </div>

        <div id="cc-tm-detail-content">
          ${renderDetailTab(tab, tender, bids, evaluations, documents, emails, audit, awardedBid)}
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="cc-tm-btn cc-tm-btn-secondary" onclick="window.__ccTM.closeModal()" style="flex:1">Close</button>
          ${tender.status === 'draft' ? `<button class="cc-tm-btn cc-tm-btn-primary" onclick="window.__ccTM.openTender('${tender.id}')" style="flex:1">🔓 Open for Bidding</button>` : ''}
          ${tender.status === 'open' ? `<button class="cc-tm-btn cc-tm-btn-primary" style="background:linear-gradient(135deg,#f59e0b,#ec4899)" onclick="window.__ccTM.startBidding('${tender.id}')" style="flex:1">🔨 Start Bidding</button>` : ''}
          ${tender.status === 'bidding' ? `<button class="cc-tm-btn cc-tm-btn-primary" style="background:linear-gradient(135deg,#10B981,#06B6D4)" onclick="window.__ccTM.awardTender('${tender.id}')" style="flex:1">🏆 Award Tender</button>` : ''}
          ${tender.status === 'awarded' ? `<button class="cc-tm-btn cc-tm-btn-secondary" onclick="window.__ccTM.downloadReceipt('${tender.id}')" style="flex:1">🧾 Download Award Receipt</button>` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function renderDetailTab(tab, tender, bids, evaluations, documents, emails, audit, awardedBid) {
    if (tab === 'overview') return renderOverviewTab(tender, bids, awardedBid);
    if (tab === 'documents') return renderDocumentsTab(tender, documents);
    if (tab === 'bids') return renderBidsTab(tender, bids, evaluations, awardedBid);
    if (tab === 'evaluation') return renderEvaluationTab(tender, evaluations, awardedBid);
    if (tab === 'compliance') return renderComplianceTab(tender, bids, awardedBid);
    if (tab === 'timeline') return renderTimelineTab(tender, audit, emails);
    return renderOverviewTab(tender, bids, awardedBid);
  }

  function renderOverviewTab(tender, bids, awardedBid) {
    const daysToDeadline = Math.ceil((new Date(tender.deadline) - Date.now()) / 86400000);
    return `
      <div class="cc-tm-detail-section">
        <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Tender ID</span><span class="cc-tm-detail-value">${tender.id}</span></div>
        <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Category</span><span class="cc-tm-detail-value">${tender.category}</span></div>
        <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Region</span><span class="cc-tm-detail-value">${tender.region}</span></div>
        <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Budget Code</span><span class="cc-tm-detail-value">${tender.budget_code}</span></div>
        <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Estimated Value</span><span class="cc-tm-detail-value" style="color:#8b5cf6;font-weight:700">${formatCurrency(tender.estimated_value)}</span></div>
        <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Created</span><span class="cc-tm-detail-value">${formatDate(tender.created_at)}</span></div>
        <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Question Deadline</span><span class="cc-tm-detail-value">${formatDate(tender.question_deadline)}</span></div>
        <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Submission Deadline</span><span class="cc-tm-detail-value" style="color:${daysToDeadline < 0 ? '#ef4444' : daysToDeadline < 7 ? '#f59e0b' : '#e2e8f0'};font-weight:600">${formatDate(tender.deadline)} ${daysToDeadline >= 0 ? '(' + daysToDeadline + ' days left)' : '(EXPIRED)'}</span></div>
      </div>

      <h3>👥 Evaluation Committee</h3>
      <div class="cc-tm-detail-section">
        ${tender.evaluation_committee.map((member, i) => `
          <div class="cc-tm-detail-row">
            <span class="cc-tm-detail-label">${i === 0 ? 'Chair' : 'Member'}</span>
            <span class="cc-tm-detail-value">${member}</span>
          </div>
        `).join('')}
      </div>

      ${awardedBid ? `
        <h3>🏆 Award Summary</h3>
        <div class="cc-tm-detail-section" style="border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.04)">
          <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Awarded Supplier</span><span class="cc-tm-detail-value" style="color:#10B981;font-weight:700">${awardedBid.supplier_name}</span></div>
          <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Awarded Value</span><span class="cc-tm-detail-value" style="color:#10B981;font-weight:700">${formatCurrency(awardedBid.bid_value)}</span></div>
          <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Savings vs Estimate</span><span class="cc-tm-detail-value" style="color:#10B981">${formatCurrency(tender.estimated_value - awardedBid.bid_value)} (${Math.round((tender.estimated_value - awardedBid.bid_value) / tender.estimated_value * 100)}%)</span></div>
          <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Proposed Timeline</span><span class="cc-tm-detail-value">${awardedBid.proposed_timeline} weeks</span></div>
        </div>
      ` : ''}

      <h3>📊 Bid Summary</h3>
      <div class="cc-tm-detail-section">
        <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Total Bids Received</span><span class="cc-tm-detail-value">${bids.length}</span></div>
        ${bids.length > 0 ? `
          <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Lowest Bid</span><span class="cc-tm-detail-value" style="color:#10B981">${formatCurrency(Math.min(...bids.map(b => b.bid_value)))}</span></div>
          <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Highest Bid</span><span class="cc-tm-detail-value">${formatCurrency(Math.max(...bids.map(b => b.bid_value)))}</span></div>
          <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Average Bid</span><span class="cc-tm-detail-value">${formatCurrency(bids.reduce((s, b) => s + b.bid_value, 0) / bids.length)}</span></div>
        ` : '<div style="color:#64748b;font-size:12px;padding:8px 0">No bids received yet.</div>'}
      </div>
    `;
  }

  function renderDocumentsTab(tender, documents) {
    const uploaded = documents.filter(d => d.status === 'uploaded');
    const pending = documents.filter(d => d.status === 'pending');
    return `
      <div class="cc-tm-info-banner">
        <div class="cc-tm-info-banner-icon">📎</div>
        <div><strong>Document Checklist:</strong> ${uploaded.length} uploaded, ${pending.length} pending. All required documents must be uploaded before the tender can go live.</div>
      </div>
      ${DOCUMENT_TYPES.map(docType => {
        const doc = documents.find(d => d.type === docType.id);
        const isUploaded = doc && doc.status === 'uploaded';
        return `
          <div class="cc-tm-doc-item">
            <div class="cc-tm-doc-icon ${isUploaded ? 'cc-tm-doc-uploaded' : 'cc-tm-doc-pending'}">${isUploaded ? '✓' : '⏳'}</div>
            <div class="cc-tm-doc-info">
              <div class="cc-tm-doc-name">${docType.name} ${docType.required ? '<span class="cc-tm-doc-required">Required</span>' : '<span class="cc-tm-doc-optional">Optional</span>'}</div>
              <div class="cc-tm-doc-desc">${docType.description}</div>
              ${doc ? `<div class="cc-tm-doc-meta">${doc.file_name} · ${(doc.file_size / 1024).toFixed(0)} KB · v${doc.version} · ${doc.uploaded_at ? 'Uploaded ' + formatDate(doc.uploaded_at) : 'Pending'}</div>` : '<div class="cc-tm-doc-meta">Not generated</div>'}
            </div>
            ${isUploaded ? `<button class="cc-tm-btn cc-tm-btn-secondary" onclick="alert('Demo: Would download ${docType.name}')">⬇ Download</button>` : ''}
          </div>
        `;
      }).join('')}
    `;
  }

  function renderBidsTab(tender, bids, evaluations, awardedBid) {
    if (bids.length === 0) {
      return '<div style="text-align:center;padding:40px;color:#64748b"><div style="font-size:32px;margin-bottom:8px;opacity:0.4">🔨</div>No bids received yet.<br><span style="font-size:11px">Bids will appear here when suppliers submit proposals.</span></div>';
    }

    // Bid comparison matrix
    return `
      <h3>📊 Bid Comparison Matrix</h3>
      <div style="overflow-x:auto;margin-bottom:20px">
        <table class="cc-tm-comparison-table">
          <thead>
            <tr>
              <th>Criteria</th>
              ${bids.map(b => `<th>${b.supplier_name.split(' ').slice(0,2).join(' ')}${awardedBid && b.id === awardedBid.id ? ' 🏆' : ''}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr ${awardedBid ? '' : ''}>
              <td>Bid Value</td>
              ${bids.map(b => `<td style="color:${awardedBid && b.id === awardedBid.id ? '#10B981' : '#e2e8f0'};font-weight:600">${formatCurrency(b.bid_value)}</td>`).join('')}
            </tr>
            <tr>
              <td>Timeline (weeks)</td>
              ${bids.map(b => `<td>${b.proposed_timeline}</td>`).join('')}
            </tr>
            <tr>
              <td>Experience (years)</td>
              ${bids.map(b => `<td>${b.application_form ? b.application_form.years_experience : '—'}</td>`).join('')}
            </tr>
            <tr>
              <td>Country</td>
              ${bids.map(b => `<td style="font-size:11px">${b.supplier_country}</td>`).join('')}
            </tr>
            ${EVALUATION_CRITERIA.map(criterion => `
              <tr>
                <td>${criterion.name} (${criterion.weight}%)</td>
                ${bids.map(b => {
                  const eval_ = evaluations.find(e => e.bid_id === b.id);
                  const score = eval_ ? eval_.scores[criterion.id] : '—';
                  const isWinner = awardedBid && b.id === awardedBid.id;
                  return `<td class="${isWinner ? 'cc-tm-comparison-winner' : ''}">
                    <span class="cc-tm-score-bar"><span class="cc-tm-score-fill" style="width:${score}%;background:${score >= 80 ? '#10B981' : score >= 70 ? '#f59e0b' : '#ef4444'}"></span></span>
                    ${score}
                  </td>`;
                }).join('')}
              </tr>
            `).join('')}
            <tr style="border-top:2px solid rgba(139,92,246,0.3)">
              <td style="font-weight:800;color:#8b5cf6">TOTAL SCORE</td>
              ${bids.map(b => {
                const eval_ = evaluations.find(e => e.bid_id === b.id);
                const score = eval_ ? eval_.total_score : '—';
                const isWinner = awardedBid && b.id === awardedBid.id;
                return `<td class="${isWinner ? 'cc-tm-comparison-winner' : ''}" style="font-size:16px;font-weight:800;color:#8b5cf6">${score}${isWinner ? ' 🏆' : ''}</td>`;
              }).join('')}
            </tr>
          </tbody>
        </table>
      </div>

      <h3>📝 Individual Bid Details</h3>
      ${bids.map(b => {
        const eval_ = evaluations.find(e => e.bid_id === b.id);
        const isWinner = awardedBid && b.id === awardedBid.id;
        return `
          <div class="cc-tm-detail-section" style="${isWinner ? 'border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.04)' : ''}">
            <div class="cc-tm-detail-row">
              <span class="cc-tm-detail-label">Supplier</span>
              <span class="cc-tm-detail-value" style="${isWinner ? 'color:#10B981;font-weight:700' : ''}">${b.supplier_name} ${isWinner ? '🏆' : ''}</span>
            </div>
            <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Bid Value</span><span class="cc-tm-detail-value" style="color:#8b5cf6;font-weight:700">${formatCurrency(b.bid_value)}</span></div>
            <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Timeline</span><span class="cc-tm-detail-value">${b.proposed_timeline} weeks</span></div>
            <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Total Score</span><span class="cc-tm-detail-value" style="font-weight:700">${eval_ ? eval_.total_score + '/100' : 'Not evaluated'}</span></div>
            <div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Submitted</span><span class="cc-tm-detail-value" style="font-size:11px">${formatDate(b.submitted_at)}</span></div>
            ${b.technical_approach ? `<div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Technical Approach</span><span class="cc-tm-detail-value" style="text-align:right;max-width:400px;font-size:11px">${b.technical_approach}</span></div>` : ''}
            ${b.references ? `<div class="cc-tm-detail-row"><span class="cc-tm-detail-label">References</span><span class="cc-tm-detail-value" style="text-align:right;max-width:400px;font-size:11px">${b.references}</span></div>` : ''}
            ${eval_ && eval_.notes ? `<div class="cc-tm-detail-row"><span class="cc-tm-detail-label">Eval Notes</span><span class="cc-tm-detail-value" style="text-align:right;max-width:400px;font-size:11px;color:${isWinner ? '#10B981' : '#94a3b8'}">${eval_.notes}</span></div>` : ''}
          </div>
        `;
      }).join('')}
    `;
  }

  function renderEvaluationTab(tender, evaluations, awardedBid) {
    if (evaluations.length === 0) {
      return '<div style="text-align:center;padding:40px;color:#64748b"><div style="font-size:32px;margin-bottom:8px;opacity:0.4">📊</div>No evaluations yet.<br><span style="font-size:11px">Evaluations are conducted after bidding closes.</span></div>';
    }

    return `
      <div class="cc-tm-info-banner">
        <div class="cc-tm-info-banner-icon">📊</div>
        <div><strong>Evaluation Methodology:</strong> Weighted scoring across ${EVALUATION_CRITERIA.length} criteria. Each criterion scored 0-100, weighted by importance, then summed for total score (out of 100).</div>
      </div>

      <h3>📋 Evaluation Criteria & Weights</h3>
      <div class="cc-tm-detail-section">
        ${EVALUATION_CRITERIA.map(c => `
          <div class="cc-tm-eval-row">
            <div class="cc-tm-eval-criterion">
              <div class="cc-tm-eval-name">${c.name}</div>
              <div class="cc-tm-eval-weight">${c.description} · Weight: ${c.weight}%</div>
            </div>
            <div class="cc-tm-eval-bar"><div class="cc-tm-eval-bar-fill" style="width:${c.weight * 3.33}%"></div></div>
            <div class="cc-tm-eval-score">${c.weight}%</div>
          </div>
        `).join('')}
      </div>

      <h3>🏆 Score Ranking</h3>
      ${evaluations.map((eval_, i) => {
        const isWinner = awardedBid && eval_.bid_id === awardedBid.id;
        return `
          <div class="cc-tm-detail-section" style="${isWinner ? 'border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.04)' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div>
                <div style="font-size:14px;font-weight:700;color:${isWinner ? '#10B981' : '#e2e8f0'}">${i + 1}. ${eval_.supplier_name} ${isWinner ? '🏆' : ''}</div>
                <div style="font-size:11px;color:#64748b">Evaluated by ${eval_.evaluated_by} on ${formatDate(eval_.evaluated_at)}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:24px;font-weight:800;color:${eval_.total_score >= 85 ? '#10B981' : eval_.total_score >= 75 ? '#f59e0b' : '#ef4444'}">${eval_.total_score}</div>
                <div style="font-size:10px;color:#64748b">/ 100</div>
              </div>
            </div>
            ${EVALUATION_CRITERIA.map(c => {
              const score = eval_.scores[c.id];
              return `
                <div class="cc-tm-eval-row" style="padding:6px 0">
                  <div class="cc-tm-eval-criterion">
                    <div style="font-size:12px;color:#cbd5e1">${c.name}</div>
                  </div>
                  <div class="cc-tm-eval-bar"><div class="cc-tm-eval-bar-fill" style="width:${score}%;background:${score >= 80 ? '#10B981' : score >= 70 ? '#f59e0b' : '#ef4444'}"></div></div>
                  <div style="font-size:13px;font-weight:700;color:${score >= 80 ? '#10B981' : score >= 70 ? '#f59e0b' : '#ef4444'};min-width:40px;text-align:right">${score}</div>
                </div>
              `;
            }).join('')}
            ${eval_.notes ? `<div style="margin-top:8px;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:11px;color:#94a3b8"><strong>Notes:</strong> ${eval_.notes}</div>` : ''}
          </div>
        `;
      }).join('')}
    `;
  }

  function renderComplianceTab(tender, bids, awardedBid) {
    if (bids.length === 0) {
      return '<div style="text-align:center;padding:40px;color:#64748b"><div style="font-size:32px;margin-bottom:8px;opacity:0.4">✅</div>No compliance data yet.<br><span style="font-size:11px">Compliance is evaluated when bids are submitted.</span></div>';
    }

    return `
      <div class="cc-tm-info-banner">
        <div class="cc-tm-info-banner-icon">✅</div>
        <div><strong>Compliance Checklist:</strong> ${COMPLIANCE_ITEMS.filter(i => i.required).length} mandatory items. Bids failing mandatory compliance items may be disqualified.</div>
      </div>

      <h3>📋 Compliance Requirements</h3>
      <div class="cc-tm-detail-section">
        ${COMPLIANCE_ITEMS.map(item => `
          <div class="cc-tm-detail-row">
            <span class="cc-tm-detail-label">${item.name} ${item.required ? '<span class="cc-tm-doc-required" style="margin-left:4px">Required</span>' : '<span class="cc-tm-doc-optional" style="margin-left:4px">Optional</span>'}</span>
          </div>
        `).join('')}
      </div>

      <h3>📊 Supplier Compliance Matrix</h3>
      <div style="overflow-x:auto">
        <table class="cc-tm-comparison-table">
          <thead>
            <tr>
              <th>Compliance Item</th>
              ${bids.map(b => `<th style="font-size:10px">${b.supplier_name.split(' ').slice(0,2).join(' ')}${awardedBid && b.id === awardedBid.id ? ' 🏆' : ''}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${COMPLIANCE_ITEMS.map(item => `
              <tr>
                <td style="font-size:11px">${item.name}${item.required ? ' *' : ''}</td>
                ${bids.map(b => {
                  const compliant = b.compliance_checklist && b.compliance_checklist[item.id];
                  return `<td>${compliant ? '<span class="cc-tm-compliance-yes">✓ Yes</span>' : '<span class="cc-tm-compliance-no">✗ No</span>'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="font-size:10px;color:#64748b;margin-top:8px">* = Required for all bidders</div>
    `;
  }

  function renderTimelineTab(tender, audit, emails) {
    return `
      <div class="cc-tm-info-banner">
        <div class="cc-tm-info-banner-icon">📅</div>
        <div><strong>Tender Lifecycle:</strong> ${audit.length} events tracked. All activities are logged with timestamps for full audit trail and regulatory compliance.</div>
      </div>

      <h3>📧 Notifications Sent (${emails.length})</h3>
      ${emails.length > 0 ? `
        <div class="cc-tm-detail-section">
          ${emails.map(e => `<div class="cc-tm-detail-row"><span class="cc-tm-detail-label">${e.subject}</span><span class="cc-tm-detail-value" style="font-size:11px">${formatDate(e.sent_at)}</span></div>`).join('')}
        </div>
      ` : '<div style="color:#64748b;font-size:12px;padding:8px 0">No notifications sent yet.</div>'}

      <h3>📋 Full Audit Trail (${audit.length} events)</h3>
      <div class="cc-tm-timeline">
        ${audit.map(a => `
          <div class="cc-tm-timeline-item">
            <div class="cc-tm-timeline-event">${a.event.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>
            <div class="cc-tm-timeline-time">${formatDate(a.timestamp)}</div>
            <div class="cc-tm-timeline-details">${a.details}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // RECEIPT (Tender Award Receipt)
  // ------------------------------------------------------------------
  function downloadReceipt(tenderId) {
    const db = initDatabase();
    const tender = db.tenders.find(t => t.id === tenderId);
    if (!tender || tender.status !== 'awarded') { showToast('No award to receipt'); return; }
    const bid = db.bids.find(b => b.id === tender.awarded_bid_id);
    if (!bid) return;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Tender Award Receipt — ${tender.id}</title>
<style>@page{margin:20mm}body{font-family:'Inter',sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:40px 20px;line-height:1.6}
.header{text-align:center;border-bottom:3px solid #8b5cf6;padding-bottom:20px;margin-bottom:30px}
.logo{font-size:24px;font-weight:800;color:#0f172a;margin-bottom:4px}.logo span{color:#8b5cf6}
.title{font-size:20px;font-weight:700;color:#0f172a;margin:30px 0 8px;text-transform:uppercase;letter-spacing:0.05em}
.section{margin-bottom:24px}.section h3{font-size:11px;text-transform:uppercase;color:#64748b;margin:0 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
.row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}.label{color:#64748b}.value{color:#1e293b;font-weight:500}
.total{background:#faf5ff;border:1px solid #8b5cf6;border-radius:8px;padding:12px 16px;margin:16px 0;display:flex;justify-content:space-between}
.total-label{font-size:14px;font-weight:700;color:#6b21a8}.total-value{font-size:20px;font-weight:800;color:#8b5cf6}
.badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;background:#ede9fe;color:#6b21a8;border:1px solid #8b5cf6}
.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8}</style></head><body>
<div class="header"><div class="logo">AI Supply Chain <span>Advanced</span></div><div style="font-size:12px;color:#64748b">Enterprise Intelligence Platform</div></div>
<div class="title">Tender Award Receipt</div>
<div style="font-size:12px;color:#64748b;margin-bottom:24px;display:flex;justify-content:space-between"><span>Receipt #: ${bid.id.substr(-12).toUpperCase()}</span><span>Date: ${formatDate(new Date().toISOString())}</span></div>
<div class="section"><h3>Tender Information</h3>
<div class="row"><span class="label">Tender ID</span><span class="value">${tender.id}</span></div>
<div class="row"><span class="label">Title</span><span class="value">${tender.title}</span></div>
<div class="row"><span class="label">Category</span><span class="value">${tender.category}</span></div>
<div class="row"><span class="label">Status</span><span class="value"><span class="badge">Awarded</span></span></div>
<div class="row"><span class="label">Created</span><span class="value">${formatDate(tender.created_at)}</span></div>
<div class="row"><span class="label">Deadline</span><span class="value">${formatDate(tender.deadline)}</span></div></div>
<div class="section"><h3>Awarded Supplier</h3>
<div class="row"><span class="label">Supplier</span><span class="value">${bid.supplier_name}</span></div>
<div class="row"><span class="label">Email</span><span class="value">${bid.supplier_email}</span></div></div>
<div class="total"><span class="total-label">Awarded Bid Value</span><span class="total-value">${formatCurrency(bid.bid_value)} ${tender.currency}</span></div>
<div class="section"><h3>Original Estimate</h3>
<div class="row"><span class="label">Estimated Value</span><span class="value">${formatCurrency(tender.estimated_value)}</span></div>
<div class="row"><span class="label">Savings</span><span class="value" style="color:#10B981;font-weight:700">${formatCurrency(tender.estimated_value - bid.bid_value)}</span></div></div>
<div class="footer"><p>This is a computer-generated tender award receipt from AI Supply Chain Advanced.</p><p>© 2026 AI Supply Chain Advanced. All rights reserved.</p><p>71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</p><p>Email: testdemoqwenai2025@gmail.com · Phone: +44 (0) 20 7946 0958</p></div>
</body></html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) { showToast('Please allow popups to download the receipt'); return; }
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(function() { printWindow.print(); }, 500);
  }

  // ------------------------------------------------------------------
  // BULK ACTIONS
  // ------------------------------------------------------------------
  function toggleSelectAll(checked) {
    document.querySelectorAll('.cc-tm-row-checkbox').forEach(cb => {
      cb.checked = checked;
      if (checked) selectedTenderIds.add(cb.value); else selectedTenderIds.delete(cb.value);
    });
    updateBulkBar();
  }

  function updateBulkBar() {
    selectedTenderIds = new Set();
    document.querySelectorAll('.cc-tm-row-checkbox:checked').forEach(cb => selectedTenderIds.add(cb.value));
    const bulkBar = document.getElementById('cc-tm-bulk-bar');
    const countEl = document.getElementById('cc-tm-bulk-count');
    if (bulkBar && countEl) {
      const count = selectedTenderIds.size;
      countEl.textContent = count + ' tender' + (count !== 1 ? 's' : '') + ' selected';
      if (count > 0) bulkBar.classList.add('active'); else bulkBar.classList.remove('active');
    }
  }

  function clearSelection() {
    document.querySelectorAll('.cc-tm-row-checkbox').forEach(cb => { cb.checked = false; });
    const selectAll = document.getElementById('cc-tm-select-all');
    if (selectAll) selectAll.checked = false;
    selectedTenderIds = new Set();
    updateBulkBar();
  }

  function bulkOpenBidding() {
    const db = initDatabase();
    const tenders = db.tenders.filter(t => selectedTenderIds.has(t.id) && t.status === 'open');
    if (tenders.length === 0) { showToast('No open tenders selected'); return; }
    if (!confirm('Start bidding for ' + tenders.length + ' tender(s)?')) return;
    tenders.forEach(t => startBidding(t.id));
    clearSelection();
  }

  function bulkExportCSV() {
    const db = initDatabase();
    const tenders = db.tenders.filter(t => selectedTenderIds.has(t.id));
    if (tenders.length === 0) { showToast('No tenders selected'); return; }
    const headers = ['Tender ID', 'Supplier', 'Email', 'Country', 'Title', 'Category', 'Est. Value', 'Currency', 'Status', 'Created', 'Deadline'];
    const rows = tenders.map(t => [t.id, '"' + t.supplier_name.replace(/"/g,'""') + '"', t.supplier_email, t.supplier_country, '"' + t.title.replace(/"/g,'""') + '"', t.category, t.estimated_value.toFixed(2), t.currency, t.status, t.created_at, t.deadline]);
    const csv = [headers.join(',')].concat(rows.map(r => r.join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'tenders-export-' + new Date().toISOString().substr(0,10) + '.csv';
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    showToast('Exported ' + tenders.length + ' tender(s) to CSV');
    clearSelection();
  }

  function exportCSV() {
    const db = initDatabase();
    let tenders = db.tenders;
    if (currentFilter && currentFilter !== 'all') tenders = tenders.filter(t => t.status === currentFilter);
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      tenders = tenders.filter(t => t.id.toLowerCase().indexOf(q) !== -1 || t.supplier_name.toLowerCase().indexOf(q) !== -1 || t.title.toLowerCase().indexOf(q) !== -1);
    }
    const headers = ['Tender ID', 'Supplier', 'Email', 'Country', 'Title', 'Category', 'Est. Value', 'Currency', 'Status', 'Created', 'Deadline'];
    const rows = tenders.map(t => [t.id, '"' + t.supplier_name.replace(/"/g,'""') + '"', t.supplier_email, t.supplier_country, '"' + t.title.replace(/"/g,'""') + '"', t.category, t.estimated_value.toFixed(2), t.currency, t.status, t.created_at, t.deadline]);
    const csv = [headers.join(',')].concat(rows.map(r => r.join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'tenders-export-' + new Date().toISOString().substr(0,10) + '.csv';
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  }

  function createNewTender() {
    const db = initDatabase();
    const supplier = SYNTHETIC_SUPPLIERS[Math.floor(Math.random() * SYNTHETIC_SUPPLIERS.length)];
    const template = TENDER_TEMPLATES[Math.floor(Math.random() * TENDER_TEMPLATES.length)];
    const estimatedValue = template.baseValue + Math.floor(Math.random() * 50000);
    const tenderNum = 20001 + db.tenders.length;
    const tender = {
      id: 'TND-' + String(tenderNum), supplier_id: supplier.id, supplier_name: supplier.name,
      supplier_email: supplier.email, supplier_country: supplier.country, supplier_category: supplier.category,
      title: template.title, category: template.category, estimated_value: estimatedValue, currency: 'USD',
      status: 'draft', created_at: new Date().toISOString(),
      deadline: new Date(Date.now() + 30 * 86400000).toISOString(), updated_at: new Date().toISOString(),
      awarded_bid_id: null, description: 'Created via New Tender button'
    };
    db.tenders.push(tender);
    logAudit(db, tender.id, 'tender_created', 'Tender created for ' + supplier.name);
    saveDatabase(db);
    showToast('Tender ' + tender.id + ' created — ' + formatCurrency(estimatedValue));
    refreshStats(); renderChart(); renderTable(currentFilter, currentSearch);
  }

  function showToast(message) {
    let toast = document.getElementById('cc-tm-toast');
    if (toast) toast.remove();
    toast = document.createElement('div');
    toast.id = 'cc-tm-toast';
    toast.className = 'cc-tm-toast';
    toast.textContent = '✓ ' + message;
    document.body.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
  }

  function refreshStats() {
    const db = initDatabase();
    const panel = document.getElementById('cc-tm-panel');
    if (!panel) return;
    const stats = panel.querySelectorAll('.cc-tm-stat-value');
    if (stats[0]) stats[0].textContent = db.tenders.filter(t => t.status === 'open').length;
    if (stats[1]) stats[1].textContent = db.tenders.filter(t => t.status === 'bidding').length;
    if (stats[2]) stats[2].textContent = db.tenders.filter(t => t.status === 'awarded').length;
    if (stats[3]) stats[3].textContent = formatCurrency(db.bids.reduce((s, b) => s + b.bid_value, 0));
    renderChart();
  }

  function closeModal() { const o = document.getElementById('cc-tm-modal-overlay'); if (o) o.remove(); }
  function closePanel() { const o = document.getElementById('cc-tm-panel-overlay'); if (o) o.remove(); }

  function resetDatabase() {
    localStorage.removeItem(DB_KEY);
    closePanel(); openPanel();
  }

  function openPanel() {
    closePanel();
    selectedTenderIds = new Set();
    const panel = renderPanel();
    document.body.appendChild(panel);
    renderChart();
    renderTable('all', '');
    wireUpEvents();
  }

  function wireUpEvents() {
    document.querySelectorAll('.cc-tm-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.cc-tm-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTable(tab.dataset.filter, currentSearch);
      });
    });
    const searchInput = document.getElementById('cc-tm-search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() { renderTable(currentFilter, searchInput.value); }, 200);
      });
    }
    const exportBtn = document.getElementById('cc-tm-export-csv');
    if (exportBtn) exportBtn.addEventListener('click', exportCSV);
    const newBtn = document.getElementById('cc-tm-new-tender');
    if (newBtn) newBtn.addEventListener('click', createNewTender);
    const resetBtn = document.getElementById('cc-tm-reset-db');
    if (resetBtn) resetBtn.addEventListener('click', function() { if (confirm('Reset all tender demo data?')) resetDatabase(); });
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    window.__ccTM = {
      openPanel, closePanel, showDetail, closeModal, exportCSV, createNewTender,
      openTender, startBidding, awardTender, downloadReceipt, filterByStatus,
      toggleSelectAll, updateBulkBar, clearSelection, bulkOpenBidding, bulkExportCSV,
      resetDatabase
    };

    function injectButton() {
      if (document.getElementById('cc-tm-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-tm-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 140px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #8b5cf6, #ec4899)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg> Tenders';
      btn.setAttribute('aria-label', 'Open tender management');
      btn.onclick = openPanel;
      btn.onmouseover = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.5)'; };
      btn.onmouseout = function() { btn.style.transform = ''; btn.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)'; };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-tm-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-tm-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 2500); });
    } else {
      setTimeout(tryInject, 2500);
    }

    document.addEventListener('keydown', function(e) {
      if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-tm-panel-overlay')) { openPanel(); e.preventDefault(); }
      }
      if (e.key === 'Escape') { closePanel(); closeModal(); }
    });
  }

  init();
})();
