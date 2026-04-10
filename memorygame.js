// ============================================
// MEMORY GAME
// ============================================

const memoryEmojis = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎵', '🎸'];

function initMemory() {
    const state = gameState.memory;
    state.flippedCards = [];
    state.matchedPairs = 0;
    state.moves = 0;
    state.time = 0;
    state.isLocked = false;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    document.getElementById('moves').textContent = '0';
    document.getElementById('time').textContent = '0';
    document.getElementById('pairs').textContent = '0';
    const emojis = [...memoryEmojis, ...memoryEmojis];
    state.cards = shuffleArray(emojis);
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    state.cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.emoji = emoji;
        card.innerHTML = `<div class="card-front"><i class="fas fa-question"></i></div><div class="card-back">${emoji}</div>`;
        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
    });
    state.timer = setInterval(() => {
        state.time++;
        document.getElementById('time').textContent = state.time;
    }, 1000);
}

function flipCard(card) {
    const state = gameState.memory;
    if (state.isLocked || card.classList.contains('flipped') || card.classList.contains('matched') || state.flippedCards.length >= 2) return;
    playGameSound('click', 0.2);
    card.classList.add('flipped');
    state.flippedCards.push(card);
    if (state.flippedCards.length === 2) {
        state.moves++;
        document.getElementById('moves').textContent = state.moves;
        checkMemoryMatch();
    }
}


function checkMemoryMatch() {
    const state = gameState.memory;
    const [card1, card2] = state.flippedCards;
    state.isLocked = true;
    if (card1.dataset.emoji === card2.dataset.emoji) {
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            state.matchedPairs++;
            document.getElementById('pairs').textContent = state.matchedPairs;
            state.flippedCards = [];
            state.isLocked = false;
            playGameSound('success');
            showToast('Match found! 🎉', 'success');
            if (state.matchedPairs === state.totalPairs) memoryWin();
        }, 500);
    } else {

        setTimeout(() => {
            card1.classList.add('wrong');
            card2.classList.add('wrong');
            setTimeout(() => {
                card1.classList.remove('flipped', 'wrong');
                card2.classList.remove('flipped', 'wrong');
                state.flippedCards = [];
                state.isLocked = false;
                playGameSound('error', 0.2);
            }, 600);
        }, 800);
    }
}


function memoryWin() {
    const state = gameState.memory;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    playGameSound('levelup');
    const finalScore = Math.max(1000 - state.moves * 10 - state.time * 5, 100);
    saveScore('memory', finalScore);
    showConfetti();

    setTimeout(() => {
        const overlay = document.createElement('div');
        overlay.className = 'memory-win';
        overlay.innerHTML = `
            <div class="memory-win-content">
                <h3>🎉 You Won!</h3>
                <p>Moves: ${state.moves}</p>
                <p>Time: ${state.time}s</p>
                <p style="color: var(--accent); font-size: 1.3rem; font-weight: bold; margin-top: 10px;">Score: ${finalScore} pts</p>
                <button class="restart-btn" onclick="closeMemoryWin()" style="margin-top: 20px;">Play Again</button>
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeMemoryWin(); });
    }, 500);
    showToast(`Amazing! Score: ${finalScore} pts`, 'success');
}

function closeMemoryWin() {
    const overlay = document.querySelector('.memory-win');
    if (overlay) overlay.remove();
    restartMemory();
}

function restartMemory() {
    if (gameState.memory.timer) { clearInterval(gameState.memory.timer); gameState.memory.timer = null; }
    initMemory();
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
