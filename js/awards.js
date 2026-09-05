(function() {
  'use strict';

  var state = {
    config: null,
    players: [],
    selections: {},
    submitting: false
  };

  var root = document.getElementById('awardsApp');
  if (!root) return;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function(char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char];
    });
  }

  function loadData() {
    return Promise.all([
      fetch('data/awards.json', { cache: 'no-store' }).then(checkResponse),
      fetch('data/players.json', { cache: 'no-store' }).then(checkResponse)
    ]).then(function(values) {
      state.config = values[0];
      state.players = values[1].players || [];
      if (!state.players.length) throw new Error('No eligible MCC players are available.');
      renderAwards();
      initializeCountdown();
      initializeShare();
      initializeSubmission();
    }).catch(function(error) {
      root.innerHTML = '<div class="container"><p class="nominee-empty">Awards could not load. Please refresh and try again.</p></div>';
      console.error('MCC Awards initialization failed:', error);
    });
  }

  function checkResponse(response) {
    if (!response.ok) throw new Error('Request failed with status ' + response.status);
    return response.json();
  }

  function renderAwards() {
    var categoriesBySection = {};
    state.config.categories.forEach(function(category) {
      (categoriesBySection[category.section] || (categoriesBySection[category.section] = [])).push(category);
    });

    root.innerHTML = state.config.sections.map(function(section) {
      var cards = (categoriesBySection[section.id] || []).map(function(category) {
        return renderAwardCard(category, section.tone);
      }).join('');
      return '<section class="awards-section-block" aria-labelledby="awards-section-' + escapeHtml(section.id) + '">' +
        '<div class="awards-section-heading">' +
          '<div class="awards-eyebrow">' + escapeHtml(section.eyebrow) + '</div>' +
          '<h2 id="awards-section-' + escapeHtml(section.id) + '">' + escapeHtml(section.icon) + ' ' + escapeHtml(section.title) + '</h2>' +
          '<p>' + (section.tone === 'fun' ? 'The legends, the excuses and the nonstop entertainment.' : 'Celebrating growth, potential and impact on the MCC journey.') + '</p>' +
        '</div>' +
        '<div class="awards-cards">' + cards + '</div>' +
      '</section>';
    }).join('');

    root.querySelectorAll('.award-card').forEach(function(card) {
      var categoryId = card.getAttribute('data-category-id');
      var search = card.querySelector('.award-search');
      var clear = card.querySelector('.award-clear-search');
      renderNominees(card, categoryId, '');
      search.addEventListener('input', function() {
        renderNominees(card, categoryId, search.value);
      });
      clear.addEventListener('click', function() {
        search.value = '';
        renderNominees(card, categoryId, '');
        search.focus();
      });
    });
    updateProgress();
  }

  function renderAwardCard(category, tone) {
    return '<article class="award-card" data-category-id="' + escapeHtml(category.id) + '" data-tone="' + escapeHtml(tone) + '">' +
      '<div class="award-card-head">' +
        '<div class="award-card-icon" aria-hidden="true">' + escapeHtml(category.icon) + '</div>' +
        '<div>' +
          '<div class="award-number">Award #' + escapeHtml(category.number) + '</div>' +
          '<h3>' + escapeHtml(category.name) + '</h3>' +
          '<p class="award-subtitle">' + escapeHtml(category.subtitle) + '</p>' +
        '</div>' +
      '</div>' +
      '<p class="award-description">' + escapeHtml(category.description) + '</p>' +
      '<p class="award-highlight">' + escapeHtml(category.highlight) + '</p>' +
      '<p class="award-question">Who deserves this award?</p>' +
      '<div class="award-search-wrap">' +
        '<span class="award-search-icon" aria-hidden="true">🔍</span>' +
        '<label class="sr-only" for="search-' + escapeHtml(category.id) + '">Search MCC players for ' + escapeHtml(category.name) + '</label>' +
        '<input class="award-search" id="search-' + escapeHtml(category.id) + '" type="search" inputmode="search" autocomplete="off" placeholder="Search MCC players">' +
        '<button class="award-clear-search" type="button" aria-label="Clear player search">✕</button>' +
      '</div>' +
      '<div class="nominee-grid" role="listbox" aria-label="MCC players"></div>' +
      '<div class="award-selected-summary" aria-live="polite"></div>' +
    '</article>';
  }

  function renderNominees(card, categoryId, query) {
    var normalizedQuery = query.trim().toLocaleLowerCase();
    var matches = state.players.filter(function(player) {
      return !normalizedQuery || player.name.toLocaleLowerCase().indexOf(normalizedQuery) !== -1;
    });
    var grid = card.querySelector('.nominee-grid');

    if (!matches.length) {
      grid.innerHTML = '<p class="nominee-empty">No MCC player matches that search.</p>';
      return;
    }

    grid.innerHTML = matches.map(function(player) {
      var selected = state.selections[categoryId] === player.id;
      return '<button type="button" class="nominee-card' + (selected ? ' selected' : '') + '" role="option" aria-selected="' + selected + '" data-player-id="' + escapeHtml(player.id) + '">' +
        '<span>' + escapeHtml(player.name) + '</span><span class="nominee-card-check" aria-hidden="true">✓</span>' +
      '</button>';
    }).join('');

    grid.querySelectorAll('.nominee-card').forEach(function(button) {
      button.addEventListener('click', function() {
        selectNominee(card, categoryId, button.getAttribute('data-player-id'));
      });
    });
  }

  function selectNominee(card, categoryId, playerId) {
    state.selections[categoryId] = playerId;
    card.querySelectorAll('.nominee-card').forEach(function(button) {
      var selected = button.getAttribute('data-player-id') === playerId;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    var player = state.players.find(function(item) { return item.id === playerId; });
    card.querySelector('.award-selected-summary').textContent = player ? '🏆 Your pick: ' + player.name : '';
    updateProgress();
  }

  function updateProgress() {
    var total = state.config ? state.config.categories.length : 6;
    var completed = Object.keys(state.selections).length;
    var count = document.getElementById('awardsProgressCount');
    var fill = document.getElementById('awardsProgressFill');
    if (count) count.textContent = completed + ' of ' + total + ' Awards';
    if (fill) fill.style.width = (completed / total * 100) + '%';
  }

  function initializeShare() {
    var button = document.getElementById('awardsShare');
    if (!button) return;
    button.addEventListener('click', function() {
      var url = window.location.href.split('#')[0];
      var message = '🏆 THE 2ND MCC AWARDS ARE HERE! 🏏🔥\n\n' +
        "4+ Years of MCC. Unlimited Bakar. And now it's YOUR turn to decide the winners!\n\n" +
        'Cast your votes for the MCC 2026 Awards 👇\n\n' + url +
        '\n\nChoose wisely. No pressure. 😎🏆';
      if (navigator.share) {
        navigator.share({ title: 'The 2nd MCC Awards', text: message }).catch(function() {});
      } else {
        window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank', 'noopener');
      }
    });
  }

  function initializeCountdown() {
    var value = state.config.event.countdown_at;
    if (!value) return;
    var target = new Date(value);
    if (isNaN(target.getTime())) return;
    var section = document.getElementById('awardsCountdown');
    section.classList.add('visible');

    function tick() {
      var remaining = Math.max(0, target.getTime() - Date.now());
      var days = Math.floor(remaining / 86400000);
      var hours = Math.floor(remaining % 86400000 / 3600000);
      var minutes = Math.floor(remaining % 3600000 / 60000);
      var seconds = Math.floor(remaining % 60000 / 1000);
      [['days', days], ['hours', hours], ['minutes', minutes], ['seconds', seconds]].forEach(function(pair) {
        var element = document.getElementById('countdown-' + pair[0]);
        if (element) element.textContent = String(pair[1]).padStart(2, '0');
      });
    }
    tick();
    window.setInterval(tick, 1000);
  }

  function initializeSubmission() {
    var form = document.getElementById('awardsVoteForm');
    var button = document.getElementById('awardsSubmit');
    var preview = document.getElementById('awardsPreviewNote');
    var enabled = Boolean(state.config.voting.enabled) &&
      /^https:\/\/script\.google\.com\//.test(state.config.voting.api_url || '');

    if (!enabled) {
      button.disabled = true;
      button.textContent = '🏆 VOTING OPENS SOON';
      preview.hidden = false;
    }
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      if (enabled) submitVotes();
    });
  }

  function normalizeContact(value) {
    var trimmed = value.trim();
    if (trimmed.indexOf('@') !== -1) return trimmed.toLocaleLowerCase();
    return trimmed.replace(/\D/g, '');
  }

  function isValidContact(value) {
    if (value.indexOf('@') !== -1) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return /^\d{10,15}$/.test(value);
  }

  function showMessage(message, success) {
    var element = document.getElementById('awardsFormMessage');
    element.textContent = message;
    element.classList.toggle('success', Boolean(success));
  }

  function submitVotes() {
    if (state.submitting) return;
    var categories = state.config.categories;
    var missing = categories.filter(function(category) { return !state.selections[category.id]; });
    if (missing.length) {
      showMessage('Please vote in all 6 awards before submitting.');
      var firstMissing = document.querySelector('[data-category-id="' + missing[0].id + '"]');
      if (firstMissing) firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var contactInput = document.getElementById('awardsVoterContact');
    var contact = normalizeContact(contactInput.value);
    if (!isValidContact(contact)) {
      showMessage('Enter a valid email address or 10–15 digit phone number.');
      contactInput.focus();
      return;
    }

    var payload = {
      contact: contact,
      votes: categories.map(function(category) {
        var playerId = state.selections[category.id];
        var player = state.players.find(function(item) { return item.id === playerId; });
        return {
          category_id: category.id,
          selected_player_id: playerId,
          selected_player_name: player ? player.name : ''
        };
      })
    };

    state.submitting = true;
    var button = document.getElementById('awardsSubmit');
    button.disabled = true;
    button.textContent = 'LOCKING IN YOUR VOTES...';
    showMessage('');

    fetch(state.config.voting.api_url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    }).then(checkResponse).then(function(result) {
      if (!result.ok) throw new Error(result.message || 'Your votes could not be submitted.');
      try { window.localStorage.setItem('mcc-awards-2026-submitted', 'true'); } catch (error) {}
      showSuccess();
    }).catch(function(error) {
      state.submitting = false;
      button.disabled = false;
      button.textContent = '🏆 SUBMIT MY MCC VOTES';
      showMessage(error.message || 'Submission failed. Please try again.');
    });
  }

  function showSuccess() {
    document.getElementById('awardsVotingExperience').hidden = true;
    var success = document.getElementById('awardsSuccess');
    success.classList.add('visible');
    launchConfetti();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function launchConfetti() {
    var container = document.getElementById('awardsConfetti');
    var colors = ['#F5A623', '#E8732C', '#FFFFFF', '#F5C451', '#4F8F43'];
    for (var index = 0; index < 90; index += 1) {
      var piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty('--drift', (Math.random() * 180 - 90) + 'px');
      piece.style.animationDelay = Math.random() * 0.65 + 's';
      piece.style.transform = 'rotate(' + Math.random() * 180 + 'deg)';
      container.appendChild(piece);
    }
    window.setTimeout(function() { container.innerHTML = ''; }, 3800);
  }

  loadData();
})();
