// ============================================
// SKY JUMP GAME
// ============================================

function initSkyjump() {
    const state = gameState.skyjump;
    state.canvas = document.getElementById('skyjump-canvas');
    state.ctx = state.canvas.getContext('2d');

    const maxW = Math.min(400, window.innerWidth - 60);
    const maxH = Math.min(500, window.innerHeight - 300);
    state.canvas.width = maxW;
    state.canvas.height = maxH;

    state.score = 0;
    state.frameCount = 0;
    state.isRunning = false;
    state.isGameOver = false;
    state.cameraY = 0;
    state.currentZone = 'ground';
    state.platformSpawnDistance = 80;
    state.lastPlatformY = 0;

    document.getElementById('skyjump-high').textContent = state.highScore;
    document.getElementById('skyjump-score').textContent = '0';
    document.querySelector('.skyjump-start-btn').style.display = 'inline-block';

    drawSkyjumpStartScreen();
    setupSkyjumpControls();
}

function setupSkyjumpControls() {
    const canvas = document.getElementById('skyjump-canvas');
    canvas.removeEventListener('click', skyjumpCanvasClick);
    canvas.removeEventListener('touchstart', skyjumpCanvasTouch);
    document.removeEventListener('keydown', skyjumpKeydown);
    canvas.addEventListener('click', skyjumpCanvasClick);
    canvas.addEventListener('touchstart', skyjumpCanvasTouch, { passive: false });
    document.addEventListener('keydown', skyjumpKeydown);
}

function skyjumpCanvasClick(e) {
    e.preventDefault();
    const state = gameState.skyjump;
    if (!state.isRunning && !state.isGameOver) {
        startSkyjump();
    } else if (state.isRunning && !state.isGameOver) {
        jumpSkyjump();
    }
}

function skyjumpCanvasTouch(e) {
    e.preventDefault();
    const state = gameState.skyjump;
    if (!state.isRunning && !state.isGameOver) {
        startSkyjump();
    } else if (state.isRunning && !state.isGameOver) {
        jumpSkyjump();
    }
}

function skyjumpKeydown(e) {
    if (gameState.currentGame !== 'skyjump') return;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        const state = gameState.skyjump;
        if (!state.isRunning && !state.isGameOver) {
            startSkyjump();
        } else if (state.isRunning && !state.isGameOver) {
            jumpSkyjump();
        }
    }
}

function startSkyjump() {
    const state = gameState.skyjump;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop = null; }
    const overlay = document.querySelector('.skyjump-gameover');
    if (overlay) overlay.remove();

    state.player = {
        x: state.canvas.width / 2,
        y: state.canvas.height - 150,
        width: 30,
        height: 40,
        velocityY: 0,
        isJumping: false
    };

    state.platforms = [];
    state.clouds = [];
    state.stars = [];
    state.score = 0;
    state.isRunning = true;
    state.isGameOver = false;
    state.frameCount = 0;
    state.cameraY = 0;
    state.currentZone = 'ground';
    state.platformSpawnDistance = 80;
    state.lastPlatformY = state.canvas.height - 50;

    // Ground platform
    state.platforms.push({
        x: state.canvas.width / 2,
        y: state.canvas.height - 50,
        width: state.canvas.width,
        height: 50,
        type: 'ground'
    });

    // Generate initial platforms
    for (let i = 0; i < 10; i++) {
        state.lastPlatformY -= state.platformSpawnDistance + Math.random() * 40;
        spawnSkyjumpPlatform(state.lastPlatformY);
    }

    // Generate clouds
    for (let i = 0; i < 15; i++) {
        state.clouds.push({
            x: Math.random() * state.canvas.width,
            y: Math.random() * state.canvas.height * 3 - state.canvas.height,
            width: 60 + Math.random() * 80,
            height: 30 + Math.random() * 40,
            speed: 0.2 + Math.random() * 0.3
        });
    }

    // Generate stars
    for (let i = 0; i < 50; i++) {
        state.stars.push({
            x: Math.random() * state.canvas.width,
            y: Math.random() * state.canvas.height * 5,
            size: 1 + Math.random() * 2,
            twinkle: Math.random() * Math.PI * 2
        });
    }

    document.getElementById('skyjump-score').textContent = '0';
    document.querySelector('.skyjump-start-btn').style.display = 'none';

    state.gameLoop = requestAnimationFrame(updateSkyjump);
    showToast('Sky Jump! Tap or press Space to jump! ⬆️', 'info');
}

function spawnSkyjumpPlatform(y) {
    const state = gameState.skyjump;
    const width = 80 + Math.random() * 100;
    const x = width / 2 + Math.random() * (state.canvas.width - width);
    
    let type = 'normal';
    if (state.score > 500 && Math.random() < 0.2) type = 'bouncy';
    if (state.score > 1000 && Math.random() < 0.1) type = 'breakable';
    
    state.platforms.push({
        x: x,
        y: y,
        width: width,
        height: 15,
        type: type,
        broken: false,
        bounceTime: 0
    });
}

function jumpSkyjump() {
    const state = gameState.skyjump;
    if (!state.isRunning || state.isGameOver) return;
    
    if (state.player.velocityY >= 0) {
        state.player.velocityY = state.jumpStrength;
        state.player.isJumping = true;
    }
}

function updateSkyjump(timestamp) {
    const state = gameState.skyjump;
    if (!state.isRunning) return;

    state.frameCount++;

    // Update player
    state.player.velocityY += state.gravity;
    state.player.y += state.player.velocityY;

    // Check platform collisions
    for (const platform of state.platforms) {
        if (platform.broken) continue;
        
        const playerBottom = state.player.y + state.player.height / 2;
        const platformTop = platform.y - platform.height / 2;
        
        if (state.player.velocityY > 0 &&
            state.player.x + state.player.width / 2 > platform.x - platform.width / 2 &&
            state.player.x - state.player.width / 2 < platform.x + platform.width / 2 &&
            playerBottom >= platformTop &&
            playerBottom <= platform.y + platform.height / 2) {
            
            if (platform.type === 'bouncy') {
                state.player.y = platformTop - state.player.height / 2;
                state.player.velocityY = state.jumpStrength * 1.5;
                platform.bounceTime = 10;
            } else if (platform.type === 'breakable') {
                platform.broken = true;
                state.player.y = platformTop - state.player.height / 2;
                state.player.velocityY = state.jumpStrength * 0.8;
            } else {
                state.player.y = platformTop - state.player.height / 2;
                state.player.velocityY = state.jumpStrength;
            }
            state.player.isJumping = false;
        }
    }

    // Camera follow
    const targetCameraY = state.player.y - state.canvas.height * 0.6;
    if (targetCameraY < state.cameraY) {
        state.cameraY = targetCameraY;
    }

    // Update score based on height
    const newScore = Math.floor(-state.cameraY / 10);
    if (newScore > state.score) {
        state.score = newScore;
        document.getElementById('skyjump-score').textContent = state.score;
    }

    // Update zone
    if (state.score > state.zoneThreshold2) {
        state.currentZone = 'space';
    } else if (state.score > state.zoneThreshold1) {
        state.currentZone = 'sky';
    } else {
        state.currentZone = 'ground';
    }

    // Spawn new platforms
    while (state.lastPlatformY > state.cameraY - 200) {
        state.platformSpawnDistance = 80 + Math.random() * 40;
        state.lastPlatformY -= state.platformSpawnDistance;
        spawnSkyjumpPlatform(state.lastPlatformY);
    }

    // Remove old platforms
    state.platforms = state.platforms.filter(p => p.y < state.cameraY + state.canvas.height + 200);

    // Check game over
    if (state.player.y > state.cameraY + state.canvas.height + 100) {
        skyjumpGameOver();
        return;
    }

    drawSkyjumpFrame();
    state.gameLoop = requestAnimationFrame(updateSkyjump);
}

function drawSkyjumpFrame() {
    const state = gameState.skyjump;
    const { ctx, canvas } = state;

    // Sky gradient based on zone
    let skyGrad;
    if (state.currentZone === 'space') {
        skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, '#000033');
        skyGrad.addColorStop(0.5, '#000066');
        skyGrad.addColorStop(1, '#000099');
    } else if (state.currentZone === 'sky') {
        skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, '#1a0533');
        skyGrad.addColorStop(0.5, '#6b2fa0');
        skyGrad.addColorStop(1, '#ff6b6b');
    } else {
        skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, '#87ceeb');
        skyGrad.addColorStop(0.5, '#b0e0e6');
        skyGrad.addColorStop(1, '#98d8a0');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    if (state.currentZone !== 'ground') {
        state.stars.forEach(star => {
            const screenY = star.y - state.cameraY * 0.3;
            if (screenY < 0 || screenY > canvas.height) return;
            
            const twinkle = Math.sin(state.frameCount * 0.05 + star.twinkle) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
            ctx.beginPath();
            ctx.arc(star.x, screenY, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Draw clouds
    state.clouds.forEach(cloud => {
        const screenY = cloud.y - state.cameraY * 0.5;
        if (screenY < -100 || screenY > canvas.height + 100) return;
        
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + cloud.width) cloud.x = -cloud.width;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.ellipse(cloud.x, screenY, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cloud.x - cloud.width * 0.3, screenY - cloud.height * 0.2, cloud.width / 3, cloud.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw platforms
    state.platforms.forEach(platform => {
        const screenY = platform.y - state.cameraY;
        if (screenY < -50 || screenY > canvas.height + 50) return;

        let platformColor;
        if (platform.type === 'ground') {
            platformColor = '#4CAF50';
        } else if (platform.type === 'bouncy') {
            platformColor = '#FFD700';
        } else if (platform.type === 'breakable') {
            platformColor = '#8B4513';
        } else {
            platformColor = '#8BC34A';
        }

        if (platform.broken) {
            ctx.globalAlpha = 0.3;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(platform.x - platform.width / 2 + 3, screenY - platform.height / 2 + 3, platform.width, platform.height);

        ctx.fillStyle = platformColor;
        ctx.beginPath();
        ctx.roundRect(platform.x - platform.width / 2, screenY - platform.height / 2, platform.width, platform.height, [5]);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(platform.x - platform.width / 2 + 2, screenY - platform.height / 2 + 2, platform.width - 4, platform.height / 3);

        ctx.globalAlpha = 1;
    });

    // Draw player
    const playerScreenY = state.player.y - state.cameraY;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(state.player.x, playerScreenY + state.player.height / 2 + 5, state.player.width / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const playerGrad = ctx.createLinearGradient(
        state.player.x - state.player.width / 2, playerScreenY - state.player.height / 2,
        state.player.x + state.player.width / 2, playerScreenY + state.player.height / 2
    );
    playerGrad.addColorStop(0, '#ff6b6b');
    playerGrad.addColorStop(0.5, '#ff4757');
    playerGrad.addColorStop(1, '#c0392b');
    
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.roundRect(
        state.player.x - state.player.width / 2,
        playerScreenY - state.player.height / 2,
        state.player.width,
        state.player.height,
        [8, 8, 4, 4]
    );
    ctx.fill();

    // Player face
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(state.player.x - 6, playerScreenY - 8, 5, 0, Math.PI * 2);
    ctx.arc(state.player.x + 6, playerScreenY - 8, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(state.player.x - 5, playerScreenY - 7, 2, 0, Math.PI * 2);
    ctx.arc(state.player.x + 7, playerScreenY - 7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    if (state.player.velocityY < 0) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.player.x, playerScreenY + 5, 6, 0, Math.PI);
        ctx.stroke();
    } else {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.player.x, playerScreenY + 8, 4, 0, Math.PI);
        ctx.stroke();
    }

    // Zone indicator
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'left';
    const zoneNames = { ground: '🌱 Ground', sky: '☁️ Sky', space: '🌙 Space' };
    ctx.fillText(zoneNames[state.currentZone], 10, 25);
}

function drawSkyjumpStartScreen() {
    const state = gameState.skyjump;
    const { ctx, canvas } = state;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(0.5, '#b0e0e6');
    skyGrad.addColorStop(1, '#98d8a0');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 5; i++) {
        const x = (canvas.width * (i + 0.5)) / 5;
        const y = 80 + Math.sin(i * 2) * 30;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.ellipse(x, y, 50, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - 30, y + 10, 30, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 30, y + 5, 35, 22, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Segoe UI';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.strokeText('SKY JUMP', canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillText('SKY JUMP', canvas.width / 2, canvas.height / 2 - 40);

    ctx.font = '16px Segoe UI';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeText('Tap or Press Space to Start', canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Tap or Press Space to Start', canvas.width / 2, canvas.height / 2 + 20);

    if (state.highScore > 0) {
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`Best: ${state.highScore}`, canvas.width / 2, canvas.height / 2 + 50);
    }
}

function skyjumpGameOver() {
    const state = gameState.skyjump;
    state.isRunning = false;
    state.isGameOver = true;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop = null; }

    let isNewBest = false;
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('skyjumpHighScore', state.highScore);
        document.getElementById('skyjump-high').textContent = state.highScore;
        isNewBest = true;
    }
    if (state.score > 0) saveScore('skyjump', state.score);

    document.querySelector('.skyjump-start-btn').style.display = 'inline-block';

    if (isNewBest) {
        showConfetti();
        showToast(`New Best: ${state.score}! 🏆`, 'success');
    } else {
        showToast(`Game Over! Score: ${state.score}`, 'error');
    }
}