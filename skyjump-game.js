// ============================================
// SKY JUMP AUDIO SYSTEM
// ============================================

let skyjumpAudioContext = null;
let skyjumpBackgroundMusic = null;
let skyjumpMusicGainNode = null;
let skyjumpAudioEnabled = true;

function initSkyjumpAudio() {
    // Always create a fresh context (old one may have been closed to stop audio)
    if (!skyjumpAudioContext || skyjumpAudioContext.state === 'closed') {
        try {
            skyjumpAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            skyjumpAudioEnabled = localStorage.getItem('skyjumpAudioEnabled') !== 'false';
        } catch (e) {
            console.log('Web Audio API not supported');
            skyjumpAudioEnabled = false;
        }
    }
}

function playSkyjumpSound(type) {
    if (!skyjumpAudioEnabled || !skyjumpAudioContext) return;
    
    try {
        const oscillator = skyjumpAudioContext.createOscillator();
        const gainNode = skyjumpAudioContext.createGain();
        const filter = skyjumpAudioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(skyjumpAudioContext.destination);
        
        const now = skyjumpAudioContext.currentTime;
        
        switch (type) {
            case 'jump':
                // Upward swoosh
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.15);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1000, now);
                filter.frequency.exponentialRampToValueAtTime(3000, now + 0.15);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;
                
            case 'hit':
                // Damage sound - noise burst + low tone
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.3);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, now);
                filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;
                
            case 'gameover':
                // Descending tone
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.8);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                oscillator.start(now);
                oscillator.stop(now + 0.8);
                break;
                
            case 'score':
                // Pleasant chime
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.setValueAtTime(1000, now + 0.1);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.setValueAtTime(0.3, now + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                oscillator.start(now);
                oscillator.stop(now + 0.4);
                break;
                
            case 'zone':
                // Magical transition sound
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.3);
                oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.6);
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                oscillator.start(now);
                oscillator.stop(now + 0.8);
                break;
                
            case 'bounce':
                // Bouncy platform sound
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(300, now);
                oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.1);
                gainNode.gain.setValueAtTime(0.25, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                oscillator.start(now);
                oscillator.stop(now + 0.15);
                break;
        }
    } catch (e) {
        console.log('Error playing sound:', e);
    }
}

function startSkyjumpBackgroundMusic(zone = 'ground') {
    if (!skyjumpAudioEnabled || !skyjumpAudioContext) return;
    stopSkyjumpBackgroundMusic();
    // Ensure context is running before scheduling audio
    if (skyjumpAudioContext.state === 'suspended') skyjumpAudioContext.resume();

    try {
        // Master volume node — disconnect this to instantly silence everything
        skyjumpMusicGainNode = skyjumpAudioContext.createGain();
        skyjumpMusicGainNode.gain.setValueAtTime(0.10, skyjumpAudioContext.currentTime);
        skyjumpMusicGainNode.connect(skyjumpAudioContext.destination);

        // Note sequences — pleasant arpeggios per zone
        const sequences = {
            ground: [261.63, 329.63, 392.00, 523.25, 392.00, 329.63], // C E G C G E  (bright)
            sky:    [349.23, 440.00, 523.25, 698.46, 523.25, 440.00], // F A C F C A  (airy)
            space:  [220.00, 277.18, 329.63, 440.00, 329.63, 277.18], // A C# E A E C# (mysterious)
            galaxy: [293.66, 369.99, 440.00, 587.33, 440.00, 369.99], // D F# A D A F# (epic)
        };
        const notes   = sequences[zone] || sequences.ground;
        const noteLen = zone === 'space' || zone === 'galaxy' ? 0.45 : 0.32;
        const oscType = zone === 'space' || zone === 'galaxy' ? 'triangle' : 'sine';

        let noteIndex  = 0;
        let nextNoteTime = skyjumpAudioContext.currentTime + 0.05;

        function scheduleAhead() {
            if (!skyjumpBackgroundMusic) return;
            const lookAhead = skyjumpAudioContext.currentTime + 0.8;
            while (nextNoteTime < lookAhead) {
                const freq = notes[noteIndex % notes.length];
                const osc  = skyjumpAudioContext.createOscillator();
                const env  = skyjumpAudioContext.createGain();
                osc.type = oscType;
                osc.frequency.setValueAtTime(freq, nextNoteTime);
                // Soft attack → sustain → quick release
                env.gain.setValueAtTime(0, nextNoteTime);
                env.gain.linearRampToValueAtTime(1, nextNoteTime + 0.025);
                env.gain.setValueAtTime(0.7, nextNoteTime + noteLen * 0.4);
                env.gain.linearRampToValueAtTime(0, nextNoteTime + noteLen * 0.92);
                osc.connect(env);
                env.connect(skyjumpMusicGainNode);
                osc.start(nextNoteTime);
                osc.stop(nextNoteTime + noteLen);
                noteIndex++;
                nextNoteTime += noteLen;
            }
        }

        scheduleAhead();
        const intervalId = setInterval(scheduleAhead, 200);
        skyjumpBackgroundMusic = { intervalId };

    } catch (e) {
        console.log('SkyJump music error:', e);
    }
}

function stopSkyjumpBackgroundMusic() {
    if (skyjumpBackgroundMusic) {
        clearInterval(skyjumpBackgroundMusic.intervalId);
        skyjumpBackgroundMusic = null;
    }
    if (skyjumpMusicGainNode) {
        try { skyjumpMusicGainNode.gain.setValueAtTime(0, skyjumpAudioContext?.currentTime ?? 0); } catch(e) {}
        try { skyjumpMusicGainNode.disconnect(); } catch(e) {}
        skyjumpMusicGainNode = null;
    }
}

function closeSkyjumpAudio() {
    stopSkyjumpBackgroundMusic();
    // Close context entirely — kills all audio including pre-scheduled notes
    if (skyjumpAudioContext) {
        try { skyjumpAudioContext.close(); } catch(e) {}
        skyjumpAudioContext = null;
    }
}

function updateSkyjumpMusicZone(zone) {
    if (skyjumpBackgroundMusic) {
        startSkyjumpBackgroundMusic(zone);
    }
}

function toggleSkyjumpAudio() {
    skyjumpAudioEnabled = !skyjumpAudioEnabled;
    localStorage.setItem('skyjumpAudioEnabled', skyjumpAudioEnabled);
    if (!skyjumpAudioEnabled) {
        stopSkyjumpBackgroundMusic();
    } else {
        const state = gameState.skyjump;
        if (state && state.isRunning) {
            startSkyjumpBackgroundMusic(state.currentZone);
        }
    }
    return skyjumpAudioEnabled;
}

// ============================================
// SKY JUMP GAME — REVAMPED
// ============================================

// Zone sky colors [top, mid, bottom]
const SJ_SKY_COLORS = {
    ground: ['#5ecb5e', '#87ceeb', '#c8f0c8'],
    sky:    ['#1a6eb5', '#4a90d9', '#c8e8ff'],
    sunset: ['#9b2335', '#e85d04', '#f7c59f'],
    space:  ['#050515', '#0a0a2e', '#120825'],
};

function getSJZone(score) {
    if (score >= 1600) return 'space';
    if (score >= 900)  return 'sunset';
    if (score >= 400)  return 'sky';
    return 'ground';
}

function generateSJStars(w) {
    const stars = [];
    for (let i = 0; i < 220; i++) {
        stars.push({
            x: Math.random() * w,
            y: -(Math.random() * 60000),
            size: 0.5 + Math.random() * 2.5,
            twinkle: Math.random() * Math.PI * 2
        });
    }
    return stars;
}

function generateSJNebulae(w) {
    const cols = ['#ff69b4','#9b59b6','#3498db','#e74c3c','#1abc9c'];
    const nebulae = [];
    for (let i = 0; i < 18; i++) {
        nebulae.push({
            x: Math.random() * w,
            y: -(8000 + Math.random() * 50000),
            rx: 45 + Math.random() * 90,
            ry: 22 + Math.random() * 55,
            color: cols[Math.floor(Math.random() * cols.length)],
            alpha: 0.05 + Math.random() * 0.13
        });
    }
    return nebulae;
}

function addSJParticles(x, y, color, count, speedScale) {
    const state = gameState.skyjump;
    if (!state.particles) state.particles = [];
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i / count) + Math.random() * 1.2 - 0.6;
        const speed = (1.5 + Math.random() * 3) * speedScale;
        state.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            life: 1,
            decay: 0.03 + Math.random() * 0.05,
            size: 2 + Math.random() * 5,
            color
        });
    }
}

// ── Touch horizontal movement ──
let _sjTouchX = null;

function initSkyjump() {
    const state = gameState.skyjump;
    state.canvas = document.getElementById('skyjump-canvas');
    state.ctx = state.canvas.getContext('2d');

    const maxW = Math.min(400, window.innerWidth - 40);
    const maxH = Math.min(560, window.innerHeight - 240);
    state.canvas.width  = maxW;
    state.canvas.height = maxH;

    state.highScore = parseInt(localStorage.getItem('skyjumpHighScore') || '0');
    state.score = 0;
    state.frameCount = 0;
    state.isRunning = false;
    state.isGameOver = false;
    state.cameraY = 0;
    state.currentZone = 'ground';
    state.platformSpawnDistance = 90;
    state.lastPlatformY = 0;
    state.particles = [];
    state.screenShake = 0; state.shakeX = 0; state.shakeY = 0;
    state.zoneFlash = 0;
    state.stars   = generateSJStars(maxW);
    state.nebulae = generateSJNebulae(maxW);
    state.planets = [];

    document.getElementById('skyjump-high').textContent = state.highScore;
    document.getElementById('skyjump-score').textContent = '0';
    const sb = document.querySelector('.skyjump-start-btn');
    if (sb) sb.style.display = 'inline-block';
    const tb = document.getElementById('skyjump-tap-btn');
    if (tb) tb.style.display = 'none';

    drawSkyjumpStartScreen();
    setupSkyjumpControls();
}

function setupSkyjumpControls() {
    const canvas = document.getElementById('skyjump-canvas');
    canvas.removeEventListener('click',      skyjumpCanvasClick);
    canvas.removeEventListener('touchstart', skyjumpCanvasTouch);
    canvas.removeEventListener('touchmove',  skyjumpCanvasTouchMove);
    canvas.removeEventListener('touchend',   skyjumpCanvasTouchEnd);
    document.removeEventListener('keydown',  skyjumpKeydown);
    document.removeEventListener('keyup',    skyjumpKeyup);
    canvas.addEventListener('click',      skyjumpCanvasClick);
    canvas.addEventListener('touchstart', skyjumpCanvasTouch,     { passive: false });
    canvas.addEventListener('touchmove',  skyjumpCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend',   skyjumpCanvasTouchEnd,  { passive: false });
    document.addEventListener('keydown',  skyjumpKeydown);
    document.addEventListener('keyup',    skyjumpKeyup);
}

function skyjumpCanvasClick(e) {
    e.preventDefault();
    const state = gameState.skyjump;
    if (!state.isRunning && !state.isGameOver) startSkyjump();
}

function skyjumpCanvasTouch(e) {
    e.preventDefault();
    const state = gameState.skyjump;
    if (!state.isRunning && !state.isGameOver) { startSkyjump(); return; }
    _sjTouchX = e.touches[0].clientX;
}

function skyjumpCanvasTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) _sjTouchX = e.touches[0].clientX;
}

function skyjumpCanvasTouchEnd(e) {
    e.preventDefault();
    _sjTouchX = null;
}

function skyjumpKeydown(e) {
    if (gameState.currentGame !== 'skyjump') return;
    const state = gameState.skyjump;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (!state.isRunning && !state.isGameOver) startSkyjump();
    }
    if (state.isRunning && !state.isGameOver) {
        state._keys = state._keys || {};
        if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') { e.preventDefault(); state._keys.left  = true; }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); state._keys.right = true; }
    }
}

function skyjumpKeyup(e) {
    const state = gameState.skyjump;
    if (!state._keys) return;
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') state._keys.left  = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state._keys.right = false;
}


function startSkyjump() {
    const state = gameState.skyjump;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop = null; }
    const overlay = document.querySelector('.skyjump-gameover');
    if (overlay) overlay.remove();

    initSkyjumpAudio();
    if (skyjumpAudioContext && skyjumpAudioContext.state === 'suspended') skyjumpAudioContext.resume();

    const W = state.canvas.width, H = state.canvas.height;

    state.player = {
        x: W / 2, y: H - 150,
        width: 34, height: 44,
        velocityX: 0, velocityY: 0,
        isJumping: false, onPlatform: false,
        shielded: false, rocketTime: 0,
        trail: []
    };

    state.spikeTouchCount = 0;
    state.platforms  = [];
    state.clouds     = [];
    state.birds      = [];
    state.powerups   = [];
    state.particles  = [];
    state.score      = 0;
    state.isRunning  = true;
    state.isGameOver = false;
    state.frameCount = 0;
    state.cameraY    = 0;
    state.currentZone = 'ground';
    state.platformSpawnDistance = 90;
    state.lastPlatformY = H - 50;
    state.screenShake = 0; state.shakeX = 0; state.shakeY = 0;
    state.zoneFlash = 0;
    state._keys = {};
    _sjTouchX = null;

    // Generate planets for space zone
    state.planets = [];
    for (let i = 0; i < 10; i++) {
        state.planets.push({
            x: Math.random() * W,
            y: -(14000 + Math.random() * 40000),
            r: 18 + Math.random() * 55,
            color: ['#ff6b6b','#ffd700','#4fc3f7','#ce93d8','#80cbc4','#ff8a65'][Math.floor(Math.random()*6)],
            rings: Math.random() < 0.35,
            speed: 0.06 + Math.random() * 0.04
        });
    }

    // Ground
    state.platforms.push({ x: W/2, y: H-50, width: W, height: 50, type: 'ground',
        broken: false, bounceTime: 0, hasSpikes: false, moveDir: 0 });

    // Initial platforms
    for (let i = 0; i < 12; i++) {
        state.lastPlatformY -= 90 + Math.random() * 40;
        spawnSkyjumpPlatform(state.lastPlatformY);
    }

    // Clouds
    for (let i = 0; i < 22; i++) {
        state.clouds.push({
            x: Math.random() * W,
            y: Math.random() * H * 4 - H,
            width: 70 + Math.random() * 90,
            height: 35 + Math.random() * 40,
            speed: 0.12 + Math.random() * 0.22,
            alpha: 0.55 + Math.random() * 0.4
        });
    }

    document.getElementById('skyjump-score').textContent = '0';
    const sb = document.querySelector('.skyjump-start-btn');
    if (sb) sb.style.display = 'none';

    startSkyjumpBackgroundMusic('ground');
    state.gameLoop = requestAnimationFrame(updateSkyjump);
    showToast('← → to move  |  Auto-jump on platforms! 🚀', 'info');
}

function spawnSkyjumpPlatform(y) {
    const state = gameState.skyjump;
    const W = state.canvas.width, score = state.score;
    const width = Math.max(58, 115 - score / 70);
    const x = width/2 + Math.random() * (W - width);

    let type = 'normal';
    const r = Math.random();
    if      (score > 200  && r < 0.13) type = 'bouncy';
    else if (score > 500  && r < 0.24) type = 'moving';
    else if (score > 900  && r < 0.33) type = 'breakable';
    else if (score > 1400 && r < 0.40) type = 'cloud';

    const hasSpikes = (type === 'normal' && score > 700 && Math.random() < 0.14);
    const hasPowerup = (score > 150 && Math.random() < 0.07)
        ? (Math.random() < 0.5 ? 'shield' : 'rocket') : null;

    state.platforms.push({
        x, y, width, height: 14, type,
        broken: false, bounceTime: 0,
        hasSpikes, spikeTouched: false,
        moveDir:   type === 'moving' ? (Math.random() < 0.5 ? 1 : -1) : 0,
        moveSpeed: 1.4 + Math.random() * 1.6,
        hasPowerup, powerupCollected: false,
        cloudAlpha: 1, fadingOut: false, fadedOut: false
    });
}


function jumpSkyjump() { /* auto-bounce — kept for button compatibility */ }

function collectSJPowerup(type) {
    const state = gameState.skyjump;
    if (type === 'shield') {
        state.player.shielded = true;
        addSJParticles(state.player.x, state.player.y, '#00aaff', 20, 1.4);
        showToast('🛡️ Shield activated!', 'info');
    } else if (type === 'rocket') {
        state.player.rocketTime = 90;
        addSJParticles(state.player.x, state.player.y, '#ff8800', 20, 1.4);
        showToast('🚀 Rocket boost!', 'success');
    }
    playSkyjumpSound('score');
}

function updateSkyjump() {
    const state = gameState.skyjump;
    if (!state.isRunning) return;

    state.frameCount++;
    const W = state.canvas.width, H = state.canvas.height;

    // ── Horizontal movement (keys + touch) ──
    const keys = state._keys || {};
    const rect = state.canvas.getBoundingClientRect();
    const touchLeft  = _sjTouchX !== null && (_sjTouchX - rect.left) < W / 2;
    const touchRight = _sjTouchX !== null && (_sjTouchX - rect.left) >= W / 2;

    if      (keys.left  || touchLeft)  state.player.velocityX = Math.max(state.player.velocityX - 0.9, -5.5);
    else if (keys.right || touchRight) state.player.velocityX = Math.min(state.player.velocityX + 0.9,  5.5);
    else                               state.player.velocityX *= 0.80;
    if (Math.abs(state.player.velocityX) < 0.1) state.player.velocityX = 0;

    state.player.x += state.player.velocityX;

    // Screen wrap
    if (state.player.x < -state.player.width/2)     state.player.x = W + state.player.width/2;
    if (state.player.x >  W + state.player.width/2) state.player.x = -state.player.width/2;

    // ── Vertical (rocket or gravity) ──
    if (state.player.rocketTime > 0) {
        state.player.velocityY = Math.max(state.player.velocityY - 1.1, -18);
        state.player.rocketTime--;
        addSJParticles(state.player.x, state.player.y + state.player.height/2, '#ff8800', 2, 0.7);
    } else {
        state.player.velocityY += state.gravity;
    }
    state.player.y += state.player.velocityY;

    // Trail
    state.player.trail.push({ x: state.player.x, y: state.player.y });
    if (state.player.trail.length > 12) state.player.trail.shift();

    // ── Platform collisions ──
    state.player.onPlatform = false;
    for (const platform of state.platforms) {
        if (platform.broken || platform.fadedOut) continue;

        // Move sliding platforms
        if (platform.type === 'moving') {
            platform.x += platform.moveDir * platform.moveSpeed;
            if (platform.x + platform.width/2 > W || platform.x - platform.width/2 < 0)
                platform.moveDir *= -1;
        }

        const playerBottom = state.player.y + state.player.height/2;
        const platformTop  = platform.y - platform.height/2;

        if (state.player.velocityY > 0 &&
            state.player.x + state.player.width/2 > platform.x - platform.width/2 &&
            state.player.x - state.player.width/2 < platform.x + platform.width/2 &&
            playerBottom >= platformTop &&
            playerBottom <= platform.y + platform.height/2 + 8) {

            // Spike hit — platform also starts fading so you can't land on it again
            if (platform.hasSpikes && !platform.spikeTouched) {
                platform.spikeTouched = true;
                platform.fadingOut = true;   // disappears after this jump
                if (state.player.shielded) {
                    state.player.shielded = false;
                    addSJParticles(state.player.x, state.player.y, '#00aaff', 18, 1.4);
                    playSkyjumpSound('bounce');
                } else {
                    state.spikeTouchCount = (state.spikeTouchCount || 0) + 1;
                    state.screenShake = 20;
                    addSJParticles(state.player.x, state.player.y, '#ff3333', 22, 1.5);
                    playSkyjumpSound('hit');
                    if (state.spikeTouchCount >= 2) { skyjumpGameOver(); return; }
                }
            }
            // Skip if already fading (spike platform disappearing)
            if (platform.fadedOut) continue;

            // Land and bounce
            state.player.y = platformTop - state.player.height/2;
            if (platform.type === 'bouncy') {
                state.player.velocityY = state.jumpStrength * 1.65;
                platform.bounceTime = 14;
                state.screenShake = 7;
                addSJParticles(state.player.x, platformTop, '#ffd700', 16, 1.3);
                playSkyjumpSound('bounce');
            } else if (platform.type === 'breakable') {
                state.player.velocityY = state.jumpStrength;
                platform.broken = true;
                addSJParticles(platform.x, platformTop, '#cc7744', 14, 1.0);
                playSkyjumpSound('jump');
            } else if (platform.type === 'cloud') {
                state.player.velocityY = state.jumpStrength * 0.88;
                platform.fadingOut = true;
                addSJParticles(platform.x, platformTop, '#ddeeff', 8, 0.6);
                playSkyjumpSound('jump');
            } else {
                state.player.velocityY = state.jumpStrength;
                addSJParticles(state.player.x, platformTop, '#aaffaa', 12, 1.0);
                playSkyjumpSound('jump');
            }
            state.player.isJumping = true;
            state.player.onPlatform = true;

            // Collect power-up
            if (platform.hasPowerup && !platform.powerupCollected) {
                platform.powerupCollected = true;
                collectSJPowerup(platform.hasPowerup);
            }
        }

        // Fade cloud platforms
        if (platform.fadingOut) {
            platform.cloudAlpha = Math.max(0, (platform.cloudAlpha || 1) - 0.07);
            if (platform.cloudAlpha <= 0) platform.fadedOut = true;
        }
        if (platform.bounceTime > 0) platform.bounceTime--;
    }

    // ── Camera ──
    const targetCamY = state.player.y - H * 0.55;
    if (targetCamY < state.cameraY) state.cameraY = targetCamY;

    // ── Score ──
    const newScore = Math.floor(-state.cameraY / 10);
    if (newScore > state.score) {
        const old = state.score;
        state.score = newScore;
        document.getElementById('skyjump-score').textContent = state.score;
        if (Math.floor(state.score / 300) > Math.floor(old / 300)) playSkyjumpSound('score');
    }

    // ── Zone transition ──
    const oldZone = state.currentZone;
    state.currentZone = getSJZone(state.score);
    if (oldZone !== state.currentZone) {
        playSkyjumpSound('zone');
        state.zoneFlash = 28;
        const musicZone = state.currentZone === 'space' ? 'space' : state.currentZone === 'ground' ? 'ground' : 'sky';
        updateSkyjumpMusicZone(musicZone);
    }

    // ── Spawn platforms ──
    while (state.lastPlatformY > state.cameraY - H * 0.55) {
        state.lastPlatformY -= 88 + Math.random() * 48 + state.score / 180;
        spawnSkyjumpPlatform(state.lastPlatformY);
    }
    state.platforms = state.platforms.filter(p => p.y < state.cameraY + H + 120);

    // ── Birds ──
    spawnSkyjumpBird();
    updateSkyjumpBirds();

    // ── Particles ──
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.12;
        p.life -= p.decay;
        if (p.life <= 0) state.particles.splice(i, 1);
    }

    // ── Screen shake ──
    if (state.screenShake > 0) {
        state.shakeX = (Math.random()-0.5) * state.screenShake;
        state.shakeY = (Math.random()-0.5) * state.screenShake;
        state.screenShake *= 0.72;
        if (state.screenShake < 0.5) state.screenShake = 0;
    } else { state.shakeX = 0; state.shakeY = 0; }

    if (state.zoneFlash > 0) state.zoneFlash--;

    // ── Game over ──
    if (state.player.y > state.cameraY + H + 90) { skyjumpGameOver(); return; }

    drawSkyjumpFrame();
    state.gameLoop = requestAnimationFrame(updateSkyjump);
}

function drawSkyjumpFrame() {
    const state = gameState.skyjump;
    const { ctx, canvas } = state;
    const W = canvas.width, H = canvas.height;
    const cam = state.cameraY, zone = state.currentZone;

    ctx.save();
    ctx.translate(state.shakeX || 0, state.shakeY || 0);

    // ── Background gradient ──
    const cols = SJ_SKY_COLORS[zone];
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, cols[0]); bg.addColorStop(0.55, cols[1]); bg.addColorStop(1, cols[2]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Zone flash
    if (state.zoneFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${state.zoneFlash / 55})`;
        ctx.fillRect(0, 0, W, H);
    }

    // ── Stars ──
    if (zone === 'space' || zone === 'sunset') {
        const alpha = zone === 'space' ? 0.92 : 0.45;
        state.stars.forEach(star => {
            const sy = ((star.y - cam * 0.12) % (H * 2) + H * 2) % (H * 2) - H * 0.3;
            if (sy < -5 || sy > H + 5) return;
            const tw = Math.sin(state.frameCount * 0.04 + star.twinkle) * 0.38 + 0.62;
            ctx.fillStyle = `rgba(255,255,255,${tw * alpha})`;
            ctx.beginPath(); ctx.arc(star.x, sy, star.size, 0, Math.PI*2); ctx.fill();
        });
    }

    // ── Nebulae (space) ──
    if (zone === 'space') {
        state.nebulae.forEach(neb => {
            const sy = neb.y - cam * 0.09;
            if (sy < -130 || sy > H + 130) return;
            const g = ctx.createRadialGradient(neb.x, sy, 0, neb.x, sy, neb.rx);
            const c = neb.color;
            g.addColorStop(0, c.replace('rgb(','rgba(').replace(')',`,${neb.alpha*2.2})`));
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.ellipse(neb.x, sy, neb.rx, neb.ry, 0, 0, Math.PI*2); ctx.fill();
        });
        // Planets
        state.planets.forEach(pl => {
            const sy = pl.y - cam * pl.speed;
            if (sy < -80 || sy > H + 80) return;
            ctx.save();
            ctx.shadowColor = pl.color; ctx.shadowBlur = 22;
            ctx.fillStyle = pl.color;
            ctx.beginPath(); ctx.arc(pl.x, sy, pl.r, 0, Math.PI*2); ctx.fill();
            if (pl.rings) {
                ctx.globalAlpha = 0.45; ctx.strokeStyle = pl.color; ctx.lineWidth = 5;
                ctx.beginPath(); ctx.ellipse(pl.x, sy, pl.r*1.75, pl.r*0.38, 0.4, 0, Math.PI*2); ctx.stroke();
                ctx.globalAlpha = 1;
            }
            ctx.shadowBlur = 0; ctx.restore();
        });
    }

    // ── Clouds (tile vertically so they're always visible) ──
    if (zone !== 'space') {
        const cloudColor = zone === 'sunset' ? '#ffccaa' : 'white';
        const cloudAlphaMult = zone === 'sunset' ? 0.42 : 0.80;
        // Spread clouds evenly across H, tiled with a slow parallax
        state.clouds.forEach((cloud, idx) => {
            // Tile so there are always clouds in view
            const baseY = (idx / state.clouds.length) * H;
            const parallax = (cam * 0.28 % H + H) % H;
            const sy = ((baseY - parallax) % H + H) % H - cloud.height;

            cloud.x += cloud.speed;
            if (cloud.x > W + cloud.width) cloud.x = -cloud.width;

            ctx.globalAlpha = cloud.alpha * cloudAlphaMult;
            ctx.fillStyle = cloudColor;
            ctx.beginPath(); ctx.ellipse(cloud.x, sy, cloud.width/2, cloud.height/2, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cloud.x-cloud.width*0.28, sy-cloud.height*0.22, cloud.width/3, cloud.height/2.2, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cloud.x+cloud.width*0.28, sy-cloud.height*0.12, cloud.width/3, cloud.height/2.5, 0, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    // ── Platforms ──
    state.platforms.forEach(platform => {
        const sy = platform.y - cam;
        if (sy < -70 || sy > H + 70) return;
        const pw = platform.width, ph = platform.height;
        const px = platform.x - pw/2, py = sy - ph/2;

        ctx.save();
        if (platform.type === 'cloud') ctx.globalAlpha = Math.max(0, platform.cloudAlpha || 1);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(px+4, py+5, pw, ph);

        if (!platform.broken) {
            // Colors
            let c1, c2, glow;
            if      (platform.type==='ground')    { c1='#33bb33'; c2='#1a8c1a'; glow='#44ff44'; }
            else if (platform.type==='bouncy')    { c1='#ffd700'; c2='#ff8800'; glow='#ffd700'; }
            else if (platform.type==='moving')    { c1='#44aaff'; c2='#1166dd'; glow='#66ccff'; }
            else if (platform.type==='breakable') { c1='#cc7744'; c2='#884422'; glow='#dd9955'; }
            else if (platform.type==='cloud')     { c1='rgba(240,248,255,0.88)'; c2='rgba(200,230,255,0.6)'; glow='#cce8ff'; }
            else                                  { c1='#55cc55'; c2='#2e8b2e'; glow='#66ff66'; }

            ctx.shadowColor = glow;
            ctx.shadowBlur = zone === 'space' ? 16 : 9;
            const grad = ctx.createLinearGradient(px, py, px, py+ph);
            grad.addColorStop(0, c1); grad.addColorStop(1, c2);
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.roundRect(px, py, pw, ph, [6]); ctx.fill();
            ctx.shadowBlur = 0;

            // Shine
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.beginPath(); ctx.roundRect(px+2, py+2, pw-4, ph/2.5, [4]); ctx.fill();

            // Bouncy springs
            if (platform.type === 'bouncy') {
                ctx.strokeStyle = '#fff8'; ctx.lineWidth = 2.5;
                const compress = platform.bounceTime > 0 ? 5 : 0;
                for (let s = -1; s <= 1; s++) {
                    ctx.beginPath();
                    ctx.moveTo(platform.x + s*9, py-1);
                    ctx.lineTo(platform.x + s*9, py-9+compress);
                    ctx.stroke();
                }
            }

            // Moving arrows
            if (platform.type === 'moving') {
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.font = '9px Arial'; ctx.textAlign = 'center';
                ctx.fillText(platform.moveDir>0 ? '▶▶' : '◀◀', platform.x, sy+4);
            }

            // Spikes
            if (platform.hasSpikes) {
                ctx.fillStyle = platform.spikeTouched ? '#555' : '#ff2222';
                ctx.shadowColor = platform.spikeTouched ? '' : '#ff0000';
                ctx.shadowBlur = platform.spikeTouched ? 0 : 7;
                const sc = Math.max(2, Math.floor(pw/16));
                const sp = pw / (sc+1);
                for (let i=1; i<=sc; i++) {
                    const sx = px+i*sp, sy2 = py;
                    ctx.beginPath(); ctx.moveTo(sx-5,sy2); ctx.lineTo(sx,sy2-12); ctx.lineTo(sx+5,sy2); ctx.closePath(); ctx.fill();
                }
                ctx.shadowBlur = 0;
            }

            // Power-up icon
            if (platform.hasPowerup && !platform.powerupCollected) {
                ctx.shadowBlur = 0;
                ctx.font = '18px serif'; ctx.textAlign = 'center';
                const bob = Math.sin(state.frameCount*0.1)*3;
                ctx.fillText(platform.hasPowerup==='shield'?'🛡️':'🚀', platform.x, py-7+bob);
            }
        }
        ctx.restore();
    });

    // ── Particles ──
    state.particles.forEach(p => {
        const sy = p.y - cam;
        if (sy < -15 || sy > H+15) return;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, sy, Math.max(0.5, p.size*p.life), 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ── Birds ──
    drawSkyjumpBirds();

    // ── Player ──
    const px2 = state.player.x, py2 = state.player.y - cam;
    const pw2 = state.player.width, ph2 = state.player.height;

    // Jet/motion trail
    if (state.player.rocketTime > 0 || Math.abs(state.player.velocityY) > 8) {
        const isRocket = state.player.rocketTime > 0;
        state.player.trail.forEach((tr, t) => {
            const ratio = t / state.player.trail.length;
            ctx.globalAlpha = ratio * (isRocket ? 0.65 : 0.22);
            ctx.fillStyle = isRocket ? `hsl(${30+t*7},100%,60%)` : '#aaddff';
            ctx.beginPath(); ctx.arc(tr.x, tr.y-cam, (isRocket?9:6)*ratio, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(px2, py2+ph2/2+4, pw2/2, 5, 0, 0, Math.PI*2); ctx.fill();

    // Astronaut body
    ctx.save();
    ctx.shadowColor = state.player.shielded ? '#00aaff' : (state.player.rocketTime>0 ? '#ff8800' : '#88ffaa');
    ctx.shadowBlur = state.player.shielded ? 20 : 9;
    const bg2 = ctx.createLinearGradient(px2-pw2/2, py2-ph2/2, px2+pw2/2, py2+ph2/2);
    if (state.player.shielded)          { bg2.addColorStop(0,'#88ccff'); bg2.addColorStop(1,'#0055aa'); }
    else if (state.player.rocketTime>0) { bg2.addColorStop(0,'#ffee55'); bg2.addColorStop(1,'#ff5500'); }
    else                                { bg2.addColorStop(0,'#e8eeff'); bg2.addColorStop(1,'#8899bb'); }
    ctx.fillStyle = bg2;
    ctx.beginPath(); ctx.roundRect(px2-pw2/2, py2-ph2/2, pw2, ph2, [10,10,6,6]); ctx.fill();
    ctx.shadowBlur = 0;

    // Helmet visor
    const vg = ctx.createLinearGradient(px2-10, py2-ph2/2+3, px2+10, py2-ph2/2+18);
    vg.addColorStop(0,'rgba(120,210,255,0.92)'); vg.addColorStop(1,'rgba(50,100,210,0.75)');
    ctx.fillStyle = vg;
    ctx.beginPath(); ctx.roundRect(px2-11, py2-ph2/2+2, 22, 17, [7]); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1; ctx.stroke();

    // Eyes in visor
    ctx.fillStyle = state.player.velocityY < -2 ? '#ffffff' : '#aaddff';
    ctx.beginPath();
    ctx.arc(px2-4, py2-ph2/2+11, 2.5, 0, Math.PI*2);
    ctx.arc(px2+4, py2-ph2/2+11, 2.5, 0, Math.PI*2);
    ctx.fill();

    // Jetpack
    ctx.fillStyle = '#445566';
    ctx.fillRect(px2+pw2/2-2, py2-ph2/4, 6, ph2/2);
    if (state.player.rocketTime > 0) {
        ctx.fillStyle = `hsl(${(state.frameCount*15)%60+10},100%,55%)`;
        ctx.beginPath(); ctx.arc(px2+pw2/2+2, py2+ph2/4+4, 6, 0, Math.PI*2); ctx.fill();
    }

    // Shield ring
    if (state.player.shielded) {
        ctx.strokeStyle = `rgba(0,180,255,${0.5+Math.sin(state.frameCount*0.15)*0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(px2, py2, pw2*0.88, 0, Math.PI*2); ctx.stroke();
    }
    ctx.restore();

    // ── HUD ──
    const zoneIcons = { ground:'🌱', sky:'☁️', sunset:'🌅', space:'🌌' };
    const zoneLabels = { ground:'Ground', sky:'Sky', sunset:'Sunset', space:'Space' };
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath(); ctx.roundRect(6, 6, 108, 28, [6]); ctx.fill();
    ctx.font = 'bold 13px Segoe UI'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    ctx.fillText(`${zoneIcons[zone]} ${zoneLabels[zone]}`, 13, 25);

    // HP hearts
    const hp = 2 - (state.spikeTouchCount||0);
    if (hp < 2) {
        ctx.fillStyle = 'rgba(180,0,0,0.7)';
        ctx.beginPath(); ctx.roundRect(W-78, 6, 72, 28, [6]); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Segoe UI'; ctx.textAlign = 'right';
        ctx.fillText(`${'❤️'.repeat(hp)} ${hp}/2`, W-9, 25);
    }

    // Danger warning
    if (state.player.y > state.cameraY + H * 0.82) {
        ctx.fillStyle = `rgba(255,60,60,${0.55+Math.sin(state.frameCount*0.22)*0.3})`;
        ctx.font = 'bold 22px Segoe UI'; ctx.textAlign = 'center';
        ctx.fillText('⚠ FALLING!', W/2, H-18);
    }

    ctx.restore();
}

// ── Bird obstacle system ──
function spawnSkyjumpBird() {
    const state = gameState.skyjump;
    if (state.score < 250) return;
    if (state.birds.length >= 4) return;
    const chance = Math.min(0.014 + (state.score-250)/14000, 0.065);
    if (Math.random() > chance) return;
    const W = state.canvas.width;
    const fromLeft = Math.random() < 0.5;
    const speed = (2.5 + Math.random()*2.5) * (fromLeft ? 1 : -1);
    const colors = ['#ff6b35','#e84393','#7c4dff','#00bcd4','#ff5722'];
    state.birds.push({
        x: fromLeft ? -42 : W+42,
        y: state.cameraY - 80 - Math.random()*280,
        width: 32, height: 18,
        speedX: speed, wingFrame: 0,
        color: colors[Math.floor(Math.random()*colors.length)]
    });
}

function updateSkyjumpBirds() {
    const state = gameState.skyjump;
    const player = state.player;
    for (let i = state.birds.length-1; i >= 0; i--) {
        const bird = state.birds[i];
        bird.x += bird.speedX;
        bird.wingFrame = (bird.wingFrame + 0.25) % 2;
        if (bird.x < -80 || bird.x > state.canvas.width+80) { state.birds.splice(i,1); continue; }
        const dx = player.x - bird.x, dy = player.y - bird.y;
        if (Math.sqrt(dx*dx+dy*dy) < (player.width/2 + bird.width/2 - 4)) {
            if (player.shielded) {
                player.shielded = false;
                addSJParticles(player.x, player.y, '#00aaff', 18, 1.4);
                playSkyjumpSound('bounce');
            } else {
                state.spikeTouchCount = (state.spikeTouchCount||0)+1;
                state.screenShake = 20;
                addSJParticles(player.x, player.y, '#ff3333', 22, 1.5);
                playSkyjumpSound('hit');
                if (state.spikeTouchCount >= 2) { skyjumpGameOver(); return; }
                showToast('🐦 Bird hit! Watch out!', 'warning');
            }
            state.birds.splice(i,1);
        }
    }
}

function drawSkyjumpBirds() {
    const state = gameState.skyjump;
    const ctx = state.ctx;
    state.birds.forEach(bird => {
        const sy = bird.y - state.cameraY;
        if (sy < -65 || sy > state.canvas.height+65) return;
        ctx.save();
        ctx.translate(bird.x, sy);
        if (bird.speedX < 0) ctx.scale(-1,1);
        ctx.shadowColor = bird.color; ctx.shadowBlur = 10;
        ctx.fillStyle = bird.color;
        ctx.beginPath(); ctx.ellipse(0, 0, bird.width/2, bird.height/2, 0, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 0.75;
        const wy = Math.sin(bird.wingFrame*Math.PI)*9;
        ctx.beginPath(); ctx.moveTo(-4,-4); ctx.lineTo(12,-10+wy); ctx.lineTo(6,5); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle='#ffd700';
        ctx.beginPath(); ctx.moveTo(bird.width/2-3,-2); ctx.lineTo(bird.width/2+9,1); ctx.lineTo(bird.width/2-3,5); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(6,-3,4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(7.5,-3,2,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0; ctx.restore();
    });
}

function drawSkyjumpStartScreen() {
    const state = gameState.skyjump;
    if (!state.canvas) return;
    const { ctx, canvas } = state;
    const W = canvas.width, H = canvas.height;

    // Deep sky background
    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#0a1628'); bg.addColorStop(0.55,'#1a3a6e'); bg.addColorStop(1,'#2d6a4f');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // Stars
    for (let i=0; i<90; i++) {
        const sx=(i*137.5)%W, sy=(i*73.3)%(H*0.65);
        const bri = Math.sin(i*1.7)*0.35+0.65;
        ctx.fillStyle=`rgba(255,255,255,${bri})`;
        ctx.beginPath(); ctx.arc(sx,sy,0.8+(i%3)*0.5,0,Math.PI*2); ctx.fill();
    }

    // Ground
    const gg=ctx.createLinearGradient(0,H-80,0,H);
    gg.addColorStop(0,'#2d6a4f'); gg.addColorStop(1,'#1b4332');
    ctx.fillStyle=gg; ctx.fillRect(0,H-80,W,80);

    // Demo platforms
    [[W*0.18,H-165,88],[W*0.62,H-240,76],[W*0.38,H-318,82]].forEach(([x,y,w])=>{
        ctx.shadowColor='#44ff44'; ctx.shadowBlur=12;
        const g=ctx.createLinearGradient(x-w/2,y-7,x-w/2,y+7);
        g.addColorStop(0,'#55cc55'); g.addColorStop(1,'#2e8b2e');
        ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(x-w/2,y-7,w,14,[6]); ctx.fill();
        ctx.shadowBlur=0;
    });

    // Title
    ctx.save(); ctx.textAlign='center';
    ctx.shadowColor='#00ffaa'; ctx.shadowBlur=35;
    ctx.font='bold 50px Segoe UI, Arial';
    ctx.fillStyle='#ffffff'; ctx.fillText('SKY', W/2-55, H/2-28);
    ctx.fillStyle='#00ffaa';  ctx.fillText('JUMP', W/2+34, H/2-28);
    ctx.shadowBlur=0;

    ctx.font='32px serif'; ctx.fillText('🚀', W/2, H/2+12);

    ctx.font='bold 13px Segoe UI'; ctx.fillStyle='rgba(200,240,255,0.82)';
    ctx.shadowColor='#000'; ctx.shadowBlur=4;
    ctx.fillText('← → or touch sides to move  •  Auto-jump!', W/2, H/2+50);
    ctx.fillText('🛡️ Shield  •  🚀 Rocket  •  🐦 Dodge birds', W/2, H/2+70);
    ctx.shadowBlur=0;

    if (state.highScore > 0) {
        ctx.font='bold 14px Segoe UI'; ctx.fillStyle='#ffd700';
        ctx.shadowColor='#ff8800'; ctx.shadowBlur=10;
        ctx.fillText(`🏆 Best: ${state.highScore}`, W/2, H/2+96);
        ctx.shadowBlur=0;
    }

    ctx.font='12px Segoe UI'; ctx.fillStyle='rgba(255,255,255,0.45)';
    ctx.fillText('Click or press Space to start', W/2, H-22);
    ctx.restore();
}

function skyjumpGameOver() {
    const state = gameState.skyjump;
    state.isRunning = false; state.isGameOver = true;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop = null; }
    stopSkyjumpBackgroundMusic();
    playSkyjumpSound('gameover');

    let isNewBest = false;
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('skyjumpHighScore', state.highScore);
        document.getElementById('skyjump-high').textContent = state.highScore;
        isNewBest = true;
    }
    if (state.score > 0) saveScore('skyjump', state.score);

    showSkyjumpGameOver(isNewBest);
    if (isNewBest) { showConfetti(); showToast(`🏆 New Best: ${state.score}!`, 'success'); }
    else showToast(`Game Over! Score: ${state.score}`, 'error');
}

function showSkyjumpGameOver(isNewBest) {
    const state = gameState.skyjump;
    const existing = document.querySelector('.skyjump-gameover');
    if (existing) existing.remove();
    const zoneIcons = { ground:'🌱', sky:'☁️', sunset:'🌅', space:'🌌' };
    const zone = state.currentZone || 'ground';
    const overlay = document.createElement('div');
    overlay.className = 'skyjump-gameover';
    overlay.innerHTML = `
        <div class="skyjump-gameover-content">
            <div style="font-size:2.8rem;margin-bottom:4px;">${isNewBest?'🏆':'💥'}</div>
            <h3 style="margin:4px 0;">${isNewBest?'NEW RECORD!':'Game Over!'}</h3>
            <div class="final-score">${state.score}</div>
            <div style="opacity:.65;font-size:.9rem;margin-bottom:6px;">Reached ${zoneIcons[zone]} ${zone.charAt(0).toUpperCase()+zone.slice(1)}</div>
            ${isNewBest ? '<div class="new-best">🏆 NEW BEST! 🏆</div>'
                        : `<div style="opacity:.55;font-size:.85rem;">Best: ${state.highScore}</div>`}
            <button class="restart-btn" onclick="closeSkyjumpGameOver()" style="margin-top:18px;">
                <i class="fas fa-redo"></i> Play Again
            </button>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target===overlay) closeSkyjumpGameOver(); });
}

function closeSkyjumpGameOver() {
    const overlay = document.querySelector('.skyjump-gameover');
    if (overlay) overlay.remove();
    const state = gameState.skyjump;
    state.isRunning = false; state.isGameOver = false;
    drawSkyjumpStartScreen();
    const sb = document.querySelector('.skyjump-start-btn');
    if (sb) sb.style.display = 'inline-block';
}

function skyjumpCleanup() {
    closeSkyjumpAudio();
    const state = gameState.skyjump;
    if (state && state.gameLoop) {
        cancelAnimationFrame(state.gameLoop);
        state.gameLoop = null;
    }
    if (state) { state.isRunning = false; }
    const overlay = document.querySelector('.skyjump-gameover');
    if (overlay) overlay.remove();
}

// Alias so startGame('skyjump') can find the init function
function skyjumpInit() { initSkyjump(); }

// Fallback: stop music immediately whenever any nav link or back button is clicked,
// regardless of gameState.currentGame — this is the guaranteed last resort.
document.addEventListener('click', function(e) {
    if (e.target.closest('.nav-link, .back-btn')) {
        closeSkyjumpAudio();
    }
}, true);
