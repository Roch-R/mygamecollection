/* ============================================
   SIMON SAYS GAME
   ============================================ */
(function() {
    var simon = {
        sequence: [], playerSeq: [], round: 0,
        running: false, accepting: false, score: 0,
        speed: 600, colors: ['red', 'blue', 'green', 'yellow']
    };

    var SOUNDS = { red: 220, blue: 330, green: 440, yellow: 550 };

    function initSimon() {
        simon.sequence = []; simon.playerSeq = []; simon.round = 0;
        simon.running = false; simon.accepting = false; simon.score = 0;
        simon.speed = 600;
        document.getElementById('simon-round').textContent = '0';
        document.getElementById('simon-score').textContent = '0';
        document.getElementById('simon-over').style.display = 'none';
        document.getElementById('simon-msg').textContent = 'Press Start to play!';
        setButtonsEnabled(false);
    }
    window.initSimon = initSimon;
    window._stopSimon = function() { simon.running = false; simon.accepting = false; };

    function startSimon() {
        simon.sequence = []; simon.playerSeq = []; simon.round = 0;
        simon.score = 0; simon.speed = 600;
        document.getElementById('simon-start-btn').style.display = 'none';
        document.getElementById('simon-over').style.display = 'none';
        nextRound();
    }
    window.startSimon = startSimon;

    function nextRound() {
        simon.round++;
        simon.playerSeq = [];
        simon.accepting = false;
        simon.speed = Math.max(250, 600 - simon.round * 18);
        document.getElementById('simon-round').textContent = simon.round;
        document.getElementById('simon-msg').textContent = 'Watch carefully...';
        setButtonsEnabled(false);

        var next = simon.colors[Math.floor(Math.random() * 4)];
        simon.sequence.push(next);

        setTimeout(function() { playSequence(0); }, 600);
    }

    function playSequence(i) {
        if (i >= simon.sequence.length) {
            setTimeout(function() {
                simon.accepting = true;
                document.getElementById('simon-msg').textContent = 'Your turn! (' + simon.sequence.length + ' steps)';
                setButtonsEnabled(true);
            }, 400);
            return;
        }
        var color = simon.sequence[i];
        flashButton(color, simon.speed * 0.7, function() {
            setTimeout(function() { playSequence(i + 1); }, simon.speed * 0.35);
        });
    }

    function flashButton(color, duration, cb) {
        var btn = document.querySelector('.simon-btn[data-color="' + color + '"]');
        if (!btn) { if (cb) cb(); return; }
        btn.classList.add('lit');
        playSimonSound(color);
        setTimeout(function() {
            btn.classList.remove('lit');
            if (cb) cb();
        }, duration);
    }

    function playSimonSound(color) {
        if (!window.gameAudioContext) return;
        try {
            var ctx = window.gameAudioContext;
            if (ctx.state === 'suspended') ctx.resume();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = SOUNDS[color];
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start(); osc.stop(ctx.currentTime + 0.35);
        } catch(e) {}
    }

    function pressSimon(color) {
        if (!simon.accepting) return;
        flashButton(color, 180, null);
        simon.playerSeq.push(color);
        var idx = simon.playerSeq.length - 1;

        if (simon.playerSeq[idx] !== simon.sequence[idx]) {
            // Wrong!
            simon.accepting = false;
            setButtonsEnabled(false);
            document.getElementById('simon-msg').textContent = '❌ Wrong! Game Over!';
            flashAllButtons(function() { endSimon(); });
            return;
        }

        if (simon.playerSeq.length === simon.sequence.length) {
            // Correct!
            simon.accepting = false;
            setButtonsEnabled(false);
            simon.score += simon.round * 10;
            document.getElementById('simon-score').textContent = simon.score;
            document.getElementById('simon-msg').textContent = '✅ Correct! +' + (simon.round * 10);
            if (window.playGameSound) playGameSound('success');
            setTimeout(nextRound, 900);
        }
    }
    window.pressSimon = pressSimon;

    function flashAllButtons(cb) {
        var btns = document.querySelectorAll('.simon-btn');
        btns.forEach(function(b) { b.classList.add('lit', 'wrong'); });
        if (window.playGameSound) playGameSound('gameover');
        setTimeout(function() {
            btns.forEach(function(b) { b.classList.remove('lit', 'wrong'); });
            if (cb) cb();
        }, 700);
    }

    function setButtonsEnabled(enabled) {
        document.querySelectorAll('.simon-btn').forEach(function(b) {
            b.style.pointerEvents = enabled ? 'auto' : 'none';
            b.style.opacity = enabled ? '1' : '0.6';
        });
    }

    function endSimon() {
        simon.running = false;
        document.getElementById('simon-result-round').textContent = 'Reached round ' + simon.round + ' — Score: ' + simon.score;
        document.getElementById('simon-over').style.display = 'flex';
        if (window._saveScore) _saveScore('simonsays', simon.score);
        if (window.GZAch) GZAch.recordGame('simonsays', simon.score);
    }

    window.restartSimon = function() {
        document.getElementById('simon-over').style.display = 'none';
        document.getElementById('simon-start-btn').style.display = '';
        initSimon();
    };
})();
