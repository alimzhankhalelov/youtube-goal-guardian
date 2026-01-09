const translations = {
  ru: {
    goals_label: 'Мои Цели',
    goals_placeholder: 'Например: \n• Выучить React\n• Подготовиться к марафону',
    api_label: 'Gemini API Key',
    api_placeholder: 'Введите ключ AIzaSy...',
    api_hint: 'Ключ хранится локально',
    api_help_title: 'Как получить API Key:',
    api_step1: 'Перейдите на aistudio.google.com/apikey',
    api_step2: 'Войдите в Google аккаунт',
    api_step3: 'Нажмите "Create API Key"',
    api_step4: 'Скопируйте ключ и вставьте сюда',
    api_free: '✓ Бесплатно до 1500 запросов/день',
    btn_save: 'Сохранить',
    status_saved: 'Настройки сохранены!',
    schedule_label: 'Время работы',
    schedule_help_title: 'Расписание работы:',
    schedule_help_desc: 'Укажите временной промежуток, когда блокер будет активен. Вне этого времени видео не будут проверяться.',
    schedule_help_note: '✓ Оставьте пустым для работы 24/7',
    time_from: 'С',
    time_to: 'До',
    schedule_enabled: 'Включить расписание'
  },
  en: {
    goals_label: 'My Goals',
    goals_placeholder: 'For example: \n• Learn React\n• Prepare for marathon',
    api_label: 'Gemini API Key',
    api_placeholder: 'Enter key AIzaSy...',
    api_hint: 'Key stored locally',
    api_help_title: 'How to get API Key:',
    api_step1: 'Go to aistudio.google.com/apikey',
    api_step2: 'Sign in with Google account',
    api_step3: 'Click "Create API Key"',
    api_step4: 'Copy the key and paste here',
    api_free: '✓ Free up to 1500 requests/day',
    btn_save: 'Save',
    status_saved: 'Settings saved!',
    schedule_label: 'Active Hours',
    schedule_help_title: 'Schedule Settings:',
    schedule_help_desc: 'Set the time range when the blocker will be active. Videos will not be checked outside this time.',
    schedule_help_note: '✓ Leave empty for 24/7 operation',
    time_from: 'From',
    time_to: 'To',
    schedule_enabled: 'Enable schedule'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const enableProtection = document.getElementById('enableProtection');
  const goalsInput = document.getElementById('goals');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('status');
  const langSelect = document.getElementById('langSelect');
  const scheduleFrom = document.getElementById('scheduleFrom');
  const scheduleTo = document.getElementById('scheduleTo');
  const scheduleEnabled = document.getElementById('scheduleEnabled');

  // Load Settings
  chrome.storage.sync.get(['goals', 'apiKey', 'protectionEnabled', 'language', 'scheduleFrom', 'scheduleTo', 'scheduleEnabled'], (result) => {
    if (result.goals) goalsInput.value = result.goals;
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    enableProtection.checked = result.protectionEnabled !== false;

    // Load schedule settings
    if (result.scheduleFrom) scheduleFrom.value = result.scheduleFrom;
    if (result.scheduleTo) scheduleTo.value = result.scheduleTo;
    scheduleEnabled.checked = result.scheduleEnabled === true;
    updateScheduleInputsState();

    const currentLang = result.language || 'ru';
    langSelect.value = currentLang;
    applyLanguage(currentLang);
  });

  // Save Logic
  saveBtn.addEventListener('click', () => {
    const goals = goalsInput.value;
    const apiKey = apiKeyInput.value.trim();
    const protectionEnabled = enableProtection.checked;
    const lang = langSelect.value;

    chrome.storage.sync.set({
      goals,
      apiKey,
      protectionEnabled,
      language: lang,
      scheduleFrom: scheduleFrom.value,
      scheduleTo: scheduleTo.value,
      scheduleEnabled: scheduleEnabled.checked
    }, () => {
      const t = translations[lang] || translations['ru'];
      showStatus(t.status_saved);
      sendMessageToTabs({ action: 'UPDATE_LANGUAGE', language: lang });
    });
  });

  // Language Change
  langSelect.addEventListener('change', (e) => {
    const lang = e.target.value;
    applyLanguage(lang);
    chrome.storage.sync.set({ language: lang });
    sendMessageToTabs({ action: 'UPDATE_LANGUAGE', language: lang });
  });

  // Protection Toggle
  enableProtection.addEventListener('change', () => {
    chrome.storage.sync.set({ protectionEnabled: enableProtection.checked });
  });

  // Schedule Toggle
  scheduleEnabled.addEventListener('change', () => {
    updateScheduleInputsState();
  });

  function updateScheduleInputsState() {
    const isEnabled = scheduleEnabled.checked;
    scheduleFrom.disabled = !isEnabled;
    scheduleTo.disabled = !isEnabled;
    scheduleFrom.style.opacity = isEnabled ? '1' : '0.5';
    scheduleTo.style.opacity = isEnabled ? '1' : '0.5';
  }

  function applyLanguage(lang) {
    const t = translations[lang] || translations['ru'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
    });

    if (t.goals_placeholder) goalsInput.placeholder = t.goals_placeholder;
    if (t.api_placeholder) apiKeyInput.placeholder = t.api_placeholder;
  }

  function sendMessageToTabs(message) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) chrome.tabs.sendMessage(tab.id, message).catch(() => { });
      });
    });
  }

  function showStatus(text) {
    statusMsg.textContent = text;
    statusMsg.classList.add('visible');
    setTimeout(() => statusMsg.classList.remove('visible'), 2000);
  }
});
