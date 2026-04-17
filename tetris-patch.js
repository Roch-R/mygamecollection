/* ============================================
   TETRIS PATCH v3 - BULLETPROOF EDITION
   FIX: Loop version counter kills ANY
   competing RAF loop (incl. from game.js).
   Line clearing is fully synchronous.
   ============================================ */

(function () {
    'use strict';

    /* ── Global loop version: any old RAF that
       sees a different version instantly dies ── */
    var LOOP_VERSION = 0;

    function waitForGameState(cb, tries) {
        tries = tries || 0;
        if (typeof gameState !== 'undefined') { cb(); }
        else if (tries < 80) { setTimeout(function () { waitForGameState(cb, tries + 1); }, 100); }
        else { console.error('[Tetris v3] gameState timeout'); }
    }

    function _toast(msg, t) { if (typeof showToast === 'function') showToast(msg, t); }
    /* _sound kept for any external callers; Tetris uses its own engine below */
    function _confetti()     { if (typeof showConfetti === 'function') showConfetti(); }
    function _saveScore(g,s) { if (typeof saveScore === 'function') saveScore(g, s); }
    function _initAudio()    { if (typeof initGameAudio === 'function') initGameAudio(); }

    var PIECES = {
        I: { shape: [[1,1,1,1]],        color:'#00f0f0', shadow:'#007878' },
        O: { shape: [[1,1],[1,1]],       color:'#f0f000', shadow:'#787800' },
        T: { shape: [[0,1,0],[1,1,1]],   color:'#a000f0', shadow:'#500078' },
        S: { shape: [[0,1,1],[1,1,0]],   color:'#00f000', shadow:'#007800' },
        Z: { shape: [[1,1,0],[0,1,1]],   color:'#f00000', shadow:'#780000' },
        J: { shape: [[1,0,0],[1,1,1]],   color:'#0000f0', shadow:'#000078' },
        L: { shape: [[0,0,1],[1,1,1]],   color:'#f0a000', shadow:'#785000' }
    };
    var PTYPES = Object.keys(PIECES);

    /* ─────────────────────────────────────────
       PATCH ENTRY
    ───────────────────────────────────────── */
    function patchTetris() {
        /* Give tetris its own clean state */
        gameState.tetris = makeFreshState();

        /* ── Override startGame ──
           DO NOT call _origStartGame for tetris —
           it starts a competing RAF loop.          */
        var _orig = typeof startGame === 'function' ? startGame : null;
        window.startGame = function (name) {
            if (name === 'tetris') {
                showArena('tetris');
                gameState.currentGame = 'tetris';
                setTimeout(initTetris, 50);
            } else {
                if (_orig) _orig(name);
            }
        };

        /* ── Expose public API ── */
        window.startTetris         = startTetris;
        window.togglePauseTetris   = togglePauseTetris;
        window.tetrisMobileAction  = tetrisMobileAction;
        window.closeTetrisGameOver = closeTetrisGameOver;

        /* ── Keyboard (Arrow + WASD) ── */
        document.addEventListener('keydown', onKey);
        document.addEventListener('keyup', function(e){
            if (e.key==='ArrowLeft'||e.key==='a'||e.key==='A')  { _dasLeft=0; }
            if (e.key==='ArrowRight'||e.key==='d'||e.key==='D') { _dasRight=0; }
        });

        /* ── Resize handler ── */
        var _tetrisResizeTimer=null;
        window.addEventListener('resize', function(){
            var st=gameState.tetris;
            if (!st||!st.canvas) return;
            clearTimeout(_tetrisResizeTimer);
            _tetrisResizeTimer=setTimeout(function(){
                resizeCanvas(st);
                if (st.isRunning) drawBoard(st);
                else if (!st.isGameOver) drawStartScreen(st);
            }, 300);
        });

        console.log('[Tetris v3] Patched. Loop-version kill-switch active.');
    }

    /* ─────────────────────────────────────────
       STATE FACTORY
    ───────────────────────────────────────── */
    function makeFreshState() {
        return {
            canvas:null, ctx:null,
            nextCanvas:null, nextCtx:null,
            holdCanvas:null, holdCtx:null,
            board:[], currentPiece:null,
            nextPiece:null, holdPiece:null,
            canHold:true,
            score:0,
            highScore: parseInt(localStorage.getItem('tetrisHigh')||'0'),
            level:1, lines:0, combo:0,
            isRunning:false, isPaused:false, isGameOver:false,
            lastDrop:0, dropInterval:1000,
            rows:20, cols:10, cellSize:30,
            ghostY:0, bag:[], myVersion:0,
            particles:[], clearingRows:null, _swipeStart:null
        };
    }

    /* ─────────────────────────────────────────
       DAS (Delayed Auto Shift) for keyboard
    ───────────────────────────────────────── */
    var _dasLeft=0, _dasRight=0, _dasLeftLast=0, _dasRightLast=0;
    var DAS_DELAY=170, DAS_INTERVAL=50;
    var _canvasGesturesAdded=false;

    /* ─────────────────────────────────────────
       TETRIS AUDIO ENGINE
       (Dedicated AudioContext so volumes aren't
        throttled by the shared playGameSound.)
    ───────────────────────────────────────── */
    var _TAC = null;
    function _getAC() {
        if (_TAC) return _TAC;
        try { _TAC = new (window.AudioContext || window.webkitAudioContext)(); }
        catch(e) { _TAC = null; }
        return _TAC;
    }
    function _tone(freq, dur, vol, type, freqEnd) {
        var ac = _getAC(); if (!ac) return;
        if (ac.state === 'suspended') { ac.resume().catch(function(){}); return; }
        try {
            var osc = ac.createOscillator();
            var gain = ac.createGain();
            osc.connect(gain); gain.connect(ac.destination);
            var t = ac.currentTime;
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, t);
            if (freqEnd !== undefined) osc.frequency.linearRampToValueAtTime(freqEnd, t + dur * 0.75);
            gain.gain.setValueAtTime(Math.min(vol, 0.5), t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.start(t); osc.stop(t + dur);
        } catch(e) {}
    }
    /* Individual sound functions */
    function _sndMove() {
        _tone(300, 0.055, 0.18, 'sine', 240);
    }
    function _sndRotate() {
        _tone(500, 0.07, 0.24, 'sine', 660);
    }
    function _sndLock() {
        _tone(160, 0.10, 0.38, 'square', 95);
        setTimeout(function(){ _tone(90, 0.1, 0.25, 'sine', 60); }, 60);
    }
    function _sndHardDrop() {
        _tone(220, 0.07, 0.4, 'square', 110);
        setTimeout(function(){ _tone(100, 0.15, 0.45, 'square', 55); }, 65);
    }
    function _sndClear(n) {
        var freqs=[523,659,784,1047];
        for (var i=0; i<n&&i<4; i++) {
            (function(d,f){ setTimeout(function(){ _tone(f,0.12,0.42); },d); })(i*80, freqs[i]);
        }
        if (n>=4) {
            /* TETRIS fanfare */
            setTimeout(function(){
                _tone(1047,0.07,0.5);
                setTimeout(function(){ _tone(1319,0.07,0.5); },70);
                setTimeout(function(){ _tone(1568,0.22,0.5,'sine',1760); },140);
            }, 360);
        }
    }
    function _sndLevelUp() {
        [523,659,784,1047,1319].forEach(function(f,i){
            setTimeout(function(){ _tone(f,0.1,0.38); },i*90);
        });
    }
    function _sndGameOver() {
        [440,370,294,220].forEach(function(f,i){
            setTimeout(function(){ _tone(f,0.22,0.4,'sine',f*0.52); },i*210);
        });
    }

    /* ── Voice Announcements disabled ── */
    function _voice() {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }

    /* ─────────────────────────────────────────
       SHOW ARENA (replaces what _origStartGame did)
    ───────────────────────────────────────── */
    function showArena(gameId) {
        var arena = document.getElementById('game-arena');
        if (arena) {
            arena.style.display = 'block';
            setTimeout(function(){
                arena.scrollIntoView({ behavior:'smooth', block:'start' });
            }, 50);
        }
        document.querySelectorAll('.game-area').forEach(function(el){
            el.classList.add('hidden');
        });
        var el = document.getElementById(gameId + '-game');
        if (el) el.classList.remove('hidden');
    }

    /* ─────────────────────────────────────────
       INIT (show start screen)
    ───────────────────────────────────────── */
    function initTetris() {
        /* Kill ALL old loops by bumping version */
        LOOP_VERSION++;

        var st = gameState.tetris;
        grabCanvases(st);
        if (!st.canvas) { console.error('[Tetris v3] canvas missing'); return; }

        resizeCanvas(st);
        setEl('tetris-score','0'); setEl('tetris-level','1');
        setEl('tetris-lines','0'); setEl('tetris-high', st.highScore);
        showEl('tetris-start-btn','inline-block');
        showEl('tetris-pause-btn','none');
        showEl('tetris-mobile-controls','none');
        setupCanvasGestures(st);
        drawStartScreen(st);
    }

    /* ─────────────────────────────────────────
       START GAME
    ───────────────────────────────────────── */
    function startTetris() {
        _initAudio();
        _getAC(); /* init Tetris AudioContext on user gesture */
        if (_TAC && _TAC.state==='suspended') _TAC.resume().catch(function(){});

        /* Bump version -> every old RAF loop
           checks this and self-terminates      */
        LOOP_VERSION++;
        var myVer = LOOP_VERSION;

        var st = gameState.tetris;
        st.myVersion = myVer;

        /* Remove leftover overlay */
        var ov = document.querySelector('.tetris-gameover');
        if (ov) ov.remove();

        grabCanvases(st);
        if (!st.canvas) return;

        /* Show bottom control bar on mobile */
        if (window.innerWidth <= 768) {
            var bar = document.getElementById('tetris-bottom-bar');
            if (bar) bar.classList.add('visible');
        }

        resizeCanvas(st);

        /* Fresh board */
        st.board = [];
        for (var r = 0; r < st.rows; r++)
            st.board.push(new Array(st.cols).fill(null));

        st.score=0; st.level=1; st.lines=0; st.combo=0;
        st.isRunning=true; st.isPaused=false; st.isGameOver=false;
        st.canHold=true; st.holdPiece=null;
        st.dropInterval=1000; st.bag=[];

        setEl('tetris-score','0'); setEl('tetris-level','1'); setEl('tetris-lines','0');
        showEl('tetris-start-btn','none');
        showEl('tetris-pause-btn','inline-block');

        var pb = document.getElementById('tetris-pause-btn');
        if (pb) { pb.textContent='Pause'; pb.classList.remove('paused'); }

        clearHoldCanvas(st);

        st.nextPiece = makeNextPiece(st);
        spawnPiece(st);
        st.lastDrop = performance.now();

        /* ── The ONE true game loop ── */
        requestAnimationFrame(function loop(ts) {
            /* Version mismatch -> this loop is stale, die silently */
            if (LOOP_VERSION !== myVer) return;

            var s = gameState.tetris;
            if (!s.isRunning || s.isGameOver) return;

            if (!s.isPaused) {
                /* DAS – hold left/right for auto-repeat */
                if (!s.clearingRows) {
                    if (_dasLeft>0 && ts-_dasLeft>DAS_DELAY && ts-_dasLeftLast>DAS_INTERVAL) {
                        movePiece(-1,0); _dasLeftLast=ts;
                    }
                    if (_dasRight>0 && ts-_dasRight>DAS_DELAY && ts-_dasRightLast>DAS_INTERVAL) {
                        movePiece(1,0); _dasRightLast=ts;
                    }
                    if (ts - s.lastDrop >= s.dropInterval) {
                        if (!movePiece(0,1)) lockPiece(s);
                        s.lastDrop = ts;
                    }
                }
                drawBoard(s);
            }

            requestAnimationFrame(loop);
        });

        _toast('Tetris! WASD or Arrow Keys 🧩','info');
    }

    /* ─────────────────────────────────────────
       LOCK PIECE  <- line clearing lives here
    ───────────────────────────────────────── */
    function lockPiece(st) {
        if (!st || !st.currentPiece) return;
        var piece = st.currentPiece;

        /* Stamp onto board */
        for (var r = 0; r < piece.shape.length; r++) {
            for (var c = 0; c < piece.shape[r].length; c++) {
                if (!piece.shape[r][c]) continue;
                var br = piece.y + r, bc = piece.x + c;
                if (br >= 0 && br < st.rows && bc >= 0 && bc < st.cols) {
                    st.board[br][bc] = PIECES[piece.type].color;
                }
            }
        }
        st.currentPiece = null;
        _sndLock();

        /* Find full rows */
        var fullRows = [];
        for (var row = 0; row < st.rows; row++) {
            var full = true;
            for (var col = 0; col < st.cols; col++) {
                if (!st.board[row][col]) { full = false; break; }
            }
            if (full) fullRows.push(row);
        }

        if (fullRows.length > 0) {
            /* Flash rows + spawn particles, then clear after delay */
            st.clearingRows = fullRows;
            fullRows.forEach(function(ri){ spawnRowParticles(st, ri); });
            var snapVer = LOOP_VERSION;
            setTimeout(function(){
                if (!st.isRunning || LOOP_VERSION !== snapVer) return;
                st.clearingRows = null;
                finishLineClear(st, clearFullRows(st));
            }, 220);
        } else {
            st.combo = 0;
            st.lastDrop = performance.now();
            spawnPiece(st);
        }
    }

    function spawnRowParticles(st, rowIdx) {
        var cs = st.cellSize;
        for (var col = 0; col < st.cols; col++) {
            if (!st.board[rowIdx][col]) continue;
            var color = st.board[rowIdx][col];
            for (var k = 0; k < 4; k++) {
                st.particles.push({
                    x:(col+0.5)*cs, y:(rowIdx+0.5)*cs,
                    vx:(Math.random()-0.5)*6,
                    vy:(Math.random()-0.5)*6-1.5,
                    life:1,
                    decay:0.04+Math.random()*0.04,
                    size:2+Math.random()*3,
                    color:color
                });
            }
        }
    }

    function finishLineClear(st, count) {
        if (count <= 0) { st.combo=0; st.lastDrop=performance.now(); spawnPiece(st); return; }
        st.combo++;
        st.lines += count;

        var scoreTable = [0,100,300,500,800];
        var pts = (scoreTable[count] || 800) * st.level;
        if (st.combo > 1) pts += 50 * (st.combo-1) * st.level;
        st.score += pts;

        var leveledUp = false;
        var newLv = Math.floor(st.lines/10)+1;
        if (newLv > st.level) {
            st.level = newLv;
            st.dropInterval = Math.max(80, 1000 - (st.level-1)*80);
            leveledUp = true;
            _toast('Level '+st.level+'! 🚀','warning');
        }

        setElAnimated('tetris-score', st.score);
        setEl('tetris-level', st.level);
        setEl('tetris-lines', st.lines);

        /* Sound: level-up fanfare overrides line-clear jingle */
        if (leveledUp) { _sndLevelUp(); } else { _sndClear(count); }

        /* Voice announcement */
        var voiceLines = ['','Single','Double','Triple','TETRIS!'];
        var vText = voiceLines[count] || 'TETRIS!';
        if (leveledUp) {
            setTimeout(function(){ _voice('Level '+st.level, 1.3, 1.0); }, 420);
        } else {
            _voice(vText, count>=4 ? 1.6 : 1.2, count>=4 ? 0.85 : 1.1);
        }

        var msgs=['','Single!','Double!','Triple! 🔥','TETRIS! 💎'];
        var lbl = msgs[count] || 'TETRIS! 💎';
        _toast(lbl+' +'+pts, count>=4?'success':'info');
        if (count >= 4) _confetti();
        if (st.combo > 1) _toast('Combo x'+st.combo+'! 🔥','warning');

        flashBoard();
        st.lastDrop = performance.now();
        spawnPiece(st);
    }

    /* ─────────────────────────────────────────
       CLEAR FULL ROWS — guaranteed synchronous
       Scans bottom-up so row indices stay valid
       after each splice.
    ───────────────────────────────────────── */
    function clearFullRows(st) {
        var cleared = 0;
        var r = st.rows - 1;
        while (r >= 0) {
            var full = true;
            for (var c = 0; c < st.cols; c++) {
                if (!st.board[r][c]) { full = false; break; }
            }
            if (full) {
                st.board.splice(r, 1);
                st.board.unshift(new Array(st.cols).fill(null));
                cleared++;
                /* stay on same r — the row above dropped down */
            } else {
                r--;
            }
        }
        return cleared;
    }

    /* ─────────────────────────────────────────
       PIECE HELPERS
    ───────────────────────────────────────── */
    function makeNextPiece(st) {
        if (!st.bag || st.bag.length === 0) {
            st.bag = PTYPES.slice();
            for (var i = st.bag.length-1; i > 0; i--) {
                var j = Math.floor(Math.random()*(i+1));
                var t = st.bag[i]; st.bag[i]=st.bag[j]; st.bag[j]=t;
            }
        }
        var type = st.bag.pop();
        return {
            type: type,
            shape: PIECES[type].shape.map(function(row){ return row.slice(); }),
            x: Math.floor((st.cols - PIECES[type].shape[0].length) / 2),
            y: 0
        };
    }

    function spawnPiece(st) {
        if (!st.nextPiece) st.nextPiece = makeNextPiece(st);
        st.currentPiece = st.nextPiece;
        st.nextPiece    = makeNextPiece(st);
        st.canHold      = true;
        drawNextPiece(st);
        calcGhost(st);
        if (collision(st, st.currentPiece)) gameOver(st);
    }

    function collision(st, piece, board) {
        board = board || st.board;
        for (var r = 0; r < piece.shape.length; r++) {
            for (var c = 0; c < piece.shape[r].length; c++) {
                if (!piece.shape[r][c]) continue;
                var nr = piece.y+r, nc = piece.x+c;
                if (nc < 0 || nc >= st.cols || nr >= st.rows) return true;
                if (nr >= 0 && board[nr][nc]) return true;
            }
        }
        return false;
    }

    function movePiece(dx, dy) {
        var st = gameState.tetris;
        if (!st || !st.currentPiece) return false;
        st.currentPiece.x += dx;
        st.currentPiece.y += dy;
        if (collision(st, st.currentPiece)) {
            st.currentPiece.x -= dx;
            st.currentPiece.y -= dy;
            return false;
        }
        if (dx !== 0) { calcGhost(st); _sndMove(); }
        return true;
    }

    function rotateCW(st)  { if (st && st.currentPiece) applyRot(st, _rotateCW(st.currentPiece.shape)); }
    function rotateCCW(st) { if (st && st.currentPiece) applyRot(st, _rotateCCW(st.currentPiece.shape)); }

    function _rotateCW(s) {
        return Array.from({length:s[0].length},function(_,c){
            return Array.from({length:s.length},function(_,r){ return s[s.length-1-r][c]; });
        });
    }
    function _rotateCCW(s) {
        return Array.from({length:s[0].length},function(_,c){
            return Array.from({length:s.length},function(_,r){ return s[r][s[0].length-1-c]; });
        });
    }

    function applyRot(st, ns) {
        var p=st.currentPiece, os=p.shape, ox=p.x;
        p.shape=ns;
        var kicks=[0,-1,1,-2,2];
        for (var i=0;i<kicks.length;i++) {
            p.x=ox+kicks[i];
            if (!collision(st,p)) { calcGhost(st); _sndRotate(); return; }
        }
        p.shape=os; p.x=ox;
    }

    function hardDrop() {
        var st=gameState.tetris;
        if (!st||!st.currentPiece) return;
        while (movePiece(0,1)) {}
        lockPiece(st);
        _sndHardDrop();
    }

    function calcGhost(st) {
        if (!st||!st.currentPiece) return;
        var g={shape:st.currentPiece.shape.map(function(r){return r.slice();}),
               x:st.currentPiece.x, y:st.currentPiece.y, type:st.currentPiece.type};
        while(true){ g.y++; if(collision(st,g)){g.y--;break;} }
        st.ghostY=g.y;
    }

    function holdPiece() {
        var st=gameState.tetris;
        if (!st||!st.canHold||!st.currentPiece) return;
        var cur=st.currentPiece.type;
        if (st.holdPiece) {
            var hp=st.holdPiece; st.holdPiece=cur;
            st.currentPiece={type:hp,
                shape:PIECES[hp].shape.map(function(r){return r.slice();}),
                x:Math.floor((st.cols-PIECES[hp].shape[0].length)/2), y:0};
        } else {
            st.holdPiece=cur;
            st.currentPiece=st.nextPiece;
            st.nextPiece=makeNextPiece(st);
            drawNextPiece(st);
        }
        st.canHold=false;
        calcGhost(st); drawHoldPiece(st);
        if (collision(st,st.currentPiece)) { gameOver(st); return; }
        _toast('Held! 📦','info');
    }

    /* ─────────────────────────────────────────
       DRAWING
    ───────────────────────────────────────── */
    function drawBoard(st) {
        var ctx=st.ctx, cs=st.cellSize;
        if (!ctx||!st.canvas) return;

        ctx.fillStyle='#0a0a1a';
        ctx.fillRect(0,0,st.canvas.width,st.canvas.height);

        ctx.strokeStyle='rgba(102,126,234,0.07)'; ctx.lineWidth=0.5;
        for (var r=0;r<=st.rows;r++){
            ctx.beginPath();ctx.moveTo(0,r*cs);ctx.lineTo(st.canvas.width,r*cs);ctx.stroke();
        }
        for (var c=0;c<=st.cols;c++){
            ctx.beginPath();ctx.moveTo(c*cs,0);ctx.lineTo(c*cs,st.canvas.height);ctx.stroke();
        }

        for (var row=0;row<st.rows;row++){
            for (var col=0;col<st.cols;col++){
                if (st.board[row][col]) drawCell(ctx,col*cs,row*cs,cs,st.board[row][col]);
            }
        }

        if (!st.currentPiece) {
            /* Particles still render without active piece */
            drawParticles(ctx, st);
            return;
        }
        var piece=st.currentPiece;

        /* Ghost – outline style */
        ctx.globalAlpha=0.45;
        ctx.strokeStyle=PIECES[piece.type].color;
        ctx.lineWidth=2;
        for (var gr=0;gr<piece.shape.length;gr++){
            for (var gc=0;gc<piece.shape[gr].length;gc++){
                if (!piece.shape[gr][gc]) continue;
                ctx.strokeRect((piece.x+gc)*cs+2,(st.ghostY+gr)*cs+2,cs-4,cs-4);
            }
        }
        ctx.globalAlpha=1;

        /* Active piece */
        for (var pr=0;pr<piece.shape.length;pr++){
            for (var pc=0;pc<piece.shape[pr].length;pc++){
                if (!piece.shape[pr][pc]) continue;
                var px=(piece.x+pc)*cs, py=(piece.y+pr)*cs;
                if (py>=-cs) drawCell(ctx,px,py,cs,PIECES[piece.type].color);
            }
        }

        /* Clearing-row flash overlay */
        if (st.clearingRows && st.clearingRows.length>0) {
            var flashAlpha=0.5+0.5*Math.sin(Date.now()*0.035);
            ctx.fillStyle='rgba(255,255,255,'+flashAlpha+')';
            st.clearingRows.forEach(function(row){
                ctx.fillRect(0, row*cs, st.cols*cs, cs);
            });
        }

        drawParticles(ctx, st);
    }

    function drawParticles(ctx, st) {
        if (!st.particles || !st.particles.length) return;
        for (var pi=st.particles.length-1; pi>=0; pi--) {
            var p=st.particles[pi];
            p.x+=p.vx; p.y+=p.vy; p.vy+=0.15;
            p.life-=p.decay;
            if (p.life<=0) { st.particles.splice(pi,1); continue; }
            ctx.globalAlpha=p.life;
            ctx.fillStyle=p.color;
            ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size);
        }
        ctx.globalAlpha=1;
    }

    function rrect(ctx,x,y,w,h,r){
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.lineTo(x+w-r,y);
        ctx.arcTo(x+w,y,x+w,y+r,r);
        ctx.lineTo(x+w,y+h-r);
        ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
        ctx.lineTo(x+r,y+h);
        ctx.arcTo(x,y+h,x,y+h-r,r);
        ctx.lineTo(x,y+r);
        ctx.arcTo(x,y,x+r,y,r);
        ctx.closePath();
    }

    function drawCell(ctx,x,y,size,color){
        var def=Object.values(PIECES).find(function(p){return p.color===color;});
        var shadow=def?def.shadow:'#333';
        var pad=1, r=Math.max(2,Math.floor(size*0.18));
        var ix=x+pad, iy=y+pad, iw=size-pad*2, ih=size-pad*2;
        var g=ctx.createLinearGradient(ix,iy,ix+iw,iy+ih);
        g.addColorStop(0,color); g.addColorStop(1,shadow);
        rrect(ctx,ix,iy,iw,ih,r); ctx.fillStyle=g; ctx.fill();
        /* top shine */
        rrect(ctx,ix+2,iy+2,iw-4,Math.floor(ih*0.32),r);
        ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.fill();
        /* border */
        rrect(ctx,ix,iy,iw,ih,r);
        ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1; ctx.stroke();
    }

    function drawNextPiece(st) {
        var ctx=st.nextCtx,canvas=st.nextCanvas;
        if (!ctx||!st.nextPiece) return;
        ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,canvas.width,canvas.height);
        var p=st.nextPiece;
        var cs=Math.min(
            Math.floor(canvas.width/(p.shape[0].length+2)),
            Math.floor(canvas.height/(p.shape.length+2)));
        var ox=Math.floor((canvas.width-p.shape[0].length*cs)/2);
        var oy=Math.floor((canvas.height-p.shape.length*cs)/2);
        for (var r=0;r<p.shape.length;r++)
            for (var c=0;c<p.shape[r].length;c++)
                if (p.shape[r][c]) drawCell(ctx,ox+c*cs,oy+r*cs,cs,PIECES[p.type].color);
    }

    function drawHoldPiece(st) {
        var ctx=st.holdCtx,canvas=st.holdCanvas;
        if (!ctx) return;
        ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,canvas.width,canvas.height);
        if (!st.holdPiece) return;
        var def=PIECES[st.holdPiece];
        var cs=Math.min(
            Math.floor(canvas.width/(def.shape[0].length+2)),
            Math.floor(canvas.height/(def.shape.length+2)));
        var ox=Math.floor((canvas.width-def.shape[0].length*cs)/2);
        var oy=Math.floor((canvas.height-def.shape.length*cs)/2);
        ctx.globalAlpha=st.canHold?1:0.4;
        for (var r=0;r<def.shape.length;r++)
            for (var c=0;c<def.shape[r].length;c++)
                if (def.shape[r][c]) drawCell(ctx,ox+c*cs,oy+r*cs,cs,def.color);
        ctx.globalAlpha=1;
    }

    function drawStartScreen(st) {
        var ctx=st.ctx,canvas=st.canvas,cs=st.cellSize;
        if (!ctx) return;
        ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,canvas.width,canvas.height);
        var colors=PTYPES.map(function(k){return PIECES[k].color;});
        ctx.globalAlpha=0.18;
        for (var i=0;i<20;i++)
            drawCell(ctx,
                Math.floor(Math.random()*st.cols)*cs,
                Math.floor(Math.random()*st.rows)*cs,
                cs,colors[i%colors.length]);
        ctx.globalAlpha=1;
        var fs=Math.max(16,cs);
        ctx.textAlign='center';
        ctx.font='bold '+fs+'px Segoe UI,sans-serif';
        ctx.fillStyle='#ffd700'; ctx.shadowColor='#ffd700'; ctx.shadowBlur=15;
        ctx.fillText('TETRIS',canvas.width/2,canvas.height/2-20);
        ctx.shadowBlur=0;
        var sf=Math.max(10,Math.floor(cs*0.55));
        ctx.font=sf+'px Segoe UI,sans-serif';
        ctx.fillStyle='rgba(255,255,255,0.6)';
        ctx.fillText('Press Start to Play',canvas.width/2,canvas.height/2+15);
        ctx.fillStyle='rgba(255,215,0,0.65)';
        ctx.fillText('WASD or Arrow Keys',canvas.width/2,canvas.height/2+38);
        if (st.highScore>0){
            ctx.fillStyle='#ffd700';
            ctx.font='bold '+Math.max(10,Math.floor(cs*0.48))+'px Segoe UI,sans-serif';
            ctx.fillText('Best: '+st.highScore,canvas.width/2,canvas.height/2+62);
        }
    }

    /* ─────────────────────────────────────────
       PAUSE
    ───────────────────────────────────────── */
    function togglePauseTetris() {
        var st=gameState.tetris;
        if (!st||!st.isRunning||st.isGameOver) return;
        st.isPaused=!st.isPaused;
        var btn=document.getElementById('tetris-pause-btn');
        if (st.isPaused) {
            if (btn){btn.textContent='Resume';btn.classList.add('paused');}
            drawBoard(st);
            var ctx=st.ctx,canvas=st.canvas,cs=st.cellSize;
            ctx.fillStyle='rgba(0,0,0,0.65)';
            ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.textAlign='center';
            ctx.font='bold '+cs+'px Segoe UI,sans-serif';
            ctx.fillStyle='#ffd700'; ctx.shadowColor='#ffd700'; ctx.shadowBlur=15;
            ctx.fillText('PAUSED',canvas.width/2,canvas.height/2);
            ctx.shadowBlur=0;
            _toast('Paused','warning');
        } else {
            if (btn){btn.textContent='Pause';btn.classList.remove('paused');}
            st.lastDrop=performance.now();
            _toast('Resumed','info');
        }
    }

    /* ─────────────────────────────────────────
       GAME OVER
    ───────────────────────────────────────── */
    function gameOver(st) {
        st.isRunning=false; st.isGameOver=true;
        LOOP_VERSION++; /* kill the loop */
        _sndGameOver();
        setTimeout(function(){ _voice('Game over', 0.75, 0.88); }, 450);

        var best=false;
        if (st.score>st.highScore){
            st.highScore=st.score;
            localStorage.setItem('tetrisHigh',st.highScore);
            setEl('tetris-high',st.highScore);
            best=true;
        }
        if (st.score>0) _saveScore('tetris',st.score);

        showEl('tetris-start-btn','inline-block');
        var sb=document.getElementById('tetris-start-btn');
        if (sb) sb.textContent='Play Again';
        showEl('tetris-pause-btn','none');
        /* Hide bottom control bar on game over */
        var bar2 = document.getElementById('tetris-bottom-bar');
        if (bar2) bar2.classList.remove('visible');

        setTimeout(function(){ showGameOverOverlay(st,best); },300);

        if (best){ _confetti(); _toast('New Best: '+st.score+'! 🏆','success'); }
        else _toast('Game Over! Score: '+st.score,'error');
    }

    function showGameOverOverlay(st,best) {
        var ex=document.querySelector('.tetris-gameover'); if(ex) ex.remove();
        var el=document.createElement('div');
        el.className='tetris-gameover';
        el.innerHTML='<div class="tetris-gameover-content">'+
            '<h3>💎 Game Over!</h3>'+
            '<div class="final-score">'+st.score.toLocaleString()+'</div>'+
            (best?'<div class="new-best">🏆 NEW BEST! 🏆</div>':'')+
            '<p style="opacity:.7">Best: '+st.highScore.toLocaleString()+'</p>'+
            '<div style="display:flex;justify-content:center;gap:25px;margin:15px 0;flex-wrap:wrap">'+
            '<div style="text-align:center"><div style="font-size:.85rem;opacity:.6">Lines</div>'+
            '<div style="font-size:1.4rem;font-weight:bold;color:var(--primary)">'+st.lines+'</div></div>'+
            '<div style="text-align:center"><div style="font-size:.85rem;opacity:.6">Level</div>'+
            '<div style="font-size:1.4rem;font-weight:bold;color:var(--accent)">'+st.level+'</div></div>'+
            '</div>'+
            '<button class="restart-btn" onclick="closeTetrisGameOver()">'+
            '<i class="fas fa-redo"></i> Play Again</button>'+
            '<p style="opacity:.4;font-size:.8rem;margin-top:10px">Press R to restart</p>'+
            '</div>';
        document.body.appendChild(el);
        el.addEventListener('click',function(e){ if(e.target===el) closeTetrisGameOver(); });
    }

    function closeTetrisGameOver() {
        var ov=document.querySelector('.tetris-gameover'); if(ov) ov.remove();
        var st=gameState.tetris;
        st.isRunning=false; st.isGameOver=false;
        LOOP_VERSION++;
        showEl('tetris-start-btn','inline-block');
        var sb=document.getElementById('tetris-start-btn');
        if (sb) sb.textContent='Start Game';
        grabCanvases(st);
        resizeCanvas(st);
        drawStartScreen(st);
    }

    /* ─────────────────────────────────────────
       MOBILE CONTROLS
    ───────────────────────────────────────── */
    function tetrisMobileAction(action) {
        var st=gameState.tetris;
        if (!st||!st.isRunning||st.isPaused) return;
        switch(action){
            case 'left':      movePiece(-1,0); break;
            case 'right':     movePiece(1,0);  break;
            case 'down':
                if (!movePiece(0,1)) lockPiece(st);
                st.lastDrop=performance.now(); break;
            case 'rotate':    rotateCW(st);    break;
            case 'rotateLeft':rotateCCW(st);   break;
            case 'hardDrop':  hardDrop();      break;
            case 'hold':      holdPiece();     break;
        }
    }

    /* ─────────────────────────────────────────
       KEYBOARD
    ───────────────────────────────────────── */
    function onKey(e) {
        if (typeof gameState==='undefined') return;
        if (gameState.currentGame!=='tetris') return;
        var st=gameState.tetris;
        if (!st||!st.isRunning) return;

        var handled=true;
        switch(e.key){
            case 'ArrowLeft': case 'a': case 'A':
                if (!_dasLeft) { _dasLeft=performance.now(); _dasLeftLast=0; }
                movePiece(-1,0); break;
            case 'ArrowRight':case 'd': case 'D':
                if (!_dasRight) { _dasRight=performance.now(); _dasRightLast=0; }
                movePiece(1,0); break;
            case 'ArrowUp':   case 'w': case 'W': rotateCW(st);    break;
            case 'z': case 'Z':                   rotateCCW(st);   break;
            case 'ArrowDown': case 's': case 'S':
                if (!movePiece(0,1)) lockPiece(st);
                st.lastDrop=performance.now(); break;
            case ' ':  hardDrop();           break;
            case 'c': case 'C': holdPiece(); break;
            case 'p': case 'P': togglePauseTetris(); break;
            case 'r': case 'R':
                if (st.isGameOver) closeTetrisGameOver(); break;
            default: handled=false;
        }
        if (handled && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].indexOf(e.key)!==-1)
            e.preventDefault();
    }

    /* ─────────────────────────────────────────
       HELPERS
    ───────────────────────────────────────── */
    function grabCanvases(st) {
        st.canvas     = document.getElementById('tetris-canvas');
        st.nextCanvas = document.getElementById('tetris-next-canvas');
        st.holdCanvas = document.getElementById('tetris-hold-canvas');
        if (st.canvas)     st.ctx     = st.canvas.getContext('2d');
        if (st.nextCanvas) st.nextCtx = st.nextCanvas.getContext('2d');
        if (st.holdCanvas) st.holdCtx = st.holdCanvas.getContext('2d');
    }

    function resizeCanvas(st) {
        if (!st.canvas) return;
        var isMobile = window.innerWidth <= 768;
        var maxW = isMobile
            ? Math.min(window.innerWidth - 20, 340)
            : Math.min(300, window.innerWidth - 200);
        var maxH = window.innerHeight * (isMobile ? 0.60 : 0.75);
        var byCols = Math.floor(maxW / st.cols);
        var byRows = Math.floor(maxH / st.rows);
        st.cellSize = Math.max(22, Math.min(byCols, byRows));
        st.canvas.width  = st.cols  * st.cellSize;
        st.canvas.height = st.rows  * st.cellSize;
        if (st.nextCanvas){st.nextCanvas.width=120;st.nextCanvas.height=120;}
        if (st.holdCanvas){st.holdCanvas.width=120;st.holdCanvas.height=120;}
    }

    function clearHoldCanvas(st) {
        if (st.holdCtx&&st.holdCanvas){
            st.holdCtx.fillStyle='#0a0a1a';
            st.holdCtx.fillRect(0,0,st.holdCanvas.width,st.holdCanvas.height);
        }
    }

    function flashBoard() {
        var w=document.querySelector('.tetris-board-wrapper');
        if (!w) return;
        var f=document.createElement('div');
        f.className='tetris-line-flash';
        w.appendChild(f);
        setTimeout(function(){ if(f.parentNode) f.remove(); },280);
    }

    function setEl(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; }
    function showEl(id,d){ var e=document.getElementById(id); if(e) e.style.display=d; }

    function setElAnimated(id,v) {
        var e=document.getElementById(id); if(!e) return;
        e.textContent=v;
        e.classList.remove('tetris-score-pop');
        void e.offsetWidth;
        e.classList.add('tetris-score-pop');
    }

    function setupCanvasGestures(st) {
        if (_canvasGesturesAdded || !st.canvas) return;
        _canvasGesturesAdded = true;
        st.canvas.addEventListener('touchstart', function(e){
            if (!gameState.tetris||!gameState.tetris.isRunning) return;
            e.preventDefault();
            var t=e.touches[0];
            gameState.tetris._swipeStart={x:t.clientX,y:t.clientY,t:Date.now()};
        }, {passive:false});
        st.canvas.addEventListener('touchend', function(e){
            var s=gameState.tetris;
            if (!s||!s.isRunning||!s._swipeStart) return;
            var t=e.changedTouches[0];
            var dx=t.clientX-s._swipeStart.x;
            var dy=t.clientY-s._swipeStart.y;
            var dt=Date.now()-s._swipeStart.t;
            s._swipeStart=null;
            if (dt>600) return;
            var adx=Math.abs(dx), ady=Math.abs(dy);
            if (adx<15&&ady<15) { tetrisMobileAction('rotate'); return; }
            if (adx>ady) {
                tetrisMobileAction(dx>0?'right':'left');
            } else if (dy>0) {
                tetrisMobileAction(ady>70?'hardDrop':'down');
            } else {
                tetrisMobileAction('hold');
            }
        }, {passive:false});
    }

    /* ─────────────────────────────────────────
       BOOT
    ───────────────────────────────────────── */
    if (document.readyState==='loading') {
        document.addEventListener('DOMContentLoaded',function(){ waitForGameState(patchTetris); });
    } else {
        waitForGameState(patchTetris);
    }

})();

/* ── Tetris control popup toggle (global) ── */
function toggleTetrisCtrl() {
    var popup = document.getElementById('tetris-ctrl-popup');
    var fab   = document.getElementById('tetris-ctrl-fab');
    if (!popup) return;
    var isOpen = popup.classList.toggle('open');
    if (fab) fab.textContent = isOpen ? '✕' : '🎮';
}