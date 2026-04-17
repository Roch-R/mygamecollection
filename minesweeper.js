/* ============================================
   MINESWEEPER GAME
   ============================================ */
(function() {
    var CONFIGS = {
        easy:   { rows: 9,  cols: 9,  mines: 10 },
        medium: { rows: 16, cols: 16, mines: 40 },
        hard:   { rows: 16, cols: 30, mines: 99 }
    };
    var ms = { board: [], rows: 9, cols: 9, mines: 10, revealed: 0, flagged: 0, over: false, won: false, started: false, timer: 0, timerInt: null };

    function initMinesweeper(diff) {
        diff = diff || 'easy';
        var cfg = CONFIGS[diff];
        ms.rows = cfg.rows; ms.cols = cfg.cols; ms.mines = cfg.mines;
        ms.revealed = 0; ms.flagged = 0; ms.over = false; ms.won = false; ms.started = false; ms.timer = 0;
        clearInterval(ms.timerInt);
        ms.board = Array.from({length: ms.rows}, function(_, r) {
            return Array.from({length: ms.cols}, function(_, c) {
                return { r, c, mine: false, revealed: false, flagged: false, count: 0 };
            });
        });
        renderMS();
        document.getElementById('ms-mines').textContent = ms.mines;
        document.getElementById('ms-timer').textContent = '0';
        document.getElementById('ms-face').textContent = '🙂';
        document.getElementById('ms-over').style.display = 'none';
        document.querySelectorAll('.ms-diff-btn').forEach(function(b) {
            b.classList.toggle('active', b.dataset.diff === diff);
        });
    }
    window.initMinesweeper = initMinesweeper;

    function placeMines(safeR, safeC) {
        var cells = [];
        ms.board.forEach(function(row) { row.forEach(function(c) { cells.push(c); }); });
        cells = cells.filter(function(c) { return Math.abs(c.r - safeR) > 1 || Math.abs(c.c - safeC) > 1; });
        for (var i = cells.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = cells[i]; cells[i] = cells[j]; cells[j] = tmp;
        }
        cells.slice(0, ms.mines).forEach(function(c) { ms.board[c.r][c.c].mine = true; });
        ms.board.forEach(function(row) {
            row.forEach(function(cell) {
                if (cell.mine) return;
                cell.count = neighbors(cell.r, cell.c).filter(function(n) { return n.mine; }).length;
            });
        });
    }

    function neighbors(r, c) {
        var res = [];
        for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            var nr = r+dr, nc = c+dc;
            if (nr >= 0 && nr < ms.rows && nc >= 0 && nc < ms.cols) res.push(ms.board[nr][nc]);
        }
        return res;
    }

    function reveal(r, c) {
        var cell = ms.board[r][c];
        if (cell.revealed || cell.flagged || ms.over) return;
        if (!ms.started) {
            ms.started = true;
            placeMines(r, c);
            ms.timerInt = setInterval(function() {
                ms.timer++;
                var el = document.getElementById('ms-timer');
                if (el) el.textContent = ms.timer;
            }, 1000);
        }
        cell.revealed = true; ms.revealed++;
        if (cell.mine) {
            ms.over = true;
            document.getElementById('ms-face').textContent = '😵';
            clearInterval(ms.timerInt);
            revealAllMines();
            setTimeout(function() { document.getElementById('ms-over').style.display = 'flex'; }, 500);
            renderMS(); return;
        }
        if (cell.count === 0) neighbors(r, c).forEach(function(n) { reveal(n.r, n.c); });
        var safe = ms.rows * ms.cols - ms.mines;
        if (ms.revealed === safe) { ms.won = true; ms.over = true; clearInterval(ms.timerInt); winMS(); }
        renderMS();
    }

    function flag(r, c) {
        var cell = ms.board[r][c];
        if (cell.revealed || ms.over) return;
        cell.flagged = !cell.flagged;
        ms.flagged += cell.flagged ? 1 : -1;
        document.getElementById('ms-mines').textContent = ms.mines - ms.flagged;
        renderMS();
    }

    function revealAllMines() {
        ms.board.forEach(function(row) { row.forEach(function(c) { if (c.mine) c.revealed = true; }); });
    }

    function winMS() {
        document.getElementById('ms-face').textContent = '😎';
        document.getElementById('ms-over').style.display = 'flex';
        if (window._saveScore) _saveScore('minesweeper', Math.max(0, 999 - ms.timer));
        if (window.GZAch) GZAch.recordGame('minesweeper', Math.max(0, 999 - ms.timer));
    }

    var COLORS = ['','#1a73e8','#388e3c','#d32f2f','#7b1fa2','#f57c00','#00838f','#424242','#9e9e9e'];

    function renderMS() {
        var grid = document.getElementById('ms-grid');
        if (!grid) return;
        grid.style.gridTemplateColumns = 'repeat(' + ms.cols + ', 28px)';
        grid.innerHTML = '';
        ms.board.forEach(function(row) {
            row.forEach(function(cell) {
                var div = document.createElement('div');
                div.className = 'ms-cell' + (cell.revealed ? ' ms-revealed' : '') + (cell.mine && cell.revealed ? ' ms-mine' : '');
                if (cell.revealed && !cell.mine && cell.count) {
                    div.textContent = cell.count;
                    div.style.color = COLORS[cell.count] || '#000';
                } else if (cell.flagged) {
                    div.textContent = '🚩';
                } else if (cell.mine && cell.revealed) {
                    div.textContent = '💣';
                }
                div.addEventListener('click', function() { reveal(cell.r, cell.c); });
                div.addEventListener('contextmenu', function(e) { e.preventDefault(); flag(cell.r, cell.c); });
                div.addEventListener('touchstart', function() { ms._longPress = setTimeout(function() { flag(cell.r, cell.c); renderMS(); }, 500); }, {passive:true});
                div.addEventListener('touchend', function() { clearTimeout(ms._longPress); }, {passive:true});
                grid.appendChild(div);
            });
        });
    }
})();
