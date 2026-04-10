// ============================================
// FLAPPY BIRD - MEGA UPGRADED MODULE
// ============================================

// ============================================
// SOUND SYSTEM (MP3 files)
// ============================================
const _sfxBase = 'sound effects for flappy bird/';
const FLAPPY_SFX = {
    wing:   new Audio(_sfxBase + '05. Wing.mp3'),
    point:  new Audio(_sfxBase + '03. Point.mp3'),
    hit:    new Audio(_sfxBase + '02. Hit.mp3'),
    die:    new Audio(_sfxBase + '01. Die.mp3'),
    swoosh: new Audio(_sfxBase + '04. Swooshing.mp3'),
};
Object.values(FLAPPY_SFX).forEach(a => { a.preload = 'auto'; });

function _playFlappySFX(name) {
    const snd = FLAPPY_SFX[name]; if (!snd) return;
    snd.currentTime = 0;
    snd.play().catch(() => {});
}

function playFlappyFlap()         { _playFlappySFX('wing'); }
function playFlappyScore()        { _playFlappySFX('point'); }
function playFlappyCoin()         { _playFlappySFX('point'); }
function playFlappyPowerup()      { _playFlappySFX('swoosh'); }
function playFlappyShieldBreak()  { _playFlappySFX('hit'); }
function playFlappyHit()          { _playFlappySFX('hit'); }
function playFlappyGameOver()     { _playFlappySFX('die'); }

// ============================================
// BIRD SKINS
// ============================================
const FLAPPY_SKINS = [
    { name: 'Yellow', body1:'#fffabb', body2:'#f7c842', body3:'#c8860a', stroke:'#a06800', wing1:'#ffe060', wing2:'#b87800', beak1:'#ff7818', beak2:'#e05800' },
    { name: 'Red',    body1:'#ffb8b8', body2:'#e83030', body3:'#a01818', stroke:'#800808', wing1:'#ff5555', wing2:'#c02020', beak1:'#ff9020', beak2:'#e06000' },
    { name: 'Blue',   body1:'#b0d0ff', body2:'#3880e8', body3:'#1850a8', stroke:'#083888', wing1:'#70a0ff', wing2:'#2860c0', beak1:'#50d0ff', beak2:'#3098d8' },
];

// ============================================
// STATE
// ============================================
const flappyState = {
    canvas: null, ctx: null, bird: null,
    pipes: [], coins: [], powerups: [],
    score: 0,
    highScore: parseInt(localStorage.getItem('flappyHighScore')) || 0,
    gameLoop: null,
    isRunning: false, isGameOver: false, waitingToStart: false,
    idleBobFrame: 0, frameCount: 0,
    gravity: 0.45, flapStrength: -7.5,
    pipeSpeed: 2.5, pipeGap: 140, pipeWidth: 55,
    pipeSpawnRate: 100, groundHeight: 60,
    lastTime: 0,
    // New fields
    activePowerup: null,   // null | 'shield' | 'slowmo'
    powerupTimer: 0,
    sessionCoins: 0,
    coinParticles: [],
    coinPopups: [],
    coinHUDFlash: 0,
    birdSkin: parseInt(localStorage.getItem('flappySkin') || '0'),
};

// ============================================
// INIT & CONTROLS
// ============================================
function initFlappy() {
    const state = flappyState;
    state.canvas = document.getElementById('flappy-canvas');
    state.ctx = state.canvas.getContext('2d');
    const maxWidth  = Math.min(400, window.innerWidth - 60);
    const maxHeight = Math.min(500, window.innerHeight - 300);
    state.canvas.width = maxWidth;
    state.canvas.height = maxHeight;
    state.waitingToStart = false;
    document.getElementById('flappy-high').textContent = state.highScore;
    document.getElementById('flappy-score').textContent = '0';
    document.querySelector('.flappy-start-btn').style.display = 'inline-block';
    document.getElementById('flappy-tap-btn').style.display = 'none';
    drawFlappyStartScreen();
    setupFlappyControls();
}

function setupFlappyControls() {
    const canvas = document.getElementById('flappy-canvas');
    canvas.removeEventListener('click', flappyCanvasClick);
    canvas.removeEventListener('touchstart', flappyCanvasTouch);
    document.removeEventListener('keydown', flappyKeydown);
    canvas.addEventListener('click', flappyCanvasClick);
    canvas.addEventListener('touchstart', flappyCanvasTouch, { passive: false });
    document.addEventListener('keydown', flappyKeydown);
}

function flappyCanvasClick(e) {
    e.preventDefault();
    const state = flappyState;
    if (state.waitingToStart) {
        launchFlappy();
    } else if (state.isRunning && !state.isGameOver) {
        flapBird();
    } else if (!state.isRunning && !state.isGameOver && !state.waitingToStart) {
        // On start screen — cycle bird skin
        state.birdSkin = (state.birdSkin + 1) % FLAPPY_SKINS.length;
        localStorage.setItem('flappySkin', state.birdSkin);
        drawFlappyStartScreen();
    }
}

function flappyCanvasTouch(e) {
    e.preventDefault();
    const state = flappyState;
    if (state.waitingToStart) {
        launchFlappy();
    } else if (state.isRunning && !state.isGameOver) {
        flapBird();
    } else if (!state.isRunning && !state.isGameOver && !state.waitingToStart) {
        state.birdSkin = (state.birdSkin + 1) % FLAPPY_SKINS.length;
        localStorage.setItem('flappySkin', state.birdSkin);
        drawFlappyStartScreen();
    }
}

function flappyKeydown(e) {
    if (typeof gameState !== 'undefined' && gameState.currentGame !== 'flappy') return;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        const state = flappyState;
        if (state.waitingToStart) launchFlappy();
        else if (state.isRunning && !state.isGameOver) flapBird();
        else if (!state.isRunning && !state.waitingToStart) startFlappy();
    }
    if (e.key === 'r' || e.key === 'R') {
        const state = flappyState;
        if (state.isGameOver || (!state.isRunning && !state.waitingToStart)) closeFlappyGameOver();
    }
    // S key cycles skin on start screen
    if ((e.key === 's' || e.key === 'S') && !flappyState.isRunning && !flappyState.waitingToStart) {
        flappyState.birdSkin = (flappyState.birdSkin + 1) % FLAPPY_SKINS.length;
        localStorage.setItem('flappySkin', flappyState.birdSkin);
        drawFlappyStartScreen();
    }
}

function getFlappyDifficulty(score) {
    if (score >= 40) return { speed: 4.5, gap: 110, spawnRate: 70, label: 'INSANE' };
    if (score >= 30) return { speed: 4.0, gap: 115, spawnRate: 75, label: 'EXTREME' };
    if (score >= 20) return { speed: 3.5, gap: 120, spawnRate: 80, label: 'HARD' };
    if (score >= 10) return { speed: 3.0, gap: 130, spawnRate: 90, label: 'MEDIUM' };
    return { speed: 2.5, gap: 140, spawnRate: 100, label: 'EASY' };
}

function getFlappyMedal(score) {
    if (score >= 40) return { emoji: '👑', name: 'Crown',    color: '#e74c3c' };
    if (score >= 30) return { emoji: '🏆', name: 'Platinum', color: '#e5e4e2' };
    if (score >= 20) return { emoji: '🥇', name: 'Gold',     color: '#ffd700' };
    if (score >= 10) return { emoji: '🥈', name: 'Silver',   color: '#c0c0c0' };
    if (score >= 5)  return { emoji: '🥉', name: 'Bronze',   color: '#cd7f32' };
    return null;
}

// ============================================
// DRAW HELPERS
// ============================================
function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
}

function _drawFlappyHills(ctx, W, groundY, color, scale) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, groundY);
    const hills = [
        {cx:W*0.1, r:80*scale}, {cx:W*0.28, r:115*scale},
        {cx:W*0.48, r:90*scale}, {cx:W*0.66, r:120*scale},
        {cx:W*0.84, r:88*scale}, {cx:W*1.0,  r:75*scale},
    ];
    for (const h of hills) ctx.arc(h.cx, groundY, h.r, Math.PI, 0);
    ctx.lineTo(W, groundY); ctx.closePath(); ctx.fill();
}

function _drawFlappyCityline(ctx, W, groundY, alpha) {
    ctx.globalAlpha = alpha;
    const buildings = [
        {x:0,w:38,h:88},{x:33,w:26,h:118},{x:55,w:48,h:68},{x:98,w:33,h:142},
        {x:126,w:24,h:98},{x:146,w:44,h:78},{x:184,w:29,h:158},{x:208,w:38,h:108},
        {x:242,w:26,h:88},{x:264,w:48,h:128},{x:308,w:33,h:98},{x:338,w:24,h:148},{x:358,w:44,h:83},
    ];
    for (const b of buildings) {
        const bx = b.x % W;
        ctx.fillStyle = '#08152a'; ctx.fillRect(bx, groundY - b.h, b.w, b.h);
        for (let wy = groundY - b.h + 8; wy < groundY - 8; wy += 14) {
            for (let wx = bx + 4; wx < bx + b.w - 6; wx += 9) {
                if (Math.sin(wx * 3.7 + wy * 5.3) > 0.1) {
                    ctx.fillStyle = 'rgba(255,220,80,0.65)'; ctx.fillRect(wx, wy, 5, 6);
                }
            }
        }
    }
    ctx.globalAlpha = 1;
}

function drawFlappyStars(ctx, canvas, frameCount) {
    for (let i = 0; i < 55; i++) {
        const sx = ((i*137+42) % canvas.width);
        const sy = ((i*97+42)  % (canvas.height*0.62));
        const twinkle = Math.sin(frameCount*0.05 + i*1.5)*0.5 + 0.5;
        const size = (i%3===0) ? 2.2 : 1.3;
        ctx.fillStyle = `rgba(255,255,255,${twinkle*0.92})`;
        ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI*2); ctx.fill();
        if (i%6===0 && twinkle>0.75) {
            ctx.strokeStyle = `rgba(255,255,255,${twinkle*0.38})`; ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(sx-5,sy); ctx.lineTo(sx+5,sy);
            ctx.moveTo(sx,sy-5); ctx.lineTo(sx,sy+5);
            ctx.stroke();
        }
    }
}

function drawFlappyScore(ctx, canvas, score) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.font = `bold 46px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#ffffff'; ctx.fillText(score, canvas.width/2, 58);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#1a2a3a'; ctx.lineWidth = 5;
    ctx.strokeText(score, canvas.width/2, 58);
    ctx.fillStyle = '#ffffff'; ctx.fillText(score, canvas.width/2, 58);
    ctx.restore();
}

// ============================================
// DRAW: BIRD (skin-aware)
// ============================================
function drawBird(ctx, x, y, rotation, flapFrame, skinIdx) {
    const sk = FLAPPY_SKINS[skinIdx !== undefined ? skinIdx : (flappyState.birdSkin || 0)];
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rotation);

    const bodyGrad = ctx.createRadialGradient(-3,-4,2, 0,0,17);
    bodyGrad.addColorStop(0, sk.body1);
    bodyGrad.addColorStop(0.45, sk.body2);
    bodyGrad.addColorStop(1, sk.body3);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); ctx.ellipse(0,0,17,14,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = sk.stroke; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.52)';
    ctx.beginPath(); ctx.ellipse(4,4,8,6,0.2,0,Math.PI*2); ctx.fill();

    ctx.fillStyle = flapFrame ? sk.wing1 : sk.wing2;
    ctx.beginPath();
    if (flapFrame) ctx.ellipse(-4,-10,11,5,-0.28,0,Math.PI*2);
    else           ctx.ellipse(-4, 6,11,5, 0.28,0,Math.PI*2);
    ctx.fill(); ctx.strokeStyle = sk.stroke; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(8,-4,6.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(9.6,-4,3.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(11,-5.6,1.5,0,Math.PI*2); ctx.fill();

    ctx.fillStyle = sk.beak1;
    ctx.beginPath(); ctx.moveTo(13,-2.5); ctx.lineTo(23,0); ctx.lineTo(13,1.5);
    ctx.closePath(); ctx.fill(); ctx.strokeStyle = sk.beak2; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle = sk.beak2;
    ctx.beginPath(); ctx.moveTo(13,1.5); ctx.lineTo(22,2.5); ctx.lineTo(13,4.5);
    ctx.closePath(); ctx.fill();

    ctx.restore();
}

// ============================================
// DRAW: PIPE
// ============================================
function drawFlappyPipe(ctx, pipe, groundY) {
    const state = flappyState;
    const { pipeWidth, pipeGap, score } = state;
    const topHeight = pipe.topHeight;
    const bottomY = topHeight + pipeGap;
    const bottomHeight = groundY - bottomY;
    const capExtra = 8, capHeight = 28;
    const capX = pipe.x - capExtra/2, capW = pipeWidth + capExtra;
    const isNight = score >= 30;

    let c1, c2, c3, cOut;
    if (isNight)       { c1='#0d4a2a'; c2='#1a8a50'; c3='#082818'; cOut='#041410'; }
    else if (score>=20){ c1='#8B4513'; c2='#CD853F'; c3='#6B3410'; cOut='#5a2d0c'; }
    else               { c1='#229954'; c2='#55d98d'; c3='#1e8449'; cOut='#1a7a3a'; }

    if (isNight) { ctx.shadowColor='#00ff88'; ctx.shadowBlur=14; }

    const makeG = (x, w) => {
        const g = ctx.createLinearGradient(x,0,x+w,0);
        g.addColorStop(0,c3); g.addColorStop(0.2,c1);
        g.addColorStop(0.5,c2); g.addColorStop(0.8,c1); g.addColorStop(1,c3);
        return g;
    };
    const pipeG = makeG(pipe.x, pipeWidth);
    const capG  = makeG(capX, capW);

    ctx.fillStyle=pipeG; ctx.fillRect(pipe.x,0,pipeWidth,topHeight);
    ctx.strokeStyle=cOut; ctx.lineWidth=2; ctx.strokeRect(pipe.x,0,pipeWidth,topHeight);
    ctx.fillStyle=capG; ctx.fillRect(capX,topHeight-capHeight,capW,capHeight);
    ctx.strokeRect(capX,topHeight-capHeight,capW,capHeight);

    ctx.fillStyle=pipeG; ctx.fillRect(pipe.x,bottomY,pipeWidth,bottomHeight);
    ctx.strokeStyle=cOut; ctx.strokeRect(pipe.x,bottomY,pipeWidth,bottomHeight);
    ctx.fillStyle=capG; ctx.fillRect(capX,bottomY,capW,capHeight);
    ctx.strokeRect(capX,bottomY,capW,capHeight);

    ctx.fillStyle='rgba(255,255,255,0.14)';
    ctx.fillRect(pipe.x+4,0,pipeWidth*0.2,topHeight);
    ctx.fillRect(capX+4,topHeight-capHeight+4,capW*0.25,capHeight-8);
    ctx.fillRect(pipe.x+4,bottomY,pipeWidth*0.2,bottomHeight);
    ctx.fillRect(capX+4,bottomY+4,capW*0.25,capHeight-8);

    ctx.shadowBlur = 0;
}

// ============================================
// DRAW: CLOUD
// ============================================
function drawCloud(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(170,205,235,0.38)';
    ctx.beginPath();
    ctx.arc(4,8,23,0,Math.PI*2); ctx.arc(28,3,19,0,Math.PI*2);
    ctx.arc(52,7,22,0,Math.PI*2); ctx.arc(18,-7,16,0,Math.PI*2); ctx.arc(37,-9,18,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.beginPath();
    ctx.arc(0,5,23,0,Math.PI*2); ctx.arc(25,0,19,0,Math.PI*2);
    ctx.arc(50,4,22,0,Math.PI*2); ctx.arc(14,-11,16,0,Math.PI*2); ctx.arc(34,-13,18,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.arc(12,-7,10,0,Math.PI*2); ctx.arc(30,-9,9,0,Math.PI*2); ctx.fill();
    ctx.restore();
}

// ============================================
// DRAW: GROUND
// ============================================
function drawFlappyGround(ctx, canvas, frameCount) {
    const state = flappyState;
    const groundY = canvas.height - state.groundHeight, W = canvas.width;
    const isNight = state.score>=30, isSunset = state.score>=20;

    let gc1,gc2,gr1,gr2;
    if (isNight)       { gc1='#2a1c07'; gc2='#180e03'; gr1='#1e4a18'; gr2='#112c0e'; }
    else if (isSunset) { gc1='#8B6914'; gc2='#6b4f10'; gr1='#6b8e23'; gr2='#556b2f'; }
    else               { gc1='#8B6914'; gc2='#6b4f10'; gr1='#4CAF50'; gr2='#388E3C'; }

    const groundGrad = ctx.createLinearGradient(0,groundY,0,canvas.height);
    groundGrad.addColorStop(0,gc1); groundGrad.addColorStop(1,gc2);
    ctx.fillStyle=groundGrad; ctx.fillRect(0,groundY,W,state.groundHeight);

    const grassGrad = ctx.createLinearGradient(0,groundY,0,groundY+16);
    grassGrad.addColorStop(0,gr1); grassGrad.addColorStop(1,gr2);
    ctx.fillStyle=grassGrad; ctx.fillRect(0,groundY,W,16);

    ctx.strokeStyle=gr2; ctx.lineWidth=1.2;
    const scrollOffset = frameCount ? (frameCount*2)%18 : 0;
    for (let i=-scrollOffset; i<W+18; i+=18) {
        ctx.beginPath(); ctx.moveTo(i,groundY);
        ctx.quadraticCurveTo(i+4,groundY-9,i+9,groundY+10); ctx.stroke();
    }

    ctx.strokeStyle=gc2; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,groundY); ctx.lineTo(W,groundY); ctx.stroke();

    ctx.fillStyle='rgba(0,0,0,0.09)';
    for (let i=0;i<W;i+=28) {
        for (let j=groundY+20;j<canvas.height;j+=18) {
            ctx.beginPath(); ctx.arc(i+((j%36===0)?14:0),j,1.8,0,Math.PI*2); ctx.fill();
        }
    }
}

// ============================================
// DRAW: COIN
// ============================================
function drawCoin(ctx, coin) {
    const scaleX = Math.abs(Math.cos(coin.angle));
    ctx.save();
    ctx.translate(coin.x, coin.y);
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 18;
    ctx.scale(scaleX, 1);

    // Outer ring
    const grad = ctx.createRadialGradient(-4,-4,1, 0,0,13);
    grad.addColorStop(0,'#fffae0'); grad.addColorStop(0.3,'#ffd700');
    grad.addColorStop(0.72,'#f0a800'); grad.addColorStop(1,'#8B6914');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#7a5200'; ctx.lineWidth=2; ctx.stroke();
    ctx.shadowBlur=0;

    if (scaleX > 0.2) {
        // Inner decorative ring
        ctx.strokeStyle='rgba(255,255,255,0.38)'; ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.stroke();
        // Shine highlight
        ctx.fillStyle='rgba(255,255,255,0.48)';
        ctx.beginPath(); ctx.ellipse(-3,-4,5,3,-0.5,0,Math.PI*2); ctx.fill();
    }

    if (scaleX > 0.35) {
        ctx.scale(1/scaleX, 1);
        ctx.fillStyle='#7a5200';
        ctx.font='bold 12px sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('$',0,1);
    }
    ctx.restore();
}

// Spawn sparkle + floating "+1" when coin is collected
function spawnCoinEffect(x, y) {
    const state = flappyState;
    const colors = ['#ffd700','#fff8a0','#ffb84d','#ffffff','#ffe066'];
    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.6;
        const spd = 1.5 + Math.random() * 2.5;
        state.coinParticles.push({
            x, y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd - 1.2,
            life: 1.0,
            decay: 0.035 + Math.random() * 0.03,
            size: 2 + Math.random() * 3,
            color: colors[Math.floor(Math.random() * colors.length)],
        });
    }
    state.coinPopups.push({ x, y, vy: -1.4, life: 1.0, decay: 0.024 });
    state.coinHUDFlash = 1.0;
}

// ============================================
// DRAW: POWER-UP
// ============================================
function drawFlappyPowerup(ctx, pu) {
    const bobY = pu.y + Math.sin(pu.bobAngle)*5;
    ctx.save();
    ctx.translate(pu.x, bobY);
    let color, emoji;
    if (pu.type==='shield') { color='#00ccff'; emoji='🛡'; }
    else                    { color='#cc44ff'; emoji='⏱'; }
    ctx.shadowColor=color; ctx.shadowBlur=18;
    ctx.fillStyle=color+'40';
    ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=color; ctx.lineWidth=2.2;
    ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.font='16px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(emoji,0,1);
    ctx.restore();
}

// ============================================
// DRAW: SHIELD RING AROUND BIRD
// ============================================
function drawShieldRing(ctx, bird, frame) {
    const pulse = Math.sin(frame*0.15)*0.14 + 1;
    ctx.save();
    ctx.translate(bird.x, bird.y); ctx.scale(pulse,pulse);
    ctx.strokeStyle='#00ccff'; ctx.lineWidth=2.5;
    ctx.shadowColor='#00ccff'; ctx.shadowBlur=14;
    ctx.beginPath(); ctx.arc(0,0,26,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.restore();
}

// ============================================
// DRAW: SKIN PREVIEW (for start screen)
// ============================================
function drawSkinSelector(ctx, W, groundY, activeSkin) {
    const y = groundY * 0.93;
    ctx.textAlign='center';
    ctx.font=`12px 'Segoe UI', sans-serif`;
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.fillText('Tap canvas / S key to change bird', W/2, y - 28);

    const xs = [W/2 - 44, W/2, W/2 + 44];
    FLAPPY_SKINS.forEach((sk, i) => {
        const x = xs[i];
        // selection ring
        if (i === activeSkin) {
            ctx.strokeStyle='#ffd700'; ctx.lineWidth=2.5;
            ctx.shadowColor='#ffd700'; ctx.shadowBlur=8;
            ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI*2); ctx.stroke();
            ctx.shadowBlur=0;
        }
        // mini bird body (just circle with skin color)
        ctx.fillStyle=sk.body2;
        ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle=sk.stroke; ctx.lineWidth=1.2; ctx.stroke();
        // white eye
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x+4,y-3,4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(x+5,y-3,2,0,Math.PI*2); ctx.fill();
        // beak
        ctx.fillStyle=sk.beak1;
        ctx.beginPath(); ctx.moveTo(x+8,y-1); ctx.lineTo(x+14,y+1); ctx.lineTo(x+8,y+3);
        ctx.closePath(); ctx.fill();
        // label
        ctx.fillStyle = i===activeSkin ? '#ffd700' : 'rgba(255,255,255,0.5)';
        ctx.font=`bold 9px 'Segoe UI', sans-serif`;
        ctx.fillText(sk.name, x, y+22);
    });
    ctx.textBaseline='alphabetic';
}

// ============================================
// DRAW: START SCREEN
// ============================================
function drawFlappyStartScreen() {
    const state = flappyState;
    const { ctx, canvas } = state;
    const W = canvas.width, H = canvas.height;
    const groundY = H - state.groundHeight;

    const skyGrad = ctx.createLinearGradient(0,0,0,groundY);
    skyGrad.addColorStop(0,'#1565a8'); skyGrad.addColorStop(0.5,'#4dc9f6'); skyGrad.addColorStop(1,'#b0e8f5');
    ctx.fillStyle=skyGrad; ctx.fillRect(0,0,W,groundY);

    _drawFlappyHills(ctx,W,groundY,'rgba(80,148,58,0.48)',1.0);
    _drawFlappyHills(ctx,W,groundY,'rgba(52,118,38,0.68)',0.7);

    drawCloud(ctx,W*0.12,52,1.1); drawCloud(ctx,W*0.58,82,0.88); drawCloud(ctx,W*0.86,36,0.65);
    drawFlappyGround(ctx,canvas,0);

    drawBird(ctx,W/2,groundY*0.46,0,1);

    ctx.save();
    ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=18; ctx.shadowOffsetY=4;
    ctx.fillStyle='rgba(0,0,0,0.32)';
    _roundRect(ctx,(W-240)/2,groundY*0.1,240,58,14); ctx.fill();
    ctx.restore();

    ctx.textAlign='center';
    ctx.font=`bold 38px 'Segoe UI', sans-serif`;
    ctx.strokeStyle='#0a2800'; ctx.lineWidth=6;
    ctx.strokeText('FLAPPY BIRD',W/2,groundY*0.17+30);
    ctx.fillStyle='#ffd700'; ctx.fillText('FLAPPY BIRD',W/2,groundY*0.17+30);

    ctx.font=`bold 15px 'Segoe UI', sans-serif`;
    ctx.strokeStyle='#0a2040'; ctx.lineWidth=3;
    ctx.strokeText('Press Start to Play',W/2,groundY*0.62);
    ctx.fillStyle='#ffffff'; ctx.fillText('Press Start to Play',W/2,groundY*0.62);

    if (state.highScore > 0) {
        ctx.font=`bold 14px 'Segoe UI', sans-serif`;
        ctx.strokeStyle='#0a2040'; ctx.lineWidth=3;
        ctx.strokeText(`Best: ${state.highScore}`,W/2,groundY*0.73);
        ctx.fillStyle='#ffd700'; ctx.fillText(`Best: ${state.highScore}`,W/2,groundY*0.73);
    }

    drawSkinSelector(ctx, W, groundY, state.birdSkin);
}

// ============================================
// IDLE (GET READY) SCREEN
// ============================================
function updateFlappyIdle() {
    const state = flappyState;
    if (!state.waitingToStart) return;
    state.idleBobFrame = (state.idleBobFrame || 0) + 1;
    drawFlappyIdleScreen();
    state.gameLoop = requestAnimationFrame(updateFlappyIdle);
}

function drawFlappyIdleScreen() {
    const state = flappyState;
    const { ctx, canvas, bird } = state;
    const W = canvas.width, H = canvas.height;
    const groundY = H - state.groundHeight;

    const skyGrad = ctx.createLinearGradient(0,0,0,groundY);
    skyGrad.addColorStop(0,'#1565a8'); skyGrad.addColorStop(0.5,'#4dc9f6'); skyGrad.addColorStop(1,'#b0e8f5');
    ctx.fillStyle=skyGrad; ctx.fillRect(0,0,W,groundY);

    _drawFlappyHills(ctx,W,groundY,'rgba(80,148,58,0.44)',1.0);
    _drawFlappyHills(ctx,W,groundY,'rgba(52,118,38,0.62)',0.7);

    const cOff = (state.idleBobFrame*0.5) % (W+220);
    ctx.globalAlpha=0.86;
    drawCloud(ctx,(W*0.15-cOff+W+220)%(W+220)-110,50,1.0);
    drawCloud(ctx,(W*0.62-cOff*0.7+W+220)%(W+220)-110,86,0.8);
    ctx.globalAlpha=1;

    drawFlappyGround(ctx,canvas,state.idleBobFrame);

    const bobY = bird.y + Math.sin(state.idleBobFrame*0.07)*10;
    drawBird(ctx,bird.x,bobY,0,Math.floor(state.idleBobFrame/7)%2);

    ctx.save();
    ctx.shadowColor='rgba(0,0,0,0.35)'; ctx.shadowBlur=12; ctx.shadowOffsetY=3;
    ctx.fillStyle='rgba(0,0,0,0.28)';
    _roundRect(ctx,W*0.06,H*0.1,W*0.88,52,12); ctx.fill();
    ctx.restore();

    ctx.textAlign='center';
    ctx.font=`bold 30px 'Segoe UI', sans-serif`;
    ctx.strokeStyle='#0a2040'; ctx.lineWidth=5;
    ctx.strokeText('GET READY!',W/2,H*0.1+36);
    ctx.fillStyle='#ffd700'; ctx.fillText('GET READY!',W/2,H*0.1+36);

    if (Math.floor(state.idleBobFrame/25)%2===0) {
        ctx.font=`bold 16px 'Segoe UI', sans-serif`;
        ctx.strokeStyle='#0a2040'; ctx.lineWidth=3;
        ctx.strokeText('Tap / Space to Fly!',W/2,H*0.28);
        ctx.fillStyle='#fff'; ctx.fillText('Tap / Space to Fly!',W/2,H*0.28);
    }

    const pulse = Math.sin(state.idleBobFrame*0.1)*0.18+1;
    ctx.save(); ctx.translate(W/2,H*0.78); ctx.scale(pulse,pulse);
    ctx.font='36px serif'; ctx.textAlign='center'; ctx.fillText('👆',0,0); ctx.restore();

    drawFlappyScore(ctx,canvas,0);
}

// ============================================
// GAME LIFECYCLE
// ============================================
function startFlappy() {
    if (typeof initGameAudio === 'function') initGameAudio();
    const state = flappyState;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop=null; }
    const overlay = document.querySelector('.flappy-gameover');
    if (overlay) overlay.remove();

    state.bird = {
        x: state.canvas.width*0.25,
        y: state.canvas.height/2,
        width:34, height:26,
        velocity:0, rotation:0, flapFrame:0, flapTimer:0
    };
    state.pipes = []; state.coins = []; state.powerups = [];
    state.score = 0; state.sessionCoins = 0;
    state.coinParticles = []; state.coinPopups = []; state.coinHUDFlash = 0;
    state.activePowerup = null; state.powerupTimer = 0;
    state.isRunning = false; state.isGameOver = false; state.waitingToStart = true;
    state.frameCount = 0;
    state.pipeSpeed = 2.5; state.pipeGap = 140;
    state.lastTime = performance.now(); state.idleBobFrame = 0;

    document.getElementById('flappy-score').textContent='0';
    document.querySelector('.flappy-start-btn').style.display='none';
    document.getElementById('flappy-tap-btn').style.display='inline-flex';
    document.getElementById('flappy-tap-btn').innerHTML='<i class="fas fa-arrow-up"></i> TAP TO START';

    _playFlappySFX('swoosh');
    state.gameLoop = requestAnimationFrame(updateFlappyIdle);
    if (typeof showToast === 'function') showToast('Get ready! Tap or Space to fly! 🐦','info');
}

function launchFlappy() {
    const state = flappyState;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop=null; }
    state.waitingToStart=false; state.isRunning=true; state.isGameOver=false;
    state.frameCount=0; state.lastTime=performance.now();
    state.bird.velocity=state.flapStrength; state.bird.flapFrame=1; state.bird.flapTimer=8;
    document.getElementById('flappy-tap-btn').innerHTML='<i class="fas fa-arrow-up"></i> TAP TO FLY';
    playFlappyFlap();
    state.gameLoop=requestAnimationFrame(updateFlappy);
    if (typeof showToast === 'function') showToast('Go! 🚀','success');
}

function flapBird() {
    const state = flappyState;
    if (!state.isRunning || state.isGameOver) return;
    state.bird.velocity=state.flapStrength; state.bird.flapFrame=1; state.bird.flapTimer=8;
    playFlappyFlap();
}

// ============================================
// MAIN UPDATE LOOP
// ============================================
function updateFlappy(timestamp) {
    const state = flappyState;
    if (!state.isRunning) return;
    const { canvas, bird } = state;
    const deltaTime = Math.min((timestamp-state.lastTime)/16.67, 2);
    state.lastTime=timestamp; state.frameCount++;

    const diff = getFlappyDifficulty(state.score);
    // Slow-mo power-up reduces pipe speed by 45%
    state.pipeSpeed = diff.speed * (state.activePowerup==='slowmo' ? 0.55 : 1);
    state.pipeGap = diff.gap;
    state.pipeSpawnRate = diff.spawnRate;

    // Bird physics
    bird.velocity += state.gravity*deltaTime;
    bird.y += bird.velocity*deltaTime;
    if (bird.velocity<0) bird.rotation=Math.max(bird.rotation-0.08*deltaTime,-0.5);
    else                  bird.rotation=Math.min(bird.rotation+0.04*deltaTime,Math.PI/2);
    if (bird.flapTimer>0) { bird.flapTimer-=deltaTime; if(bird.flapTimer<=0) bird.flapFrame=0; }

    // Spawn pipes
    if (state.frameCount % Math.floor(state.pipeSpawnRate)===0) spawnFlappyPipe();

    // Power-up timer
    if (state.activePowerup) {
        state.powerupTimer -= deltaTime;
        if (state.powerupTimer<=0) state.activePowerup=null;
    }

    // Move & score pipes. Also oscillate moving pipes.
    for (let i=state.pipes.length-1; i>=0; i--) {
        const pipe = state.pipes[i];
        pipe.x -= state.pipeSpeed*deltaTime;

        // Moving pipes: oscillate topHeight
        if (pipe.vy !== undefined) {
            pipe.topHeight += pipe.vy*deltaTime;
            if (pipe.topHeight<=pipe.minTop || pipe.topHeight>=pipe.maxTop) pipe.vy*=-1;
            pipe.topHeight=Math.max(pipe.minTop, Math.min(pipe.maxTop, pipe.topHeight));
        }

        if (!pipe.scored && pipe.x+state.pipeWidth<bird.x) {
            pipe.scored=true; state.score++;
            document.getElementById('flappy-score').textContent=state.score;
            playFlappyScore(state.score);
            if (typeof showToast==='function') {
                if (state.score===5)  showToast('5 pts! Nice! 🌟','success');
                if (state.score===10) showToast('10 pts! Medium difficulty! 🔥','success');
                if (state.score===15) showToast('15 pts! Pipes moving! ⚡','success');
                if (state.score===20) showToast('20 pts! Sunset mode! 🌅','success');
                if (state.score===25) { showToast('25 pts! Amazing! 🏆','success'); if(typeof showConfetti==='function') showConfetti(); }
                if (state.score===30) showToast('30 pts! Night mode! 🌙','success');
                if (state.score===40) { showToast('40 pts! Crown! 👑','success'); if(typeof showConfetti==='function') showConfetti(); }
                if (state.score===50) { showToast('50 pts! LEGENDARY! 💎','success'); if(typeof showConfetti==='function') showConfetti(); }
            }
        }
        if (pipe.x+state.pipeWidth<-10) state.pipes.splice(i,1);
    }

    // Move & collect coins
    for (let i=state.coins.length-1; i>=0; i--) {
        const coin = state.coins[i];
        coin.x -= state.pipeSpeed*deltaTime;
        coin.angle += 0.08*deltaTime;
        if (coin.x < -20) { state.coins.splice(i,1); continue; }
        const dx=bird.x-coin.x, dy=bird.y-coin.y;
        if (Math.sqrt(dx*dx+dy*dy)<22) {
            state.coins.splice(i,1);
            state.sessionCoins++;
            spawnCoinEffect(coin.x, coin.y);
            playFlappyCoin();
        }
    }

    // Move & collect power-ups
    for (let i=state.powerups.length-1; i>=0; i--) {
        const pu = state.powerups[i];
        pu.x -= state.pipeSpeed*deltaTime;
        pu.bobAngle += 0.06*deltaTime;
        if (pu.x < -30) { state.powerups.splice(i,1); continue; }
        const dx=bird.x-pu.x, dy=bird.y-pu.y;
        if (Math.sqrt(dx*dx+dy*dy)<28) {
            state.powerups.splice(i,1);
            state.activePowerup = pu.type;
            state.powerupTimer = 5 * 60; // 5 seconds * 60fps equivalent
            playFlappyPowerup();
            if (typeof showToast==='function') {
                if (pu.type==='shield') showToast('🛡 Shield activated! One free hit!','success');
                else                    showToast('⏱ Slow-Mo activated! Pipes slow!','success');
            }
        }
    }

    const groundY = canvas.height-state.groundHeight;
    if (bird.y-bird.height/2<=0) { bird.y=bird.height/2; bird.velocity=0; }
    if (bird.y+bird.height/2>=groundY) { flappyGameOver(); return; }

    // Pipe collision — shield absorbs one hit
    for (const pipe of state.pipes) {
        const bL=bird.x-bird.width/2+4, bR=bird.x+bird.width/2-4;
        const bT=bird.y-bird.height/2+4, bB=bird.y+bird.height/2-4;
        if (bR>pipe.x && bL<pipe.x+state.pipeWidth) {
            if (bT<pipe.topHeight || bB>pipe.topHeight+state.pipeGap) {
                if (state.activePowerup==='shield') {
                    state.activePowerup=null; state.powerupTimer=0;
                    playFlappyShieldBreak();
                    if (typeof showToast==='function') showToast('🛡 Shield absorbed the hit!','info');
                    // Push bird away from pipe
                    bird.velocity = state.flapStrength * 0.7;
                    bird.x -= 20;
                } else {
                    flappyGameOver(); return;
                }
            }
        }
    }

    drawFlappyFrame();
    state.gameLoop=requestAnimationFrame(updateFlappy);
}

// ============================================
// SPAWN PIPE (+ coins + power-ups + moving)
// ============================================
function spawnFlappyPipe() {
    const state = flappyState;
    const groundY = state.canvas.height-state.groundHeight;
    const minTop=60, maxTop=groundY-state.pipeGap-60;
    const topHeight = Math.floor(Math.random()*(maxTop-minTop))+minTop;
    const pipe = { x: state.canvas.width+10, topHeight, scored:false };

    // Moving pipes at score >= 15
    if (state.score>=15) {
        pipe.vy = (Math.random()>0.5?1:-1)*(0.4+Math.random()*0.5);
        pipe.minTop = minTop; pipe.maxTop = maxTop;
    }
    state.pipes.push(pipe);

    // Coin: spawn in center of gap (~70% chance)
    if (Math.random()<0.7) {
        const gapCenterY = topHeight + state.pipeGap/2 + (Math.random()-0.5)*30;
        state.coins.push({
            x: state.canvas.width+10+state.pipeWidth/2,
            y: gapCenterY,
            angle: Math.random()*Math.PI*2,
        });
    }

    // Power-up: ~12% chance when score > 5, no powerup currently active
    if (state.score>5 && !state.activePowerup && Math.random()<0.12) {
        const type = Math.random()<0.6 ? 'shield' : 'slowmo';
        const puY = topHeight + state.pipeGap/2 + (Math.random()-0.5)*20;
        state.powerups.push({
            x: state.canvas.width+10+state.pipeWidth/2+60,
            y: puY, type, bobAngle:0
        });
    }
}

// ============================================
// MAIN GAME FRAME DRAW
// ============================================
function drawFlappyFrame() {
    const state = flappyState;
    const { ctx, canvas, bird } = state;
    const W=canvas.width, H=canvas.height;
    const groundY=H-state.groundHeight;
    const isNight=state.score>=30, isSunset=state.score>=20;

    // Sky
    const skyGrad=ctx.createLinearGradient(0,0,0,groundY);
    if (isNight) {
        skyGrad.addColorStop(0,'#05091a'); skyGrad.addColorStop(0.4,'#0d1840');
        skyGrad.addColorStop(0.8,'#182e5e'); skyGrad.addColorStop(1,'#22386a');
    } else if (isSunset) {
        skyGrad.addColorStop(0,'#1a0533'); skyGrad.addColorStop(0.2,'#6b2fa0');
        skyGrad.addColorStop(0.42,'#ff5a58'); skyGrad.addColorStop(0.62,'#ff8a3a');
        skyGrad.addColorStop(0.82,'#ffd05a'); skyGrad.addColorStop(1,'#c8eaf0');
    } else {
        skyGrad.addColorStop(0,'#1565a8'); skyGrad.addColorStop(0.55,'#4dc9f6');
        skyGrad.addColorStop(1,'#b0e8f5');
    }
    ctx.fillStyle=skyGrad; ctx.fillRect(0,0,W,groundY);

    // Night: stars + moon
    if (isNight) {
        drawFlappyStars(ctx,canvas,state.frameCount);
        ctx.fillStyle='#f0f0f0'; ctx.shadowColor='#f0f0f0'; ctx.shadowBlur=30;
        ctx.beginPath(); ctx.arc(W-58,52,24,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
        ctx.fillStyle='rgba(200,200,200,0.28)';
        ctx.beginPath(); ctx.arc(W-50,46,5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(W-65,58,3.5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(W-56,66,4,0,Math.PI*2); ctx.fill();
    }

    // Sunset sun
    if (isSunset && !isNight) {
        const sunGrad=ctx.createRadialGradient(W-55,groundY-22,5,W-55,groundY-22,48);
        sunGrad.addColorStop(0,'#fff5a0'); sunGrad.addColorStop(0.5,'#ffb74d');
        sunGrad.addColorStop(1,'rgba(255,80,20,0)');
        ctx.fillStyle=sunGrad;
        ctx.beginPath(); ctx.arc(W-55,groundY-22,48,0,Math.PI*2); ctx.fill();
    }

    // Background silhouettes
    if (isNight) {
        _drawFlappyCityline(ctx,W,groundY,0.88);
    } else if (isSunset) {
        ctx.fillStyle='rgba(70,20,75,0.52)';
        ctx.beginPath(); ctx.moveTo(0,groundY);
        ctx.lineTo(W*0.07,groundY-92); ctx.lineTo(W*0.2,groundY-52);
        ctx.lineTo(W*0.32,groundY-132); ctx.lineTo(W*0.44,groundY-62);
        ctx.lineTo(W*0.57,groundY-115); ctx.lineTo(W*0.7,groundY-42);
        ctx.lineTo(W*0.84,groundY-105); ctx.lineTo(W,groundY-55);
        ctx.lineTo(W,groundY); ctx.closePath(); ctx.fill();
    } else {
        _drawFlappyHills(ctx,W,groundY,'rgba(58,128,48,0.32)',1.0);
        _drawFlappyHills(ctx,W,groundY,'rgba(38,98,30,0.48)',0.7);
    }

    // Speed lines at high score (score >= 30)
    if (state.score>=30) {
        ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1.5;
        for (let i=0;i<12;i++) {
            const sx=((i*71+state.frameCount*4)%(W+80))-40;
            const sy=((i*53)%groundY);
            ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx-30,sy+8); ctx.stroke();
        }
    }

    // Clouds
    const cloudOffset=(state.frameCount*0.35)%(W+220);
    const cloudAlpha=isNight?0.11:isSunset?0.35:0.84;
    ctx.globalAlpha=cloudAlpha;
    drawCloud(ctx,(W*0.2-cloudOffset+W+220)%(W+220)-110,52,1.0);
    drawCloud(ctx,(W*0.62-cloudOffset*0.7+W+220)%(W+220)-110,90,0.82);
    drawCloud(ctx,(W*0.9-cloudOffset*0.5+W+220)%(W+220)-110,36,0.62);
    ctx.globalAlpha=1;

    // Slow-mo tint
    if (state.activePowerup==='slowmo') {
        ctx.fillStyle='rgba(100,0,160,0.07)'; ctx.fillRect(0,0,W,H);
    }

    for (const pipe of state.pipes) drawFlappyPipe(ctx,pipe,groundY);
    for (const coin of state.coins) drawCoin(ctx,coin);
    for (const pu of state.powerups) drawFlappyPowerup(ctx,pu);

    // Coin sparkle particles
    for (let i=state.coinParticles.length-1; i>=0; i--) {
        const p=state.coinParticles[i];
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life-=p.decay;
        if (p.life<=0) { state.coinParticles.splice(i,1); continue; }
        ctx.save(); ctx.globalAlpha=p.life;
        ctx.fillStyle=p.color;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }

    // Coin "+1" popups
    for (let i=state.coinPopups.length-1; i>=0; i--) {
        const p=state.coinPopups[i];
        p.y+=p.vy; p.life-=p.decay;
        if (p.life<=0) { state.coinPopups.splice(i,1); continue; }
        ctx.save(); ctx.globalAlpha=p.life;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.font=`bold ${Math.round(13+p.life*4)}px 'Segoe UI', sans-serif`;
        ctx.shadowColor='rgba(0,0,0,0.7)'; ctx.shadowBlur=5;
        ctx.fillStyle='#ffd700'; ctx.fillText('+1 🪙',p.x,p.y);
        ctx.restore();
    }

    drawFlappyGround(ctx,canvas,state.frameCount);

    if (state.activePowerup==='shield') drawShieldRing(ctx,bird,state.frameCount);
    drawBird(ctx,bird.x,bird.y,bird.rotation,bird.flapFrame);

    drawFlappyScore(ctx,canvas,state.score);

    // HUD: coin counter (top-right) with flash effect
    if (state.sessionCoins>0 || state.coinHUDFlash>0) {
        if (state.coinHUDFlash>0) state.coinHUDFlash=Math.max(0,state.coinHUDFlash-0.045);
        const fl=state.coinHUDFlash;
        ctx.save();
        const cx=W-22, cy=22;
        // Glow on flash
        if (fl>0) { ctx.shadowColor='#ffd700'; ctx.shadowBlur=14*fl; }
        // Mini coin icon
        const mcg=ctx.createRadialGradient(cx-2,cy-2,1,cx,cy,9);
        mcg.addColorStop(0,'#fffae0'); mcg.addColorStop(0.4,'#ffd700'); mcg.addColorStop(1,'#8B6914');
        ctx.fillStyle=mcg;
        ctx.beginPath(); ctx.arc(cx,cy,9,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#7a5200'; ctx.lineWidth=1.3; ctx.stroke();
        ctx.shadowBlur=0;
        ctx.fillStyle='rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.ellipse(cx-2,cy-2,4,2.5,-0.4,0,Math.PI*2); ctx.fill();
        // Count text
        ctx.textAlign='right'; ctx.textBaseline='middle';
        ctx.font=`bold ${fl>0.3?15:13}px 'Segoe UI', sans-serif`;
        ctx.fillStyle=fl>0?`rgba(255,${220+Math.round(fl*35)},${Math.round(fl*80)},1)`:'#ffd700';
        ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=5;
        ctx.fillText(`×${state.sessionCoins}`,W-34,cy+1);
        ctx.restore();
    }

    // HUD: active power-up timer bar
    if (state.activePowerup) {
        const barW=80, barH=8, barX=(W-barW)/2, barY=72;
        const ratio = Math.max(0,state.powerupTimer/(5*60));
        const color = state.activePowerup==='shield'?'#00ccff':'#cc44ff';
        ctx.fillStyle='rgba(0,0,0,0.4)'; _roundRect(ctx,barX-1,barY-1,barW+2,barH+2,4); ctx.fill();
        ctx.fillStyle=color+'80'; _roundRect(ctx,barX,barY,barW,barH,3); ctx.fill();
        ctx.fillStyle=color; _roundRect(ctx,barX,barY,barW*ratio,barH,3); ctx.fill();
        ctx.shadowColor=color; ctx.shadowBlur=8;
        ctx.fillStyle=color; _roundRect(ctx,barX,barY,barW*ratio,barH,3); ctx.fill();
        ctx.shadowBlur=0;
        ctx.textAlign='center'; ctx.font=`bold 10px 'Segoe UI', sans-serif`;
        ctx.fillStyle='#fff';
        const label=state.activePowerup==='shield'?'🛡 SHIELD':'⏱ SLOW-MO';
        ctx.fillText(label,W/2,barY-3);
    }

    // Difficulty label
    if (state.score>=10) {
        const diff=getFlappyDifficulty(state.score);
        ctx.textAlign='right'; ctx.font=`bold 11px 'Segoe UI', sans-serif`;
        ctx.fillStyle='rgba(255,255,255,0.42)';
        ctx.fillText(diff.label,W-10,groundY-8);
    }
}

// ============================================
// DEATH & GAME OVER
// ============================================
function createFlappyDeathParticles() {
    const state = flappyState;
    if (!state.bird||!state.canvas) return;
    const rect=state.canvas.getBoundingClientRect();
    const scaleX=rect.width/state.canvas.width, scaleY=rect.height/state.canvas.height;
    const bx=rect.left+state.bird.x*scaleX, by=rect.top+state.bird.y*scaleY;

    const colors=['#ffd700','#f5c842','#e6a817','#ff4757','#ffffff','#ff6b6b','#ffa502'];
    for (let i=0;i<20;i++) {
        const p=document.createElement('div'); p.className='particle';
        p.style.cssText=`position:fixed;pointer-events:none;border-radius:${Math.random()>0.5?'50%':'2px'};background-color:${colors[Math.floor(Math.random()*colors.length)]};left:${bx}px;top:${by}px;width:${Math.random()*8+3}px;height:${Math.random()*8+3}px;animation:particleFly 1.2s ease-out forwards;--tx:${(Math.random()-0.5)*200}px;--ty:${(Math.random()-0.5)*200}px;z-index:9999;`;
        document.body.appendChild(p);
        setTimeout(()=>{if(p.parentNode)p.remove();},1200);
    }
    const fc=['#ffe066','#f5c842','#ffffff'];
    for (let i=0;i<8;i++) {
        const f=document.createElement('div'); f.className='particle';
        f.style.cssText=`position:fixed;pointer-events:none;border-radius:50%;background-color:${fc[Math.floor(Math.random()*fc.length)]};left:${bx+(Math.random()-0.5)*20}px;top:${by+(Math.random()-0.5)*20}px;width:${Math.random()*6+4}px;height:${Math.random()*3+2}px;animation:particleFly 1.5s ease-out forwards;--tx:${(Math.random()-0.5)*120}px;--ty:${Math.random()*-100-50}px;z-index:9999;`;
        document.body.appendChild(f);
        setTimeout(()=>{if(f.parentNode)f.remove();},1500);
    }
}

function flappyScreenShake() {
    const canvas=document.getElementById('flappy-canvas'); if(!canvas)return;
    canvas.style.transition='transform 0.05s';
    [{x:-5,y:3},{x:5,y:-3},{x:-3,y:5},{x:3,y:-5},{x:-2,y:2},{x:0,y:0}].forEach((s,i)=>{
        setTimeout(()=>{canvas.style.transform=`translate(${s.x}px,${s.y}px)`;},i*50);
    });
    setTimeout(()=>{canvas.style.transition='';canvas.style.transform='';},350);
}

function flappyGameOver() {
    const state=flappyState;
    state.isRunning=false; state.isGameOver=true; state.waitingToStart=false;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop=null; }

    playFlappyHit();
    setTimeout(()=>playFlappyGameOver(),200);

    createFlappyDeathParticles();
    flappyScreenShake();
    drawFlappyDeathFrame();

    let isNewBest=false;
    if (state.score>state.highScore) {
        state.highScore=state.score;
        localStorage.setItem('flappyHighScore',state.highScore);
        document.getElementById('flappy-high').textContent=state.highScore;
        isNewBest=true;
    }
    if (state.score>0 && typeof saveScore==='function') saveScore('flappy',state.score);

    document.querySelector('.flappy-start-btn').style.display='inline-block';
    document.getElementById('flappy-tap-btn').style.display='none';

    setTimeout(()=>{showFlappyGameOver(isNewBest);},600);

    if (typeof showToast==='function') {
        if (isNewBest && state.score>5) {
            if (typeof showConfetti==='function') showConfetti();
            showToast(`New Best: ${state.score}! 🏆`,'success');
        } else {
            showToast(`Game Over! Score: ${state.score}`,'error');
        }
    }
}

function drawFlappyDeathFrame() {
    const state=flappyState;
    const {ctx,canvas}=state;
    drawFlappyFrame();
    ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    setTimeout(()=>{
        if(!state.canvas)return;
        drawFlappyFrame();
        ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        const vg=ctx.createRadialGradient(canvas.width/2,canvas.height/2,canvas.width*0.3,canvas.width/2,canvas.height/2,canvas.width*0.8);
        vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(255,0,0,0.25)');
        ctx.fillStyle=vg; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.textAlign='center';
        ctx.font=`bold 38px 'Segoe UI', sans-serif`;
        ctx.strokeStyle='#7a0000'; ctx.lineWidth=7;
        ctx.strokeText('GAME OVER',canvas.width/2,canvas.height/2-18);
        ctx.fillStyle='#ff3040'; ctx.fillText('GAME OVER',canvas.width/2,canvas.height/2-18);
        ctx.font=`bold 26px 'Segoe UI', sans-serif`;
        ctx.strokeStyle='#1a2c40'; ctx.lineWidth=4;
        ctx.strokeText(`Score: ${state.score}`,canvas.width/2,canvas.height/2+24);
        ctx.fillStyle='#ffd700'; ctx.fillText(`Score: ${state.score}`,canvas.width/2,canvas.height/2+24);
        if (state.sessionCoins>0) {
            ctx.font=`bold 16px 'Segoe UI', sans-serif`;
            ctx.fillStyle='#ffd700';
            ctx.fillText(`$${state.sessionCoins} coins collected`,canvas.width/2,canvas.height/2+52);
        }
        const medal=getFlappyMedal(state.score);
        if (medal) { ctx.font='40px serif'; ctx.fillText(medal.emoji,canvas.width/2,canvas.height/2+88); }
    },150);
}

function showFlappyGameOver(isNewBest) {
    const existing=document.querySelector('.flappy-gameover'); if(existing)existing.remove();
    const state=flappyState;
    const medal=getFlappyMedal(state.score);
    const difficulty=getFlappyDifficulty(state.score);

    let medalHTML='';
    if (medal) medalHTML=`<div style="font-size:3.5rem;margin:15px 0;animation:pulse 1.5s infinite;">${medal.emoji}</div><p style="color:${medal.color};font-weight:bold;font-size:1.2rem;text-shadow:0 0 10px ${medal.color}40;">${medal.name} Medal!</p>`;

    let skyHTML='';
    if (state.score>=30) skyHTML='<p style="color:#87ceeb;font-size:0.95rem;margin-top:5px;">🌙 Night Mode Reached!</p>';
    else if (state.score>=20) skyHTML='<p style="color:#87ceeb;font-size:0.95rem;margin-top:5px;">🌅 Sunset Mode Reached!</p>';

    let difficultyHTML='';
    if (state.score>=10) difficultyHTML=`<p style="opacity:0.6;font-size:0.9rem;margin-top:5px;">Difficulty: ${difficulty.label}</p>`;

    let coinsHTML='';
    if (state.sessionCoins>0) coinsHTML=`<p style="color:#ffd700;font-size:0.95rem;margin-top:5px;">💰 ${state.sessionCoins} coins collected!</p>`;

    const overlay=document.createElement('div');
    overlay.className='flappy-gameover';
    overlay.style.cssText=`position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fadeIn 0.3s ease;`;
    overlay.innerHTML=`
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);border:2px solid rgba(255,215,0,0.3);border-radius:20px;padding:30px 40px;text-align:center;color:#fff;max-width:320px;width:90%;box-shadow:0 0 40px rgba(255,215,0,0.2);">
            <h3 style="font-size:1.8rem;margin-bottom:10px;">💥 Game Over!</h3>
            ${medalHTML}
            <p>You flew through <strong>${state.score}</strong> pipe${state.score!==1?'s':''}!</p>
            <div style="font-size:2.5rem;font-weight:bold;color:#ffd700;margin:10px 0;">Score: ${state.score}</div>
            ${isNewBest?'<div style="color:#ffd700;font-weight:bold;font-size:1.1rem;animation:pulse 1s infinite;">🏆 NEW BEST SCORE! 🏆</div>':''}
            <p style="opacity:0.7;">Best: ${state.highScore}</p>
            ${coinsHTML}${skyHTML}${difficultyHTML}
            <button onclick="closeFlappyGameOver()" style="margin-top:20px;padding:12px 30px;background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff;border:none;border-radius:25px;font-size:1rem;font-weight:bold;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fas fa-redo"></i> Play Again
            </button>
            <p style="opacity:0.4;font-size:0.8rem;margin-top:12px;">Press R or Space to restart</p>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',(e)=>{if(e.target===overlay)closeFlappyGameOver();});
}

function closeFlappyGameOver() {
    const overlay=document.querySelector('.flappy-gameover'); if(overlay)overlay.remove();
    const state=flappyState;
    state.isRunning=false; state.isGameOver=false; state.waitingToStart=false;
    if (state.gameLoop){cancelAnimationFrame(state.gameLoop);state.gameLoop=null;}
    drawFlappyStartScreen();
}

// Called by closeGame() when player navigates away — stops music and animation loop
window.flappyCleanup = function() {
    Object.values(FLAPPY_SFX).forEach(a => { a.pause(); a.currentTime = 0; });
    const state = flappyState;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop = null; }
    state.isRunning = false;
};

// Export for main game.js integration
if (typeof module!=='undefined'&&module.exports) {
    module.exports={initFlappy,startFlappy,flappyGameOver,closeFlappyGameOver};
}
