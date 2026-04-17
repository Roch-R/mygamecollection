/* ============================================
   2048 GAME
   ============================================ */
(function() {
    var SIZE = 4;
    var state = { board: [], score: 0, best: 0, over: false, won: false };

    function init2048() {
        state.best = parseInt(localStorage.getItem('2048-best') || '0');
        state.score = 0; state.over = false; state.won = false;
        state.board = Array.from({length: SIZE}, () => Array(SIZE).fill(0));
        addTile(); addTile();
        render2048();
        document.getElementById('g2048-score').textContent = '0';
        document.getElementById('g2048-best').textContent = state.best;
        document.getElementById('g2048-over').style.display = 'none';
    }
    window.init2048 = init2048;

    function addTile() {
        var empty = [];
        state.board.forEach(function(row, r) {
            row.forEach(function(v, c) { if (!v) empty.push([r, c]); });
        });
        if (!empty.length) return;
        var [r, c] = empty[Math.floor(Math.random() * empty.length)];
        state.board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    function render2048() {
        var grid = document.getElementById('g2048-grid');
        if (!grid) return;
        grid.innerHTML = '';
        state.board.forEach(function(row) {
            row.forEach(function(v) {
                var cell = document.createElement('div');
                cell.className = 'g2048-cell' + (v ? ' v' + Math.min(v, 2048) : '');
                cell.textContent = v || '';
                grid.appendChild(cell);
            });
        });
        document.getElementById('g2048-score').textContent = state.score;
        document.getElementById('g2048-best').textContent = state.best;
    }

    function slide(row) {
        var arr = row.filter(Boolean), merged = false, result = [];
        for (var i = 0; i < arr.length; i++) {
            if (!merged && arr[i + 1] === arr[i]) {
                var val = arr[i] * 2;
                result.push(val);
                state.score += val;
                if (val > state.best) { state.best = val; localStorage.setItem('2048-best', val); }
                if (val === 2048 && !state.won) { state.won = true; }
                i++; merged = true;
            } else { result.push(arr[i]); merged = false; }
        }
        while (result.length < SIZE) result.push(0);
        return result;
    }

    function move(dir) {
        if (state.over) return;
        var b = state.board, changed = false;
        if (dir === 'left') {
            b = b.map(function(row) { var s = slide(row); if (s.join() !== row.join()) changed = true; return s; });
        } else if (dir === 'right') {
            b = b.map(function(row) { var rev = row.slice().reverse(), s = slide(rev).reverse(); if (s.join() !== row.join()) changed = true; return s; });
        } else if (dir === 'up') {
            for (var c = 0; c < SIZE; c++) {
                var col = b.map(function(r) { return r[c]; });
                var s = slide(col);
                s.forEach(function(v, r) { if (b[r][c] !== v) changed = true; b[r][c] = v; });
            }
        } else if (dir === 'down') {
            for (var c = 0; c < SIZE; c++) {
                var col = b.map(function(r) { return r[c]; }).reverse();
                var s = slide(col).reverse();
                s.forEach(function(v, r) { if (b[r][c] !== v) changed = true; b[r][c] = v; });
            }
        }
        state.board = b;
        if (changed) { addTile(); checkOver(); }
        render2048();
        if (window.GZAch) GZAch.recordGame('2048', state.score);
    }

    function checkOver() {
        for (var r = 0; r < SIZE; r++) {
            for (var c = 0; c < SIZE; c++) {
                if (!state.board[r][c]) return;
                if (c < SIZE-1 && state.board[r][c] === state.board[r][c+1]) return;
                if (r < SIZE-1 && state.board[r][c] === state.board[r+1][c]) return;
            }
        }
        state.over = true;
        document.getElementById('g2048-over').style.display = 'flex';
        if (window._saveScore) _saveScore('2048', state.score);
    }

    /* Keyboard */
    document.addEventListener('keydown', function(e) {
        if (!document.getElementById('game2048-game') || document.getElementById('game2048-game').classList.contains('hidden')) return;
        var map = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down', a:'left', d:'right', w:'up', s:'down' };
        if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    });

    /* Touch/swipe */
    var tx0, ty0;
    document.addEventListener('touchstart', function(e) {
        if (!document.getElementById('game2048-game') || document.getElementById('game2048-game').classList.contains('hidden')) return;
        if (!e.target.closest('#g2048-grid')) return;
        tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY;
    }, {passive:true});
    document.addEventListener('touchend', function(e) {
        if (!document.getElementById('game2048-game') || document.getElementById('game2048-game').classList.contains('hidden')) return;
        if (tx0 === undefined) return;
        var dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
        move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        tx0 = undefined;
    }, {passive:true});
})();
