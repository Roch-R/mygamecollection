/* ============================================
   PONG GAME
   ============================================ */
(function() {
    var W = 480, H = 320;
    var pong = {
        canvas: null, ctx: null, animId: null,
        playerY: 120, cpuY: 120, padH: 72, padW: 12,
        ballX: 240, ballY: 160, ballVX: 5, ballVY: 3,
        playerScore: 0, cpuScore: 0,
        running: false, started: false,
        _ctrlsSetup: false
    };

    function initPong() {
        if (pong.animId) { cancelAnimationFrame(pong.animId); pong.animId = null; }
        pong.canvas = document.getElementById('pong-canvas');
        pong.ctx = pong.canvas.getContext('2d');
        pong.canvas.width = W; pong.canvas.height = H;
        pong.playerScore = 0; pong.cpuScore = 0;
        pong.running = false; pong.started = false;
        document.getElementById('pong-player-score').textContent = '0';
        document.getElementById('pong-cpu-score').textContent = '0';
        document.getElementById('pong-over').style.display = 'none';
        resetBall();
        setupControls();
        drawStart();
    }
    window.initPong = initPong;

    function resetBall() {
        pong.ballX = W / 2; pong.ballY = H / 2;
        var dir = Math.random() > 0.5 ? 1 : -1;
        pong.ballVX = dir * 5;
        pong.ballVY = (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1);
        pong.playerY = H / 2 - pong.padH / 2;
        pong.cpuY = H / 2 - pong.padH / 2;
    }

    function setupControls() {
        if (pong._ctrlsSetup) return;
        pong._ctrlsSetup = true;
        document.addEventListener('mousemove', function(e) {
            if (!pong.running || !pong.canvas) return;
            var rect = pong.canvas.getBoundingClientRect();
            var scaleY = H / rect.height;
            pong.playerY = Math.max(0, Math.min(H - pong.padH, (e.clientY - rect.top) * scaleY - pong.padH / 2));
        });
        document.addEventListener('touchmove', function(e) {
            if (!pong.running || !pong.canvas) return;
            var rect = pong.canvas.getBoundingClientRect();
            var scaleY = H / rect.height;
            pong.playerY = Math.max(0, Math.min(H - pong.padH, (e.touches[0].clientY - rect.top) * scaleY - pong.padH / 2));
        }, { passive: true });
        document.addEventListener('keydown', function(e) {
            if (!pong.running) return;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') pong.playerY = Math.max(0, pong.playerY - 18);
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') pong.playerY = Math.min(H - pong.padH, pong.playerY + 18);
        });
    }

    function drawStart() {
        var c = pong.ctx;
        c.fillStyle = '#0a0a1a';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#fff';
        c.font = 'bold 36px "Press Start 2P", monospace';
        c.textAlign = 'center';
        c.fillText('PONG', W / 2, 100);
        c.font = '11px "Press Start 2P", monospace';
        c.fillStyle = '#aaa';
        c.fillText('Mouse / Arrow Keys / Touch', W / 2, 140);
        c.fillText('First to 7 points wins!', W / 2, 165);
        c.fillStyle = '#667eea';
        c.beginPath(); c.roundRect(W / 2 - 80, 190, 160, 46, 8); c.fill();
        c.fillStyle = '#fff';
        c.font = '12px "Press Start 2P", monospace';
        c.fillText('START', W / 2, 220);

        function onStart() {
            pong.canvas.removeEventListener('click', onStart);
            pong.canvas.removeEventListener('touchstart', onStart);
            pong.started = true; pong.running = true;
            gameLoop();
        }
        pong.canvas.addEventListener('click', onStart);
        pong.canvas.addEventListener('touchstart', onStart);
    }

    function gameLoop() {
        if (!pong.running) return;
        update();
        draw();
        pong.animId = requestAnimationFrame(gameLoop);
    }

    function update() {
        pong.ballX += pong.ballVX;
        pong.ballY += pong.ballVY;

        if (pong.ballY <= 8) { pong.ballY = 8; pong.ballVY = Math.abs(pong.ballVY); }
        if (pong.ballY >= H - 8) { pong.ballY = H - 8; pong.ballVY = -Math.abs(pong.ballVY); }

        // CPU AI
        var cpuCenter = pong.cpuY + pong.padH / 2;
        var cpuSpeed = 3.5 + (pong.playerScore + pong.cpuScore) * 0.1;
        if (pong.ballY < cpuCenter - 6) pong.cpuY -= Math.min(cpuSpeed, cpuCenter - pong.ballY);
        else if (pong.ballY > cpuCenter + 6) pong.cpuY += Math.min(cpuSpeed, pong.ballY - cpuCenter);
        pong.cpuY = Math.max(0, Math.min(H - pong.padH, pong.cpuY));

        // Player paddle hit (x=20)
        if (pong.ballVX < 0 && pong.ballX <= 20 + pong.padW + 8 && pong.ballX >= 20 &&
            pong.ballY >= pong.playerY && pong.ballY <= pong.playerY + pong.padH) {
            pong.ballX = 20 + pong.padW + 8;
            pong.ballVX = Math.abs(pong.ballVX) * 1.04;
            var rel = (pong.ballY - (pong.playerY + pong.padH / 2)) / (pong.padH / 2);
            pong.ballVY = rel * 7;
        }
        // CPU paddle hit (x=W-32)
        if (pong.ballVX > 0 && pong.ballX >= W - 32 - 8 && pong.ballX <= W - 20 &&
            pong.ballY >= pong.cpuY && pong.ballY <= pong.cpuY + pong.padH) {
            pong.ballX = W - 32 - 8;
            pong.ballVX = -Math.abs(pong.ballVX) * 1.04;
            var rel2 = (pong.ballY - (pong.cpuY + pong.padH / 2)) / (pong.padH / 2);
            pong.ballVY = rel2 * 7;
        }

        var speed = Math.sqrt(pong.ballVX * pong.ballVX + pong.ballVY * pong.ballVY);
        if (speed > 14) { pong.ballVX *= 14 / speed; pong.ballVY *= 14 / speed; }

        if (pong.ballX < 0) {
            pong.cpuScore++;
            document.getElementById('pong-cpu-score').textContent = pong.cpuScore;
            if (pong.cpuScore >= 7) { endPong(false); return; }
            resetBall();
        }
        if (pong.ballX > W) {
            pong.playerScore++;
            document.getElementById('pong-player-score').textContent = pong.playerScore;
            if (pong.playerScore >= 7) { endPong(true); return; }
            resetBall();
        }
    }

    function draw() {
        var c = pong.ctx;
        c.fillStyle = '#0a0a1a';
        c.fillRect(0, 0, W, H);

        c.setLineDash([10, 8]);
        c.strokeStyle = 'rgba(255,255,255,0.15)';
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke();
        c.setLineDash([]);

        // Player paddle
        c.fillStyle = '#667eea';
        c.shadowColor = '#667eea'; c.shadowBlur = 12;
        c.fillRect(20, pong.playerY, pong.padW, pong.padH);

        // CPU paddle
        c.fillStyle = '#ff6b6b';
        c.shadowColor = '#ff6b6b';
        c.fillRect(W - 32, pong.cpuY, pong.padW, pong.padH);

        // Ball
        c.fillStyle = '#fff';
        c.shadowColor = '#fff'; c.shadowBlur = 16;
        c.beginPath(); c.arc(pong.ballX, pong.ballY, 8, 0, Math.PI * 2); c.fill();
        c.shadowBlur = 0;
    }

    function endPong(won) {
        pong.running = false;
        cancelAnimationFrame(pong.animId);
        pong.animId = null;
        var score = won ? Math.max(100, 700 + (7 - pong.cpuScore) * 50) : 0;
        document.getElementById('pong-result').textContent = won ? '🏆 You Win!' : '💀 CPU Wins!';
        document.getElementById('pong-final-score').textContent = 'Score: ' + score;
        document.getElementById('pong-over').style.display = 'flex';
        if (score > 0 && window._saveScore) _saveScore('pong', score);
        if (window.GZAch) GZAch.recordGame('pong', score);
    }

    window.restartPong = function() {
        document.getElementById('pong-over').style.display = 'none';
        initPong();
    };
})();
