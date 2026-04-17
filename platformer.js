/* ============================================
   PLATFORMER GAME
   ============================================ */
(function() {
    var W = 480, H = 360;
    var GRAVITY = 0.5, JUMP = -11, SPEED = 4;
    var TILE = 32;

    var pf = {
        canvas: null, ctx: null, animId: null,
        player: null, platforms: [], coins: [], enemies: [], particles: [],
        cameraX: 0, score: 0, lives: 3, level: 1,
        keys: {}, running: false, started: false, over: false,
        _ctrlsSetup: false, worldWidth: 3200
    };

    function initPlatformer() {
        if (pf.animId) { cancelAnimationFrame(pf.animId); pf.animId = null; }
        pf.canvas = document.getElementById('platformer-canvas');
        pf.ctx = pf.canvas.getContext('2d');
        pf.canvas.width = W; pf.canvas.height = H;
        pf.score = 0; pf.lives = 3; pf.level = 1; pf.over = false; pf.started = false;
        document.getElementById('pf-score').textContent = '0';
        document.getElementById('pf-lives').textContent = '❤️❤️❤️';
        document.getElementById('pf-over').style.display = 'none';
        setupControls();
        buildLevel();
        drawStart();
    }
    window.initPlatformer = initPlatformer;
    window._stopPlatformer = function() { if (pf.animId) { cancelAnimationFrame(pf.animId); pf.animId = null; } pf.running = false; };

    function buildLevel() {
        pf.cameraX = 0;
        pf.worldWidth = 2800 + pf.level * 400;
        pf.player = { x: 60, y: H - TILE * 3, w: 28, h: 36, vx: 0, vy: 0, onGround: false, dir: 1, frame: 0 };
        pf.platforms = [];
        pf.coins = [];
        pf.enemies = [];
        pf.particles = [];

        // Ground
        for (var x = 0; x < pf.worldWidth; x += TILE) pf.platforms.push({ x: x, y: H - TILE, w: TILE, h: TILE, type: 'ground' });

        // Gaps and platforms
        var seed = pf.level;
        var px = 200;
        while (px < pf.worldWidth - 300) {
            var gap = 60 + lcg(seed++) % 80;
            px += gap;
            var platW = (3 + lcg(seed++) % 5) * TILE;
            var platY = H - TILE * (2 + lcg(seed++) % 5);
            pf.platforms.push({ x: px, y: platY, w: platW, h: TILE, type: 'platform' });

            // Coins on platform
            for (var c = 0; c < Math.floor(platW / TILE); c++) {
                if (lcg(seed++) % 2 === 0) {
                    pf.coins.push({ x: px + c * TILE + TILE / 2, y: platY - 20, collected: false });
                }
            }

            // Enemy on platform
            if (lcg(seed++) % 3 === 0 && platW >= TILE * 3) {
                pf.enemies.push({ x: px + 10, y: platY - 28, w: 28, h: 28, vx: 1.5, left: px, right: px + platW - 30, alive: true });
            }
            px += platW;
        }

        // Flag at the end
        pf.flag = { x: pf.worldWidth - 80, y: H - TILE - 80 };
    }

    function lcg(s) { return Math.abs((s * 1664525 + 1013904223) & 0x7fffffff); }

    function setupControls() {
        if (pf._ctrlsSetup) return;
        pf._ctrlsSetup = true;
        document.addEventListener('keydown', function(e) {
            pf.keys[e.code] = true;
            if (['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code)) e.preventDefault();
        });
        document.addEventListener('keyup', function(e) { pf.keys[e.code] = false; });
    }

    function drawStart() {
        var c = pf.ctx;
        drawBg(c);
        c.fillStyle = 'rgba(0,0,0,0.7)';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#fff';
        c.font = 'bold 24px "Press Start 2P", monospace';
        c.textAlign = 'center';
        c.fillText('PLATFORMER', W / 2, 130);
        c.font = '10px "Press Start 2P", monospace';
        c.fillStyle = '#aaa';
        c.fillText('Arrow Keys / WASD to move', W / 2, 165);
        c.fillText('Up / W / Space = Jump', W / 2, 185);
        c.fillStyle = '#667eea';
        c.beginPath(); c.roundRect(W / 2 - 80, 210, 160, 44, 8); c.fill();
        c.fillStyle = '#fff';
        c.font = '11px "Press Start 2P", monospace';
        c.fillText('START', W / 2, 238);
        c.fillText('Reach the flag 🚩', W / 2, 280);

        function onStart() {
            pf.canvas.removeEventListener('click', onStart);
            pf.canvas.removeEventListener('touchstart', onStart);
            pf.started = true; pf.running = true;
            gameLoop();
        }
        pf.canvas.addEventListener('click', onStart);
        pf.canvas.addEventListener('touchstart', onStart);
    }

    function gameLoop() {
        if (!pf.running) return;
        update();
        draw();
        pf.animId = requestAnimationFrame(gameLoop);
    }

    function update() {
        var p = pf.player;
        var left = pf.keys['ArrowLeft'] || pf.keys['KeyA'];
        var right = pf.keys['ArrowRight'] || pf.keys['KeyD'];
        var jump = pf.keys['ArrowUp'] || pf.keys['KeyW'] || pf.keys['Space'];

        if (left) { p.vx = -SPEED; p.dir = -1; }
        else if (right) { p.vx = SPEED; p.dir = 1; }
        else p.vx *= 0.7;

        if (jump && p.onGround) {
            p.vy = JUMP;
            p.onGround = false;
            if (window.playGameSound) playGameSound('flap');
        }

        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.x = Math.max(0, Math.min(pf.worldWidth - p.w, p.x));
        p.onGround = false;

        // Platform collision
        pf.platforms.forEach(function(pl) {
            if (p.x + p.w > pl.x && p.x < pl.x + pl.w) {
                if (p.y + p.h > pl.y && p.y + p.h < pl.y + pl.h + Math.abs(p.vy) + 2 && p.vy >= 0) {
                    p.y = pl.y - p.h;
                    p.vy = 0;
                    p.onGround = true;
                }
            }
        });

        // Coin collection
        pf.coins.forEach(function(coin) {
            if (coin.collected) return;
            var dx = (p.x + p.w / 2) - coin.x, dy = (p.y + p.h / 2) - coin.y;
            if (dx * dx + dy * dy < 30 * 30) {
                coin.collected = true;
                pf.score += 10;
                document.getElementById('pf-score').textContent = pf.score;
                if (window.playGameSound) playGameSound('score');
                spawnParticles(coin.x, coin.y, '#FFD700');
            }
        });

        // Enemy movement + collision
        pf.enemies.forEach(function(en) {
            if (!en.alive) return;
            en.x += en.vx;
            if (en.x <= en.left || en.x >= en.right) en.vx *= -1;
            // Player stomps enemy
            if (p.x + p.w > en.x && p.x < en.x + en.w &&
                p.y + p.h > en.y && p.y < en.y + en.h) {
                if (p.vy > 0 && p.y + p.h < en.y + en.h / 2) {
                    en.alive = false;
                    p.vy = -7;
                    pf.score += 25;
                    document.getElementById('pf-score').textContent = pf.score;
                    spawnParticles(en.x + en.w / 2, en.y, '#ff6b6b');
                } else {
                    loseLife();
                }
            }
        });

        // Fall into pit
        if (p.y > H + 50) loseLife();

        // Reach flag
        if (pf.flag && Math.abs(p.x - pf.flag.x) < 50 && p.y + p.h > pf.flag.y) {
            pf.score += 200 * pf.level;
            pf.level++;
            document.getElementById('pf-score').textContent = pf.score;
            if (pf.level > 5) { endPF(true); return; }
            buildLevel();
            if (window.playGameSound) playGameSound('levelup');
        }

        // Camera
        pf.cameraX = Math.max(0, Math.min(pf.worldWidth - W, p.x - W / 3));

        // Particles
        pf.particles = pf.particles.filter(function(pt) {
            pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.3; pt.life--;
            return pt.life > 0;
        });

        p.frame = (p.frame + 1) % 20;
    }

    function loseLife() {
        pf.lives--;
        var hearts = ['','❤️','❤️❤️','❤️❤️❤️','❤️❤️❤️❤️'];
        document.getElementById('pf-lives').textContent = hearts[Math.max(0, pf.lives)] || '💀';
        if (pf.lives <= 0) { endPF(false); return; }
        if (window.playGameSound) playGameSound('gameover');
        pf.player.x = 60; pf.player.y = H - TILE * 3;
        pf.player.vx = 0; pf.player.vy = 0;
        pf.cameraX = 0;
    }

    function spawnParticles(x, y, color) {
        for (var i = 0; i < 6; i++) {
            var angle = (i / 6) * Math.PI * 2;
            pf.particles.push({ x: x, y: y, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3 - 2, life: 25, color: color });
        }
    }

    function draw() {
        var c = pf.ctx;
        drawBg(c);
        c.save();
        c.translate(-pf.cameraX, 0);

        // Platforms
        pf.platforms.forEach(function(pl) {
            c.fillStyle = pl.type === 'ground' ? '#4a7c2c' : '#8B6914';
            c.fillRect(pl.x, pl.y, pl.w, pl.h);
            c.fillStyle = pl.type === 'ground' ? '#5a9c3c' : '#a07820';
            c.fillRect(pl.x, pl.y, pl.w, 8);
        });

        // Coins
        pf.coins.forEach(function(coin) {
            if (coin.collected) return;
            c.fillStyle = '#FFD700';
            c.shadowColor = '#FFD700'; c.shadowBlur = 8;
            c.beginPath(); c.arc(coin.x, coin.y, 10, 0, Math.PI * 2); c.fill();
            c.shadowBlur = 0;
        });

        // Enemies
        pf.enemies.forEach(function(en) {
            if (!en.alive) return;
            c.fillStyle = '#e74c3c';
            c.fillRect(en.x, en.y, en.w, en.h);
            // Eyes
            c.fillStyle = '#fff';
            c.fillRect(en.x + (en.vx > 0 ? en.w - 10 : 4), en.y + 6, 7, 7);
            c.fillStyle = '#000';
            c.fillRect(en.x + (en.vx > 0 ? en.w - 7 : 5), en.y + 8, 4, 4);
        });

        // Flag
        if (pf.flag) {
            c.fillStyle = '#666';
            c.fillRect(pf.flag.x, pf.flag.y, 4, 80);
            c.fillStyle = '#e74c3c';
            c.fillRect(pf.flag.x + 4, pf.flag.y, 28, 20);
        }

        // Particles
        pf.particles.forEach(function(pt) {
            c.fillStyle = pt.color;
            c.globalAlpha = pt.life / 25;
            c.fillRect(pt.x - 3, pt.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        // Player
        drawPlayer(c, pf.player);
        c.restore();

        // HUD level
        c.fillStyle = 'rgba(0,0,0,0.4)';
        c.fillRect(W - 100, 8, 92, 24);
        c.fillStyle = '#fff';
        c.font = '10px "Press Start 2P", monospace';
        c.textAlign = 'left';
        c.fillText('LVL ' + pf.level + '/5', W - 92, 25);
    }

    function drawBg(c) {
        var grad = c.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1a1a4e');
        grad.addColorStop(1, '#3a3a8e');
        c.fillStyle = grad;
        c.fillRect(0, 0, W, H);
    }

    function drawPlayer(c, p) {
        var run = p.vx !== 0;
        var legOff = p.onGround && run ? Math.sin(p.frame * 0.6) * 6 : 0;
        // Body
        c.fillStyle = '#3498db';
        c.fillRect(p.x, p.y + 14, p.w, p.h - 14);
        // Head
        c.fillStyle = '#fde8a0';
        c.fillRect(p.x + 2, p.y, p.w - 4, 16);
        // Eye
        c.fillStyle = '#333';
        var eyeX = p.dir > 0 ? p.x + p.w - 8 : p.x + 4;
        c.fillRect(eyeX, p.y + 4, 4, 4);
        // Legs
        c.fillStyle = '#2c3e50';
        c.fillRect(p.x + 2, p.y + p.h - 8 + legOff, 10, 8);
        c.fillRect(p.x + p.w - 12, p.y + p.h - 8 - legOff, 10, 8);
    }

    function endPF(won) {
        pf.running = false;
        cancelAnimationFrame(pf.animId); pf.animId = null;
        document.getElementById('pf-result').textContent = won ? '🏆 You Win!' : '💀 Game Over!';
        document.getElementById('pf-final-score').textContent = 'Score: ' + pf.score + (won ? ' 🎉' : '');
        document.getElementById('pf-over').style.display = 'flex';
        if (window._saveScore) _saveScore('platformer', pf.score);
        if (window.GZAch) GZAch.recordGame('platformer', pf.score);
    }

    window.restartPlatformer = function() {
        document.getElementById('pf-over').style.display = 'none';
        initPlatformer();
    };
})();
