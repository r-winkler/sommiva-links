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
  var preferred = (navigator.languages && navigator.languages[0]) || navigator.language || '';
  var lang = /^de\b/i.test(preferred) ? 'de' : 'en';

  document.documentElement.lang = lang;
  var blocks = document.querySelectorAll('[data-lang]');
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
