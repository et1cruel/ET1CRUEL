(function () {
  'use strict';

  var root = document.getElementById('commandConsole');
  var input = document.getElementById('commandInput');
  var results = document.getElementById('commandResults');
  var count = document.getElementById('commandCount');
  var trigger = document.getElementById('commandOpen');
  if (!root || !input || !results || !trigger) return;

  var items = [];
  var visibleItems = [];
  var activeIndex = -1;
  var previousFocus = null;

  function collectDestinations() {
    var seen = Object.create(null);
    Array.prototype.forEach.call(document.querySelectorAll('#nav a, .explore a'), function (link) {
      var href = link.getAttribute('href');
      var label = link.textContent.replace(/\s+/g, ' ').trim();
      if (!href || !label || seen[href]) return;
      seen[href] = true;
      var destination = href.replace(/^\.\//, '').replace(/^#/, '');
      items.push({ href: href, label: label, destination: destination || 'HOME' });
    });
  }

  function setActive(index) {
    if (!visibleItems.length) { activeIndex = -1; input.removeAttribute('aria-activedescendant'); return; }
    activeIndex = (index + visibleItems.length) % visibleItems.length;
    visibleItems.forEach(function (item, i) {
      item.button.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
    });
    var active = visibleItems[activeIndex].button;
    input.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
  }

  function render(query) {
    var needle = (query || '').trim().toLocaleLowerCase();
    visibleItems = [];
    results.textContent = '';
    items.forEach(function (item, index) {
      if (needle && (item.label + ' ' + item.destination).toLocaleLowerCase().indexOf(needle) === -1) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'command-option';
      button.id = 'command-option-' + index;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      button.tabIndex = -1;
      button.dataset.href = item.href;
      button.dataset.index = String(visibleItems.length + 1).padStart(2, '0');

      var label = document.createElement('span');
      label.className = 'command-label';
      label.textContent = item.label;
      var destination = document.createElement('span');
      destination.className = 'command-destination';
      destination.textContent = item.destination;
      var arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      button.appendChild(label);
      button.appendChild(destination);
      button.appendChild(arrow);
      results.appendChild(button);
      visibleItems.push({ button: button, href: item.href });
    });

    if (!visibleItems.length) {
      var empty = document.createElement('p');
      empty.className = 'command-empty';
      empty.setAttribute('role', 'status');
      empty.textContent = 'ไม่พบห้องที่ตรงกัน ลองค้นด้วยคำอื่น';
      results.appendChild(empty);
      input.removeAttribute('aria-activedescendant');
      activeIndex = -1;
    } else {
      setActive(0);
    }
    if (count) count.textContent = needle ? visibleItems.length + ' MATCHES' : visibleItems.length + ' DESTINATIONS';
  }

  function open() {
    if (!root.hidden) return;
    previousFocus = document.activeElement;
    root.hidden = false;
    input.value = '';
    render('');
    input.setAttribute('aria-expanded', 'true');
    document.body.classList.add('command-console-open');
    window.requestAnimationFrame(function () { input.focus(); });
  }

  function close(restoreFocus) {
    if (root.hidden) return;
    root.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    document.body.classList.remove('command-console-open');
    if (restoreFocus !== false) {
      var target = previousFocus && document.contains(previousFocus) ? previousFocus : trigger;
      target.focus();
    }
  }

  function goToActive() {
    if (activeIndex < 0 || !visibleItems[activeIndex]) return;
    var href = visibleItems[activeIndex].href;
    close(false);
    window.location.href = href;
  }

  trigger.addEventListener('click', open);
  root.addEventListener('click', function (event) {
    if (event.target.closest('[data-command-close]')) close(true);
    var option = event.target.closest('.command-option');
    if (option) {
      var href = option.dataset.href;
      close(false);
      window.location.href = href;
    }
  });
  input.addEventListener('input', function () { render(input.value); });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(activeIndex + 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(activeIndex - 1); }
    else if (event.key === 'Enter') { event.preventDefault(); goToActive(); }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !root.hidden) { event.preventDefault(); close(true); return; }
    if (!root.hidden) {
      if (event.key === 'Tab') {
        var closeButton = root.querySelector('.command-close');
        if (event.shiftKey && document.activeElement === closeButton) { event.preventDefault(); input.focus(); }
        else if (!event.shiftKey && document.activeElement === input) { event.preventDefault(); closeButton.focus(); }
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      open();
      return;
    }
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      var target = event.target;
      var typing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if (!typing) { event.preventDefault(); open(); }
    }
  });

  collectDestinations();
  render('');
}());
