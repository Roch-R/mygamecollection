/* ============================================
   GAMEZONE - COMPLETE FIXED GAME JAVASCRIPT
   ALL 5 GAMES WITH FLAPPY BIRD FEATURES
   ============================================ */

/* ── Theme switcher ── */
const THEMES = [
    { cls: '',            label: 'Dark'  },
    { cls: 'theme-neon',  label: 'Neon'  },
    { cls: 'theme-retro', label: 'Retro' }
];
let _themeIdx = parseInt(localStorage.getItem('gz-theme') || '0');
(function applyTheme() {
    document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
    if (THEMES[_themeIdx].cls) document.body.classList.add(THEMES[_themeIdx].cls);
    const lbl = document.getElementById('theme-label');
    if (lbl) lbl.textContent = THEMES[_themeIdx].label;
})();
/* ── Share Score ── */
function shareScore() {
    var scores = [];
    try { scores = JSON.parse(localStorage.getItem('gameScores') || '[]'); } catch(e) {}
    var best = scores.slice(0,3).map(function(s){ return s.game + ': ' + s.score; }).join(', ');
    var text = best ? 'My best scores on GameZone 🎮 — ' + best + '! Can you beat me? Play free at ' : 'Play 12+ free games on GameZone 🎮 ';
    var url = 'https://roch-r.github.io/mygamecollection/';
    if (navigator.share) {
        navigator.share({ title: 'GameZone - Play & Win', text: text, url: url }).catch(function(){});
    } else {
        var ta = document.createElement('textarea');
        ta.value = text + url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        if (window._toast) _toast('Link copied to clipboard!', 'success');
        else alert('Copied: ' + url);
    }
}

function cycleTheme() {
    _themeIdx = (_themeIdx + 1) % THEMES.length;
    localStorage.setItem('gz-theme', _themeIdx);
    document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
    if (THEMES[_themeIdx].cls) document.body.classList.add(THEMES[_themeIdx].cls);
    const lbl = document.getElementById('theme-label');
    if (lbl) lbl.textContent = THEMES[_themeIdx].label;
}

/* ── Haptic feedback helper ── */
function haptic(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms || 18); } catch(e) {}
}
/* Auto-attach haptic to all game buttons on touch */
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('touchstart', function(e) {
        var t = e.target.closest('button, .play-btn, .tbb-btn, .tcp-btn, .tetris-ctrl-btn, .car-btn');
        if (t) haptic(15);
    }, {passive: true});
});

// ============================================
// GLOBAL VARIABLES & STATE
// ============================================

const gameState = {
    currentGame: null,
    scores: JSON.parse(localStorage.getItem('gameZoneScores')) || [],
    clicker: {
        score: 0,
        clickPower: 1,
        autoClick: 0,
        multiplier: 1,
        clickCost: 10,
        autoCost: 50,
        multiCost: 100,
        autoInterval: null
    },
    memory: {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        timer: null,
        time: 0,
        isLocked: false,
        totalPairs: 8
    },
    rps: {
        playerScore: 0,
        compScore: 0,
        rounds: 0
    },
    snake: {
        canvas: null,
        ctx: null,
        snake: [],
        food: null,
        direction: 'right',
        nextDirection: 'right',
        score: 0,
        highScore: parseInt(localStorage.getItem('snakeHighScore')) || 0,
        gameLoop: null,
        isRunning: false,
        gridSize: 20,
        speed: 150
    },

    shooter1945: {
        canvas: null,
        ctx: null,
        player: null,
        bullets: [],
        enemies: [],
        bossBullets: [],
        powerUps: [],
        explosions: [],
        stars: [],
        score: 0,
        highScore: parseInt(localStorage.getItem('shooter1945HighScore')) || 0,
        level: 1,
        lives: 5,
        gameLoop: null,
        isRunning: false,
        isGameOver: false,
        isPaused: false,
        frameCount: 0,
        boss: null,
        bossActive: false,
        bossDefeated: 0,
        enemySpawnRate: 90,
        lastTime: 0,
        shootInterval: null,
        powerType: 'single',
        powerLevel: 1,
        invincible: false,
        invincibleTimer: 0,
        scrollY: 0,
        keys: {}
    },
    skyjump: {
        canvas: null,
        ctx: null,
        player: null,
        platforms: [],
        clouds: [],
        stars: [],
        rocks: [],
        score: 0,
        highScore: parseInt(localStorage.getItem('skyjumpHighScore')) || 0,
        gameLoop: null,
        isRunning: false,
        isGameOver: false,
        frameCount: 0,
        gravity: 0.5,
        jumpStrength: -12,
        cameraY: 0,
        currentZone: 'ground',
        zoneThreshold1: 1000,
        zoneThreshold2: 3000,
        lastPlatformY: 0,
        platformSpawnDistance: 80
    }
};


// ============================================
// AUDIO SYSTEM — CLEAN, NO NOISE
// ============================================

let gameAudioContext = null;
let gameAudioEnabled = true;
let gameBackgroundMusic = null;
let gameMusicGainNode = null;

function initGameAudio() {
    try {
        if (!gameAudioContext) {
            gameAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        gameAudioEnabled = localStorage.getItem('gameAudioEnabled') !== 'false';
        if (gameAudioContext.state === 'suspended') {
            gameAudioContext.resume();
        }
    } catch (e) {
        console.log('Web Audio API not supported');
        gameAudioEnabled = false;
    }
}

// Clean tone helper — always sine wave, always gentle
function _playTone(freq, duration, vol, type = 'sine', endFreq = null) {
    if (!gameAudioEnabled || !gameAudioContext) return;
    if (gameAudioContext.state === 'suspended') gameAudioContext.resume();
    try {
        const osc  = gameAudioContext.createOscillator();
        const gain = gameAudioContext.createGain();
        osc.connect(gain);
        gain.connect(gameAudioContext.destination);
        const now = gameAudioContext.currentTime;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (endFreq !== null) {
            osc.frequency.linearRampToValueAtTime(endFreq, now + duration * 0.8);
        }
        gain.gain.setValueAtTime(Math.min(vol, 0.22), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.start(now);
        osc.stop(now + duration);
    } catch (e) {}
}

function playGameSound(type, volume = 0.18) {
    if (!gameAudioEnabled) return;
    if (!gameAudioContext) {
        try { gameAudioContext = new (window.AudioContext || window.webkitAudioContext)(); }
        catch(e) { return; }
    }
    const v = Math.min(volume, 0.22);

    switch (type) {
        case 'shoot':
            // Very soft short tick — won't be annoying at rapid fire rate
            _playTone(1000, 0.055, v * 0.28, 'sine', 750);
            break;

        case 'explosion':
            _playTone(90, 0.2, v * 0.4, 'sine', 50);
            break;

        case 'powerup':
            _playTone(523, 0.08, v * 0.5);
            setTimeout(() => _playTone(659, 0.08, v * 0.5), 80);
            setTimeout(() => _playTone(784, 0.12, v * 0.5), 160);
            break;

        case 'levelup':
            _playTone(440, 0.09, v * 0.5);
            setTimeout(() => _playTone(554, 0.09, v * 0.5), 100);
            setTimeout(() => _playTone(659, 0.09, v * 0.5), 200);
            setTimeout(() => _playTone(880, 0.18, v * 0.5), 300);
            break;

        case 'success':
            _playTone(659, 0.09, v * 0.45);
            setTimeout(() => _playTone(784, 0.09, v * 0.45), 100);
            setTimeout(() => _playTone(1047, 0.18, v * 0.45), 200);
            break;

        case 'error':
            _playTone(260, 0.22, v * 0.4, 'sine', 200);
            break;

        case 'eat':
        case 'score':
            _playTone(880, 0.1, v * 0.35, 'sine', 660);
            break;

        case 'click':
            _playTone(1000, 0.06, v * 0.25);
            break;

        case 'gameover':
            _playTone(440, 0.14, v * 0.4);
            setTimeout(() => _playTone(330, 0.14, v * 0.4), 150);
            setTimeout(() => _playTone(220, 0.22, v * 0.4), 300);
            break;

        case 'move':
            _playTone(380, 0.04, v * 0.12);
            break;

        case 'clear':
            _playTone(523,  0.07, v * 0.4);
            setTimeout(() => _playTone(659,  0.07, v * 0.4), 75);
            setTimeout(() => _playTone(784,  0.07, v * 0.4), 150);
            setTimeout(() => _playTone(1047, 0.14, v * 0.4), 225);
            break;

        case 'flap':
            _playTone(500, 0.07, v * 0.3, 'sine', 700);
            break;

        default:
            _playTone(600, 0.08, v * 0.25);
    }
}

// Background music: intentionally silent — raw oscillators sound like noise
function startGameBackgroundMusic(gameType = 'menu') {
    stopGameBackgroundMusic(); // always stop any previous
    // No background music — oscillator drones are unpleasant
    // Uncomment below if you add real audio files in the future:
    // playBackgroundAudioFile(`music/${gameType}.mp3`);
}

function stopGameBackgroundMusic() {
    if (gameBackgroundMusic && gameAudioContext) {
        try {
            if (gameMusicGainNode) {
                gameMusicGainNode.gain.exponentialRampToValueAtTime(
                    0.001, gameAudioContext.currentTime + 0.3
                );
            }
            ['oscillator1','oscillator2','lfo'].forEach(k => {
                try { gameBackgroundMusic[k]?.stop(gameAudioContext.currentTime + 0.3); } catch(e) {}
            });
        } catch(e) {}
        gameBackgroundMusic = null;
    }
}

function toggleGameAudio() {
    gameAudioEnabled = !gameAudioEnabled;
    localStorage.setItem('gameAudioEnabled', gameAudioEnabled);
    if (!gameAudioEnabled) stopGameBackgroundMusic();
    return gameAudioEnabled;
}

function updateGameMusic(gameType) {
    // no-op: no background music
}

// Legacy alias used by some game files
function playSound(type) {
    playGameSound(type, 0.18);
}

// ============================================
// CANVAS ROUNDRECT POLYFILL
// ============================================

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radii) {
        const r = Math.min(Array.isArray(radii) ? radii[0] : (radii || 0), width / 2, height / 2);
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + width - r, y);
        this.quadraticCurveTo(x + width, y, x + width, y + r);
        this.lineTo(x + width, y + height - r);
        this.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        this.lineTo(x + r, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
        return this;
    };
}

// ============================================
// NAVIGATION
// ============================================

const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const isOpen = navMenu.classList.contains('active');
    navToggle.setAttribute('aria-expanded', isOpen);
    const icon = navToggle.querySelector('i');
    icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', closeNav);
    }
    overlay.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
});

function closeNav() {
    navMenu.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    const icon = navToggle.querySelector('i');
    icon.className = 'fas fa-bars';
    const overlay = document.querySelector('.nav-overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeNav);
});

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    toast.innerHTML = `<i class="${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}

// ============================================
// CONFETTI EFFECT
// ============================================

function showConfetti() {
    const colors = ['#667eea', '#764ba2', '#ffd700', '#2ed573', '#ff4757', '#ff6b81', '#70a1ff'];
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.animationDuration = Math.random() * 2 + 2 + 's';
            document.body.appendChild(confetti);
            setTimeout(() => { if (confetti.parentNode) confetti.remove(); }, 4000);
        }, i * 30);
    }
}

// ============================================
// GAME MANAGEMENT
// ============================================

const GAME_DIV_ID_MAP = {
    carracing: 'car-racing-game'
};

function startGame(game) {
    stopAllGames();  // always stop any running game before starting a new one
    initGameAudio();
    gameState.currentGame = game;
    if (window.GZAch) GZAch.recordGame(game, 0);

    document.getElementById('game-arena').classList.add('active');
    document.querySelectorAll('.game-area').forEach(area => area.classList.add('hidden'));
    document.body.classList.add('game-active');
    const footer = document.querySelector('.sticky-footer');
    if (footer) footer.style.display = 'none';

    const divId = GAME_DIV_ID_MAP[game] || `${game}-game`;
    const gameDiv = document.getElementById(divId);
    if (!gameDiv) {
        console.error(`Cannot find game div: #${divId}`);
        showToast('Game not found!', 'error');
        return;
    }
    gameDiv.classList.remove('hidden');

    document.getElementById('game-arena').scrollIntoView({ behavior: 'smooth' });

    if (game === 'carracing') {
        setTimeout(() => {
            if (typeof initCarRacing === 'function') initCarRacing();
        }, 250);
    } else {
        switch (game) {
            case 'flappy':      initFlappy();       break;
            case 'clicker':     initClicker();      break;
            case 'memory':      initMemory();       break;
            case 'rps':         initRPS();          break;
            case 'snake':       initSnake();        break;
            case 'tetris':      initTetris();       break;
            case 'shooter1945': initShooter1945();  break;
            case 'skyjump':     initSkyjump();      break;
            case 'wordsearch':  initWordSearch();   break;
            case 'pacman':      initPacman();       break;
            case 'blockblast':   initBlockBlast();   break;
            case 'game2048':     if(window.init2048) init2048(); break;
            case 'minesweeper':  if(window.initMinesweeper) initMinesweeper(); break;
            case 'memorymatch':  if(window.initMemoryMatch) initMemoryMatch(); break;
            case 'breakout':     if(window.initBreakout) { document.getElementById('breakout-over').style.display='none'; initBreakout(); } break;
        }
    }

    showToast(`Starting ${getGameName(game)}!`, 'info');
}

function restartBreakout() {
    if (window.initBreakout) {
        document.getElementById('breakout-over').style.display = 'none';
        initBreakout();
    }
}

function closeGame() {
    stopAllGames();

    ['.tetris-gameover', '.shooter1945-gameover', '.flappy-gameover',
     '#car-start-overlay', '#car-finish-overlay', '#car-countdown'].forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.remove();
    });

    gameState.currentGame = null;
    document.getElementById('game-arena').classList.remove('active');
    document.querySelectorAll('.game-area').forEach(area => area.classList.add('hidden'));
    document.body.classList.remove('game-active');
    const footer = document.querySelector('.sticky-footer');
    if (footer) footer.style.display = '';
    /* Hide tetris bottom bar when leaving game */
    var tbar = document.getElementById('tetris-bottom-bar');
    if (tbar) tbar.classList.remove('visible');
}

function stopAllGames() {
    // Stop music first — most important, music keeps playing even after loop stops
    if (typeof stopShooterMusic === 'function') stopShooterMusic();
    if (typeof stopFlappyMusic  === 'function') stopFlappyMusic();
    if (typeof stopFlappyAmbient === 'function') stopFlappyAmbient();

    // Flappy
    const flappyState = window.flappyState || {};
    if (flappyState.gameLoop) {
        cancelAnimationFrame(flappyState.gameLoop);
        flappyState.gameLoop = null;
    }
    const flappyOverlay = document.querySelector('.flappy-gameover');
    if (flappyOverlay) flappyOverlay.remove();

    // Car Racing
    const racingState = window.racingState || {};
    if (racingState.gameLoop) {
        cancelAnimationFrame(racingState.gameLoop);
        racingState.gameLoop = null;
        racingState.isRunning = false;
    }
    if (racingState.countdownTimer) {
        clearInterval(racingState.countdownTimer);
        racingState.countdownTimer = null;
    }

    // Other games
    if (gameState.clicker.autoInterval)  { clearInterval(gameState.clicker.autoInterval);  gameState.clicker.autoInterval = null; }
    if (gameState.memory.timer)          { clearInterval(gameState.memory.timer);           gameState.memory.timer = null; }
    if (gameState.snake.gameLoop)        { clearInterval(gameState.snake.gameLoop);         gameState.snake.gameLoop = null; gameState.snake.isRunning = false; }
    if (gameState.tetris && gameState.tetris.gameLoop) {
        cancelAnimationFrame(gameState.tetris.gameLoop);
        gameState.tetris.gameLoop = null;
        gameState.tetris.isRunning = false;
    }
    if (gameState.shooter1945.gameLoop)  { cancelAnimationFrame(gameState.shooter1945.gameLoop);  gameState.shooter1945.gameLoop = null;  gameState.shooter1945.isRunning = false; }
    if (gameState.shooter1945.shootInterval) { clearInterval(gameState.shooter1945.shootInterval); gameState.shooter1945.shootInterval = null; }

    // Word Search
    if (window.wordSearchState && window.wordSearchState.timer) {
        clearInterval(window.wordSearchState.timer);
        window.wordSearchState.timer = null;
        window.wordSearchState.isRunning = false;
    }
    ['.wordsearch-gameover', '.wordsearch-complete'].forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.remove();
    });

    // Stop any music
    stopGameBackgroundMusic();
}

function getGameName(game) {
    const names = {
        flappy:      'Flappy Bird',
        clicker:     'Clicker Hero',
        memory:      'Memory Match',
        rps:         'Rock Paper Scissors',
        snake:       'Snake Adventure',
        tetris:      'Tetris',
        shooter1945: '1945 Shooter',
        skyjump:     'Sky Jump',
        wordsearch:  'Word Search',
        pacman:      'Pacman',
        blockblast:   'Block Blast',
        carracing:    '3D Car Racing',
        game2048:     '2048',
        minesweeper:  'Minesweeper',
        memorymatch:  'Memory Match',
        breakout:     'Breakout',
    };
    return names[game] || game;
}

// ============================================
// SCORE MANAGEMENT
// ============================================

function saveScore(game, score) {
    const entry = { game: getGameName(game), score: score, date: new Date().toLocaleDateString(), id: Date.now() };
    gameState.scores.push(entry);
    gameState.scores.sort((a, b) => b.score - a.score);
    gameState.scores = gameState.scores.slice(0, 10);
    localStorage.setItem('gameZoneScores', JSON.stringify(gameState.scores));
    updateLeaderboard();
}

function clearAllScores() {
    gameState.scores = [];
    localStorage.removeItem('gameZoneScores');
    localStorage.removeItem('flappyHighScore');
    localStorage.removeItem('snakeHighScore');
    localStorage.removeItem('tetrisHighScore');
    localStorage.removeItem('shooter1945HighScore');
    window.flappyState = window.flappyState || {};
    window.flappyState.highScore = 0;
    gameState.snake.highScore = 0;
    if (gameState.tetris) gameState.tetris.highScore = 0;
    gameState.shooter1945.highScore = 0;
    updateLeaderboard();
    showToast('All scores cleared!', 'info');
}

function updateLeaderboard() {
    const scoresList = document.getElementById('top-scores');
    scoresList.innerHTML = '';
    if (gameState.scores.length === 0) {
        scoresList.innerHTML = `<div class="empty-leaderboard"><i class="fas fa-gamepad"></i><p>No scores yet! Play a game to get on the leaderboard.</p></div>`;
        return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    gameState.scores.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="rank">${medals[index] || `#${index + 1}`}</span><span class="name">${entry.game}</span><span class="points">${entry.score.toLocaleString()} pts</span>`;
        scoresList.appendChild(li);
    });
}

// ============================================
// KEYBOARD SHORTCUT FOR RESTART
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        if (gameState.currentGame === 'flappy') {
            const overlay = document.querySelector('.flappy-gameover');
            if (overlay) closeFlappyGameOver();
        }
        if (gameState.currentGame === 'tetris') {
            const overlay = document.querySelector('.tetris-gameover');
            if (overlay) closeTetrisGameOver();
        }
        if (gameState.currentGame === 'shooter1945') {
            const overlay = document.querySelector('.shooter1945-gameover');
            if (overlay) closeShooterGameOver();
        }
    }
});

// ============================================
// WINDOW RESIZE HANDLER
// ============================================

window.addEventListener('resize', () => {
    if (gameState.currentGame === 'snake') {
        const state = gameState.snake;
        const maxSize = Math.min(400, window.innerWidth - 60);
        if (state.canvas) {
            state.canvas.width = maxSize;
            state.canvas.height = maxSize;
            state.gridSize = maxSize / 20;
        }
        if (!state.isRunning) drawSnakeStartScreen();
    }

    if (gameState.currentGame === 'flappy') {
        const state = gameState.flappy;
        const maxWidth = Math.min(400, window.innerWidth - 60);
        const maxHeight = Math.min(500, window.innerHeight - 300);
        if (state && state.canvas) {
            state.canvas.width = maxWidth;
            state.canvas.height = maxHeight;
        }
        if (state && !state.isRunning && !state.waitingToStart) drawFlappyStartScreen();
    }

    if (gameState.currentGame === 'tetris') {
        resizeTetrisCanvas();
        const state = gameState.tetris;
        if (state && !state.isRunning) drawTetrisStartScreen();
        if (state && state.isRunning && window.innerWidth <= 768) {
            document.getElementById('tetris-mobile-controls').style.display = 'block';
        } else if (state && state.isRunning) {
            document.getElementById('tetris-mobile-controls').style.display = 'none';
        }
    }

    if (gameState.currentGame === 'shooter1945') {
        const state = gameState.shooter1945;
        const maxW = Math.min(420, window.innerWidth - 40);
        const maxH = Math.min(600, window.innerHeight - 200);
        if (state.canvas) {
            state.canvas.width = maxW;
            state.canvas.height = maxH;
        }
        if (!state.isRunning) drawShooterStartScreen();
    }
});

// ============================================
// INIT LEADERBOARD ON LOAD
// ============================================

updateLeaderboard();