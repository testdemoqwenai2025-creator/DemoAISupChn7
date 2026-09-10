// ====================================================================
// platform-analytics.js — Platform-wide analytics dashboard
// ====================================================================
// Provides weekly and monthly analytics for:
//   1. News Feeds — article volume, sentiment trends, topic distribution
//   2. Risk Assessments — alerts by severity, category, region, trends
//   3. Order Patterns — volume, revenue, status distribution over time
//
// Synthetic data is generated and stored in localStorage.
// Opens as a full-screen modal via a floating "📊 Analytics" button.
// ====================================================================
(function() {
  'use strict';

  if (window.__platformAnalyticsLoaded) return;
  window.__platformAnalyticsLoaded = true;

  // ------------------------------------------------------------------
  // SYNTHETIC DATA GENERATION
  // ------------------------------------------------------------------
  const ANALYTICS_KEY = 'cc_analytics_db_v1';

  const NEWS_TOPICS = ['Supply Chain', 'Logistics', 'Trade', 'Compliance', 'Technology', 'Geopolitics', 'Sustainability'];
  const NEWS_SOURCES = ['Reuters', 'Bloomberg', 'FT', 'WSJ', 'Supply Chain Dive', 'Industry Week'];
  const SENTIMENTS = ['positive', 'neutral', 'negative'];

  const RISK_CATEGORIES = ['Geopolitical', 'Weather', 'Supplier', 'Regulatory', 'Cyber', 'Financial', 'Operational'];
  const RISK_SEVERITIES = ['critical', 'high', 'medium', 'low'];
  const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Middle East', 'Africa', 'Latin America'];

  function generateAnalyticsDB() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(ANALYTICS_KEY)); } catch(e) {}

    if (db) return db;

    db = { news: [], risks: [], orders: [], meta: { created: new Date().toISOString() } };

    // Generate 90 days of synthetic data
    const now = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86400000);
      const dateStr = date.toISOString().substr(0, 10);

      // News articles: 3-12 per day
      const newsCount = Math.floor(Math.random() * 10) + 3;
      for (let j = 0; j < newsCount; j++) {
        db.news.push({
          id: 'news_' + dateStr + '_' + j,
          date: dateStr,
          topic: NEWS_TOPICS[Math.floor(Math.random() * NEWS_TOPICS.length)],
          sentiment: SENTIMENTS[Math.floor(Math.random() * SENTIMENTS.length)],
          source: NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)],
          title: 'Synthetic news article about ' + NEWS_TOPICS[Math.floor(Math.random() * NEWS_TOPICS.length)]
        });
      }

      // Risk alerts: 1-6 per day
      const riskCount = Math.floor(Math.random() * 6) + 1;
      for (let j = 0; j < riskCount; j++) {
        db.risks.push({
          id: 'risk_' + dateStr + '_' + j,
          date: dateStr,
          severity: RISK_SEVERITIES[Math.floor(Math.random() * RISK_SEVERITIES.length)],
          category: RISK_CATEGORIES[Math.floor(Math.random() * RISK_CATEGORIES.length)],
          region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
          description: 'Synthetic risk alert'
        });
      }

      // Order patterns: 1-8 per day
      const orderCount = Math.floor(Math.random() * 8) + 1;
      for (let j = 0; j < orderCount; j++) {
        const amount = Math.floor(Math.random() * 50000) + 5000;
        db.orders.push({
          id: 'ord_' + dateStr + '_' + j,
          date: dateStr,
          amount: amount,
          status: ['pending', 'processing', 'paid', 'shipped', 'delivered'][Math.floor(Math.random() * 5)],
          region: REGIONS[Math.floor(Math.random() * REGIONS.length)]
        });
      }
    }

    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(db));
    return db;
  }

  function saveDB(db) { localStorage.setItem(ANALYTICS_KEY, JSON.stringify(db)); }

  function formatCurrency(amt) {
    if (amt >= 1000000) return '$' + (amt / 1000000).toFixed(1) + 'M';
    if (amt >= 1000) return '$' + (amt / 1000).toFixed(0) + 'k';
    return '$' + amt.toFixed(0);
  }

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-pa-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-pa-styles';
    style.textContent = `
      .cc-pa-modal {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 10004; background: rgba(10,10,10,0.99);
        overflow-y: auto; padding: 60px 16px 24px;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        color: #e2e8f0;
      }
      .cc-pa-inner { max-width: 1200px; margin: 0 auto; }
      .cc-pa-close {
        position: fixed; top: 16px; right: 20px; z-index: 10005;
        width: 40px; height: 40px; border-radius: 10px;
        background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
        color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1;
        display: flex; align-items: center; justify-content: center;
      }
      .cc-pa-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-pa-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 24px; padding-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 12px;
      }
      .cc-pa-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; }
      .cc-pa-badge {
        font-size: 10px; padding: 3px 8px; border-radius: 10px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff;
        font-weight: 600; letter-spacing: 0.03em;
      }
      .cc-pa-period-toggle {
        display: flex; gap: 4px; background: rgba(255,255,255,0.05);
        border-radius: 8px; padding: 4px;
      }
      .cc-pa-period-btn {
        padding: 6px 16px; border-radius: 6px; border: none;
        background: none; color: #94a3b8; font-size: 12px; font-weight: 600;
        cursor: pointer; font-family: inherit; transition: all 0.2s;
      }
      .cc-pa-period-btn.active {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff;
      }
      .cc-pa-tabs {
        display: flex; gap: 4px; margin-bottom: 20px;
        border-bottom: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap;
      }
      .cc-pa-tab {
        padding: 10px 18px; font-size: 13px; font-weight: 600;
        background: none; border: none; color: #94a3b8; cursor: pointer;
        border-bottom: 2px solid transparent; transition: all 0.2s;
        font-family: inherit; display: flex; align-items: center; gap: 6px;
      }
      .cc-pa-tab.active { color: #3b82f6; border-bottom-color: #3b82f6; }
      .cc-pa-tab:hover { color: #e2e8f0; }

      .cc-pa-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-pa-card {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px; padding: 16px;
      }
      .cc-pa-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
      .cc-pa-card-value { font-size: 24px; font-weight: 800; color: #fff; }
      .cc-pa-card-delta { font-size: 11px; margin-top: 4px; }
      .cc-pa-delta-up { color: #10B981; }
      .cc-pa-delta-down { color: #ef4444; }
      .cc-pa-delta-neutral { color: #64748b; }

      .cc-pa-chart-section {
        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
        border-radius: 10px; padding: 20px; margin-bottom: 20px;
      }
      .cc-pa-chart-title {
        font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px;
        display: flex; align-items: center; gap: 6px;
      }
      .cc-pa-chart-title-icon { font-size: 16px; }
      .cc-pa-bars {
        display: flex; align-items: flex-end; gap: 4px; height: 140px;
        padding: 0 4px;
      }
      .cc-pa-bar-wrap {
        flex: 1; display: flex; flex-direction: column; align-items: center;
        gap: 4px; height: 100%; justify-content: flex-end;
      }
      .cc-pa-bar {
        width: 100%; max-width: 28px; border-radius: 4px 4px 0 0;
        min-height: 4px; position: relative; cursor: pointer;
        transition: opacity 0.2s;
      }
      .cc-pa-bar:hover { opacity: 0.8; }
      .cc-pa-bar-tooltip {
        position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
        background: #1e293b; color: #fff; padding: 4px 8px; border-radius: 4px;
        font-size: 10px; white-space: nowrap; opacity: 0; pointer-events: none;
        transition: opacity 0.2s; margin-bottom: 4px; z-index: 5;
      }
      .cc-pa-bar:hover .cc-pa-bar-tooltip { opacity: 1; }
      .cc-pa-bar-label { font-size: 9px; color: #64748b; text-align: center; }

      .cc-pa-donut-row { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }
      .cc-pa-donut {
        width: 140px; height: 140px; border-radius: 50%;
        position: relative; flex-shrink: 0;
      }
      .cc-pa-donut-center {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        text-align: center;
      }
      .cc-pa-donut-center-value { font-size: 22px; font-weight: 800; color: #fff; }
      .cc-pa-donut-center-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
      .cc-pa-legend { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px; }
      .cc-pa-legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
      .cc-pa-legend-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
      .cc-pa-legend-label { color: #cbd5e1; flex: 1; }
      .cc-pa-legend-value { color: #64748b; font-weight: 600; }

      .cc-pa-trend-line {
        display: flex; align-items: flex-end; gap: 2px; height: 100px;
        padding: 0 4px;
      }
      .cc-pa-trend-bar {
        flex: 1; min-width: 2px; border-radius: 2px 2px 0 0; min-height: 3px;
        transition: opacity 0.2s;
      }
      .cc-pa-trend-bar:hover { opacity: 0.7; }

      @media (max-width: 767px) {
        .cc-pa-modal { padding: 50px 8px 16px; }
        .cc-pa-cards { grid-template-columns: repeat(2, 1fr); }
        .cc-pa-tabs { flex-wrap: wrap; }
      }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // DATA AGGREGATION HELPERS
  // ------------------------------------------------------------------
  function getPeriodDays(period) { return period === 'weekly' ? 7 : 30; }

  function filterByPeriod(items, period, dateField) {
    const days = getPeriodDays(period);
    const cutoff = new Date(Date.now() - days * 86400000);
    return items.filter(item => new Date(item[dateField]) >= cutoff);
  }

  function groupByDate(items, period, dateField) {
    const days = getPeriodDays(period);
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      buckets[d.toISOString().substr(0, 10)] = 0;
    }
    items.forEach(item => {
      const key = item[dateField];
      if (buckets[key] !== undefined) buckets[key]++;
    });
    return buckets;
  }

  function groupByField(items, field) {
    const counts = {};
    items.forEach(item => {
      const key = item[field];
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  function sumByDate(items, period, dateField, valueField) {
    const days = getPeriodDays(period);
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      buckets[d.toISOString().substr(0, 10)] = 0;
    }
    items.forEach(item => {
      const key = item[dateField];
      if (buckets[key] !== undefined) buckets[key] += item[valueField];
    });
    return buckets;
  }

  // Calculate % change vs previous period
  function calcDelta(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  function getPreviousPeriodCount(items, period, dateField) {
    const days = getPeriodDays(period);
    const start = new Date(Date.now() - days * 2 * 86400000);
    const end = new Date(Date.now() - days * 86400000);
    return items.filter(item => {
      const d = new Date(item[dateField]);
      return d >= start && d < end;
    }).length;
  }

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  let currentPeriod = 'weekly';
  let currentTab = 'news';

  function renderModal() {
    const overlay = document.createElement('div');
    overlay.id = 'cc-pa-overlay';
    overlay.className = 'cc-pa-modal';
    overlay.innerHTML = `
      <button class="cc-pa-close" onclick="window.__ccPA.close()">×</button>
      <div class="cc-pa-inner">
        <div class="cc-pa-header">
          <h2 class="cc-pa-title">📊 Platform Analytics <span class="cc-pa-badge">LIVE DEMO</span></h2>
          <div class="cc-pa-period-toggle">
            <button class="cc-pa-period-btn active" data-period="weekly" onclick="window.__ccPA.setPeriod('weekly')">Weekly</button>
            <button class="cc-pa-period-btn" data-period="monthly" onclick="window.__ccPA.setPeriod('monthly')">Monthly</button>
          </div>
        </div>
        <div class="cc-pa-tabs">
          <button class="cc-pa-tab active" data-tab="news" onclick="window.__ccPA.setTab('news')">📰 News Feeds</button>
          <button class="cc-pa-tab" data-tab="risks" onclick="window.__ccPA.setTab('risks')">⚠️ Risk Assessments</button>
          <button class="cc-pa-tab" data-tab="orders" onclick="window.__ccPA.setTab('orders')">📦 Order Patterns</button>
        </div>
        <div id="cc-pa-content"></div>
      </div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-pa-content');
    if (!container) return;

    if (currentTab === 'news') renderNewsAnalytics(container);
    else if (currentTab === 'risks') renderRiskAnalytics(container);
    else if (currentTab === 'orders') renderOrderAnalytics(container);
  }

  // ------------------------------------------------------------------
  // NEWS FEED ANALYTICS
  // ------------------------------------------------------------------
  function renderNewsAnalytics(container) {
    const db = generateAnalyticsDB();
    const periodItems = filterByPeriod(db.news, currentPeriod, 'date');
    const prevCount = getPreviousPeriodCount(db.news, currentPeriod, 'date');
    const delta = calcDelta(periodItems.length, prevCount);

    const sentimentCounts = groupByField(periodItems, 'sentiment');
    const topicCounts = groupByField(periodItems, 'topic');
    const dailyCounts = groupByDate(periodItems, currentPeriod, 'date');

    const sentimentColors = { positive: '#10B981', neutral: '#64748b', negative: '#ef4444' };
    const topicColors = ['#3b82f6', '#8b5cf6', '#06B6D4', '#10B981', '#f59e0b', '#ec4899', '#14b8a6'];

    const maxDaily = Math.max(...Object.values(dailyCounts), 1);
    const days = Object.keys(dailyCounts).sort();

    container.innerHTML = `
      <div class="cc-pa-cards">
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">Total Articles</div>
          <div class="cc-pa-card-value">${periodItems.length}</div>
          <div class="cc-pa-card-delta ${delta >= 0 ? 'cc-pa-delta-up' : 'cc-pa-delta-down'}">${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}% vs prev ${currentPeriod === 'weekly' ? 'week' : 'month'}</div>
        </div>
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">Positive</div>
          <div class="cc-pa-card-value" style="color:#10B981">${sentimentCounts.positive || 0}</div>
          <div class="cc-pa-card-delta cc-pa-delta-neutral">${Math.round((sentimentCounts.positive || 0) / periodItems.length * 100)}% of total</div>
        </div>
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">Negative</div>
          <div class="cc-pa-card-value" style="color:#ef4444">${sentimentCounts.negative || 0}</div>
          <div class="cc-pa-card-delta cc-pa-delta-neutral">${Math.round((sentimentCounts.negative || 0) / periodItems.length * 100)}% of total</div>
        </div>
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">Avg / Day</div>
          <div class="cc-pa-card-value">${(periodItems.length / getPeriodDays(currentPeriod)).toFixed(1)}</div>
          <div class="cc-pa-card-delta cc-pa-delta-neutral">articles per day</div>
        </div>
      </div>

      <div class="cc-pa-chart-section">
        <div class="cc-pa-chart-title"><span class="cc-pa-chart-title-icon">📈</span> Article Volume — ${currentPeriod === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}</div>
        <div class="cc-pa-bars">
          ${days.map(d => {
            const count = dailyCounts[d];
            const dateLabel = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `<div class="cc-pa-bar-wrap">
              <div class="cc-pa-bar" style="height: ${(count / maxDaily * 100)}%; background: linear-gradient(180deg, #3b82f6, #8b5cf6)">
                <div class="cc-pa-bar-tooltip">${dateLabel}: ${count} articles</div>
              </div>
              <div class="cc-pa-bar-label">${currentPeriod === 'weekly' ? new Date(d).toLocaleDateString('en-US', { weekday: 'short' }) : dateLabel}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="cc-pa-chart-section">
        <div class="cc-pa-chart-title"><span class="cc-pa-chart-title-icon">🎯</span> Sentiment Distribution</div>
        <div class="cc-pa-donut-row">
          ${renderDonut(sentimentCounts, sentimentColors, periodItems.length, 'Articles')}
          <div class="cc-pa-legend">
            ${Object.entries(sentimentCounts).sort((a,b) => b[1]-a[1]).map(([key, count]) => `
              <div class="cc-pa-legend-item">
                <div class="cc-pa-legend-dot" style="background: ${sentimentColors[key]}"></div>
                <div class="cc-pa-legend-label">${key.charAt(0).toUpperCase() + key.slice(1)}</div>
                <div class="cc-pa-legend-value">${count} (${Math.round(count / periodItems.length * 100)}%)</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="cc-pa-chart-section">
        <div class="cc-pa-chart-title"><span class="cc-pa-chart-title-icon">🏷️</span> Topic Distribution</div>
        <div class="cc-pa-donut-row">
          ${renderDonut(topicCounts, topicColors, periodItems.length, 'Topics')}
          <div class="cc-pa-legend">
            ${Object.entries(topicCounts).sort((a,b) => b[1]-a[1]).map(([key, count], i) => `
              <div class="cc-pa-legend-item">
                <div class="cc-pa-legend-dot" style="background: ${topicColors[i % topicColors.length]}"></div>
                <div class="cc-pa-legend-label">${key}</div>
                <div class="cc-pa-legend-value">${count}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // RISK ASSESSMENT ANALYTICS
  // ------------------------------------------------------------------
  function renderRiskAnalytics(container) {
    const db = generateAnalyticsDB();
    const periodItems = filterByPeriod(db.risks, currentPeriod, 'date');
    const prevCount = getPreviousPeriodCount(db.risks, currentPeriod, 'date');
    const delta = calcDelta(periodItems.length, prevCount);

    const severityCounts = groupByField(periodItems, 'severity');
    const categoryCounts = groupByField(periodItems, 'category');
    const regionCounts = groupByField(periodItems, 'region');
    const dailyCounts = groupByDate(periodItems, currentPeriod, 'date');

    const severityColors = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10B981' };
    const categoryColors = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#06B6D4', '#ec4899', '#14b8a6'];
    const regionColors = ['#3b82f6', '#10B981', '#f59e0b', '#8b5cf6', '#ec4899', '#06B6D4'];

    const maxDaily = Math.max(...Object.values(dailyCounts), 1);
    const days = Object.keys(dailyCounts).sort();
    const criticalCount = severityCounts.critical || 0;

    container.innerHTML = `
      <div class="cc-pa-cards">
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">Total Alerts</div>
          <div class="cc-pa-card-value">${periodItems.length}</div>
          <div class="cc-pa-card-delta ${delta >= 0 ? 'cc-pa-delta-down' : 'cc-pa-delta-up'}">${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}% vs prev ${currentPeriod === 'weekly' ? 'week' : 'month'}</div>
        </div>
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">Critical</div>
          <div class="cc-pa-card-value" style="color:#ef4444">${criticalCount}</div>
          <div class="cc-pa-card-delta cc-pa-delta-neutral">${Math.round(criticalCount / periodItems.length * 100)}% of total</div>
        </div>
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">High Severity</div>
          <div class="cc-pa-card-value" style="color:#f59e0b">${severityCounts.high || 0}</div>
          <div class="cc-pa-card-delta cc-pa-delta-neutral">${Math.round((severityCounts.high || 0) / periodItems.length * 100)}% of total</div>
        </div>
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">Avg / Day</div>
          <div class="cc-pa-card-value">${(periodItems.length / getPeriodDays(currentPeriod)).toFixed(1)}</div>
          <div class="cc-pa-card-delta cc-pa-delta-neutral">alerts per day</div>
        </div>
      </div>

      <div class="cc-pa-chart-section">
        <div class="cc-pa-chart-title"><span class="cc-pa-chart-title-icon">📊</span> Risk Alert Volume — ${currentPeriod === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}</div>
        <div class="cc-pa-bars">
          ${days.map(d => {
            const count = dailyCounts[d];
            const dateLabel = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `<div class="cc-pa-bar-wrap">
              <div class="cc-pa-bar" style="height: ${(count / maxDaily * 100)}%; background: linear-gradient(180deg, #ef4444, #f59e0b)">
                <div class="cc-pa-bar-tooltip">${dateLabel}: ${count} alerts</div>
              </div>
              <div class="cc-pa-bar-label">${currentPeriod === 'weekly' ? new Date(d).toLocaleDateString('en-US', { weekday: 'short' }) : dateLabel}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="cc-pa-chart-section">
        <div class="cc-pa-chart-title"><span class="cc-pa-chart-title-icon">⚠️</span> By Severity</div>
        <div class="cc-pa-donut-row">
          ${renderDonut(severityCounts, severityColors, periodItems.length, 'Alerts')}
          <div class="cc-pa-legend">
            ${['critical', 'high', 'medium', 'low'].map(key => `
              <div class="cc-pa-legend-item">
                <div class="cc-pa-legend-dot" style="background: ${severityColors[key]}"></div>
                <div class="cc-pa-legend-label">${key.charAt(0).toUpperCase() + key.slice(1)}</div>
                <div class="cc-pa-legend-value">${severityCounts[key] || 0}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="cc-pa-chart-section">
        <div class="cc-pa-chart-title"><span class="cc-pa-chart-title-icon">🗂️</span> By Category</div>
        <div class="cc-pa-donut-row">
          ${renderDonut(categoryCounts, categoryColors, periodItems.length, 'Categories')}
          <div class="cc-pa-legend">
            ${Object.entries(categoryCounts).sort((a,b) => b[1]-a[1]).map(([key, count], i) => `
              <div class="cc-pa-legend-item">
                <div class="cc-pa-legend-dot" style="background: ${categoryColors[i % categoryColors.length]}"></div>
                <div class="cc-pa-legend-label">${key}</div>
                <div class="cc-pa-legend-value">${count}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="cc-pa-chart-section">
        <div class="cc-pa-chart-title"><span class="cc-pa-chart-title-icon">🌍</span> By Region</div>
        <div class="cc-pa-donut-row">
          ${renderDonut(regionCounts, regionColors, periodItems.length, 'Regions')}
          <div class="cc-pa-legend">
            ${Object.entries(regionCounts).sort((a,b) => b[1]-a[1]).map(([key, count], i) => `
              <div class="cc-pa-legend-item">
                <div class="cc-pa-legend-dot" style="background: ${regionColors[i % regionColors.length]}"></div>
                <div class="cc-pa-legend-label">${key}</div>
                <div class="cc-pa-legend-value">${count}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // ORDER PATTERN ANALYTICS
  // ------------------------------------------------------------------
  function renderOrderAnalytics(container) {
    const db = generateAnalyticsDB();
    const periodItems = filterByPeriod(db.orders, currentPeriod, 'date');
    const prevItems = db.orders.filter(item => {
      const days = getPeriodDays(currentPeriod);
      const d = new Date(item.date);
      const start = new Date(Date.now() - days * 2 * 86400000);
      const end = new Date(Date.now() - days * 86400000);
      return d >= start && d < end;
    });

    const totalRevenue = periodItems.reduce((sum, o) => sum + o.amount, 0);
    const prevRevenue = prevItems.reduce((sum, o) => sum + o.amount, 0);
    const revenueDelta = calcDelta(totalRevenue, prevRevenue);
    const countDelta = calcDelta(periodItems.length, prevItems.length);

    const statusCounts = groupByField(periodItems, 'status');
    const regionCounts = groupByField(periodItems, 'region');
    const dailyRevenue = sumByDate(periodItems, currentPeriod, 'date', 'amount');
    const dailyVolume = groupByDate(periodItems, currentPeriod, 'date');

    const statusColors = { pending: '#f59e0b', processing: '#3b82f6', paid: '#10B981', shipped: '#8b5cf6', delivered: '#14b8a6' };
    const regionColors = ['#3b82f6', '#10B981', '#f59e0b', '#8b5cf6', '#ec4899', '#06B6D4'];

    const maxRevenue = Math.max(...Object.values(dailyRevenue), 1);
    const maxVolume = Math.max(...Object.values(dailyVolume), 1);
    const days = Object.keys(dailyRevenue).sort();
    const avgOrderValue = totalRevenue / (periodItems.length || 1);

    container.innerHTML = `
      <div class="cc-pa-cards">
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">Total Orders</div>
          <div class="cc-pa-card-value">${periodItems.length}</div>
          <div class="cc-pa-card-delta ${countDelta >= 0 ? 'cc-pa-delta-up' : 'cc-pa-delta-down'}">${countDelta >= 0 ? '↑' : '↓'} ${Math.abs(countDelta)}% vs prev</div>
        </div>
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">Total Revenue</div>
          <div class="cc-pa-card-value" style="color:#10B981">${formatCurrency(totalRevenue)}</div>
          <div class="cc-pa-card-delta ${revenueDelta >= 0 ? 'cc-pa-delta-up' : 'cc-pa-delta-down'}">${revenueDelta >= 0 ? '↑' : '↓'} ${Math.abs(revenueDelta)}% vs prev</div>
        </div>
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">Avg Order Value</div>
          <div class="cc-pa-card-value">${formatCurrency(avgOrderValue)}</div>
          <div class="cc-pa-card-delta cc-pa-delta-neutral">per order</div>
        </div>
        <div class="cc-pa-card">
          <div class="cc-pa-card-label">Orders / Day</div>
          <div class="cc-pa-card-value">${(periodItems.length / getPeriodDays(currentPeriod)).toFixed(1)}</div>
          <div class="cc-pa-card-delta cc-pa-delta-neutral">avg daily volume</div>
        </div>
      </div>

      <div class="cc-pa-chart-section">
        <div class="cc-pa-chart-title"><span class="cc-pa-chart-title-icon">💰</span> Revenue Trend — ${currentPeriod === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}</div>
        <div class="cc-pa-bars">
          ${days.map(d => {
            const rev = dailyRevenue[d];
            const dateLabel = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `<div class="cc-pa-bar-wrap">
              <div class="cc-pa-bar" style="height: ${(rev / maxRevenue * 100)}%; background: linear-gradient(180deg, #10B981, #06B6D4)">
                <div class="cc-pa-bar-tooltip">${dateLabel}: ${formatCurrency(rev)}</div>
              </div>
              <div class="cc-pa-bar-label">${currentPeriod === 'weekly' ? new Date(d).toLocaleDateString('en-US', { weekday: 'short' }) : dateLabel}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="cc-pa-chart-section">
        <div class="cc-pa-chart-title"><span class="cc-pa-chart-title-icon">📦</span> Order Volume — ${currentPeriod === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}</div>
        <div class="cc-pa-bars">
          ${days.map(d => {
            const vol = dailyVolume[d];
            const dateLabel = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `<div class="cc-pa-bar-wrap">
              <div class="cc-pa-bar" style="height: ${(vol / maxVolume * 100)}%; background: linear-gradient(180deg, #3b82f6, #8b5cf6)">
                <div class="cc-pa-bar-tooltip">${dateLabel}: ${vol} orders</div>
              </div>
              <div class="cc-pa-bar-label">${currentPeriod === 'weekly' ? new Date(d).toLocaleDateString('en-US', { weekday: 'short' }) : dateLabel}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="cc-pa-chart-section">
        <div class="cc-pa-chart-title"><span class="cc-pa-chart-title-icon">🔄</span> By Status</div>
        <div class="cc-pa-donut-row">
          ${renderDonut(statusCounts, statusColors, periodItems.length, 'Orders')}
          <div class="cc-pa-legend">
            ${['pending', 'processing', 'paid', 'shipped', 'delivered'].map(key => `
              <div class="cc-pa-legend-item">
                <div class="cc-pa-legend-dot" style="background: ${statusColors[key]}"></div>
                <div class="cc-pa-legend-label">${key.charAt(0).toUpperCase() + key.slice(1)}</div>
                <div class="cc-pa-legend-value">${statusCounts[key] || 0}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="cc-pa-chart-section">
        <div class="cc-pa-chart-title"><span class="cc-pa-chart-title-icon">🌍</span> By Region</div>
        <div class="cc-pa-donut-row">
          ${renderDonut(regionCounts, regionColors, periodItems.length, 'Regions')}
          <div class="cc-pa-legend">
            ${Object.entries(regionCounts).sort((a,b) => b[1]-a[1]).map(([key, count], i) => `
              <div class="cc-pa-legend-item">
                <div class="cc-pa-legend-dot" style="background: ${regionColors[i % regionColors.length]}"></div>
                <div class="cc-pa-legend-label">${key}</div>
                <div class="cc-pa-legend-value">${count}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // DONUT CHART RENDERER (pure CSS conic-gradient)
  // ------------------------------------------------------------------
  function renderDonut(counts, colors, total, centerLabel) {
    const entries = Object.entries(counts).filter(([k, v]) => v > 0);
    if (entries.length === 0 || total === 0) {
      return `<div class="cc-pa-donut" style="background: #1e293b"><div class="cc-pa-donut-center"><div class="cc-pa-donut-center-value">0</div><div class="cc-pa-donut-center-label">${centerLabel}</div></div></div>`;
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

    return `<div class="cc-pa-donut" style="background: conic-gradient(${gradientParts.join(', ')})">
      <div class="cc-pa-donut-center" style="background: #0a0a0a; width: 90px; height: 90px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="cc-pa-donut-center-value">${total}</div>
        <div class="cc-pa-donut-center-label">${centerLabel}</div>
      </div>
    </div>`;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-pa-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-pa-overlay');
    if (overlay) overlay.remove();
  }

  function setPeriod(period) {
    currentPeriod = period;
    document.querySelectorAll('.cc-pa-period-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.period === period);
    });
    renderContent();
  }

  function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.cc-pa-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    renderContent();
  }

  // ------------------------------------------------------------------
  // INIT — inject floating button
  // ------------------------------------------------------------------
  function init() {
    injectStyles();

    window.__ccPA = { open, close, setPeriod, setTab };

    function injectButton() {
      if (document.getElementById('cc-pa-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'cc-pa-trigger-btn';
      btn.style.cssText = [
        'position: fixed', 'bottom: 80px', 'right: 20px', 'z-index: 9999',
        'padding: 12px 20px', 'border-radius: 12px',
        'background: linear-gradient(135deg, #3b82f6, #8b5cf6)',
        'color: #fff', 'border: none', 'font-size: 13px', 'font-weight: 700',
        'cursor: pointer', 'box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4)',
        'transition: all 0.2s', 'display: flex', 'align-items: center', 'gap: 6px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> Analytics';
      btn.setAttribute('aria-label', 'Open platform analytics dashboard');
      btn.onclick = open;
      btn.onmouseover = function() {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.5)';
      };
      btn.onmouseout = function() {
        btn.style.transform = '';
        btn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
      };
      document.body.appendChild(btn);
    }

    let attempts = 0;
    function tryInject() {
      attempts++;
      if (document.getElementById('cc-pa-trigger-btn')) return;
      if (attempts > 30) return;
      injectButton();
      if (!document.getElementById('cc-pa-trigger-btn')) setTimeout(tryInject, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 2000); });
    } else {
      setTimeout(tryInject, 2000);
    }

    // Keyboard shortcut: press "A" to open analytics
    document.addEventListener('keydown', function(e) {
      if ((e.key === 'a' || e.key === 'A') && !e.metaKey && !e.ctrlKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!document.getElementById('cc-pa-overlay')) {
          open();
          e.preventDefault();
        }
      }
      if (e.key === 'Escape') close();
    });
  }

  init();
})();
