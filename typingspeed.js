/* ============================================
   TYPING SPEED TEST
   ============================================ */
(function() {
    var PASSAGES = [
        'The quick brown fox jumps over the lazy dog near the riverbank every single morning.',
        'Practice makes perfect and consistency is the key to mastering any skill in life.',
        'Technology has changed the way we communicate work and enjoy our daily lives forever.',
        'The sun rises in the east and sets in the west painting the sky with beautiful colors.',
        'Learning to type fast and accurately is one of the most valuable skills you can develop.',
        'A journey of a thousand miles begins with a single step taken with confidence and courage.',
        'Music is the universal language of mankind that connects people across all cultures and borders.',
        'The best way to predict the future is to create it with hard work and determination.',
        'Reading books expands your mind improves your vocabulary and helps you understand the world better.',
        'Kindness costs nothing but means everything to the person who receives it unexpectedly today.'
    ];

    var ts = {
        text: '', typed: '', startTime: null, endTime: null,
        running: false, timer: null, timeLeft: 60, wpm: 0, accuracy: 0
    };

    function initTypingSpeed() {
        clearInterval(ts.timer);
        ts.text = ''; ts.typed = ''; ts.startTime = null;
        ts.running = false; ts.timeLeft = 60; ts.wpm = 0; ts.accuracy = 0;
        document.getElementById('ts-over').style.display = 'none';
        document.getElementById('ts-wpm').textContent = '0';
        document.getElementById('ts-accuracy').textContent = '100%';
        document.getElementById('ts-time').textContent = '60';
        pickPassage();
        renderText();
        var input = document.getElementById('ts-input');
        if (input) { input.value = ''; input.disabled = false; input.focus(); }
        document.getElementById('ts-start-btn').style.display = '';
    }
    window.initTypingSpeed = initTypingSpeed;
    window._stopTypingSpeed = function() { if (ts.timer) { clearInterval(ts.timer); ts.timer = null; } ts.running = false; };

    function pickPassage() {
        ts.text = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    }

    function renderText() {
        var el = document.getElementById('ts-text-display');
        if (!el) return;
        var typed = ts.typed;
        var html = '';
        for (var i = 0; i < ts.text.length; i++) {
            var ch = ts.text[i];
            if (i < typed.length) {
                var match = typed[i] === ch;
                html += '<span class="ts-char ' + (match ? 'correct' : 'wrong') + '">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>';
            } else if (i === typed.length) {
                html += '<span class="ts-char cursor">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>';
            } else {
                html += '<span class="ts-char">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>';
            }
        }
        el.innerHTML = html;
    }

    function startTyping() {
        ts.startTime = Date.now();
        ts.running = true;
        document.getElementById('ts-start-btn').style.display = 'none';
        ts.timer = setInterval(function() {
            ts.timeLeft--;
            var el = document.getElementById('ts-time');
            if (el) el.textContent = ts.timeLeft;
            calcStats();
            if (ts.timeLeft <= 0) endTyping();
        }, 1000);
    }
    window.startTyping = startTyping;

    function onTypingInput(e) {
        if (!ts.running) { startTyping(); }
        ts.typed = e.target.value;
        renderText();
        calcStats();
        if (ts.typed.length >= ts.text.length) endTyping();
    }
    window.onTypingInput = onTypingInput;

    function calcStats() {
        if (!ts.startTime) return;
        var elapsed = (Date.now() - ts.startTime) / 1000 / 60;
        var words = ts.typed.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;
        ts.wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;

        var correct = 0;
        for (var i = 0; i < Math.min(ts.typed.length, ts.text.length); i++) {
            if (ts.typed[i] === ts.text[i]) correct++;
        }
        ts.accuracy = ts.typed.length > 0 ? Math.round(correct / ts.typed.length * 100) : 100;

        var wpmEl = document.getElementById('ts-wpm');
        var accEl = document.getElementById('ts-accuracy');
        if (wpmEl) wpmEl.textContent = ts.wpm;
        if (accEl) accEl.textContent = ts.accuracy + '%';
    }

    function endTyping() {
        clearInterval(ts.timer);
        ts.running = false;
        var input = document.getElementById('ts-input');
        if (input) input.disabled = true;
        calcStats();
        var score = Math.round(ts.wpm * (ts.accuracy / 100) * 10);
        document.getElementById('ts-result-wpm').textContent = ts.wpm + ' WPM — ' + ts.accuracy + '% accuracy';
        document.getElementById('ts-result-score').textContent = 'Score: ' + score;
        document.getElementById('ts-over').style.display = 'flex';
        if (window._saveScore) _saveScore('typingspeed', score);
        if (window.GZAch) GZAch.recordGame('typingspeed', score);
    }

    window.restartTyping = function() {
        document.getElementById('ts-over').style.display = 'none';
        initTypingSpeed();
    };
})();
