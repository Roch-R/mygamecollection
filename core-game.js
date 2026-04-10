// ============================================
 // GAMEZONE CORE - Management & Utilities
// ============================================

// Global state
const gameState = {
    currentGame: null,
    scores: JSON.parse(localStorage.getItem('gameZoneScores')) || [],
    audioEnabled: true
};

// Audio System (simplified)
let audioContext = null;

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gameState.audioEnabled = localStorage.getItem('gameAudioEnabled') !== 'false';
    } catch (e) {
        gameState.audioEnabled = false;
    }
}

function playSound(type) {
    if (!gameState.audioEnabled || !audioContext) return;
    // Simplified sound player
    console.log('Sound:', type); // Placeholder for game-specific sounds
}

// Navigation
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('nav-menu');
if (navToggle) navToggle.addEventListener('click', toggleNav);
function toggleNav() {
    navMenu.classList.toggle('active');
}

window.addEventListener('scroll', () => {
    document.querySelector('.navbar')?.classList.toggle('scrolled', window.scrollY > 50);
});

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.querySelector('.toast-container') || (() => {
        const c = document.createElement('div');
        c.className = 'toast-container';
        document.body.appendChild(c);
        return c;
    })();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Game Management
function startGame(game) {
    gameState.currentGame = game;
    document.getElementById('game-arena')?.classList.add('active');
    document.querySelectorAll('.game-area').forEach(area => area.classList.add('hidden'));
    const gameArea = document.getElementById(`${game}-game`);
    if (gameArea) gameArea.classList.remove('hidden');
    
    // Call game-specific init if exists
    if (window[`${game}Init`]) {
        window[`${game}Init`]();
    } else {
        showToast('Game not loaded!', 'error');
    }
    
    gameArea?.scrollIntoView({ behavior: 'smooth' });
}

function closeGame() {
    const current = gameState.currentGame;   // save BEFORE nulling
    gameState.currentGame = null;
    document.getElementById('game-arena')?.classList.remove('active');
    document.querySelectorAll('.game-area').forEach(area => area.classList.add('hidden'));
    // Call game-specific cleanup so music/loops stop
    if (current && window[`${current}Cleanup`]) window[`${current}Cleanup`]();
}

function saveScore(gameName, score) {
    const entry = { 
        game: gameName, 
        score, 
        date: new Date().toLocaleDateString() 
    };
    gameState.scores.push(entry);
    gameState.scores.sort((a, b) => b.score - a.score);
    gameState.scores = gameState.scores.slice(0, 10);
    localStorage.setItem('gameZoneScores', JSON.stringify(gameState.scores));
    updateLeaderboard();
}

function updateLeaderboard() {
    const list = document.getElementById('top-scores');
    if (!list) return;
    list.innerHTML = gameState.scores.length ? 
        gameState.scores.map((entry, i) => 
            `<li><span class="rank">${['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
             <span class="name">${entry.game}</span>
             <span class="points">${entry.score.toLocaleString()}</span></li>`
        ).join('') : 
        '<li class="empty-leaderboard"><i class="fas fa-gamepad"></i>No scores yet!</li>';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    updateLeaderboard();
    showToast('GameZone Ready! 🎮', 'success');
});

