// ============================================================
// MCC Website — main.js
// ============================================================

(function() {
  'use strict';

  // --- Mobile hamburger ---
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
    // Close on link click
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });
  }

  // --- Dropdown toggle (mobile) ---
  document.querySelectorAll('.dropdown-toggle').forEach(function(toggle) {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      var parent = this.closest('.nav-dropdown');
      parent.classList.toggle('open');
    });
  });

  // --- Navbar scroll effect ---
  var navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // --- Scroll reveal animation ---
  var revealElements = document.querySelectorAll('.section, .achievement-card, .value-card, .team-card, .benefit-card, .timeline-card, .reason-card, .format-card');
  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal', 'visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.02, rootMargin: '0px 0px 50px 0px' });

    revealElements.forEach(function(el) {
      el.classList.add('reveal');
      observer.observe(el);
    });
    // Fallback: force all visible after 2s in case observer doesn't fire (mobile)
    setTimeout(function() {
      revealElements.forEach(function(el) {
        el.classList.add('visible');
      });
    }, 2000);
  }

  // --- Gallery / Video filter ---
  var filterBtns = document.querySelectorAll('.filter-btn');
  var galleryItems = document.querySelectorAll('.gallery-item');
  var videoCards = document.querySelectorAll('.video-card[data-category]');
  var filterableItems = galleryItems.length > 0 ? galleryItems : videoCards;

  if (filterBtns.length > 0 && filterableItems.length > 0) {
    filterBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        filterBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var filter = btn.getAttribute('data-filter');
        filterableItems.forEach(function(item) {
          if (filter === 'all' || item.getAttribute('data-category') === filter) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
      });
    });
  }

  // --- Lightbox ---
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');

  if (lightbox && lightboxImg) {
    galleryItems.forEach(function(item) {
      item.addEventListener('click', function() {
        var img = item.querySelector('img');
        if (img) {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt;
          lightbox.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  // --- Site view counter (2s timeout so slow API doesn't block page) ---
  var viewEl = document.getElementById('siteViews');
  if (viewEl) {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 2000);
    fetch('https://api.counterapi.dev/v1/mcc-miltoncricketchamps/website-views/up', { signal: controller.signal })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var countEl = viewEl.querySelector('.view-count');
        if (countEl && data.count) {
          countEl.textContent = data.count.toLocaleString();
          viewEl.classList.add('loaded');
        }
      })
      .catch(function() {});
  }

  // --- Pre-select contact reason from URL (e.g. ?subject=sponsorship) ---
  var params = new URLSearchParams(window.location.search);
  var subjectParam = params.get('subject');
  if (subjectParam) {
    var reasonMap = { 'sponsorship': 'sponsor', 'join': 'join', 'general': 'general' };
    var val = reasonMap[subjectParam] || subjectParam;
    var btn = document.querySelector('#waReason .wa-option[data-value="' + val + '"]');
    if (btn) btn.click();
  }

  // --- Leaderboard tabs ---
  var lbBtns = document.querySelectorAll('.lb-tab-btn');
  var lbPanels = document.querySelectorAll('.lb-panel');
  if (lbBtns.length > 0) {
    lbBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        lbBtns.forEach(function(b) { b.classList.remove('active'); });
        lbPanels.forEach(function(p) { p.classList.remove('active'); });
        btn.classList.add('active');
        var tab = btn.getAttribute('data-tab');
        var panel = document.getElementById('lb-' + tab);
        if (panel) panel.classList.add('active');
      });
    });
  }

})();

// --- WhatsApp Message Builder ---
function waSelect(btn) {
  // Toggle selection within the same group
  var siblings = btn.parentElement.querySelectorAll('.wa-option');
  siblings.forEach(function(s) { s.classList.remove('selected'); });
  btn.classList.add('selected');

  // Show/hide experience step based on reason
  var expStep = document.getElementById('waExpStep');
  if (expStep && btn.parentElement.id === 'waReason') {
    expStep.style.display = btn.getAttribute('data-value') === 'join' ? 'block' : 'none';
    if (btn.getAttribute('data-value') !== 'join') {
      // Clear experience selection
      var expBtns = document.querySelectorAll('#waExperience .wa-option');
      expBtns.forEach(function(b) { b.classList.remove('selected'); });
    }
  }
}

function waBuildLink() {
  var reasonBtn = document.querySelector('#waReason .wa-option.selected');
  var expBtn = document.querySelector('#waExperience .wa-option.selected');
  var name = (document.getElementById('waName') || {}).value || '';
  var msg = (document.getElementById('waMsg') || {}).value || '';

  if (!reasonBtn) {
    alert('Please select why you are reaching out.');
    return false;
  }
  if (!name.trim()) {
    alert('Please enter your name.');
    return false;
  }

  var reasonMap = {
    'sponsor': 'Potential Sponsor',
    'join': 'Want to Join the Team',
    'general': 'General Inquiry'
  };
  var reason = reasonMap[reasonBtn.getAttribute('data-value')] || 'General Inquiry';

  var lines = [];
  lines.push('Hi MCC! ' + String.fromCodePoint(0x1F3CF));
  lines.push('');
  lines.push(String.fromCodePoint(0x1F464) + ' Name: ' + name.trim());
  lines.push(String.fromCodePoint(0x1F4CB) + ' Reason: ' + reason);

  if (reasonBtn.getAttribute('data-value') === 'join' && expBtn) {
    var expMap = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced / League Experience'
    };
    lines.push(String.fromCodePoint(0x1F3C6) + ' Experience: ' + (expMap[expBtn.getAttribute('data-value')] || ''));
  }

  if (msg.trim()) {
    lines.push('');
    lines.push(String.fromCodePoint(0x1F4AC) + ' ' + msg.trim());
  }

  var text = encodeURIComponent(lines.join('\n'));
  var sendBtn = document.getElementById('waSendBtn');
  sendBtn.href = 'https://wa.me/16475231638?text=' + text;
  return true;
}
