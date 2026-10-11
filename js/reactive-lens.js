(function () {
  'use strict';

  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reducedMotion) return;

  document.querySelectorAll('.hero, .sections > section.card').forEach(function (surface) {
    var frame = 0;
    var lastEvent = null;

    surface.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') return;
      lastEvent = event;
      if (frame) return;

      frame = window.requestAnimationFrame(function () {
        frame = 0;
        if (!lastEvent) return;
        var bounds = surface.getBoundingClientRect();
        var x = Math.max(0, Math.min(100, ((lastEvent.clientX - bounds.left) / bounds.width) * 100));
        var y = Math.max(0, Math.min(100, ((lastEvent.clientY - bounds.top) / bounds.height) * 100));
        surface.style.setProperty('--spot-x', x.toFixed(1) + '%');
        surface.style.setProperty('--spot-y', y.toFixed(1) + '%');
        surface.classList.add('is-pointer-active');
      });
    }, { passive: true });

    surface.addEventListener('pointerleave', function () {
      lastEvent = null;
      if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
      surface.classList.remove('is-pointer-active');
      surface.style.removeProperty('--spot-x');
      surface.style.removeProperty('--spot-y');
    }, { passive: true });
  });
}());
