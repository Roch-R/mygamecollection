/* ============================================
   AIR HOCKEY GAME
   ============================================ */
(function() {
    var W = 400, H = 560;
    var GOAL_W = 120, PAD_R = 28, PUCK_R = 16;
    var GOAL_X1 = (W - GOAL_W) / 2, GOAL_X2 = GOAL_X1 + GOAL_W;

    var ah = {
        canvas: null, ctx: null, animId: null,
        playerX: W / 2, playerY: H - 90,
        cpuX: W / 2, cpuY: 90,
        puckX: W / 2, puckY: H / 2, puckVX: 2, puckVY: 4,
        playerScore: 0, cpuScore: 0,
        running: false, started: false,
        mouseX: W / 2, mouseY: H - 90, _ctrlsSetup: false
    };

    function initAirHockey() {
        if (ah.animId) { cancelAnimationFrame(ah.animId); ah.animId = null; }
        ah.canvas = document.getElementById('airhockey-canvas');
        ah.ctx = ah.canvas.getContext('2d');
        ah.canvas.width = W; ah.canvas.height = H;
        ah.playerScore = 0; ah.cpuScore = 0;
        ah.running = false; ah.started = false;
        document.getElementById('ah-player-score').textContent = '0';
        document.getElementById('ah-cpu-score').textContent = '0';
        document.getElementById('ah-over').style.display = 'none';
        resetPuck(1);
        setupControls();
        drawStart();
    }
    window.initAirHockey = initAirHockey;
    window._stopAirHockey = function() { if (ah.animId) { cancelAnimationFrame(ah.animId); ah.animId = null; } ah.running = false; };

    function resetPuck(dir) {
        ah.puckX = W / 2; ah.puckY = H / 2;
        var angle = (Math.random() * 60 + 60) * Math.PI / 180;
        ah.puckVX = Math.cos(angle) * 5 * (Math.random() > 0.5 ? 1 : -1);
        ah.puckVY = Math.sin(angle) * 5 * dir;
        ah.playerX = W / 2; ah.playerY = H - 90;
        ah.cpuX = W / 2; ah.cpuY = 90;
    }

    function setupControls() {
        if (ah._ctrlsSetup) return;
        ah._ctrlsSetup = true;
        document.addEventListener('mousemove', function(e) {
            if (!ah.canvas || !ah.running) return;
            var rect = ah.canvas.getBoundingClientRect();
            var scaleX = W / rect.width, scaleY = H / rect.height;
            ah.mouseX = (e.clientX - rect.left) * scaleX;
            ah.mouseY = (e.clientY - rect.top) * scaleY;
        });
        document.addEventListener('touchmove', function(e) {
            if (!ah.canvas || !ah.running) return;
            var rect = ah.canvas.getBoundingClientRect();
            var scaleX = W / rect.width, scaleY = H / rect.height;
            ah.mouseX = (e.touches[0].clientX - rect.left) * scaleX;
            ah.mouseY = (e.touches[0].clientY - rect.top) * scaleY;
        }, { passive: true });
    }

    function drawStart() {
        var c = ah.ctx;
        drawRink(c);
        c.fillStyle = 'rgba(10,10,26,0.75)';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#fff';
        c.font = 'bold 30px "Press Start 2P", monospace';
        c.textAlign = 'center';
        c.fillText('AIR', W / 2, H / 2 - 60);
        c.fillText('HOCKEY', W / 2, H / 2 - 20);
        c.font = '10px "Press Start 2P", monospace';
        c.fillStyle = '#aaa';
        c.fillText('Move mouse / touch', W / 2, H / 2 + 20);
        c.fillText('to control your mallet', W / 2, H / 2 + 40);
        c.fillStyle = '#667eea';
        c.beginPath(); c.roundRect(W / 2 - 80, H / 2 + 65, 160, 44, 8); c.fill();
        c.fillStyle = '#fff';
        c.font = '11px "Press Start 2P", monospace';
        c.fillText('START', W / 2, H / 2 + 92);

        function onStart() {
            ah.canvas.removeEventListener('click', onStart);
            ah.canvas.removeEventListener('touchstart', onStart);
            ah.started = true; ah.running = true;
            gameLoop();
        }
        ah.canvas.addEventListener('click', onStart);
        ah.canvas.addEventListener('touchstart', onStart);
    }

    function gameLoop() {
        if (!ah.running) return;
        update();
        draw();
        ah.animId = requestAnimationFrame(gameLoop);
    }

    function update() {
        // Move player mallet toward mouse (smooth)
        ah.playerX += (ah.mouseX - ah.playerX) * 0.25;
        ah.playerY += (ah.mouseY - ah.playerY) * 0.25;
        // Clamp player to bottom half + walls
        ah.playerX = Math.max(PAD_R, Math.min(W - PAD_R, ah.playerX));
        ah.playerY = Math.max(H / 2 + 10, Math.min(H - PAD_R, ah.playerY));

        // CPU AI: track puck in top half
        var cpuSpeed = 4.5;
        ah.cpuX += Math.sign(ah.puckX - ah.cpuX) * Math.min(cpuSpeed, Math.abs(ah.puckX - ah.cpuX));
        ah.cpuY += Math.sign(ah.puckY < H / 2 ? ah.puckY : H / 3 - ah.cpuY) * Math.min(cpuSpeed, Math.abs(ah.puckY - ah.cpuY) * 0.5);
        ah.cpuX = Math.max(PAD_R, Math.min(W - PAD_R, ah.cpuX));
        ah.cpuY = Math.max(PAD_R, Math.min(H / 2 - 10, ah.cpuY));

        // Move puck
        ah.puckX += ah.puckVX;
        ah.puckY += ah.puckVY;

        // Wall bounces
        if (ah.puckX <= PUCK_R) { ah.puckX = PUCK_R; ah.puckVX = Math.abs(ah.puckVX); }
        if (ah.puckX >= W - PUCK_R) { ah.puckX = W - PUCK_R; ah.puckVX = -Math.abs(ah.puckVX); }

        // Goals (top and bottom)
        if (ah.puckY <= PUCK_R) {
            if (ah.puckX >= GOAL_X1 && ah.puckX <= GOAL_X2) {
                // Player scores!
                ah.playerScore++;
                document.getElementById('ah-player-score').textContent = ah.playerScore;
                if (ah.playerScore >= 7) { endAH(true); return; }
                resetPuck(-1); return;
            } else { ah.puckY = PUCK_R; ah.puckVY = Math.abs(ah.puckVY); }
        }
        if (ah.puckY >= H - PUCK_R) {
            if (ah.puckX >= GOAL_X1 && ah.puckX <= GOAL_X2) {
                // CPU scores!
                ah.cpuScore++;
                document.getElementById('ah-cpu-score').textContent = ah.cpuScore;
                if (ah.cpuScore >= 7) { endAH(false); return; }
                resetPuck(1); return;
            } else { ah.puckY = H - PUCK_R; ah.puckVY = -Math.abs(ah.puckVY); }
        }

        // Puck vs player mallet collision
        collideMallet(ah.playerX, ah.playerY, true);
        collideMallet(ah.cpuX, ah.cpuY, false);

        // Speed cap
        var speed = Math.sqrt(ah.puckVX * ah.puckVX + ah.puckVY * ah.puckVY);
        if (speed > 14) { ah.puckVX *= 14 / speed; ah.puckVY *= 14 / speed; }
        if (speed < 3 && speed > 0) { ah.puckVX *= 3 / speed; ah.puckVY *= 3 / speed; }
    }

    function collideMallet(mx, my, isPlayer) {
        var dx = ah.puckX - mx, dy = ah.puckY - my;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var minDist = PAD_R + PUCK_R;
        if (dist < minDist && dist > 0) {
            var nx = dx / dist, ny = dy / dist;
            ah.puckX = mx + nx * minDist;
            ah.puckY = my + ny * minDist;
            var dot = ah.puckVX * nx + ah.puckVY * ny;
            ah.puckVX -= 2 * dot * nx;
            ah.puckVY -= 2 * dot * ny;
            var boost = isPlayer ? 1.15 : 1.05;
            ah.puckVX *= boost; ah.puckVY *= boost;
        }
    }

    function draw() {
        var c = ah.ctx;
        drawRink(c);

        // Mallets
        drawMallet(c, ah.playerX, ah.playerY, '#667eea', '#4455cc');
        drawMallet(c, ah.cpuX, ah.cpuY, '#ff6b6b', '#cc3333');

        // Puck
        c.fillStyle = '#222';
        c.shadowColor = '#000'; c.shadowBlur = 6;
        c.beginPath(); c.arc(ah.puckX, ah.puckY, PUCK_R, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#aaa'; c.lineWidth = 2;
        c.beginPath(); c.arc(ah.puckX, ah.puckY, PUCK_R, 0, Math.PI * 2); c.stroke();
        c.shadowBlur = 0;
    }

    function drawMallet(c, x, y, col, inner) {
        c.fillStyle = col;
        c.shadowColor = col; c.shadowBlur = 12;
        c.beginPath(); c.arc(x, y, PAD_R, 0, Math.PI * 2); c.fill();
        c.fillStyle = inner;
        c.beginPath(); c.arc(x, y, PAD_R * 0.45, 0, Math.PI * 2); c.fill();
        c.shadowBlur = 0;
    }

    function drawRink(c) {
        c.fillStyle = '#0a2a3a';
        c.fillRect(0, 0, W, H);
        // Ice surface
        c.fillStyle = '#e8f4ff';
        c.fillRect(4, 4, W - 8, H - 8);
        // Center line
        c.strokeStyle = '#b0c8e0'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke();
        // Center circle
        c.strokeStyle = '#aac0d8'; c.lineWidth = 2;
        c.beginPath(); c.arc(W / 2, H / 2, 55, 0, Math.PI * 2); c.stroke();
        // Goal posts
        c.fillStyle = '#e03030';
        c.fillRect(GOAL_X1, 0, GOAL_W, 8);
        c.fillStyle = '#3030e0';
        c.fillRect(GOAL_X1, H - 8, GOAL_W, 8);
    }

    function endAH(won) {
        ah.running = false;
        cancelAnimationFrame(ah.animId); ah.animId = null;
        var score = won ? Math.max(100, 700 + (7 - ah.cpuScore) * 50) : 50;
        document.getElementById('ah-result').textContent = won ? '🏆 You Win!' : '💀 CPU Wins!';
        document.getElementById('ah-final-score').textContent = 'Score: ' + score;
        document.getElementById('ah-over').style.display = 'flex';
        if (won && window._saveScore) _saveScore('airhockey', score);
        if (window.GZAch) GZAch.recordGame('airhockey', score);
    }

    window.restartAirHockey = function() {
        document.getElementById('ah-over').style.display = 'none';
        initAirHockey();
    };
})();
