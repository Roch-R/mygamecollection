/* ============================================
   1945 PLANE SHOOTER - MEGA UPGRADED VERSION
   ============================================ */

// ============================================
// SHOOTER SOUND SYSTEM (Web Audio API)
// ============================================
let _shooterAudioCtx = null;
function getShooterAudio() {
    if (!_shooterAudioCtx) {
        try { _shooterAudioCtx = new (window.AudioContext || window['webkitAudioContext'])(); } catch(e) {}
    }
    return _shooterAudioCtx;
}
function _shooterNoise(dur, vol, cutoff) {
    const ctx = getShooterAudio(); if (!ctx) return;
    try {
        const len = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 1.5);
        const src = ctx.createBufferSource();
        const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=cutoff||800;
        const g = ctx.createGain(); g.gain.value = vol;
        src.buffer=buf; src.connect(flt); flt.connect(g); g.connect(ctx.destination);
        src.start(ctx.currentTime);
    } catch(e) {}
}
function playShooterShoot() {
    const ctx = getShooterAudio(); if (!ctx) return;
    const osc=ctx.createOscillator(), g=ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type='square';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime+0.06);
    g.gain.setValueAtTime(0.055, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.07);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.08);
}
function playShooterExplosion(big) {
    _shooterNoise(big?0.55:0.22, big?0.45:0.2, big?350:700);
    if (big) {
        const ctx = getShooterAudio(); if (!ctx) return;
        const osc=ctx.createOscillator(), g=ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type='sawtooth';
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime+0.3);
        g.gain.setValueAtTime(0.22, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.35);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.36);
    }
}
function playShooterHit() {
    const ctx = getShooterAudio(); if (!ctx) return;
    const osc=ctx.createOscillator(), g=ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type='sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime+0.2);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.22);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.23);
    _shooterNoise(0.15, 0.18, 1200);
}
function playShooterPowerup() {
    const ctx = getShooterAudio(); if (!ctx) return;
    [523,659,784,1047].forEach((freq,i)=>{
        const osc=ctx.createOscillator(), g=ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type='triangle';
        const t=ctx.currentTime+i*0.07;
        osc.frequency.setValueAtTime(freq,t);
        g.gain.setValueAtTime(0.15,t);
        g.gain.exponentialRampToValueAtTime(0.001,t+0.1);
        osc.start(t); osc.stop(t+0.11);
    });
}
function playShooterBossAlert() {
    const ctx = getShooterAudio(); if (!ctx) return;
    const osc=ctx.createOscillator(), g=ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type='sawtooth';
    [0,0.15,0.3,0.45].forEach(t=>{ osc.frequency.setValueAtTime(t%0.3<0.15?110:220, ctx.currentTime+t); });
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.65);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.65);
}
function playShooterVictory() {
    const ctx = getShooterAudio(); if (!ctx) return;
    [523,659,784,659,784,1047].forEach((freq,i)=>{
        const osc=ctx.createOscillator(), g=ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type='triangle';
        const t=ctx.currentTime+i*0.1;
        osc.frequency.setValueAtTime(freq,t);
        g.gain.setValueAtTime(0.18,t);
        g.gain.exponentialRampToValueAtTime(0.001,t+0.12);
        osc.start(t); osc.stop(t+0.13);
    });
}
function playShooterComboSound(count) {
    const ctx = getShooterAudio(); if (!ctx) return;
    const freqs=[523,659,784,880,1047,1319,1568];
    const freq=freqs[Math.min(count-2,freqs.length-1)];
    const osc=ctx.createOscillator(), g=ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type='sine';
    osc.frequency.setValueAtTime(freq,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq*1.4,ctx.currentTime+0.08);
    g.gain.setValueAtTime(0.13,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.12);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.13);
}

// ============================================
// COMBO, POPUPS & SCREEN SHAKE HELPERS
// ============================================
function addScorePopup(state, x, y, text, color) {
    state.scorePopups.push({ x, y, text, color:color||'#ffd700', vy:-1.5, alpha:1, life:55, size:15 });
}
function updateScorePopups(state, dt) {
    for (let i=state.scorePopups.length-1; i>=0; i--) {
        const p=state.scorePopups[i];
        p.y+=p.vy*dt; p.life-=dt; p.alpha=Math.max(0,p.life/55);
        if (p.life<=0) state.scorePopups.splice(i,1);
    }
}
function drawScorePopups(ctx, state) {
    ctx.save();
    state.scorePopups.forEach(p=>{
        ctx.globalAlpha=p.alpha;
        ctx.textAlign='center';
        ctx.font=`bold ${p.size||15}px 'Segoe UI',sans-serif`;
        ctx.fillStyle=p.color;
        ctx.fillText(p.text,p.x,p.y);
    });
    ctx.globalAlpha=1;
    ctx.restore();
}
function addCombo(state, x, y) {
    state.comboCount++;
    state.comboTimer=130;
    state.comboMultiplier=Math.min(state.comboCount,8);
    if (state.comboCount>=3) {
        playShooterComboSound(state.comboCount);
        const comboColor=state.comboCount>=8?'#ff4757':state.comboCount>=5?'#ff6b35':'#ffd700';
        addScorePopup(state,x,y-24,`COMBO x${state.comboCount}!`,comboColor);
        state.scorePopups[state.scorePopups.length-1].size=18;
    }
}
function updateCombo(state, dt) {
    if (state.comboTimer>0) {
        state.comboTimer-=dt;
        if (state.comboTimer<=0) { state.comboCount=0; state.comboMultiplier=1; }
    }
}
function triggerShake(state, intensity) {
    state.screenShake.intensity=Math.max(state.screenShake.intensity,intensity);
}
function updateShake(state) {
    const s=state.screenShake;
    if (s.intensity>0.4) {
        s.x=(Math.random()-0.5)*s.intensity*2.5;
        s.y=(Math.random()-0.5)*s.intensity*2.5;
        s.intensity*=0.82;
    } else { s.x=0; s.y=0; s.intensity=0; }
}

// ============================================
// FORMATION SPAWNING
// ============================================
function spawnFormation(state) {
    const forms=['v','line','diagonal','arrowhead'];
    const form=forms[Math.floor(Math.random()*forms.length)];
    const types=['basic','fast'];
    const type=types[Math.floor(Math.random()*types.length)];
    const cfg=ENEMY_TYPES[type];
    const count=form==='v'?5:4;
    const cx=state.width/2+(Math.random()-0.5)*state.width*0.35;
    for (let i=0;i<count;i++) {
        let ox=0,oy=0;
        if (form==='v') {
            const half=Math.ceil(count/2);
            if (i<half){ox=-(i+1)*30;oy=i*22;}
            else{const j=i-half+1;ox=j*30;oy=j*22;}
        } else if (form==='line') {
            ox=(i-(count-1)/2)*36; oy=0;
        } else if (form==='diagonal') {
            ox=i*28; oy=i*-20;
        } else { // arrowhead
            const midpoints=[[0,-20],[-28,0],[28,0],[-14,14]];
            [ox,oy]=midpoints[i%midpoints.length];
        }
        state.enemies.push({
            ...cfg, type,
            x:cx+ox, y:-cfg.height/2+oy,
            vx:0, vy:cfg.speed*(1+state.level*0.05),
            maxHp:cfg.hp, flashTimer:0, shootTimer:Infinity,
            formationMember:true
        });
    }
}

// ============================================
// CONSTANTS & GAME DATA
// ============================================

const SHOOTER_CONFIG = {
    CANVAS_WIDTH: 420,
    CANVAS_HEIGHT: 600,
    PLAYER_SPEED: 5,
    BULLET_SPEED: 8,
    ENEMY_SPEED: 2.5,
    BOSS_HP_MULTIPLIER: 20,
    POWER_ORDER: ['single', 'double', 'triple', 'spread', 'laser', 'missile']
};

const POWER_TYPES = {
    single:  { name: 'Single',  icon: '•', color: '#ffffff', bullets: 1 },
    double:  { name: 'Double',  icon: '≋', color: '#00f0f0', bullets: 2 },
    triple:  { name: 'Triple',  icon: '∴', color: '#2ed573', bullets: 3 },
    spread:  { name: 'Spread',  icon: '△', color: '#ffd700', bullets: 5 },
    laser:   { name: 'Laser',   icon: '⟠', color: '#ff4757', bullets: 1, type: 'laser' },
    missile: { name: 'Missile', icon: '↯', color: '#ff6b35', bullets: 2, type: 'missile' }
};

const ENEMY_TYPES = {
    basic:   { width: 40, height: 30, hp: 1, score: 100, color: '#ff6b7a', speed: 2   },
    fast:    { width: 32, height: 24, hp: 1, score: 150, color: '#ff8c42', speed: 4   },
    tank:    { width: 50, height: 40, hp: 3, score: 300, color: '#9b59b6', speed: 1.5 },
    shooter: { width: 44, height: 32, hp: 2, score: 250, color: '#7f8ff4', speed: 2.2 },
    bomber:  { width: 60, height: 36, hp: 2, score: 400, color: '#55efc4', speed: 1.8 }
};

const BOSS_TYPES = [
    { name: 'RED DESTROYER',  color: '#ff4757', width: 160, height: 100, hp: 30, phases: 2, score: 5000,  shootPatterns: ['spread5','aimed','spread3'],          shootRate: 60, speed: 0.8 },
    { name: 'BLUE FIGHTER',   color: '#667eea', width: 140, height:  90, hp: 35, phases: 2, score: 6000,  shootPatterns: ['circle','spread7','aimed'],           shootRate: 50, speed: 1.0 },
    { name: 'YELLOW BOMBER',  color: '#ffd700', width: 180, height: 110, hp: 45, phases: 3, score: 8000,  shootPatterns: ['spread9','laser','spiral'],           shootRate: 45, speed: 0.7 },
    { name: 'PURPLE CARRIER', color: '#764ba2', width: 200, height: 120, hp: 60, phases: 3, score: 10000, shootPatterns: ['circle','spread5','laser','aimed'],   shootRate: 40, speed: 0.6 },
    { name: 'FINAL BOSS',     color: '#ff6b35', width: 220, height: 140, hp: 80, phases: 3, score: 15000, shootPatterns: ['spread9','circle','spiral','laser'],  shootRate: 35, speed: 0.5 }
];

// ============================================
// BACKGROUND MUSIC SYSTEM — Real MP3 Tracks
// ============================================

const SHOOTER_MUSIC_PATH = 'background music for 1945 shooter/';

// Stage music — one track per level (loops)
const SHOOTER_STAGE_TRACKS = [
    '04 Rising Sun (Japan Stage).mp3',           // Level 1
    '07 Shadow of Reich (Germany Stage).mp3',    // Level 2
    '08 Twin Mustang (America Stage).mp3',       // Level 3
    '09 White Hell (Russia Stage).mp3',          // Level 4
    '11 Triebflugel (Base Stage).mp3',           // Level 5
    '12 Stratosphere Flight (Space Stage).mp3',  // Level 6
    '13 Strange Moon (Moon Stage).mp3',          // Level 7+
];

// Boss music — different tracks for different bosses
const SHOOTER_BOSS_TRACKS = [
    '05 Devil in the Steel (Boss 1).mp3',   // Boss 1 & 3
    '10 Deadline (Boss 2).mp3',             // Boss 2 & 4
    '15 Caught in Fire (Final Boss).mp3',   // Boss 5 (final)
];

let _shooterMp3           = null;   // active HTMLAudioElement
let _shooterMp3Key        = null;   // filename of currently playing track
let _shooterMusicBossMode = false;
let _shooterMusicScheduler = null;  // kept for cleanup compat
let _shooterMusicNote     = 0;      // kept for compat
let _shooterMusicTime     = 0;      // kept for compat

function _shooterNeededTrack(bossMode) {
    const st = (typeof gameState !== 'undefined') ? gameState.shooter1945 : null;
    const level        = st ? (st.level         || 1) : 1;
    const bossDefeated = st ? (st.bossDefeated  || 0) : 0;
    if (bossMode) {
        if (bossDefeated >= 4) return SHOOTER_BOSS_TRACKS[2]; // final boss
        return bossDefeated % 2 === 1 ? SHOOTER_BOSS_TRACKS[1] : SHOOTER_BOSS_TRACKS[0];
    }
    return SHOOTER_STAGE_TRACKS[Math.min(level - 1, SHOOTER_STAGE_TRACKS.length - 1)];
}

function _playShooterMp3(filename, volume) {
    if (_shooterMp3) { _shooterMp3.pause(); _shooterMp3.src = ''; _shooterMp3 = null; }
    _shooterMp3Key = filename;
    const audio = new Audio(SHOOTER_MUSIC_PATH + filename);
    audio.loop   = true;
    audio.volume = volume != null ? volume : 0.55;
    audio.play().catch(() => {});   // swallow browser autoplay-policy errors
    _shooterMp3 = audio;
}

function startShooterMusic(bossMode) {
    _shooterMusicBossMode = !!bossMode;
    const key = _shooterNeededTrack(bossMode);
    if (_shooterMp3Key === key && _shooterMp3 && !_shooterMp3.paused) return;
    _playShooterMp3(key, 0.55);
}

function stopShooterMusic() {
    if (_shooterMusicScheduler !== null) { clearTimeout(_shooterMusicScheduler); _shooterMusicScheduler = null; }
    if (_shooterMp3) { _shooterMp3.pause(); _shooterMp3.src = ''; _shooterMp3 = null; _shooterMp3Key = null; }
    _shooterMusicBossMode = false;
}

function switchShooterMusic(bossMode) {
    const needed = _shooterNeededTrack(bossMode);
    // Same track already playing → just update flag
    if (_shooterMp3Key === needed && _shooterMp3 && !_shooterMp3.paused) {
        _shooterMusicBossMode = !!bossMode;
        return;
    }
    _shooterMusicBossMode = !!bossMode;
    _playShooterMp3(needed, 0.55);
}

// Title screen music
function playShooterTitleMusic() {
    _playShooterMp3('01 In The Name of Strikers (Main Title).mp3', 0.50);
}

// Game-over / credits music
function playShooterCreditMusic() {
    _playShooterMp3('02 Credit.mp3', 0.45);
}

// ============================================
// METEOR / ASTEROID HAZARD SYSTEM
// ============================================
function spawnMeteor(state) {
    const size = 14 + Math.random() * 22;
    state.meteors.push({
        x: Math.random() * state.width,
        y: -size,
        vx: (Math.random() - 0.5) * 1.8,
        vy: 2.2 + Math.random() * 1.8 + state.level * 0.25,
        size, hp: Math.ceil(size / 9), maxHp: Math.ceil(size / 9),
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.07,
        hitFlash: 0,
        color: ['#8a7060','#a08070','#706050','#907868'][Math.floor(Math.random()*4)]
    });
}
function updateMeteors(state, dt) {
    if (state.bossActive && Math.random() < 0.97) { /* fewer meteors during boss */ }
    else if (Math.random() < 0.007 * dt * (1 + state.level * 0.1)) spawnMeteor(state);

    for (let i = state.meteors.length - 1; i >= 0; i--) {
        const m = state.meteors[i];
        m.x += m.vx * dt; m.y += m.vy * dt; m.angle += m.spin * dt;
        m.hitFlash = Math.max(0, m.hitFlash - dt);
        if (m.y > state.height + m.size) { state.meteors.splice(i,1); continue; }

        // Hit player
        if (!state.invincible) {
            const dx = state.player.x - m.x, dy = state.player.y - m.y;
            if (Math.sqrt(dx*dx + dy*dy) < m.size + 16) {
                if (state.player.shieldActive) {
                    state.player.shieldActive = false;
                    createExplosion(m.x, m.y, m.size*2, '#ff8c42');
                    if (typeof showToast === 'function') showToast('Shield blocked meteor!','success');
                } else {
                    playerHit();
                    createExplosion(m.x, m.y, m.size*2, '#ff8c42');
                }
                state.meteors.splice(i,1); continue;
            }
        }

        // Hit player bullets
        let destroyed = false;
        for (let j = state.bullets.length - 1; j >= 0; j--) {
            const b = state.bullets[j];
            const dx = b.x - m.x, dy = b.y - m.y;
            if (Math.sqrt(dx*dx + dy*dy) < m.size + 5) {
                m.hp -= (b.damage || 1); m.hitFlash = 8;
                state.bullets.splice(j,1);
                if (m.hp <= 0) {
                    const pts = Math.round(40 * m.size);
                    state.score += pts;
                    addScorePopup(state, m.x, m.y, `+${pts}`, '#c09060');
                    createExplosion(m.x, m.y, m.size * 2, '#ff8c42');
                    triggerShake(state, 5);
                    if (Math.random() < 0.6) spawnCoin(state, m.x, m.y);
                    state.meteors.splice(i,1); destroyed = true;
                }
                break;
            }
        }
        if (destroyed) continue;

        // Hit enemies
        for (let j = state.enemies.length - 1; j >= 0; j--) {
            const e = state.enemies[j];
            const dx = e.x - m.x, dy = e.y - m.y;
            if (Math.sqrt(dx*dx + dy*dy) < m.size + e.width/2) {
                hitEnemy(state, e, 1);
                m.hp--;
                if (m.hp <= 0) { createExplosion(m.x,m.y,m.size*1.5,'#ff8c42'); state.meteors.splice(i,1); break; }
            }
        }
    }
}
function drawMeteors(ctx, state) {
    state.meteors.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y); ctx.rotate(m.angle);
        ctx.fillStyle = m.hitFlash > 0 ? '#ffffff' : m.color;
        ctx.shadowColor = '#ff6633'; ctx.shadowBlur = m.hitFlash > 0 ? 20 : 6;
        ctx.beginPath();
        const pts = 7;
        for (let i = 0; i < pts; i++) {
            const a = (i / pts) * Math.PI * 2;
            const r = m.size * (0.68 + Math.sin(i * 2.3 + 1) * 0.32);
            i === 0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        }
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath(); ctx.arc( m.size*0.22, -m.size*0.08, m.size*0.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-m.size*0.25,  m.size*0.18, m.size*0.14, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    });
}

// ============================================
// COIN / GEM DROP SYSTEM
// ============================================
function spawnCoin(state, x, y) {
    state.coins.push({ x, y, vy: 1.4 + Math.random()*0.8, angle: Math.random()*Math.PI*2, value: 50 });
}
function updateCoins(state, dt) {
    for (let i = state.coins.length - 1; i >= 0; i--) {
        const c = state.coins[i];
        c.y += c.vy * dt; c.angle += 0.1 * dt;
        if (c.y > state.height + 20) { state.coins.splice(i,1); continue; }
        const dx = state.player.x - c.x, dy = state.player.y - c.y;
        if (Math.sqrt(dx*dx + dy*dy) < 28) {
            state.score += c.value;
            state.totalCoins = (state.totalCoins||0) + 1;
            addScorePopup(state, c.x, c.y, `+${c.value}`, '#ffd700');
            const ac = getShooterAudio();
            if (ac) {
                const osc=ac.createOscillator(), g=ac.createGain();
                osc.type='sine'; osc.frequency.value=1047;
                g.gain.setValueAtTime(0.1, ac.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+0.1);
                osc.connect(g); g.connect(ac.destination);
                osc.start(ac.currentTime); osc.stop(ac.currentTime+0.11);
            }
            if ((state.totalCoins||0) >= 10) checkAchievement(state,'collect10coins');
            state.coins.splice(i,1);
        }
    }
}
function drawCoins(ctx, state) {
    state.coins.forEach(c => {
        const sx = Math.abs(Math.cos(c.angle));
        ctx.save();
        ctx.translate(c.x, c.y); ctx.scale(sx, 1);
        // No shadowBlur — use flat gold color for performance
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#b8860b';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
        if (sx > 0.4) {
            ctx.scale(1/sx, 1);
            ctx.fillStyle = '#fff8a0';
            ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 1);
        }
        ctx.restore();
    });
}

// ============================================
// WINGMAN COMPANION SYSTEM
// ============================================
function spawnWingman(state) {
    state.wingman = {
        x: state.player.x - 42,
        y: state.player.y,
        shootTimer: 0,
        hp: 8,
        alpha: 0,
    };
    addScorePopup(state, state.player.x, state.player.y - 35, '✈ WINGMAN!', '#00ff88');
    if (typeof showToast === 'function') showToast('✈ WINGMAN joined the fight!','success');
}
function updateWingman(state, dt) {
    if (!state.wingman) return;
    const w = state.wingman;
    w.alpha = Math.min(1, w.alpha + 0.04 * dt);
    // Follow player smoothly
    const targetX = state.player.x - 42, targetY = state.player.y;
    w.x += (targetX - w.x) * 0.09 * dt;
    w.y += (targetY - w.y) * 0.09 * dt;
    // Auto-shoot
    w.shootTimer += dt;
    if (w.shootTimer >= 18) {
        w.shootTimer = 0;
        // Find nearest enemy
        let target = null, minDist = Infinity;
        state.enemies.forEach(e => {
            const d = Math.hypot(e.x-w.x, e.y-w.y);
            if (d < minDist) { minDist = d; target = e; }
        });
        if (state.boss) target = state.boss;
        let bvx = 0, bvy = -SHOOTER_CONFIG.BULLET_SPEED;
        if (target) {
            const dx = target.x - w.x, dy = target.y - w.y;
            const d = Math.hypot(dx,dy)||1;
            bvx = (dx/d) * SHOOTER_CONFIG.BULLET_SPEED * 0.8;
            bvy = (dy/d) * SHOOTER_CONFIG.BULLET_SPEED * 0.8;
        }
        state.bullets.push({ x:w.x, y:w.y-20, vx:bvx, vy:bvy, width:5, height:12, color:'#00ff88', type:'normal', damage:1 });
    }
    // Check if hit by boss bullets
    state.bossBullets.forEach((b,i) => {
        if (Math.hypot(b.x-w.x, b.y-w.y) < 20) {
            w.hp--;
            state.bossBullets.splice(i,1);
            if (w.hp <= 0) {
                createExplosion(w.x, w.y, 30, '#00ff88');
                state.wingman = null;
                if (typeof showToast==='function') showToast('✈ Wingman shot down!','error');
            }
        }
    });
}
function drawWingman(ctx, state) {
    if (!state.wingman) return;
    const w = state.wingman;
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.globalAlpha = w.alpha * 0.88;
    drawPlayerPlane(ctx, 0, 0, 0.72);
    // Green tint
    ctx.globalAlpha = w.alpha * 0.25;
    ctx.fillStyle = '#00ff88';
    ctx.beginPath(); ctx.ellipse(0,0,20,28,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
}

// ============================================
// ACHIEVEMENT SYSTEM
// ============================================
function checkAchievement(state, key) {
    state.achievements = state.achievements || {};
    if (state.achievements[key]) return;
    state.achievements[key] = true;
    const defs = {
        firstKill:      { text:'FIRST BLOOD!',    color:'#ff4757' },
        combo5:         { text:'HOT STREAK! 🔥',  color:'#ff6b35' },
        combo8:         { text:'ON FIRE!! 🔥🔥',  color:'#ff4757' },
        bossKill:       { text:'BOSS SLAYER! 👑', color:'#ffd700' },
        collect10coins: { text:'COIN MASTER! 💰', color:'#ffd700' },
        untouchable:    { text:'UNTOUCHABLE! 💎', color:'#00ccff' },
        bombKing:       { text:'BOMBS AWAY! 💣',  color:'#ff6b35' },
    };
    const def = defs[key]; if (!def) return;
    // Big centered popup
    state.scorePopups.push({ x:state.width/2, y:state.height/2-80, text:def.text, color:def.color, vy:-0.5, alpha:1, life:160, size:24 });
    if (typeof showToast==='function') showToast(`🏅 ${def.text}`, 'success');
}

// ============================================
// SCROLLING TERRAIN SILHOUETTE
// ============================================
function drawShooterTerrain(ctx, W, H, frameCount, level) {
    const levelColors = ['#0a1a3a','#1a0a3a','#0a2a1a','#2a1a0a','#1a0a2a'];
    ctx.fillStyle = levelColors[Math.min(level-1, levelColors.length-1)];
    const scroll = (frameCount * 1.2) % 90;
    const profile = [50,80,45,100,60,35,90,70,40,110,55,75,30,95,65,50];
    ctx.beginPath(); ctx.moveTo(-scroll, H);
    let bx = -scroll;
    for (let i = 0; i < profile.length * 2; i++) {
        const bh = profile[i % profile.length];
        const bw = 35 + (i % 5) * 8;
        ctx.lineTo(bx, H - bh);
        ctx.lineTo(bx + bw * 0.35, H - bh);
        if (i % 3 === 0) { ctx.lineTo(bx + bw*0.35, H - bh - 12); ctx.lineTo(bx + bw*0.65, H - bh - 12); }
        ctx.lineTo(bx + bw * 0.65, H - bh);
        ctx.lineTo(bx + bw, H - bh);
        bx += bw + 4;
        if (bx > W + 120) break;
    }
    ctx.lineTo(bx, H); ctx.closePath(); ctx.fill();
    // Window lights
    ctx.fillStyle = 'rgba(255,230,100,0.35)';
    bx = -scroll;
    for (let i = 0; i < profile.length * 2; i++) {
        const bh = profile[i % profile.length];
        const bw = 35 + (i % 5) * 8;
        for (let wy = H - bh + 6; wy < H - 8; wy += 12) {
            for (let wx = bx + 4; wx < bx + bw - 6; wx += 9) {
                if (Math.sin(wx*3.1 + wy*5.3 + level) > 0.2) ctx.fillRect(wx, wy, 4, 5);
            }
        }
        bx += bw + 4; if (bx > W + 120) break;
    }
}

// ============================================
// MAIN INITIALIZATION
// ============================================

function initShooter1945() {
    const state = gameState.shooter1945;

    const canvas = document.getElementById('shooter1945-canvas');
    const maxW = Math.min(SHOOTER_CONFIG.CANVAS_WIDTH,  window.innerWidth  - 40);
    const maxH = Math.min(SHOOTER_CONFIG.CANVAS_HEIGHT, window.innerHeight - 200);
    canvas.width  = maxW;
    canvas.height = maxH;

    state.canvas = canvas;
    state.ctx    = canvas.getContext('2d');
    state.width  = maxW;
    state.height = maxH;

    Object.assign(state, {
        bullets: [], bossBullets: [], enemies: [], powerUps: [], explosions: [],
        stars: [], scorePopups: [], shockwaves: [], meteors: [], coins: [],
        score: 0, level: 1, lives: 5, bossDefeated: 0,
        enemySpawnRate: 90, isRunning: false, isGameOver: false, isPaused: false,
        frameCount: 0, boss: null, bossActive: false, bossSpawnedThisLevel: false,
        powerType: 'single', powerLevel: 1,
        invincible: false, invincibleTimer: 0, nextBossScoreThreshold: 0,
        shootTimer: 0, lastEnemySpawn: 0, keys: {},
        comboCount: 0, comboTimer: 0, comboMultiplier: 1,
        screenShake: { x: 0, y: 0, intensity: 0 },
        formationCooldown: 0,
        wingman: null, achievements: {}, totalCoins: 0, bombEffect: null,
        killCount: 0,
        player: {
            x: maxW / 2, y: maxH * 0.8,
            width: 40, height: 52,
            vx: 0, vy: 0,
            shieldActive: false, shieldTimer: 0, bombCount: 0
        }
    });
    state.nextBossScoreThreshold = state.level * 5000; // Initial threshold for the first boss

    // Parallax clouds for WWII sky (12 clouds — balanced visuals vs performance)
    state.clouds = [];
    for (let i = 0; i < 12; i++) {
        state.clouds.push({
            x: Math.random() * maxW, y: Math.random() * maxH * 0.78,
            w: 60 + Math.random() * 100, h: 20 + Math.random() * 26,
            speed: 0.25 + Math.random() * 0.50,
            alpha: 0.38 + Math.random() * 0.40,
            layer: Math.floor(Math.random() * 3)
        });
    }

    // Remove old listeners by cloning canvas
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    state.canvas = newCanvas;
    state.ctx    = newCanvas.getContext('2d');

    // Keyboard
    state._keyDown = (e) => {
        if (!state.isRunning || state.isPaused || state.isGameOver) return;
        const map = {
            ArrowLeft:'left', a:'left', A:'left',
            ArrowRight:'right', d:'right', D:'right',
            ArrowUp:'up', w:'up', W:'up',
            ArrowDown:'down', s:'down', S:'down',
            ' ':'shoot', b:'bomb', B:'bomb', p:'pause', P:'pause'
        };
        if (map[e.key]) { e.preventDefault(); state.keys[map[e.key]] = true; }
        if (e.key === 'b' || e.key === 'B') useBomb();
        if (e.key === 'p' || e.key === 'P') togglePauseShooter();
    };
    state._keyUp = (e) => {
        const map = {
            ArrowLeft:'left', a:'left', A:'left',
            ArrowRight:'right', d:'right', D:'right',
            ArrowUp:'up', w:'up', W:'up',
            ArrowDown:'down', s:'down', S:'down',
            ' ':'shoot'
        };
        if (map[e.key]) state.keys[map[e.key]] = false;
    };
    document.addEventListener('keydown', state._keyDown);
    document.addEventListener('keyup',   state._keyUp);

    // Touch prevention
    newCanvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
    newCanvas.addEventListener('touchmove',  e => e.preventDefault(), { passive: false });

    // ── Fix mobile D-pad: wire correct key names ──
    setTimeout(() => patchShooterDpad(), 100);

    updateShooterHUD();

    const startBtn = document.querySelector('.shooter1945-start-btn');
    const pauseBtn = document.querySelector('.shooter1945-pause-btn');
    const bombBtn  = document.querySelector('.shooter1945-bomb-btn');
    if (startBtn) { startBtn.style.display = 'inline-block'; startBtn.textContent = 'Start Game'; }
    if (pauseBtn)   pauseBtn.style.display  = 'none';
    if (bombBtn)    bombBtn.style.display   = 'none';
    newCanvas.classList.remove('boss-active');

    drawShooterStartScreen();
    playShooterTitleMusic();   // play title track while on start screen

    if (typeof initGameAudio === 'function')            initGameAudio();
    if (typeof startGameBackgroundMusic === 'function') startGameBackgroundMusic('shooter');
}

// ── Patch mobile D-pad to use correct key names ──
function patchShooterDpad() {
    const map = {
        'sdpad-up':    'up',
        'sdpad-down':  'down',
        'sdpad-left':  'left',
        'sdpad-right': 'right'
    };
    Object.entries(map).forEach(([cls, key]) => {
        const btn = document.querySelector('.' + cls);
        if (!btn) return;
        const fresh = btn.cloneNode(true);
        btn.parentNode.replaceChild(fresh, btn);
        fresh.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            gameState.shooter1945.keys[key] = true;
        });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => {
            fresh.addEventListener(ev, () => {
                gameState.shooter1945.keys[key] = false;
            });
        });
    });
}

// ============================================
// MAIN GAME LOOP
// ============================================

function shooterLoop(currentTime) {
    const state = gameState.shooter1945;
    if (!state.canvas || !state.isRunning) return;
    if (state.isPaused || state.isGameOver) {
        state.gameLoop = requestAnimationFrame(shooterLoop);
        return;
    }

    const dt = Math.min((currentTime - (state.lastTime || currentTime)) / 16.67, 3);
    state.lastTime   = currentTime;
    state.frameCount++;

    updatePlayer(state);
    updateBullets(state, dt);
    updateEnemies(state, dt);
    if (state.boss) updateBoss(state, dt);
    updateBossBullets(state, dt);
    updatePowerUps(state, dt);
    updateExplosions(dt);
    updateInvincibility(dt);
    updateCombo(state, dt);
    updateScorePopups(state, dt);
    updateShake(state);
    updateMeteors(state, dt);
    updateCoins(state, dt);
    updateWingman(state, dt);
    if (state.bombEffect) { state.bombEffect.timer--; if (state.bombEffect.timer<=0) state.bombEffect=null; }
    // Switch music on boss entry/exit
    if (state.bossActive && state.boss?.entryDone) switchShooterMusic(true);
    else switchShooterMusic(false);
    spawnEnemies(state);
    checkShooterLevel();
    drawShooterFrame();
    updateShooterHUD();

    state.gameLoop = requestAnimationFrame(shooterLoop);
}

// ============================================
// PLAYER SYSTEM
// ============================================

function updatePlayer(state) {
    const p    = state.player;
    const keys = state.keys;

    p.vx = 0; p.vy = 0;
    if (keys.left)  p.vx -= SHOOTER_CONFIG.PLAYER_SPEED;
    if (keys.right) p.vx += SHOOTER_CONFIG.PLAYER_SPEED;
    if (keys.up)    p.vy -= SHOOTER_CONFIG.PLAYER_SPEED * 0.8;
    if (keys.down)  p.vy += SHOOTER_CONFIG.PLAYER_SPEED * 0.8;

    p.x += p.vx;
    p.y += p.vy;
    p.x = Math.max(p.width / 2,          Math.min(state.width  - p.width / 2,  p.x));
    p.y = Math.max(p.height / 2,         Math.min(state.height - p.height / 2, p.y));

    if (p.shieldActive) {
        p.shieldTimer--;
        if (p.shieldTimer <= 0) p.shieldActive = false;
    }

    // Auto-fire
    state.shootTimer++;
    const powerDef = POWER_TYPES[state.powerType];
    const fireRate = Math.max(8 - state.powerLevel, 4);
    if (state.shootTimer >= fireRate) {
        firePlayerBullets(state, powerDef);
        state.shootTimer = 0;
        playShooterShoot();
    }
}

function firePlayerBullets(state, powerDef) {
    const p          = state.player;
    const angleSpread = powerDef.bullets > 1 ? 0.3 : 0;
    const bulletType  = powerDef.type || 'normal';

    for (let i = 0; i < powerDef.bullets; i++) {
        const angleOffset = (i - (powerDef.bullets - 1) / 2) * angleSpread;
        const angle = -Math.PI / 2 + angleOffset;
        state.bullets.push({
            x: p.x + Math.sin(angle) * 10,
            y: p.y - p.height / 2,
            vx: Math.sin(angle) * SHOOTER_CONFIG.BULLET_SPEED * 0.5,
            vy: -SHOOTER_CONFIG.BULLET_SPEED,
            width:  6,
            height: bulletType === 'laser' ? 20 : 12,
            color:  powerDef.color,
            type:   bulletType,
            damage: state.powerLevel
        });
    }
}

// ============================================
// BULLET SYSTEM
// ============================================

function updateBullets(state, dt) {
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.y < -b.height) { state.bullets.splice(i, 1); continue; }

        let hit = false;
        for (let j = state.enemies.length - 1; j >= 0; j--) {
            if (rectOverlap(b, state.enemies[j])) {
                hitEnemy(state, state.enemies[j], b.damage);
                state.bullets.splice(i, 1);
                hit = true;
                break;
            }
        }
        if (!hit && state.boss && rectOverlap(b, state.boss)) {
            hitBoss(state, b.damage);
            state.bullets.splice(i, 1);
        }
    }
}

// ============================================
// ENEMY SYSTEM
// ============================================

function spawnEnemies(state) {
    // Formation spawn every ~8 regular spawns
    state.formationCooldown = (state.formationCooldown||0) - 1;
    if (state.formationCooldown <= 0 && !state.bossActive && state.frameCount > 200) {
        state.formationCooldown = state.enemySpawnRate * 7;
        spawnFormation(state);
    }

    if (state.frameCount - state.lastEnemySpawn < state.enemySpawnRate) return;

    const weights = { basic: 0.45, fast: 0.2, tank: 0.15, shooter: 0.12, bomber: 0.08 };
    const rand = Math.random();
    let cumulative = 0, type = 'basic';
    for (const [t, w] of Object.entries(weights)) {
        cumulative += w;
        if (rand <= cumulative) { type = t; break; }
    }

    const cfg = ENEMY_TYPES[type];
    state.enemies.push({
        x: Math.random() * (state.width - cfg.width) + cfg.width / 2,
        y: -cfg.height,
        ...cfg,
        type,
        vx: (Math.random() - 0.5) * 1.5,
        vy: cfg.speed * (1 + state.level * 0.05),
        maxHp: cfg.hp,
        flashTimer: 0,
        shootTimer: type === 'shooter' ? 120 : Infinity
    });

    state.lastEnemySpawn = state.frameCount;
}

function updateEnemies(state, dt) {
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.flashTimer = Math.max(0, e.flashTimer - dt);

        // Dive-bomb: fast enemies occasionally break and dive at the player
        if (e.type === 'fast' && !e.diving && e.y > 0 && Math.random() < 0.0018 * dt) {
            e.diving = true;
            const dx = state.player.x - e.x, dy = state.player.y - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            e.vx = (dx/dist) * 7;
            e.vy = (dy/dist) * 7;
            addScorePopup(state, e.x, e.y - 18, 'DIVE!', '#ff8c42');
        }

        if (e.x < e.width / 2 || e.x > state.width - e.width / 2) {
            if (!e.diving) e.vx *= -1;
        }

        if (e.type === 'shooter') {
            e.shootTimer -= dt;
            if (e.shootTimer <= 0) {
                spawnBossBullet(e.x, e.y + e.height / 2, 0, 4, '#ff4757');
                e.shootTimer = 100;
            }
        }

        if (e.y > state.height + 50) { state.enemies.splice(i, 1); continue; }

        if (!state.invincible && rectOverlap(e, state.player)) {
            if (state.player.shieldActive) {
                state.player.shieldActive = false;
                if (typeof showToast === 'function') showToast('Shield absorbed hit!', 'success');
            } else {
                playerHit();
            }
            createExplosion(e.x, e.y, e.width, e.color);
            state.enemies.splice(i, 1);
        }
    }
}

function hitEnemy(state, enemy, damage) {
    enemy.hp -= damage;
    enemy.flashTimer = 10;
    playShooterExplosion(false);
    if (enemy.hp <= 0) {
        const pts = Math.round(enemy.score * state.comboMultiplier);
        state.score += pts;
        state.killCount = (state.killCount||0) + 1;
        addCombo(state, enemy.x, enemy.y);
        addScorePopup(state, enemy.x, enemy.y, `+${pts}`, enemy.color);
        createExplosion(enemy.x, enemy.y, enemy.width, enemy.color);
        triggerShake(state, 4);
        if (Math.random() < 0.3) spawnPowerUp(enemy.x, enemy.y);
        if (Math.random() < 0.22) spawnCoin(state, enemy.x, enemy.y);
        // Achievements
        if (state.killCount === 1) checkAchievement(state, 'firstKill');
        if (state.comboCount >= 5) checkAchievement(state, 'combo5');
        if (state.comboCount >= 8) checkAchievement(state, 'combo8');
        const idx = state.enemies.indexOf(enemy);
        if (idx !== -1) state.enemies.splice(idx, 1);
    }
}

// ============================================
// BOSS SYSTEM
// ============================================

function spawnBoss() {
    const state     = gameState.shooter1945;
    const bossIndex = state.bossDefeated % BOSS_TYPES.length;
    const bossData  = JSON.parse(JSON.stringify(BOSS_TYPES[bossIndex]));

    Object.assign(bossData, {
        maxHp: bossData.hp, age: 0,
        shootTimer: bossData.shootRate, patternTimer: 0,
        patternIndex: 0, moveAngle: 0,
        patternDuration: 180, targetY: 100,
        entryDone: false, dying: false, deathTimer: 0,
        currentPhase: 0, flashTimer: 0,
        x: state.width / 2, y: -bossData.height
    });

    state.boss              = bossData;
    state.bossActive        = true;
    state.bossSpawnedThisLevel = true;
    state.enemies           = [];
    state.bossBullets       = [];

    if (typeof showToast === 'function') showToast(`⚠️ BOSS: ${bossData.name}!`, 'warning');
    if (state.canvas) state.canvas.classList.add('boss-active');
    playShooterBossAlert();
}

function updateBoss(state, dt) {
    const boss = state.boss;
    boss.age += dt;
    boss.flashTimer = Math.max(0, (boss.flashTimer || 0) - dt);

    if (!boss.entryDone) {
        boss.y += 2.5 * dt;
        if (boss.y >= boss.targetY) { boss.y = boss.targetY; boss.entryDone = true; }
        return;
    }

    const hpPct = boss.hp / boss.maxHp;
    if (boss.phases >= 2 && hpPct < 0.66 && boss.currentPhase === 0) {
        boss.currentPhase = 1;
        boss.shootRate    = Math.max(25, boss.shootRate - 15);
        boss.speed       *= 1.3;
        if (typeof showToast === 'function') showToast(`${boss.name} — PHASE 2!`, 'error');
        createExplosion(boss.x, boss.y, boss.width, boss.color);
    }
    if (boss.phases >= 3 && hpPct < 0.33 && boss.currentPhase === 1) {
        boss.currentPhase = 2;
        boss.shootRate    = Math.max(15, boss.shootRate - 10);
        boss.speed       *= 1.2;
        if (typeof showToast === 'function') showToast(`${boss.name} — FINAL PHASE!`, 'error');
        createExplosion(boss.x, boss.y, boss.width, boss.color);
    }

    boss.moveAngle += 0.015 * dt;
    boss.x = state.width / 2 + Math.sin(boss.moveAngle) * (state.width * 0.33);
    boss.y = boss.targetY   + Math.sin(boss.moveAngle * 2) * 35;

    boss.shootTimer  -= dt;
    boss.patternTimer += dt;
    if (boss.patternTimer >= boss.patternDuration) {
        boss.patternTimer = 0;
        boss.patternIndex = (boss.patternIndex + 1) % boss.shootPatterns.length;
    }
    if (boss.shootTimer <= 0) {
        boss.shootTimer = boss.shootRate;
        fireBossPattern(boss, boss.shootPatterns[boss.patternIndex]);
    }

    if (!state.invincible && rectOverlap(boss, state.player)) {
        if (state.player.shieldActive) {
            state.player.shieldActive = false;
            if (typeof showToast === 'function') showToast('Shield absorbed boss hit!', 'success');
        } else {
            playerHit();
        }
    }
}

function fireBossPattern(boss, pattern) {
    const state = gameState.shooter1945;
    const p     = state.player;
    const speed = 3.5 + state.level * 0.15;

    const aimed = () => {
        const dx = p.x - boss.x, dy = p.y - boss.y;
        const d  = Math.sqrt(dx*dx + dy*dy) || 1;
        spawnBossBullet(boss.x, boss.y + boss.height/2, (dx/d)*speed, (dy/d)*speed, '#ff4757');
    };

    switch (pattern) {
        case 'aimed': aimed(); break;
        case 'spread3':
            for (let a=-1;a<=1;a++) { const ang=(Math.PI/2)+a*0.35; spawnBossBullet(boss.x,boss.y+boss.height/2,Math.cos(ang)*speed,Math.sin(ang)*speed,'#ff6b35'); } break;
        case 'spread5':
            for (let a=-2;a<=2;a++) { const ang=(Math.PI/2)+a*0.28; spawnBossBullet(boss.x,boss.y+boss.height/2,Math.cos(ang)*speed,Math.sin(ang)*speed,'#ffd700'); } break;
        case 'spread7':
            for (let a=-3;a<=3;a++) { const ang=(Math.PI/2)+a*0.22; spawnBossBullet(boss.x,boss.y+boss.height/2,Math.cos(ang)*speed,Math.sin(ang)*speed,'#ff4757'); } break;
        case 'spread9':
            for (let a=-4;a<=4;a++) { const ang=(Math.PI/2)+a*0.18; spawnBossBullet(boss.x,boss.y+boss.height/2,Math.cos(ang)*speed,Math.sin(ang)*speed,'#ff4757'); } break;
        case 'circle':
            for (let i=0;i<12;i++) { const ang=(i/12)*Math.PI*2; spawnBossBullet(boss.x,boss.y,Math.cos(ang)*speed*0.8,Math.sin(ang)*speed*0.8,'#667eea'); } break;
        case 'laser':
            for (let i=0;i<3;i++) spawnBossBullet(boss.x-20+i*20, boss.y+boss.height/2, 0, speed*1.5, '#ff4757', true); break;
        case 'spiral':
            const sa = (boss.age*0.1)%(Math.PI*2);
            for (let i=0;i<4;i++) { const a=sa+(i/4)*Math.PI*2; spawnBossBullet(boss.x,boss.y,Math.cos(a)*speed,Math.sin(a)*speed,'#764ba2'); } break;
        default: aimed(); break;
    }
}

function spawnBossBullet(x, y, vx, vy, color, isLaser = false) {
    gameState.shooter1945.bossBullets.push({
        x, y, vx, vy,
        width:  isLaser ? 8  : 10,
        height: isLaser ? 20 : 10,
        color, isEnemy: true, isLaser, damage: isLaser ? 2 : 1
    });
}

function updateBossBullets(state, dt) {
    const p = state.player;
    for (let i = state.bossBullets.length - 1; i >= 0; i--) {
        const b = state.bossBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y > state.height+20 || b.y < -20 || b.x < -20 || b.x > state.width+20) {
            state.bossBullets.splice(i, 1); continue;
        }
        if (!state.invincible && rectOverlap(b, p)) {
            state.bossBullets.splice(i, 1);
            if (p.shieldActive) {
                p.shieldActive = false;
                if (typeof showToast === 'function') showToast('Shield absorbed hit!', 'success');
            } else {
                playerHit();
            }
        }
    }
}

function hitBoss(state, damage) {
    const boss = state.boss;
    boss.hp -= damage;
    boss.flashTimer = 15;
    playShooterExplosion(true);
    if (boss.hp <= 0) defeatBoss();
}

function defeatBoss() {
    const state     = gameState.shooter1945;
    if (!state.boss) return;
    const { name, score: bossScore, x: bx, y: by, color: bc, width: bw } = state.boss;

    state.score       += bossScore;
    state.bossDefeated++;

    createExplosion(bx, by,       bw * 2, bc);
    createExplosion(bx-40, by+20, bw,     '#ffffff');
    createExplosion(bx+40, by+20, bw,     '#ffd700');

    if (typeof showToast     === 'function') showToast(`${name} DEFEATED! +${bossScore} pts 🏆`, 'success');
    if (typeof showConfetti  === 'function') showConfetti();
    playShooterVictory();
    triggerShake(state, 22);
    addScorePopup(state, bx, by, `+${bossScore.toLocaleString()}`, '#ffd700');
    checkAchievement(state, 'bossKill');

    spawnPowerUp(bx, by); spawnPowerUp(bx-40, by); spawnPowerUp(bx+40, by);

    state.boss        = null;
    state.bossActive  = false;
    state.bossBullets = [];
    if (state.canvas) state.canvas.classList.remove('boss-active');

    state.level++;
    state.bossSpawnedThisLevel = false;
    state.enemySpawnRate       = Math.max(30, 90 - state.level * 5);
    state.nextBossScoreThreshold = state.score + state.level * 5000; // Set new threshold for next boss

    updateShooterHUD();
    if (typeof saveScore === 'function') saveScore('shooter1945', state.score);
    const nextName = BOSS_TYPES[Math.min(state.bossDefeated, BOSS_TYPES.length-1)]?.name || '???';
    if (typeof showToast === 'function') showToast(`LEVEL ${state.level}! Next: ${nextName} 🚀`, 'warning');
}

// ============================================
// POWER-UP SYSTEM
// ============================================

function spawnPowerUp(x, y) {
    const state       = gameState.shooter1945;
    const weaponTypes = SHOOTER_CONFIG.POWER_ORDER;
    const specialTypes = ['shield', 'bomb', 'wingman'];
    const roll = Math.random();
    const type = roll < 0.62
        ? weaponTypes[Math.floor(Math.random() * weaponTypes.length)]
        : specialTypes[Math.floor(Math.random() * specialTypes.length)];

    state.powerUps.push({
        x, y, width: 28, height: 28,
        type, vy: 1.8, age: 0,
        color: POWER_TYPES[type]?.color || '#ffffff'
    });
}

function updatePowerUps(state, dt) {
    const p = state.player;
    for (let i = state.powerUps.length - 1; i >= 0; i--) {
        const pu = state.powerUps[i];
        pu.y  += pu.vy * dt;
        pu.age += dt;
        if (pu.y > state.height + 30) { state.powerUps.splice(i, 1); continue; }
        if (rectOverlap(pu, p)) { collectPowerUp(pu); state.powerUps.splice(i, 1); }
    }
}

function collectPowerUp(pu) {
    const state = gameState.shooter1945;
    playShooterPowerup();

    if (pu.type === 'wingman') {
        spawnWingman(state);
    } else if (pu.type === 'shield') {
        state.player.shieldActive = true;
        state.player.shieldTimer  = 300;
        if (typeof showToast === 'function') showToast('🛡️ SHIELD activated!', 'success');
    } else if (pu.type === 'bomb') {
        state.player.bombCount = Math.min((state.player.bombCount||0) + 1, 5);
        if (typeof showToast === 'function') showToast(`💣 BOMB! (${state.player.bombCount})`, 'success');
    } else {
        const def = POWER_TYPES[pu.type];
        if (state.powerType === pu.type) {
            state.powerLevel = Math.min(state.powerLevel + 1, 5);
            if (typeof showToast === 'function') showToast(`⬆️ ${def.name} LV${state.powerLevel}!`, 'success');
        } else {
            state.powerType  = pu.type;
            state.powerLevel = 1;
            if (typeof showToast === 'function') showToast(`✨ ${def.name} POWER!`, 'success');
        }
    }
    state.score += 50;
    createExplosion(pu.x, pu.y, 20, pu.color);
    updateShooterHUD();
}

function useBomb() {
    const state = gameState.shooter1945;
    const p     = state.player;
    if (!p || p.bombCount <= 0) return;
    p.bombCount--;
    playShooterExplosion(true);
    // Dramatic shockwaves from player position
    [0, 100, 200].forEach(delay => {
        setTimeout(() => {
            if (!state.isRunning) return;
            state.shockwaves.push({ x:p.x, y:p.y, r:20, maxR:state.width*1.4, alpha:0.95, life:50, color:'#ffd700' });
            triggerShake(state, 18);
        }, delay);
    });
    // Drop coins from every enemy killed
    state.enemies.forEach(e => {
        createExplosion(e.x, e.y, e.width * 1.5, e.color);
        spawnCoin(state, e.x, e.y);
    });
    state.bossBullets.forEach(b => createExplosion(b.x, b.y, 15, b.color));
    state.enemies     = [];
    state.bossBullets = [];
    state.meteors.forEach(m => createExplosion(m.x, m.y, m.size*2, '#ff8c42'));
    state.meteors = [];
    if (state.boss) { state.boss.hp = Math.max(1, state.boss.hp - 10); hitBoss(state, 0); }
    state.score += 1000;
    state.bombEffect = { timer: 25, maxTimer: 25 };
    checkAchievement(state, 'bombKing');
    if (typeof showToast === 'function') showToast('💥 BOMBS AWAY! +1000 pts', 'success');
    updateShooterHUD();
}

// ============================================
// COLLISION & PLAYER HIT
// ============================================

function rectOverlap(a, b) {
    return Math.abs(a.x - b.x) < (a.width/2  + b.width/2) &&
           Math.abs(a.y - b.y) < (a.height/2 + b.height/2);
}

function playerHit() {
    const state    = gameState.shooter1945;
    state.lives--;
    state.invincible      = true;
    state.invincibleTimer = 120;
    state.powerType  = 'single';
    state.powerLevel = 1;
    state.comboCount = 0; state.comboTimer = 0; state.comboMultiplier = 1;
    createExplosion(state.player.x, state.player.y, 50, '#ff4757');
    playShooterHit();
    triggerShake(state, 14);
    updateShooterHUD();
    if (state.lives <= 0) {
        shooterGameOver();
    } else {
        if (typeof showToast === 'function') showToast(`💥 Hit! ${state.lives} lives left`, 'error');
    }
}

function updateInvincibility(dt) {
    const state = gameState.shooter1945;
    if (state.invincible) {
        state.invincibleTimer -= dt;
        if (state.invincibleTimer <= 0) state.invincible = false;
    }
}

function checkShooterLevel() {
    const state = gameState.shooter1945;
    if (state.bossActive || state.boss || state.bossSpawnedThisLevel) return;
    if (state.score >= state.nextBossScoreThreshold) spawnBoss();
}

// ============================================
// EXPLOSION EFFECTS
// ============================================

function createExplosion(x, y, size, color) {
    const state        = gameState.shooter1945;
    // Cap total particles to prevent frame-rate death during big battles
    if (state.explosions.length > 120) return;
    const particleCount = Math.min(Math.floor(size / 4) + 6, 16);

    // Realistic fire/smoke colors: bright white-yellow core → orange fire → dark smoke
    const coreColors  = ['#ffffff','#ffffcc','#ffee88'];
    const fireColors  = ['#ff6600','#ff8800','#ffaa00','#ff4400','#ffcc44','#ff5500'];
    const smokeColors = ['#555544','#777766','#444433','#666655','#888877','#4a4a3a'];

    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const speed = Math.random() * 3.5 + 0.8;
        const isCore  = i < particleCount * 0.18;
        const isSmoke = i > particleCount * 0.52;
        const pColor = isCore
            ? coreColors[Math.floor(Math.random() * coreColors.length)]
            : isSmoke
                ? smokeColors[Math.floor(Math.random() * smokeColors.length)]
                : fireColors[Math.floor(Math.random() * fireColors.length)];
        state.explosions.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (isSmoke ? 1.0 : isCore ? 0 : 0.2),
            size:  Math.random() * (size / 4) + (isSmoke ? 3.5 : isCore ? size / 6 : 2),
            color: pColor, alpha: 1,
            life:  Math.random() * (isSmoke ? 50 : isCore ? 12 : 30) + 16
        });
    }

    // Initial bright flash (very short life, large, white-yellow)
    if (size > 15) {
        state.explosions.push({
            x, y, vx: 0, vy: 0,
            size: size * 0.7, color: '#ffffee', alpha: 1, life: 6
        });
    }

    // Shockwave ring on large explosions
    if (size > 24) {
        state.shockwaves.push({ x, y, r: size * 0.15, maxR: size * 2.0, alpha: 1.0, life: 30, color });
    }
}

function updateExplosions(dt) {
    const state = gameState.shooter1945;
    for (let i = state.explosions.length - 1; i >= 0; i--) {
        const p = state.explosions[i];
        p.x    += p.vx * dt;
        p.y    += p.vy * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / 50);
        p.size *= 0.97;
        if (p.life <= 0) state.explosions.splice(i, 1);
    }
}

// ============================================
// HUD
// ============================================

function updateShooterHUD() {
    const state = gameState.shooter1945;
    const safe  = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    safe('shooter1945-score', state.score.toLocaleString());
    safe('shooter1945-level', state.level);
    safe('shooter1945-high',  (state.highScore||0).toLocaleString());

    const livesEl = document.getElementById('shooter1945-lives');
    if (livesEl) {
        livesEl.textContent = '❤️'.repeat(Math.max(0,state.lives)) + '🖤'.repeat(Math.max(0,5-state.lives));
    }
    const powerEl = document.getElementById('shooter1945-power');
    if (powerEl) {
        const def      = POWER_TYPES[state.powerType];
        powerEl.textContent   = `${def.name.toUpperCase()} LV${state.powerLevel}`;
        powerEl.style.color   = def.color;
        powerEl.dataset.power = state.powerType;
    }
}

// ============================================
// DRAW — PLAYER PLANE (detailed WWII fighter)
// ============================================

function drawPlayerPlane(ctx, cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // === Engine exhaust flames ===
    const ex1 = ctx.createRadialGradient(-8, 28, 0, -8, 28, 16);
    ex1.addColorStop(0,   'rgba(255,200,0,0.95)');
    ex1.addColorStop(0.4, 'rgba(255,80,0,0.6)');
    ex1.addColorStop(1,   'rgba(255,0,0,0)');
    ctx.fillStyle = ex1;
    ctx.beginPath(); ctx.ellipse(-8, 28, 6, 16, 0, 0, Math.PI*2); ctx.fill();

    const ex2 = ctx.createRadialGradient(8, 28, 0, 8, 28, 16);
    ex2.addColorStop(0,   'rgba(255,200,0,0.95)');
    ex2.addColorStop(0.4, 'rgba(255,80,0,0.6)');
    ex2.addColorStop(1,   'rgba(255,0,0,0)');
    ctx.fillStyle = ex2;
    ctx.beginPath(); ctx.ellipse(8, 28, 6, 16, 0, 0, Math.PI*2); ctx.fill();

    // === Main fuselage ===
    ctx.fillStyle = '#c8d8e8';
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(13, -14, 13, 12, 10, 28);
    ctx.lineTo(-10, 28);
    ctx.bezierCurveTo(-13, 12, -13, -14, 0, -28);
    ctx.closePath();
    ctx.fill();

    // Fuselage shading
    const fGrad = ctx.createLinearGradient(-13, 0, 13, 0);
    fGrad.addColorStop(0,   'rgba(0,0,0,0.28)');
    fGrad.addColorStop(0.28,'rgba(255,255,255,0.22)');
    fGrad.addColorStop(0.75,'rgba(255,255,255,0.06)');
    fGrad.addColorStop(1,   'rgba(0,0,0,0.22)');
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(13,-14,13,12,10,28);
    ctx.lineTo(-10,28);
    ctx.bezierCurveTo(-13,12,-13,-14,0,-28);
    ctx.closePath(); ctx.fill();

    // Center blue stripe
    ctx.fillStyle = 'rgba(80,130,200,0.3)';
    ctx.fillRect(-3.5, -20, 7, 40);

    // === Left wing ===
    ctx.fillStyle = '#b0c8d8';
    ctx.beginPath();
    ctx.moveTo(-9, 5);
    ctx.lineTo(-30, 20);
    ctx.lineTo(-24, 28);
    ctx.lineTo(-9, 20);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-9, 5); ctx.lineTo(-30, 20); ctx.stroke();

    // === Right wing ===
    ctx.fillStyle = '#b0c8d8';
    ctx.beginPath();
    ctx.moveTo(9, 5);
    ctx.lineTo(30, 20);
    ctx.lineTo(24, 28);
    ctx.lineTo(9, 20);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(9, 5); ctx.lineTo(30, 20); ctx.stroke();

    // === Tail fins ===
    ctx.fillStyle = '#90aabf';
    ctx.beginPath(); ctx.moveTo(-6, 16); ctx.lineTo(-15, 28); ctx.lineTo(-8, 28); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo( 6, 16); ctx.lineTo( 15, 28); ctx.lineTo( 8, 28); ctx.closePath(); ctx.fill();

    // === Engine nacelles ===
    ctx.fillStyle = '#607888';
    ctx.beginPath(); ctx.ellipse(-9, 13, 5, 9, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 9, 13, 5, 9, 0, 0, Math.PI*2); ctx.fill();

    // Nacelle intake
    ctx.strokeStyle = '#8aaabb';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(-9, 5, 5, 3, 0, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse( 9, 5, 5, 3, 0, 0, Math.PI*2); ctx.stroke();

    // Nacelle exhaust glow
    ctx.fillStyle = '#ff7000';
    ctx.beginPath(); ctx.ellipse(-9, 21, 3.5, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 9, 21, 3.5, 5, 0, 0, Math.PI*2); ctx.fill();

    // === Gun barrels ===
    ctx.fillStyle = '#455560';
    ctx.fillRect(-12, -26, 3.5, 14);
    ctx.fillRect(  9, -26, 3.5, 14);
    // Barrel tips
    ctx.fillStyle = '#8aaac0';
    ctx.fillRect(-12, -26, 3.5, 3);
    ctx.fillRect(  9, -26, 3.5, 3);

    // === Cockpit ===
    const cGrad = ctx.createRadialGradient(-3, -14, 0, 0, -11, 11);
    cGrad.addColorStop(0,   '#c0eeff');
    cGrad.addColorStop(0.5, '#2488cc');
    cGrad.addColorStop(1,   '#0c3860');
    ctx.fillStyle = cGrad;
    ctx.beginPath(); ctx.ellipse(0, -11, 6.5, 11, 0, 0, Math.PI*2); ctx.fill();

    // Cockpit frame
    ctx.strokeStyle = 'rgba(140,210,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, -11, 6.5, 11, 0, 0, Math.PI*2); ctx.stroke();

    // Cockpit glare
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(-2, -16, 2, 4, -0.3, 0, Math.PI*2); ctx.fill();

    // === Nose star ===
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 6;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 2);
    ctx.shadowBlur = 0;

    // === Wing roundels (WWII style) ===
    const drawRoundel = (rx, ry) => {
        ctx.beginPath(); ctx.arc(rx, ry, 5, 0, Math.PI*2);
        ctx.fillStyle = '#cc2222'; ctx.fill();
        ctx.beginPath(); ctx.arc(rx, ry, 3.5, 0, Math.PI*2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.beginPath(); ctx.arc(rx, ry, 1.8, 0, Math.PI*2);
        ctx.fillStyle = '#1144cc'; ctx.fill();
    };
    drawRoundel(-20, 16);
    drawRoundel( 20, 16);

    ctx.textBaseline = 'alphabetic';
    ctx.restore();
}

// ============================================
// DRAW — PLAYER SHIP (with shield & flicker)
// ============================================

function drawPlayerShip(ctx, state) {
    const p = state.player;
    if (state.invincible && Math.floor(state.frameCount / 4) % 2 === 0) return;

    ctx.save();
    ctx.translate(p.x, p.y);
    drawPlayerPlane(ctx, 0, 0, 1);

    // Engine trail particles
    for (let i = 0; i < 7; i++) {
        const alpha  = (1 - i/7) * 0.55;
        const size   = 4.5 - i * 0.5;
        const offset = i * 5 + 2;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(255,${120 + i * 18},0)`;
        ctx.beginPath(); ctx.arc(-9, 21 + offset, size, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( 9, 21 + offset, size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (p.shieldActive) {
        const pulse = Math.sin(state.frameCount * 0.1) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(118,75,162,${pulse})`;
        ctx.lineWidth   = 3;
        ctx.shadowColor = '#764ba2';
        ctx.shadowBlur  = 18;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(p.width, p.height) * 0.75, 0, Math.PI*2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

// ============================================
// DRAW — ENEMY SHIPS
// ============================================

function drawEnemy(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);

    const flash = e.flashTimer > 0;
    if (flash) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 15; }

    switch (e.type) {

        case 'basic': {
            // A6M Zero — Japanese fighter, radial engine, straight wings, nose facing DOWN (toward player)
            const zCol = flash ? '#ffffff' : '#3d6b22';
            // Fuselage
            ctx.fillStyle = zCol;
            ctx.beginPath(); ctx.ellipse(0, 0, 5, 14, 0, 0, Math.PI*2); ctx.fill();
            // Wings
            ctx.beginPath();
            ctx.moveTo(-14, -1); ctx.lineTo(-6, -7); ctx.lineTo(-6, 5); ctx.lineTo(-14, 4); ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(14, -1); ctx.lineTo(6, -7); ctx.lineTo(6, 5); ctx.lineTo(14, 4); ctx.closePath(); ctx.fill();
            // Radial engine cowl (nose = bottom, facing player)
            ctx.fillStyle = flash ? '#ffffff' : '#2a4a14';
            ctx.beginPath(); ctx.arc(0, 11, 5.5, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#6aaa3a'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0, 11, 5.5, 0, Math.PI*2); ctx.stroke();
            // Prop disc
            ctx.strokeStyle = 'rgba(160,200,120,0.55)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 11, 7, 0, Math.PI*2); ctx.stroke();
            // Cockpit bubble (canopy facing up = tail side)
            const zCock = ctx.createRadialGradient(-1, -3, 0, 0, -2, 4);
            zCock.addColorStop(0, '#c8eeff'); zCock.addColorStop(1, '#1a6aaa');
            ctx.fillStyle = zCock;
            ctx.beginPath(); ctx.ellipse(0, -3, 3.5, 4.5, 0, 0, Math.PI*2); ctx.fill();
            // Tail horizontal stabilizer
            ctx.fillStyle = zCol;
            ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-4, -14); ctx.lineTo(-4, -10); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(4, -14); ctx.lineTo(4, -10); ctx.closePath(); ctx.fill();
            // Red Hinomaru (Rising Sun roundel) on wings
            if (!flash) {
                ctx.fillStyle = '#cc1111';
                ctx.beginPath(); ctx.arc(-11, 1, 2.5, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(11, 1, 2.5, 0, Math.PI*2); ctx.fill();
            }
            break;
        }

        case 'fast': {
            // Messerschmitt Bf 109 — slim German fighter, inline engine, angular
            const bfCol = flash ? '#ffffff' : '#5a5a3a';
            // Fuselage (slim)
            ctx.fillStyle = bfCol;
            ctx.beginPath(); ctx.ellipse(0, 0, 4, 13, 0, 0, Math.PI*2); ctx.fill();
            // Wings (swept slightly)
            ctx.beginPath();
            ctx.moveTo(-13, 2); ctx.lineTo(-5, -4); ctx.lineTo(-5, 4); ctx.lineTo(-13, 6); ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(13, 2); ctx.lineTo(5, -4); ctx.lineTo(5, 4); ctx.lineTo(13, 6); ctx.closePath(); ctx.fill();
            // Pointed inline engine nose (bottom = front)
            ctx.fillStyle = flash ? '#ffffff' : '#3a3a22';
            ctx.beginPath(); ctx.ellipse(0, 12, 3.5, 6, 0, 0, Math.PI*2); ctx.fill();
            // Prop spinner
            ctx.strokeStyle = 'rgba(200,200,160,0.55)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 14, 5.5, 0, Math.PI*2); ctx.stroke();
            // Cockpit
            const bfCock = ctx.createRadialGradient(-1, -2, 0, 0, -2, 3.5);
            bfCock.addColorStop(0, '#c8eeff'); bfCock.addColorStop(1, '#1a5a88');
            ctx.fillStyle = bfCock;
            ctx.beginPath(); ctx.ellipse(0, -2, 3, 4.5, 0, 0, Math.PI*2); ctx.fill();
            // Yellow nose marking (German theatre)
            if (!flash) {
                ctx.fillStyle = '#e8c020';
                ctx.beginPath(); ctx.ellipse(0, 10, 3.5, 3, 0, 0, Math.PI*2); ctx.fill();
            }
            // Tail fins
            ctx.fillStyle = bfCol;
            ctx.beginPath(); ctx.moveTo(-4, -11); ctx.lineTo(-8, -14); ctx.lineTo(-4, -7); ctx.closePath(); ctx.fill();
            break;
        }

        case 'tank': {
            // Focke-Wulf Fw 190 — chunky German fighter, big radial engine
            const fwCol = flash ? '#ffffff' : '#4a4a2e';
            // Chunky fuselage
            ctx.fillStyle = fwCol;
            ctx.beginPath(); ctx.ellipse(0, 0, 7, 14, 0, 0, Math.PI*2); ctx.fill();
            // Wide stubby wings
            ctx.beginPath();
            ctx.moveTo(-18, 1); ctx.lineTo(-7, -5); ctx.lineTo(-7, 6); ctx.lineTo(-18, 6); ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(18, 1); ctx.lineTo(7, -5); ctx.lineTo(7, 6); ctx.lineTo(18, 6); ctx.closePath(); ctx.fill();
            // Big radial cowl (nose = bottom)
            ctx.fillStyle = flash ? '#ffffff' : '#2e2e1a';
            ctx.beginPath(); ctx.arc(0, 11, 7, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#6a6a3a'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 11, 7, 0, Math.PI*2); ctx.stroke();
            // Wide prop disc
            ctx.strokeStyle = 'rgba(180,180,140,0.5)'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(0, 11, 9, 0, Math.PI*2); ctx.stroke();
            // Cockpit (broad)
            const fwCock = ctx.createRadialGradient(-1, -2, 0, 0, -2, 5);
            fwCock.addColorStop(0, '#c8eeff'); fwCock.addColorStop(1, '#1a5a88');
            ctx.fillStyle = fwCock;
            ctx.beginPath(); ctx.ellipse(0, -2, 4.5, 5.5, 0, 0, Math.PI*2); ctx.fill();
            // HP bar
            if (e.maxHp > 1) {
                const pct = e.hp / e.maxHp;
                ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-18, -22, 36, 5);
                ctx.fillStyle = pct > 0.5 ? '#2ed573' : pct > 0.25 ? '#ffd700' : '#ff4757';
                ctx.fillRect(-18, -22, 36*pct, 5);
            }
            // Tail
            ctx.fillStyle = fwCol;
            ctx.beginPath(); ctx.moveTo(-5, -12); ctx.lineTo(-10, -15); ctx.lineTo(-5, -8); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(5, -12); ctx.lineTo(10, -15); ctx.lineTo(5, -8); ctx.closePath(); ctx.fill();
            break;
        }

        case 'shooter': {
            // P-38 Lightning — twin-boom American fighter, twin engines
            const p38Col = flash ? '#ffffff' : '#8a9060';
            // Twin booms
            ctx.fillStyle = p38Col;
            ctx.beginPath(); ctx.ellipse(-13, 0, 3.5, 14, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(13, 0, 3.5, 14, 0, 0, Math.PI*2); ctx.fill();
            // Central gondola (pilot nacelle)
            ctx.beginPath(); ctx.ellipse(0, 2, 5, 9, 0, 0, Math.PI*2); ctx.fill();
            // Center wing connecting booms
            ctx.beginPath();
            ctx.moveTo(-16, -2); ctx.lineTo(-5, -6); ctx.lineTo(5, -6); ctx.lineTo(16, -2);
            ctx.lineTo(16, 3); ctx.lineTo(5, 2); ctx.lineTo(-5, 2); ctx.lineTo(-16, 3);
            ctx.closePath(); ctx.fill();
            // Engine nacelles (noses at bottom)
            ctx.fillStyle = flash ? '#ffffff' : '#606040';
            ctx.beginPath(); ctx.arc(-13, 12, 4.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(13, 12, 4.5, 0, Math.PI*2); ctx.fill();
            // Prop discs
            ctx.strokeStyle = 'rgba(200,210,170,0.5)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(-13, 12, 6.5, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(13, 12, 6.5, 0, Math.PI*2); ctx.stroke();
            // Twin tail fins at top of booms
            ctx.fillStyle = p38Col;
            ctx.beginPath(); ctx.moveTo(-13, -13); ctx.lineTo(-18, -16); ctx.lineTo(-13, -9); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(13, -13); ctx.lineTo(18, -16); ctx.lineTo(13, -9); ctx.closePath(); ctx.fill();
            // Cockpit on central gondola
            const p38Cock = ctx.createRadialGradient(-1, -1, 0, 0, 0, 4);
            p38Cock.addColorStop(0, '#ddf4ff'); p38Cock.addColorStop(1, '#2080cc');
            ctx.fillStyle = p38Cock;
            ctx.beginPath(); ctx.ellipse(0, -1, 3.5, 5, 0, 0, Math.PI*2); ctx.fill();
            // White star insignia
            if (!flash) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('★', 0, 4);
            }
            break;
        }

        case 'bomber': {
            // Heinkel He 111 — German medium bomber, twin engine, elliptical wings
            const heCol = flash ? '#ffffff' : '#4a4a2a';
            // Wide elliptical fuselage
            ctx.fillStyle = heCol;
            ctx.beginPath(); ctx.ellipse(0, 0, 8, 16, 0, 0, Math.PI*2); ctx.fill();
            // Elliptical wings (very wide)
            ctx.beginPath(); ctx.ellipse(-22, 2, 14, 5, 0.1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(22, 2, 14, 5, -0.1, 0, Math.PI*2); ctx.fill();
            // Twin engine nacelles on wings
            ctx.fillStyle = flash ? '#ffffff' : '#2e2e18';
            ctx.beginPath(); ctx.arc(-18, 2, 5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(18, 2, 5, 0, Math.PI*2); ctx.fill();
            // Prop discs
            ctx.strokeStyle = 'rgba(180,180,130,0.5)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(-18, 9, 7, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(18, 9, 7, 0, Math.PI*2); ctx.stroke();
            // Glazed nose (greenhouse nose, bottom = front)
            const heNose = ctx.createRadialGradient(-2, 14, 0, 0, 13, 7);
            heNose.addColorStop(0, 'rgba(180,230,255,0.85)'); heNose.addColorStop(1, 'rgba(40,100,160,0.6)');
            ctx.fillStyle = heNose;
            ctx.beginPath(); ctx.ellipse(0, 14, 5, 7, 0, 0, Math.PI*2); ctx.fill();
            // Dorsal turret ring
            ctx.fillStyle = flash ? '#ffffff' : '#3a3a20';
            ctx.beginPath(); ctx.arc(0, -4, 4, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#888860'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(0, -4, 4, 0, Math.PI*2); ctx.stroke();
            // Gun barrel from turret
            ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -16); ctx.stroke();
            // Tail fins
            ctx.fillStyle = heCol;
            ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(-12, -16); ctx.lineTo(-5, -10); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(5, -14); ctx.lineTo(12, -16); ctx.lineTo(5, -10); ctx.closePath(); ctx.fill();
            break;
        }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
}

// ============================================
// DRAW — BOSS SHIP
// ============================================

function drawBossShip(ctx, boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);

    const flash = (boss.flashTimer||0) > 0;
    if (flash) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 35; }

    const hw = boss.width / 2;
    const hh = boss.height / 2;

    // === WWII Heavy Bomber (B-17 / Lancaster style) ===
    // Nose at bottom (facing player), tail at top

    // --- Shadow / depth beneath wings ---
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.ellipse(0, hh*0.1, hw*1.15, hh*0.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;

    // --- Massive wings ---
    const wingCol = flash ? '#ffffff' : '#5a5a38';
    ctx.fillStyle = wingCol;
    ctx.beginPath();
    ctx.moveTo(-hw*1.1, -hh*0.1);
    ctx.lineTo(-hw*0.45, -hh*0.35);
    ctx.lineTo(-hw*0.35, hh*0.25);
    ctx.lineTo(-hw*1.05, hh*0.18);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hw*1.1, -hh*0.1);
    ctx.lineTo(hw*0.45, -hh*0.35);
    ctx.lineTo(hw*0.35, hh*0.25);
    ctx.lineTo(hw*1.05, hh*0.18);
    ctx.closePath(); ctx.fill();

    // Wing leading-edge highlight
    ctx.strokeStyle = 'rgba(180,180,140,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-hw*1.1, -hh*0.1); ctx.lineTo(-hw*0.45, -hh*0.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hw*1.1, -hh*0.1);  ctx.lineTo(hw*0.45,  -hh*0.35); ctx.stroke();

    // --- 4 engine nacelles on wings ---
    const engineXs = [-hw*0.88, -hw*0.62, hw*0.62, hw*0.88];
    engineXs.forEach(ex => {
        const ey = -hh*0.05;
        // Nacelle body
        ctx.fillStyle = flash ? '#ffffff' : '#3a3a22';
        ctx.beginPath(); ctx.ellipse(ex, ey, hw*0.1, hh*0.22, 0, 0, Math.PI*2); ctx.fill();
        // Prop disc
        ctx.strokeStyle = 'rgba(200,210,160,0.45)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ex, ey + hh*0.2, hw*0.13, 0, Math.PI*2); ctx.stroke();
        // Engine exhaust glow
        const exGlow = ctx.createRadialGradient(ex, ey+hh*0.22, 0, ex, ey+hh*0.22, hw*0.1);
        exGlow.addColorStop(0, 'rgba(255,140,0,0.8)'); exGlow.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = exGlow;
        ctx.beginPath(); ctx.arc(ex, ey+hh*0.22, hw*0.1, 0, Math.PI*2); ctx.fill();
    });

    // --- Main fuselage ---
    const fuseGrad = ctx.createLinearGradient(-hw*0.22, 0, hw*0.22, 0);
    fuseGrad.addColorStop(0,   '#3a3a28');
    fuseGrad.addColorStop(0.3, flash ? '#ffffff' : '#6a6a48');
    fuseGrad.addColorStop(0.7, flash ? '#ffffff' : '#5a5a3a');
    fuseGrad.addColorStop(1,   '#2a2a1a');
    ctx.fillStyle = fuseGrad;
    ctx.beginPath();
    ctx.moveTo(0, -hh);                              // tail tip
    ctx.bezierCurveTo(-hw*0.2, -hh*0.7, -hw*0.22, -hh*0.2, -hw*0.22, hh*0.5);
    ctx.bezierCurveTo(-hw*0.18, hh*0.85, hw*0.18, hh*0.85, hw*0.22, hh*0.5);
    ctx.bezierCurveTo(hw*0.22, -hh*0.2, hw*0.2, -hh*0.7, 0, -hh);
    ctx.closePath(); ctx.fill();

    // Fuselage panel lines
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, -hh*0.8); ctx.lineTo(0, hh*0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-hw*0.15, -hh*0.3); ctx.lineTo(hw*0.15, -hh*0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-hw*0.18, hh*0.1);  ctx.lineTo(hw*0.18,  hh*0.1); ctx.stroke();

    // --- Bomb bay doors (center, open) ---
    ctx.fillStyle = flash ? '#888' : '#1a1a10';
    ctx.fillRect(-hw*0.14, hh*0.12, hw*0.28, hh*0.35);
    // Bay interior glow
    const bayGlow = ctx.createLinearGradient(0, hh*0.12, 0, hh*0.47);
    bayGlow.addColorStop(0, 'rgba(255,80,0,0.5)'); bayGlow.addColorStop(1, 'rgba(80,0,0,0)');
    ctx.fillStyle = bayGlow; ctx.fillRect(-hw*0.14, hh*0.12, hw*0.28, hh*0.35);

    // --- Gun turrets ---
    const drawTurret = (tx, ty, gunAngle) => {
        ctx.fillStyle = flash ? '#ffffff' : '#2e2e20';
        ctx.beginPath(); ctx.arc(tx, ty, hw*0.09, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#888860'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(tx, ty, hw*0.09, 0, Math.PI*2); ctx.stroke();
        // Gun barrel
        ctx.strokeStyle = flash ? '#ffffff' : '#aaaaaa'; ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.cos(gunAngle)*hw*0.18, ty + Math.sin(gunAngle)*hw*0.18);
        ctx.stroke();
    };
    // Top dorsal turret
    drawTurret(0, -hh*0.4, -Math.PI/2);
    // Ventral (belly) turret
    drawTurret(0, hh*0.6,  Math.PI/2);
    // Left and right waist guns
    drawTurret(-hw*0.2, hh*0.0, Math.PI);
    drawTurret( hw*0.2, hh*0.0, 0);

    // --- Glazed nose (bottom = front) ---
    const noseGrad = ctx.createRadialGradient(-hw*0.04, hh*0.72, 0, 0, hh*0.7, hw*0.18);
    noseGrad.addColorStop(0, 'rgba(200,240,255,0.9)');
    noseGrad.addColorStop(0.6, 'rgba(60,140,200,0.6)');
    noseGrad.addColorStop(1,   'rgba(20,60,100,0.3)');
    ctx.fillStyle = noseGrad;
    ctx.beginPath(); ctx.ellipse(0, hh*0.72, hw*0.16, hh*0.2, 0, 0, Math.PI*2); ctx.fill();
    // Nose gun
    ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, hh*0.88); ctx.lineTo(0, hh*1.02); ctx.stroke();

    // --- Tail section with fins ---
    ctx.fillStyle = flash ? '#ffffff' : '#4a4a2e';
    // Horizontal stabilizers
    ctx.beginPath();
    ctx.moveTo(-hw*0.5, -hh*0.88); ctx.lineTo(-hw*0.18, -hh*0.72);
    ctx.lineTo(-hw*0.16, -hh*0.84); ctx.lineTo(-hw*0.48, -hh*0.94); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hw*0.5, -hh*0.88); ctx.lineTo(hw*0.18, -hh*0.72);
    ctx.lineTo(hw*0.16, -hh*0.84); ctx.lineTo(hw*0.48,  -hh*0.94); ctx.closePath(); ctx.fill();
    // Vertical tail fin
    ctx.beginPath();
    ctx.moveTo(0, -hh); ctx.lineTo(-hw*0.08, -hh*0.82); ctx.lineTo(hw*0.08, -hh*0.82); ctx.closePath(); ctx.fill();

    // --- Cockpit / flight deck (top of fuselage, near front) ---
    const cockGrad = ctx.createRadialGradient(-hw*0.04, hh*0.3, 0, 0, hh*0.32, hw*0.16);
    cockGrad.addColorStop(0, '#c8eeff'); cockGrad.addColorStop(1, '#1a6aaa');
    ctx.fillStyle = cockGrad;
    ctx.beginPath(); ctx.ellipse(0, hh*0.32, hw*0.14, hh*0.12, 0, 0, Math.PI*2); ctx.fill();

    // --- Phase indicator lights on fuselage ---
    const phaseColors = ['#2ed573','#ffd700','#ff4757'];
    ctx.shadowBlur = 0;
    for (let i = 0; i < boss.phases; i++) {
        const on = i <= boss.currentPhase;
        ctx.fillStyle = on ? phaseColors[i] : '#333';
        ctx.shadowColor = phaseColors[i]; ctx.shadowBlur = on ? 10 : 0;
        ctx.beginPath(); ctx.arc(-hw*0.28 + i*hw*0.28, -hh*0.55, 4.5, 0, Math.PI*2); ctx.fill();
    }

    // --- Name plate ---
    ctx.shadowBlur  = 0;
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = '#ffd700';
    ctx.font        = `bold ${Math.max(10, Math.floor(boss.width/9))}px 'Segoe UI', sans-serif`;
    ctx.textAlign   = 'center';
    ctx.fillText(boss.name, 0, -hh - 14);
    ctx.shadowBlur = 0;

    ctx.restore();
}

// ============================================
// DRAW — BOSS HP BAR
// ============================================

function drawBossHPBar(ctx, canvas, boss) {
    const bw     = canvas.width - 40;
    const bx     = 20;
    const by     = canvas.height - 28;
    const bh     = 14;
    const pct    = Math.max(0, boss.hp / boss.maxHp);
    const phase2 = 0.66, phase3 = 0.33;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath(); ctx.roundRect(bx-2, by-2, bw+4, bh+4, 4); ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth   = 1;
    [phase2, phase3].forEach(m => {
        const mx = bx + bw * m;
        ctx.beginPath(); ctx.moveTo(mx, by); ctx.lineTo(mx, by+bh); ctx.stroke();
    });

    const barGrad = ctx.createLinearGradient(bx, 0, bx+bw, 0);
    if (pct > phase2) {
        barGrad.addColorStop(0, '#2ed573'); barGrad.addColorStop(1, '#00b894');
    } else if (pct > phase3) {
        barGrad.addColorStop(0, '#ffd700'); barGrad.addColorStop(1, '#ff9f43');
    } else {
        barGrad.addColorStop(0, '#ff4757'); barGrad.addColorStop(1, '#ff0000');
    }
    ctx.fillStyle   = barGrad;
    ctx.shadowColor = pct > phase2 ? '#2ed573' : pct > phase3 ? '#ffd700' : '#ff4757';
    ctx.shadowBlur  = 6;
    ctx.beginPath(); ctx.roundRect(bx, by, bw * pct, bh, 3); ctx.fill();
    ctx.shadowBlur  = 0;

    ctx.fillStyle  = '#ffffff';
    ctx.font       = 'bold 10px "Segoe UI", sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText(`${boss.name}  HP: ${boss.hp}/${boss.maxHp}`, bx + bw/2, by + bh - 2);
}

// ============================================
// DRAW — POWER-UP
// ============================================

function drawPowerUp(ctx, pu) {
    const pulse = Math.sin(pu.age * 0.15) * 0.3 + 0.85;
    ctx.save();
    ctx.translate(pu.x, pu.y);
    ctx.scale(pulse, pulse);

    ctx.strokeStyle = pu.color;
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI*2); ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle   = pu.color;
    ctx.font        = 'bold 11px "Segoe UI", sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';

    if (pu.type === 'wingman') {
        ctx.fillText('✈', 0, 1);
    } else if (pu.type === 'shield') {
        ctx.fillText('🛡', 0, 1);
    } else if (pu.type === 'bomb') {
        ctx.fillText('💣', 0, 1);
    } else {
        const def = POWER_TYPES[pu.type];
        ctx.fillText(def ? def.icon : '★', 0, 1);
    }

    ctx.textBaseline = 'alphabetic';
    ctx.restore();
}

// ============================================
// DYNAMIC OCEAN & SKY BACKGROUND RENDERING
// ============================================

function drawRealisticTerrain(ctx, W, H, frameCount, level) {
    const t = frameCount * 0.012;
    const scroll = frameCount * 1.6;

    // --- Level-based sky themes ---
    // levels 1-2: golden sunset over ocean
    // levels 3-4: dramatic storm / dusk
    // level 5+:   deep night / space edge
    const lvl = Math.min(Math.floor((level - 1) / 2), 2);
    const skyThemes = [
        // Sunset
        { top: '#0a0a2e', mid: '#1a1060', horizon: '#c0440a', glow: '#ff8c00', sun: '#ffe066', sunAlpha: 0.95 },
        // Storm dusk
        { top: '#060412', mid: '#1a0a30', horizon: '#6a1a3a', glow: '#c03060', sun: '#ff6090', sunAlpha: 0.7 },
        // Night / space
        { top: '#000008', mid: '#04041a', horizon: '#0a0a30', glow: '#2040a0', sun: '#4060ff', sunAlpha: 0.5 },
    ];
    const sk = skyThemes[lvl];

    // === SKY GRADIENT (top 70% of screen) ===
    const horizonY = H * 0.62;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0,   sk.top);
    skyGrad.addColorStop(0.5, sk.mid);
    skyGrad.addColorStop(1,   sk.horizon);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, horizonY + 2);

    // === STARS (visible in all themes, brighter at night) ===
    const starBrightness = [0.55, 0.75, 1.0][lvl];
    // Use deterministic pseudo-random for stable star field
    for (let i = 0; i < 90; i++) {
        const sx = ((i * 7919 + 1234) % W);
        const sy = ((i * 6271 + 567)  % (horizonY * 0.85));
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.7 + i * 0.4));
        ctx.globalAlpha = starBrightness * twinkle * (sy < horizonY * 0.5 ? 0.9 : 0.5);
        const r = i % 5 === 0 ? 1.5 : 0.9;
        ctx.fillStyle = i % 7 === 0 ? '#ffe8b0' : '#ffffff';
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // === SUN / MOON glow at horizon ===
    const sunX = W * 0.72;
    const sunY = horizonY * 0.88;
    // Outer corona
    const coronaR = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 90);
    coronaR.addColorStop(0,   `rgba(255,200,80,${sk.sunAlpha * 0.35})`);
    coronaR.addColorStop(0.4, `rgba(255,140,30,${sk.sunAlpha * 0.18})`);
    coronaR.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = coronaR;
    ctx.beginPath(); ctx.arc(sunX, sunY, 90, 0, Math.PI * 2); ctx.fill();
    // Sun disk
    ctx.fillStyle = sk.sun;
    ctx.globalAlpha = sk.sunAlpha;
    ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // === HORIZON GLOW ===
    // Simple horizon glow band
    const hg = ctx.createLinearGradient(0, horizonY - 55, 0, horizonY + 60);
    hg.addColorStop(0, 'rgba(0,0,0,0)');
    hg.addColorStop(0.45, lvl === 0 ? 'rgba(255,120,20,0.30)' : lvl === 1 ? 'rgba(180,30,80,0.28)' : 'rgba(30,60,200,0.22)');
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, horizonY - 55, W, 115);

    // === DISTANT ISLAND SILHOUETTES (scroll slowly) ===
    const islandScroll = (scroll * 0.18) % (W * 1.5);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = lvl === 0 ? '#1a0d06' : '#0a0616';
    const islands = [
        { x: 0.08, w: 0.18, h: 0.07 }, { x: 0.32, w: 0.12, h: 0.05 },
        { x: 0.55, w: 0.22, h: 0.09 }, { x: 0.82, w: 0.15, h: 0.06 },
        { x: 1.08, w: 0.19, h: 0.08 }, { x: 1.40, w: 0.13, h: 0.05 },
    ];
    islands.forEach(isl => {
        const ix = ((isl.x * W - islandScroll % (W * 1.5) + W * 1.5) % (W * 1.5)) - W * 0.1;
        const iw = isl.w * W, ih = isl.h * H;
        const iy = horizonY - ih * 0.7;
        ctx.beginPath();
        ctx.moveTo(ix, horizonY);
        ctx.bezierCurveTo(ix + iw * 0.2, iy - ih * 0.3, ix + iw * 0.4, iy - ih * 0.5, ix + iw * 0.5, iy);
        ctx.bezierCurveTo(ix + iw * 0.6, iy - ih * 0.4, ix + iw * 0.8, iy - ih * 0.2, ix + iw, horizonY);
        ctx.closePath(); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // === OCEAN (bottom 38% of screen) ===
    const oceanGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    if (lvl === 0) {
        oceanGrad.addColorStop(0,   '#c05810');
        oceanGrad.addColorStop(0.12,'#1a4a7a');
        oceanGrad.addColorStop(0.5, '#0d2d5a');
        oceanGrad.addColorStop(1,   '#071a3a');
    } else if (lvl === 1) {
        oceanGrad.addColorStop(0,   '#6a1540');
        oceanGrad.addColorStop(0.15,'#0e1a40');
        oceanGrad.addColorStop(1,   '#04081e');
    } else {
        oceanGrad.addColorStop(0,   '#08082a');
        oceanGrad.addColorStop(1,   '#020210');
    }
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, horizonY, W, H - horizonY);

    // === SUNLIGHT REFLECTION PATH on ocean ===
    const reflW0 = W * 0.08, reflW1 = W * 0.55;
    const reflPath = ctx.createLinearGradient(0, horizonY, 0, H);
    if (lvl === 0) {
        reflPath.addColorStop(0, 'rgba(255,200,80,0.55)');
        reflPath.addColorStop(0.4,'rgba(255,160,40,0.25)');
        reflPath.addColorStop(1, 'rgba(255,120,20,0.04)');
    } else {
        reflPath.addColorStop(0, lvl === 1 ? 'rgba(220,60,120,0.40)' : 'rgba(60,100,255,0.35)');
        reflPath.addColorStop(1, 'rgba(0,0,0,0)');
    }
    ctx.fillStyle = reflPath;
    ctx.beginPath();
    ctx.moveTo(sunX - reflW0 / 2, horizonY);
    ctx.lineTo(W / 2 - reflW1 / 2, H);
    ctx.lineTo(W / 2 + reflW1 / 2, H);
    ctx.lineTo(sunX + reflW0 / 2, horizonY);
    ctx.closePath(); ctx.fill();

    // === OCEAN WAVES (scrolling horizontal bands) ===
    const waveColors = lvl === 0
        ? ['rgba(255,160,60,0.18)','rgba(100,180,255,0.12)','rgba(255,200,80,0.09)']
        : lvl === 1
        ? ['rgba(200,50,100,0.15)','rgba(60,80,180,0.12)','rgba(180,40,90,0.08)']
        : ['rgba(40,80,255,0.14)','rgba(20,50,200,0.10)','rgba(60,100,255,0.07)'];

    for (let wi = 0; wi < 18; wi++) {
        const wy = horizonY + (wi / 18) * (H - horizonY);
        const wscroll = (scroll * (0.5 + wi * 0.04)) % W;
        const amp = 2.5 + wi * 0.4;
        const wci = wi % waveColors.length;
        ctx.strokeStyle = waveColors[wci];
        ctx.lineWidth = 1 + wi * 0.06;
        ctx.globalAlpha = 0.6 - wi * 0.025;
        ctx.beginPath();
        for (let wx = -20; wx <= W + 20; wx += 8) {
            const waveY = wy + Math.sin((wx + wscroll) * 0.045 + t) * amp
                             + Math.sin((wx + wscroll * 0.7) * 0.022 + t * 1.3) * amp * 0.5;
            wx === -20 ? ctx.moveTo(wx, waveY) : ctx.lineTo(wx, waveY);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // === FOREGROUND OCEAN FOAM (fast scroll, bottom strip) ===
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#c8e8ff';
    for (let fi = 0; fi < 6; fi++) {
        const fy = H - 28 + fi * 5;
        const fx = ((fi * 137 + scroll * 1.8) % (W + 60)) - 30;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 38 + fi * 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawRealisticClouds(ctx, state, W, H) {
    state.clouds.forEach(c => {
        c.y += c.speed * 0.5;
        if (c.y > H + 90) { c.y = -90; c.x = Math.random() * W; }
        const a = c.alpha * [0.60, 0.75, 0.90][c.layer];
        // Shadow (soft dark underneath)
        ctx.globalAlpha = a * 0.18;
        ctx.fillStyle = '#050510';
        ctx.beginPath(); ctx.ellipse(c.x + 10, c.y + 14, c.w * 0.46, c.h * 0.30, 0, 0, Math.PI * 2); ctx.fill();
        // Underside — warm orange-gray tint for sunset
        ctx.globalAlpha = a * 0.72;
        ctx.fillStyle = '#c8a898';
        ctx.beginPath(); ctx.ellipse(c.x, c.y + c.h * 0.22, c.w * 0.44, c.h * 0.20, 0, 0, Math.PI * 2); ctx.fill();
        // Main cloud body — warm white
        ctx.globalAlpha = a;
        ctx.fillStyle = '#f0e8e0';
        ctx.beginPath(); ctx.ellipse(c.x,           c.y,          c.w * 0.50, c.h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(c.x - c.w*0.26, c.y + c.h*0.10, c.w*0.34, c.h*0.30, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(c.x + c.w*0.26, c.y + c.h*0.08, c.w*0.36, c.h*0.28, 0, 0, Math.PI * 2); ctx.fill();
        // Bright top highlight
        ctx.globalAlpha = a * 0.62;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(c.x - c.w*0.06, c.y - c.h*0.12, c.w*0.28, c.h*0.18, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ============================================
// DRAW FRAMES
// ============================================

function drawShooterStartScreen() {
    const state       = gameState.shooter1945;
    const { ctx }     = state;
    const W = state.width, H = state.height;

    // Realistic aerial terrain as title background
    drawRealisticTerrain(ctx, W, H, (state.frameCount || 0) + 800, 1);

    // Clouds for title screen
    if (!state.clouds || state.clouds.length === 0) {
        state.clouds = [];
        for (let i = 0; i < 10; i++) {
            state.clouds.push({
                x: Math.random() * W, y: Math.random() * H,
                w: 80 + Math.random() * 130, h: 26 + Math.random() * 34,
                speed: 0.3, alpha: 0.58 + Math.random() * 0.30,
                layer: Math.floor(Math.random() * 3)
            });
        }
    }
    drawRealisticClouds(ctx, state, W, H);

    // Dark vignette overlay for title readability
    const titleFog = ctx.createLinearGradient(0, 0, 0, H);
    titleFog.addColorStop(0,   'rgba(5,10,25,0.88)');
    titleFog.addColorStop(0.38,'rgba(8,16,40,0.65)');
    titleFog.addColorStop(0.65,'rgba(10,20,50,0.30)');
    titleFog.addColorStop(1,   'rgba(0,0,0,0.10)');
    ctx.fillStyle = titleFog; ctx.fillRect(0, 0, W, H);

    ctx.textAlign  = 'center';
    // Dramatic red title with shadow
    ctx.shadowColor = '#880000';
    ctx.shadowBlur  = 22;
    ctx.fillStyle   = '#cc2222';
    ctx.font        = `bold 54px 'Segoe UI', sans-serif`;
    ctx.fillText('1945', W/2, H/2 - 80);

    ctx.shadowColor = '#8B6914';
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = '#ffd700';
    ctx.font        = `bold 24px 'Segoe UI', sans-serif`;
    ctx.fillText('WWII AIR COMBAT', W/2, H/2 - 42);
    ctx.shadowBlur  = 0;

    drawPlayerPlane(ctx, W/2, H/2 + 10, 1.8);

    ctx.font      = '15px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Press Start to Play', W/2, H/2 + 100);

    if ((state.highScore||0) > 0) {
        ctx.font      = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`Best: ${state.highScore.toLocaleString()}`, W/2, H/2 + 125);
    }

    ctx.font      = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('Arrow Keys / WASD · Auto-Fire · B = Bomb · P = Pause', W/2, H - 16);
}

function drawShooterPauseScreen() {
    drawShooterFrame();
    const state   = gameState.shooter1945;
    const { ctx } = state;
    const W = state.width, H = state.height;

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign   = 'center';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 25;
    ctx.fillStyle   = '#ffd700';
    ctx.font        = `bold 48px 'Segoe UI', sans-serif`;
    ctx.fillText('PAUSED', W/2, H/2);
    ctx.shadowBlur  = 0;

    ctx.font      = '15px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Press P to Resume', W/2, H/2 + 40);
    ctx.fillText('B = Bomb · Arrow/WASD = Move', W/2, H/2 + 65);
}

function drawShooterFrame() {
    const state       = gameState.shooter1945;
    const { ctx }     = state;
    const W = state.width, H = state.height;
    const shake = state.screenShake;

    // Apply screen shake
    ctx.save();
    if (shake.intensity > 0.5) ctx.translate(shake.x, shake.y);

    // === REALISTIC AERIAL TERRAIN VIEW ===
    drawRealisticTerrain(ctx, W, H, state.frameCount, state.level);

    // === ATMOSPHERIC CLOUDS FLOATING ABOVE TERRAIN ===
    if (!state.clouds || state.clouds.length === 0) {
        state.clouds = [];
        for (let i = 0; i < 10; i++) {
            state.clouds.push({
                x: Math.random() * W, y: Math.random() * H,
                w: 80 + Math.random() * 130, h: 28 + Math.random() * 36,
                speed: 0.3 + Math.random() * 0.55,
                alpha: 0.60 + Math.random() * 0.28,
                layer: Math.floor(Math.random() * 3)
            });
        }
    }
    drawRealisticClouds(ctx, state, W, H);

    // Boss warning flash
    if (state.bossActive && state.boss && !state.boss.entryDone) {
        const pulse = Math.sin(state.frameCount * 0.15) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255,71,87,${pulse * 0.1})`;
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign   = 'center';
        ctx.font        = `bold 30px 'Segoe UI', sans-serif`;
        ctx.fillStyle = `rgba(255,71,87,${pulse})`;
        ctx.fillText('⚠️ WARNING ⚠️', W/2, H/2 - 10);
        ctx.font      = '18px "Segoe UI", sans-serif';
        ctx.fillText(state.boss.name, W/2, H/2 + 30);
    }

    // Meteors (behind enemies)
    drawMeteors(ctx, state);

    // Coins
    drawCoins(ctx, state);

    // Power-ups
    state.powerUps.forEach(pu => drawPowerUp(ctx, pu));

    // Explosions — smoke first (back), then fire, then bright core on top
    ctx.save();
    // Pass 1: smoke & fire (non-white particles)
    state.explosions.forEach(p => {
        if (p.color === '#ffffff' || p.color === '#ffffcc' || p.color === '#ffee88' || p.color === '#ffffee') return;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    // Pass 2: bright core (white/yellow — drawn on top for realism)
    state.explosions.forEach(p => {
        if (p.color !== '#ffffff' && p.color !== '#ffffcc' && p.color !== '#ffee88' && p.color !== '#ffffee') return;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    // Boss bullets — glowing menacing projectiles
    state.bossBullets.forEach(b => {
        if (b.isLaser) {
            // Laser bolt: bright core + outer glow
            ctx.globalAlpha = 0.28;
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x - b.width * 1.3, b.y - b.height / 2, b.width * 2.6, b.height);
            ctx.globalAlpha = 1;
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
            ctx.fillStyle = 'rgba(255,200,200,0.85)';
            ctx.fillRect(b.x - 1, b.y - b.height / 2, 2, b.height);
        } else {
            // Energy orb: outer glow ring + bright core + hot centre
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y + 4, b.width * 0.9, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.55;
            ctx.beginPath(); ctx.arc(b.x, b.y + 2, b.width * 0.7, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.width / 2, 0, Math.PI * 2); ctx.fill();
            // Hot white centre
            ctx.fillStyle = 'rgba(255,240,200,0.85)';
            ctx.beginPath(); ctx.arc(b.x - 1, b.y - 1, b.width / 3.5, 0, Math.PI * 2); ctx.fill();
        }
    });
    ctx.globalAlpha = 1;

    // Enemies
    state.enemies.forEach(e => drawEnemy(ctx, e));

    // Boss
    if (state.boss) drawBossShip(ctx, state.boss);

    // Player bullets — tracer rounds
    state.bullets.forEach(b => {
        if (b.type === 'laser') {
            const lg = ctx.createLinearGradient(b.x, b.y-b.height, b.x, b.y);
            lg.addColorStop(0, 'rgba(255,71,87,0)'); lg.addColorStop(1, b.color);
            ctx.fillStyle = lg;
            ctx.shadowColor = b.color; ctx.shadowBlur = 14;
            ctx.fillRect(b.x - b.width/2, b.y - b.height, b.width, b.height);
        } else if (b.type === 'missile') {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(Math.atan2(b.vy, b.vx) + Math.PI/2);
            // Rocket body
            ctx.fillStyle = '#cccccc';
            ctx.beginPath();
            ctx.moveTo(0, -b.height/2); ctx.lineTo(b.width/2, b.height/2); ctx.lineTo(-b.width/2, b.height/2);
            ctx.closePath(); ctx.fill();
            // Exhaust flame
            const mFlame = ctx.createRadialGradient(0, b.height/2, 0, 0, b.height/2, 7);
            mFlame.addColorStop(0, 'rgba(255,220,60,0.95)'); mFlame.addColorStop(1, 'rgba(255,80,0,0)');
            ctx.fillStyle = mFlame;
            ctx.beginPath(); ctx.arc(0, b.height/2, 7, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        } else {
            // Tracer round: multi-layer glow streak
            // Outer orange-red halo
            ctx.globalAlpha = 0.20;
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(b.x - 4, b.y - b.height * 2.2, 8, b.height * 2.2);
            // Mid orange glow
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(b.x - 2.5, b.y - b.height * 1.8, 5, b.height * 1.8);
            // Bright yellow-white core
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ffffcc';
            ctx.fillRect(b.x - 1.5, b.y - b.height, 3, b.height);
            // Hot white tip
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(b.x - 1, b.y - b.height, 2, 4);
        }
    });

    // Wingman
    drawWingman(ctx, state);

    // Laser beam — continuous beam when laser equipped
    if (state.powerType === 'laser' && state.isRunning && !state.isGameOver) {
        const pp = state.player;
        const beamY = pp.y - pp.height/2;
        const beamGrad = ctx.createLinearGradient(pp.x, 0, pp.x, beamY);
        beamGrad.addColorStop(0, 'rgba(255,71,87,0.85)');
        beamGrad.addColorStop(0.7, 'rgba(255,71,87,0.4)');
        beamGrad.addColorStop(1, 'rgba(255,71,87,0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(pp.x - 3, 0, 6, beamY);
    }

    // Player
    drawPlayerShip(ctx, state);

    // Shockwave rings
    for (let i=state.shockwaves.length-1; i>=0; i--) {
        const sw=state.shockwaves[i];
        sw.r += (sw.maxR-sw.r)*0.22;
        sw.life--; sw.alpha*=0.82;
        if (sw.life<=0) { state.shockwaves.splice(i,1); continue; }
        ctx.strokeStyle=`rgba(255,200,80,${sw.alpha})`;
        ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.arc(sw.x,sw.y,sw.r,0,Math.PI*2); ctx.stroke();
    }

    // Cinematic vignette (dark edges — adds depth & focus)
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.58)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Score popups
    drawScorePopups(ctx, state);

    // Boss HP bar
    if (state.boss && !state.boss.dying) drawBossHPBar(ctx, state.canvas, state.boss);

    // Combo counter
    if (state.comboCount >= 3) {
        const comboAlpha = Math.min(1, state.comboTimer / 40);
        const comboColor = state.comboCount>=8?'#ff4757':state.comboCount>=5?'#ff6b35':'#ffd700';
        const comboSize  = Math.min(14 + state.comboCount*1.5, 28);
        ctx.save();
        ctx.globalAlpha = comboAlpha;
        ctx.textAlign = 'left';
        ctx.font = `bold ${comboSize}px 'Segoe UI',sans-serif`;
        ctx.fillStyle = comboColor;
        ctx.fillText(`🔥 x${state.comboCount}`, 10, H - 48);
        ctx.font = '11px "Segoe UI",sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(state.comboCount>=8 ? 'MAX COMBO!' : `COMBO  +${Math.round((state.comboMultiplier-1)*100)}% pts`, 10, H-30);
        ctx.restore();
    }

    // Bomb counter
    const bombs = state.player?.bombCount || 0;
    if (bombs > 0) {
        ctx.textAlign = 'right';
        ctx.font      = '13px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ff6b35';
        ctx.fillText(`💣 x${bombs}`, W - 10, 20);
    }

    // Bomb flash overlay
    if (state.bombEffect) {
        const t = state.bombEffect.timer / state.bombEffect.maxTimer;
        ctx.fillStyle = `rgba(255,220,80,${t * 0.55})`;
        ctx.fillRect(0, 0, W, H);
    }

    ctx.restore(); // end screen shake transform
}

// ============================================
// CONTROL FUNCTIONS
// ============================================

function startShooter1945() {
    const state = gameState.shooter1945;
    state.isRunning  = true;
    state.isGameOver = false;
    state.lastTime   = performance.now();

    const startBtn = document.querySelector('.shooter1945-start-btn');
    const pauseBtn = document.querySelector('.shooter1945-pause-btn');
    const bombBtn  = document.querySelector('.shooter1945-bomb-btn');
    if (startBtn) startBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline-block';
    if (bombBtn)  bombBtn.style.display  = 'inline-block';

    startShooterMusic(false);
    state.gameLoop = requestAnimationFrame(shooterLoop);
}

function togglePauseShooter() {
    const state = gameState.shooter1945;
    if (!state.isRunning) return;
    state.isPaused = !state.isPaused;

    if (state.isPaused) {
        if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop = null; }
        drawShooterPauseScreen();
    } else {
        state.lastTime = performance.now();
        state.gameLoop = requestAnimationFrame(shooterLoop);
    }
}

function shooterGameOver() {
    const state = gameState.shooter1945;
    state.isRunning  = false;
    state.isGameOver = true;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop = null; }
    stopShooterMusic();
    playShooterCreditMusic();  // play credits/game-over music

    const isNewBest = state.score > (state.highScore || 0);
    if (isNewBest) {
        state.highScore = state.score;
        localStorage.setItem('shooter1945HighScore', state.highScore);
    }
    if (typeof saveScore === 'function') saveScore('shooter1945', state.score);
    if (state.canvas) state.canvas.classList.remove('boss-active');

    const startBtn = document.querySelector('.shooter1945-start-btn');
    if (startBtn) { startBtn.style.display = 'inline-block'; startBtn.textContent = 'Play Again'; }

    setTimeout(() => showShooterGameOver(isNewBest), 600);

    if (isNewBest) {
        if (typeof showConfetti === 'function') showConfetti();
        if (typeof showToast   === 'function') showToast(`New Best: ${state.score.toLocaleString()}! 🏆`, 'success');
    } else {
        if (typeof showToast   === 'function') showToast(`Game Over! Score: ${state.score.toLocaleString()}`, 'error');
    }
}

function showShooterGameOver(isNewBest) {
    const state = gameState.shooter1945;

    const old = document.querySelector('.shooter1945-gameover');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.className = 'shooter1945-gameover';
    overlay.style.cssText = `
        position:absolute; inset:0; display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        background:rgba(6,6,20,0.88); z-index:100;
        border-radius:12px; color:#fff; text-align:center; padding:24px;
        font-family:'Segoe UI',sans-serif;
    `;

    overlay.innerHTML = `
        <div style="font-size:42px; margin-bottom:6px;">${isNewBest ? '🏆' : '💥'}</div>
        <h2 style="font-size:28px; margin:0 0 6px; color:${isNewBest ? '#ffd700' : '#ff4757'};">
            ${isNewBest ? 'NEW BEST!' : 'GAME OVER'}
        </h2>
        <p style="margin:4px 0; color:#aaa; font-size:13px;">
            Bosses Defeated: ${state.bossDefeated} / ${BOSS_TYPES.length}
        </p>
        <div style="font-size:32px; font-weight:bold; color:#fff; margin:10px 0;">
            ${state.score.toLocaleString()}
        </div>
        <p style="margin:0 0 16px; color:#ffd700; font-size:13px;">
            Best: ${(state.highScore||0).toLocaleString()}
        </p>
        <button onclick="closeShooterGameOver()"
            style="padding:10px 28px; background:linear-gradient(135deg,#667eea,#764ba2);
                   border:none; border-radius:25px; color:#fff; font-size:15px;
                   font-weight:bold; cursor:pointer; letter-spacing:1px;">
            PLAY AGAIN
        </button>
        <p style="margin-top:10px; color:rgba(255,255,255,0.35); font-size:11px;">
            Press R to restart
        </p>
    `;

    const canvasParent = state.canvas?.parentElement;
    if (canvasParent) {
        canvasParent.style.position = 'relative';
        canvasParent.appendChild(overlay);
    }
}

function closeShooterGameOver() {
    const overlay = document.querySelector('.shooter1945-gameover');
    if (overlay) overlay.remove();
    if (typeof initShooter1945 === 'function') initShooter1945();
}

function shooterVictory() {
    const state = gameState.shooter1945;
    state.isRunning = false;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop = null; }
    if (typeof showToast    === 'function') showToast('🎉 ALL BOSSES DEFEATED — YOU WIN! 🎉', 'success');
    if (typeof showConfetti === 'function') showConfetti();
    setTimeout(() => showShooterGameOver(true), 1200);
}

// ============================================
// GLOBAL EXPORTS
// ============================================

window.startShooter1945     = startShooter1945;
window.togglePauseShooter   = togglePauseShooter;
window.useBomb              = useBomb;
window.closeShooterGameOver = closeShooterGameOver;
window.shooterVictory       = shooterVictory;

// Called by closeGame() when player navigates away — stops all sound and animation
window.shooter1945Cleanup = function() {
    stopShooterMusic();
    const state = gameState.shooter1945;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop = null; }
    state.isRunning = false;
};


function firePlayerBullets(state, powerDef) {
    const p          = state.player;
    const bulletType = powerDef.type || 'normal';
    const count      = powerDef.bullets;
 
    for (let i = 0; i < count; i++) {
        // Spread bullets symmetrically left/right around the center
        const xOffset    = count > 1 ? (i - (count - 1) / 2) * 12 : 0;
        // Slight angle for spread weapons, zero for single
        const angleOffset = count > 1 ? (i - (count - 1) / 2) * 0.22 : 0;
 
        state.bullets.push({
            x:      p.x + xOffset,
            y:      p.y - p.height / 2,
            vx:     Math.sin(angleOffset) * SHOOTER_CONFIG.BULLET_SPEED,
            vy:     -SHOOTER_CONFIG.BULLET_SPEED,
            width:  6,
            height: bulletType === 'laser' ? 20 : 12,
            color:  powerDef.color,
            type:   bulletType,
            damage: state.powerLevel
        });
    }
}