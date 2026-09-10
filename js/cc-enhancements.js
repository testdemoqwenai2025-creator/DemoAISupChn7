// ====================================================================
// cc-enhancements.js — All 10 cc-app improvements
// ====================================================================
// 1.  "Back to Main Site" button in top nav
// 2.  Keyboard shortcuts tooltip (⌘? / Ctrl+?)
// 3.  "Last updated" timestamp on live monitoring cards (auto-refresh)
// 4.  Demo-mode indicator badge
// 5.  Alt text / aria-labels on all icons
// 6.  "What am I looking at?" help modal
// 7.  "Take a tour" guided walkthrough
// 8.  Sidebar collapse state persists (localStorage)
// 9.  Loading skeleton on initial load
// 10. "Contact Sales" CTA in sidebar
// ====================================================================
(function() {
  'use strict';

  if (window.__ccEnhancementsLoaded) return;
  window.__ccEnhancementsLoaded = true;

  // ------------------------------------------------------------------
  // #4. DEMO MODE INDICATOR
  // ------------------------------------------------------------------
  function addDemoModeBadge() {
    var badge = document.createElement('div');
    badge.id = 'cc-demo-badge';
    badge.style.cssText = [
      'position: fixed',
      'top: 12px',
      'right: 16px',
      'z-index: 10000',
      'background: linear-gradient(135deg, #f59e0b, #ef4444)',
      'color: #fff',
      'font-size: 10px',
      'font-weight: 700',
      'letter-spacing: 0.05em',
      'text-transform: uppercase',
      'padding: 4px 10px',
      'border-radius: 12px',
      'box-shadow: 0 2px 8px rgba(0,0,0,0.3)',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'pointer-events: none'
    ].join(';');
    badge.textContent = '● Demo Mode';
    badge.title = 'You are viewing a demo — data is illustrative, not live production';
    document.body.appendChild(badge);
  }

  // ------------------------------------------------------------------
  // #1. BACK TO MAIN SITE BUTTON
  // ------------------------------------------------------------------
  function addBackToMainSiteButton() {
    // Find the top nav area — look for the logo area
    var logoLink = document.querySelector('a[href="/DemoAISupChn7/"], a[href="../"], a[href="./"]');
    if (!logoLink) {
      // Try to find the sidebar logo
      logoLink = document.querySelector('.cc-logo, [class*="logo"]');
    }
    var btn = document.createElement('a');
    btn.href = '/DemoAISupChn7/';
    btn.id = 'cc-back-to-main';
    btn.style.cssText = [
      'position: fixed',
      'top: 12px',
      'left: 16px',
      'z-index: 10000',
      'background: rgba(16, 185, 129, 0.15)',
      'border: 1px solid rgba(16, 185, 129, 0.4)',
      'color: #10B981',
      'font-size: 11px',
      'font-weight: 600',
      'padding: 5px 12px',
      'border-radius: 6px',
      'text-decoration: none',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'transition: all 0.2s',
      'display: flex',
      'align-items: center',
      'gap: 4px'
    ].join(';');
    btn.innerHTML = '← Main Site';
    btn.onmouseover = function() {
      btn.style.background = 'rgba(16, 185, 129, 0.25)';
      btn.style.borderColor = 'rgba(16, 185, 129, 0.6)';
    };
    btn.onmouseout = function() {
      btn.style.background = 'rgba(16, 185, 129, 0.15)';
      btn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    };
    document.body.appendChild(btn);
  }

  // ------------------------------------------------------------------
  // #10. CONTACT SALES CTA IN SIDEBAR
  // ------------------------------------------------------------------
  function addContactSalesCTA() {
    // Find the sidebar — look for the nav element or sidebar container
    var sidebar = document.querySelector('nav, aside, [class*="sidebar"], [class*="Sidebar"]');
    if (!sidebar) {
      // Try to find the sidebar by looking for the logo area's parent
      var logo = document.querySelector('[class*="logo"]');
      if (logo) sidebar = logo.closest('nav, aside, div');
    }
    if (!sidebar) return;

    var cta = document.createElement('div');
    cta.id = 'cc-contact-sales';
    cta.style.cssText = [
      'margin-top: auto',
      'padding: 12px',
      'border-top: 1px solid rgba(255,255,255,0.08)'
    ].join(';');

    var link = document.createElement('a');
    link.href = 'mailto:testdemoqwenai2025@gmail.com?subject=Demo%20Inquiry%20-%20AI%20Supply%20Chain%20Advanced';
    link.style.cssText = [
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'gap: 6px',
      'width: 100%',
      'padding: 10px 16px',
      'background: linear-gradient(135deg, #10B981, #06B6D4)',
      'color: #fff',
      'font-size: 13px',
      'font-weight: 600',
      'border-radius: 8px',
      'text-decoration: none',
      'transition: all 0.2s',
      'box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3)',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ].join(';');
    link.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Contact Sales';
    link.onmouseover = function() {
      link.style.transform = 'translateY(-1px)';
      link.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
    };
    link.onmouseout = function() {
      link.style.transform = '';
      link.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
    };
    cta.appendChild(link);

    // Append to the end of the sidebar
    sidebar.appendChild(cta);
  }

  // ------------------------------------------------------------------
  // #3. LAST UPDATED TIMESTAMP ON LIVE MONITORING CARDS
  // ------------------------------------------------------------------
  function addLastUpdatedTimestamps() {
    // Find cards with numbers (suppliers, orders, etc.)
    var cards = document.querySelectorAll('[class*="card"], [class*="stat"], [class*="metric"]');
    var count = 0;
    cards.forEach(function(card) {
      // Only add to cards that contain numbers
      if (card.textContent.match(/\d{2,}/) && !card.querySelector('.cc-last-updated')) {
        var ts = document.createElement('div');
        ts.className = 'cc-last-updated';
        ts.style.cssText = [
          'font-size: 9px',
          'color: #52525b',
          'margin-top: 4px',
          'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ].join(';');
        ts.textContent = 'Updated just now';
        card.style.position = 'relative';
        card.appendChild(ts);
        count++;
      }
    });

    // Auto-refresh timestamps every 60 seconds
    var startTime = Date.now();
    setInterval(function() {
      var elapsed = Math.floor((Date.now() - startTime) / 1000);
      var mins = Math.floor(elapsed / 60);
      var secs = elapsed % 60;
      var text;
      if (mins === 0) text = 'Updated ' + secs + 's ago';
      else text = 'Updated ' + mins + 'm ago';
      document.querySelectorAll('.cc-last-updated').forEach(function(el) {
        el.textContent = text;
      });
    }, 60000);

    return count;
  }

  // ------------------------------------------------------------------
  // #8. SIDEBAR COLLAPSE STATE PERSISTS
  // ------------------------------------------------------------------
  function persistSidebarState() {
    var STORAGE_KEY = 'cc-sidebar-collapsed';

    // Find the collapse button
    var collapseBtn = null;
    document.querySelectorAll('button, [role="button"], [class*="collapse"], [class*="Collapse"]').forEach(function(el) {
      if (el.textContent.toLowerCase().indexOf('collapse') !== -1 ||
          el.getAttribute('aria-label')?.toLowerCase().indexOf('collapse') !== -1) {
        collapseBtn = el;
      }
    });

    if (!collapseBtn) return;

    // Restore saved state
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true' && !document.body.classList.contains('cc-sidebar-collapsed')) {
      collapseBtn.click();
    }

    // Listen for clicks and save state
    collapseBtn.addEventListener('click', function() {
      setTimeout(function() {
        var isCollapsed = document.body.classList.contains('cc-sidebar-collapsed') ||
                          document.querySelector('[class*="collapsed"]');
        localStorage.setItem(STORAGE_KEY, isCollapsed ? 'true' : 'false');
      }, 100);
    });
  }

  // ------------------------------------------------------------------
  // #5. ALT TEXT / ARIA-LABELS ON ICONS
  // ------------------------------------------------------------------
  function addIconAriaLabels() {
    var iconMap = {
      // Common icon aria-labels based on SVG path content
      'M12 22s8-4': 'Security Shield',
      'rect width="7" height="9"': 'Dashboard',
      'M2 12h5': 'Intelligence',
      'rect x="2" y="2" width="20" height="8"': 'Architecture',
      'm7.5 4.27': 'Products',
      'ellipse cx="12" cy="5"': 'Pricing',
      'circle cx="12" cy="12" r="10"': 'Info',
      'M16 21v-2a4': 'Customers',
      'M2 20a2': 'Industries',
      'rect width="18" height="18" x="3" y="4"': 'Calendar',
      'M21 15a2': 'Support',
      'M22 16.92v3': 'Phone',
      'rect width="20" height="16" x="2" y="4"': 'Email',
      'M3 11 18-5v12L3 14': 'Cookie',
      'path d="M14.5 2H6': 'Document'
    };

    var count = 0;
    document.querySelectorAll('svg:not([aria-label]):not([aria-hidden])').forEach(function(svg) {
      var html = svg.innerHTML;
      for (var pattern in iconMap) {
        if (html.indexOf(pattern) !== -1) {
          svg.setAttribute('aria-label', iconMap[pattern]);
          svg.setAttribute('role', 'img');
          count++;
          break;
        }
      }
    });
    return count;
  }

  // ------------------------------------------------------------------
  // #6. "WHAT AM I LOOKING AT?" HELP MODAL
  // ------------------------------------------------------------------
  function addHelpButton() {
    var btn = document.createElement('button');
    btn.id = 'cc-help-btn';
    btn.style.cssText = [
      'position: fixed',
      'bottom: 20px',
      'right: 20px',
      'z-index: 10000',
      'width: 44px',
      'height: 44px',
      'border-radius: 50%',
      'background: linear-gradient(135deg, #3b82f6, #8b5cf6)',
      'color: #fff',
      'border: none',
      'font-size: 20px',
      'font-weight: 700',
      'cursor: pointer',
      'box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4)',
      'transition: all 0.2s',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ].join(';');
    btn.textContent = '?';
    btn.title = 'What am I looking at?';
    btn.setAttribute('aria-label', 'Help — What am I looking at?');

    btn.onmouseover = function() {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
    };
    btn.onmouseout = function() {
      btn.style.transform = '';
      btn.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.4)';
    };

    btn.onclick = showHelpModal;
    document.body.appendChild(btn);
  }

  function showHelpModal() {
    // Remove existing modal
    var existing = document.getElementById('cc-help-modal');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'cc-help-modal';
    overlay.style.cssText = [
      'position: fixed',
      'top: 0', 'left: 0', 'right: 0', 'bottom: 0',
      'background: rgba(0,0,0,0.7)',
      'z-index: 10001',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'padding: 20px'
    ].join(';');

    var modal = document.createElement('div');
    modal.style.cssText = [
      'background: #0f172a',
      'border: 1px solid rgba(255,255,255,0.1)',
      'border-radius: 16px',
      'max-width: 560px',
      'width: 100%',
      'max-height: 80vh',
      'overflow-y: auto',
      'padding: 32px',
      'color: #e2e8f0',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'box-shadow: 0 20px 60px rgba(0,0,0,0.5)'
    ].join(';');

    modal.innerHTML = [
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">',
      '  <div>',
      '    <h2 style="margin:0 0 4px;font-size:22px;color:#fff">Welcome to the Command Center</h2>',
      '    <p style="margin:0;font-size:13px;color:#94a3b8">AI Supply Chain Advanced — Demo Mode</p>',
      '  </div>',
      '  <button id="cc-help-close" style="background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;padding:0 4px">×</button>',
      '</div>',
      '<p style="font-size:14px;line-height:1.6;color:#cbd5e1;margin-bottom:16px">',
      '  This is an <strong style="color:#10B981">interactive demo</strong> of the AI Supply Chain Advanced platform. ',
      '  All data shown is illustrative — no real production data is displayed.',
      '</p>',
      '<h3 style="font-size:14px;color:#fff;margin:20px 0 10px">What you\'re seeing:</h3>',
      '<ul style="margin:0;padding:0 0 0 20px;font-size:13px;line-height:1.8;color:#cbd5e1">',
      '  <li><strong style="color:#10B981">Live Monitoring</strong> — Real-time overview of suppliers, orders, and risk alerts</li>',
      '  <li><strong style="color:#06B6D4">Orders</strong> — Active procurement orders across 42 countries</li>',
      '  <li><strong style="color:#8b5cf6">Tenders</strong> — Open tender management and bidding</li>',
      '  <li><strong style="color:#f59e0b">AI Documents</strong> — AI-generated compliance and analysis documents</li>',
      '  <li><strong style="color:#ef4444">Compliance</strong> — Regulatory compliance monitoring and alerts</li>',
      '  <li><strong style="color:#3b82f6">Analytics</strong> — Predictive analytics and forecasting</li>',
      '</ul>',
      '<h3 style="font-size:14px;color:#fff;margin:20px 0 10px">Try these:</h3>',
      '<ul style="margin:0;padding:0 0 0 20px;font-size:13px;line-height:1.8;color:#cbd5e1">',
      '  <li>Click the sidebar items to navigate sections</li>',
      '  <li>Use <kbd style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:11px">⌘K</kbd> to open the Command Palette</li>',
      '  <li>Click <strong style="color:#3b82f6">Take a Tour</strong> for a guided walkthrough</li>',
      '</ul>',
      '<div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:10px;flex-wrap:wrap">',
      '  <button id="cc-tour-start" style="flex:1;min-width:140px;padding:10px 16px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Take a Tour</button>',
      '  <a href="mailto:testdemoqwenai2025@gmail.com?subject=Demo%20Inquiry" style="flex:1;min-width:140px;padding:10px 16px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);color:#10B981;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px">📧 Contact Sales</a>',
      '</div>'
    ].join('');

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close handlers
    document.getElementById('cc-help-close').onclick = function() { overlay.remove(); };
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    document.getElementById('cc-tour-start').onclick = function() {
      overlay.remove();
      startTour();
    };
  }

  // ------------------------------------------------------------------
  // #7. TAKE A TOUR — Guided Walkthrough
  // ------------------------------------------------------------------
  function addTourButton() {
    var btn = document.createElement('button');
    btn.id = 'cc-tour-btn';
    btn.style.cssText = [
      'position: fixed',
      'bottom: 20px',
      'right: 74px',
      'z-index: 10000',
      'padding: 10px 16px',
      'border-radius: 22px',
      'background: linear-gradient(135deg, #3b82f6, #8b5cf6)',
      'color: #fff',
      'border: none',
      'font-size: 12px',
      'font-weight: 600',
      'cursor: pointer',
      'box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4)',
      'transition: all 0.2s',
      'display: flex',
      'align-items: center',
      'gap: 6px',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ].join(';');
    btn.innerHTML = '▶ Take a Tour';
    btn.setAttribute('aria-label', 'Take a guided tour of the Command Center');
    btn.onmouseover = function() {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
    };
    btn.onmouseout = function() {
      btn.style.transform = '';
      btn.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.4)';
    };
    btn.onclick = startTour;
    document.body.appendChild(btn);
  }

  function startTour() {
    var steps = [
      {
        target: '[class*="logo"], [class*="Logo"]',
        title: 'Welcome to the Command Center',
        text: 'This is the AI Supply Chain Advanced platform. Let\'s take a quick tour of the key sections.'
      },
      {
        target: '[class*="sidebar"], nav, aside',
        title: 'Navigation Sidebar',
        text: 'Use the sidebar to navigate between Orders, Tenders, AI Documents, Compliance, Analytics, and more.'
      },
      {
        target: '[class*="monitoring"], [class*="Monitoring"], [class*="live"]',
        title: 'Live Monitoring',
        text: 'Real-time overview of 847 suppliers, 156 active orders, and 24 risk alerts across 42 countries.'
      },
      {
        target: '[class*="search"], [class*="Search"], [class*="palette"]',
        title: 'Command Palette (⌘K)',
        text: 'Press ⌘K (Mac) or Ctrl+K (Windows) to open the command palette for quick navigation.'
      },
      {
        target: '#cc-contact-sales',
        title: 'Contact Sales',
        text: 'Interested in this platform? Click here to email our sales team directly.'
      }
    ];

    var currentStep = 0;

    function showStep() {
      var existing = document.getElementById('cc-tour-overlay');
      if (existing) existing.remove();

      var step = steps[currentStep];
      if (!step) return;

      var overlay = document.createElement('div');
      overlay.id = 'cc-tour-overlay';
      overlay.style.cssText = [
        'position: fixed',
        'top: 0', 'left: 0', 'right: 0', 'bottom: 0',
        'z-index: 10001',
        'pointer-events: none'
      ].join(';');

      var tooltip = document.createElement('div');
      tooltip.style.cssText = [
        'position: fixed',
        'top: 50%',
        'left: 50%',
        "transform: translate(-50%, -50%)",
        'background: #0f172a',
        'border: 1px solid rgba(59, 130, 246, 0.4)',
        'border-radius: 12px',
        'padding: 24px',
        'max-width: 420px',
        'width: 90%',
        'color: #e2e8f0',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'box-shadow: 0 20px 60px rgba(0,0,0,0.5)',
        'pointer-events: auto',
        'z-index: 10002'
      ].join(';');

      tooltip.innerHTML = [
        '<div style="font-size:11px;color:#3b82f6;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Step ' + (currentStep + 1) + ' of ' + steps.length + '</div>',
        '<h3 style="margin:0 0 10px;font-size:18px;color:#fff">' + step.title + '</h3>',
        '<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#cbd5e1">' + step.text + '</p>',
        '<div style="display:flex;gap:8px;justify-content:flex-end">',
        currentStep > 0 ? '<button id="cc-tour-prev" style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;border-radius:6px;font-size:12px;cursor:pointer">← Back</button>' : '',
        currentStep < steps.length - 1
          ? '<button id="cc-tour-next" style="padding:8px 14px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">Next →</button>'
          : '<button id="cc-tour-finish" style="padding:8px 14px;background:linear-gradient(135deg,#10B981,#06B6D4);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">✓ Done</button>',
        '<button id="cc-tour-skip" style="padding:8px 14px;background:none;border:none;color:#64748b;font-size:12px;cursor:pointer">Skip</button>',
        '</div>'
      ].join('');

      overlay.appendChild(tooltip);
      document.body.appendChild(overlay);

      // Try to highlight the target element
      var target = document.querySelector(step.target);
      if (target) {
        target.style.outline = '3px solid #3b82f6';
        target.style.outlineOffset = '2px';
        target.style.transition = 'outline 0.3s';
      }

      // Button handlers
      var nextBtn = document.getElementById('cc-tour-next');
      var prevBtn = document.getElementById('cc-tour-prev');
      var finishBtn = document.getElementById('cc-tour-finish');
      var skipBtn = document.getElementById('cc-tour-skip');

      function clearHighlight() {
        if (target) {
          target.style.outline = '';
          target.style.outlineOffset = '';
        }
      }

      if (nextBtn) nextBtn.onclick = function() {
        clearHighlight();
        currentStep++;
        overlay.remove();
        showStep();
      };
      if (prevBtn) prevBtn.onclick = function() {
        clearHighlight();
        currentStep--;
        overlay.remove();
        showStep();
      };
      if (finishBtn) finishBtn.onclick = function() {
        clearHighlight();
        overlay.remove();
      };
      if (skipBtn) skipBtn.onclick = function() {
        clearHighlight();
        overlay.remove();
      };
    }

    showStep();
  }

  // ------------------------------------------------------------------
  // #2. KEYBOARD SHORTCUTS TOOLTIP
  // ------------------------------------------------------------------
  function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // ⌘? on Mac, Ctrl+? on Windows (Shift + / = ?)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '?') {
        e.preventDefault();
        showShortcutsModal();
      }
    });

    // Also add a small hint near the command palette
    var palette = document.querySelector('[class*="palette"], [class*="Palette"], [class*="command"]');
    if (palette) {
      var hint = document.createElement('button');
      hint.style.cssText = [
        'background: none',
        'border: 1px solid rgba(255,255,255,0.1)',
        'color: #52525b',
        'font-size: 10px',
        'padding: 2px 6px',
        'border-radius: 4px',
        'cursor: pointer',
        'margin-left: 8px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      hint.textContent = '?';
      hint.title = 'Keyboard shortcuts (⌘? or Ctrl+?)';
      hint.onclick = showShortcutsModal;
      palette.parentElement.appendChild(hint);
    }
  }

  function showShortcutsModal() {
    var existing = document.getElementById('cc-shortcuts-modal');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'cc-shortcuts-modal';
    overlay.style.cssText = [
      'position: fixed', 'top: 0', 'left: 0', 'right: 0', 'bottom: 0',
      'background: rgba(0,0,0,0.7)', 'z-index: 10001',
      'display: flex', 'align-items: center', 'justify-content: center'
    ].join(';');

    var modal = document.createElement('div');
    modal.style.cssText = [
      'background: #0f172a', 'border: 1px solid rgba(255,255,255,0.1)',
      'border-radius: 12px', 'padding: 28px', 'max-width: 440px', 'width: 90%',
      'color: #e2e8f0',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ].join(';');

    var isMac = navigator.platform.indexOf('Mac') !== -1;
    var modKey = isMac ? '⌘' : 'Ctrl';

    modal.innerHTML = [
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">',
      '  <h2 style="margin:0;font-size:18px;color:#fff">Keyboard Shortcuts</h2>',
      '  <button id="cc-shortcuts-close" style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer">×</button>',
      '</div>',
      '<div style="display:flex;flex-direction:column;gap:12px">',
      ['Command Palette', 'Search', 'Take a Tour', 'Help / What am I looking at?'].map(function(label, i) {
        var keys = [modKey + '+K', '/', modKey + '+Shift+T' + (isMac ? '' : ''), modKey + '+?'];
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">' +
               '<span style="font-size:13px;color:#cbd5e1">' + label + '</span>' +
               '<kbd style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);padding:3px 8px;border-radius:4px;font-size:11px;color:#e2e8f0;font-family:monospace">' + keys[i] + '</kbd>' +
               '</div>';
      }).join(''),
      '</div>'
    ].join('');

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('cc-shortcuts-close').onclick = function() { overlay.remove(); };
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  }

  // ------------------------------------------------------------------
  // #9. LOADING SKELETON
  // ------------------------------------------------------------------
  function addLoadingSkeleton() {
    // This runs on initial page load — if the page is still loading,
    // show a skeleton. If already loaded, skip.
    if (document.readyState === 'complete') return;

    var skeleton = document.createElement('div');
    skeleton.id = 'cc-loading-skeleton';
    skeleton.style.cssText = [
      'position: fixed', 'top: 0', 'left: 0', 'right: 0', 'bottom: 0',
      'background: #0a0a0a', 'z-index: 9999',
      'display: flex', "flex-direction: column", "align-items: center", "justify-content: center",
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ].join(';');

    skeleton.innerHTML = [
      '<div style="width:200px;max-width:80vw">',
      '  <div style="height:40px;background:rgba(255,255,255,0.05);border-radius:8px;margin-bottom:16px;animation:cc-pulse 1.5s ease-in-out infinite"></div>',
      '  <div style="height:12px;background:rgba(255,255,255,0.05);border-radius:4px;margin-bottom:8px;width:80%;animation:cc-pulse 1.5s ease-in-out infinite"></div>',
      '  <div style="height:12px;background:rgba(255,255,255,0.05);border-radius:4px;margin-bottom:8px;width:60%;animation:cc-pulse 1.5s ease-in-out infinite"></div>',
      '  <div style="height:12px;background:rgba(255,255,255,0.05);border-radius:4px;width:70%;animation:cc-pulse 1.5s ease-in-out infinite"></div>',
      '  <div style="text-align:center;margin-top:24px;color:#52525b;font-size:12px">Loading Command Center…</div>',
      '</div>',
      '<style>@keyframes cc-pulse{0%,100%{opacity:0.3}50%{opacity:0.6}}</style>'
    ].join('');

    document.body.appendChild(skeleton);

    window.addEventListener('load', function() {
      setTimeout(function() {
        var s = document.getElementById('cc-loading-skeleton');
        if (s) {
          s.style.transition = 'opacity 0.3s';
          s.style.opacity = '0';
          setTimeout(function() { s.remove(); }, 300);
        }
      }, 200);
    });
  }

  // ------------------------------------------------------------------
  // #11. DARK/LIGHT THEME TOGGLE (fixes the non-functional React toggle)
  // ------------------------------------------------------------------
  function fixThemeToggle() {
    // First, fix the footer visibility — the SPA uses h-screen which pushes
    // the footer below the fold. We override to make the footer visible.
    if (!document.getElementById('cc-footer-fix')) {
      var style = document.createElement('style');
      style.id = 'cc-footer-fix';
      style.textContent = [
        /* The SPA root has h-screen (100vh) which pushes footer below viewport. */
        /* Override: let the page scroll naturally so footer is reachable. */
        'html, body { height: auto !important; min-height: 100vh; }',
        'body > div:first-child { min-height: 100vh !important; height: auto !important; }',
        'body > div:first-child > div { min-height: 100vh !important; height: auto !important; }',
        /* Ensure footer is always visible and not covered */
        '.cc-footer { display: block !important; position: relative !important; z-index: 50 !important; }',
        /* Add a visible separator before footer */
        '.cc-footer::before { content: ""; display: block; height: 1px; background: linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent); margin-bottom: 0; }',
        '',
        '/* ================================================================ */',
        '/* LIGHT MODE — all modal/panel overrides for order/tender/analytics */',
        '/* ================================================================ */',
        'html:not(.dark) .cc-om-panel-modal,',
        'html:not(.dark) .cc-tm-panel-modal,',
        'html:not(.dark) .cc-pa-modal { background: rgba(248,250,252,0.99) !important; }',
        '',
        'html:not(.dark) .cc-om-panel,',
        'html:not(.dark) .cc-tm-panel { background: rgba(255,255,255,0.98) !important; border-color: rgba(59,130,246,0.2) !important; color: #1e293b !important; }',
        '',
        'html:not(.dark) .cc-om-title,',
        'html:not(.dark) .cc-tm-title { color: #0f172a !important; }',
        'html:not(.dark) .cc-om-header,',
        'html:not(.dark) .cc-tm-header { border-bottom-color: rgba(0,0,0,0.08) !important; }',
        'html:not(.dark) .cc-om-stat-label,',
        'html:not(.dark) .cc-tm-stat-label { color: #64748b !important; }',
        '',
        'html:not(.dark) .cc-om-tab,',
        'html:not(.dark) .cc-tm-tab { color: #64748b !important; }',
        'html:not(.dark) .cc-om-tab.active { color: #3b82f6 !important; border-bottom-color: #3b82f6 !important; }',
        'html:not(.dark) .cc-tm-tab.active { color: #8b5cf6 !important; border-bottom-color: #8b5cf6 !important; }',
        'html:not(.dark) .cc-om-tabs,',
        'html:not(.dark) .cc-tm-tabs { border-bottom-color: rgba(0,0,0,0.08) !important; }',
        '',
        'html:not(.dark) .cc-om-btn-secondary,',
        'html:not(.dark) .cc-tm-btn-secondary { background: rgba(0,0,0,0.04) !important; color: #475569 !important; border-color: rgba(0,0,0,0.1) !important; }',
        'html:not(.dark) .cc-om-btn-secondary:hover,',
        'html:not(.dark) .cc-tm-btn-secondary:hover { background: rgba(0,0,0,0.08) !important; color: #1e293b !important; }',
        '',
        'html:not(.dark) .cc-om-search,',
        'html:not(.dark) .cc-tm-search { background: rgba(0,0,0,0.03) !important; border-color: rgba(0,0,0,0.1) !important; color: #1e293b !important; }',
        'html:not(.dark) .cc-om-search::placeholder,',
        'html:not(.dark) .cc-tm-search::placeholder { color: #94a3b8 !important; }',
        '',
        'html:not(.dark) .cc-om-orders-scroll,',
        'html:not(.dark) .cc-tm-orders-scroll { border-color: rgba(0,0,0,0.08) !important; }',
        'html:not(.dark) .cc-om-table th,',
        'html:not(.dark) .cc-tm-table th { background: rgba(241,245,249,0.95) !important; color: #64748b !important; border-bottom-color: rgba(0,0,0,0.08) !important; }',
        'html:not(.dark) .cc-om-table td,',
        'html:not(.dark) .cc-tm-table td { color: #334155 !important; border-bottom-color: rgba(0,0,0,0.05) !important; }',
        'html:not(.dark) .cc-om-table tr:hover td,',
        'html:not(.dark) .cc-tm-table tr:hover td { background: rgba(59,130,246,0.05) !important; }',
        '',
        'html:not(.dark) .cc-om-detail-section,',
        'html:not(.dark) .cc-tm-detail-section { background: rgba(0,0,0,0.02) !important; }',
        'html:not(.dark) .cc-om-detail-label,',
        'html:not(.dark) .cc-tm-detail-label { color: #64748b !important; }',
        'html:not(.dark) .cc-om-detail-value,',
        'html:not(.dark) .cc-tm-detail-value { color: #1e293b !important; }',
        'html:not(.dark) .cc-om-detail-row,',
        'html:not(.dark) .cc-tm-detail-row { border-bottom-color: rgba(0,0,0,0.05) !important; }',
        '',
        'html:not(.dark) .cc-om-modal,',
        'html:not(.dark) .cc-tm-modal { background: #fff !important; border-color: rgba(59,130,246,0.2) !important; color: #1e293b !important; }',
        'html:not(.dark) .cc-om-modal h2,',
        'html:not(.dark) .cc-tm-modal h2 { color: #0f172a !important; }',
        'html:not(.dark) .cc-om-modal h3,',
        'html:not(.dark) .cc-tm-modal h3 { color: #3b82f6 !important; }',
        'html:not(.dark) .cc-om-modal-close,',
        'html:not(.dark) .cc-tm-modal-close { background: rgba(0,0,0,0.05) !important; border-color: rgba(0,0,0,0.1) !important; color: #64748b !important; }',
        '',
        'html:not(.dark) .cc-om-chart,',
        'html:not(.dark) .cc-tm-chart { background: rgba(0,0,0,0.02) !important; border-color: rgba(0,0,0,0.05) !important; }',
        'html:not(.dark) .cc-om-chart-title,',
        'html:not(.dark) .cc-tm-chart-title { color: #64748b !important; }',
        'html:not(.dark) .cc-om-chart-label,',
        'html:not(.dark) .cc-tm-chart-label { color: #94a3b8 !important; }',
        'html:not(.dark) .cc-om-chart-value,',
        'html:not(.dark) .cc-tm-chart-value { color: #1e293b !important; }',
        '',
        'html:not(.dark) .cc-om-bulk-bar { background: rgba(59,130,246,0.08) !important; border-color: rgba(59,130,246,0.2) !important; }',
        'html:not(.dark) .cc-om-bulk-count { color: #3b82f6 !important; }',
        'html:not(.dark) .cc-tm-bulk-bar { background: rgba(139,92,246,0.08) !important; border-color: rgba(139,92,246,0.2) !important; }',
        'html:not(.dark) .cc-tm-bulk-count { color: #8b5cf6 !important; }',
        '',
        '/* Mobile cards in light mode */',
        'html:not(.dark) .cc-om-card,',
        'html:not(.dark) .cc-tm-card { background: rgba(0,0,0,0.02) !important; border-color: rgba(0,0,0,0.06) !important; }',
        'html:not(.dark) .cc-om-card-header,',
        'html:not(.dark) .cc-tm-card-header { border-bottom-color: rgba(0,0,0,0.06) !important; }',
        'html:not(.dark) .cc-om-card-label,',
        'html:not(.dark) .cc-tm-card-label { color: #64748b !important; }',
        'html:not(.dark) .cc-om-card-value,',
        'html:not(.dark) .cc-tm-card-value { color: #1e293b !important; }',
        '',
        '/* Timeline in light mode */',
        'html:not(.dark) .cc-om-timeline::before,',
        'html:not(.dark) .cc-tm-timeline::before { background: rgba(59,130,246,0.2) !important; }',
        'html:not(.dark) .cc-om-timeline-event,',
        'html:not(.dark) .cc-tm-timeline-event { color: #1e293b !important; }',
        'html:not(.dark) .cc-om-timeline-time,',
        'html:not(.dark) .cc-tm-timeline-time { color: #94a3b8 !important; }',
        'html:not(.dark) .cc-om-timeline-details,',
        'html:not(.dark) .cc-tm-timeline-details { color: #64748b !important; }',
        '',
        '/* Platform analytics light mode */',
        'html:not(.dark) .cc-pa-title { color: #0f172a !important; }',
        'html:not(.dark) .cc-pa-header { border-bottom-color: rgba(0,0,0,0.08) !important; }',
        'html:not(.dark) .cc-pa-period-toggle { background: rgba(0,0,0,0.04) !important; }',
        'html:not(.dark) .cc-pa-period-btn { color: #64748b !important; }',
        'html:not(.dark) .cc-pa-period-btn.active { color: #fff !important; }',
        'html:not(.dark) .cc-pa-tab { color: #64748b !important; }',
        'html:not(.dark) .cc-pa-tab.active { color: #3b82f6 !important; border-bottom-color: #3b82f6 !important; }',
        'html:not(.dark) .cc-pa-tabs { border-bottom-color: rgba(0,0,0,0.08) !important; }',
        'html:not(.dark) .cc-pa-card { background: rgba(0,0,0,0.02) !important; border-color: rgba(0,0,0,0.06) !important; }',
        'html:not(.dark) .cc-pa-card-label { color: #64748b !important; }',
        'html:not(.dark) .cc-pa-card-value { color: #0f172a !important; }',
        'html:not(.dark) .cc-pa-card-delta { color: #64748b !important; }',
        'html:not(.dark) .cc-pa-chart-section { background: rgba(0,0,0,0.02) !important; border-color: rgba(0,0,0,0.05) !important; }',
        'html:not(.dark) .cc-pa-chart-title { color: #1e293b !important; }',
        'html:not(.dark) .cc-pa-bar-label { color: #94a3b8 !important; }',
        'html:not(.dark) .cc-pa-legend-label { color: #334155 !important; }',
        'html:not(.dark) .cc-pa-legend-value { color: #64748b !important; }',
        'html:not(.dark) .cc-pa-donut-center { background: #fff !important; }',
        'html:not(.dark) .cc-pa-donut-center-value { color: #0f172a !important; }',
        'html:not(.dark) .cc-pa-donut-center-label { color: #64748b !important; }',
        '',
        '/* Premium portal CTA in light mode */',
        'html:not(.dark) .cc-premium-banner { background: linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05)) !important; border-color: rgba(59,130,246,0.2) !important; }',
        'html:not(.dark) .cc-premium-banner-title { color: #0f172a !important; }',
        'html:not(.dark) .cc-premium-banner-text { color: #475569 !important; }',
        'html:not(.dark) .cc-premium-feature { color: #64748b !important; }',
        '',
        '/* Close buttons in light mode */',
        'html:not(.dark) .cc-om-close-panel,',
        'html:not(.dark) .cc-tm-close-panel,',
        'html:not(.dark) .cc-pa-close { background: rgba(239,68,68,0.08) !important; border-color: rgba(239,68,68,0.2) !important; }'
      ].join('\n');
      document.head.appendChild(style);
    }

    var STORAGE_KEY = 'cc-theme';

    function findThemeButton() {
      var buttons = document.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        var btn = buttons[i];
        var text = btn.textContent || '';
        if (text.indexOf('Light Mode') !== -1 || text.indexOf('Dark Mode') !== -1) {
          return btn;
        }
      }
      return null;
    }

    function getCurrentTheme() {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }

    function applyTheme(theme) {
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
      localStorage.setItem(STORAGE_KEY, theme);
      updateButtonLabel(theme);
    }

    function updateButtonLabel(theme) {
      var btn = findThemeButton();
      if (!btn) return;
      var span = btn.querySelector('span');
      if (span) {
        span.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
      }
      var svg = btn.querySelector('svg');
      if (svg) {
        if (theme === 'dark') {
          svg.innerHTML = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>';
        } else {
          svg.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>';
        }
      }
    }

    function toggleTheme() {
      var current = getCurrentTheme();
      var newTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    }

    var attempts = 0;
    function tryAttach() {
      attempts++;
      var btn = findThemeButton();
      if (btn) {
        btn.onclick = null;
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          toggleTheme();
        });
        updateButtonLabel(getCurrentTheme());
        return;
      }
      if (attempts < 30) setTimeout(tryAttach, 500);
    }

    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) applyTheme(stored);
    } catch(e) {}

    setTimeout(tryAttach, 1000);

    // Floating fallback toggle
    function addFloatingToggle() {
      if (document.getElementById('cc-floating-theme-toggle')) return;
      var fab = document.createElement('button');
      fab.id = 'cc-floating-theme-toggle';
      fab.style.cssText = [
        'position: fixed', 'bottom: 20px', 'left: 20px', 'z-index: 9999',
        'width: 44px', 'height: 44px', 'border-radius: 50%',
        'background: rgba(255,255,255,0.1)', 'border: 1px solid rgba(255,255,255,0.2)',
        'color: #e2e8f0', 'cursor: pointer', 'font-size: 20px',
        'display: flex', 'align-items: center', 'justify-content: center',
        'transition: all 0.2s', 'backdrop-filter: blur(8px)'
      ].join(';');
      fab.title = 'Toggle dark/light theme';
      fab.setAttribute('aria-label', 'Toggle dark/light theme');

      function updateFabIcon() {
        fab.innerHTML = getCurrentTheme() === 'dark' ? '☀️' : '🌙';
      }
      fab.onclick = function() { toggleTheme(); updateFabIcon(); };
      updateFabIcon();
      document.body.appendChild(fab);

      var observer = new MutationObserver(function() { updateFabIcon(); });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }

    setTimeout(addFloatingToggle, 2000);
  }

  // ------------------------------------------------------------------
  // INIT — Run all enhancements after DOM is ready
  // ------------------------------------------------------------------
  function init() {
    addLoadingSkeleton();      // #9 — runs immediately

    // Wait for DOM to be ready for the rest
    function runEnhancements() {
      addDemoModeBadge();              // #4
      addBackToMainSiteButton();       // #1
      addContactSalesCTA();            // #10
      addHelpButton();                 // #6
      addTourButton();                 // #7
      addKeyboardShortcuts();          // #2
      persistSidebarState();           // #8
      var labeled = addIconAriaLabels(); // #5
      var stamped = addLastUpdatedTimestamps(); // #3
      fixThemeToggle();                // #11

      console.log('[cc-enhancements.js] All 11 enhancements loaded:', {
        demoMode: true,
        backToMain: true,
        contactSales: true,
        helpButton: true,
        tourButton: true,
        keyboardShortcuts: true,
        sidebarPersist: true,
        iconsLabeled: labeled,
        timestampsAdded: stamped,
        loadingSkeleton: true,
        themeToggle: true
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runEnhancements);
    } else {
      runEnhancements();
    }
  }

  init();
})();
