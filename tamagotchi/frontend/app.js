// ============================================================================
// Tamagotchi as a Service — Frontend Application
// ============================================================================

const API_BASE = window.TAMAGOTCHI_API_URL || '/api';
const REFRESH_INTERVAL = 5000; // Refresh creature stats every 5 seconds

// Creature type emoji map
const TYPE_EMOJI = {
  dragon: '🐉',
  cat: '🐱',
  robot: '🤖',
  plant: '🌱',
  alien: '👽',
};

// i18n translations
const i18n = {
  en: {
    adopt_title: 'Adopt a Creature',
    name_label: 'Name',
    type_label: 'Type',
    cancel: 'Cancel',
    adopt_btn: 'Adopt! 🎉',
    hunger: 'Hunger',
    happiness: 'Happiness',
    energy: 'Energy',
    feed: '🍖 Feed',
    play: '🎮 Play',
    sleep: '💤 Sleep',
    revive: '✨ Revive',
    alive: 'Alive',
    dead: 'Dead',
    empty_title: 'No creatures yet!',
    empty_subtitle: 'Click the + button to adopt your first creature.',
  },
  fr: {
    adopt_title: 'Adopter une Créature',
    name_label: 'Nom',
    type_label: 'Type',
    cancel: 'Annuler',
    adopt_btn: 'Adopter ! 🎉',
    hunger: 'Faim',
    happiness: 'Bonheur',
    energy: 'Énergie',
    feed: '🍖 Nourrir',
    play: '🎮 Jouer',
    sleep: '💤 Dormir',
    revive: '✨ Ressusciter',
    alive: 'Vivant',
    dead: 'Mort',
    empty_title: 'Pas encore de créatures !',
    empty_subtitle: 'Cliquez sur le bouton + pour adopter votre première créature.',
  },
};

let currentLang = 'en';
let creatures = [];

// ---- i18n ----
function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n.en[key] || key;
}

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  renderCreatures();
}

// ---- API Calls ----
async function fetchCreatures() {
  try {
    const res = await fetch(`${API_BASE}/creatures`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    creatures = await res.json();
    renderCreatures();
    updateGlobalStats();
  } catch (err) {
    console.error('Failed to fetch creatures:', err);
  }
}

async function fetchGlobalStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const stats = await res.json();
    document.getElementById('aliveCount').textContent = stats.alive_count || 0;
    document.getElementById('deadCount').textContent = stats.dead_count || 0;
    document.getElementById('starvingCount').textContent = stats.starving_count || 0;
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
}

function updateGlobalStats() {
  const alive = creatures.filter(c => c.is_alive).length;
  const dead = creatures.filter(c => !c.is_alive).length;
  const starving = creatures.filter(c => c.is_alive && c.hunger > 80).length;
  document.getElementById('aliveCount').textContent = alive;
  document.getElementById('deadCount').textContent = dead;
  document.getElementById('starvingCount').textContent = starving;
}

async function adoptCreature(name, type) {
  try {
    const res = await fetch(`${API_BASE}/creatures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const creature = await res.json();
    showToast(`${creature.name} ${TYPE_EMOJI[creature.type]} has been adopted!`);
    await fetchCreatures();
  } catch (err) {
    showToast(`Failed to adopt creature: ${err.message}`);
  }
}

async function creatureAction(id, action) {
  try {
    const res = await fetch(`${API_BASE}/creatures/${id}/${action}`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json();
      showToast(data.error || `Action failed`);
      return;
    }
    const data = await res.json();
    showToast(data.message);
    await fetchCreatures();
  } catch (err) {
    showToast(`Action failed: ${err.message}`);
  }
}

// ---- Rendering ----
function getStatColor(stat, value) {
  if (stat === 'hunger') {
    if (value > 80) return 'var(--accent-red)';
    if (value > 50) return 'var(--accent-orange)';
    return 'var(--accent-green)';
  }
  if (value < 20) return 'var(--accent-red)';
  if (value < 50) return 'var(--accent-yellow)';
  return stat === 'happiness' ? 'var(--accent-purple)' : 'var(--accent-cyan)';
}

function renderCreatures() {
  const grid = document.getElementById('creaturesGrid');

  if (creatures.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__emoji">🥚</div>
        <h2 class="empty-state__title">${t('empty_title')}</h2>
        <p>${t('empty_subtitle')}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = creatures.map(c => {
    const emoji = TYPE_EMOJI[c.type] || '❓';
    const statusClass = c.is_alive ? 'alive' : 'dead';
    const statusText = c.is_alive ? t('alive') : t('dead');

    const hungerDisplay = c.is_alive ? Math.round(c.hunger) : 0;
    const happinessDisplay = c.is_alive ? Math.round(c.happiness) : 0;
    const energyDisplay = c.is_alive ? Math.round(c.energy) : 0;

    return `
      <div class="creature-card ${c.is_alive ? '' : 'dead'}">
        <div class="creature-card__header">
          <div style="display:flex;align-items:center;gap:1rem;">
            <div class="creature-card__avatar">${c.is_alive ? emoji : '💀'}</div>
            <div class="creature-card__info">
              <h3>${escapeHtml(c.name)}</h3>
              <span class="creature-card__type">${escapeHtml(c.type)}</span>
            </div>
          </div>
          <span class="creature-card__status ${statusClass}">${statusText}</span>
        </div>

        <div class="creature-card__stats">
          <div class="stat-bar">
            <div class="stat-bar__label">
              <span>🍖 ${t('hunger')}</span>
              <span>${hungerDisplay}%</span>
            </div>
            <div class="stat-bar__track">
              <div class="stat-bar__fill hunger" style="width:${hungerDisplay}%"></div>
            </div>
          </div>
          <div class="stat-bar">
            <div class="stat-bar__label">
              <span>😊 ${t('happiness')}</span>
              <span>${happinessDisplay}%</span>
            </div>
            <div class="stat-bar__track">
              <div class="stat-bar__fill happiness" style="width:${happinessDisplay}%"></div>
            </div>
          </div>
          <div class="stat-bar">
            <div class="stat-bar__label">
              <span>⚡ ${t('energy')}</span>
              <span>${energyDisplay}%</span>
            </div>
            <div class="stat-bar__track">
              <div class="stat-bar__fill energy" style="width:${energyDisplay}%"></div>
            </div>
          </div>
        </div>

        <div class="creature-card__actions">
          ${c.is_alive ? `
            <button class="action-btn" onclick="creatureAction('${c.id}', 'feed')">${t('feed')}</button>
            <button class="action-btn" onclick="creatureAction('${c.id}', 'play')">${t('play')}</button>
            <button class="action-btn" onclick="creatureAction('${c.id}', 'sleep')">${t('sleep')}</button>
          ` : `
            <button class="action-btn revive" onclick="creatureAction('${c.id}', 'revive')">${t('revive')}</button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

// ---- Utilities ----
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ---- Modal ----
const adoptModal = document.getElementById('adoptModal');
const adoptForm = document.getElementById('adoptForm');
let selectedType = 'dragon';

document.getElementById('adoptBtn').addEventListener('click', () => {
  adoptModal.classList.add('active');
});

document.getElementById('cancelAdopt').addEventListener('click', () => {
  adoptModal.classList.remove('active');
});

adoptModal.addEventListener('click', (e) => {
  if (e.target === adoptModal) adoptModal.classList.remove('active');
});

document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedType = btn.dataset.type;
  });
});

adoptForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('creatureName').value.trim();
  if (!name) return;
  await adoptCreature(name, selectedType);
  adoptModal.classList.remove('active');
  adoptForm.reset();
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('.type-btn[data-type="dragon"]').classList.add('selected');
  selectedType = 'dragon';
});

// ---- Language ----
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

// ---- Init ----
fetchCreatures();
setInterval(fetchCreatures, REFRESH_INTERVAL);
