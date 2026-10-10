/* Sommiva invitation page (sommiva.app/join/<token>). Spec invitation-links, "Fallback page without the app".
   Self-hosted, optional: reads the token from the address, picks the language, shows the link, copies it and draws
   the QR code with the vendored encoder (qrcode.js). Sends every other address to sommiva.com. No storage, no
   requests. */
(function () {
  'use strict';
  var match = /^\/join\/([A-Za-z0-9_-]{16,64})\/?$/.exec(window.location.pathname);
  if (!match) {
    window.location.replace('https://sommiva.com/');
    return;
  }
  var link = 'https://sommiva.app/join/' + match[1];
  var label = 'sommiva.app/join/' + match[1];
  // First browser language whose primary subtag has a block on the page (fr-CH -> fr, pt-PT -> pt), English otherwise.
  // Old Android browsers report Indonesian with the retired code "in" and Hebrew with "iw". Norwegian (no) and
  // Nynorsk (nn) get Bokmål.
  var aliases = { 'in': 'id', 'iw': 'he', 'no': 'nb', 'nn': 'nb' };
  // Right-to-left languages: the page mirrors (dir on <html>); link and QR code stay left to right (join.css).
  var rtl = { 'ar': true, 'he': true, 'fa': true };
  var blocks = document.querySelectorAll('[data-lang]');
  var available = {};
  for (var k = 0; k < blocks.length; k++) available[blocks[k].getAttribute('data-lang')] = true;
  var preferred = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
  var lang = 'en';
  // Chinese: the script subtag decides (zh-Hant, zh-Hans), else the region (TW, HK, MO traditional; any other or
  // none simplified).
  var chinese = function (parts) {
    var region = '';
    for (var s = 1; s < parts.length; s++) {
      var sub = parts[s].toLowerCase();
      if (sub === 'hant') return 'zh-Hant';
      if (sub === 'hans') return 'zh-Hans';
      if (!region && /^([a-z]{2}|[0-9]{3})$/.test(sub)) region = sub;
    }
    return /^(tw|hk|mo)$/.test(region) ? 'zh-Hant' : 'zh-Hans';
  };
  for (var p = 0; p < preferred.length; p++) {
    var parts = String(preferred[p] || '').split(/[-_]/);
    var primary = parts[0].toLowerCase();
    if (Object.prototype.hasOwnProperty.call(aliases, primary)) primary = aliases[primary];
    if (primary === 'zh') primary = chinese(parts);
    if (available[primary]) {
      lang = primary;
      break;
    }
  }

  document.documentElement.lang = lang;
  document.documentElement.dir = rtl[lang] ? 'rtl' : 'ltr';
  for (var i = 0; i < blocks.length; i++) {
    var own = blocks[i].getAttribute('data-lang') === lang;
    blocks[i].hidden = !own;
    if (own && blocks[i].hasAttribute('data-title')) document.title = blocks[i].getAttribute('data-title');
  }
  var each = function (selector, action) {
    var found = document.querySelectorAll(selector);
    for (var j = 0; j < found.length; j++) action(found[j]);
  };
  each('.js-only', function (el) { el.hidden = false; });
  each('[data-open]', function (el) { el.href = link; });
  each('[data-link]', function (el) { el.textContent = label; });
  each('[data-copy]', function (button) {
    var text = button.querySelector('span');
    var idle = text.textContent;
    button.addEventListener('click', function () {
      var done = function () {
        text.textContent = button.getAttribute('data-copied');
        window.setTimeout(function () { text.textContent = idle; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(done, function () {});
      }
    });
  });
  if (typeof window.qrcode === 'function') {
    var qr = window.qrcode(0, 'M');
    qr.addData(link);
    qr.make();
    each('[data-qr]', function (el) { el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); });
  }
})();
