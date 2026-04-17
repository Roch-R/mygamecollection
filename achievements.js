/* ============================================
   GAMEZONE ACHIEVEMENT SYSTEM
   ============================================ */
(function() {
    const ACHIEVEMENTS = [
        { id: 'first_game',   icon: '🎮', title: 'First Play',      desc: 'Play your first game',             check: s => s.totalGames >= 1 },
        { id: 'five_games',   icon: '🕹️', title: 'Gamer',           desc: 'Play 5 different games',           check: s => s.uniqueGames >= 5 },
        { id: 'ten_games',    icon: '👾', title: 'Arcade Master',   desc: 'Play 10 sessions total',           check: s => s.totalGames >= 10 },
        { id: 'all_games',    icon: '🏆', title: 'Completionist',   desc: 'Try every game at least once',     check: s => s.uniqueGames >= 12 },
        { id: 'score_1k',     icon: '⭐', title: 'Score Hunter',    desc: 'Score 1,000 in any game',          check: s => s.bestScore >= 1000 },
        { id: 'score_10k',    icon: '💫', title: 'High Roller',     desc: 'Score 10,000 in any game',         check: s => s.bestScore >= 10000 },
        { id: 'score_50k',    icon: '🌟', title: 'Legend',          desc: 'Score 50,000 in any game',         check: s => s.bestScore >= 50000 },
        { id: 'night_owl',    icon: '🦉', title: 'Night Owl',       desc: 'Play after midnight',              check: s => s.playedLate },
        { id: 'daily_3',      icon: '🔥', title: 'On Fire',         desc: 'Play 3 days in a row',             check: s => s.streak >= 3 },
        { id: 'tetris_fan',   icon: '🧱', title: 'Tetris Fan',      desc: 'Play Tetris 5 times',              check: s => (s.gameCounts['tetris'] || 0) >= 5 },
    ];

    function load() {
        try { return JSON.parse(localStorage.getItem('gz-ach-state') || '{}'); } catch(e) { return {}; }
    }
    function save(s) {
        try { localStorage.setItem('gz-ach-state', JSON.stringify(s)); } catch(e) {}
    }
    function unlocked() {
        try { return JSON.parse(localStorage.getItem('gz-ach-unlocked') || '[]'); } catch(e) { return []; }
    }
    function saveUnlocked(u) {
        try { localStorage.setItem('gz-ach-unlocked', JSON.stringify(u)); } catch(e) {}
    }

    function showAchievement(a) {
        var toast = document.createElement('div');
        toast.className = 'ach-toast';
        toast.innerHTML = '<span class="ach-icon">' + a.icon + '</span><div><strong>Achievement Unlocked!</strong><br>' + a.title + ' — ' + a.desc + '</div>';
        document.body.appendChild(toast);
        setTimeout(function() { toast.classList.add('ach-show'); }, 50);
        setTimeout(function() { toast.classList.remove('ach-show'); setTimeout(function(){ toast.remove(); }, 500); }, 4000);
    }

    function check() {
        var state = load();
        var done = unlocked();
        ACHIEVEMENTS.forEach(function(a) {
            if (done.indexOf(a.id) === -1 && a.check(state)) {
                done.push(a.id);
                saveUnlocked(done);
                showAchievement(a);
            }
        });
    }

    /* Public API */
    window.GZAch = {
        recordGame: function(gameId, score) {
            var state = load();
            state.totalGames = (state.totalGames || 0) + 1;
            state.gameCounts = state.gameCounts || {};
            state.gameCounts[gameId] = (state.gameCounts[gameId] || 0) + 1;
            state.uniqueGames = Object.keys(state.gameCounts).length;
            state.bestScore = Math.max(state.bestScore || 0, score || 0);
            var h = new Date().getHours();
            if (h >= 0 && h < 5) state.playedLate = true;
            /* Streak logic */
            var today = new Date().toDateString();
            if (state.lastDay !== today) {
                var yesterday = new Date(Date.now() - 86400000).toDateString();
                state.streak = state.lastDay === yesterday ? (state.streak || 0) + 1 : 1;
                state.lastDay = today;
            }
            save(state);
            check();
        },
        getUnlocked: function() { return unlocked(); },
        getAll: function() { return ACHIEVEMENTS; }
    };

    /* Run check on page load in case anything was earned offline */
    document.addEventListener('DOMContentLoaded', check);
})();
