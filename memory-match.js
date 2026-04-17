/* ============================================
   MEMORY MATCH GAME
   ============================================ */
(function() {
    var EMOJIS = ['🐶','🐱','🐸','🦊','🐼','🦁','🐯','🐨','🦋','🐝','🦄','🐙','🦀','🐳','🦖','🦜','🍎','🍕'];

    var CONFIGS = {
        easy:   { cols: 4, pairs: 8  },
        medium: { cols: 5, pairs: 10 },
        hard:   { cols: 6, pairs: 12 },
    };

    var mm = {
        cards: [], flipped: [], matched: 0, moves: 0, pairs: 0,
        over: false, started: false, timer: 0, timerInt: null, diff: 'easy'
    };

    function initMemoryMatch(diff) {
        diff = diff || mm.diff || 'easy';
        mm.diff = diff;
        var cfg = CONFIGS[diff];
        mm.pairs = cfg.pairs;
        mm.flipped = []; mm.matched = 0; mm.moves = 0; mm.over = false; mm.started = false; mm.timer = 0;
        clearInterval(mm.timerInt);

        var pool = EMOJIS.slice(0, mm.pairs);
        var deck = pool.concat(pool);
        // Fisher-Yates shuffle
        for (var i = deck.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
        }

        mm.cards = deck.map(function(e, i) {
            return { id: i, emoji: e, revealed: false, matched: false };
        });

        renderMM(cfg.cols);
        document.getElementById('mm-moves').textContent = '0';
        document.getElementById('mm-timer').textContent = '0s';
        document.getElementById('mm-over').style.display = 'none';
        document.querySelectorAll('.mm-diff-btn').forEach(function(b) {
            b.classList.toggle('active', b.dataset.diff === diff);
        });
    }
    window.initMemoryMatch = initMemoryMatch;

    function startTimer() {
        if (mm.started) return;
        mm.started = true;
        mm.timerInt = setInterval(function() {
            mm.timer++;
            var el = document.getElementById('mm-timer');
            if (el) el.textContent = mm.timer + 's';
        }, 1000);
    }

    function flipCard(idx) {
        var card = mm.cards[idx];
        if (!card || card.revealed || card.matched || mm.over) return;
        if (mm.flipped.length >= 2) return;

        startTimer();
        card.revealed = true;
        mm.flipped.push(idx);
        renderMM(CONFIGS[mm.diff].cols);

        if (mm.flipped.length === 2) {
            mm.moves++;
            document.getElementById('mm-moves').textContent = mm.moves;
            var a = mm.cards[mm.flipped[0]], b = mm.cards[mm.flipped[1]];
            if (a.emoji === b.emoji) {
                a.matched = b.matched = true;
                mm.matched++;
                mm.flipped = [];
                renderMM(CONFIGS[mm.diff].cols);
                if (mm.matched === mm.pairs) {
                    mm.over = true;
                    clearInterval(mm.timerInt);
                    setTimeout(showMMWin, 400);
                }
            } else {
                setTimeout(function() {
                    a.revealed = b.revealed = false;
                    mm.flipped = [];
                    renderMM(CONFIGS[mm.diff].cols);
                }, 900);
            }
        }
    }

    function showMMWin() {
        var score = Math.max(0, 1000 - mm.timer * 5 - mm.moves * 10);
        var ov = document.getElementById('mm-over');
        if (!ov) return;
        document.getElementById('mm-result-msg').textContent = '🎉 You won in ' + mm.timer + 's & ' + mm.moves + ' moves!';
        document.getElementById('mm-result-score').textContent = 'Score: ' + score;
        ov.style.display = 'flex';
        if (window._saveScore) _saveScore('memorymatch', score);
        if (window.GZAch) GZAch.recordGame('memorymatch', score);
    }

    function renderMM(cols) {
        var grid = document.getElementById('mm-grid');
        if (!grid) return;
        grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
        grid.innerHTML = '';
        mm.cards.forEach(function(card) {
            var div = document.createElement('div');
            div.className = 'mm-card' + (card.revealed || card.matched ? ' mm-flipped' : '') + (card.matched ? ' mm-matched' : '');
            div.innerHTML = '<div class="mm-inner"><div class="mm-front">?</div><div class="mm-back">' + card.emoji + '</div></div>';
            div.addEventListener('click', function() { flipCard(card.id); });
            grid.appendChild(div);
        });
    }
})();
