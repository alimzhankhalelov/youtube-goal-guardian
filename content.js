// Goal Guardian - Content Script для YouTube

(function () {
    'use strict';

    console.log('🎯 Goal Guardian: Loaded (v3.0 Stable)');

    let currentVideoId = null;
    let isChecking = false;
    let overlay = null;
    let currentLanguage = 'en';

    // === LOCALIZATION ===
    let timerDuration = 10; // Default timer seconds

    const translations = {
        ru: {
            checking: 'АНАЛИЗИРУЮ...',
            title_match: 'НЕСООТВЕТСТВИЕ ЦЕЛИ',
            ai_says: '🤖 ИИ считает:',
            placeholder: 'Как это видео поможет вашей цели?',
            btn_open: 'ОТКРЫТЬ',
            btn_skip: 'Всё равно смотреть',
            timer_prefix: 'Пропуск через',
            timer_suffix: 'с',
            success_title: 'ПРИЯТНОГО ПРОСМОТРА',
            error_api: 'Сбой подключения',
            error_parse: 'Ошибка ответа AI',
            try_again: 'ПОВТОРИТЬ',
            justification_empty: 'Введите обоснование',
            tired_title: 'ВАМ ПОВЕЗЛО!',
            tired_msg: 'AI временно недоступен. Пропускаю.'
        },
        en: {
            checking: 'ANALYZING...',
            title_match: 'GOAL MISMATCH',
            ai_says: '🤖 AI thinks:',
            placeholder: 'How does this video help your goal?',
            btn_open: 'OPEN',
            btn_skip: 'Watch anyway',
            timer_prefix: 'Skip in',
            timer_suffix: 's',
            success_title: 'ENJOY WATCHING',
            error_api: 'Connection Error',
            error_parse: 'AI Response Error',
            try_again: 'RETRY',
            justification_empty: 'Enter justification',
            tired_title: 'LUCKY YOU!',
            tired_msg: 'AI is temporarily unavailable. Letting you pass.'
        }
    };

    function getLang() {
        return translations[currentLanguage];
    }

    function detectLanguage() {
        chrome.storage.sync.get(['language'], (result) => {
            if (result.language) {
                currentLanguage = result.language;
            } else {
                const browserLang = navigator.language || navigator.userLanguage;
                if (browserLang && browserLang.toLowerCase().includes('ru')) {
                    currentLanguage = 'ru';
                } else {
                    currentLanguage = 'en';
                }
            }
        });
    }

    function setLanguage(lang) {
        currentLanguage = lang;
        // storage save is usually done by popup, but we can sync just in case
        // chrome.storage.sync.set({ language: lang }); // Popup does this
        if (overlay) updateOverlayTexts();
    }

    // Слушаем сообщения от popup (смена языка)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'UPDATE_LANGUAGE' && request.language) {
            console.log('🎯 Language updated to:', request.language);
            setLanguage(request.language);
        }
        sendResponse({ received: true });
    });

    // === HELPERS ===

    function getVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function cleanAndParseJSON(text) {
        if (!text) return null;
        try {
            let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const match = clean.match(/\{[\s\S]*\}/);
            if (match) clean = match[0];
            return JSON.parse(clean);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            return null;
        }
    }

    function getVideoContainer() {
        const selectors = ['#movie_player', '#player-container', '.html5-video-player'];
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                if (window.getComputedStyle(el).position === 'static') {
                    el.style.position = 'relative';
                }
                return el;
            }
        }
        return null;
    }

    function checkKeywords(title, goals) {
        if (!title || !goals) return false;
        const titleLower = title.toLowerCase();
        const keywords = goals.toLowerCase().split(/[\s,.;]+/).filter(w => w.length > 3);
        for (const word of keywords) {
            if (titleLower.includes(word)) {
                return true;
            }
        }
        return false;
    }

    // === OVERLAY UI ===

    function createOverlay(videoTitle, aiReason = '', isLoading = false) {
        removeOverlay();
        const videoContainer = getVideoContainer();
        if (!videoContainer) return;

        detectLanguage();
        const t = getLang();

        overlay = document.createElement('div');
        overlay.id = 'goal-guardian-overlay';

        // Язык теперь меняется в Popup, здесь только применяем
        // (Убрали DOM переключатель)

        const centerDiv = document.createElement('div');
        centerDiv.className = 'goal-guardian-center';
        overlay.appendChild(centerDiv);

        if (isLoading) {
            centerDiv.innerHTML = `
                <div class="goal-guardian-spinner"></div>
                <div class="goal-guardian-title" style="font-size: 18px; font-weight: 500;">${t.checking}</div>
            `;
        } else {
            // Show AI reason why video doesn't match goals
            const aiReasonHtml = aiReason ? `
                <div class="goal-guardian-ai-reason">
                    <span class="ai-label">${t.ai_says}</span>
                    <span class="ai-text">${escapeHtml(aiReason)}</span>
                </div>` : '';
            centerDiv.innerHTML = `
                <div class="goal-guardian-icon">⛔</div>
                <h1 class="goal-guardian-title" data-i18n="title_match">${t.title_match}</h1>
                <div class="goal-guardian-video-title">${escapeHtml(videoTitle)}</div>
                ${aiReasonHtml}
                <div class="goal-guardian-input-group">
                    <input type="text" class="goal-guardian-input" placeholder="${t.placeholder}" id="gg-input" autocomplete="off">
                    <button class="goal-guardian-submit-btn" id="gg-submit" data-i18n="btn_open">${t.btn_open}</button>
                </div>
                <div class="goal-guardian-footer">
                    <div class="goal-guardian-timer" id="gg-timer">
                        <span data-i18n="timer_prefix">${t.timer_prefix}</span> <span id="gg-countdown">${timerDuration}</span><span data-i18n="timer_suffix">${t.timer_suffix}</span>
                    </div>
                    <button class="goal-guardian-skip-btn" id="gg-skip" data-i18n="btn_skip">${t.btn_skip}</button>
                </div>
            `;
        }

        videoContainer.appendChild(overlay);

        // setupLangEvent() removed
        if (!isLoading) {
            setupInteractionEvents(videoTitle);
            startTimer();
        }
        pauseVideo();
    }

    function showTiredBanner() {
        if (overlay) removeOverlay();
        const videoContainer = getVideoContainer();
        if (!videoContainer) return;
        detectLanguage();
        const t = getLang();
        overlay = document.createElement('div');
        overlay.id = 'goal-guardian-overlay';
        overlay.classList.add('gg-tired-mode');
        overlay.innerHTML = `
            <div class="goal-guardian-center">
                <div class="goal-guardian-icon">😴</div>
                <h1 class="goal-guardian-title" style="color: #60a5fa">${t.tired_title}</h1>
                <p style="color: #cbd5e1; font-size: 16px;">${t.tired_msg}</p>
                <div class="goal-guardian-timer" style="margin-top:20px;">Release in 3s...</div>
            </div>
        `;
        videoContainer.appendChild(overlay);
        pauseVideo();
        setTimeout(() => { removeOverlay(); resumeVideo(); }, 3000);
    }

    // setupLangEvent removed

    function updateOverlayTexts() {
        if (!overlay) return;
        const t = getLang();
        overlay.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.textContent = t[key];
        });
        const input = document.getElementById('gg-input');
        if (input) input.placeholder = t.placeholder;
    }

    function setupInteractionEvents(videoTitle) {
        const input = document.getElementById('gg-input');
        const submitBtn = document.getElementById('gg-submit');
        const skipBtn = document.getElementById('gg-skip');

        // Блокируем всплытие клавиатурных событий, чтобы YouTube не перехватывал hotkeys
        if (input) {
            input.addEventListener('keydown', (e) => e.stopPropagation());
            input.addEventListener('keyup', (e) => e.stopPropagation());
            input.addEventListener('keypress', (e) => e.stopPropagation());
        }

        if (submitBtn && input) {
            const submitHandler = async () => {
                const text = input.value.trim();
                if (!text) return;
                submitBtn.disabled = true;
                submitBtn.textContent = '...';
                const result = await checkJustification(videoTitle, text);
                if (result.allowed) showSuccess();
                else {
                    submitBtn.disabled = false;
                    const t = getLang();
                    submitBtn.textContent = t.try_again;
                    input.value = '';
                    input.placeholder = result.message || t.error_parse;
                    input.focus();
                }
            };
            submitBtn.addEventListener('click', submitHandler);
            input.addEventListener('keypress', (e) => {
                e.stopPropagation(); // extra safety
                if (e.key === 'Enter') submitHandler();
            });
        }
        if (skipBtn) skipBtn.addEventListener('click', () => { removeOverlay(); resumeVideo(); });
    }

    function startTimer() {
        let count = timerDuration;
        const countEl = document.getElementById('gg-countdown');
        const timerEl = document.getElementById('gg-timer');
        const skipBtn = document.getElementById('gg-skip');
        const interval = setInterval(() => {
            count--;
            if (countEl) countEl.textContent = count;
            if (count <= 0) {
                clearInterval(interval);
                if (timerEl) timerEl.style.display = 'none';
                if (skipBtn) skipBtn.classList.add('visible');
            }
        }, 1000);
    }

    function showSuccess() {
        const t = getLang();
        const center = overlay.querySelector('.goal-guardian-center');
        if (center) {
            center.innerHTML = `
                <div class="goal-guardian-icon" style="opacity:1">✅</div>
                <h1 class="goal-guardian-title" style="color:#4ade80">${t.success_title}</h1>
            `;
        }
        setTimeout(() => { removeOverlay(); resumeVideo(); }, 1200);
    }

    function removeOverlay() { if (overlay) { overlay.remove(); overlay = null; } }
    function pauseVideo() { const v = document.querySelector('video'); if (v) v.pause(); }
    function resumeVideo() { const v = document.querySelector('video'); if (v) v.play(); }

    // === AI LOGIC (CLOUD ONLY) ===

    async function checkWithAI(videoTitle, goals) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['apiKey'], async (result) => {
                // Если API ключа нет - сразу fail-open
                if (!result.apiKey) { resolve({ tiredMode: true }); return; }

                try {
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${result.apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{
                                        text: `ROLE: Strict productivity assistant.
GOALS: ${goals}
VIDEO: "${videoTitle}"
INSTRUCTION: Check if video DIRECTLY helps goals. Block entertainment/news.
OUTPUT JSON ONLY: {"allowed": true/false, "reason": "short text"}` }]
                                }],
                                generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
                            })
                        }
                    );

                    if (!response.ok) {
                        console.error('API Error:', response.status);
                        // Fallback: Ключевые слова
                        if (checkKeywords(videoTitle, goals)) resolve({ allowed: true });
                        else resolve({ tiredMode: true });
                        return;
                    }

                    const data = await response.json();
                    const parsed = cleanAndParseJSON(data.candidates?.[0]?.content?.parts?.[0]?.text);
                    if (parsed) resolve(parsed);
                    else resolve({ tiredMode: true });
                } catch (error) {
                    console.error('Net Error:', error);
                    resolve({ tiredMode: true });
                }
            });
        });
    }

    async function checkJustification(videoTitle, justification) {
        return new Promise(resolve => {
            chrome.storage.sync.get(['apiKey', 'goals'], async (result) => {
                if (!result.apiKey) {
                    console.log('🎯 No API key -> allowing justification');
                    resolve({ allowed: true });
                    return;
                }

                try {
                    console.log('🎯 Checking justification:', justification);
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${result.apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{
                                        text: `USER GOALS: ${result.goals}
VIDEO TITLE: "${videoTitle}"
USER JUSTIFICATION: "${justification}"

TASK: Check if the user's justification is reasonable. Be lenient - if user makes any reasonable argument, allow it.
OUTPUT JSON ONLY: {"allowed": true/false}` }]
                                }],
                                generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
                            })
                        }
                    );

                    console.log('🎯 Justification API status:', response.status);

                    if (!response.ok) {
                        console.log('🎯 API error -> allowing (fail-open)');
                        resolve({ allowed: true });
                        return;
                    }

                    const data = await response.json();
                    console.log('🎯 Justification response:', JSON.stringify(data));

                    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    const parsed = cleanAndParseJSON(aiText);

                    if (parsed) {
                        console.log('🎯 Parsed result:', parsed);
                        resolve(parsed);
                    } else {
                        console.log('🎯 Parse failed -> allowing (fail-open)');
                        resolve({ allowed: true });
                    }
                } catch (e) {
                    console.error('🎯 Justification error:', e);
                    resolve({ allowed: true });
                }
            });
        });
    }

    // === INIT ===

    async function waitForTitle() {
        return new Promise(resolve => {
            let i = 0;
            const int = setInterval(() => {
                const title = document.title.replace(' - YouTube', '').trim();
                if (title && title !== 'YouTube' && !title.includes('Loading')) {
                    clearInterval(int); resolve(title);
                }
                if (i++ > 20) { clearInterval(int); resolve(null); }
            }, 250);
        });
    }

    // === SCHEDULE CHECK ===
    function isWithinSchedule(scheduleFrom, scheduleTo) {
        if (!scheduleFrom || !scheduleTo) return true; // No schedule set - always active

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [fromHours, fromMinutes] = scheduleFrom.split(':').map(Number);
        const [toHours, toMinutes] = scheduleTo.split(':').map(Number);

        const fromTotalMinutes = fromHours * 60 + fromMinutes;
        const toTotalMinutes = toHours * 60 + toMinutes;

        // Handle overnight schedule (e.g., 22:00 - 06:00)
        if (fromTotalMinutes > toTotalMinutes) {
            return currentMinutes >= fromTotalMinutes || currentMinutes <= toTotalMinutes;
        }

        return currentMinutes >= fromTotalMinutes && currentMinutes <= toTotalMinutes;
    }

    async function checkVideo() {
        const videoId = getVideoId();
        if (!videoId || videoId === currentVideoId || isChecking) return;
        detectLanguage();
        currentVideoId = videoId;
        isChecking = true;

        chrome.storage.sync.get(['protectionEnabled', 'goals', 'apiKey', 'scheduleEnabled', 'scheduleFrom', 'scheduleTo', 'timerDuration'], async (data) => {
            if (data.protectionEnabled === false || !data.goals) { isChecking = false; return; }

            // Load timer duration from settings (default 10s)
            timerDuration = data.timerDuration || 10;

            // Проверка расписания
            if (data.scheduleEnabled) {
                if (!isWithinSchedule(data.scheduleFrom, data.scheduleTo)) {
                    console.log('🎯 Goal Guardian: Outside scheduled hours - skipping check');
                    isChecking = false;
                    return;
                }
            }

            const title = await waitForTitle();
            if (!title) { isChecking = false; return; }

            // Проверка в фоне, без лоадера
            const result = await checkWithAI(title, data.goals);

            if (result.allowed) {
                // Всё ок, ничего не показываем
            } else if (result.tiredMode) {
                showTiredBanner();
            } else {
                // Показываем баннер блокировки с причиной от AI
                createOverlay(title, result.reason || '', false);
            }
            isChecking = false;
        });
    }

    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            currentVideoId = null;
            removeOverlay();
            if (location.pathname === '/watch') setTimeout(checkVideo, 1000);
        }
    }).observe(document.body, { subtree: true, childList: true });

    if (location.pathname === '/watch') setTimeout(checkVideo, 1000);

})();
