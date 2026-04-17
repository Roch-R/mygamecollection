/* ============================================
   BLOCK BLAST - Ultra Smooth Edition
   ✦ Continuous RAF loop (no start/stop jank)
   ✦ Lerp-interpolated drag position
   ✦ Animated score roll-up counter
   ✦ Spring physics on block placement
   ✦ Dynamic grid sheen sweep effect
   ✦ Staggered wave line-clear with colour tint
   ✦ Richer block rendering (inner glow + rim)
   ✦ Better easing on float piece tilt
   ✦ dt-normalised tick (frame-rate independent)
   ✦ Haptic + audio preserved & improved
   ============================================ */

(function () {

const GRID = 8;
let CS   = 46;
let GAP  = 3;
let PAD  = 10;

const COLORS = [
    { fill: '#4FC3F7', top: '#B3E5FC', bot: '#0277BD', glow: 'rgba(79,195,247,0.5)'  },
    { fill: '#AB47BC', top: '#E1BEE7', bot: '#6A1B9A', glow: 'rgba(171,71,188,0.5)'  },
    { fill: '#EF5350', top: '#FFCDD2', bot: '#B71C1C', glow: 'rgba(239,83,80,0.5)'   },
    { fill: '#FFA726', top: '#FFE082', bot: '#E65100', glow: 'rgba(255,167,38,0.5)'  },
    { fill: '#5C6BC0', top: '#C5CAE9', bot: '#1A237E', glow: 'rgba(92,107,192,0.5)'  },
    { fill: '#EC407A', top: '#F8BBD0', bot: '#880E4F', glow: 'rgba(236,64,122,0.5)'  },
    { fill: '#26C6DA', top: '#B2EBF2', bot: '#00838F', glow: 'rgba(38,198,218,0.5)'  },
    { fill: '#66BB6A', top: '#C8E6C9', bot: '#1B5E20', glow: 'rgba(102,187,106,0.5)' },
];

const SHAPES = [
    [[0,0]],
    [[0,0],[0,1]],
    [[0,0],[1,0]],
    [[0,0],[0,1],[0,2]],
    [[0,0],[1,0],[2,0]],
    [[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[1,0],[2,0],[2,1]],
    [[0,1],[1,1],[2,0],[2,1]],
    [[0,0],[0,1],[0,2],[1,0]],
    [[0,0],[0,1],[0,2],[1,2]],
    [[0,1],[0,2],[1,0],[1,1]],
    [[0,0],[0,1],[1,1],[1,2]],
    [[0,0],[0,1],[0,2],[0,3]],
    [[0,0],[1,0],[2,0],[3,0]],
    [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],
    [[0,1],[1,0],[1,1],[1,2]],
    [[0,0],[0,1],[1,0]],
    [[0,0],[1,0],[1,1]],
];

// ── State ────────────────────────────────────────────

let S = {
    board: [], score: 0, displayScore: 0, best: 0,
    pieces: [], drag: null, ghost: [], ghostOk: false,
    canvas: null, ctx: null,
    particles: [], scorePopups: [], cellFlash: {},
    placedCells: {}, screenFlash: 0, comboText: null,
    animFrame: null, combo: 0,
    dragVelX: 0, prevDragX: 0, floatRot: 0, snapLerp: 0,
    floatTargetX: 0, floatTargetY: 0,
    floatCurX: 0,   floatCurY: 0,
    rings: [], ghostPulse: 0,
    muted: false, gridPulse: 0, sheenPhase: 0,
    lastT: 0,
};

// ── Utilities ─────────────────────────────────────────

const lerp  = (a,b,t) => a + (b-a)*t;
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const rnd   = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const mkPiece = () => ({ shape: SHAPES[rnd(0,SHAPES.length-1)], colorIdx: rnd(0,COLORS.length-1) });

function isTouchDevice() {
    return ('ontouchstart' in window) ||
        (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
}
function vibrate(pat) { try { if(navigator.vibrate) navigator.vibrate(pat); } catch(e){} }

// ── Audio ────────────────────────────────────────────

let _ac = null;
function ac() {
    if (!_ac) try { _ac = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){}
    if (_ac && _ac.state==='suspended') _ac.resume();
    return _ac;
}
function beep(type) {
    if (S.muted) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime;
    const play = (freq,dur,vol=0.22,wave='sine',st=t) => {
        try {
            const o=c.createOscillator(),g=c.createGain();
            o.connect(g); g.connect(c.destination);
            o.type=wave; o.frequency.setValueAtTime(freq,st);
            g.gain.setValueAtTime(vol,st);
            g.gain.exponentialRampToValueAtTime(0.001,st+dur);
            o.start(st); o.stop(st+dur);
        } catch(e){}
    };
    const seq = (freqs,gap=0.08,dur=0.18,vol=0.22,wave='sine',st=t) => {
        freqs.forEach((f,i)=>{
            try {
                const o=c.createOscillator(),g=c.createGain();
                o.connect(g); g.connect(c.destination);
                o.type=wave; o.frequency.setValueAtTime(f,st+i*gap);
                g.gain.setValueAtTime(vol,st+i*gap);
                g.gain.exponentialRampToValueAtTime(0.001,st+i*gap+dur);
                o.start(st+i*gap); o.stop(st+i*gap+dur);
            } catch(e){}
        });
    };
    if (type==='place') { play(130,0.13,0.28,'sine'); play(80,0.09,0.18,'triangle'); play(950,0.045,0.11,'sine'); }
    if (type==='clear') { play(523,0.35,0.18,'sine'); play(659,0.33,0.15,'sine'); play(784,0.31,0.13,'sine'); play(1047,0.26,0.10,'sine'); seq([523,659,784,1047],0.065,0.20,0.12,'triangle'); }
    if (type==='combo') { seq([784,988,1175,1568,2093],0.055,0.22,0.24,'triangle'); setTimeout(()=>{ if(S.muted)return; const c2=ac(); if(!c2)return; const t2=c2.currentTime; [[784,0.30,0.13],[988,0.28,0.10],[1175,0.26,0.08]].forEach(([f,d,v])=>play(f,d,v,'sine',t2)); },320); }
    if (type==='bad')  { play(160,0.15,0.20,'sawtooth'); play(154,0.15,0.12,'sawtooth'); }
    if (type==='over') { [494,440,392,349,330,294,262].forEach((f,i)=>play(f,0.24,0.16,'sine',t+i*0.15)); play(147,1.15,0.12,'triangle'); }
}

// ── Particles ────────────────────────────────────────

function cellXY(r,c) { return { x: PAD+c*(CS+GAP), y: PAD+r*(CS+GAP) }; }

function spawnParticles(r,c,colorIdx,count=10) {
    const {x,y} = cellXY(r,c);
    const cx=x+CS/2, cy=y+CS/2;
    const col = COLORS[colorIdx];
    for (let i=0;i<count;i++) {
        const angle=(Math.PI*2*i/count)+Math.random()*0.9;
        const speed=2.2+Math.random()*3.8;
        S.particles.push({
            x:cx,y:cy,
            vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-1.8,
            size:4+Math.random()*5, color:Math.random()>0.5?col.fill:col.top,
            alpha:1, decay:0.020+Math.random()*0.016,
            type:Math.random()>0.5?'star':'circle',
            rotation:Math.random()*Math.PI*2, rotSpeed:(Math.random()-0.5)*0.28,
            trail:[], trailLen:4+Math.floor(Math.random()*4),
        });
    }
}
function spawnPlaceGlow(r,c,colorIdx) {
    const {x,y}=cellXY(r,c);
    S.rings.push({x:x+CS/2,y:y+CS/2,r:3,maxR:CS*0.9,alpha:0.8,color:COLORS[colorIdx].top,speed:3.4,thin:true});
}
function spawnRing(r,c,colorIdx) {
    const {x,y}=cellXY(r,c);
    S.rings.push({x:x+CS/2,y:y+CS/2,r:8,maxR:78,alpha:0.9,color:COLORS[colorIdx].fill,speed:5.2,thin:false});
}
function spawnScorePopup(text,cx,cy) {
    S.scorePopups.push({text,x:cx,y:cy,alpha:1,scale:1.5,vy:-2.2});
}

// ── Core loop (always running) ────────────────────────

function startLoop() {
    if (S.animFrame) return;
    S.lastT = performance.now();
    function loop(now) {
        S.animFrame = requestAnimationFrame(loop);
        const dt = clamp((now-S.lastT)/16.67, 0.2, 3);
        S.lastT = now;
        tick(dt);
        drawBoard();
    }
    S.animFrame = requestAnimationFrame(loop);
}

function tick(dt) {
    // Score roll-up
    if (S.displayScore < S.score) {
        const diff = S.score - S.displayScore;
        S.displayScore = Math.min(S.score, S.displayScore + Math.max(1, Math.ceil(diff*0.12*dt)));
        updateScoreEl();
    }
    // Particles
    for (let i=S.particles.length-1;i>=0;i--) {
        const p=S.particles[i];
        if (p.trail!==undefined) {
            p.trail.push({x:p.x,y:p.y,alpha:p.alpha});
            if (p.trail.length>p.trailLen) p.trail.shift();
        }
        p.x+=p.vx*dt; p.y+=p.vy*dt;
        p.vy+=0.20*dt; p.vx*=Math.pow(0.962,dt);
        p.alpha-=p.decay*dt; p.size*=Math.pow(0.958,dt);
        p.rotation+=(p.rotSpeed||0)*dt;
        if (p.alpha<=0) S.particles.splice(i,1);
    }
    // Score popups
    for (let i=S.scorePopups.length-1;i>=0;i--) {
        const p=S.scorePopups[i];
        p.y+=p.vy*dt; p.vy=lerp(p.vy,-0.5,0.06*dt);
        p.alpha-=0.018*dt; p.scale=Math.max(1,p.scale-0.035*dt);
        if (p.alpha<=0) S.scorePopups.splice(i,1);
    }
    // Rings
    for (let i=S.rings.length-1;i>=0;i--) {
        const ring=S.rings[i];
        ring.r+=ring.speed*dt; ring.speed*=Math.pow(0.945,dt); ring.alpha-=0.024*dt;
        if (ring.alpha<=0||ring.r>=ring.maxR) S.rings.splice(i,1);
    }
    S.screenFlash = Math.max(0,S.screenFlash-0.05*dt);
    for (const key in S.cellFlash) {
        S.cellFlash[key].alpha-=0.04*dt;
        if (S.cellFlash[key].alpha<=0) delete S.cellFlash[key];
    }
    // Spring bounce per placed cell
    for (const key in S.placedCells) {
        const cel=S.placedCells[key];
        const omega=18, zeta=0.38;
        cel.vel=(cel.vel||0);
        const f=-omega*omega*(cel.scale-1)-2*zeta*omega*cel.vel;
        cel.vel+=f*dt*0.016; cel.scale+=cel.vel*dt*0.016;
        cel.t+=0.22*dt;
        if (cel.t>Math.PI*2.5) delete S.placedCells[key];
    }
    if (S.comboText) {
        S.comboText.y-=1.1*dt; S.comboText.alpha-=0.014*dt;
        S.comboText.scale=Math.max(1,S.comboText.scale-0.022*dt);
        if (S.comboText.alpha<=0) S.comboText=null;
    }
    S.ghostPulse=(S.ghostPulse+0.09*dt)%(Math.PI*2);
    S.gridPulse =(S.gridPulse +0.016*dt)%(Math.PI*2);
    S.sheenPhase=(S.sheenPhase+0.004*dt)%1;
    // Smooth float (lerp toward target)
    if (S.drag) {
        const ease=clamp(0.22*dt,0,0.9);
        S.floatCurX=lerp(S.floatCurX,S.floatTargetX,ease);
        S.floatCurY=lerp(S.floatCurY,S.floatTargetY,ease);
        applyFloatPos();
    }
}

// ── Init ─────────────────────────────────────────────

function initBlockBlast() {
    ac();
    const oldP=document.getElementById('bb-gameover-popup');
    if (oldP) oldP.remove();
    const prevMuted=S.muted;
    const prevBest=parseInt(localStorage.getItem('bb_best')||'0');

    Object.assign(S,{
        board:Array(GRID).fill(null).map(()=>Array(GRID).fill(null)),
        score:0, displayScore:0, best:prevBest,
        drag:null, ghost:[], ghostOk:false,
        pieces:[mkPiece(),mkPiece(),mkPiece()],
        particles:[], scorePopups:[], cellFlash:{}, placedCells:{},
        screenFlash:0, comboText:null, combo:0,
        dragVelX:0, prevDragX:0, floatRot:0, snapLerp:0,
        floatTargetX:0, floatTargetY:0, floatCurX:0, floatCurY:0,
        rings:[], ghostPulse:0,
        muted:prevMuted, gridPulse:0, sheenPhase:0,
        lastT:performance.now(),
    });

    buildUI();
    const btn=document.getElementById('blockblast-restart');
    if (btn) btn.onclick=initBlockBlast;
    if (S.animFrame) { cancelAnimationFrame(S.animFrame); S.animFrame=null; }
    startLoop();
}

// ── Build UI ──────────────────────────────────────────

function buildUI() {
    const wrap=document.getElementById('blockblast-board');
    if (!wrap) return;
    wrap.innerHTML='';

    const availW=Math.min(window.innerWidth-40,500);
    const isMobile=window.innerWidth<600;
    if (isMobile) {
        GAP=3; PAD=8;
        // Board capped at 48% of viewport height so the other 52%
        // always covers header + tray + all padding without needing scroll.
        const maxFromW=Math.min(window.innerWidth*0.88, availW-10);
        const maxFromH=Math.max(200, window.innerHeight*0.48);
        const maxSize=Math.min(maxFromW, maxFromH);
        CS=Math.max(22,Math.min(40,Math.floor((maxSize-GAP*(GRID-1)-PAD*2)/GRID)));
    }
    else { CS=46; GAP=3; PAD=10; }

    wrap.style.cssText=[
        'display:flex',isMobile?'flex-direction:column':'flex-direction:row',
        'align-items:center','gap:14px','background:transparent','border:none',
        'box-shadow:none','padding:0','width:auto','min-width:unset',
        'position:relative','touch-action:none'
    ].join(' !important;')+' !important;';

    const tray=document.createElement('div');
    tray.id='bb-tray';
    tray.style.cssText=isMobile
        ?'display:flex;flex-direction:row;gap:12px;justify-content:center;align-items:center;width:100%;padding:4px 0;touch-action:none;'
        :'display:flex;flex-direction:column;gap:18px;justify-content:center;align-items:center;min-width:110px;padding:8px 0;align-self:center;touch-action:none;';

    const boardPx=GRID*(CS+GAP)-GAP+PAD*2;
    const cv=document.createElement('canvas');
    cv.width=cv.height=boardPx;
    cv.style.cssText='border-radius:18px;border:2px solid #2E3A60;display:block;cursor:default;touch-action:none;box-shadow:0 8px 40px rgba(0,0,0,0.5);max-width:100%;';
    wrap.appendChild(cv);
    S.canvas=cv; S.ctx=cv.getContext('2d');

    if (!isMobile) wrap.insertBefore(tray,cv);
    // On mobile the piece tray lives in the UGB popup bar — don't add inline tray

    cv.addEventListener('touchstart',e=>{ if(e.touches.length>1)e.preventDefault(); },{passive:false});
    cv.addEventListener('mousemove',  evBoardMove);
    cv.addEventListener('mouseleave', evBoardLeave);
    cv.addEventListener('mouseup',    evBoardUp);
    cv.addEventListener('touchmove',  evBoardTMove,{passive:false});
    cv.addEventListener('touchend',   evBoardTEnd, {passive:false});

    buildTray();
    updateScoreEl();
}

function buildTray() {
    const isMobile=window.innerWidth<600;
    const trayEl=isMobile?document.getElementById('ugb-blockblast'):document.getElementById('bb-tray');
    if (!trayEl) return;
    trayEl.innerHTML='';
    const pieceScale=isMobile?1.6:Math.max(0.7,CS*0.025);
    const slotW=isMobile?90:100;
    const slotH=isMobile?84:90;

    S.pieces.forEach((piece,idx)=>{
        const slot=document.createElement('div');
        slot.id='bb-slot-'+idx;
        slot.style.cssText=`background:${isMobile?'rgba(20,25,60,0.85)':'transparent'};border:${isMobile?'2px solid rgba(102,126,234,0.35)':'none'};border-radius:${isMobile?'14px':'0'};width:${slotW}px;min-height:${slotH}px;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-user-drag:none;opacity:${piece?'1':'0.2'};cursor:${piece?'grab':'default'};transition:transform 0.12s,opacity 0.12s,box-shadow 0.12s;`;
        slot.draggable=false;
        slot.addEventListener('dragstart',e=>e.preventDefault());
        if (piece) {
            slot.appendChild(mkPieceCanvas(piece,pieceScale));
            slot.addEventListener('mousedown',e=>startDrag(idx,e.clientX,e.clientY));
            slot.addEventListener('touchstart',e=>{ e.preventDefault(); e.stopPropagation(); const t=e.touches[0]; startDrag(idx,t.clientX,t.clientY); },{passive:false});
            slot.onmouseenter=()=>{ slot.style.transform='scale(1.1)'; if(isMobile) slot.style.boxShadow='0 0 14px rgba(102,126,234,0.5)'; };
            slot.onmouseleave=()=>{ slot.style.transform='scale(1)'; slot.style.boxShadow=''; };
        }
        trayEl.appendChild(slot);
    });
}

// ── Drawing ───────────────────────────────────────────

function drawBoard() {
    const cv=S.canvas,ctx=S.ctx;
    if (!cv||!ctx) return;

    ctx.fillStyle='#141930';
    ctx.beginPath(); rr(ctx,0,0,cv.width,cv.height,18); ctx.fill();

    const bgGrad=ctx.createRadialGradient(cv.width/2,cv.height/2,cv.width*0.1,cv.width/2,cv.height/2,cv.width*0.72);
    bgGrad.addColorStop(0,'rgba(46,58,96,0.55)');
    bgGrad.addColorStop(1,'rgba(20,25,48,0)');
    ctx.fillStyle=bgGrad;
    ctx.beginPath(); rr(ctx,0,0,cv.width,cv.height,18); ctx.fill();

    for (let r=0;r<GRID;r++) {
        for (let c=0;c<GRID;c++) {
            const x=PAD+c*(CS+GAP), y=PAD+r*(CS+GAP);
            const ghostHere=S.ghost.some(([gr,gc])=>gr===r&&gc===c);
            const colIdx=S.board[r][c];

            if (ghostHere) {
                if (S.ghostOk) {
                    const pulse=0.50+0.22*Math.sin(S.ghostPulse);
                    drawBlock(ctx,x,y,CS,S.drag.colorIdx,pulse);
                    ctx.save();
                    ctx.globalAlpha=0.45+0.30*Math.sin(S.ghostPulse);
                    ctx.strokeStyle=COLORS[S.drag.colorIdx].top;
                    ctx.lineWidth=2;
                    ctx.shadowColor=COLORS[S.drag.colorIdx].fill;
                    ctx.shadowBlur=10+5*Math.sin(S.ghostPulse);
                    ctx.beginPath(); rr(ctx,x+1,y+1,CS-2,CS-2,6); ctx.stroke();
                    ctx.restore();
                } else {
                    ctx.save();
                    ctx.globalAlpha=0.5; ctx.fillStyle='#ff3333';
                    ctx.beginPath(); rr(ctx,x+2,y+2,CS-4,CS-4,6); ctx.fill();
                    ctx.globalAlpha=0.9; ctx.strokeStyle='#ff6666'; ctx.lineWidth=1.5;
                    ctx.beginPath(); rr(ctx,x+1,y+1,CS-2,CS-2,6); ctx.stroke();
                    ctx.restore();
                }
            } else if (colIdx!==null) {
                const key=`${r}_${c}`;
                const spring=S.placedCells[key];
                if (spring) {
                    const sc=clamp(spring.scale,0.6,1.45);
                    const cx2=x+CS/2,cy2=y+CS/2;
                    ctx.save();
                    ctx.translate(cx2,cy2); ctx.scale(sc,sc); ctx.translate(-cx2,-cy2);
                    drawBlock(ctx,x,y,CS,colIdx,1.0);
                    ctx.restore();
                } else {
                    drawBlock(ctx,x,y,CS,colIdx,1.0);
                }
            } else {
                const breathe=0.86+0.14*Math.sin(S.gridPulse+(r+c)*0.30);
                ctx.save();
                ctx.globalAlpha=breathe;
                ctx.fillStyle='#1E2748';
                ctx.beginPath(); rr(ctx,x,y,CS,CS,7); ctx.fill();
                // Sheen sweep
                const diagPos=(S.sheenPhase*(GRID*2))-(r+c);
                if (diagPos>0&&diagPos<1.6) {
                    const sa=Math.sin(diagPos/1.6*Math.PI)*0.13;
                    ctx.globalAlpha=breathe*sa;
                    ctx.fillStyle='#ffffff';
                    ctx.beginPath(); rr(ctx,x,y,CS,CS,7); ctx.fill();
                }
                ctx.globalAlpha=breathe*0.85;
                ctx.strokeStyle='#283460'; ctx.lineWidth=1;
                ctx.beginPath(); rr(ctx,x+0.5,y+0.5,CS-1,CS-1,7); ctx.stroke();
                ctx.restore();
            }

            const fk=`${r}_${c}`;
            if (S.cellFlash[fk]) {
                const f=S.cellFlash[fk];
                ctx.save();
                ctx.globalAlpha=f.alpha*0.9; ctx.fillStyle='#ffffff';
                ctx.beginPath(); rr(ctx,x,y,CS,CS,7); ctx.fill();
                ctx.globalAlpha=f.alpha*0.4; ctx.fillStyle=COLORS[f.colorIdx].top;
                ctx.beginPath(); rr(ctx,x,y,CS,CS,7); ctx.fill();
                ctx.restore();
            }
        }
    }

    // Rings
    S.rings.forEach(ring=>{
        ctx.save();
        ctx.globalAlpha=Math.max(0,ring.alpha);
        ctx.strokeStyle=ring.color; ctx.lineWidth=ring.thin?1.5:3.5;
        ctx.shadowColor=ring.color; ctx.shadowBlur=ring.thin?7:16;
        ctx.beginPath(); ctx.arc(ring.x,ring.y,ring.r,0,Math.PI*2); ctx.stroke();
        ctx.restore();
    });

    // Screen flash
    if (S.screenFlash>0.01) {
        ctx.save(); ctx.globalAlpha=S.screenFlash*0.5; ctx.fillStyle='#ffffff';
        ctx.beginPath(); rr(ctx,0,0,cv.width,cv.height,18); ctx.fill(); ctx.restore();
    }

    // Particle trails
    S.particles.forEach(p=>{
        if (!p.trail||p.trail.length<2) return;
        ctx.save();
        for (let i=0;i<p.trail.length-1;i++) {
            const ta=p.trail[i],tb=p.trail[i+1];
            const prog=(i+1)/p.trail.length;
            ctx.globalAlpha=Math.max(0,ta.alpha*prog*0.42);
            ctx.strokeStyle=p.color; ctx.lineWidth=Math.max(0.5,p.size*prog*0.36); ctx.lineCap='round';
            ctx.beginPath(); ctx.moveTo(ta.x,ta.y); ctx.lineTo(tb.x,tb.y); ctx.stroke();
        }
        ctx.restore();
    });

    // Particles
    S.particles.forEach(p=>{
        ctx.save(); ctx.globalAlpha=Math.max(0,p.alpha); ctx.fillStyle=p.color;
        ctx.shadowColor=p.color; ctx.shadowBlur=4;
        if (p.type==='star') {
            ctx.translate(p.x,p.y); ctx.rotate(p.rotation||0);
            const s=Math.max(0.5,p.size);
            ctx.beginPath();
            for (let i=0;i<4;i++) {
                const a=(i/4)*Math.PI*2,ia=a+Math.PI/4;
                if (i===0) ctx.moveTo(Math.cos(a)*s,Math.sin(a)*s);
                else       ctx.lineTo(Math.cos(a)*s,Math.sin(a)*s);
                ctx.lineTo(Math.cos(ia)*(s*0.38),Math.sin(ia)*(s*0.38));
            }
            ctx.closePath(); ctx.fill();
        } else {
            ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(0.5,p.size),0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
    });

    // Score popups
    S.scorePopups.forEach(p=>{
        ctx.save(); ctx.globalAlpha=Math.max(0,p.alpha); ctx.textAlign='center';
        ctx.font=`900 ${Math.round(18*p.scale)}px 'Segoe UI',system-ui,sans-serif`;
        ctx.fillStyle='#ffd700'; ctx.shadowColor='#ff8800'; ctx.shadowBlur=10;
        ctx.fillText(p.text,p.x,p.y); ctx.restore();
    });

    // Combo text
    if (S.comboText) {
        const ct=S.comboText;
        ctx.save(); ctx.globalAlpha=Math.max(0,ct.alpha); ctx.textAlign='center';
        ctx.font=`900 ${Math.round(22*ct.scale)}px 'Segoe UI',system-ui,sans-serif`;
        ctx.fillStyle=ct.color||'#ffffff'; ctx.shadowColor='#ffd700'; ctx.shadowBlur=22;
        ctx.fillText(ct.text,ct.x,ct.y); ctx.restore();
    }

    // Combo badge
    if (S.combo>1) {
        const mult=Math.min(4,1+(S.combo-1)*0.5);
        ctx.save(); ctx.globalAlpha=0.92;
        ctx.font='bold 13px "Segoe UI",system-ui,sans-serif';
        ctx.fillStyle='#ffd700'; ctx.textAlign='right';
        ctx.shadowColor='#ff8800'; ctx.shadowBlur=8;
        ctx.fillText(`🔥 ×${mult%1===0?mult:mult.toFixed(1)}`,cv.width-PAD-4,PAD+15);
        ctx.restore();
    }
}

function drawBlock(ctx,x,y,size,colorIdx,alpha) {
    const col=COLORS[colorIdx];
    ctx.save(); ctx.globalAlpha=alpha;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.beginPath(); rr(ctx,x+2,y+3,size-2,size-2,7); ctx.fill();
    // Base
    ctx.fillStyle=col.fill;
    ctx.beginPath(); rr(ctx,x,y,size,size,7); ctx.fill();
    // Highlight
    const shine=ctx.createLinearGradient(x,y,x,y+size*0.6);
    shine.addColorStop(0,'rgba(255,255,255,0.42)');
    shine.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=shine;
    ctx.beginPath(); rr(ctx,x+2,y+2,size-4,size*0.52,5); ctx.fill();
    // Bottom lip
    ctx.fillStyle=col.bot+'AA';
    ctx.beginPath(); rr(ctx,x+3,y+size-7,size-6,5,3); ctx.fill();
    // Inner glow rim
    ctx.save();
    ctx.shadowColor=col.glow; ctx.shadowBlur=8;
    ctx.strokeStyle=col.top+'CC'; ctx.lineWidth=1.5;
    ctx.beginPath(); rr(ctx,x+1,y+1,size-2,size-2,7); ctx.stroke();
    ctx.restore();
    // Outer border
    ctx.strokeStyle=col.bot; ctx.lineWidth=1.2;
    ctx.beginPath(); rr(ctx,x+0.6,y+0.6,size-1.2,size-1.2,7); ctx.stroke();
    ctx.restore();
}

function rr(ctx,x,y,w,h,r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
}

function mkPieceCanvas(piece,scale) {
    const {shape,colorIdx}=piece;
    const cs=Math.round(26*scale),gap=Math.round(3*scale);
    let maxR=0,maxC=0;
    shape.forEach(([r,c])=>{ maxR=Math.max(maxR,r); maxC=Math.max(maxC,c); });
    const cv=document.createElement('canvas');
    cv.width=(maxC+1)*(cs+gap)+4; cv.height=(maxR+1)*(cs+gap)+4;
    cv.style.display='block'; cv.style.pointerEvents='none';
    cv.draggable=false;
    cv.addEventListener('dragstart',e=>e.preventDefault());
    const ctx=cv.getContext('2d');
    shape.forEach(([r,c])=>drawBlock(ctx,c*(cs+gap)+2,r*(cs+gap)+2,cs,colorIdx,1.0));
    return cv;
}

// ── Float piece ───────────────────────────────────────

function getFloatEl() {
    let f=document.getElementById('bb-float');
    if (!f) {
        f=document.createElement('canvas');
        f.id='bb-float';
        f.style.cssText='position:fixed;pointer-events:none;z-index:99999;display:none;will-change:transform,left,top;';
        document.body.appendChild(f);
    }
    return f;
}

function showFloat(piece,cx,cy) {
    const {shape,colorIdx}=piece;
    const cs=40,gap=4;
    let maxR=0,maxC=0;
    shape.forEach(([r,c])=>{ maxR=Math.max(maxR,r); maxC=Math.max(maxC,c); });
    const f=getFloatEl();
    f.width=(maxC+1)*(cs+gap)+4; f.height=(maxR+1)*(cs+gap)+4;
    const ctx=f.getContext('2d');
    ctx.clearRect(0,0,f.width,f.height);
    shape.forEach(([r,c])=>drawBlock(ctx,c*(cs+gap)+2,r*(cs+gap)+2,cs,colorIdx,0.92));
    f.style.display='block'; f.style.filter='drop-shadow(0 12px 24px rgba(0,0,0,0.7))';
    f.style.transition='none'; f.style.transform='scale(0.5)';
    const fingerOffset=isTouchDevice()?92+f.height*0.55:20;
    S.floatCurX=cx-f.width/2;
    S.floatCurY=cy-f.height/2-fingerOffset;
    S.floatTargetX=S.floatCurX; S.floatTargetY=S.floatCurY;
    f.style.left=S.floatCurX+'px'; f.style.top=S.floatCurY+'px';
    S.prevDragX=cx; S.dragVelX=0; S.floatRot=0; S.snapLerp=0;
    requestAnimationFrame(()=>{
        f.style.transition='transform 0.18s cubic-bezier(0.34,1.56,0.64,1)';
        f.style.transform='scale(1.1) rotate(0deg)';
        setTimeout(()=>{ f.style.transition='none'; },200);
    });
}

function setFloatTarget(cx,cy) {
    const f=getFloatEl();
    if (!f||f.style.display==='none') return;
    const fingerOffset=isTouchDevice()?92+f.height*0.55:20;
    S.floatTargetX=cx-f.width/2;
    S.floatTargetY=cy-f.height/2-fingerOffset;
    const rawVel=cx-S.prevDragX;
    S.prevDragX=cx;
    S.dragVelX=S.dragVelX*0.70+rawVel*0.30;
}

function applyFloatPos() {
    const f=getFloatEl();
    if (!f||f.style.display==='none') return;
    f.style.left=S.floatCurX.toFixed(1)+'px';
    f.style.top =S.floatCurY.toFixed(1)+'px';
    if (S.ghostOk) S.snapLerp=Math.min(1,S.snapLerp+0.10);
    else           S.snapLerp=Math.max(0,S.snapLerp-0.08);
    const tiltDeg=clamp(S.dragVelX*2.5,-16,16);
    S.floatRot=S.floatRot*0.80+tiltDeg*0.20;
    const sv=1.0+S.snapLerp*0.09;
    f.style.transform=`rotate(${S.floatRot.toFixed(2)}deg) scale(${sv.toFixed(3)})`;
}

function hideFloat() {
    const f=document.getElementById('bb-float');
    if (f) {
        f.style.transition='transform 0.14s cubic-bezier(0.55,0,1,0.45),opacity 0.14s';
        f.style.transform='scale(0.25) rotate(12deg)';
        f.style.opacity='0';
        setTimeout(()=>{ if(f){ f.style.display='none'; f.style.opacity='1'; } },140);
    }
}

// ── Drag ──────────────────────────────────────────────

function startDrag(idx,cx,cy) {
    if (!S.pieces[idx]) return;
    ac();
    S.drag={idx,shape:S.pieces[idx].shape,colorIdx:S.pieces[idx].colorIdx};
    S.ghost=[]; S.ghostOk=false; S.snapLerp=0;
    const slot=document.getElementById('bb-slot-'+idx);
    if (slot) { slot.style.opacity='0.18'; slot.style.transform='scale(0.80)'; }
    showFloat(S.pieces[idx],cx,cy);
    document.addEventListener('mousemove', evDocMove);
    document.addEventListener('mouseup',   evDocUp);
    document.addEventListener('touchmove', evDocTMove,{passive:false});
    document.addEventListener('touchend',  evDocTEnd, {passive:false});
    document.body.style.overflow='hidden';
    document.body.style.touchAction='none';
}

function evDocMove(e)  { if(!S.drag)return; setFloatTarget(e.clientX,e.clientY); updateGhost(e.clientX,e.clientY); }
function evDocUp(e)    { rmDocListeners(); finishDrag(e.clientX,e.clientY); }
function evDocTMove(e) { e.preventDefault(); if(!S.drag)return; const t=e.touches[0]; setFloatTarget(t.clientX,t.clientY); updateGhost(t.clientX,t.clientY); }
function evDocTEnd(e)  { e.preventDefault(); rmDocListeners(); const t=e.changedTouches[0]; finishDrag(t.clientX,t.clientY); }
function evBoardMove(e)  { if(!S.drag)return; setFloatTarget(e.clientX,e.clientY); updateGhost(e.clientX,e.clientY); }
function evBoardLeave()  { if(!S.drag)return; S.ghost=[]; S.ghostOk=false; }
function evBoardUp(e)    { if(!S.drag)return; rmDocListeners(); finishDrag(e.clientX,e.clientY); }
function evBoardTMove(e) { e.preventDefault(); if(!S.drag)return; const t=e.touches[0]; setFloatTarget(t.clientX,t.clientY); updateGhost(t.clientX,t.clientY); }
function evBoardTEnd(e)  { e.preventDefault(); if(!S.drag)return; rmDocListeners(); const t=e.changedTouches[0]; finishDrag(t.clientX,t.clientY); }

function rmDocListeners() {
    document.body.style.overflow=''; document.body.style.touchAction='';
    document.removeEventListener('mousemove', evDocMove);
    document.removeEventListener('mouseup',   evDocUp);
    document.removeEventListener('touchmove', evDocTMove);
    document.removeEventListener('touchend',  evDocTEnd);
}

function updateGhost(cx,cy) {
    if (!S.drag) return;
    const cell=boardCellAt(cx,cy);
    if (!cell) { S.ghost=[]; S.ghostOk=false; return; }
    S.ghost=S.drag.shape.map(([dr,dc])=>[cell.r+dr,cell.c+dc]);
    S.ghostOk=S.ghost.every(([r,c])=>r>=0&&r<GRID&&c>=0&&c<GRID&&S.board[r][c]===null);
}

function boardCellAt(cx,cy) {
    const cv=S.canvas; if (!cv) return null;
    const rect=cv.getBoundingClientRect();
    const sx=cv.width/rect.width, sy=cv.height/rect.height;
    const x=(cx-rect.left)*sx-PAD, y=(cy-rect.top)*sy-PAD;
    const step=CS+GAP;
    const c=Math.floor(x/step),r=Math.floor(y/step);
    if (r<0||r>=GRID||c<0||c>=GRID) return null;
    return {r,c};
}

function finishDrag(cx,cy) {
    if (!S.drag) return;
    const cell=boardCellAt(cx,cy);
    const valid=cell&&S.drag.shape.every(([dr,dc])=>{
        const nr=cell.r+dr,nc=cell.c+dc;
        return nr>=0&&nr<GRID&&nc>=0&&nc<GRID&&S.board[nr][nc]===null;
    });

    if (!valid) {
        beep('bad'); vibrate([80,40,80]); shakeBoard();
        const slot=document.getElementById('bb-slot-'+S.drag.idx);
        if (slot) { slot.style.opacity='1'; slot.style.transform='scale(1)'; }
        S.drag=null; S.ghost=[]; S.ghostOk=false; S.snapLerp=0;
        hideFloat(); return;
    }

    const {idx,shape,colorIdx}=S.drag;
    shape.forEach(([dr,dc])=>{ S.board[cell.r+dr][cell.c+dc]=colorIdx; });
    S.pieces[idx]=null;
    S.drag=null; S.ghost=[]; S.ghostOk=false; S.snapLerp=0;
    hideFloat();
    beep('place'); vibrate(28);

    shape.forEach(([dr,dc])=>{
        const r=cell.r+dr,c=cell.c+dc,key=`${r}_${c}`;
        S.placedCells[key]={scale:1.35,vel:0,t:0,colorIdx};
        spawnParticles(r,c,colorIdx,4);
        spawnPlaceGlow(r,c,colorIdx);
    });

    const cleared=doClears();
    if (cleared>0) { S.combo++; vibrate(cleared>=2?[55,25,55,25,80]:[45,25,45]); }
    else           S.combo=0;

    const multiplier=S.combo>1?Math.min(4,1+(S.combo-1)*0.5):1;
    const basePoints=shape.length*10+cleared*100;
    const pts=Math.round(basePoints*multiplier);
    S.score+=pts;
    if (S.score>S.best) { S.best=S.score; localStorage.setItem('bb_best',S.best); }

    const sumR=shape.reduce((a,[r])=>a+r,0)/shape.length;
    const sumC=shape.reduce((a,[,c])=>a+c,0)/shape.length;
    const px=PAD+(cell.c+sumC)*(CS+GAP)+CS/2;
    const py=PAD+(cell.r+sumR)*(CS+GAP);
    spawnScorePopup((S.combo>1&&cleared>0)?`+${pts} ×${multiplier%1===0?multiplier:multiplier.toFixed(1)}`:`+${pts}`,px,py);

    if (cleared>0) {
        beep(S.combo>=3?'combo':'clear');
        const msg=S.combo>=3?`🔥 COMBO ×${S.combo}! +${pts}`:cleared>=2?`🔥 ${cleared} lines! +${pts}`:`✨ Line cleared! +${pts}`;
        if (window.showToast) window.showToast(msg,'success');
    }

    if (S.pieces.every(p=>p===null)) S.pieces=[mkPiece(),mkPiece(),mkPiece()];
    buildTray();
    if (isGameOver()) setTimeout(showGameOver,350);
    if (window.saveScore) window.saveScore('blockblast',S.score);
}

// ── Clear lines ───────────────────────────────────────

function doClears() {
    const kill=new Set();
    for (let r=0;r<GRID;r++) if (S.board[r].every(v=>v!==null)) for (let c=0;c<GRID;c++) kill.add(r*GRID+c);
    for (let c=0;c<GRID;c++) if (S.board.every(row=>row[c]!==null)) for (let r=0;r<GRID;r++) kill.add(r*GRID+c);
    if (!kill.size) return 0;

    let lines=0;
    for (let r=0;r<GRID;r++) if (S.board[r].every(v=>v!==null)) lines++;
    for (let c=0;c<GRID;c++) if (S.board.every(row=>row[c]!==null)) lines++;

    const centerR=(GRID-1)/2,centerC=(GRID-1)/2;
    kill.forEach(k=>{
        const r=Math.floor(k/GRID),c=k%GRID;
        const colorIdx=S.board[r][c]??0;
        const dist=Math.abs(r-centerR)+Math.abs(c-centerC);
        setTimeout(()=>{
            spawnParticles(r,c,colorIdx,9);
            S.cellFlash[`${r}_${c}`]={alpha:1,colorIdx};
            spawnRing(r,c,colorIdx);
        },Math.round(dist*18));
    });

    S.screenFlash=Math.min(1,0.22+lines*0.10);
    const midX=PAD+(GRID*(CS+GAP))/2,midY=PAD+(GRID*(CS+GAP))/2;
    if (lines>=3)    S.comboText={text:`🔥 TRIPLE! ×${lines}`,x:midX,y:midY,alpha:1,scale:2.2,color:'#ff6b35'};
    else if (lines===2) S.comboText={text:'✨ DOUBLE!',          x:midX,y:midY,alpha:1,scale:1.9,color:'#ffd700'};
    else                S.comboText={text:'CLEAR!',              x:midX,y:midY,alpha:1,scale:1.6,color:'#ffffff'};

    kill.forEach(k=>{ const r=Math.floor(k/GRID),c=k%GRID; S.board[r][c]=null; });
    return lines;
}

// ── Game over ─────────────────────────────────────────

function isGameOver() {
    return S.pieces.every(p=>{
        if (!p) return true;
        for (let r=0;r<GRID;r++) for (let c=0;c<GRID;c++)
            if (p.shape.every(([dr,dc])=>{ const nr=r+dr,nc=c+dc; return nr>=0&&nr<GRID&&nc>=0&&nc<GRID&&S.board[nr][nc]===null; })) return false;
        return true;
    });
}

function showGameOver() {
    beep('over'); vibrate([200,100,300]);
    const old=document.getElementById('bb-gameover-popup');
    if (old) old.remove();
    const isNewBest=S.score>=S.best&&S.score>0;
    const popup=document.createElement('div');
    popup.id='bb-gameover-popup';
    popup.style.cssText='position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;background:rgba(6,10,30,0.85);border-radius:16px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:bbPopIn 0.38s cubic-bezier(0.34,1.56,0.64,1) both;';

    if (!document.getElementById('bb-anim-style')) {
        const st=document.createElement('style');
        st.id='bb-anim-style';
        st.textContent='@keyframes bbPopIn{from{opacity:0;transform:scale(0.55)}to{opacity:1;transform:scale(1)}}@keyframes bbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.09)}}#bb-gameover-popup .goc{background:linear-gradient(145deg,#1a2250,#0d1535);border:2px solid rgba(100,130,255,0.3);border-radius:22px;padding:32px 44px;text-align:center;box-shadow:0 0 70px rgba(80,120,255,0.22),0 24px 64px rgba(0,0,0,0.55);min-width:220px;}#bb-gameover-popup .got{font-size:2.3rem;font-weight:900;color:#ff4d6d;text-shadow:0 0 22px rgba(255,77,109,0.65);margin-bottom:6px;letter-spacing:1px;}#bb-gameover-popup .gob{background:linear-gradient(90deg,#ffd700,#ff8c00);color:#1a0a00;font-weight:800;font-size:.85rem;padding:3px 14px;border-radius:20px;margin-bottom:14px;display:inline-block;animation:bbPulse 1s infinite;}#bb-gameover-popup .gol{font-size:.82rem;color:rgba(160,185,255,.65);text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;}#bb-gameover-popup .gov{font-size:3.1rem;font-weight:900;color:#fff;text-shadow:0 0 32px rgba(100,180,255,.5);line-height:1;margin-bottom:18px;}#bb-gameover-popup .gobr{font-size:.95rem;color:rgba(180,200,255,.6);margin-bottom:24px;}#bb-gameover-popup .gobtn{background:linear-gradient(135deg,#667eea,#764ba2);border:none;border-radius:14px;color:#fff;font-size:1.1rem;font-weight:700;padding:12px 40px;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 6px 22px rgba(102,126,234,.45);}#bb-gameover-popup .gobtn:hover{transform:scale(1.07);box-shadow:0 12px 30px rgba(102,126,234,.65);}';
        document.head.appendChild(st);
    }

    popup.innerHTML=`<div class="goc"><div class="got">Game Over!</div>${isNewBest?'<div class="gob">🏆 NEW BEST!</div>':''}<div class="gol">Your Score</div><div class="gov">${S.score.toLocaleString()}</div><div class="gobr">Best: ${S.best.toLocaleString()}</div><button class="gobtn" id="bb-go-restart-btn">▶ Play Again</button></div>`;

    const wrap=document.getElementById('blockblast-board');
    if (wrap) { wrap.style.position='relative'; wrap.appendChild(popup); }
    document.getElementById('bb-go-restart-btn').onclick=()=>{ popup.remove(); initBlockBlast(); };
}

function shakeBoard() {
    const cv=S.canvas; if (!cv) return;
    let i=0;
    const fx=['-7px','7px','-5px','5px','-2px','2px','0px'];
    const go=()=>{ cv.style.transform=`translateX(${fx[i++]})`; if(i<fx.length)setTimeout(go,36); else cv.style.transform=''; };
    go();
    if (window.showToast) window.showToast("Can't place there!",'warning');
}

function updateScoreEl() {
    const el=document.getElementById('blockblast-score');
    if (el) el.textContent=S.displayScore;
    const be=document.getElementById('blockblast-best');
    if (be) be.textContent=S.best;
}

// ── Expose ────────────────────────────────────────────

window.initBlockBlast=initBlockBlast;
window.buildBlockBlastTray=buildTray;
window._stopBlockBlast=function(){ if(S.animFrame){cancelAnimationFrame(S.animFrame);S.animFrame=null;} S.canvas=null; S.ctx=null; };

let _bbResizeTimer=null;
window.addEventListener('resize',()=>{
    if (!S.canvas) return;
    clearTimeout(_bbResizeTimer);
    _bbResizeTimer=setTimeout(()=>{
        if (document.getElementById('blockblast-board')&&S.board.length) buildUI();
    },250);
});

})();