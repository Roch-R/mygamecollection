// ============================================
// CLICKER GAME
// ============================================

function initClicker() {
    updateClickerDisplay();
    const clickBtn = document.getElementById('click-btn');
    const newClickBtn = clickBtn.cloneNode(true);
    clickBtn.parentNode.replaceChild(newClickBtn, clickBtn);
    newClickBtn.addEventListener('click', (e) => handleClick(e));
    startAutoClick();
}

function handleClick(e) {
    const state = gameState.clicker;
    const points = state.clickPower * state.multiplier;
    state.score += points;
    updateClickerDisplay();
    createClickEffect(e, points);
    playGameSound('click', 0.2);
    const btn = document.getElementById('click-btn');
    btn.style.transform = 'scale(0.92)';
    setTimeout(() => { btn.style.transform = 'scale(1)'; }, 100);
}


function createClickEffect(e, points) {
    const btn = document.getElementById('click-btn');
    const rect = btn.getBoundingClientRect();
    const float = document.createElement('div');
    float.className = 'click-float';
    float.textContent = `+${points}`;
    float.style.left = (e.clientX || rect.left + rect.width / 2) - 20 + 'px';
    float.style.top = (e.clientY || rect.top) - 20 + 'px';
    document.body.appendChild(float);
    setTimeout(() => { if (float.parentNode) float.remove(); }, 1000);
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const colors = ['#ffd700', '#667eea', '#764ba2', '#2ed573'];
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = (e.clientX || rect.left + rect.width / 2) + 'px';
        particle.style.top = (e.clientY || rect.top + rect.height / 2) + 'px';
        particle.style.setProperty('--tx', (Math.random() - 0.5) * 100 + 'px');
        particle.style.setProperty('--ty', (Math.random() - 0.5) * 100 + 'px');
        document.body.appendChild(particle);
        setTimeout(() => { if (particle.parentNode) particle.remove(); }, 1000);
    }
}

function buyUpgrade(type) {
    const state = gameState.clicker;
    switch (type) {
        case 'click':
            if (state.score >= state.clickCost) {
                state.score -= state.clickCost;
                state.clickPower += 1;
                state.clickCost = Math.floor(state.clickCost * 1.5);
                playGameSound('success');
                showToast('Click Power upgraded! +1', 'success');
            } else { playGameSound('error'); showToast('Not enough points!', 'error'); return; }
            break;
        case 'auto':
            if (state.score >= state.autoCost) {
                state.score -= state.autoCost;
                state.autoClick += 1;
                state.autoCost = Math.floor(state.autoCost * 1.8);
                startAutoClick();
                playGameSound('success');
                showToast('Auto Click upgraded! +1/sec', 'success');
            } else { playGameSound('error'); showToast('Not enough points!', 'error'); return; }
            break;
        case 'multiplier':
            if (state.score >= state.multiCost) {
                state.score -= state.multiCost;
                state.multiplier *= 2;
                state.multiCost = Math.floor(state.multiCost * 3);
                playGameSound('success');
                showToast(`Multiplier upgraded! x${state.multiplier}`, 'success');
            } else { playGameSound('error'); showToast('Not enough points!', 'error'); return; }
            break;
    }
    updateClickerDisplay();
}


function startAutoClick() {
    const state = gameState.clicker;
    if (state.autoInterval) clearInterval(state.autoInterval);
    if (state.autoClick > 0) {
        state.autoInterval = setInterval(() => {
            state.score += state.autoClick * state.multiplier;
            updateClickerDisplay();
        }, 1000);
    }
}

function updateClickerDisplay() {
    const state = gameState.clicker;
    document.getElementById('clicker-score').textContent = state.score.toLocaleString();
    document.getElementById('click-power').textContent = state.clickPower * state.multiplier;
    document.getElementById('auto-click').textContent = state.autoClick * state.multiplier;
    document.getElementById('click-cost').textContent = state.clickCost.toLocaleString();
    document.getElementById('auto-cost').textContent = state.autoCost.toLocaleString();
    document.getElementById('multi-cost').textContent = state.multiCost.toLocaleString();
    const upgradeBtns = document.querySelectorAll('.upgrade-btn');
    const costs = [state.clickCost, state.autoCost, state.multiCost];
    upgradeBtns.forEach((btn, index) => { btn.disabled = state.score < costs[index]; });
    if (state.score > 0 && state.score % 100 === 0) saveScore('clicker', state.score);
}

