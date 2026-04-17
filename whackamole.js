/* ============================================
   WHACK-A-MOLE GAME
   ============================================ */
(function() {
    var wam = {
        holes: 9, active: [], timers: [], score: 0,
        timeLeft: 30, gameTimer: null, running: false,
        combo: 0, maxCombo: 0, missed: 0, difficulty: 'medium'
    };

    var DIFF = {
        easy:   { showTime: 1200, spawnRate: 1400, maxActive: 2 },
        medium: { showTime: 850,  spawnRate: 900,  maxActive: 3 },
        hard:   { showTime: 550,  spawnRate: 600,  maxActive: 4 }
    };

    function initWhackAMole(diff) {
        diff = diff || wam.difficulty || 'medium';
        wam.difficulty = diff;
        wam.score = 0; wam.timeLeft = 30; wam.running = false;
        wam.combo = 0; wam.maxCombo = 0; wam.missed = 0;
        wam.active = new Array(wam.holes).fill(false);
        clearAllTimers();
        renderBoard();
        document.getElementById('wam-score').textContent = '0';
        document.getElementById('wam-time').textContent = '30';
        document.getElementById('wam-combo').textContent = 'x1';
        document.getElementById('wam-over').style.display = 'none';
        document.querySelectorAll('.wam-diff-btn').forEach(function(b) {
            b.classList.toggle('active', b.dataset.diff === diff);
        });
    }
    window.initWhackAMole = initWhackAMole;

    function clearAllTimers() {
        if (wam.gameTimer) { clearInterval(wam.gameTimer); wam.gameTimer = null; }
        wam.timers.forEach(function(t) { if (t) clearTimeout(t); });
        wam.timers = [];
    }

    function startWam() {
        if (wam.running) return;
        wam.running = true;
        document.getElementById('wam-start-btn').style.display = 'none';
        spawnMoles();
        wam.gameTimer = setInterval(function() {
            wam.timeLeft--;
            var el = document.getElementById('wam-time');
            if (el) el.textContent = wam.timeLeft;
            if (wam.timeLeft <= 0) endWam();
        }, 1000);
    }
    window.startWam = startWam;

    function spawnMoles() {
        if (!wam.running) return;
        var cfg = DIFF[wam.difficulty];
        var activeCount = wam.active.filter(Boolean).length;
        if (activeCount < cfg.maxActive) {
            var empties = [];
            wam.active.forEach(function(v, i) { if (!v) empties.push(i); });
            if (empties.length > 0) {
                var idx = empties[Math.floor(Math.random() * empties.length)];
                showMole(idx, cfg.showTime);
            }
        }
        var t = setTimeout(spawnMoles, cfg.spawnRate + Math.random() * 200 - 100);
        wam.timers.push(t);
    }

    function showMole(idx, duration) {
        if (!wam.running || wam.active[idx]) return;
        wam.active[idx] = true;
        var hole = document.querySelector('[data-hole="' + idx + '"]');
        if (!hole) return;
        hole.classList.add('active');
        hole.querySelector('.wam-mole').textContent = randomMole();

        var t = setTimeout(function() {
            if (wam.active[idx]) {
                hideMole(idx, true);
            }
        }, duration);
        wam.timers.push(t);
    }

    function hideMole(idx, missed) {
        wam.active[idx] = false;
        var hole = document.querySelector('[data-hole="' + idx + '"]');
        if (!hole) return;
        hole.classList.remove('active', 'whacked');
        if (missed && wam.running) {
            wam.combo = 0;
            wam.missed++;
            updateComboDisplay();
        }
    }

    function whack(idx) {
        if (!wam.running || !wam.active[idx]) return;
        wam.active[idx] = false;
        var hole = document.querySelector('[data-hole="' + idx + '"]');
        if (!hole) return;
        hole.classList.add('whacked');
        hole.classList.remove('active');
        setTimeout(function() { hole.classList.remove('whacked'); }, 300);

        wam.combo++;
        if (wam.combo > wam.maxCombo) wam.maxCombo = wam.combo;
        var pts = 10 * Math.min(wam.combo, 5);
        wam.score += pts;
        document.getElementById('wam-score').textContent = wam.score;
        updateComboDisplay();
        showFloatScore(hole, pts);
        if (window.playGameSound) playGameSound('score');
    }
    window.whack = whack;

    function updateComboDisplay() {
        var el = document.getElementById('wam-combo');
        if (el) {
            el.textContent = 'x' + Math.max(1, wam.combo);
            el.style.color = wam.combo >= 5 ? '#FFD700' : wam.combo >= 3 ? '#ff6b6b' : '#fff';
        }
    }

    function showFloatScore(hole, pts) {
        var f = document.createElement('div');
        f.className = 'wam-float';
        f.textContent = '+' + pts;
        hole.appendChild(f);
        setTimeout(function() { if (f.parentNode) f.parentNode.removeChild(f); }, 600);
    }

    function randomMole() {
        var moles = ['🐹', '🐭', '🐱', '🐸', '🐰'];
        return moles[Math.floor(Math.random() * moles.length)];
    }

    function renderBoard() {
        var grid = document.getElementById('wam-grid');
        if (!grid) return;
        grid.innerHTML = '';
        for (var i = 0; i < wam.holes; i++) {
            var hole = document.createElement('div');
            hole.className = 'wam-hole';
            hole.dataset.hole = i;
            hole.innerHTML = '<div class="wam-mole">🐹</div>';
            hole.addEventListener('click', (function(idx) {
                return function() { whack(idx); };
            })(i));
            hole.addEventListener('touchstart', (function(idx) {
                return function(e) { e.preventDefault(); whack(idx); };
            })(i), { passive: false });
            grid.appendChild(hole);
        }
    }

    function endWam() {
        clearAllTimers();
        wam.running = false;
        wam.active.fill(false);
        document.querySelectorAll('.wam-hole').forEach(function(h) {
            h.classList.remove('active', 'whacked');
        });
        var finalScore = wam.score + wam.maxCombo * 5;
        document.getElementById('wam-result-score').textContent = 'Score: ' + finalScore;
        document.getElementById('wam-result-combo').textContent = 'Max Combo: x' + wam.maxCombo + ' | Missed: ' + wam.missed;
        document.getElementById('wam-over').style.display = 'flex';
        if (window._saveScore) _saveScore('whackamole', finalScore);
        if (window.GZAch) GZAch.recordGame('whackamole', finalScore);
    }

    window.restartWam = function() {
        document.getElementById('wam-over').style.display = 'none';
        initWhackAMole(wam.difficulty);
    };

    window.setWamDiff = function(d) {
        initWhackAMole(d);
    };
})();
