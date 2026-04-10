// ============================================
// SNAKE GAME
// ============================================

function initSnake() {
    const state = gameState.snake;
    state.canvas = document.getElementById('snake-canvas');
    state.ctx = state.canvas.getContext('2d');
    const maxSize = Math.min(400, window.innerWidth - 60);
    state.canvas.width = maxSize;
    state.canvas.height = maxSize;
    state.gridSize = maxSize / 20;
    document.getElementById('snake-high').textContent = state.highScore;
    document.getElementById('snake-score').textContent = '0';
    drawSnakeStartScreen();
    document.removeEventListener('keydown', handleSnakeKeydown);
    document.addEventListener('keydown', handleSnakeKeydown);
    setupTouchControls();
}

function drawSnakeStartScreen() {
    const state = gameState.snake;
    const { ctx, canvas } = state;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
            ctx.strokeRect(i * state.gridSize, j * state.gridSize, state.gridSize, state.gridSize);
        }
    }
    ctx.fillStyle = '#667eea';
    ctx.font = `bold ${state.gridSize * 1.2}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🐍 SNAKE', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = `${state.gridSize * 0.7}px 'Segoe UI', sans-serif`;
    ctx.fillText('Press Start to Play', canvas.width / 2, canvas.height / 2 + 20);
    if (state.highScore > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = `${state.gridSize * 0.6}px 'Segoe UI', sans-serif`;
        ctx.fillText(`High Score: ${state.highScore}`, canvas.width / 2, canvas.height / 2 + 50);
    }
}

function startSnake() {
    initGameAudio();
    const state = gameState.snake;
    if (state.gameLoop) { clearInterval(state.gameLoop); state.gameLoop = null; }
    state.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    state.direction = 'right';
    state.nextDirection = 'right';
    state.score = 0;
    state.isRunning = true;
    state.speed = 150;
    document.getElementById('snake-score').textContent = '0';
    placeFood();
    state.gameLoop = setInterval(updateSnake, state.speed);
    showToast('Game started! 🐍', 'info');
}



function placeFood() {
    const state = gameState.snake;
    let newFood;
    do {
        newFood = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
    } while (state.snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    state.food = newFood;
}

function updateSnake() {
    const state = gameState.snake;
    if (!state.isRunning) return;
    state.direction = state.nextDirection;
    const head = { ...state.snake[0] };
    switch (state.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) { gameOverSnake(); return; }
    if (state.snake.some(seg => seg.x === head.x && seg.y === head.y)) { gameOverSnake(); return; }
    state.snake.unshift(head);
    if (head.x === state.food.x && head.y === state.food.y) {
        state.score += 10;
        document.getElementById('snake-score').textContent = state.score;
        playGameSound('eat');
        placeFood();
        if (state.score % 50 === 0 && state.speed > 60) {

            state.speed -= 10;
            clearInterval(state.gameLoop);
            state.gameLoop = setInterval(updateSnake, state.speed);
            showToast('Speed increased! 🚀', 'warning');
        }
        if (state.score === 50) showToast('50 points! 🔥', 'success');
        if (state.score === 100) showToast('100 points! 🌟', 'success');
        if (state.score === 200) { showToast('200 points! 🏆', 'success'); showConfetti(); }
    } else {
        state.snake.pop();
    }
    drawSnake();
}

function drawSnake() {
    const state = gameState.snake;
    const { ctx, canvas, gridSize } = state;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(102, 126, 234, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 20; i++) {
        ctx.beginPath(); ctx.moveTo(i * gridSize, 0); ctx.lineTo(i * gridSize, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * gridSize); ctx.lineTo(canvas.width, i * gridSize); ctx.stroke();
    }

    const foodX = state.food.x * gridSize;
    const foodY = state.food.y * gridSize;
    const glowSize = gridSize * 1.5;
    const gradient = ctx.createRadialGradient(foodX + gridSize / 2, foodY + gridSize / 2, 0, foodX + gridSize / 2, foodY + gridSize / 2, glowSize);
    gradient.addColorStop(0, 'rgba(255, 71, 87, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 71, 87, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(foodX - gridSize / 2, foodY - gridSize / 2, gridSize * 2, gridSize * 2);

    ctx.fillStyle = '#ff4757';
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(foodX + gridSize / 2, foodY + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(foodX + gridSize / 2 - 2, foodY + gridSize / 2 - 2, gridSize / 6, 0, Math.PI * 2);
    ctx.fill();

    state.snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const padding = 1;

        if (index === 0) {
            ctx.shadowColor = '#2ed573';
            ctx.shadowBlur = 15;
            const headGradient = ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
            headGradient.addColorStop(0, '#2ed573');
            headGradient.addColorStop(1, '#27ae60');
            ctx.fillStyle = headGradient;
            ctx.beginPath();
            ctx.roundRect(x + padding, y + padding, gridSize - padding * 2, gridSize - padding * 2, [gridSize / 4]);
            ctx.fill();
            ctx.shadowBlur = 0;
            drawSnakeEyes(ctx, x, y, gridSize, state.direction);
        } else {
            ctx.shadowBlur = 0;
            const bodyAlpha = 1 - (index / state.snake.length) * 0.5;
            const r = Math.floor(46 + (102 - 46) * (index / state.snake.length));
            const g = Math.floor(213 - (213 - 126) * (index / state.snake.length));
            const b = Math.floor(115 + (234 - 115) * (index / state.snake.length));
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${bodyAlpha})`;
            ctx.beginPath();
            ctx.roundRect(x + padding + 1, y + padding + 1, gridSize - padding * 2 - 2, gridSize - padding * 2 - 2, [gridSize / 6]);
            ctx.fill();
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * bodyAlpha})`;
            ctx.fillRect(x + padding + 2, y + padding + 2, gridSize / 2 - 4, gridSize / 4 - 2);
        }
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = `bold ${gridSize * 3}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(state.score, canvas.width / 2, canvas.height / 2 + gridSize);
}

function drawSnakeEyes(ctx, x, y, gridSize, direction) {
    const eyeSize = gridSize / 6;
    let eye1X, eye1Y, eye2X, eye2Y;
    switch (direction) {
        case 'right': eye1X = x + gridSize * 0.7; eye1Y = y + gridSize * 0.3; eye2X = x + gridSize * 0.7; eye2Y = y + gridSize * 0.7; break;
        case 'left': eye1X = x + gridSize * 0.3; eye1Y = y + gridSize * 0.3; eye2X = x + gridSize * 0.3; eye2Y = y + gridSize * 0.7; break;
        case 'up': eye1X = x + gridSize * 0.3; eye1Y = y + gridSize * 0.3; eye2X = x + gridSize * 0.7; eye2Y = y + gridSize * 0.3; break;
        case 'down': eye1X = x + gridSize * 0.3; eye1Y = y + gridSize * 0.7; eye2X = x + gridSize * 0.7; eye2Y = y + gridSize * 0.7; break;
    }
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(eye1X, eye1Y, eyeSize / 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eye2X, eye2Y, eyeSize / 2, 0, Math.PI * 2); ctx.fill();
}

function gameOverSnake() {
    const state = gameState.snake;
    state.isRunning = false;
    playGameSound('gameover');
    if (state.gameLoop) { clearInterval(state.gameLoop); state.gameLoop = null; }
    if (state.score > state.highScore) {

        state.highScore = state.score;
        localStorage.setItem('snakeHighScore', state.highScore);
        document.getElementById('snake-high').textContent = state.highScore;
        showToast(`New High Score: ${state.highScore}! 🏆`, 'success');
        showConfetti();
    }
    if (state.score > 0) saveScore('snake', state.score);
    drawGameOverScreen();
    showToast(`Game Over! Score: ${state.score}`, 'error');
}


function drawGameOverScreen() {
    const state = gameState.snake;
    const { ctx, canvas, gridSize } = state;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4757';
    ctx.font = `bold ${gridSize * 1.5}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff4757'; ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${gridSize}px 'Segoe UI', sans-serif`;
    ctx.fillText(`Score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = `${gridSize * 0.7}px 'Segoe UI', sans-serif`;
    ctx.fillText(`High Score: ${state.highScore}`, canvas.width / 2, canvas.height / 2 + 45);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = `${gridSize * 0.6}px 'Segoe UI', sans-serif`;
    ctx.fillText('Press Start to Play Again', canvas.width / 2, canvas.height / 2 + 80);
}

function handleSnakeKeydown(e) {
    const state = gameState.snake;
    if (!state.isRunning) return;
    const keyMap = {
        'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
        'w': 'up', 'W': 'up', 's': 'down', 'S':         'down', 'a': 'left', 'A': 'left', 'd': 'right', 'D': 'right'
    };
    const newDirection = keyMap[e.key];
    if (!newDirection) return;
    const opposites = { 'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left' };
    if (opposites[newDirection] !== state.direction) state.nextDirection = newDirection;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
}

function setSnakeDir(dir) {
    const state = gameState.snake;
    if (!state.isRunning) return;
    const opposites = { 'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left' };
    if (opposites[dir] !== state.direction) state.nextDirection = dir;
}

function setupTouchControls() {
    const canvas = document.getElementById('snake-canvas');
    let touchStartX = 0, touchStartY = 0;
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
        if (!gameState.snake.isRunning) return;
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) return;
        let newDir;
        if (Math.abs(diffX) > Math.abs(diffY)) newDir = diffX > 0 ? 'right' : 'left';
        else newDir = diffY > 0 ? 'down' : 'up';
        const opposites = { 'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left' };
        if (opposites[newDir] !== gameState.snake.direction) gameState.snake.nextDirection = newDir;
        e.preventDefault();
    }, { passive: false });
}

