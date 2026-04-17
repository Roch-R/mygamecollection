/* ============================================
   BREAKOUT GAME
   ============================================ */
(function() {
    var bo = {
        canvas: null, ctx: null, animId: null,
        ball: {}, paddle: {}, bricks: [],
        score: 0, lives: 3, level: 1,
        over: false, started: false,
        keys: {}, touchX: null,
        powerUps: [], activePowerUps: {},
        _ctrlsSetup: false,
    };

    var BRICK_COLORS = ['#ff4444','#ff8800','#ffdd00','#44cc44','#4488ff','#cc44ff'];
    var BRICK_ROWS   = 5;
    var BRICK_COLS   = 10;
    var BRICK_PAD    = 4;
    var BRICK_TOP    = 55;

    function initBreakout() {
        // Cancel any existing loop immediately
        if (bo.animId) { cancelAnimationFrame(bo.animId); bo.animId = null; }

        bo.canvas = document.getElementById('breakout-canvas');
        if (!bo.canvas) return;
        bo.ctx = bo.canvas.getContext('2d');

        // Defer sizing to next frame so the game-area layout is settled
        requestAnimationFrame(function() {
            var wrap = document.getElementById('breakout-wrap');
            var W = wrap ? Math.min(Math.max(wrap.offsetWidth, 280), 480) : 400;
            var H = Math.round(W * 1.15);
            bo.canvas.width  = W;
            bo.canvas.height = H;

            setupBreakoutControls();
            fullResetBreakout();
            drawBreakoutStartScreen();
        });
    }
    window.initBreakout = initBreakout;

    function fullResetBreakout() {
        bo.score = 0; bo.lives = 3; bo.level = 1; bo.over = false; bo.started = false;
        bo.powerUps = []; bo.activePowerUps = {};
        buildBricks();
        resetBall();
        updateBreakoutHUD();
    }

    function buildBricks() {
        var W = bo.canvas.width;
        var H = bo.canvas.height;
        var bw = (W - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS;
        var bh = Math.max(14, Math.round(H * 0.04));
        bo.bricks = [];
        for (var r = 0; r < BRICK_ROWS; r++) {
            for (var c = 0; c < BRICK_COLS; c++) {
                var hits = (bo.level >= 3 && r < 2) ? 2 : 1;
                bo.bricks.push({
                    x: BRICK_PAD + c * (bw + BRICK_PAD),
                    y: BRICK_TOP + r * (bh + BRICK_PAD),
                    w: bw, h: bh,
                    color: BRICK_COLORS[r % BRICK_COLORS.length],
                    alive: true, hits: hits,
                });
            }
        }
    }

    function resetBall() {
        var W = bo.canvas.width, H = bo.canvas.height;
        var pw = Math.round(W * 0.22);
        bo.paddle = { x: W/2 - pw/2, y: H - 30, w: pw, h: 12, speed: W * 0.016 };
        var spd = 4.5 + bo.level * 0.4;
        bo.ball = {
            x: W/2, y: H - 52,
            r: Math.max(8, Math.round(W * 0.018)),
            vx: (Math.random() > 0.5 ? 1 : -1) * spd * 0.65,
            vy: -spd,
            stuck: true,
        };
    }

    function setupBreakoutControls() {
        if (bo._ctrlsSetup) return;
        bo._ctrlsSetup = true;

        document.addEventListener('keydown', function(e) {
            bo.keys[e.code] = true;
            if ((e.code === 'Space' || e.code === 'ArrowUp') && bo.ball.stuck && bo.started) {
                bo.ball.stuck = false; e.preventDefault();
            }
            if (['ArrowLeft','ArrowRight','Space'].includes(e.code) && bo.started) e.preventDefault();
        });
        document.addEventListener('keyup', function(e) { bo.keys[e.code] = false; });

        // Canvas-level touch/mouse
        document.getElementById('breakout-canvas').addEventListener('touchmove', function(e) {
            e.preventDefault();
            var rect = bo.canvas.getBoundingClientRect();
            bo.touchX = (e.touches[0].clientX - rect.left) * (bo.canvas.width / rect.width);
        }, { passive: false });

        document.getElementById('breakout-canvas').addEventListener('touchstart', function(e) {
            var rect = bo.canvas.getBoundingClientRect();
            bo.touchX = (e.touches[0].clientX - rect.left) * (bo.canvas.width / rect.width);
            if (bo.ball.stuck && bo.started) bo.ball.stuck = false;
        }, { passive: true });

        document.getElementById('breakout-canvas').addEventListener('mousemove', function(e) {
            var rect = bo.canvas.getBoundingClientRect();
            bo.touchX = (e.clientX - rect.left) * (bo.canvas.width / rect.width);
        });

        document.getElementById('breakout-canvas').addEventListener('click', function() {
            if (bo.ball.stuck && bo.started) bo.ball.stuck = false;
        });
    }

    function launchBreakout() {
        var ov = document.getElementById('breakout-start-ov');
        if (ov) ov.style.display = 'none';
        bo.started = true;
        bo.ball.stuck = true;
        if (bo.animId) cancelAnimationFrame(bo.animId);
        gameLoop();
    }
    window.startBreakout = launchBreakout;

    function gameLoop() {
        if (!bo.started || bo.over) return;
        update();
        draw();
        bo.animId = requestAnimationFrame(gameLoop);
    }

    function update() {
        var W = bo.canvas.width, H = bo.canvas.height;
        var p = bo.paddle, b = bo.ball;

        // Paddle movement — keys take priority over touch position
        if (bo.keys['ArrowLeft']  || bo.keys['KeyA']) { p.x -= p.speed; bo.touchX = null; }
        else if (bo.keys['ArrowRight'] || bo.keys['KeyD']) { p.x += p.speed; bo.touchX = null; }
        else if (bo.touchX !== null) { p.x += (bo.touchX - p.w/2 - p.x) * 0.28; }
        p.x = Math.max(0, Math.min(W - p.w, p.x));

        if (b.stuck) { b.x = p.x + p.w/2; b.y = p.y - b.r - 1; return; }

        // Move ball
        b.x += b.vx; b.y += b.vy;

        // Wall bounces
        if (b.x - b.r < 0)  { b.x = b.r;      b.vx =  Math.abs(b.vx); }
        if (b.x + b.r > W)  { b.x = W - b.r;  b.vx = -Math.abs(b.vx); }
        if (b.y - b.r < 0)  { b.y = b.r;       b.vy =  Math.abs(b.vy); }

        // Paddle collision
        if (b.vy > 0 && b.y + b.r >= p.y && b.y + b.r <= p.y + p.h + 4 &&
            b.x >= p.x - b.r && b.x <= p.x + p.w + b.r) {
            var hit   = (b.x - (p.x + p.w/2)) / (p.w/2);
            var angle = hit * Math.PI * 0.38;
            var spd   = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
            spd = Math.max(spd, 4.5);
            b.vx = spd * Math.sin(angle);
            b.vy = -Math.abs(spd * Math.cos(angle));
            b.y  = p.y - b.r - 1;
            if (window.navigator.vibrate) navigator.vibrate(15);
        }

        // Brick collisions
        var liveBricks = 0;
        bo.bricks.forEach(function(br) {
            if (!br.alive) return;
            liveBricks++;
            if (b.x + b.r > br.x && b.x - b.r < br.x + br.w &&
                b.y + b.r > br.y && b.y - b.r < br.y + br.h) {

                br.hits--;
                if (br.hits <= 0) {
                    br.alive = false;
                    liveBricks--;
                    bo.score += 10 * bo.level;
                    if (Math.random() < 0.18) spawnPowerUp(br.x + br.w/2, br.y + br.h/2);
                } else {
                    br.color = '#888';
                }

                var overlapL = (b.x + b.r) - br.x;
                var overlapR = (br.x + br.w) - (b.x - b.r);
                var overlapT = (b.y + b.r) - br.y;
                var overlapB = (br.y + br.h) - (b.y - b.r);
                var minH = Math.min(overlapL, overlapR);
                var minV = Math.min(overlapT, overlapB);
                if (minH < minV) b.vx = -b.vx;
                else b.vy = -b.vy;

                updateBreakoutHUD();
            }
        });

        // Power-up updates
        bo.powerUps.forEach(function(pu) {
            if (!pu.active) return;
            pu.y += 2.5;
            if (pu.y > H) { pu.active = false; return; }
            if (pu.y + 8 > p.y && pu.y < p.y + p.h && pu.x > p.x && pu.x < p.x + p.w) {
                applyPowerUp(pu.type); pu.active = false;
            }
        });
        bo.powerUps = bo.powerUps.filter(function(pu) { return pu.active; });

        // Ball lost
        if (b.y - b.r > H) {
            bo.lives--;
            updateBreakoutHUD();
            if (bo.lives <= 0) { bo.over = true; endBreakout(false); return; }
            resetBall(); b.stuck = true;
        }

        // Level cleared
        if (liveBricks === 0) {
            bo.level++;
            if (bo.level > 5) { bo.over = true; endBreakout(true); }
            else { buildBricks(); resetBall(); bo.ball.stuck = true; }
        }
    }

    function spawnPowerUp(x, y) {
        var types = ['wide','slow','extra'];
        bo.powerUps.push({ x:x, y:y, type: types[Math.floor(Math.random()*3)], active: true });
    }

    function applyPowerUp(type) {
        var p = bo.paddle, W = bo.canvas.width;
        if (type === 'wide') {
            var orig = Math.round(W * 0.22);
            p.w = Math.min(W * 0.42, p.w * 1.5);
            clearTimeout(bo.activePowerUps.wide);
            bo.activePowerUps.wide = setTimeout(function() { p.w = orig; }, 8000);
        } else if (type === 'slow') {
            var s0 = Math.sqrt(bo.ball.vx*bo.ball.vx + bo.ball.vy*bo.ball.vy);
            bo.ball.vx *= 0.65; bo.ball.vy *= 0.65;
            clearTimeout(bo.activePowerUps.slow);
            bo.activePowerUps.slow = setTimeout(function() {
                var s1 = Math.sqrt(bo.ball.vx*bo.ball.vx + bo.ball.vy*bo.ball.vy);
                if (s1 > 0.1) { bo.ball.vx *= s0/s1; bo.ball.vy *= s0/s1; }
            }, 6000);
        } else if (type === 'extra') {
            bo.lives = Math.min(bo.lives + 1, 6);
            updateBreakoutHUD();
        }
    }

    function endBreakout(won) {
        if (bo.animId) { cancelAnimationFrame(bo.animId); bo.animId = null; }
        draw();
        var ov = document.getElementById('breakout-over');
        if (!ov) return;
        document.getElementById('bo-result-msg').textContent  = won ? '🏆 You beat all 5 levels!' : '💥 Game Over!';
        document.getElementById('bo-result-score').textContent = 'Score: ' + bo.score;
        ov.style.display = 'flex';
        if (window._saveScore) _saveScore('breakout', bo.score);
        if (window.GZAch) GZAch.recordGame('breakout', bo.score);
    }

    function updateBreakoutHUD() {
        var s = document.getElementById('bo-score');
        var l = document.getElementById('bo-lives');
        var lv = document.getElementById('bo-level');
        if (s)  s.textContent  = bo.score;
        if (l)  l.textContent  = '❤️'.repeat(Math.max(0, bo.lives));
        if (lv) lv.textContent = bo.level;
    }

    function draw() {
        if (!bo.ctx) return;
        var ctx = bo.ctx, W = bo.canvas.width, H = bo.canvas.height;

        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, W, H);

        // Bricks
        bo.bricks.forEach(function(br) {
            if (!br.alive) return;
            // Glow
            ctx.shadowColor = br.color; ctx.shadowBlur = 4;
            ctx.fillStyle = br.color;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(br.x, br.y, br.w, br.h, 3);
            else ctx.rect(br.x, br.y, br.w, br.h);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Highlight stripe
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(br.x + 2, br.y + 2, br.w - 4, Math.min(4, br.h * 0.3));
            if (br.hits > 1) {
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
                ctx.strokeRect(br.x + 3, br.y + 3, br.w - 6, br.h - 6);
            }
        });

        // Power-ups
        var puColors = { wide:'#00eeff', slow:'#aaffaa', extra:'#ff88aa' };
        var puLabel  = { wide:'W', slow:'S', extra:'+' };
        bo.powerUps.forEach(function(pu) {
            if (!pu.active) return;
            ctx.fillStyle = puColors[pu.type] || '#fff';
            ctx.shadowColor = puColors[pu.type]; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(pu.x, pu.y, 9, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000'; ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(puLabel[pu.type]||'?', pu.x, pu.y);
        });

        // Paddle
        var p = bo.paddle;
        var pg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
        pg.addColorStop(0, '#667eea'); pg.addColorStop(1, '#764ba2');
        ctx.shadowColor = '#667eea'; ctx.shadowBlur = 10;
        ctx.fillStyle = pg;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        else ctx.rect(p.x, p.y, p.w, p.h);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ball
        var b = bo.ball;
        var bg = ctx.createRadialGradient(b.x - b.r*0.3, b.y - b.r*0.3, b.r*0.1, b.x, b.y, b.r);
        bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#ffdd44');
        ctx.shadowColor = '#ffdd44'; ctx.shadowBlur = 12;
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        // Launch hint
        if (bo.ball.stuck && bo.started) {
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
            ctx.fillText('▶ Click / Space to launch!', W/2, H - 8);
        }
    }

    function drawBreakoutStartScreen() {
        var wrap = document.querySelector('.bo-wrap');
        if (!wrap) return;
        wrap.style.position = 'relative';
        var ov = document.getElementById('breakout-start-ov');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'breakout-start-ov';
            ov.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;border-radius:10px;color:#fff;text-align:center;';
            wrap.appendChild(ov);
        }
        ov.innerHTML = '<div style="font-size:3rem;">🧱</div>' +
            '<h2 style="color:#FFD700;font-size:1.8rem;margin:8px 0;">BREAKOUT</h2>' +
            '<p style="opacity:0.85;margin:4px 0;">Break all bricks &bull; 5 levels</p>' +
            '<p style="font-size:0.82rem;opacity:0.6;margin:4px 0;">Arrow Keys / Mouse / Touch to move</p>' +
            '<button onclick="startBreakout()" style="margin-top:18px;padding:12px 34px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:10px;font-size:1.05rem;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(102,126,234,0.5);">🏁 Start Game</button>';

        // Draw static bricks preview on canvas
        draw();
    }
}());
