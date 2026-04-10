/* ============================================
   PACMAN GAME - NEON ARCADE UPGRADE
   ============================================ */

if (!window._pacmanLoaded) {
window._pacmanLoaded = true;

// ─── MAZES (# wall, . dot, o power pellet, space = open) ──────────────────
var PACMAN_MAZES = {
    easy: [
        "###############",
        "#o...........o#",
        "#.###.###.###.#",
        "#.#...#.#...#.#",
        "#.#.#####.#.#.#",
        "#.............#",
        "#.#.#####.#.#.#",
        "#.#...#.#...#.#",
        "#.###.###.###.#",
        "#o...........o#",
        "###############"
    ],
    medium: [
        "#####################",
        "#o.................o#",
        "#.###.#.#####.#.###.#",
        "#.#...#...#...#...#.#",
        "#.#.#####.#.#####.#.#",
        "#...................#",
        "#.#.#####.#.#####.#.#",
        "#.#...#...#...#...#.#",
        "#.###.#.#####.#.###.#",
        "#o.................o#",
        "#####################"
    ],
    hard: [
        "#########################",
        "#o.....................o#",
        "#.###.###.#####.###.###.#",
        "#.#...#...#.#.#...#...#.#",
        "#.#.###.###.#.###.###.#.#",
        "#.......................#",
        "#.#.#.###########.#.#.#.#",
        "#.#.#...........#.#.#.#.#",
        "#.#.#.###########.#.#.#.#",
        "#.......................#",
        "#.#.###.###.#.###.###.#.#",
        "#.#...#...#.#.#...#...#.#",
        "#.###.###.#####.###.###.#",
        "#o.....................o#",
        "#########################"
    ]
};

// Ghost definitions: name, color, scatter target
var GHOST_DEFS = [
    { name:'Blinky', color:'#FF0000', eyeColor:'#FF9999', ai:'chase'   },
    { name:'Pinky',  color:'#FFB8FF', eyeColor:'#FF88FF', ai:'ahead'   },
    { name:'Inky',   color:'#00FFFF', eyeColor:'#88FFFF', ai:'random'  },
    { name:'Clyde',  color:'#FFB852', eyeColor:'#FFD890', ai:'patrol'  },
];

if (!window.gameState) window.gameState = {};
window.gameState.pacman = {
    canvas: null, ctx: null,
    board: [], player: { x:0, y:0, dir:'right', nextDir:'right', mouthAngle:0 },
    ghosts: [], dots: [], powerPellets: [],
    floatTexts: [],   // floating score popups
    score: 0, level: 1, lives: 3,
    difficulty: 'easy',
    gridSize: 15, cellSize: 30,
    gameLoop: null, isRunning: false, isGameOver: false, isPaused: false,
    highScore: parseInt(localStorage.getItem('pacmanHighScore')) || 0,
    frameCount: 0,
    ghostMode: 'scatter', powerMode: false, powerTimer: 0,
    dotsEaten: 0, totalDots: 0,
    ghostCombo: 0,       // combo multiplier for eating multiple ghosts
    moveFrame: 12,       // frames per move (decreases with level = faster)
    flashTimer: 0,
};

var ps = window.gameState.pacman;

// ─── KEYS ────────────────────────────────────────────────────────────────────
var PACMAN_KEY_MAP = {
    ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
    w:'up', W:'up', s:'down', S:'down', a:'left', A:'left', d:'right', D:'right'
};

function handlePacmanKeydown(e) {
    var arena = document.getElementById('pacman-game');
    if (!arena || arena.classList.contains('hidden')) return;
    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePausePacman(); return; }
    if (!ps.isRunning || ps.isPaused) return;
    var dir = PACMAN_KEY_MAP[e.key];
    if (dir) { e.preventDefault(); setPacmanDir(dir); }
}

function setPacmanDir(dir) {
    if (!ps.isRunning) return;
    var opp = { up:'down', down:'up', left:'right', right:'left' };
    if (opp[dir] !== ps.player.dir) ps.player.nextDir = dir;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initPacman() {
    ps = window.gameState.pacman;
    ps.canvas = document.getElementById('pacman-canvas');
    if (!ps.canvas) return;
    ps.ctx = ps.canvas.getContext('2d');

    var maxSize = Math.min(480, window.innerWidth - 40);
    ps.canvas.width = maxSize;
    ps.canvas.height = maxSize + 60; // extra space for bottom text

    syncScoreDisplay();
    updatePacmanLives();

    var startBtn = document.getElementById('pacman-start-btn');
    if (startBtn) startBtn.style.display = 'inline-block';

    document.removeEventListener('keydown', handlePacmanKeydown);
    document.addEventListener('keydown', handlePacmanKeydown);

    // Touch swipe
    var tx, ty;
    ps.canvas.addEventListener('touchstart', function(e) {
        e.preventDefault(); tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    }, {passive:false});
    ps.canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
        if (Math.abs(dx) > Math.abs(dy)) setPacmanDir(dx > 0 ? 'right' : 'left');
        else setPacmanDir(dy > 0 ? 'down' : 'up');
    }, {passive:false});

    drawPacmanStartScreen();
}

function changePacmanDifficulty() {
    var sel = document.getElementById('pacman-difficulty');
    if (sel) ps.difficulty = sel.value;
    if (!ps.isRunning) drawPacmanStartScreen();
}

// ─── START ────────────────────────────────────────────────────────────────────
function startPacman() {
    ps = window.gameState.pacman;
    if (!ps.canvas) { ps.canvas = document.getElementById('pacman-canvas'); ps.ctx = ps.canvas.getContext('2d'); }
    window.gameState.currentGame = 'pacman';
    if (typeof initGameAudio === 'function') initGameAudio();
    if (ps.gameLoop) { cancelAnimationFrame(ps.gameLoop); ps.gameLoop = null; }
    var ov = document.querySelector('.pacman-gameover');
    if (ov) ov.remove();

    var mazeTemplate = PACMAN_MAZES[ps.difficulty];
    ps.gridSize = mazeTemplate[0].length;
    var gameW = Math.min(480, window.innerWidth - 40);
    ps.canvas.width  = gameW;
    ps.canvas.height = gameW + 60;
    ps.cellSize = gameW / ps.gridSize;

    createPacmanBoard(mazeTemplate);
    spawnEntities();

    ps.score = 0; ps.dotsEaten = 0; ps.level = 1; ps.lives = 3;
    ps.isRunning = true; ps.isGameOver = false; ps.isPaused = false;
    ps.ghostMode = 'scatter'; ps.powerMode = false; ps.powerTimer = 0;
    ps.frameCount = 0; ps.ghostCombo = 0; ps.floatTexts = [];
    ps.moveFrame = 14;  // easy start speed

    syncScoreDisplay();
    updatePacmanLives();
    document.getElementById('pacman-start-btn').style.display = 'none';
    var dpad = document.getElementById('pacman-dpad');
    if (dpad) dpad.style.display = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'flex' : 'none';
    document.removeEventListener('keydown', handlePacmanKeydown);
    document.addEventListener('keydown', handlePacmanKeydown);

    ps.gameLoop = requestAnimationFrame(updatePacman);
    if (typeof showToast === 'function') showToast('🕹️ Pacman! Swipe or use D-Pad!', 'info');
}

function spawnEntities() {
    ps.player.x = 1; ps.player.y = 1;
    ps.player.dir = 'right'; ps.player.nextDir = 'right'; ps.player.mouthAngle = 0;

    ps.ghosts = [];
    var cx = Math.floor(ps.gridSize / 2), cy = Math.floor(ps.board.length / 2);
    GHOST_DEFS.forEach(function(def, i) {
        var gx = cx + (i < 2 ? -1 + i : -1 + (i-2));
        var gy = cy + (i < 2 ? 0 : 1);
        ps.ghosts.push({
            x: gx, y: gy,
            dir: ['right','left','up','down'][i],
            color: def.color, eyeColor: def.eyeColor,
            name: def.name, ai: def.ai,
            scared: false, inJail: false, jailTimer: 0,
            prevPos: {x: gx, y: gy}, dirHistory: []
        });
    });
}

function createPacmanBoard(template) {
    ps.board = []; ps.dots = []; ps.powerPellets = [];
    for (var y = 0; y < template.length; y++) {
        var row = [];
        for (var x = 0; x < template[y].length; x++) {
            var ch = template[y][x];
            row.push(ch === '#' ? 1 : 0);
            if (ch === '.') ps.dots.push({x:x, y:y});
            else if (ch === 'o') ps.powerPellets.push({x:x, y:y});
        }
        ps.board.push(row);
    }
    ps.totalDots = ps.dots.length + ps.powerPellets.length;
}

// ─── PAUSE ─────────────────────────────────────────────────────────────────────
function togglePausePacman() {
    if (!ps.isRunning || ps.isGameOver) return;
    ps.isPaused = !ps.isPaused;
    if (ps.isPaused) {
        cancelAnimationFrame(ps.gameLoop); ps.gameLoop = null;
        drawPacmanFrame();
        var ctx = ps.ctx, cw = ps.canvas.width, ch = ps.canvas.height;
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, cw, ch);
        ctx.textAlign = 'center';
        ctx.font = "bold 44px 'Segoe UI',sans-serif";
        ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 30;
        ctx.fillText('⏸ PAUSED', cw/2, ch/2 - 15);
        ctx.shadowBlur = 0;
        ctx.font = "16px 'Segoe UI',sans-serif"; ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('Press P to Resume', cw/2, ch/2 + 25);
    } else {
        ps.gameLoop = requestAnimationFrame(updatePacman);
    }
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────
function updatePacman() {
    if (!ps.isRunning || ps.isPaused) return;
    ps.frameCount++;

    var speed = Math.max(6, ps.moveFrame - (ps.level - 1) * 1);
    if (ps.frameCount % speed === 0) updatePacmanPlayer();
    if (ps.frameCount % Math.max(8, speed + 2) === 0) updatePacmanGhosts();
    if (ps.frameCount % 300 === 0) ps.ghostMode = ps.ghostMode === 'scatter' ? 'chase' : 'scatter';

    if (ps.powerMode) {
        ps.powerTimer--;
        if (ps.powerTimer <= 0) {
            ps.powerMode = false;
            ps.ghostCombo = 0;
            ps.ghosts.forEach(function(g) { g.scared = false; });
        }
    }

    // Mouth animation
    ps.player.mouthAngle = Math.abs(Math.sin(ps.frameCount * 0.25)) * 0.35;

    // Age float texts
    ps.floatTexts = ps.floatTexts.filter(function(ft) { ft.life--; ft.y -= 0.8; return ft.life > 0; });

    drawPacmanFrame();
    ps.gameLoop = requestAnimationFrame(updatePacman);
}

// ─── PLAYER ──────────────────────────────────────────────────────────────────
function updatePacmanPlayer() {
    var p = ps.player;
    if (canMove(p.x, p.y, p.nextDir)) p.dir = p.nextDir;
    if (canMove(p.x, p.y, p.dir)) {
        if (p.dir==='up')    p.y--;
        if (p.dir==='down')  p.y++;
        if (p.dir==='left')  p.x--;
        if (p.dir==='right') p.x++;
    }
    // Tunnel wrap
    var cols = ps.board[0].length, rows = ps.board.length;
    if (p.x < 0) p.x = cols - 1; if (p.x >= cols) p.x = 0;
    if (p.y < 0) p.y = rows - 1; if (p.y >= rows) p.y = 0;

    // Eat dots
    for (var i = ps.dots.length - 1; i >= 0; i--) {
        if (ps.dots[i].x === p.x && ps.dots[i].y === p.y) {
            ps.dots.splice(i, 1); ps.score += 10; ps.dotsEaten++;
            addFloat('+10', p.x, p.y, '#ffff88');
            if (typeof playGameSound === 'function') playGameSound('eat', 0.1);
            checkLevelComplete(); break;
        }
    }
    // Eat power pellets
    for (var j = ps.powerPellets.length - 1; j >= 0; j--) {
        if (ps.powerPellets[j].x === p.x && ps.powerPellets[j].y === p.y) {
            ps.powerPellets.splice(j, 1); ps.score += 50; ps.dotsEaten++;
            ps.powerMode = true; ps.powerTimer = 220; ps.ghostCombo = 0;
            ps.ghosts.forEach(function(g) { if (!g.inJail) g.scared = true; });
            addFloat('POWER!', p.x, p.y, '#ff88ff');
            if (typeof playGameSound === 'function') playGameSound('powerup', 0.3);
            checkLevelComplete(); break;
        }
    }
    syncScoreDisplay();
}

function canMove(x, y, dir) {
    var nx = x, ny = y;
    if (dir==='up') ny--; if (dir==='down') ny++;
    if (dir==='left') nx--; if (dir==='right') nx++;
    var rows = ps.board.length, cols = ps.board[0].length;
    // Allow tunnel wrap
    nx = ((nx % cols) + cols) % cols;
    ny = ((ny % rows) + rows) % rows;
    return ps.board[ny][nx] === 0;
}

// ─── GHOSTS ───────────────────────────────────────────────────────────────────
function updatePacmanGhosts() {
    var dirs = ['up','down','left','right'];
    ps.ghosts.forEach(function(ghost) {
        if (ghost.inJail) {
            ghost.jailTimer--;
            if (ghost.jailTimer <= 0) {
                ghost.inJail = false;
                ghost.x = Math.floor(ps.gridSize/2);
                ghost.y = 1;
                ghost.scared = false;
            }
            return;
        }

        var validDirs = dirs.filter(function(d) { return canMove(ghost.x, ghost.y, d); });
        // Don't reverse unless stuck
        var opp = {up:'down',down:'up',left:'right',right:'left'};
        var nonReverse = validDirs.filter(function(d) { return d !== opp[ghost.dir]; });
        if (nonReverse.length > 0) validDirs = nonReverse;

        var chosen = ghost.dir;
        if (ghost.scared) {
            // Flee
            var best = validDirs.map(function(d) {
                var nx = ghost.x, ny = ghost.y;
                if (d==='up') ny--; if (d==='down') ny++;
                if (d==='left') nx--; if (d==='right') nx++;
                return {d:d, dist: Math.abs(nx-ps.player.x)+Math.abs(ny-ps.player.y)};
            });
            best.sort(function(a,b){return b.dist-a.dist;});
            chosen = best[0] ? best[0].d : validDirs[0];
        } else {
            switch (ghost.ai) {
                case 'chase':  // Blinky - direct chase
                    chosen = bestDir(ghost, ps.player.x, ps.player.y, validDirs);
                    break;
                case 'ahead':  // Pinky - targets ahead of Pacman
                    var tx = ps.player.x, ty = ps.player.y;
                    if (ps.player.dir==='up') ty -= 3;
                    if (ps.player.dir==='down') ty += 3;
                    if (ps.player.dir==='left') tx -= 3;
                    if (ps.player.dir==='right') tx += 3;
                    chosen = bestDir(ghost, tx, ty, validDirs);
                    break;
                case 'random': // Inky - mostly random but sometimes chases
                    if (Math.random() < 0.3) {
                        chosen = bestDir(ghost, ps.player.x, ps.player.y, validDirs);
                    } else {
                        chosen = validDirs[Math.floor(Math.random()*validDirs.length)];
                    }
                    break;
                case 'patrol': // Clyde - chases far, flees close
                    var dist = Math.abs(ghost.x-ps.player.x)+Math.abs(ghost.y-ps.player.y);
                    if (dist > 4) chosen = bestDir(ghost, ps.player.x, ps.player.y, validDirs);
                    else chosen = bestDir(ghost, 0, ps.board.length-1, validDirs); // flee to corner
                    break;
            }
        }

        ghost.dir = chosen || validDirs[0] || ghost.dir;
        if (ghost.dir==='up') ghost.y--;   if (ghost.dir==='down') ghost.y++;
        if (ghost.dir==='left') ghost.x--; if (ghost.dir==='right') ghost.x++;

        // Tunnel wrap
        var cols = ps.board[0].length, rows = ps.board.length;
        if (ghost.x < 0) ghost.x = cols-1; if (ghost.x >= cols) ghost.x = 0;
        if (ghost.y < 0) ghost.y = rows-1; if (ghost.y >= rows) ghost.y = 0;

        // Collision
        if (ghost.x === ps.player.x && ghost.y === ps.player.y) {
            if (ghost.scared) {
                ghost.inJail = true; ghost.jailTimer = 250;
                ghost.scared = false;
                ps.ghostCombo++;
                var pts = 200 * Math.pow(2, ps.ghostCombo - 1);
                ps.score += pts;
                addFloat('+' + pts + '!', ghost.x, ghost.y, '#ff44ff');
                syncScoreDisplay();
                if (typeof showToast === 'function') showToast('👻 ' + ghost.name + ' jailed! +' + pts, 'success');
            } else {
                pacmanHit();
            }
        }
    });
}

function bestDir(ghost, tx, ty, validDirs) {
    var best = validDirs[0], bestD = Infinity;
    validDirs.forEach(function(d) {
        var nx = ghost.x, ny = ghost.y;
        if (d==='up') ny--; if (d==='down') ny++;
        if (d==='left') nx--; if (d==='right') nx++;
        var dist = Math.abs(nx-tx)+Math.abs(ny-ty);
        if (dist < bestD) { bestD = dist; best = d; }
    });
    return best;
}

// ─── HIT / LEVEL ─────────────────────────────────────────────────────────────
function pacmanHit() {
    ps.lives--;
    updatePacmanLives();
    ps.powerMode = false; ps.ghostCombo = 0;
    ps.ghosts.forEach(function(g){g.scared=false;});
    if (typeof playGameSound === 'function') playGameSound('error', 0.4);
    if (ps.lives <= 0) {
        pacmanGameOver();
    } else {
        if (typeof showToast === 'function') showToast('💔 ' + ps.lives + ' lives left!', 'error');
        ps.player.x = 1; ps.player.y = 1;
        ps.player.dir = 'right'; ps.player.nextDir = 'right';
        spawnGhostsOnly();
    }
}

function spawnGhostsOnly() {
    var cx = Math.floor(ps.gridSize/2), cy = Math.floor(ps.board.length/2);
    ps.ghosts.forEach(function(g, i) {
        g.x = cx + (i < 2 ? -1+i : -1+(i-2));
        g.y = cy + (i < 2 ? 0 : 1);
        g.scared = false; g.inJail = false; g.jailTimer = 0;
        g.dirHistory = [];
    });
}

function checkLevelComplete() {
    if (ps.dots.length !== 0 || ps.powerPellets.length !== 0) return;
    ps.level++;
    ps.score += 200 * ps.level;
    var diffs = ['easy','medium','hard'];
    var idx = diffs.indexOf(ps.difficulty);
    if (idx < diffs.length-1) ps.difficulty = diffs[idx+1];
    var maze = PACMAN_MAZES[ps.difficulty];
    ps.gridSize = maze[0].length;
    ps.cellSize = ps.canvas.width / ps.gridSize;
    createPacmanBoard(maze);
    ps.dotsEaten = 0;
    spawnEntities();
    syncScoreDisplay();
    document.getElementById('pacman-level').textContent = ps.level;
    if (typeof playGameSound === 'function') playGameSound('levelup', 0.4);
    if (typeof showConfetti === 'function') showConfetti();
    if (typeof showToast === 'function') showToast('🎉 Level ' + ps.level + '! ' + ps.difficulty.toUpperCase() + '!', 'success');
}

function updatePacmanLives() {
    var str = '';
    for (var i = 0; i < ps.lives; i++) str += '❤️';
    for (var j = ps.lives; j < 3; j++) str += '🖤';
    document.getElementById('pacman-lives').textContent = str;
}

function syncScoreDisplay() {
    document.getElementById('pacman-score').textContent = ps.score;
    document.getElementById('pacman-dots').textContent = ps.dotsEaten;
    document.getElementById('pacman-level').textContent = ps.level;
    var hi = document.getElementById('pacman-high');
    if (hi) hi.textContent = ps.highScore;
}

// ─── FLOAT TEXTS ─────────────────────────────────────────────────────────────
function addFloat(text, gx, gy, color) {
    ps.floatTexts.push({
        text: text,
        x: gx * ps.cellSize + ps.cellSize/2,
        y: gy * ps.cellSize,
        color: color || '#ffffff',
        life: 45
    });
}

// ─── GAME OVER ────────────────────────────────────────────────────────────────
function pacmanGameOver() {
    ps.isRunning = false; ps.isGameOver = true;
    cancelAnimationFrame(ps.gameLoop); ps.gameLoop = null;
    if (typeof playGameSound === 'function') playGameSound('gameover');
    var isNewBest = ps.score > ps.highScore;
    if (isNewBest) {
        ps.highScore = ps.score;
        localStorage.setItem('pacmanHighScore', ps.highScore);
        document.getElementById('pacman-high').textContent = ps.highScore;
    }
    if (typeof saveScore === 'function') saveScore('pacman', ps.score);
    var btn = document.getElementById('pacman-start-btn');
    if (btn) { btn.style.display = 'inline-block'; btn.textContent = 'Play Again'; }
    showPacmanGameOver(isNewBest);
    if (isNewBest && typeof showConfetti === 'function') showConfetti();
}

function showPacmanGameOver(isNewBest) {
    var ex = document.querySelector('.pacman-gameover');
    if (ex) ex.remove();
    var ov = document.createElement('div');
    ov.className = 'pacman-gameover';
    ov.innerHTML = '<div class="pacman-gameover-content">'
        + '<h3>👻 Game Over!</h3>'
        + '<div class="final-score">' + ps.score.toLocaleString() + '</div>'
        + (isNewBest ? '<div class="new-best">🏆 NEW BEST SCORE! 🏆</div>' : '')
        + '<p style="opacity:0.65;margin:6px 0;">Best: ' + ps.highScore.toLocaleString() + '</p>'
        + '<div style="display:flex;justify-content:center;gap:30px;margin:14px 0;">'
        + '<div style="text-align:center;"><div style="font-size:0.8rem;opacity:0.6;text-transform:uppercase;">Level</div><div style="font-size:1.5rem;font-weight:900;color:#667eea;">' + ps.level + '</div></div>'
        + '<div style="text-align:center;"><div style="font-size:0.8rem;opacity:0.6;text-transform:uppercase;">Dots</div><div style="font-size:1.5rem;font-weight:900;color:#2ed573;">' + ps.dotsEaten + '</div></div>'
        + '</div>'
        + '<button class="restart-btn" onclick="closePacmanGameOver()" style="margin-top:12px;">🕹️ Play Again</button>'
        + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e) { if (e.target === ov) closePacmanGameOver(); });
}

function closePacmanGameOver() {
    var ov = document.querySelector('.pacman-gameover');
    if (ov) ov.remove();
    ps.isRunning = false; ps.isGameOver = false;
    var btn = document.getElementById('pacman-start-btn');
    if (btn) { btn.style.display = 'inline-block'; btn.textContent = 'Start Game'; }
    drawPacmanStartScreen();
}

// ─── DRAWING ──────────────────────────────────────────────────────────────────
function drawPacmanStartScreen() {
    var ctx = ps.ctx, cw = ps.canvas.width, ch = ps.canvas.height;
    if (!ctx) return;

    // Background
    var bg = ctx.createRadialGradient(cw/2, ch/2, 20, cw/2, ch/2, cw*0.7);
    bg.addColorStop(0, '#0d0d2b'); bg.addColorStop(1, '#000008');
    ctx.fillStyle = bg; ctx.fillRect(0,0,cw,ch);

    // Title glow
    ctx.textAlign = 'center';
    ctx.font = "bold 52px 'Segoe UI', sans-serif";
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 40;
    ctx.fillStyle = '#ffd700';
    ctx.fillText('PAC-MAN', cw/2, ch/2 - 60);

    // Ghost row decoration
    var ghColors = ['#FF0000','#FFB8FF','#00FFFF','#FFB852'];
    ghColors.forEach(function(c, i) {
        ctx.shadowColor = c; ctx.shadowBlur = 15; ctx.fillStyle = c;
        var gx = cw/2 - 60 + i*40, gy = ch/2 - 10;
        ctx.beginPath();
        ctx.arc(gx, gy-6, 12, Math.PI, 0);
        ctx.lineTo(gx+12, gy+8);
        ctx.lineTo(gx+6, gy+3); ctx.lineTo(gx, gy+8);
        ctx.lineTo(gx-6, gy+3); ctx.lineTo(gx-12, gy+8);
        ctx.fill();
    });

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = "18px 'Segoe UI', sans-serif";
    ctx.fillText('Press Start to Play', cw/2, ch/2 + 40);
    ctx.font = "14px 'Segoe UI', sans-serif"; ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('WASD or Arrow Keys  •  P = Pause', cw/2, ch/2 + 70);
    if (ps.highScore > 0) {
        ctx.font = "bold 15px 'Segoe UI', sans-serif";
        ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
        ctx.fillText('🏆 High Score: ' + ps.highScore.toLocaleString(), cw/2, ch/2 + 105);
        ctx.shadowBlur = 0;
    }
}

function drawPacmanFrame() {
    var ctx = ps.ctx, cw = ps.canvas.width, ch = ps.canvas.height, cs = ps.cellSize;
    if (!ctx) return;
    var rows = ps.board.length, cols = ps.board[0].length;

    // ── Pure black background ──
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cw, ch);

    // ── Wall fill: dark navy blue ──
    ctx.fillStyle = '#00008b';
    for (var wy = 0; wy < rows; wy++) {
        for (var wx = 0; wx < cols; wx++) {
            if (ps.board[wy][wx] === 1)
                ctx.fillRect(wx*cs, wy*cs, cs, cs);
        }
    }

    // ── Wall outline: bright blue lines only at wall/corridor boundaries ──
    var lw = Math.max(2, cs * 0.13);
    ctx.strokeStyle = '#2121ff';
    ctx.lineWidth = lw;
    ctx.lineCap = 'square';
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 7;

    // Horizontal boundaries (between row y-1 and row y)
    for (var hy = 0; hy <= rows; hy++) {
        var rx = -1;
        for (var hx = 0; hx <= cols; hx++) {
            var above = (hy === 0)    ? 1 : ps.board[hy-1][hx] || 0;
            var below = (hy === rows) ? 1 : ps.board[hy][hx]   || 0;
            var isBound = (hx < cols) && (above !== below);
            if (isBound && rx < 0) rx = hx;
            if (!isBound && rx >= 0) {
                ctx.beginPath();
                ctx.moveTo(rx*cs, hy*cs);
                ctx.lineTo(hx*cs, hy*cs);
                ctx.stroke();
                rx = -1;
            }
        }
    }
    // Vertical boundaries (between col x-1 and col x)
    for (var vx = 0; vx <= cols; vx++) {
        var ry = -1;
        for (var vy = 0; vy <= rows; vy++) {
            var left  = (vx === 0)    ? 1 : (ps.board[vy] ? ps.board[vy][vx-1] : 0) || 0;
            var right = (vx === cols) ? 1 : (ps.board[vy] ? ps.board[vy][vx]   : 0) || 0;
            var isBound2 = (vy < rows) && (left !== right);
            if (isBound2 && ry < 0) ry = vy;
            if (!isBound2 && ry >= 0) {
                ctx.beginPath();
                ctx.moveTo(vx*cs, ry*cs);
                ctx.lineTo(vx*cs, vy*cs);
                ctx.stroke();
                ry = -1;
            }
        }
    }
    ctx.shadowBlur = 0;

    // ── Dots: small white circles ──
    ctx.fillStyle = '#ffffff';
    ps.dots.forEach(function(dot) {
        ctx.beginPath();
        ctx.arc(dot.x*cs + cs/2, dot.y*cs + cs/2, cs * 0.1, 0, Math.PI*2);
        ctx.fill();
    });

    // ── Power pellets: large pulsing white ──
    var pulse = Math.abs(Math.sin(ps.frameCount * 0.1));
    ps.powerPellets.forEach(function(pp) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10 + pulse * 10;
        ctx.beginPath();
        ctx.arc(pp.x*cs + cs/2, pp.y*cs + cs/2, cs*0.26 + pulse*cs*0.05, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // ── Power mode flash border ──
    if (ps.powerMode && ps.powerTimer < 60 && Math.floor(ps.frameCount/8)%2===0) {
        ctx.strokeStyle = 'rgba(255,255,100,0.75)';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 14;
        ctx.strokeRect(2, 2, cw-4, rows*cs-4);
        ctx.shadowBlur = 0;
    }

    // ── Pac-Man ──
    var p = ps.player;
    var px = p.x*cs + cs/2, py = p.y*cs + cs/2, pr = cs/2 - 1;
    var mo = p.mouthAngle * 1.2;   // slightly wider mouth
    var sa, ea;
    if      (p.dir==='right') { sa = mo;               ea = Math.PI*2 - mo; }
    else if (p.dir==='left')  { sa = Math.PI + mo;     ea = Math.PI*3 - mo; }
    else if (p.dir==='up')    { sa = -Math.PI/2 + mo;  ea = Math.PI*1.5 - mo; }
    else                      { sa = Math.PI/2 + mo;   ea = Math.PI*2.5 - mo; }

    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py, pr, sa, ea);
    ctx.lineTo(px, py);
    ctx.fill();
    ctx.shadowBlur = 0;

    // ── Ghosts ──
    ps.ghosts.forEach(function(ghost) {
        if (ghost.inJail) return;
        drawGhost(ctx, ghost, cs);
    });

    // ── Float texts ──
    ps.floatTexts.forEach(function(ft) {
        ctx.globalAlpha = ft.life / 45;
        ctx.font = "bold " + Math.round(cs*0.52) + "px 'Segoe UI',sans-serif";
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color; ctx.shadowBlur = 8;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    });

    // ── Bottom bar ──
    var barY = rows * cs;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, barY, cw, ch - barY);

    // Lives — small Pac-Man icons
    ctx.fillStyle = '#ffd700';
    for (var li = 0; li < ps.lives; li++) {
        var lx = 14 + li * (cs * 0.9);
        var lr = cs * 0.38;
        ctx.beginPath();
        ctx.arc(lx, barY + 18, lr, 0.4, Math.PI*2 - 0.4);
        ctx.lineTo(lx, barY + 18);
        ctx.fill();
    }

    // Score
    ctx.textAlign = 'center';
    ctx.font = "bold " + Math.round(cs*0.65) + "px 'Courier New', monospace";
    ctx.fillStyle = ps.powerMode ? '#ffaaff' : '#ffffff';
    ctx.shadowColor = ps.powerMode ? '#ff00ff' : '#aaaaff';
    ctx.shadowBlur = 8;
    ctx.fillText(ps.score.toLocaleString(), cw/2, barY + 24);
    ctx.shadowBlur = 0;

    // Level
    ctx.textAlign = 'right';
    ctx.font = "bold 12px 'Segoe UI', sans-serif";
    ctx.fillStyle = '#ffd700';
    ctx.fillText('LV ' + ps.level, cw - 8, barY + 24);

    // Power bar
    if (ps.powerMode) {
        var pw = (ps.powerTimer / 220) * (cw - 20);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(10, barY + 32, cw - 20, 6);
        ctx.fillStyle = '#aaaaff';
        ctx.shadowColor = '#8888ff'; ctx.shadowBlur = 6;
        ctx.fillRect(10, barY + 32, pw, 6);
        ctx.shadowBlur = 0;
    }
}

function drawGhost(ctx, ghost, cs) {
    var gx = ghost.x*cs + cs/2, gy = ghost.y*cs + cs/2;
    var sz = cs/2 - 1;
    var scared = ghost.scared;
    var flashing = scared && ps.powerTimer < 60 && Math.floor(ps.frameCount/8)%2===0;
    var body = flashing ? '#ffffff' : scared ? '#0000cc' : ghost.color;

    ctx.fillStyle = body;
    ctx.shadowColor = body; ctx.shadowBlur = 10;

    // Top dome
    var top = gy - sz * 0.85;
    var bot = gy + sz * 0.85;
    ctx.beginPath();
    ctx.arc(gx, top + sz * 0.55, sz, Math.PI, 0, false);
    ctx.lineTo(gx + sz, bot);

    // Wavy bottom — 3 bumps
    var bumpW = (sz * 2) / 3;
    ctx.quadraticCurveTo(gx + sz - bumpW*0.5, bot + sz*0.28, gx + sz - bumpW,   bot);
    ctx.quadraticCurveTo(gx        - bumpW*0.0, bot - sz*0.22, gx,               bot);
    ctx.quadraticCurveTo(gx - sz   + bumpW*0.5, bot + sz*0.28, gx - sz + bumpW,  bot);
    ctx.quadraticCurveTo(gx - sz   + bumpW*0.0, bot - sz*0.22, gx - sz,          bot);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    if (!scared) {
        // White eye whites
        var eyeY = gy - sz * 0.18;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(gx - sz*0.34, eyeY, sz*0.27, sz*0.33, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(gx + sz*0.34, eyeY, sz*0.27, sz*0.33, 0, 0, Math.PI*2); ctx.fill();
        // Blue pupils looking toward movement direction
        var ex = ghost.dir==='left' ? -sz*0.11 : ghost.dir==='right' ? sz*0.11 : 0;
        var ey = ghost.dir==='up'   ? -sz*0.10 : ghost.dir==='down'  ? sz*0.10 : 0;
        ctx.fillStyle = '#2222ff';
        ctx.beginPath(); ctx.arc(gx - sz*0.34 + ex, eyeY + ey, sz*0.15, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + sz*0.34 + ex, eyeY + ey, sz*0.15, 0, Math.PI*2); ctx.fill();
    } else {
        // Scared: dot eyes + squiggly mouth
        var scaredColor = flashing ? '#ff4444' : '#8888ff';
        ctx.fillStyle = scaredColor;
        ctx.beginPath(); ctx.arc(gx - sz*0.3, gy - sz*0.15, sz*0.1, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + sz*0.3, gy - sz*0.15, sz*0.1, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = scaredColor; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx - sz*0.42, gy + sz*0.2);
        ctx.quadraticCurveTo(gx - sz*0.18, gy + sz*0.44, gx,          gy + sz*0.2);
        ctx.quadraticCurveTo(gx + sz*0.18, gy,            gx + sz*0.42, gy + sz*0.2);
        ctx.stroke();
    }
}

// ─── EXPOSE ──────────────────────────────────────────────────────────────────
window.initPacman           = initPacman;
window.startPacman          = startPacman;
window.togglePausePacman    = togglePausePacman;
window.changePacmanDifficulty = changePacmanDifficulty;
window.closePacmanGameOver  = closePacmanGameOver;
window.setPacmanDir         = setPacmanDir;

} // end _pacmanLoaded guard
