/* ============================================
   CHESS GAME (Player vs CPU)
   ============================================ */
(function() {
    // Piece codes: uppercase = white, lowercase = black
    // K/k=king, Q/q=queen, R/r=rook, B/b=bishop, N/n=knight, P/p=pawn
    var INIT_BOARD = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];

    var PIECE_VALUES = { p:1, n:3, b:3, r:5, q:9, k:100 };

    var ch = {
        board: [], selected: null, highlights: [],
        turn: 'white', running: false, thinking: false,
        whiteScore: 0, blackScore: 0, moveCount: 0,
        status: '', enPassant: null,
        castling: { K: true, Q: true, k: true, q: true }
    };

    function initChess() {
        ch.board = INIT_BOARD.map(function(r) { return r.slice(); });
        ch.selected = null; ch.highlights = [];
        ch.turn = 'white'; ch.running = true; ch.thinking = false;
        ch.moveCount = 0; ch.status = '';
        ch.enPassant = null;
        ch.castling = { K: true, Q: true, k: true, q: true };
        document.getElementById('chess-over').style.display = 'none';
        document.getElementById('chess-status').textContent = 'Your turn (White)';
        renderChess();
    }
    window.initChess = initChess;

    function isWhite(p) { return p && p === p.toUpperCase(); }
    function isBlack(p) { return p && p === p.toLowerCase(); }
    function pieceColor(p) { return p ? (isWhite(p) ? 'white' : 'black') : null; }

    function getMoves(board, r, c, enPassant, castling) {
        var piece = board[r][c];
        if (!piece) return [];
        var moves = [];
        var pt = piece.toLowerCase();
        var color = pieceColor(piece);
        var isW = color === 'white';

        function addIfValid(tr, tc) {
            if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false;
            var target = board[tr][tc];
            if (target && pieceColor(target) === color) return false;
            moves.push([tr, tc]);
            return !target; // continue sliding if empty
        }

        function slide(dr, dc) {
            for (var i = 1; i < 8; i++) {
                if (!addIfValid(r + dr * i, c + dc * i)) break;
            }
        }

        if (pt === 'p') {
            var dir = isW ? -1 : 1;
            var startRow = isW ? 6 : 1;
            // Forward
            if (!board[r + dir] || !board[r + dir][c]) {
                moves.push([r + dir, c]);
                if (r === startRow && (!board[r + 2 * dir] || !board[r + 2 * dir][c])) {
                    moves.push([r + 2 * dir, c]);
                }
            }
            // Captures
            [-1, 1].forEach(function(dc) {
                var tr = r + dir, tc = c + dc;
                if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
                    if (board[tr][tc] && pieceColor(board[tr][tc]) !== color) moves.push([tr, tc]);
                    if (enPassant && enPassant[0] === tr && enPassant[1] === tc) moves.push([tr, tc]);
                }
            });
        } else if (pt === 'n') {
            [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(function(d) { addIfValid(r+d[0],c+d[1]); });
        } else if (pt === 'b') {
            [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(function(d) { slide(d[0],d[1]); });
        } else if (pt === 'r') {
            [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d) { slide(d[0],d[1]); });
        } else if (pt === 'q') {
            [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d) { slide(d[0],d[1]); });
        } else if (pt === 'k') {
            [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(function(d) { addIfValid(r+d[0],c+d[1]); });
            // Castling
            if (castling) {
                var row = isW ? 7 : 0;
                if (r === row && c === 4) {
                    if ((isW ? castling.K : castling.k) && !board[row][5] && !board[row][6] && board[row][7] === (isW?'R':'r'))
                        moves.push([row, 6]);
                    if ((isW ? castling.Q : castling.q) && !board[row][3] && !board[row][2] && !board[row][1] && board[row][0] === (isW?'R':'r'))
                        moves.push([row, 2]);
                }
            }
        }
        return moves;
    }

    function applyMove(board, from, to, enPassant, castling) {
        var b = board.map(function(r) { return r.slice(); });
        var piece = b[from[0]][from[1]];
        var newEP = null;
        var newCastling = Object.assign({}, castling);

        // Castling
        if (piece.toLowerCase() === 'k') {
            if (to[1] === 6 && from[1] === 4) { // king-side
                b[from[0]][5] = b[from[0]][7]; b[from[0]][7] = 0;
            }
            if (to[1] === 2 && from[1] === 4) { // queen-side
                b[from[0]][3] = b[from[0]][0]; b[from[0]][0] = 0;
            }
            if (isWhite(piece)) { newCastling.K = false; newCastling.Q = false; }
            else { newCastling.k = false; newCastling.q = false; }
        }
        if (piece === 'R') {
            if (from[1] === 7) newCastling.K = false;
            if (from[1] === 0) newCastling.Q = false;
        }
        if (piece === 'r') {
            if (from[1] === 7) newCastling.k = false;
            if (from[1] === 0) newCastling.q = false;
        }

        // En passant capture
        if (piece.toLowerCase() === 'p' && enPassant && to[0] === enPassant[0] && to[1] === enPassant[1]) {
            var capRow = isWhite(piece) ? to[0] + 1 : to[0] - 1;
            b[capRow][to[1]] = 0;
        }

        // Track en passant
        if (piece.toLowerCase() === 'p' && Math.abs(to[0] - from[0]) === 2) {
            newEP = [(from[0] + to[0]) / 2, to[1]];
        }

        b[to[0]][to[1]] = piece;
        b[from[0]][from[1]] = 0;

        // Promotion
        if (piece === 'P' && to[0] === 0) b[to[0]][to[1]] = 'Q';
        if (piece === 'p' && to[0] === 7) b[to[0]][to[1]] = 'q';

        return { board: b, enPassant: newEP, castling: newCastling };
    }

    function findKing(board, color) {
        var king = color === 'white' ? 'K' : 'k';
        for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) if (board[r][c] === king) return [r, c];
        return null;
    }

    function isInCheck(board, color, enPassant, castling) {
        var kingPos = findKing(board, color);
        if (!kingPos) return true;
        var opp = color === 'white' ? 'black' : 'white';
        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                if (board[r][c] && pieceColor(board[r][c]) === opp) {
                    var moves = getMoves(board, r, c, enPassant, null);
                    for (var i = 0; i < moves.length; i++) {
                        if (moves[i][0] === kingPos[0] && moves[i][1] === kingPos[1]) return true;
                    }
                }
            }
        }
        return false;
    }

    function getLegalMoves(board, r, c, enPassant, castling) {
        var color = pieceColor(board[r][c]);
        if (!color) return [];
        var pseudo = getMoves(board, r, c, enPassant, castling);
        return pseudo.filter(function(to) {
            var result = applyMove(board, [r, c], to, enPassant, castling);
            return !isInCheck(result.board, color, result.enPassant, result.castling);
        });
    }

    function hasLegalMoves(board, color, enPassant, castling) {
        for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
            if (pieceColor(board[r][c]) === color && getLegalMoves(board, r, c, enPassant, castling).length > 0) return true;
        }
        return false;
    }

    function evalBoard(board) {
        var score = 0;
        var CENTER_BONUS = [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,1,1,1,1,0,0],[0,0,1,2,2,1,0,0],[0,0,1,2,2,1,0,0],[0,0,1,1,1,1,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]];
        for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
            var p = board[r][c];
            if (!p) continue;
            var val = (PIECE_VALUES[p.toLowerCase()] || 0) * 10 + CENTER_BONUS[r][c];
            score += isWhite(p) ? val : -val;
        }
        return score;
    }

    function minimax(board, depth, alpha, beta, maximizing, enPassant, castling) {
        if (depth === 0) return evalBoard(board);
        var color = maximizing ? 'white' : 'black';
        var moves = [];
        for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
            if (pieceColor(board[r][c]) === color) {
                var lm = getLegalMoves(board, r, c, enPassant, castling);
                lm.forEach(function(to) { moves.push({ from: [r, c], to: to }); });
            }
        }
        if (moves.length === 0) return isInCheck(board, color, enPassant, castling) ? (maximizing ? -9000 : 9000) : 0;

        if (maximizing) {
            var best = -Infinity;
            for (var i = 0; i < moves.length; i++) {
                var res = applyMove(board, moves[i].from, moves[i].to, enPassant, castling);
                var val = minimax(res.board, depth - 1, alpha, beta, false, res.enPassant, res.castling);
                if (val > best) best = val;
                if (val > alpha) alpha = val;
                if (beta <= alpha) break;
            }
            return best;
        } else {
            var best2 = Infinity;
            for (var j = 0; j < moves.length; j++) {
                var res2 = applyMove(board, moves[j].from, moves[j].to, enPassant, castling);
                var val2 = minimax(res2.board, depth - 1, alpha, beta, true, res2.enPassant, res2.castling);
                if (val2 < best2) best2 = val2;
                if (val2 < beta) beta = val2;
                if (beta <= alpha) break;
            }
            return best2;
        }
    }

    function cpuMove() {
        ch.thinking = true;
        document.getElementById('chess-status').textContent = 'CPU thinking...';
        setTimeout(function() {
            var allMoves = [];
            for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
                if (pieceColor(ch.board[r][c]) === 'black') {
                    var lm = getLegalMoves(ch.board, r, c, ch.enPassant, ch.castling);
                    lm.forEach(function(to) { allMoves.push({ from: [r, c], to: to }); });
                }
            }
            if (allMoves.length === 0) {
                var inCheck = isInCheck(ch.board, 'black', ch.enPassant, ch.castling);
                endChess(inCheck ? 'White wins by checkmate!' : 'Stalemate — Draw!');
                return;
            }
            var best = null, bestScore = Infinity;
            for (var i = 0; i < allMoves.length; i++) {
                var res = applyMove(ch.board, allMoves[i].from, allMoves[i].to, ch.enPassant, ch.castling);
                var score = minimax(res.board, 2, -Infinity, Infinity, true, res.enPassant, res.castling);
                if (score < bestScore) { bestScore = score; best = allMoves[i]; best.result = res; }
            }
            if (best) {
                ch.board = best.result.board;
                ch.enPassant = best.result.enPassant;
                ch.castling = best.result.castling;
            }
            ch.thinking = false;
            ch.turn = 'white';
            renderChess();
            document.getElementById('chess-status').textContent = 'Your turn (White)';
            if (!hasLegalMoves(ch.board, 'white', ch.enPassant, ch.castling)) {
                var inChk = isInCheck(ch.board, 'white', ch.enPassant, ch.castling);
                endChess(inChk ? 'Black wins by checkmate!' : 'Stalemate — Draw!');
            }
        }, 30);
    }

    function onCellClick(r, c) {
        if (!ch.running || ch.thinking || ch.turn !== 'white') return;
        var piece = ch.board[r][c];
        if (ch.selected) {
            var validMove = ch.highlights.some(function(m) { return m[0] === r && m[1] === c; });
            if (validMove) {
                var res = applyMove(ch.board, ch.selected, [r, c], ch.enPassant, ch.castling);
                ch.board = res.board; ch.enPassant = res.enPassant; ch.castling = res.castling;
                ch.selected = null; ch.highlights = [];
                ch.moveCount++;
                renderChess();
                if (!hasLegalMoves(ch.board, 'black', ch.enPassant, ch.castling)) {
                    var inChk = isInCheck(ch.board, 'black', ch.enPassant, ch.castling);
                    endChess(inChk ? '🏆 You win by checkmate!' : 'Stalemate — Draw!');
                    return;
                }
                ch.turn = 'black';
                setTimeout(cpuMove, 200);
                return;
            }
        }
        if (piece && pieceColor(piece) === 'white') {
            ch.selected = [r, c];
            ch.highlights = getLegalMoves(ch.board, r, c, ch.enPassant, ch.castling);
        } else {
            ch.selected = null; ch.highlights = [];
        }
        renderChess();
    }

    var SYMBOLS = { K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙', k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟' };

    function renderChess() {
        var grid = document.getElementById('chess-board');
        if (!grid) return;
        grid.innerHTML = '';
        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var cell = document.createElement('div');
                cell.className = 'chess-cell ' + ((r + c) % 2 === 0 ? 'chess-light' : 'chess-dark');
                var piece = ch.board[r][c];
                if (piece) {
                    var span = document.createElement('span');
                    span.className = 'chess-piece ' + (isWhite(piece) ? 'chess-white' : 'chess-black');
                    span.textContent = SYMBOLS[piece] || piece;
                    cell.appendChild(span);
                }
                if (ch.selected && ch.selected[0] === r && ch.selected[1] === c) cell.classList.add('chess-selected');
                if (ch.highlights.some(function(m) { return m[0] === r && m[1] === c; })) cell.classList.add('chess-hint');
                var kingPos = findKing(ch.board, ch.turn);
                if (kingPos && kingPos[0] === r && kingPos[1] === c && isInCheck(ch.board, ch.turn, ch.enPassant, ch.castling)) {
                    cell.classList.add('chess-check');
                }
                (function(rr, cc) { cell.addEventListener('click', function() { onCellClick(rr, cc); }); })(r, c);
                grid.appendChild(cell);
            }
        }
        // Rank/file labels
        var ranks = ['8','7','6','5','4','3','2','1'];
        var files = ['a','b','c','d','e','f','g','h'];
        document.querySelectorAll('.chess-rank-label').forEach(function(el, i) { el.textContent = ranks[i]; });
        document.querySelectorAll('.chess-file-label').forEach(function(el, i) { el.textContent = files[i]; });
    }

    function endChess(msg) {
        ch.running = false;
        var score = ch.moveCount * 5;
        if (msg.includes('You win')) score += 500;
        document.getElementById('chess-result').textContent = msg;
        document.getElementById('chess-final-score').textContent = 'Score: ' + score;
        document.getElementById('chess-over').style.display = 'flex';
        if (window._saveScore) _saveScore('chess', score);
        if (window.GZAch) GZAch.recordGame('chess', score);
    }

    window.restartChess = function() {
        document.getElementById('chess-over').style.display = 'none';
        initChess();
    };
})();
