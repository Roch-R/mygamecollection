/* ============================================
   SUDOKU GAME
   ============================================ */
(function() {
    var sdk = {
        board: [], solution: [], given: [],
        selected: null, mistakes: 0, startTime: null,
        timer: null, difficulty: 'easy', running: false
    };

    var REMOVE_COUNT = { easy: 30, medium: 42, hard: 52 };

    function initSudoku(diff) {
        diff = diff || sdk.difficulty || 'easy';
        sdk.difficulty = diff;
        clearInterval(sdk.timer);
        sdk.mistakes = 0; sdk.selected = null; sdk.running = true;
        sdk.startTime = Date.now();
        document.getElementById('sdk-over').style.display = 'none';
        document.getElementById('sdk-mistakes').textContent = '0';
        document.getElementById('sdk-time').textContent = '0:00';
        document.querySelectorAll('.sdk-diff-btn').forEach(function(b) {
            b.classList.toggle('active', b.dataset.diff === diff);
        });
        generatePuzzle(REMOVE_COUNT[diff]);
        renderBoard();
        sdk.timer = setInterval(function() {
            if (!sdk.running) return;
            var elapsed = Math.floor((Date.now() - sdk.startTime) / 1000);
            var m = Math.floor(elapsed / 60), s = elapsed % 60;
            var el = document.getElementById('sdk-time');
            if (el) el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
        }, 1000);
    }
    window.initSudoku = initSudoku;
    window._stopSudoku = function() { if (sdk.timer) { clearInterval(sdk.timer); sdk.timer = null; } sdk.running = false; };

    function generatePuzzle(removeCount) {
        // Start with solved board using backtracking
        var board = Array.from({ length: 9 }, function() { return new Array(9).fill(0); });
        fillBoard(board);
        sdk.solution = board.map(function(r) { return r.slice(); });

        // Remove cells
        var positions = [];
        for (var i = 0; i < 81; i++) positions.push(i);
        shuffle(positions);
        sdk.board = board.map(function(r) { return r.slice(); });
        for (var k = 0; k < removeCount; k++) {
            var pos = positions[k];
            sdk.board[Math.floor(pos / 9)][pos % 9] = 0;
        }
        sdk.given = sdk.board.map(function(r) { return r.slice(); });
    }

    function fillBoard(board) {
        var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (var i = 0; i < 81; i++) {
            var r = Math.floor(i / 9), c = i % 9;
            if (board[r][c] !== 0) continue;
            shuffle(nums);
            for (var n = 0; n < nums.length; n++) {
                if (isValid(board, r, c, nums[n])) {
                    board[r][c] = nums[n];
                    if (fillBoard(board)) return true;
                    board[r][c] = 0;
                }
            }
            return false;
        }
        return true;
    }

    function isValid(board, row, col, num) {
        for (var i = 0; i < 9; i++) {
            if (board[row][i] === num || board[i][col] === num) return false;
        }
        var br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
        for (var r = br; r < br + 3; r++) {
            for (var c = bc; c < bc + 3; c++) {
                if (board[r][c] === num) return false;
            }
        }
        return true;
    }

    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
    }

    function renderBoard() {
        var grid = document.getElementById('sdk-grid');
        if (!grid) return;
        grid.innerHTML = '';
        for (var r = 0; r < 9; r++) {
            for (var c = 0; c < 9; c++) {
                var cell = document.createElement('div');
                cell.className = 'sdk-cell';
                cell.dataset.r = r; cell.dataset.c = c;
                var isGiven = sdk.given[r][c] !== 0;
                if (isGiven) cell.classList.add('given');
                var val = sdk.board[r][c];
                if (val !== 0) cell.textContent = val;
                if (c === 2 || c === 5) cell.classList.add('border-right');
                if (r === 2 || r === 5) cell.classList.add('border-bottom');
                cell.addEventListener('click', function() { selectCell(+this.dataset.r, +this.dataset.c); });
                grid.appendChild(cell);
            }
        }
    }

    function selectCell(r, c) {
        sdk.selected = [r, c];
        document.querySelectorAll('.sdk-cell').forEach(function(el) {
            el.classList.remove('selected', 'highlight');
            var er = +el.dataset.r, ec = +el.dataset.c;
            if (er === r && ec === c) el.classList.add('selected');
            else if (er === r || ec === c ||
                (Math.floor(er / 3) === Math.floor(r / 3) && Math.floor(ec / 3) === Math.floor(c / 3))) {
                el.classList.add('highlight');
            }
        });
    }

    function placeNumber(num) {
        if (!sdk.selected || !sdk.running) return;
        var r = sdk.selected[0], c = sdk.selected[1];
        if (sdk.given[r][c] !== 0) return;
        if (num === 0) {
            sdk.board[r][c] = 0;
        } else {
            sdk.board[r][c] = num;
            if (num !== sdk.solution[r][c]) {
                sdk.mistakes++;
                document.getElementById('sdk-mistakes').textContent = sdk.mistakes;
                var cell = document.querySelector('.sdk-cell.selected');
                if (cell) { cell.classList.add('error'); setTimeout(function() { cell.classList.remove('error'); }, 700); }
                if (window.playGameSound) playGameSound('error');
                if (sdk.mistakes >= 5) { endSudoku(false); return; }
            } else {
                if (window.playGameSound) playGameSound('score');
                checkWin();
            }
        }
        var cells = document.querySelectorAll('.sdk-cell');
        cells.forEach(function(el) {
            var er = +el.dataset.r, ec = +el.dataset.c;
            if (er === r && ec === c) {
                el.textContent = sdk.board[r][c] || '';
                el.classList.remove('error');
            }
        });
    }
    window.placeNumber = placeNumber;

    function checkWin() {
        for (var r = 0; r < 9; r++) {
            for (var c = 0; c < 9; c++) {
                if (sdk.board[r][c] !== sdk.solution[r][c]) return;
            }
        }
        endSudoku(true);
    }

    function endSudoku(won) {
        clearInterval(sdk.timer);
        sdk.running = false;
        var elapsed = Math.floor((Date.now() - sdk.startTime) / 1000);
        var score = won ? Math.max(100, 1000 - elapsed * 2 - sdk.mistakes * 50) : 0;
        document.getElementById('sdk-result').textContent = won ? '🏆 Puzzle Solved!' : '❌ Too Many Mistakes!';
        document.getElementById('sdk-final-score').textContent = 'Score: ' + score + ' | Time: ' + Math.floor(elapsed / 60) + ':' + (elapsed % 60 < 10 ? '0' : '') + (elapsed % 60);
        document.getElementById('sdk-over').style.display = 'flex';
        if (won && window._saveScore) _saveScore('sudoku', score);
        if (window.GZAch) GZAch.recordGame('sudoku', score);
    }

    window.restartSudoku = function() {
        document.getElementById('sdk-over').style.display = 'none';
        initSudoku(sdk.difficulty);
    };

    window.setSudokuDiff = function(d) { initSudoku(d); };
})();
