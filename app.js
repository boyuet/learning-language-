/* ==========================================================================
   STUDYMANHHA CLEAN MULTI-LAYERED APP LOGIC (SMART SRS QUEUE & COMPACT UI)
   ========================================================================== */

let allWords = [];
let baseWordsMap = {}; // id -> original base word clone for reset
let userProgress = {
  status: {},      // wordId -> 'new' | 'learning' | 'mastered'
  starred: {},     // wordId -> boolean
  reviews: {},     // wordId -> timestamp
  records: {},     // gameType -> best score or best time
  customWords: [], // array of user-added words
  editedWords: {}, // wordId -> overridden fields object
  deletedIds: {}   // wordId -> true (if user deleted a word)
};

let activeTopicGroup = 'daily'; // 'daily' | 'master' | 'my_vocab'
let dailyPart = 'nghe';         // 'nghe' (Day 1-10) | 'doc' (Day 11-26)
let currentSubCategory = '';
let currentLessonWords = [];
let filteredLessonWords = [];
let currentFilterStatus = 'all';
let currentMode = 'xem_tu';     // 'xem_tu' | 'hoc' | 'choi'
let sfxEnabled = true;

// Flashcard Deck State
let currentFcIndex = 0;
let currentFlashcard = null;
let isFlipped = false;

// Guided Batch Study State ('hoc' mode)
let batchState = {
  active: false,
  words: [],
  stepIndex: 0,
  phase: 'preview', // 'preview' -> 'mcq' -> 'typing' -> 'done'
  batchSize: 5,
  hintLevel: 0
};

// Game Engine State ('choi' mode) with Strategic Spaced-Repetition Queue
let gameState = {
  inGame: false,
  type: 'mcq',        // 'listen_choice' | 'matching' | 'mcq' | 'typing' | 'listen_type'
  direction: 'en_vi', // 'en_vi' | 'vi_en' | 'mixed' | 'cloze' | 'listen_vi' | 'listen_en' | 'en_only' | 'with_meaning'
  score: 0,
  streak: 0,
  currentWord: null,
  lastWordId: null,
  actualDir: 'en_vi',
  answered: false,
  hintLevel: 0,
  // Smart Spaced Queue
  queue: [],
  completedInCycle: 0,
  // Matching game state
  matchTiles: [],
  selectedTileIdx: null,
  matchedIds: new Set(),
  matchStartTime: 0
};

let currentReviewTab = 'due';
let reviewWordsList = [];

const STORAGE_KEY = 'studymanhha_vocab_progress_v1';

// Enlarged Crisp Vector SVG Icons
const ICONS = {
  speaker: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  speakerSm: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  star: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  cap: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  bolt: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  xMark: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  arrowRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  swap: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>`,
  refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  trophy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
  flame: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2c1.5 3.5 4 6 4 10a6 6 0 1 1-12 0c0-2.5 1.2-5 3-7 0 2 1.5 3 2.5 3C9.5 6 10.5 3.5 12 2z"/></svg>`,
  edit: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  chevronRight: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  miniStar: `<svg class="w-star-icon WORD_STAR_CLS" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
};

// ==========================================================================
// WEB AUDIO SYNTHESIZER (CLEAR AUDIBLE CORRECT CHIME & WRONG BUZZER)
// ==========================================================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function toggleSoundEffects() {
  sfxEnabled = !sfxEnabled;
  const btn = document.getElementById('sfxToggleBtn');
  const iconOn = document.getElementById('sfxIconOn');
  const iconOff = document.getElementById('sfxIconOff');
  if (btn) btn.classList.toggle('active', sfxEnabled);
  if (iconOn) iconOn.style.display = sfxEnabled ? 'block' : 'none';
  if (iconOff) iconOff.style.display = sfxEnabled ? 'none' : 'block';
  if (sfxEnabled) playSfx('correct');
}

function playSfx(type) {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'correct') {
      // Bright, rewarding 3-note ascending chime (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.001, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.05 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.27);
      });
    } else if (type === 'wrong') {
      // Clear, unmistakable dual-tone error buzzer (Sawtooth + Triangle 185Hz -> 138Hz)
      const freqs = [185, 138.59];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.11);
        gain.gain.setValueAtTime(0.16, now + i * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.19);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.11);
        osc.stop(now + i * 0.11 + 0.21);
      });
    } else if (type === 'flip') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    }
  } catch (e) {}
}

function triggerStageCardEffect(isCorrect) {
  const card = document.getElementById('gameStageCard');
  if (!card) return;
  card.classList.remove('card-celebrate', 'card-error-shake');
  void card.offsetWidth;
  card.classList.add(isCorrect ? 'card-celebrate' : 'card-error-shake');
  if (isCorrect) {
    fireConfetti(28);
  }
}

function fireConfetti(particleCount = 55) {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#15803d', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#10b981'];
  const particles = Array.from({ length: particleCount }, () => ({
    x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
    y: canvas.height * 0.42,
    vx: (Math.random() - 0.5) * 13,
    vy: -Math.random() * 12 - 3,
    size: Math.random() * 7 + 4.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    vrot: (Math.random() - 0.5) * 0.22,
    alpha: 1
  }));

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.42;
      p.vx *= 0.985;
      p.rot += p.vrot;
      if (frame > 26) p.alpha -= 0.03;
      if (p.alpha > 0 && p.y < canvas.height + 20) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      }
    });
    frame++;
    if (alive && frame < 95) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(animate);
}

// ==========================================================================
// 1. INITIALIZATION & STORAGE
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadDataAndState();
  initPWA();
  initKeyboardShortcuts();
  openHubScreen();
});

function loadDataAndState() {
  const rawBase = Array.isArray(window.VOCAB_DATA) ? window.VOCAB_DATA : [];
  baseWordsMap = {};
  rawBase.forEach(w => {
    baseWordsMap[w.id] = JSON.parse(JSON.stringify(w));
  });

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      userProgress.status = parsed.status || {};
      userProgress.starred = parsed.starred || {};
      userProgress.reviews = parsed.reviews || {};
      userProgress.records = parsed.records || {};
      userProgress.customWords = Array.isArray(parsed.customWords) ? parsed.customWords : [];
      userProgress.editedWords = parsed.editedWords || {};
      userProgress.deletedIds = parsed.deletedIds || {};
    }
  } catch (e) {}

  rebuildAllWordsList();
  updateGlobalBadges();
}

function rebuildAllWordsList() {
  const rawBase = Array.isArray(window.VOCAB_DATA) ? window.VOCAB_DATA : [];
  const merged = [];

  rawBase.forEach(w => {
    if (userProgress.deletedIds && userProgress.deletedIds[w.id]) return;
    const copy = JSON.parse(JSON.stringify(w));
    if (userProgress.editedWords && userProgress.editedWords[w.id]) {
      Object.assign(copy, userProgress.editedWords[w.id]);
    }
    merged.push(copy);
  });

  if (Array.isArray(userProgress.customWords)) {
    userProgress.customWords.forEach(cw => {
      if (userProgress.deletedIds && userProgress.deletedIds[cw.id]) return;
      const copy = JSON.parse(JSON.stringify(cw));
      if (userProgress.editedWords && userProgress.editedWords[cw.id]) {
        Object.assign(copy, userProgress.editedWords[cw.id]);
      }
      merged.push(copy);
    });
  }

  allWords = merged;

  allWords.forEach(w => {
    if (!userProgress.status[w.id]) {
      userProgress.status[w.id] = 'new';
    }
  });
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
  } catch (e) {}
  updateGlobalBadges();
}

function updateGlobalBadges() {
  const learningCount = allWords.filter(w => userProgress.status[w.id] === 'learning').length;
  const starredCount = allWords.filter(w => userProgress.starred[w.id]).length;
  const masteredCount = allWords.filter(w => userProgress.status[w.id] === 'mastered').length;

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('revDueCount', learningCount);
  setTxt('revStarredCount', starredCount);
  setTxt('revMasteredCount', masteredCount);

  const dailyWords = allWords.filter(w => w.category && w.category.includes('Daily Vocab'));
  const dailyLearned = dailyWords.filter(w => userProgress.status[w.id] !== 'new').length;
  const dailyPct = dailyWords.length ? Math.round((dailyLearned / dailyWords.length) * 100) : 0;
  const dBar = document.getElementById('hubDailyBar');
  if (dBar) dBar.style.width = `${dailyPct}%`;
  setTxt('hubDailyStat', `Đã học ${dailyLearned} / ${dailyWords.length}`);

  const masterWords = allWords.filter(w => w.category && w.category.includes('Master Vocab'));
  const masterLearned = masterWords.filter(w => userProgress.status[w.id] !== 'new').length;
  const masterPct = masterWords.length ? Math.round((masterLearned / masterWords.length) * 100) : 0;
  const mBar = document.getElementById('hubMasterBar');
  if (mBar) mBar.style.width = `${masterPct}%`;
  setTxt('hubMasterStat', `Đã học ${masterLearned} / ${masterWords.length}`);

  const myWords = allWords.filter(w => w.category === 'Từ vựng của tôi');
  const myLearned = myWords.filter(w => userProgress.status[w.id] !== 'new').length;
  const myPct = myWords.length ? Math.round((myLearned / myWords.length) * 100) : 0;
  const myBar = document.getElementById('hubMyBar');
  if (myBar) myBar.style.width = `${myPct}%`;
  setTxt('hubMyStat', `Đã học ${myLearned} / ${myWords.length}`);

  setTxt('hubReviewBadge', `${learningCount} từ cần ôn`);
  setTxt('hubMasteredSummary', `Đã thành thạo: ${masteredCount} từ · Đã gắn sao: ${starredCount} từ`);
}

// ==========================================================================
// 2. MULTI-LAYER SCREEN ROUTING
// ==========================================================================
function setActiveScreen(screenId) {
  document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openHubScreen() {
  updateGlobalBadges();
  setActiveScreen('screen-hub');
}

function openTopicListScreen(groupType) {
  activeTopicGroup = groupType;
  setActiveScreen('screen-topics');

  const titleEl = document.getElementById('topicsScreenTitle');
  const subEl = document.getElementById('topicsScreenSub');
  const partSwitcher = document.getElementById('dailyPartSwitcher');

  if (groupType === 'daily') {
    titleEl.textContent = 'Daily Vocab';
    subEl.textContent = 'Lộ trình 26 ngày · 52 buổi · 1.284 từ vựng TOEIC';
    partSwitcher.style.display = 'inline-flex';
    renderDailyTopicsGrid(dailyPart);
  } else if (groupType === 'master') {
    titleEl.textContent = 'Master Vocab';
    subEl.textContent = '30 chủ điểm TOEIC trọng tâm · 1.073 từ vựng';
    partSwitcher.style.display = 'none';
    renderMasterTopicsGrid();
  }
}

function switchDailyPart(part) {
  dailyPart = part;
  document.getElementById('btnPartNghe').classList.toggle('active', part === 'nghe');
  document.getElementById('btnPartDoc').classList.toggle('active', part === 'doc');
  renderDailyTopicsGrid(part);
}

function renderDailyTopicsGrid(part) {
  const container = document.getElementById('topicsGridContainer');
  container.innerHTML = '';

  const catName = part === 'nghe' ? 'Daily Vocab (Phần Nghe)' : 'Daily Vocab (Phần Đọc)';
  const words = allWords.filter(w => w.category === catName && w.sub_category);
  const subCats = Array.from(new Set(words.map(w => w.sub_category))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  subCats.forEach(sc => {
    const lessonWords = words.filter(w => w.sub_category === sc);
    const learned = lessonWords.filter(w => userProgress.status[w.id] !== 'new').length;
    const total = lessonWords.length;
    const pct = total ? Math.round((learned / total) * 100) : 0;

    const parts = sc.split('·').map(s => s.trim());
    const dayTag = parts[0] || 'Daily';

    const card = document.createElement('div');
    card.className = 'topic-select-card';
    card.onclick = () => openLessonScreen('daily', sc);
    card.innerHTML = `
      <div class="tsc-top">
        <div>
          <span class="tsc-num">${escapeHtml(dayTag)}</span>
          <div class="tsc-title">${escapeHtml(sc)}</div>
        </div>
        <span class="tsc-count">${total} từ</span>
      </div>
      <div class="tsc-progress-row">
        <div class="tsc-bar"><div class="tsc-fill" style="width:${pct}%"></div></div>
        <span class="tsc-stat">Đã học ${learned}/${total}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderMasterTopicsGrid() {
  const container = document.getElementById('topicsGridContainer');
  container.innerHTML = '';

  const words = allWords.filter(w => w.category && w.category.includes('Master Vocab'));
  const subCats = Array.from(new Set(words.map(w => w.sub_category).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  subCats.forEach((sc, idx) => {
    const lessonWords = words.filter(w => w.sub_category === sc);
    const learned = lessonWords.filter(w => userProgress.status[w.id] !== 'new').length;
    const total = lessonWords.length;
    const pct = total ? Math.round((learned / total) * 100) : 0;

    const numMatch = sc.match(/^(\d+)\.\s*(.*)/);
    const numStr = numMatch ? `Chủ điểm ${numMatch[1]}` : `Chủ điểm ${idx + 1}`;
    const cleanTitle = numMatch ? numMatch[2] : sc;

    const card = document.createElement('div');
    card.className = 'topic-select-card';
    card.onclick = () => openLessonScreen('master', sc);
    card.innerHTML = `
      <div class="tsc-top">
        <div>
          <span class="tsc-num">${escapeHtml(numStr)}</span>
          <div class="tsc-title">${escapeHtml(cleanTitle)}</div>
        </div>
        <span class="tsc-count">${total} từ</span>
      </div>
      <div class="tsc-progress-row">
        <div class="tsc-bar"><div class="tsc-fill" style="width:${pct}%"></div></div>
        <span class="tsc-stat">Đã học ${learned}/${total}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function openLessonScreen(groupType, subcatName) {
  activeTopicGroup = groupType;
  currentSubCategory = subcatName;
  currentFilterStatus = 'all';
  batchState.active = false;
  gameState.inGame = false;

  if (groupType === 'my_vocab') {
    currentLessonWords = allWords.filter(w => w.category === 'Từ vựng của tôi');
    document.getElementById('lessonKickerText').textContent = 'Trang chủ Từ vựng';
  } else if (groupType === 'daily') {
    currentLessonWords = allWords.filter(w => w.sub_category === subcatName);
    document.getElementById('lessonKickerText').textContent = 'Daily Vocab';
  } else if (groupType === 'master') {
    currentLessonWords = allWords.filter(w => w.sub_category === subcatName);
    document.getElementById('lessonKickerText').textContent = 'Master Vocab';
  }

  const cleanTitle = subcatName.replace(/^\d+\.\s*/, '');
  document.getElementById('lessonTitle').textContent = cleanTitle;
  document.getElementById('lessonWordCount').textContent = `${currentLessonWords.length} từ`;
  document.getElementById('listTotalCount').textContent = currentLessonWords.length;

  currentFcIndex = 0;
  setActiveScreen('screen-lesson');
  switchMode('xem_tu');
}

function goBackFromLesson() {
  if (activeTopicGroup === 'daily' || activeTopicGroup === 'master') {
    openTopicListScreen(activeTopicGroup);
  } else if (activeTopicGroup === 'review') {
    openReviewScreen();
  } else {
    openHubScreen();
  }
}

function openReviewScreen() {
  setActiveScreen('screen-review');
  loadReviewTab(currentReviewTab);
}

// ==========================================================================
// 3. MODE SWITCHER INSIDE LESSON SCREEN (Xem từ / Học / Chơi)
// ==========================================================================
function switchMode(modeName) {
  currentMode = modeName;
  document.querySelectorAll('.mode-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === modeName);
  });
  document.querySelectorAll('.mode-panel').forEach(p => {
    p.classList.remove('active');
  });
  document.getElementById(`mode-${modeName}`).classList.add('active');

  if (modeName === 'xem_tu') {
    loadFlashcard(currentFcIndex);
    renderWordList();
  } else if (modeName === 'hoc') {
    renderStudyPanel();
  } else if (modeName === 'choi') {
    backToGameMenu();
  }
}

// ==========================================================================
// 4. MODE 1: XEM TỪ (FLASHCARD + HIERARCHICAL WORD LIST)
// ==========================================================================
function loadFlashcard(index) {
  if (!currentLessonWords.length) return;
  if (index < 0) index = 0;
  if (index >= currentLessonWords.length) index = currentLessonWords.length - 1;

  currentFcIndex = index;
  currentFlashcard = currentLessonWords[index];
  isFlipped = false;
  syncFlashcardDOM();
}

function syncFlashcardDOM() {
  if (!currentFlashcard) return;

  const inner3d = document.getElementById('flipCardInner');
  if (inner3d) inner3d.classList.toggle('is-flipped', isFlipped);

  document.getElementById('fcProgressText').textContent = `Từ ${currentFcIndex + 1} / ${currentLessonWords.length}`;

  const st = userProgress.status[currentFlashcard.id] || 'new';
  const stTag = document.getElementById('fcStatusTag');
  if (stTag) {
    stTag.className = `status-tag ${st}`;
    stTag.textContent = st === 'mastered' ? 'Thành thạo' : (st === 'learning' ? 'Đang ôn' : 'Mới');
  }

  const starBtn = document.getElementById('fcStarBtn');
  if (starBtn) {
    starBtn.classList.toggle('starred', Boolean(userProgress.starred[currentFlashcard.id]));
  }

  // Front
  document.getElementById('fcFrontWord').textContent = currentFlashcard.word;
  const fPos = document.getElementById('fcFrontPos');
  fPos.textContent = currentFlashcard.pos || '';
  fPos.style.display = currentFlashcard.pos ? 'inline-block' : 'none';
  document.getElementById('fcFrontIpa').textContent = currentFlashcard.ipa || '';

  // Back (Meaning & Highlighted Example only, no redundant word header!)
  document.getElementById('fcBackMeaning').textContent = currentFlashcard.meaning;
  document.getElementById('fcBackEnEx').innerHTML = highlightWordInExample(currentFlashcard.en_example || '', currentFlashcard.word);
  document.getElementById('fcBackViEx').textContent = currentFlashcard.vi_example || '';

  const prevBtn = document.getElementById('btnPrevCard');
  const nextBtn = document.getElementById('btnNextCard');
  if (prevBtn) prevBtn.disabled = currentFcIndex === 0;
  if (nextBtn) nextBtn.disabled = currentFcIndex === currentLessonWords.length - 1;
}

function flipCurrentCard() {
  isFlipped = !isFlipped;
  playSfx('flip');
  syncFlashcardDOM();
}

function nextCard() {
  if (currentFcIndex < currentLessonWords.length - 1) {
    playSfx('flip');
    loadFlashcard(currentFcIndex + 1);
  }
}

function prevCard() {
  if (currentFcIndex > 0) {
    playSfx('flip');
    loadFlashcard(currentFcIndex - 1);
  }
}

function markCard(isMastered) {
  if (!currentFlashcard) return;
  userProgress.status[currentFlashcard.id] = isMastered ? 'mastered' : 'learning';
  userProgress.reviews[currentFlashcard.id] = Date.now();
  playSfx(isMastered ? 'correct' : 'flip');
  saveProgress();
  syncFlashcardDOM();
  renderWordList();

  if (currentFcIndex < currentLessonWords.length - 1) {
    setTimeout(() => nextCard(), 160);
  }
}

function toggleStarCurrentCard() {
  if (!currentFlashcard) return;
  userProgress.starred[currentFlashcard.id] = !userProgress.starred[currentFlashcard.id];
  playSfx('flip');
  saveProgress();
  syncFlashcardDOM();
  renderWordList();
}

function highlightWordInExample(sentence, word) {
  if (!sentence) return '';
  const safeSentence = escapeHtml(sentence);
  if (!word) return safeSentence;

  const cleanWord = word.trim();
  const irregulars = {
    'hold': ['held', 'holding', 'holds'],
    'buy': ['bought', 'buying', 'buys'],
    'lie': ['lying', 'lay', 'lain', 'lies'],
    'lay off': ['laid off', 'laying off', 'lays off'],
    'leave': ['left', 'leaving', 'leaves'],
    'seek': ['sought', 'seeking', 'seeks'],
    'run': ['running', 'ran', 'runs'],
    'withdraw': ['withdrawn', 'withdrew', 'withdrawing']
  };

  let patterns = [];
  const lowerW = cleanWord.toLowerCase();
  if (irregulars[lowerW]) {
    patterns.push(...irregulars[lowerW].map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  // Handle multi-word phrases (e.g., "turn on" -> "turning on", "turned on", "be seated" -> "seated")
  const tokens = cleanWord.split(/\s+/).filter(t => t.toLowerCase() !== 'be');
  tokens.forEach(tok => {
    let stem = tok;
    if (tok.length >= 4 && (tok.endsWith('e') || tok.endsWith('y'))) {
      stem = tok.slice(0, -1);
    }
    const esc = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    patterns.push(`${esc}[a-zA-Z']*`);
  });

  const combinedRegex = new RegExp(`\\b(${patterns.join('|')})\\b`, 'gi');
  return safeSentence.replace(combinedRegex, `<span class="hl-word">$1</span>`);
}

function filterByStatus(status) {
  currentFilterStatus = status;
  document.querySelectorAll('#mode-xem_tu .filter-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.status === status);
  });
  renderWordList();
}

function handleLessonSearch() {
  renderWordList();
}

function renderWordList() {
  const searchInput = document.getElementById('lessonSearchInput');
  const sortSelect = document.getElementById('lessonSortSelect');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const sortOrder = sortSelect ? sortSelect.value : 'default';

  filteredLessonWords = currentLessonWords.filter(w => {
    const st = userProgress.status[w.id] || 'new';
    const isStarred = Boolean(userProgress.starred[w.id]);

    let passStatus = false;
    if (currentFilterStatus === 'all') passStatus = true;
    else if (currentFilterStatus === 'starred') passStatus = isStarred;
    else if (currentFilterStatus === st) passStatus = true;

    if (!passStatus) return false;
    if (query) {
      return w.word.toLowerCase().includes(query) || w.meaning.toLowerCase().includes(query);
    }
    return true;
  });

  if (sortOrder === 'az') {
    filteredLessonWords = [...filteredLessonWords].sort((a, b) => a.word.localeCompare(b.word));
  }

  document.getElementById('count-all').textContent = currentLessonWords.length;
  document.getElementById('count-starred').textContent = currentLessonWords.filter(w => userProgress.starred[w.id]).length;
  document.getElementById('count-new').textContent = currentLessonWords.filter(w => (userProgress.status[w.id] || 'new') === 'new').length;
  document.getElementById('count-learning').textContent = currentLessonWords.filter(w => userProgress.status[w.id] === 'learning').length;
  document.getElementById('count-mastered').textContent = currentLessonWords.filter(w => userProgress.status[w.id] === 'mastered').length;

  const container = document.getElementById('wordCardList');
  container.innerHTML = '';

  if (!filteredLessonWords.length) {
    container.innerHTML = `<div class="empty-state-box">Không có từ vựng nào khớp với bộ lọc hiện tại.</div>`;
    return;
  }

  filteredLessonWords.forEach(w => {
    container.appendChild(createWordRowCard(w, false));
  });
}

function renderFrequencyStars(starsCount) {
  const count = Math.max(1, Math.min(3, Number(starsCount) || 2));
  let html = `<span class="w-stars" title="Mức độ phổ biến trong đề TOEIC: ${count}/3 sao">`;
  for (let i = 1; i <= 3; i++) {
    const cls = i <= count ? 'filled' : 'empty';
    html += ICONS.miniStar.replace('WORD_STAR_CLS', cls);
  }
  html += `</span>`;
  return html;
}

function formatSplitItem(rawStr, sepRegex, leftCls = 'xm-bold', rightCls = 'xm-muted') {
  const str = String(rawStr || '').trim();
  const match = str.match(sepRegex);
  if (!match) return `<div class="xm-item">${escapeHtml(str)}</div>`;
  const idx = match.index;
  const sep = match[0];
  const left = str.slice(0, idx).trim();
  const right = str.slice(idx + sep.length).trim();
  return `<div class="xm-item"><span class="${leftCls}">${escapeHtml(left)}</span>${escapeHtml(sep)}<span class="${rightCls}"> ${escapeHtml(right)}</span></div>`;
}

function buildXemThemSectionHtml(w) {
  const wf = Array.isArray(w.word_family) ? w.word_family.filter(Boolean) : [];
  const syn = Array.isArray(w.synonyms) ? w.synonyms.filter(Boolean) : [];
  const ant = Array.isArray(w.antonyms) ? w.antonyms.filter(Boolean) : [];
  const phr = Array.isArray(w.phrases) ? w.phrases.filter(Boolean) : [];
  const tips = Array.isArray(w.exam_tips) ? w.exam_tips.filter(Boolean) : [];
  const notes = Array.isArray(w.notes) ? w.notes.filter(Boolean) : [];
  const part = Array.isArray(w.part) ? w.part.filter(Boolean) : [];

  const availableLabels = [];
  if (wf.length) availableLabels.push('họ từ');
  if (syn.length) availableLabels.push('đồng nghĩa');
  if (ant.length) availableLabels.push('trái nghĩa');
  if (phr.length) availableLabels.push('cụm từ');
  if (tips.length) availableLabels.push('mẹo đề thi');
  if (notes.length) availableLabels.push('ghi chú');
  if (part.length) availableLabels.push('part');

  if (!availableLabels.length) return '';

  const summaryHint = `(${availableLabels.join(', ')})`;

  return `
    <div class="w-more-wrap">
      <button type="button" class="w-more-toggle" onclick="toggleXemThemPanel(${w.id}, this)">
        <span class="w-more-chevron">${ICONS.chevronRight}</span>
        <span class="w-more-action-txt">Xem thêm</span>
        <span class="w-more-hint-txt">${escapeHtml(summaryHint)}</span>
      </button>
      <div class="w-more-panel" id="xem-them-panel-${w.id}">
        ${wf.length ? `
          <div class="xm-section xm-hotu">
            <div class="xm-badge-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span>HỌ TỪ</span>
            </div>
            <div class="xm-items-box">
              ${wf.map(item => formatSplitItem(item, /\s*:\s*/, 'xm-bold-hotu', 'xm-muted-hotu')).join('')}
            </div>
          </div>
        ` : ''}

        ${syn.length ? `
          <div class="xm-section xm-dongnghia">
            <div class="xm-badge-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>
              <span>ĐỒNG NGHĨA</span>
            </div>
            <div class="xm-pill-cloud">
              ${syn.map(item => `<span class="xm-syn-pill">${escapeHtml(item)}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${ant.length ? `
          <div class="xm-section xm-trainghia">
            <div class="xm-badge-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              <span>TRÁI NGHĨA</span>
            </div>
            <div class="xm-pill-cloud">
              ${ant.map(item => `<span class="xm-ant-pill">${escapeHtml(item)}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${phr.length ? `
          <div class="xm-section xm-cumtu">
            <div class="xm-badge-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span>CỤM TỪ HAY GẶP</span>
            </div>
            <div class="xm-items-box">
              ${phr.map(item => formatSplitItem(item, /\s*(?:—|--|-)\s*/, 'xm-bold-cumtu', 'xm-muted-cumtu')).join('')}
            </div>
          </div>
        ` : ''}

        ${tips.length ? `
          <div class="xm-section xm-meothi">
            <div class="xm-badge-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>MẸO ĐỀ THI & BẪY TỪ</span>
            </div>
            <div class="xm-tip-content">
              ${tips.map(item => `<div class="xm-tip-p">${escapeHtml(item)}</div>`).join('')}
            </div>
          </div>
        ` : ''}

        ${notes.length ? `
          <div class="xm-section xm-ghichu">
            <div class="xm-badge-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>GHI CHÚ</span>
            </div>
            <div class="xm-note-content">
              ${notes.map(item => `<div class="xm-note-p">${escapeHtml(item)}</div>`).join('')}
            </div>
          </div>
        ` : ''}

        ${part.length ? `
          <div class="xm-section xm-part">
            <div class="xm-badge-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
              <span>PART XUẤT HIỆN</span>
            </div>
            <div class="xm-part-pills">
              ${part.map(p => `<span class="xm-part-chip">${escapeHtml(p)}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function toggleXemThemPanel(wordId, btnEl) {
  const panel = document.getElementById(`xem-them-panel-${wordId}`);
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  if (btnEl) {
    btnEl.classList.toggle('expanded', isOpen);
    const txtEl = btnEl.querySelector('.w-more-action-txt');
    if (txtEl) txtEl.textContent = isOpen ? 'Thu gọn' : 'Xem thêm';
  }
}

function createWordRowCard(w, isReviewScreen = false) {
  const st = userProgress.status[w.id] || 'new';
  const isStarred = Boolean(userProgress.starred[w.id]);
  const stLabel = st === 'mastered' ? 'Thành thạo' : (st === 'learning' ? 'Đang ôn' : 'Mới');

  const row = document.createElement('div');
  row.className = 'word-row-card';
  row.id = `word-card-${w.id}`;

  const highlightedEnEx = highlightWordInExample(w.en_example || '', w.word);
  const starsHtml = renderFrequencyStars(w.stars);
  const xemThemHtml = buildXemThemSectionHtml(w);

  row.innerHTML = `
    <div class="w-top-section">
      <div class="w-info-stack">
        <div class="w-headline-row">
          <span class="w-word" onclick="${isReviewScreen ? `speakWord('${escapeJs(w.word)}', 0.92)` : `focusWordInDeck(${w.id})`}">${escapeHtml(w.word)}</span>
          ${starsHtml}
          ${w.pos ? `<span class="w-pos-badge">${escapeHtml(w.pos)}</span>` : ''}
          ${w.ipa ? `<span class="w-ipa">${escapeHtml(w.ipa)}</span>` : ''}
          <span class="w-status-badge ${st}" onclick="cycleWordStatus(${w.id}, ${isReviewScreen})" title="Nhấn để đổi trạng thái">${stLabel}</span>
        </div>
        <div class="w-meaning-line">${escapeHtml(w.meaning)}</div>
      </div>

      <div class="w-top-actions">
        <button class="w-speaker-circle" onclick="speakWord('${escapeJs(w.word)}', 0.92, this)" title="Nghe phát âm từ">
          ${ICONS.speaker}
        </button>
        <button class="w-star-plain ${isStarred ? 'starred' : ''}" onclick="toggleStar(${w.id}, ${isReviewScreen})" title="Gắn sao từ này">
          ${ICONS.star}
        </button>
        <button class="w-edit-plain" onclick="openWordEditorModal(${w.id})" title="Sửa từ vựng này">
          ${ICONS.edit}
        </button>
      </div>
    </div>

    ${(w.en_example || w.vi_example) ? `
      <div class="w-divider"></div>
      <div class="w-example-section">
        <div class="w-example-texts">
          ${w.en_example ? `<div class="w-ex-en">${highlightedEnEx}</div>` : ''}
          ${w.vi_example ? `<div class="w-ex-vi">${escapeHtml(w.vi_example)}</div>` : ''}
        </div>
        ${w.en_example ? `
          <button class="w-speaker-circle" onclick="speakWord('${escapeJs(w.en_example)}', 0.92, this)" title="Nghe cả câu ví dụ">
            ${ICONS.speaker}
          </button>
        ` : ''}
      </div>
    ` : ''}

    ${xemThemHtml}
  `;
  return row;
}

function focusWordInDeck(wordId) {
  const idx = currentLessonWords.findIndex(w => w.id === wordId);
  if (idx !== -1) {
    loadFlashcard(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    speakWord(currentLessonWords[idx].word);
  }
}

function cycleWordStatus(wordId, isReviewScreen = false) {
  const current = userProgress.status[wordId] || 'new';
  const next = current === 'new' ? 'learning' : (current === 'learning' ? 'mastered' : 'new');
  userProgress.status[wordId] = next;
  userProgress.reviews[wordId] = Date.now();
  playSfx('flip');
  saveProgress();
  if (isReviewScreen) loadReviewTab(currentReviewTab);
  else {
    syncFlashcardDOM();
    renderWordList();
  }
}

function toggleStar(wordId, isReviewScreen = false) {
  userProgress.starred[wordId] = !userProgress.starred[wordId];
  playSfx('flip');
  saveProgress();
  if (isReviewScreen) loadReviewTab(currentReviewTab);
  else {
    syncFlashcardDOM();
    renderWordList();
  }
}

// ==========================================================================
// 5. MODE 2: HỌC (3-STEP GUIDED BATCH STUDY)
// ==========================================================================
function renderStudyPanel() {
  const container = document.getElementById('studyContainer');
  if (!container) return;

  if (!batchState.active) {
    const unmastered = currentLessonWords.filter(w => userProgress.status[w.id] !== 'mastered');
    const remCount = unmastered.length;

    container.innerHTML = `
      <div class="study-hero-icon">${ICONS.cap}</div>
      <h2>Học từ mới</h2>
      <p>
        ${remCount > 0
          ? `Còn <strong>${remCount}</strong> từ mới. Mỗi nhóm 5 từ, học qua 3 lượt: Xem &rarr; Trắc nghiệm &rarr; Gõ từ.`
          : `Bạn đã hoàn thành toàn bộ <strong>${currentLessonWords.length}</strong> từ trong bài học này!`}
      </p>
      <div class="study-cta-stack">
        <button class="btn-brand-lg" onclick="startBatchStudy(5)">
          <span>${remCount > 0 ? 'Bắt đầu 5 từ' : 'Ôn lại 5 từ'}</span>
          ${ICONS.arrowRight}
        </button>
        <button class="btn-outline-lg" onclick="startBatchStudy(7)">
          ${ICONS.bolt}
          <span>Học nhanh 7 từ</span>
        </button>
      </div>
    `;
    return;
  }

  const w = batchState.words[batchState.stepIndex];
  const totalInBatch = batchState.words.length;

  if (batchState.phase === 'preview') {
    container.innerHTML = `
      <div class="batch-step-header">
        <span class="batch-step-badge">Bước 1/3 · Xem từ (${batchState.stepIndex + 1}/${totalInBatch})</span>
        <button class="helper-chip-btn" onclick="batchState.active=false; renderStudyPanel();">Thoát</button>
      </div>
      <div class="q-box">
        <div class="deck-word-row">
          <h2 class="deck-word">${escapeHtml(w.word)}</h2>
          <button class="audio-circle-btn" onclick="speakWord('${escapeJs(w.word)}', 0.92, this)">${ICONS.speaker}</button>
        </div>
        <div class="deck-phonetic-row" style="margin-bottom: 14px;">
          ${w.pos ? `<span class="w-pos-badge">${escapeHtml(w.pos)}</span>` : ''}
          ${w.ipa ? `<span class="w-ipa">${escapeHtml(w.ipa)}</span>` : ''}
        </div>
        <div class="deck-meaning">${escapeHtml(w.meaning)}</div>
        ${(w.en_example || w.vi_example) ? `
          <div class="deck-example-box" style="margin: 0 auto 20px;">
            <div class="deck-en-line">
              <span>${highlightWordInExample(w.en_example, w.word)}</span>
              <button class="inline-speak-btn" onclick="speakWord('${escapeJs(w.en_example)}', 0.92, this)">${ICONS.speakerSm}</button>
            </div>
            <div class="deck-vi-line">${escapeHtml(w.vi_example)}</div>
          </div>
        ` : ''}
        <button class="btn-brand-lg" style="max-width: 240px; margin: 0 auto;" onclick="advanceBatchStep()">
          <span>Tiếp tục (Enter)</span>
          ${ICONS.arrowRight}
        </button>
      </div>
    `;
    speakWord(w.word);
  } else if (batchState.phase === 'mcq') {
    const options = buildDistractors(w, 4);
    container.innerHTML = `
      <div class="batch-step-header">
        <span class="batch-step-badge">Bước 2/3 · Trắc nghiệm (${batchState.stepIndex + 1}/${totalInBatch})</span>
        <button class="helper-chip-btn" onclick="batchState.active=false; renderStudyPanel();">Thoát</button>
      </div>
      <div class="q-box">
        <div class="q-instruction">CHỌN NGHĨA ĐÚNG CỦA TỪ</div>
        <div class="q-prompt-main">${escapeHtml(w.word)}</div>
        <div class="q-meta-row">
          ${w.pos ? `<span class="w-pos-badge">${escapeHtml(w.pos)}</span>` : ''}
          ${w.ipa ? `<span class="w-ipa">${escapeHtml(w.ipa)}</span>` : ''}
          <button class="audio-circle-btn sm" onclick="speakWord('${escapeJs(w.word)}', 0.92, this)">${ICONS.speakerSm}</button>
        </div>
        <div class="mcq-grid" id="batchMcqGrid"></div>
        <div id="batchFeedbackSlot"></div>
      </div>
    `;
    const grid = document.getElementById('batchMcqGrid');
    options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'mcq-option';
      btn.innerHTML = `<span class="mcq-key">${idx + 1}</span><span>${escapeHtml(opt.meaning)}</span>`;
      btn.onclick = () => {
        if (opt.id === w.id) {
          btn.classList.add('correct');
          playSfx('correct');
          speakWord(w.word);
          setTimeout(() => advanceBatchStep(), 500);
        } else {
          btn.classList.add('wrong');
          playSfx('wrong');
          const slot = document.getElementById('batchFeedbackSlot');
          if (slot) {
            slot.innerHTML = `
              <div class="verdict-wrapper">
                <div class="verdict-banner wrong" style="border-radius: var(--radius-md); border-bottom: 1.5px solid #fda4af;">
                  <div class="verdict-left">
                    <span class="verdict-icon-badge">${ICONS.xMark}</span>
                    <div>
                      <div class="verdict-title">Chưa chính xác! Hãy chọn lại.</div>
                      <div class="verdict-subtitle"><strong>${escapeHtml(w.word)}</strong> có nghĩa là "${escapeHtml(w.meaning)}".</div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }
        }
      };
      grid.appendChild(btn);
    });
  } else if (batchState.phase === 'typing') {
    batchState.hintLevel = 0;
    container.innerHTML = `
      <div class="batch-step-header">
        <span class="batch-step-badge">Bước 3/3 · Gõ từ (${batchState.stepIndex + 1}/${totalInBatch})</span>
        <button class="helper-chip-btn" onclick="batchState.active=false; renderStudyPanel();">Thoát</button>
      </div>
      <div class="q-box">
        <div class="q-instruction">GÕ TỪ TIẾNG ANH TƯƠNG ỨNG</div>
        <div class="q-prompt-main meaning-prompt">${escapeHtml(w.meaning)}</div>
        <div class="q-meta-row">
          ${w.pos ? `<span class="w-pos-badge">${escapeHtml(w.pos)}</span>` : ''}
          <button class="replay-audio-pill" onclick="speakWord('${escapeJs(w.word)}', 0.92, this)" title="Phím Tab để nghe lại">
            ${ICONS.speakerSm}
            <span>Nghe</span>
            <kbd>Tab</kbd>
          </button>
        </div>
        <div class="letter-slots-row" id="batchLetterSlots"></div>
        <div class="typing-area">
          <div class="typing-input-group">
            <input type="text" id="batchTypeInput" class="typing-input" placeholder="Nhập từ tiếng Anh rồi nhấn Enter..." autocomplete="off" autocapitalize="off" spellcheck="false">
            <button class="typing-submit-btn" onclick="checkBatchTyping()">Kiểm tra</button>
          </div>
          <div class="typing-helper-btns">
            <button class="helper-chip-btn" onclick="revealBatchHint()">Mở gợi ý chữ cái</button>
          </div>
        </div>
        <div id="batchFeedbackSlot"></div>
      </div>
    `;
    renderLetterSlots('batchLetterSlots', w.word, '', batchState.hintLevel, false);
    const inp = document.getElementById('batchTypeInput');
    if (inp) {
      inp.focus();
      inp.oninput = () => {
        inp.classList.remove('wrong');
        renderLetterSlots('batchLetterSlots', w.word, inp.value, batchState.hintLevel, false);
      };
      inp.onkeydown = (e) => {
        if (e.key === 'Tab' || (e.ctrlKey && e.code === 'Space')) {
          e.preventDefault();
          speakWord(w.word);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          checkBatchTyping();
        }
      };
    }
  } else if (batchState.phase === 'done') {
    fireConfetti(60);
    playSfx('correct');
    container.innerHTML = `
      <div class="study-hero-icon">${ICONS.check}</div>
      <h2>Hoàn thành nhóm ${totalInBatch} từ!</h2>
      <p>Các từ vừa học đã được đánh dấu <strong>Thành thạo</strong>.</p>
      <div class="study-cta-stack">
        <button class="btn-brand-lg" onclick="startBatchStudy(${batchState.batchSize})">
          <span>Học tiếp ${batchState.batchSize} từ</span>
          ${ICONS.arrowRight}
        </button>
        <button class="btn-outline-lg" onclick="batchState.active=false; renderStudyPanel();">
          <span>Quay lại</span>
        </button>
      </div>
    `;
  }
}

function startBatchStudy(size) {
  const pool = currentLessonWords.filter(w => userProgress.status[w.id] !== 'mastered');
  const source = pool.length > 0 ? pool : [...currentLessonWords].sort(() => Math.random() - 0.5);
  batchState.words = source.slice(0, size);
  batchState.batchSize = size;
  batchState.stepIndex = 0;
  batchState.phase = 'preview';
  batchState.active = true;
  renderStudyPanel();
}

function advanceBatchStep() {
  if (batchState.stepIndex < batchState.words.length - 1) {
    batchState.stepIndex++;
  } else {
    batchState.stepIndex = 0;
    if (batchState.phase === 'preview') batchState.phase = 'mcq';
    else if (batchState.phase === 'mcq') batchState.phase = 'typing';
    else if (batchState.phase === 'typing') {
      batchState.words.forEach(w => {
        userProgress.status[w.id] = 'mastered';
        userProgress.reviews[w.id] = Date.now();
      });
      saveProgress();
      batchState.phase = 'done';
    }
  }
  renderStudyPanel();
}

function revealBatchHint() {
  const w = batchState.words[batchState.stepIndex];
  if (!w) return;
  batchState.hintLevel++;
  const inp = document.getElementById('batchTypeInput');
  renderLetterSlots('batchLetterSlots', w.word, inp ? inp.value : '', batchState.hintLevel, false);
  if (inp) inp.focus();
}

function checkBatchTyping() {
  const inp = document.getElementById('batchTypeInput');
  if (!inp) return;
  const w = batchState.words[batchState.stepIndex];
  const val = inp.value.trim();
  const isCorrect = val.toLowerCase() === w.word.toLowerCase();

  renderLetterSlots('batchLetterSlots', w.word, val, batchState.hintLevel, true);
  const slot = document.getElementById('batchFeedbackSlot');

  if (isCorrect) {
    inp.classList.remove('wrong');
    inp.classList.add('correct');
    playSfx('correct');
    fireConfetti(25);
    speakWord(w.word);
    if (slot) {
      slot.innerHTML = `
        <div class="verdict-wrapper">
          <div class="verdict-banner correct" style="border-radius: var(--radius-md); border-bottom: 1.5px solid #34d399;">
            <div class="verdict-left">
              <span class="verdict-icon-badge">${ICONS.check}</span>
              <div>
                <div class="verdict-title">Chính xác! "${escapeHtml(w.word)}"</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    setTimeout(() => advanceBatchStep(), 550);
  } else {
    inp.classList.remove('correct');
    inp.classList.add('wrong');
    playSfx('wrong');
    if (slot) {
      slot.innerHTML = `
        <div class="verdict-wrapper">
          <div class="verdict-banner wrong" style="border-radius: var(--radius-md); border-bottom: 1.5px solid #fda4af;">
            <div class="verdict-left">
              <span class="verdict-icon-badge">${ICONS.xMark}</span>
              <div>
                <div class="verdict-title">Chưa chính xác!</div>
                <div class="verdict-subtitle">Bạn gõ: <span class="user-wrong-strike">${escapeHtml(val || '(trống)')}</span> &rarr; Kiểm tra các ô báo đỏ ở trên.</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }
}

// ==========================================================================
// 6. MODE 3: CHƠI (SMART SRS QUEUE + COMPACT 1-CLICK TOGGLE SWITCH)
// ==========================================================================
function backToGameMenu() {
  gameState.inGame = false;
  document.getElementById('gameMenuLayer').style.display = 'block';
  document.getElementById('activeGameLayer').style.display = 'none';
  renderGameMenuRecords();
}

function renderGameMenuRecords() {
  const rec = userProgress.records || {};
  const setRec = (type, isTime = false) => {
    const el = document.getElementById(`rec-${type}`);
    if (!el) return;
    if (rec[type]) {
      el.innerHTML = `${ICONS.trophy} <span>Kỷ lục: ${rec[type]}${isTime ? ' giây' : ' điểm'}</span>`;
    } else {
      el.innerHTML = '';
    }
  };
  setRec('listen_choice', false);
  setRec('matching', true);
  setRec('mcq', false);
  setRec('typing', false);
  setRec('listen_type', false);
}

// Strategic Spaced-Repetition Queue Builder (No duplicate spam!)
function buildSmartQueue() {
  if (!currentLessonWords.length) {
    gameState.queue = [];
    return;
  }
  // Separate unmastered words (priority) and mastered words
  const priority = currentLessonWords.filter(w => userProgress.status[w.id] !== 'mastered');
  const mastered = currentLessonWords.filter(w => userProgress.status[w.id] === 'mastered');

  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  let combined = [...shuffle(priority), ...shuffle(mastered)];

  // Ensure the first word of the new queue is not the exact same as the last word just asked
  if (combined.length > 1 && combined[0].id === gameState.lastWordId) {
    const swapIdx = 1 + Math.floor(Math.random() * (combined.length - 1));
    [combined[0], combined[swapIdx]] = [combined[swapIdx], combined[0]];
  }

  gameState.queue = combined;
  gameState.completedInCycle = 0;
}

function pullNextWordFromSmartQueue() {
  if (!gameState.queue || gameState.queue.length === 0) {
    buildSmartQueue();
  }
  const nextWord = gameState.queue.shift();
  gameState.lastWordId = nextWord ? nextWord.id : null;
  return nextWord;
}

function recordWordOutcomeInQueue(wordObj, isCorrect) {
  if (!wordObj) return;
  if (isCorrect) {
    // Word passed! Do not repeat in this cycle
    gameState.completedInCycle = Math.min(currentLessonWords.length, gameState.completedInCycle + 1);
  } else {
    // Strategic Spaced Re-queue: Re-insert the missed word 3 to 4 turns later!
    // (Not immediately on the very next turn, and not lost forever)
    const alreadyInQueue = gameState.queue.some(w => w.id === wordObj.id);
    if (!alreadyInQueue) {
      const insertAt = Math.min(3, gameState.queue.length);
      gameState.queue.splice(insertAt, 0, wordObj);
    } else {
      // Move existing occurrence to 3 turns from now
      gameState.queue = gameState.queue.filter(w => w.id !== wordObj.id);
      const insertAt = Math.min(3, gameState.queue.length);
      gameState.queue.splice(insertAt, 0, wordObj);
    }
  }
}

function initMatchingBatches() {
  const shuffled = [...currentLessonWords].sort(() => Math.random() - 0.5);
  const batchSize = 5;
  const batches = [];
  for (let i = 0; i < shuffled.length; i += batchSize) {
    batches.push(shuffled.slice(i, i + batchSize));
  }
  gameState.matchBatches = batches.length ? batches : [[]];
  gameState.matchBatchIndex = 0;
  gameState.totalMatchedInLesson = 0;
  gameState.matchStartTime = Date.now();
}

function launchGame(type) {
  gameState.inGame = true;
  gameState.type = type;
  gameState.score = 0;
  gameState.streak = 0;

  if (type === 'mcq') gameState.direction = 'en_vi';
  else if (type === 'typing') gameState.direction = 'vi_en';
  else if (type === 'listen_choice') gameState.direction = 'listen_vi';
  else if (type === 'listen_type') gameState.direction = 'en_only';

  if (type === 'matching') {
    initMatchingBatches();
  } else {
    buildSmartQueue();
  }

  document.getElementById('gameMenuLayer').style.display = 'none';
  document.getElementById('activeGameLayer').style.display = 'block';

  renderCompactGameToolbar();
  startNewGameRound();
}

// 1-Click Compact Switcher for Game Mode / Direction!
function cycleCompactDirection() {
  const t = gameState.type;
  const cur = gameState.direction;

  if (t === 'listen_choice') {
    gameState.direction = (cur === 'listen_vi') ? 'listen_en' : 'listen_vi';
  } else if (t === 'typing') {
    const order = ['vi_en', 'en_vi', 'mixed'];
    gameState.direction = order[(order.indexOf(cur) + 1) % order.length];
  } else if (t === 'mcq') {
    const order = ['en_vi', 'vi_en', 'cloze', 'mixed'];
    gameState.direction = order[(order.indexOf(cur) + 1) % order.length];
  } else if (t === 'listen_type') {
    gameState.direction = (cur === 'en_only') ? 'with_meaning' : 'en_only';
  } else if (t === 'matching') {
    playSfx('flip');
    initMatchingBatches();
    renderCompactGameToolbar();
    startNewGameRound();
    return;
  }

  playSfx('flip');
  renderCompactGameToolbar();
  startNewGameRound();
}

function getCompactDirectionLabel() {
  const t = gameState.type;
  const d = gameState.direction;

  if (t === 'listen_choice') {
    return d === 'listen_vi' ? 'Nghe → Nghĩa Việt' : 'Nghe → Từ Anh';
  }
  if (t === 'typing') {
    if (d === 'vi_en') return 'Việt → Gõ Anh';
    if (d === 'en_vi') return 'Anh → Gõ Việt';
    return 'Đảo ngẫu nhiên';
  }
  if (t === 'mcq') {
    if (d === 'en_vi') return 'Anh → Việt';
    if (d === 'vi_en') return 'Việt → Anh';
    if (d === 'cloze') return 'Điền câu ví dụ';
    return 'Đảo ngẫu nhiên';
  }
  if (t === 'listen_type') {
    return d === 'en_only' ? 'Chỉ nghe & Gõ' : 'Kèm nghĩa Việt';
  }
  return 'Đổi bộ thẻ';
}

function renderCompactGameToolbar() {
  const bar = document.getElementById('gameToolbar');
  if (!bar) return;

  const toggleLabel = getCompactDirectionLabel();
  const totalWords = currentLessonWords.length;
  const doneWords = gameState.completedInCycle;

  let progressText = `Vòng: ${doneWords}/${totalWords}`;
  if (gameState.type === 'matching' && gameState.matchBatches) {
    progressText = `Đợt ${(gameState.matchBatchIndex || 0) + 1}/${gameState.matchBatches.length} · Đã ghép: ${gameState.totalMatchedInLesson || 0}/${totalWords}`;
  }

  bar.innerHTML = `
    <div class="toolbar-left">
      <button class="back-to-games-btn" onclick="backToGameMenu()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        <span>Trò chơi</span>
      </button>
      <button class="mode-switch-toggle" onclick="cycleCompactDirection()" title="Nhấn để chuyển đổi chiều / chế độ hỏi">
        ${gameState.type === 'matching' ? ICONS.refresh : ICONS.swap}
        <span>${escapeHtml(toggleLabel)}</span>
      </button>
    </div>

    <div class="toolbar-right">
      <span class="queue-pill-box" id="gameQueueProgress">${progressText}</span>
      <span class="score-pill-box">Điểm: <strong class="score-val" id="gameScoreVal">${gameState.score}</strong></span>
      <span class="streak-pill-box">${ICONS.flame} <strong class="streak-val" id="gameStreakVal">${gameState.streak}</strong></span>
    </div>
  `;
}

function updateGameScoreUI(didScoreBump = false) {
  if (gameState.type !== 'matching') {
    const prevBest = userProgress.records[gameState.type] || 0;
    if (gameState.score > prevBest) {
      userProgress.records[gameState.type] = gameState.score;
      saveProgress();
    }
  }

  const qEl = document.getElementById('gameQueueProgress');
  if (qEl) {
    if (gameState.type === 'matching' && gameState.matchBatches) {
      qEl.textContent = `Đợt ${(gameState.matchBatchIndex || 0) + 1}/${gameState.matchBatches.length} · Đã ghép: ${gameState.totalMatchedInLesson || 0}/${currentLessonWords.length}`;
    } else {
      qEl.textContent = `Vòng: ${gameState.completedInCycle}/${currentLessonWords.length}`;
    }
  }

  const sEl = document.getElementById('gameScoreVal');
  const stEl = document.getElementById('gameStreakVal');
  if (sEl) {
    sEl.textContent = gameState.score;
    if (didScoreBump) {
      sEl.classList.remove('bump');
      void sEl.offsetWidth;
      sEl.classList.add('bump');
    }
  }
  if (stEl) {
    stEl.textContent = gameState.streak;
    if (didScoreBump) {
      stEl.classList.remove('bump');
      void stEl.offsetWidth;
      stEl.classList.add('bump');
    }
  }
}

function renderLetterSlots(containerId, targetWord, typedVal, hintLevel, isEvaluated) {
  const container = document.getElementById(containerId);
  if (!container || !targetWord) return;

  const targetChars = targetWord.split('');
  const typedChars = (typedVal || '').trim().split('');

  container.innerHTML = targetChars.map((ch, idx) => {
    if (ch === ' ') return `<span class="letter-slot space-slot"></span>`;
    const userChar = typedChars[idx];
    const isHinted = (idx === 0 || idx <= hintLevel);

    if (isEvaluated) {
      const charMatches = userChar && userChar.toLowerCase() === ch.toLowerCase();
      const cls = charMatches ? 'match-ok' : 'match-err';
      return `<span class="letter-slot ${cls}">${escapeHtml(userChar || ch)}</span>`;
    }
    if (userChar) return `<span class="letter-slot filled">${escapeHtml(userChar)}</span>`;
    if (isHinted) return `<span class="letter-slot hinted">${escapeHtml(ch)}</span>`;
    return `<span class="letter-slot">_</span>`;
  }).join('');
}

function startNewGameRound() {
  const stage = document.getElementById('gameStageCard');
  if (!stage || !currentLessonWords.length) return;

  stage.classList.remove('card-celebrate', 'card-error-shake');
  gameState.answered = false;
  gameState.hintLevel = 0;

  if (gameState.type === 'matching') {
    renderMatchingGame(stage);
    return;
  }

  gameState.currentWord = pullNextWordFromSmartQueue();
  updateGameScoreUI(false);

  if (gameState.type === 'mcq') renderMcqRound(stage);
  else if (gameState.type === 'typing') renderTypingRound(stage);
  else if (gameState.type === 'listen_choice') renderListenChoiceRound(stage);
  else if (gameState.type === 'listen_type') renderListenTypeRound(stage);
}

// --- GAME: MULTIPLE CHOICE ---
function renderMcqRound(stage) {
  const w = gameState.currentWord;
  let dir = gameState.direction;
  if (dir === 'mixed') dir = Math.random() < 0.5 ? 'en_vi' : 'vi_en';
  gameState.actualDir = dir;

  const options = buildDistractors(w, 4);

  let promptHTML = '';
  if (dir === 'en_vi') {
    promptHTML = `
      <div class="q-instruction">CHỌN NGHĨA TIẾNG VIỆT ĐÚNG</div>
      <div class="q-prompt-main">${escapeHtml(w.word)}</div>
      <div class="q-meta-row">
        ${w.pos ? `<span class="w-pos-badge">${escapeHtml(w.pos)}</span>` : ''}
        ${w.ipa ? `<span class="w-ipa">${escapeHtml(w.ipa)}</span>` : ''}
        <button class="replay-audio-pill" onclick="speakWord('${escapeJs(w.word)}', 0.92, this)">
          ${ICONS.speakerSm}
          <span>Nghe</span>
          <kbd>Tab</kbd>
        </button>
      </div>
    `;
  } else if (dir === 'vi_en') {
    promptHTML = `
      <div class="q-instruction">CHỌN TỪ TIẾNG ANH TƯƠNG ỨNG</div>
      <div class="q-prompt-main meaning-prompt">${escapeHtml(w.meaning)}</div>
      <div class="q-meta-row">
        ${w.pos ? `<span class="w-pos-badge">Loại từ: ${escapeHtml(w.pos)}</span>` : ''}
      </div>
    `;
  } else if (dir === 'cloze') {
    const clozeSentence = maskWordInSentence(w.en_example || w.word, w.word);
    promptHTML = `
      <div class="q-instruction">ĐIỀN TỪ PHÙ HỢP VÀO CHỖ TRỐNG</div>
      <div class="q-prompt-main cloze-prompt">${escapeHtml(clozeSentence)}</div>
      <div class="q-meta-row" style="margin-top: 8px;">
        <span style="font-size: 13px; color: var(--slate-500);">${escapeHtml(w.vi_example || w.meaning)}</span>
      </div>
    `;
  }

  stage.innerHTML = `
    <div class="q-box">
      ${promptHTML}
      <div class="mcq-grid" id="mcqOptionsGrid"></div>
      <div id="gameRevealSlot"></div>
    </div>
  `;

  const grid = document.getElementById('mcqOptionsGrid');
  options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'mcq-option';
    const labelText = (dir === 'en_vi') ? opt.meaning : `${opt.word} ${opt.ipa ? `(${opt.ipa})` : ''}`;
    btn.innerHTML = `<span class="mcq-key">${idx + 1}</span><span>${escapeHtml(labelText)}</span>`;
    btn.onclick = () => handleMcqPick(opt.id === w.id, btn, options, labelText);
    grid.appendChild(btn);
  });
}

function handleMcqPick(isCorrect, chosenBtn, options, chosenText) {
  if (gameState.answered) return;
  gameState.answered = true;

  const w = gameState.currentWord;
  const allBtns = document.querySelectorAll('#mcqOptionsGrid .mcq-option');
  allBtns.forEach((b, i) => {
    b.disabled = true;
    if (options[i].id === w.id) b.classList.add('correct');
  });

  recordWordOutcomeInQueue(w, isCorrect);

  if (isCorrect) {
    chosenBtn.classList.add('correct');
    gameState.score += 10;
    gameState.streak += 1;
    userProgress.status[w.id] = 'mastered';
    playSfx('correct');
    triggerStageCardEffect(true);
  } else {
    chosenBtn.classList.add('wrong');
    gameState.streak = 0;
    userProgress.status[w.id] = 'learning';
    playSfx('wrong');
    triggerStageCardEffect(false);
  }

  saveProgress();
  updateGameScoreUI(isCorrect);
  speakWord(w.word);

  const targetText = (gameState.actualDir === 'en_vi' || (gameState.type === 'listen_choice' && gameState.direction === 'listen_vi'))
    ? w.meaning
    : w.word;
  showAnswerRevealCard('gameRevealSlot', w, isCorrect, chosenText, targetText, 10);
}

// --- GAME: TYPING (WITH TAB KEY AUDIO REPLAY & SMART SRS QUEUE) ---
function renderTypingRound(stage) {
  const w = gameState.currentWord;
  let dir = gameState.direction;
  if (dir === 'mixed') dir = Math.random() < 0.5 ? 'vi_en' : 'en_vi';
  gameState.actualDir = dir;

  if (dir === 'vi_en') {
    stage.innerHTML = `
      <div class="q-box">
        <div class="q-instruction">GÕ TỪ TIẾNG ANH TƯƠNG ỨNG</div>
        <div class="q-prompt-main meaning-prompt">${escapeHtml(w.meaning)}</div>
        <div class="q-meta-row">
          ${w.pos ? `<span class="w-pos-badge">${escapeHtml(w.pos)}</span>` : ''}
          <button class="replay-audio-pill" onclick="speakWord('${escapeJs(w.word)}', 0.92, this)" title="Nhấn phím Tab để nghe phát âm">
            ${ICONS.speakerSm}
            <span>Nghe gợi ý</span>
            <kbd>Tab</kbd>
          </button>
        </div>
        <div class="letter-slots-row" id="gameLetterSlots"></div>
        <div class="typing-area">
          <div class="typing-input-group">
            <input type="text" id="gameTypeInput" class="typing-input" placeholder="Gõ từ tiếng Anh (${w.word.length} ký tự) rồi nhấn Enter..." autocomplete="off" autocapitalize="off" spellcheck="false">
            <button class="typing-submit-btn" id="gameTypeSubmitBtn" onclick="submitTypingAnswer()">Kiểm tra</button>
          </div>
          <div class="typing-helper-btns">
            <button class="helper-chip-btn" onclick="revealTypingHint()">Mở gợi ý chữ cái</button>
            <button class="helper-chip-btn" onclick="giveUpTypingAnswer()">Xem đáp án</button>
          </div>
        </div>
        <div id="gameRevealSlot"></div>
      </div>
    `;
    renderLetterSlots('gameLetterSlots', w.word, '', gameState.hintLevel, false);
  } else {
    stage.innerHTML = `
      <div class="q-box">
        <div class="q-instruction">GÕ NGHĨA TIẾNG VIỆT CỦA TỪ</div>
        <div class="q-prompt-main">${escapeHtml(w.word)}</div>
        <div class="q-meta-row">
          ${w.pos ? `<span class="w-pos-badge">${escapeHtml(w.pos)}</span>` : ''}
          ${w.ipa ? `<span class="w-ipa">${escapeHtml(w.ipa)}</span>` : ''}
          <button class="replay-audio-pill" onclick="speakWord('${escapeJs(w.word)}', 0.92, this)" title="Nhấn phím Tab để nghe lại">
            ${ICONS.speakerSm}
            <span>Nghe lại</span>
            <kbd>Tab</kbd>
          </button>
        </div>
        <div class="typing-area">
          <div class="typing-input-group">
            <input type="text" id="gameTypeInput" class="typing-input" placeholder="Gõ nghĩa tiếng Việt (chấp nhận 1 trong các nghĩa)..." autocomplete="off">
            <button class="typing-submit-btn" id="gameTypeSubmitBtn" onclick="submitTypingAnswer()">Kiểm tra</button>
          </div>
          <div class="typing-helper-btns">
            <button class="helper-chip-btn" onclick="giveUpTypingAnswer()">Xem đáp án</button>
          </div>
        </div>
        <div id="gameRevealSlot"></div>
      </div>
    `;
    speakWord(w.word);
  }

  bindTypingInputEvents(w);
}

function bindTypingInputEvents(w) {
  const inp = document.getElementById('gameTypeInput');
  if (!inp) return;
  inp.focus();
  inp.oninput = () => {
    if (!gameState.answered && (gameState.actualDir === 'vi_en' || gameState.type === 'listen_type')) {
      renderLetterSlots('gameLetterSlots', w.word, inp.value, gameState.hintLevel, false);
    }
  };
  inp.onkeydown = (e) => {
    if (e.key === 'Tab' || (e.ctrlKey && e.code === 'Space')) {
      e.preventDefault();
      speakWord(w.word, 0.92);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (gameState.answered) startNewGameRound();
      else submitTypingAnswer();
    }
  };
}

function revealTypingHint() {
  if (gameState.answered || !gameState.currentWord) return;
  gameState.hintLevel++;
  const w = gameState.currentWord;
  const inp = document.getElementById('gameTypeInput');
  renderLetterSlots('gameLetterSlots', w.word, inp ? inp.value : '', gameState.hintLevel, false);
  playSfx('flip');
  if (inp) inp.focus();
}

function submitTypingAnswer() {
  if (gameState.answered) {
    startNewGameRound();
    return;
  }
  const inp = document.getElementById('gameTypeInput');
  if (!inp) return;
  const rawTyped = inp.value.trim();
  const userVal = rawTyped.toLowerCase();
  if (!userVal) return;

  const w = gameState.currentWord;
  let isCorrect = false;
  const isEnTarget = (gameState.actualDir === 'vi_en' || gameState.type === 'listen_type');

  if (isEnTarget) {
    isCorrect = (userVal === w.word.toLowerCase());
    renderLetterSlots('gameLetterSlots', w.word, rawTyped, gameState.hintLevel, true);
  } else {
    const cleanMeaning = w.meaning.toLowerCase().replace(/\([a-z,\s]+\)/g, '');
    const parts = cleanMeaning.split(/[;,.·/]/).map(s => s.trim()).filter(Boolean);
    isCorrect = parts.some(p => p === userVal || (userVal.length >= 2 && p.includes(userVal)));
  }

  gameState.answered = true;
  recordWordOutcomeInQueue(w, isCorrect);

  const submitBtn = document.getElementById('gameTypeSubmitBtn');
  if (submitBtn) submitBtn.textContent = 'Câu tiếp ➔';

  if (isCorrect) {
    inp.classList.remove('wrong');
    inp.classList.add('correct');
    gameState.score += 15;
    gameState.streak += 1;
    userProgress.status[w.id] = 'mastered';
    playSfx('correct');
    triggerStageCardEffect(true);
  } else {
    inp.classList.remove('correct');
    inp.classList.add('wrong');
    gameState.streak = 0;
    userProgress.status[w.id] = 'learning';
    playSfx('wrong');
    triggerStageCardEffect(false);
  }

  saveProgress();
  updateGameScoreUI(isCorrect);
  speakWord(w.word);

  const targetText = isEnTarget ? w.word : w.meaning;
  showAnswerRevealCard('gameRevealSlot', w, isCorrect, rawTyped, targetText, 15);
}

function giveUpTypingAnswer() {
  if (gameState.answered) return;
  gameState.answered = true;
  gameState.streak = 0;
  const w = gameState.currentWord;
  const isEnTarget = (gameState.actualDir === 'vi_en' || gameState.type === 'listen_type');

  recordWordOutcomeInQueue(w, false);

  const inp = document.getElementById('gameTypeInput');
  const rawTyped = inp ? inp.value.trim() : '';
  if (inp) inp.classList.add('wrong');
  if (isEnTarget) renderLetterSlots('gameLetterSlots', w.word, rawTyped, gameState.hintLevel, true);

  const submitBtn = document.getElementById('gameTypeSubmitBtn');
  if (submitBtn) submitBtn.textContent = 'Câu tiếp ➔';

  playSfx('wrong');
  triggerStageCardEffect(false);
  updateGameScoreUI(false);
  speakWord(w.word);
  showAnswerRevealCard('gameRevealSlot', w, false, rawTyped || '(Đã xem đáp án)', isEnTarget ? w.word : w.meaning, 15);
}

// --- GAME: LISTENING CHOICE ---
function renderListenChoiceRound(stage) {
  const w = gameState.currentWord;
  const dir = gameState.direction;
  const options = buildDistractors(w, 4);

  stage.innerHTML = `
    <div class="q-box">
      <div class="q-instruction">${dir === 'listen_vi' ? 'NGHE PHÁT ÂM & CHỌN NGHĨA TIẾNG VIỆT' : 'NGHE PHÁT ÂM & CHỌN TỪ TIẾNG ANH ĐÚNG'}</div>
      <div class="listen-big-controls">
        <button class="listen-hero-btn" onclick="speakWord('${escapeJs(w.word)}', 0.92, this)">
          ${ICONS.speaker}
          <span>Nghe phát âm</span>
          <kbd>Tab</kbd>
        </button>
        <button class="listen-slow-btn" onclick="speakWord('${escapeJs(w.word)}', 0.6, this)">
          <span>Chậm (0.6x)</span>
        </button>
      </div>
      <div class="mcq-grid" id="mcqOptionsGrid"></div>
      <div id="gameRevealSlot"></div>
    </div>
  `;

  const grid = document.getElementById('mcqOptionsGrid');
  options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'mcq-option';
    const text = dir === 'listen_vi' ? opt.meaning : opt.word;
    btn.innerHTML = `<span class="mcq-key">${idx + 1}</span><span>${escapeHtml(text)}</span>`;
    btn.onclick = () => handleMcqPick(opt.id === w.id, btn, options, text);
    grid.appendChild(btn);
  });

  speakWord(w.word, 0.92);
}

// --- GAME: LISTENING DICTATION ---
function renderListenTypeRound(stage) {
  const w = gameState.currentWord;
  gameState.actualDir = 'vi_en';
  const showMeaning = gameState.direction === 'with_meaning';

  stage.innerHTML = `
    <div class="q-box">
      <div class="q-instruction">NGHE PHÁT ÂM & GÕ LẠI TỪ TIẾNG ANH</div>
      <div class="listen-big-controls">
        <button class="listen-hero-btn" onclick="speakWord('${escapeJs(w.word)}', 0.92, this)">
          ${ICONS.speaker}
          <span>Nghe lại</span>
          <kbd>Tab</kbd>
        </button>
        <button class="listen-slow-btn" onclick="speakWord('${escapeJs(w.word)}', 0.6, this)">
          <span>Chậm (0.6x)</span>
        </button>
      </div>
      ${showMeaning ? `<div class="q-prompt-main meaning-prompt" style="margin-bottom:10px;">${escapeHtml(w.meaning)}</div>` : ''}
      <div class="letter-slots-row" id="gameLetterSlots"></div>
      <div class="typing-area">
        <div class="typing-input-group">
          <input type="text" id="gameTypeInput" class="typing-input" placeholder="Gõ lại từ tiếng Anh (${w.word.length} ký tự) · Nhấn Tab để nghe lại..." autocomplete="off" autocapitalize="off" spellcheck="false">
          <button class="typing-submit-btn" id="gameTypeSubmitBtn" onclick="submitTypingAnswer()">Kiểm tra</button>
        </div>
        <div class="typing-helper-btns">
          <button class="helper-chip-btn" onclick="revealTypingHint()">Mở gợi ý chữ cái</button>
          <button class="helper-chip-btn" onclick="giveUpTypingAnswer()">Xem đáp án</button>
        </div>
      </div>
      <div id="gameRevealSlot"></div>
    </div>
  `;

  renderLetterSlots('gameLetterSlots', w.word, '', gameState.hintLevel, false);
  speakWord(w.word, 0.92);
  bindTypingInputEvents(w);
}

// --- GAME: 2-COLUMN BATCHED MATCHING PAIRS (LARGER TILES & LASER CONNECTION EFFECTS) ---
function renderMatchingGame(stage) {
  if (!gameState.matchBatches || !gameState.matchBatches.length) {
    initMatchingBatches();
  }

  const batchWords = gameState.matchBatches[gameState.matchBatchIndex] || [];
  const leftItems = [...batchWords];
  const rightItems = [...batchWords].sort(() => Math.random() - 0.5);

  gameState.matchBatchWords = batchWords;
  gameState.selectedLeftId = null;
  gameState.selectedRightId = null;
  gameState.matchedIds = new Set();
  updateGameScoreUI(false);

  const totalBatches = gameState.matchBatches.length;
  const curBatchNum = gameState.matchBatchIndex + 1;
  const overallPct = currentLessonWords.length
    ? Math.round(((gameState.totalMatchedInLesson || 0) / currentLessonWords.length) * 100)
    : 0;

  stage.innerHTML = `
    <div class="match-two-col-wrapper">
      <div class="match-top-progress-track">
        <div class="match-top-progress-fill" id="matchTopBarFill" style="width: ${overallPct}%"></div>
      </div>
      <div class="q-instruction" style="margin-bottom: 12px;">
        ĐỢT ${curBatchNum} / ${totalBatches} · CHỌN TỪ VỰNG CỘT TRÁI VÀ NGHĨA TƯƠNG ỨNG Ở CỘT PHẢI
      </div>
      <div class="match-col-headers">
        <div class="match-col-title">
          <span>Từ vựng tiếng Anh (${leftItems.length})</span>
        </div>
        <div class="match-col-title">
          <span>Nghĩa tiếng Việt (${rightItems.length})</span>
        </div>
      </div>
      <div class="match-two-cols" id="matchTwoColsStage">
        <svg class="match-svg-lines" id="matchSvgLines"></svg>
        <div class="match-col" id="matchColLeft"></div>
        <div class="match-col" id="matchColRight"></div>
      </div>
    </div>
  `;

  const colLeft = document.getElementById('matchColLeft');
  const colRight = document.getElementById('matchColRight');

  leftItems.forEach((w, idx) => {
    const el = document.createElement('div');
    el.className = 'match-row-card';
    el.style.animationDelay = `${idx * 45}ms`;
    el.dataset.side = 'left';
    el.dataset.wordId = w.id;
    el.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; min-width:0;">
        <span class="match-en-word">${escapeHtml(w.word)}</span>
        ${w.pos ? `<span class="w-pos-badge">${escapeHtml(w.pos)}</span>` : ''}
      </div>
      <span class="match-node-dot"></span>
      <span class="match-check-badge">${ICONS.check}</span>
    `;
    el.onclick = () => handleTwoColMatchClick('left', w, el);
    colLeft.appendChild(el);
  });

  rightItems.forEach((w, idx) => {
    const el = document.createElement('div');
    el.className = 'match-row-card';
    el.style.animationDelay = `${idx * 45 + 20}ms`;
    el.dataset.side = 'right';
    el.dataset.wordId = w.id;
    el.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
        <span class="match-node-dot"></span>
        <span class="match-vi-text">${escapeHtml(w.meaning)}</span>
      </div>
      <span class="match-check-badge">${ICONS.check}</span>
    `;
    el.onclick = () => handleTwoColMatchClick('right', w, el);
    colRight.appendChild(el);
  });
}

function drawMatchConnectionBeam(leftEl, rightEl) {
  const svg = document.getElementById('matchSvgLines');
  const container = document.getElementById('matchTwoColsStage');
  if (!svg || !container || !leftEl || !rightEl) return;

  const cRect = container.getBoundingClientRect();
  const lRect = leftEl.getBoundingClientRect();
  const rRect = rightEl.getBoundingClientRect();

  const x1 = lRect.right - cRect.left - 4;
  const y1 = lRect.top - cRect.top + lRect.height / 2;
  const x2 = rRect.left - cRect.left + 4;
  const y2 = rRect.top - cRect.top + rRect.height / 2;
  const cx1 = x1 + (x2 - x1) * 0.45;
  const cx2 = x1 + (x2 - x1) * 0.55;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#10b981');
  path.setAttribute('stroke-width', '3.5');
  path.setAttribute('stroke-linecap', 'round');
  path.style.filter = 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.55))';
  path.style.transition = 'opacity 0.45s ease';
  svg.appendChild(path);

  setTimeout(() => {
    path.style.opacity = '0.22';
  }, 380);
}

function spawnFloatingPlusScore(targetEl, text = '+10') {
  if (!targetEl) return;
  const badge = document.createElement('span');
  badge.className = 'floating-score-pop';
  badge.textContent = text;
  targetEl.appendChild(badge);
  setTimeout(() => badge.remove(), 750);
}

function handleTwoColMatchClick(side, wordObj, el) {
  if (gameState.matchedIds.has(wordObj.id)) return;

  if (side === 'left') {
    speakWord(wordObj.word, 0.92);
    if (gameState.selectedLeftId === wordObj.id) {
      el.classList.remove('selected');
      gameState.selectedLeftId = null;
      return;
    }
    document.querySelectorAll('#matchColLeft .match-row-card').forEach(c => c.classList.remove('selected'));
    gameState.selectedLeftId = wordObj.id;
    el.classList.add('selected');
  } else {
    playSfx('flip');
    if (gameState.selectedRightId === wordObj.id) {
      el.classList.remove('selected');
      gameState.selectedRightId = null;
      return;
    }
    document.querySelectorAll('#matchColRight .match-row-card').forEach(c => c.classList.remove('selected'));
    gameState.selectedRightId = wordObj.id;
    el.classList.add('selected');
  }

  if (gameState.selectedLeftId !== null && gameState.selectedRightId !== null) {
    const leftId = gameState.selectedLeftId;
    const rightId = gameState.selectedRightId;
    const leftEl = document.querySelector(`#matchColLeft .match-row-card[data-word-id="${leftId}"]`);
    const rightEl = document.querySelector(`#matchColRight .match-row-card[data-word-id="${rightId}"]`);

    gameState.selectedLeftId = null;
    gameState.selectedRightId = null;

    if (leftId === rightId) {
      gameState.matchedIds.add(leftId);
      gameState.totalMatchedInLesson = (gameState.totalMatchedInLesson || 0) + 1;

      drawMatchConnectionBeam(leftEl, rightEl);
      spawnFloatingPlusScore(rightEl, '+10');

      [leftEl, rightEl].forEach(cardEl => {
        if (!cardEl) return;
        cardEl.classList.remove('selected');
        cardEl.classList.add('just-matched');
        setTimeout(() => {
          cardEl.classList.remove('just-matched');
          cardEl.classList.add('matched');
        }, 420);
      });

      const fillEl = document.getElementById('matchTopBarFill');
      if (fillEl && currentLessonWords.length) {
        const pct = Math.round((gameState.totalMatchedInLesson / currentLessonWords.length) * 100);
        fillEl.style.width = `${pct}%`;
      }

      userProgress.status[leftId] = 'mastered';
      gameState.score += 10;
      gameState.streak += 1;
      playSfx('correct');
      saveProgress();
      updateGameScoreUI(true);

      const batchTotal = (gameState.matchBatchWords || []).length;
      if (gameState.matchedIds.size >= batchTotal) {
        fireConfetti(26);
        if (gameState.matchBatchIndex < gameState.matchBatches.length - 1) {
          gameState.matchBatchIndex++;
          setTimeout(() => {
            const stage = document.getElementById('gameStageCard');
            if (stage) renderMatchingGame(stage);
          }, 520);
        } else {
          const elapsed = parseFloat(((Date.now() - gameState.matchStartTime) / 1000).toFixed(1));
          const prevRecord = userProgress.records.matching;
          if (!prevRecord || elapsed < prevRecord) {
            userProgress.records.matching = elapsed;
            saveProgress();
          }
          fireConfetti(65);
          setTimeout(() => {
            const stage = document.getElementById('gameStageCard');
            if (stage) {
              stage.innerHTML = `
                <div class="study-hero-icon">${ICONS.check}</div>
                <h2>Hoàn thành toàn bộ ${currentLessonWords.length} từ trong ${elapsed} giây!</h2>
                <p style="margin: 8px 0 20px; color: var(--slate-500);">Kỷ lục của bạn: <strong>${userProgress.records.matching} giây</strong></p>
                <div style="display:flex; gap:10px; justify-content:center;">
                  <button class="btn-brand-lg" style="width:auto;" onclick="initMatchingBatches(); startNewGameRound();">Chơi lại từ Đợt 1</button>
                  <button class="btn-outline-lg" style="width:auto;" onclick="backToGameMenu()">Chọn trò chơi khác</button>
                </div>
              `;
            }
          }, 480);
        }
      }
    } else {
      if (leftEl) {
        leftEl.classList.remove('selected');
        leftEl.classList.add('wrong');
      }
      if (rightEl) {
        rightEl.classList.remove('selected');
        rightEl.classList.add('wrong');
      }
      gameState.streak = 0;
      playSfx('wrong');
      updateGameScoreUI(false);
      setTimeout(() => {
        if (leftEl) leftEl.classList.remove('wrong');
        if (rightEl) rightEl.classList.remove('wrong');
      }, 440);
    }
  }
}

// ==========================================================================
// COMPACT VERDICT BANNER & ANSWER REVEAL CARD
// ==========================================================================
function showAnswerRevealCard(slotId, w, isCorrect, userAnswerText = '', targetAnswerText = '', points = 10) {
  const slot = document.getElementById(slotId);
  if (!slot) return;

  const verdictClass = isCorrect ? 'correct' : 'wrong';
  const borderClass = isCorrect ? 'border-correct' : 'border-wrong';
  const nextBtnClass = isCorrect ? 'btn-correct' : 'btn-wrong';
  const iconSVG = isCorrect ? ICONS.check : ICONS.xMark;
  const titleText = isCorrect ? 'Chính xác! Làm tốt lắm' : 'Chưa chính xác!';

  let subtitleHTML = '';
  if (isCorrect) {
    subtitleHTML = `Từ <strong>${escapeHtml(w.word)}</strong> đã qua lượt này.`;
  } else {
    subtitleHTML = `Bạn chọn/gõ: <span class="user-wrong-strike">${escapeHtml(userAnswerText || '(trống)')}</span> &rarr; Đúng: <span class="correct-target-highlight">${escapeHtml(targetAnswerText || w.word)}</span> <em>(sẽ hỏi lại sau 3 câu)</em>`;
  }

  const scoreTagText = isCorrect ? `+${points} điểm` : 'Ôn lại sau 3 câu';

  slot.innerHTML = `
    <div class="verdict-wrapper">
      <div class="verdict-banner ${verdictClass}">
        <div class="verdict-left">
          <span class="verdict-icon-badge">${iconSVG}</span>
          <div>
            <div class="verdict-title">${titleText}</div>
            <div class="verdict-subtitle">${subtitleHTML}</div>
          </div>
        </div>
        <span class="verdict-score-tag">${scoreTagText}</span>
      </div>

      <div class="answer-reveal-box ${borderClass}">
        <div class="reveal-top-row">
          <div>
            <div class="reveal-word-line">
              <span>${escapeHtml(w.word)}</span>
              ${w.pos ? `<span class="w-pos-badge">${escapeHtml(w.pos)}</span>` : ''}
              ${w.ipa ? `<span class="w-ipa">${escapeHtml(w.ipa)}</span>` : ''}
              <button class="inline-speak-btn" onclick="speakWord('${escapeJs(w.word)}', 0.92, this)" title="Phím Tab để nghe lại">${ICONS.speakerSm}</button>
            </div>
            <div class="reveal-meaning-line">${escapeHtml(w.meaning)}</div>
          </div>
          <button class="next-q-btn ${nextBtnClass}" onclick="startNewGameRound()">
            <span>Câu tiếp (Enter)</span>
            ${ICONS.arrowRight}
          </button>
        </div>
        ${w.en_example ? `<div class="reveal-example-line">${highlightWordInExample(w.en_example, w.word)} — ${escapeHtml(w.vi_example)}</div>` : ''}
      </div>
    </div>
  `;
}

function buildDistractors(targetWord, totalCount = 4) {
  const options = [targetWord];
  const localPool = currentLessonWords.filter(w => w.id !== targetWord.id && w.meaning !== targetWord.meaning);
  const sourcePool = localPool.length >= totalCount ? [...localPool] : allWords.filter(w => w.id !== targetWord.id);

  while (options.length < totalCount && sourcePool.length > 0) {
    const r = Math.floor(Math.random() * sourcePool.length);
    options.push(sourcePool.splice(r, 1)[0]);
  }
  return options.sort(() => Math.random() - 0.5);
}

function maskWordInSentence(sentence, word) {
  if (!sentence) return '_____';
  const base = word.trim();
  const regex = new RegExp(`\\b${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[a-z]*\\b`, 'gi');
  if (regex.test(sentence)) return sentence.replace(regex, '_____');
  return `${sentence} (_____)`;
}

// ==========================================================================
// 7. REVIEW SCREEN (ÔN TẬP)
// ==========================================================================
function switchReviewTab(tabType) {
  currentReviewTab = tabType;
  document.getElementById('btnReviewDue').classList.toggle('active', tabType === 'due');
  document.getElementById('btnReviewStarred').classList.toggle('active', tabType === 'starred');
  document.getElementById('btnReviewMastered').classList.toggle('active', tabType === 'mastered');
  loadReviewTab(tabType);
}

function loadReviewTab(tabType) {
  updateGlobalBadges();

  if (tabType === 'due') {
    reviewWordsList = allWords.filter(w => userProgress.status[w.id] === 'learning');
  } else if (tabType === 'starred') {
    reviewWordsList = allWords.filter(w => userProgress.starred[w.id]);
  } else if (tabType === 'mastered') {
    reviewWordsList = allWords.filter(w => userProgress.status[w.id] === 'mastered');
  }

  const container = document.getElementById('reviewWordList');
  container.innerHTML = '';

  if (!reviewWordsList.length) {
    container.innerHTML = `<div class="empty-state-box">Chưa có từ vựng nào trong mục này.</div>`;
    return;
  }

  reviewWordsList.forEach(w => {
    container.appendChild(createWordRowCard(w, true));
  });
}

function startReviewPractice(targetMode) {
  if (!reviewWordsList.length) {
    alert("Danh sách hiện đang trống! Hãy đánh dấu từ cần ôn hoặc gắn sao trước.");
    return;
  }
  activeTopicGroup = 'review';
  currentLessonWords = [...reviewWordsList];
  document.getElementById('lessonKickerText').textContent = 'Ôn tập';
  document.getElementById('lessonTitle').textContent = `Danh sách ôn tập`;
  document.getElementById('lessonWordCount').textContent = `${reviewWordsList.length} từ`;
  document.getElementById('listTotalCount').textContent = reviewWordsList.length;
  setActiveScreen('screen-lesson');
  switchMode(targetMode);
}

// ==========================================================================
// 8. GLOBAL SEARCH MODAL
// ==========================================================================
function openSearchModal() {
  const modal = document.getElementById('searchModal');
  modal.classList.add('open');
  const input = document.getElementById('globalSearchInput');
  input.value = '';
  input.focus();
  document.getElementById('globalSearchResults').innerHTML = `<div class="empty-state-box">Nhập từ khóa bất kỳ để tra cứu nhanh trong 2.372 từ vựng.</div>`;
}

function closeSearchModal(event) {
  if (event && event.target && !event.target.classList.contains('modal-backdrop') && !event.target.classList.contains('dialog-close-btn')) {
    return;
  }
  document.getElementById('searchModal').classList.remove('open');
}

function handleGlobalSearch() {
  const query = document.getElementById('globalSearchInput').value.trim().toLowerCase();
  const container = document.getElementById('globalSearchResults');

  if (!query) {
    container.innerHTML = `<div class="empty-state-box">Nhập từ khóa bất kỳ để tra cứu nhanh trong 2.372 từ vựng.</div>`;
    return;
  }

  const results = allWords.filter(w =>
    w.word.toLowerCase().includes(query) || w.meaning.toLowerCase().includes(query)
  ).slice(0, 40);

  if (!results.length) {
    container.innerHTML = `<div class="empty-state-box">Không tìm thấy kết quả phù hợp với "${escapeHtml(query)}".</div>`;
    return;
  }

  container.innerHTML = '';
  results.forEach(w => {
    const item = document.createElement('div');
    item.className = 'search-hit';
    item.onclick = () => {
      document.getElementById('searchModal').classList.remove('open');
      jumpToWord(w);
    };
    item.innerHTML = `
      <div>
        <span class="search-hit-word">${escapeHtml(w.word)}</span>
        ${w.pos ? `<span class="w-pos-badge" style="margin: 0 6px;">${escapeHtml(w.pos)}</span>` : ''}
        <span class="search-hit-meaning">${escapeHtml(w.meaning)}</span>
      </div>
      <span class="search-hit-topic">${escapeHtml(w.sub_category)}</span>
    `;
    container.appendChild(item);
  });
}

function jumpToWord(wordObj) {
  let group = 'master';
  if (wordObj.category.includes('Daily')) group = 'daily';
  else if (wordObj.category.includes('Từ vựng của tôi')) group = 'my_vocab';

  openLessonScreen(group, wordObj.sub_category);
  focusWordInDeck(wordObj.id);
}

// ==========================================================================
// 9. SPEECH SYNTHESIS (TTS)
// ==========================================================================
function speakWord(text, rate = 0.92, btnEl = null) {
  if (!text || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = rate;

  if (btnEl && btnEl.classList) {
    btnEl.classList.add('speaking');
    utter.onend = () => btnEl.classList.remove('speaking');
    utter.onerror = () => btnEl.classList.remove('speaking');
    setTimeout(() => btnEl.classList.remove('speaking'), 2000);
  }

  window.speechSynthesis.speak(utter);
}

// ==========================================================================
// 10. KEYBOARD SHORTCUTS (INCLUDING TAB TO REPLAY AUDIO IN GAMES)
// ==========================================================================
function initKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearchModal();
      return;
    }

    if (e.key === 'Escape') {
      document.getElementById('searchModal')?.classList.remove('open');
      document.getElementById('wordEditorModal')?.classList.remove('open');
      document.getElementById('iosInstallModal')?.classList.remove('open');
      return;
    }

    const modalOpen =
      document.getElementById('searchModal')?.classList.contains('open') ||
      document.getElementById('wordEditorModal')?.classList.contains('open') ||
      document.getElementById('iosInstallModal')?.classList.contains('open');
    if (modalOpen) return;

    const lessonScreenActive = document.getElementById('screen-lesson').classList.contains('active');
    if (!lessonScreenActive) return;

    // Tab or Ctrl+Space replays pronunciation in active game or flashcard even if input is focused
    if (e.key === 'Tab' || (e.ctrlKey && e.code === 'Space')) {
      if (currentMode === 'choi' && gameState.inGame && gameState.currentWord) {
        e.preventDefault();
        speakWord(gameState.currentWord.word, 0.92);
        return;
      } else if (currentMode === 'xem_tu' && currentFlashcard) {
        e.preventDefault();
        speakWord(currentFlashcard.word, 0.92);
        return;
      }
    }

    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (currentMode === 'xem_tu') {
      if (e.code === 'Space') {
        e.preventDefault();
        flipCurrentCard();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextCard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevCard();
      } else if (e.key === '1') {
        e.preventDefault();
        markCard(false);
      } else if (e.key === '2') {
        e.preventDefault();
        markCard(true);
      }
    } else if (currentMode === 'hoc' && batchState.active && batchState.phase === 'preview') {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        advanceBatchStep();
      }
    } else if (currentMode === 'choi' && gameState.inGame) {
      if (gameState.answered && (e.key === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        startNewGameRound();
      } else if (!gameState.answered && (gameState.type === 'mcq' || gameState.type === 'listen_choice')) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < 4) {
          const btns = document.querySelectorAll('#mcqOptionsGrid .mcq-option');
          if (btns[idx]) btns[idx].click();
        }
      }
    }
  });
}

function initPWA() {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Unlock Web Audio API on first iOS touch gesture
  window.addEventListener('touchstart', () => {
    getAudioContext();
  }, { once: true, passive: true });

  // Pre-warm iOS SpeechSynthesis voices
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  checkIosSafariBanner();
}

// iOS Installation Modal & Smart Safari Prompt
function openIosInstallModal() {
  const modal = document.getElementById('iosInstallModal');
  if (modal) modal.classList.add('open');

  // Refresh live IP from server if running via server.py
  if (window.location.protocol.startsWith('http')) {
    fetch('/api/host-info')
      .then(r => r.json())
      .then(info => {
        if (info && info.url) {
          const urlEl = document.getElementById('iosLocalUrlText');
          if (urlEl) urlEl.textContent = info.url;
          const qrImg = document.getElementById('iosQrImg');
          if (qrImg) qrImg.src = `qr-ios.png?t=${Date.now()}`;
        }
      })
      .catch(() => {});
  }
}

function closeIosInstallModal(event) {
  if (event && event.target && !event.target.classList.contains('modal-backdrop') && !event.target.classList.contains('dialog-close-btn')) {
    return;
  }
  const modal = document.getElementById('iosInstallModal');
  if (modal) modal.classList.remove('open');
}

function checkIosSafariBanner() {
  const ua = window.navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const dismissed = sessionStorage.getItem('ios_banner_dismissed') === '1';

  if (isIOS && !isStandalone && !dismissed) {
    const banner = document.getElementById('iosSafariBanner');
    if (banner) banner.style.display = 'flex';
  }
}

function dismissIosBanner() {
  sessionStorage.setItem('ios_banner_dismissed', '1');
  const banner = document.getElementById('iosSafariBanner');
  if (banner) banner.style.display = 'none';
}

// ==========================================================================
// 11. ADD / EDIT WORD MODAL (THÊM TỪ & SỬA TỪ VỰNG)
// ==========================================================================
function populateSubCategoryOptions() {
  const catSelect = document.getElementById('editWordCategory');
  const datalist = document.getElementById('subCategoryDatalist');
  const subInput = document.getElementById('editWordSubCategory');
  if (!catSelect || !datalist) return;

  const selectedCat = catSelect.value;
  if (selectedCat === 'Từ vựng của tôi') {
    datalist.innerHTML = `<option value="Từ vựng của tôi"></option>`;
    if (subInput && (!subInput.value || subInput.value.startsWith('Day ') || /^\d+\./.test(subInput.value))) {
      subInput.value = 'Từ vựng của tôi';
    }
    return;
  }

  const subCats = Array.from(new Set(
    allWords.filter(w => w.category === selectedCat && w.sub_category).map(w => w.sub_category)
  )).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  datalist.innerHTML = subCats.map(sc => `<option value="${escapeHtml(sc)}"></option>`).join('');
  if (subInput && (!subInput.value || !subCats.includes(subInput.value))) {
    subInput.value = subCats[0] || '';
  }
}

function togglePartChip(partCode) {
  const input = document.getElementById('editWordPart');
  if (!input) return;
  const parts = input.value.split(',').map(s => s.trim()).filter(Boolean);
  const idx = parts.indexOf(partCode);
  if (idx === -1) parts.push(partCode);
  else parts.splice(idx, 1);
  input.value = parts.join(', ');
}

function openWordEditorModal(wordId = null) {
  const modal = document.getElementById('wordEditorModal');
  if (!modal) return;

  const titleEl = document.getElementById('wordEditorTitle');
  const idInput = document.getElementById('editWordId');
  const wordInput = document.getElementById('editWordText');
  const posInput = document.getElementById('editWordPos');
  const ipaInput = document.getElementById('editWordIpa');
  const catSelect = document.getElementById('editWordCategory');
  const subInput = document.getElementById('editWordSubCategory');
  const starsSelect = document.getElementById('editWordStars');
  const meaningInput = document.getElementById('editWordMeaning');
  const enExInput = document.getElementById('editWordEnEx');
  const viExInput = document.getElementById('editWordViEx');
  const famInput = document.getElementById('editWordFamily');
  const phrInput = document.getElementById('editWordPhrases');
  const synInput = document.getElementById('editWordSynonyms');
  const antInput = document.getElementById('editWordAntonyms');
  const tipsInput = document.getElementById('editWordTips');
  const partInput = document.getElementById('editWordPart');
  const btnDelete = document.getElementById('btnDeleteCustomWord');
  const btnReset = document.getElementById('btnResetOriginalWord');

  if (wordId !== null && wordId !== undefined) {
    const w = allWords.find(item => item.id === Number(wordId));
    if (!w) return;

    titleEl.textContent = `Sửa từ vựng: ${w.word}`;
    idInput.value = String(w.id);
    wordInput.value = w.word || '';
    posInput.value = w.pos || '';
    ipaInput.value = w.ipa || '';
    catSelect.value = w.category || 'Từ vựng của tôi';
    populateSubCategoryOptions();
    subInput.value = w.sub_category || 'Từ vựng của tôi';
    starsSelect.value = String(w.stars || 2);
    meaningInput.value = w.meaning || '';
    enExInput.value = w.en_example || '';
    viExInput.value = w.vi_example || '';
    famInput.value = Array.isArray(w.word_family) ? w.word_family.join('\n') : '';
    phrInput.value = Array.isArray(w.phrases) ? w.phrases.join('\n') : '';
    synInput.value = Array.isArray(w.synonyms) ? w.synonyms.join('\n') : '';
    antInput.value = Array.isArray(w.antonyms) ? w.antonyms.join('\n') : '';
    tipsInput.value = Array.isArray(w.exam_tips) ? w.exam_tips.join('\n') : '';
    partInput.value = Array.isArray(w.part) ? w.part.join(', ') : 'LC, P5-6, P7';

    const isBase = Boolean(baseWordsMap[w.id]);
    const isEdited = Boolean(userProgress.editedWords && userProgress.editedWords[w.id]);
    if (btnDelete) btnDelete.style.display = 'inline-flex';
    if (btnReset) btnReset.style.display = (isBase && isEdited) ? 'inline-flex' : 'none';
  } else {
    titleEl.textContent = 'Thêm từ vựng mới';
    idInput.value = '';
    wordInput.value = '';
    posInput.value = '';
    ipaInput.value = '';

    // Default to current lesson's category & sub_category if currently viewing a lesson
    const lessonActive = document.getElementById('screen-lesson')?.classList.contains('active');
    if (lessonActive && currentLessonWords.length > 0 && activeTopicGroup !== 'review') {
      catSelect.value = currentLessonWords[0].category || 'Từ vựng của tôi';
      populateSubCategoryOptions();
      subInput.value = currentSubCategory || currentLessonWords[0].sub_category || 'Từ vựng của tôi';
    } else {
      catSelect.value = 'Từ vựng của tôi';
      populateSubCategoryOptions();
      subInput.value = 'Từ vựng của tôi';
    }

    starsSelect.value = '3';
    meaningInput.value = '';
    enExInput.value = '';
    viExInput.value = '';
    famInput.value = '';
    phrInput.value = '';
    synInput.value = '';
    antInput.value = '';
    tipsInput.value = '';
    partInput.value = 'LC, P5-6, P7';

    if (btnDelete) btnDelete.style.display = 'none';
    if (btnReset) btnReset.style.display = 'none';
  }

  modal.classList.add('open');
  setTimeout(() => wordInput.focus(), 60);
}

function closeWordEditorModal(event) {
  if (event && event.target && !event.target.classList.contains('modal-backdrop') && !event.target.classList.contains('dialog-close-btn')) {
    return;
  }
  const modal = document.getElementById('wordEditorModal');
  if (modal) modal.classList.remove('open');
}

function parseLinesToArray(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function saveWordEditorForm(event) {
  event.preventDefault();

  const rawId = document.getElementById('editWordId').value.trim();
  const word = document.getElementById('editWordText').value.trim();
  const pos = document.getElementById('editWordPos').value.trim();
  const ipa = document.getElementById('editWordIpa').value.trim();
  const category = document.getElementById('editWordCategory').value;
  const sub_category = document.getElementById('editWordSubCategory').value.trim() || category;
  const stars = Number(document.getElementById('editWordStars').value) || 2;
  const meaning = document.getElementById('editWordMeaning').value.trim();
  const en_example = document.getElementById('editWordEnEx').value.trim();
  const vi_example = document.getElementById('editWordViEx').value.trim();

  const word_family = parseLinesToArray(document.getElementById('editWordFamily').value);
  const phrases = parseLinesToArray(document.getElementById('editWordPhrases').value);
  const synonyms = parseLinesToArray(document.getElementById('editWordSynonyms').value);
  const antonyms = parseLinesToArray(document.getElementById('editWordAntonyms').value);
  const exam_tips = parseLinesToArray(document.getElementById('editWordTips').value);
  const part = document.getElementById('editWordPart').value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (!word || !meaning) return;

  const payload = {
    word,
    pos,
    ipa,
    category,
    sub_category,
    stars,
    meaning,
    en_example,
    vi_example,
    word_family,
    phrases,
    synonyms,
    antonyms,
    exam_tips,
    part
  };

  let targetId = null;

  if (rawId) {
    targetId = Number(rawId);
    if (!userProgress.editedWords) userProgress.editedWords = {};
    userProgress.editedWords[targetId] = payload;

    // Also update in customWords if it's a custom word
    if (Array.isArray(userProgress.customWords)) {
      const cwIdx = userProgress.customWords.findIndex(cw => cw.id === targetId);
      if (cwIdx !== -1) {
        userProgress.customWords[cwIdx] = { id: targetId, ...payload };
      }
    }
  } else {
    const maxId = allWords.reduce((max, item) => Math.max(max, Number(item.id) || 0), 2400);
    targetId = maxId + 1;
    const newWordObj = { id: targetId, ...payload };
    if (!Array.isArray(userProgress.customWords)) userProgress.customWords = [];
    userProgress.customWords.unshift(newWordObj);
    userProgress.status[targetId] = 'new';
  }

  rebuildAllWordsList();
  saveProgress();
  playSfx('correct');

  const modal = document.getElementById('wordEditorModal');
  if (modal) modal.classList.remove('open');

  refreshActiveViewAfterWordChange(targetId, !rawId, category, sub_category);
}

function resetEditedWordToDefault() {
  const rawId = document.getElementById('editWordId').value.trim();
  if (!rawId) return;
  const wordId = Number(rawId);
  if (userProgress.editedWords && userProgress.editedWords[wordId]) {
    delete userProgress.editedWords[wordId];
  }
  rebuildAllWordsList();
  saveProgress();
  playSfx('flip');
  const modal = document.getElementById('wordEditorModal');
  if (modal) modal.classList.remove('open');
  refreshActiveViewAfterWordChange(wordId, false);
}

function deleteCurrentWordInEditor() {
  const rawId = document.getElementById('editWordId').value.trim();
  if (!rawId) return;
  const wordId = Number(rawId);
  const w = allWords.find(item => item.id === wordId);
  if (!w) return;

  if (!confirm(`Bạn có chắc muốn xóa từ "${w.word}" khỏi danh sách?`)) return;

  if (!userProgress.deletedIds) userProgress.deletedIds = {};
  userProgress.deletedIds[wordId] = true;
  if (Array.isArray(userProgress.customWords)) {
    userProgress.customWords = userProgress.customWords.filter(cw => cw.id !== wordId);
  }
  if (userProgress.editedWords && userProgress.editedWords[wordId]) {
    delete userProgress.editedWords[wordId];
  }

  rebuildAllWordsList();
  saveProgress();
  playSfx('flip');

  const modal = document.getElementById('wordEditorModal');
  if (modal) modal.classList.remove('open');

  refreshActiveViewAfterWordChange(null, false);
}

function refreshActiveViewAfterWordChange(targetId = null, isNewWord = false, category = '', sub_category = '') {
  // Update Hub My Vocab count pill dynamically
  const myVocabCount = allWords.filter(w => w.category === 'Từ vựng của tôi').length;
  const hubMyPill = document.querySelector('.hub-card[onclick*="my_vocab"] .hub-pill');
  if (hubMyPill) hubMyPill.textContent = `${myVocabCount} từ`;

  const lessonActive = document.getElementById('screen-lesson')?.classList.contains('active');
  const reviewActive = document.getElementById('screen-review')?.classList.contains('active');
  const topicsActive = document.getElementById('screen-topics')?.classList.contains('active');

  if (lessonActive) {
    if (activeTopicGroup === 'my_vocab') {
      currentLessonWords = allWords.filter(w => w.category === 'Từ vựng của tôi');
    } else if (activeTopicGroup === 'review') {
      loadReviewTab(currentReviewTab);
      currentLessonWords = [...reviewWordsList];
    } else {
      currentLessonWords = allWords.filter(w => w.sub_category === currentSubCategory);
    }

    document.getElementById('lessonWordCount').textContent = `${currentLessonWords.length} từ`;
    document.getElementById('listTotalCount').textContent = currentLessonWords.length;

    if (targetId !== null) {
      const idx = currentLessonWords.findIndex(w => w.id === targetId);
      if (idx !== -1) {
        currentFcIndex = idx;
        currentFlashcard = currentLessonWords[idx];
      } else if (isNewWord && category && sub_category) {
        // Jump directly to the lesson where the new word was added
        let grp = 'my_vocab';
        if (category.includes('Daily')) grp = 'daily';
        else if (category.includes('Master')) grp = 'master';
        openLessonScreen(grp, sub_category);
        focusWordInDeck(targetId);
        return;
      }
    } else {
      currentFcIndex = Math.min(currentFcIndex, Math.max(0, currentLessonWords.length - 1));
      currentFlashcard = currentLessonWords[currentFcIndex] || null;
    }

    syncFlashcardDOM();
    renderWordList();
  } else if (reviewActive) {
    loadReviewTab(currentReviewTab);
  } else if (topicsActive) {
    if (activeTopicGroup === 'daily') renderDailyTopicsGrid(dailyPart);
    else if (activeTopicGroup === 'master') renderMasterTopicsGrid();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
