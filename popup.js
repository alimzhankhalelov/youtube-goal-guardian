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
    status_saved: 'Настройки сохранены!'
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
    status_saved: 'Settings saved!'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const enableProtection = document.getElementById('enableProtection');
  const goalsInput = document.getElementById('goals');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('status');
  const langSelect = document.getElementById('langSelect');

  // Load Settings
  chrome.storage.sync.get(['goals', 'apiKey', 'protectionEnabled', 'language'], (result) => {
    if (result.goals) goalsInput.value = result.goals;
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    enableProtection.checked = result.protectionEnabled !== false;

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
      goals, apiKey, protectionEnabled, language: lang
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
