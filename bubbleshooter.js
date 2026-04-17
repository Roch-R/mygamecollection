/* ============================================
   BUBBLE SHOOTER GAME
   ============================================ */
(function() {
    var COLS = 9, ROWS_INIT = 8, CELL = 44;
    var W = COLS * CELL, H = 560;
    var COLORS = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c'];
    var LAUNCHER_Y = H - 50;

    var bs = {
        canvas: null, ctx: null, animId: null,
        grid: [], bubble: null, nextColor: null,
        angle: -Math.PI / 2, score: 0, level: 1,
        running: false, started: false, _ctrlsSetup: false,
        pops: []  // pop animations
    };

    function initBubbleShooter() {
        if (bs.animId) { cancelAnimationFrame(bs.animId); bs.animId = null; }
        bs.canvas = document.getElementById('bubbleshooter-canvas');
        bs.ctx = bs.canvas.getContext('2d');
        bs.canvas.width = W; bs.canvas.height = H;
        bs.score = 0; bs.level = 1; bs.running = false; bs.started = false; bs.pops = [];
        document.getElementById('bs-score').textContent = '0';
        document.getElementById('bs-level').textContent = '1';
        document.getElementById('bs-over').style.display = 'none';
        buildGrid();
        newBubble();
        setupControls();
        drawStart();
    }
    window.initBubbleShooter = initBubbleShooter;
    window._stopBubbleShooter = function() { if (bs.animId) { cancelAnimationFrame(bs.animId); bs.animId = null; } bs.running = false; };

    function buildGrid() {
        bs.grid = [];
        for (var r = 0; r < ROWS_INIT; r++) {
            bs.grid[r] = [];
            var cols = r % 2 === 0 ? COLS : COLS - 1;
            for (var c = 0; c < cols; c++) {
                bs.grid[r][c] = COLORS[Math.floor(Math.random() * COLORS.length)];
            }
        }
    }

    function newBubble() {
        bs.bubble = { color: bs.nextColor || randColor(), x: W / 2, y: LAUNCHER_Y, vx: 0, vy: 0, moving: false };
        bs.nextColor = randColor();
        document.getElementById('bs-next').style.background = bs.nextColor;
    }

    function randColor() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }

    function setupControls() {
        if (bs._ctrlsSetup) return;
        bs._ctrlsSetup = true;
        document.addEventListener('mousemove', function(e) {
            if (!bs.running || !bs.canvas || bs.bubble.moving) return;
            var rect = bs.canvas.getBoundingClientRect();
            var scaleX = W / rect.width, scaleY = H / rect.height;
            var mx = (e.clientX - rect.left) * scaleX;
            var my = (e.clientY - rect.top) * scaleY;
            var dx = mx - W / 2, dy = my - LAUNCHER_Y;
            bs.angle = Math.atan2(dy, dx);
            if (bs.angle > -0.2) bs.angle = -0.2;
            if (bs.angle < -Math.PI + 0.2) bs.angle = -Math.PI + 0.2;
        });
        document.addEventListener('click', function(e) {
            if (!bs.running || !bs.canvas || bs.bubble.moving) return;
            var rect = bs.canvas.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right) return;
            shoot();
        });
        document.addEventListener('touchstart', function(e) {
            if (!bs.running || !bs.canvas || bs.bubble.moving) return;
            var rect = bs.canvas.getBoundingClientRect();
            var scaleX = W / rect.width, scaleY = H / rect.height;
            var mx = (e.touches[0].clientX - rect.left) * scaleX;
            var my = (e.touches[0].clientY - rect.top) * scaleY;
            var dx = mx - W / 2, dy = my - LAUNCHER_Y;
            bs.angle = Math.atan2(dy, dx);
            if (bs.angle > -0.2) bs.angle = -0.2;
            if (bs.angle < -Math.PI + 0.2) bs.angle = -Math.PI + 0.2;
            shoot();
        }, { passive: true });
    }

    function drawStart() {
        draw();
        var c = bs.ctx;
        c.fillStyle = 'rgba(10,10,26,0.8)';
        c.fillRect(0, H / 2 - 80, W, 180);
        c.fillStyle = '#fff';
        c.font = 'bold 20px "Press Start 2P", monospace';
        c.textAlign = 'center';
        c.fillText('BUBBLE', W / 2, H / 2 - 30);
        c.fillText('SHOOTER', W / 2, H / 2);
        c.fillStyle = '#667eea';
        c.beginPath(); c.roundRect(W / 2 - 70, H / 2 + 20, 140, 42, 8); c.fill();
        c.fillStyle = '#fff';
        c.font = '10px "Press Start 2P", monospace';
        c.fillText('START', W / 2, H / 2 + 46);

        function onStart() {
            bs.canvas.removeEventListener('click', onStart);
            bs.canvas.removeEventListener('touchstart', onStart);
            bs.started = true; bs.running = true;
            gameLoop();
        }
        bs.canvas.addEventListener('click', onStart);
        bs.canvas.addEventListener('touchstart', onStart);
    }

    function shoot() {
        if (bs.bubble.moving) return;
        var speed = 12;
        bs.bubble.vx = Math.cos(bs.angle) * speed;
        bs.bubble.vy = Math.sin(bs.angle) * speed;
        bs.bubble.moving = true;
    }

    function gameLoop() {
        if (!bs.running) return;
        if (bs.bubble.moving) updateBubble();
        draw();
        bs.animId = requestAnimationFrame(gameLoop);
    }

    function updateBubble() {
        bs.bubble.x += bs.bubble.vx;
        bs.bubble.y += bs.bubble.vy;
        var r = CELL / 2 - 2;
        if (bs.bubble.x <= r) { bs.bubble.x = r; bs.bubble.vx = Math.abs(bs.bubble.vx); }
        if (bs.bubble.x >= W - r) { bs.bubble.x = W - r; bs.bubble.vx = -Math.abs(bs.bubble.vx); }

        // Hit top or grid bubble
        if (bs.bubble.y <= r || checkGridCollision()) {
            snapToGrid();
        }
    }

    function checkGridCollision() {
        for (var r = 0; r < bs.grid.length; r++) {
            var offset = r % 2 === 0 ? 0 : CELL / 2;
            for (var c = 0; c < (bs.grid[r] || []).length; c++) {
                if (!bs.grid[r][c]) continue;
                var gx = offset + c * CELL + CELL / 2;
                var gy = r * (CELL * 0.87) + CELL / 2;
                var dx = bs.bubble.x - gx, dy = bs.bubble.y - gy;
                if (dx * dx + dy * dy < (CELL - 4) * (CELL - 4)) return true;
            }
        }
        return false;
    }

    function snapToGrid() {
        // Find best empty grid cell near landing position
        var bestR = -1, bestC = -1, bestDist = Infinity;
        var maxR = bs.grid.length;
        for (var r = 0; r <= maxR; r++) {
            var offset = r % 2 === 0 ? 0 : CELL / 2;
            var cols = r % 2 === 0 ? COLS : COLS - 1;
            for (var c = 0; c < cols; c++) {
                if (bs.grid[r] && bs.grid[r][c]) continue;
                var gx = offset + c * CELL + CELL / 2;
                var gy = r * (CELL * 0.87) + CELL / 2;
                var dx = bs.bubble.x - gx, dy = bs.bubble.y - gy;
                var dist = dx * dx + dy * dy;
                if (dist < bestDist) { bestDist = dist; bestR = r; bestC = c; }
            }
        }
        if (bestR < 0) { bestR = 0; bestC = 0; }
        if (!bs.grid[bestR]) bs.grid[bestR] = [];
        bs.grid[bestR][bestC] = bs.bubble.color;

        // Check matches
        var matched = findMatches(bestR, bestC, bs.bubble.color);
        if (matched.length >= 3) {
            matched.forEach(function(pos) {
                var gp = gridPos(pos[0], pos[1]);
                spawnPop(gp.x, gp.y, bs.grid[pos[0]][pos[1]]);
                bs.grid[pos[0]][pos[1]] = null;
            });
            bs.score += matched.length * 10 * bs.level;
            document.getElementById('bs-score').textContent = bs.score;
            removeFloating();
            if (window.playGameSound) playGameSound('score');
        }

        // Check if grid reached bottom
        var danger = (bs.grid.length - 1) * (CELL * 0.87) + CELL / 2;
        if (danger > LAUNCHER_Y - 60) {
            endBS(false); return;
        }
        // Level up if grid is almost clear
        var remaining = 0;
        bs.grid.forEach(function(row) { if (row) row.forEach(function(v) { if (v) remaining++; }); });
        if (remaining < 5) {
            bs.level++;
            document.getElementById('bs-level').textContent = bs.level;
            buildGrid();
            if (window.playGameSound) playGameSound('levelup');
        }

        newBubble();
        bs.bubble.moving = false;
    }

    function gridPos(r, c) {
        var offset = r % 2 === 0 ? 0 : CELL / 2;
        return { x: offset + c * CELL + CELL / 2, y: r * (CELL * 0.87) + CELL / 2 };
    }

    function spawnPop(x, y, color) {
        var particles = [];
        var NUM = 8;
        for (var i = 0; i < NUM; i++) {
            var angle = (i / NUM) * Math.PI * 2 + Math.random() * 0.4;
            var speed = 2.5 + Math.random() * 2.5;
            particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: 4 + Math.random() * 4
            });
        }
        bs.pops.push({ x: x, y: y, color: color, life: 22, maxLife: 22, particles: particles });
    }

    function findMatches(r, c, color) {
        var visited = {}, result = [];
        function dfs(row, col) {
            var key = row + ',' + col;
            if (visited[key]) return;
            if (row < 0 || row >= bs.grid.length) return;
            if (!bs.grid[row] || !bs.grid[row][col]) return;
            if (bs.grid[row][col] !== color) return;
            visited[key] = true;
            result.push([row, col]);
            var neighbors = getNeighbors(row, col);
            neighbors.forEach(function(n) { dfs(n[0], n[1]); });
        }
        dfs(r, c);
        return result;
    }

    function getNeighbors(r, c) {
        var even = r % 2 === 0;
        return [
            [r - 1, c + (even ? 0 : 1)], [r - 1, c + (even ? -1 : 0)],
            [r, c - 1], [r, c + 1],
            [r + 1, c + (even ? 0 : 1)], [r + 1, c + (even ? -1 : 0)]
        ];
    }

    function removeFloating() {
        // BFS from top row — remove any bubble not connected to top
        var connected = {};
        var queue = [];
        if (bs.grid[0]) {
            bs.grid[0].forEach(function(v, c) {
                if (v) { connected['0,' + c] = true; queue.push([0, c]); }
            });
        }
        while (queue.length > 0) {
            var pos = queue.shift();
            getNeighbors(pos[0], pos[1]).forEach(function(n) {
                var key = n[0] + ',' + n[1];
                if (!connected[key] && n[0] >= 0 && n[0] < bs.grid.length &&
                    bs.grid[n[0]] && bs.grid[n[0]][n[1]]) {
                    connected[key] = true; queue.push(n);
                }
            });
        }
        bs.grid.forEach(function(row, r) {
            if (!row) return;
            row.forEach(function(v, c) {
                if (v && !connected[r + ',' + c]) {
                    var gp = gridPos(r, c);
                    spawnPop(gp.x, gp.y, v);
                    bs.grid[r][c] = null;
                    bs.score += 5;
                }
            });
        });
        document.getElementById('bs-score').textContent = bs.score;
    }

    function draw() {
        var c = bs.ctx;
        c.fillStyle = '#1a1a2e';
        c.fillRect(0, 0, W, H);

        // Draw grid bubbles
        for (var r = 0; r < bs.grid.length; r++) {
            var offset = r % 2 === 0 ? 0 : CELL / 2;
            if (!bs.grid[r]) continue;
            for (var col = 0; col < bs.grid[r].length; col++) {
                if (!bs.grid[r][col]) continue;
                var gx = offset + col * CELL + CELL / 2;
                var gy = r * (CELL * 0.87) + CELL / 2;
                drawBubble(c, gx, gy, bs.grid[r][col]);
            }
        }

        // Pop animations
        bs.pops = bs.pops.filter(function(pop) {
            var t = 1 - pop.life / pop.maxLife;  // 0 → 1
            var alpha = 1 - t;

            // Expanding ring
            c.save();
            c.globalAlpha = alpha * 0.7;
            c.strokeStyle = pop.color;
            c.lineWidth = 3;
            c.shadowColor = pop.color; c.shadowBlur = 10;
            c.beginPath();
            c.arc(pop.x, pop.y, (CELL / 2) * (0.8 + t * 1.4), 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            // Particles
            pop.particles.forEach(function(p) {
                c.globalAlpha = alpha;
                c.fillStyle = pop.color;
                c.shadowColor = pop.color; c.shadowBlur = 6;
                c.beginPath();
                c.arc(p.x, p.y, p.r * (1 - t * 0.6), 0, Math.PI * 2);
                c.fill();
                p.x += p.vx; p.y += p.vy;
                p.vy += 0.18;  // slight gravity
            });
            c.shadowBlur = 0;
            c.globalAlpha = 1;
            c.restore();

            pop.life--;
            return pop.life > 0;
        });

        // Aim line
        if (!bs.bubble.moving) {
            c.strokeStyle = 'rgba(255,255,255,0.2)';
            c.setLineDash([6, 8]); c.lineWidth = 1;
            c.beginPath();
            c.moveTo(W / 2, LAUNCHER_Y);
            c.lineTo(W / 2 + Math.cos(bs.angle) * 120, LAUNCHER_Y + Math.sin(bs.angle) * 120);
            c.stroke(); c.setLineDash([]);
        }

        // Launcher / current bubble
        drawBubble(c, W / 2, LAUNCHER_Y, bs.bubble.color);
        if (bs.bubble.moving) drawBubble(c, bs.bubble.x, bs.bubble.y, bs.bubble.color);

        // Launcher base
        c.fillStyle = '#333';
        c.fillRect(W / 2 - 20, LAUNCHER_Y + 18, 40, 22);
    }

    function drawBubble(c, x, y, color) {
        var r = CELL / 2 - 3;
        c.shadowColor = color; c.shadowBlur = 8;
        c.fillStyle = color;
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.35)';
        c.beginPath(); c.arc(x - r * 0.3, y - r * 0.35, r * 0.38, 0, Math.PI * 2); c.fill();
        c.shadowBlur = 0;
    }

    function endBS(won) {
        bs.running = false;
        cancelAnimationFrame(bs.animId); bs.animId = null;
        document.getElementById('bs-result').textContent = won ? '🏆 Level Clear!' : '💥 Game Over!';
        document.getElementById('bs-final-score').textContent = 'Score: ' + bs.score;
        document.getElementById('bs-over').style.display = 'flex';
        if (window._saveScore) _saveScore('bubbleshooter', bs.score);
        if (window.GZAch) GZAch.recordGame('bubbleshooter', bs.score);
    }

    window.restartBubbleShooter = function() {
        document.getElementById('bs-over').style.display = 'none';
        initBubbleShooter();
    };
})();
