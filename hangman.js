/* ============================================
   HANGMAN GAME
   ============================================ */
(function() {
    var WORDS = {
        animals:  ['ELEPHANT','DOLPHIN','GIRAFFE','PENGUIN','KANGAROO','CHEETAH','OCTOPUS','BUTTERFLY','CROCODILE','FLAMINGO'],
        tech:     ['JAVASCRIPT','COMPUTER','KEYBOARD','MONITOR','INTERNET','DATABASE','ALGORITHM','WIRELESS','MICROCHIP','SOFTWARE'],
        food:     ['SPAGHETTI','CHOCOLATE','PINEAPPLE','AVOCADO','SANDWICH','BLUEBERRY','MUSHROOM','BROCCOLI','CINNAMON','CROISSANT'],
        sports:   ['BASKETBALL','FOOTBALL','SWIMMING','ARCHERY','GYMNASTICS','BASEBALL','VOLLEYBALL','BADMINTON','WRESTLING','MARATHON']
    };
    var CATEGORIES = Object.keys(WORDS);

    var hm = {
        word: '', guessed: [], wrong: 0, maxWrong: 6,
        running: false, score: 0, streak: 0, category: ''
    };

    function initHangman() {
        hm.running = false; hm.score = 0; hm.streak = 0;
        document.getElementById('hm-score').textContent = '0';
        document.getElementById('hm-streak').textContent = '0';
        document.getElementById('hm-over').style.display = 'none';
        pickWord();
        renderAll();
    }
    window.initHangman = initHangman;

    function pickWord() {
        hm.category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        var pool = WORDS[hm.category];
        hm.word = pool[Math.floor(Math.random() * pool.length)];
        hm.guessed = []; hm.wrong = 0; hm.running = true;
    }

    function renderAll() {
        renderCanvas();
        renderWord();
        renderLetters();
        var catEl = document.getElementById('hm-category');
        if (catEl) catEl.textContent = 'Category: ' + hm.category.charAt(0).toUpperCase() + hm.category.slice(1);
        var errEl = document.getElementById('hm-errors');
        if (errEl) errEl.textContent = hm.wrong + ' / ' + hm.maxWrong;
    }

    function renderWord() {
        var el = document.getElementById('hm-word');
        if (!el) return;
        el.innerHTML = hm.word.split('').map(function(ch) {
            return '<span class="hm-letter' + (hm.guessed.indexOf(ch) >= 0 ? ' revealed' : '') + '">' +
                (hm.guessed.indexOf(ch) >= 0 ? ch : '_') + '</span>';
        }).join('');
    }

    function renderLetters() {
        var el = document.getElementById('hm-letters');
        if (!el) return;
        el.innerHTML = '';
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function(ch) {
            var btn = document.createElement('button');
            btn.className = 'hm-key';
            btn.textContent = ch;
            var guessed = hm.guessed.indexOf(ch) >= 0;
            var correct = hm.word.indexOf(ch) >= 0;
            if (guessed) btn.classList.add(correct ? 'correct' : 'wrong');
            btn.disabled = guessed || !hm.running;
            btn.addEventListener('click', function() { guessLetter(ch); });
            el.appendChild(btn);
        });
    }

    function guessLetter(ch) {
        if (!hm.running || hm.guessed.indexOf(ch) >= 0) return;
        hm.guessed.push(ch);
        if (hm.word.indexOf(ch) < 0) {
            hm.wrong++;
            if (window.playGameSound) playGameSound('error');
        } else {
            if (window.playGameSound) playGameSound('score');
        }
        renderAll();
        checkEnd();
    }

    function checkEnd() {
        var allRevealed = hm.word.split('').every(function(ch) { return hm.guessed.indexOf(ch) >= 0; });
        if (allRevealed) {
            hm.running = false;
            hm.streak++;
            hm.score += (hm.maxWrong - hm.wrong) * 50 + hm.streak * 20;
            document.getElementById('hm-score').textContent = hm.score;
            document.getElementById('hm-streak').textContent = hm.streak;
            if (window.playGameSound) playGameSound('levelup');
            setTimeout(function() {
                document.getElementById('hm-msg').textContent = '✅ ' + hm.word + '!';
                setTimeout(function() {
                    document.getElementById('hm-msg').textContent = '';
                    pickWord(); renderAll();
                }, 1200);
            }, 200);
            return;
        }
        if (hm.wrong >= hm.maxWrong) {
            hm.running = false;
            hm.streak = 0;
            if (window.playGameSound) playGameSound('gameover');
            revealWord();
            setTimeout(function() {
                document.getElementById('hm-result-word').textContent = 'The word was: ' + hm.word;
                document.getElementById('hm-result-score').textContent = 'Score: ' + hm.score;
                document.getElementById('hm-over').style.display = 'flex';
                if (window._saveScore) _saveScore('hangman', hm.score);
                if (window.GZAch) GZAch.recordGame('hangman', hm.score);
            }, 600);
        }
    }

    function revealWord() {
        hm.word.split('').forEach(function(ch) {
            if (hm.guessed.indexOf(ch) < 0) hm.guessed.push(ch);
        });
        renderWord();
    }

    function renderCanvas() {
        var canvas = document.getElementById('hm-canvas');
        if (!canvas) return;
        var c = canvas.getContext('2d');
        c.clearRect(0, 0, 200, 220);
        c.strokeStyle = '#aaa'; c.lineWidth = 3; c.lineCap = 'round';

        // Gallows
        c.beginPath();
        c.moveTo(20, 210); c.lineTo(180, 210);
        c.moveTo(60, 210); c.lineTo(60, 20);
        c.moveTo(60, 20); c.lineTo(130, 20);
        c.moveTo(130, 20); c.lineTo(130, 45);
        c.stroke();

        c.strokeStyle = '#ff6b6b';
        var w = hm.wrong;
        if (w >= 1) { // head
            c.beginPath(); c.arc(130, 60, 16, 0, Math.PI * 2); c.stroke();
        }
        if (w >= 2) { // body
            c.beginPath(); c.moveTo(130, 76); c.lineTo(130, 140); c.stroke();
        }
        if (w >= 3) { // left arm
            c.beginPath(); c.moveTo(130, 95); c.lineTo(100, 120); c.stroke();
        }
        if (w >= 4) { // right arm
            c.beginPath(); c.moveTo(130, 95); c.lineTo(160, 120); c.stroke();
        }
        if (w >= 5) { // left leg
            c.beginPath(); c.moveTo(130, 140); c.lineTo(105, 175); c.stroke();
        }
        if (w >= 6) { // right leg
            c.beginPath(); c.moveTo(130, 140); c.lineTo(155, 175); c.stroke();
        }
    }

    window.restartHangman = function() {
        document.getElementById('hm-over').style.display = 'none';
        initHangman();
    };
})();
