(function () {
  'use strict';
  var clock = document.getElementById('localNodeClock');
  if (!clock) return;

  var formatter;
  try {
    formatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (_) {
    formatter = null;
  }

  function update() {
    var now = new Date();
    clock.dateTime = now.toISOString();
    clock.textContent = formatter ? formatter.format(now) : now.toLocaleTimeString().slice(0, 5);
  }

  update();
  window.setInterval(function () {
    if (document.visibilityState !== 'hidden') update();
  }, 30000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'hidden') update();
  });
}());
