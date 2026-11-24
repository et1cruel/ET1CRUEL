(function () {
  'use strict';

  var balanceEl = document.getElementById('coverBalance');
  var goalProgressEl = document.getElementById('coverGoalProgress');
  var goalBarEl = document.getElementById('coverGoalBar');
  var goalFillEl = document.getElementById('coverGoalFill');
  var dateEl = document.getElementById('coverQuestDate');
  var progressEl = document.getElementById('coverQuestProgress');
  var listEl = document.getElementById('coverQuestList');
  var formEl = document.getElementById('coverQuestForm');
  var inputEl = document.getElementById('coverQuestInput');
  var CUSTOM_KEY = 'et1cruel-cover-daily-quests-v1';
  var DISMISSED_KEY = 'et1cruel-cover-dismissed-dailies-v1';
  if (!balanceEl || !goalProgressEl || !goalBarEl || !goalFillEl || !dateEl || !progressEl || !listEl || !formEl || !inputEl) return;

  function loadCustomTasks(today) {
    try {
      var saved = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}');
      return Array.isArray(saved[today]) ? saved[today].filter(function (task) {
        return task && typeof task.id === 'string' && typeof task.title === 'string';
      }) : [];
    } catch (e) { return []; }
  }

  function saveCustomTasks(today, tasks) {
    try {
      var saved = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
      saved[today] = tasks;
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(saved));
      return true;
    } catch (e) { return false; }
  }

  function loadDismissedTasks(today) {
    try {
      var saved = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}');
      return Array.isArray(saved[today]) ? saved[today].filter(function (id) { return typeof id === 'string'; }) : [];
    } catch (e) { return []; }
  }

  function saveDismissedTasks(today, ids) {
    try {
      var saved = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
      saved[today] = ids;
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(saved));
      return true;
    } catch (e) { return false; }
  }

  function dayKey(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function render() {
    var os = window.ET1OS;
    if (!os || typeof os.netWorth !== 'function' || typeof os.state !== 'function') return;

    var amount = Number(os.netWorth());
    balanceEl.textContent = Number.isFinite(amount) ? '฿ ' + amount.toLocaleString('th-TH') : 'ยังไม่มียอดเงิน';
    var state = os.state();
    var goal = Number(state.mainQuest && state.mainQuest.target) || 1000000;
    var progress = Math.max(0, Math.min(100, amount / goal * 100));
    goalProgressEl.textContent = progress.toLocaleString('th-TH', { maximumFractionDigits: 1 }) + '%';
    goalFillEl.style.width = progress + '%';
    goalBarEl.setAttribute('aria-valuemax', String(goal));
    goalBarEl.setAttribute('aria-valuenow', String(Math.min(amount, goal)));

    var now = new Date();
    var today = dayKey(now);
    dateEl.textContent = now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });

    var quests = Array.isArray(state.dailies) ? state.dailies : [];
    var customTasks = loadCustomTasks(today);
    var dismissed = loadDismissedTasks(today);
    var todayQuests = quests.filter(function (quest) { return dismissed.indexOf(quest.id) === -1; });
    var dailyDone = todayQuests.filter(function (quest) { return !!(quest.done && quest.done[today]); }).length;
    var customDone = customTasks.filter(function (task) { return !!task.done; }).length;
    progressEl.textContent = (dailyDone + customDone) + ' / ' + (todayQuests.length + customTasks.length) + ' สำเร็จ';

    var orderedQuests = todayQuests.slice().sort(function (a, b) {
      return Number(!!(a.done && a.done[today])) - Number(!!(b.done && b.done[today]));
    });
    var orderedCustom = customTasks.slice().sort(function (a, b) {
      return Number(!!a.done) - Number(!!b.done);
    });
    var visible = orderedCustom.filter(function (task) { return !task.done; })
      .map(function (task) { return { kind: 'custom', task: task }; })
      .concat(orderedQuests.filter(function (quest) { return !(quest.done && quest.done[today]); })
        .map(function (quest) { return { kind: 'daily', quest: quest }; }))
      .concat(orderedCustom.filter(function (task) { return !!task.done; })
        .map(function (task) { return { kind: 'custom', task: task }; }))
      .concat(orderedQuests.filter(function (quest) { return !!(quest.done && quest.done[today]); })
        .map(function (quest) { return { kind: 'daily', quest: quest }; }));

    listEl.replaceChildren();
    if (!visible.length) {
      var empty = document.createElement('div');
      empty.className = 'cover-empty';
      empty.textContent = 'ยังไม่มีภารกิจวันนี้ — ไปเพิ่มหรือเลือกภารกิจใน Daily Quest ได้เลย';
      listEl.appendChild(empty);
      return;
    }

    visible.forEach(function (item) {
      var isCustom = item.kind === 'custom';
      var quest = isCustom ? item.task : item.quest;
      var isDone = isCustom ? !!quest.done : !!(quest.done && quest.done[today]);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'cover-quest' + (isDone ? ' done' : '');
      if (isCustom) button.dataset.coverCustomId = quest.id;
      else { button.dataset.act = 'toggle'; button.dataset.id = quest.id; }
      button.setAttribute('aria-pressed', String(isDone));
      button.setAttribute('aria-label', (isDone ? 'ทำสำเร็จแล้ว: ' : 'ทำเครื่องหมายว่าสำเร็จ: ') + quest.title);

      var mark = document.createElement('span');
      mark.className = 'cover-quest-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = isDone ? '✓' : '○';
      var title = document.createElement('span');
      title.className = 'cover-quest-title';
      title.textContent = quest.title;
      button.append(mark, title);
      var row = document.createElement('div');
      row.className = 'cover-custom-row';
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'cover-quest-delete';
      if (isCustom) remove.dataset.coverDelete = quest.id;
      else remove.dataset.coverDismiss = quest.id;
      remove.setAttribute('aria-label', 'เอาภารกิจออกจากวันนี้: ' + quest.title);
      remove.title = 'เอาออกจากภารกิจวันนี้';
      remove.textContent = '×';
      row.append(button, remove);
      listEl.appendChild(row);
    });
  }

  formEl.addEventListener('submit', function (event) {
    event.preventDefault();
    var title = inputEl.value.trim().slice(0, 80);
    if (!title) { inputEl.focus(); return; }
    var today = dayKey(new Date());
    var tasks = loadCustomTasks(today);
    tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), title: title, done: false });
    if (!saveCustomTasks(today, tasks)) {
      inputEl.setCustomValidity('บันทึกไม่ได้ กรุณาตรวจพื้นที่จัดเก็บในเบราว์เซอร์');
      inputEl.reportValidity();
      return;
    }
    inputEl.setCustomValidity('');
    inputEl.value = '';
    render();
    inputEl.focus();
  });
  inputEl.addEventListener('input', function () { inputEl.setCustomValidity(''); });

  listEl.addEventListener('click', function (event) {
    var removeButton = event.target.closest('[data-cover-delete]');
    if (removeButton) {
      var today = dayKey(new Date());
      var kept = loadCustomTasks(today).filter(function (task) { return task.id !== removeButton.dataset.coverDelete; });
      saveCustomTasks(today, kept);
      render();
      return;
    }
    var dismissButton = event.target.closest('[data-cover-dismiss]');
    if (dismissButton) {
      var dismissToday = dayKey(new Date());
      var dismissed = loadDismissedTasks(dismissToday);
      if (dismissed.indexOf(dismissButton.dataset.coverDismiss) === -1) dismissed.push(dismissButton.dataset.coverDismiss);
      saveDismissedTasks(dismissToday, dismissed);
      render();
      return;
    }
    var customButton = event.target.closest('[data-cover-custom-id]');
    if (!customButton) return;
    var currentDay = dayKey(new Date());
    var tasks = loadCustomTasks(currentDay);
    tasks.forEach(function (task) {
      if (task.id === customButton.dataset.coverCustomId) task.done = !task.done;
    });
    saveCustomTasks(currentDay, tasks);
    render();
  });

  render();
  window.addEventListener('et1os:updated', render);
  window.setInterval(render, 60000);
})();
