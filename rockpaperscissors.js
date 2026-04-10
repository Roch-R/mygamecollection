// ============================================
// ROCK PAPER SCISSORS
// ============================================

const rpsChoices = ['rock', 'paper', 'scissors'];
const rpsEmojis = { rock: '✊', paper: '✋', scissors: '✌️' };

function initRPS() {
    const state = gameState.rps;
    state.playerScore = 0;
    state.compScore = 0;
    state.rounds = 0;
    document.getElementById('player-score').textContent = '0';
    document.getElementById('comp-score').textContent = '0';
    document.getElementById('player-choice-icon').textContent = '❓';
    document.getElementById('comp-choice-icon').textContent = '❓';
    document.getElementById('player-choice-icon').className = 'rps-icon';
    document.getElementById('comp-choice-icon').className = 'rps-icon';
    const resultEl = document.getElementById('rps-result');
    resultEl.textContent = 'Choose your weapon!';
    resultEl.className = 'rps-result';
}

function playRPS(playerChoice) {
    playGameSound('click', 0.2);
    const state = gameState.rps;
    const compChoice = rpsChoices[Math.floor(Math.random() * 3)];

    const playerIcon = document.getElementById('player-choice-icon');
    const compIcon = document.getElementById('comp-choice-icon');
    const resultEl = document.getElementById('rps-result');
    playerIcon.className = 'rps-icon';
    compIcon.className = 'rps-icon';
    playerIcon.textContent = '❓';
    compIcon.textContent = '❓';

    let shakeCount = 0;
    const shakeInterval = setInterval(() => {
        playerIcon.textContent = rpsEmojis[rpsChoices[Math.floor(Math.random() * 3)]];
        compIcon.textContent = rpsEmojis[rpsChoices[Math.floor(Math.random() * 3)]];
        shakeCount++;
        if (shakeCount >= 6) {
            clearInterval(shakeInterval);
            playerIcon.textContent = rpsEmojis[playerChoice];
            compIcon.textContent = rpsEmojis[compChoice];
            playerIcon.classList.add('animate');
            compIcon.classList.add('animate');
            const result = getRPSResult(playerChoice, compChoice);
            state.rounds++;
            setTimeout(() => {
                switch (result) {
                    case 'win':
                        state.playerScore++;
                        resultEl.textContent = `You Win! ${rpsEmojis[playerChoice]} beats ${rpsEmojis[compChoice]}`;
                        resultEl.className = 'rps-result win';
                        playerIcon.classList.add('win-icon');
                        compIcon.classList.add('lose-icon');
                        playGameSound('success');
                        showToast('You won this round! 🎉', 'success');
                        break;
                    case 'lose':
                        state.compScore++;
                        resultEl.textContent = `You Lose! ${rpsEmojis[compChoice]} beats ${rpsEmojis[playerChoice]}`;
                        resultEl.className = 'rps-result lose';
                        playerIcon.classList.add('lose-icon');
                        compIcon.classList.add('win-icon');
                        playGameSound('error', 0.2);
                        showToast('Computer wins! 😢', 'error');
                        break;
                    case 'draw':
                        resultEl.textContent = `Draw! Both chose ${rpsEmojis[playerChoice]}`;
                        resultEl.className = 'rps-result draw';
                        playerIcon.classList.add('draw-icon');
                        compIcon.classList.add('draw-icon');
                        playGameSound('click', 0.15);
                        showToast("It's a tie! 🤝", 'warning');
                        break;
                }

                document.getElementById('player-score').textContent = state.playerScore;
                document.getElementById('comp-score').textContent = state.compScore;
                                if (state.rounds % 5 === 0 && state.playerScore > 0) saveScore('rps', state.playerScore * 100);
                if (state.playerScore === 5) { showToast('🏆 5 wins!', 'success'); showConfetti(); saveScore('rps', 500); }
                if (state.playerScore === 10) { showToast('🏆🏆 10 wins!', 'success'); showConfetti(); saveScore('rps', 1000); }
            }, 300);
        }
    }, 100);
}

function getRPSResult(player, computer) {
    if (player === computer) return 'draw';
    const wins = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    return wins[player] === computer ? 'win' : 'lose';
}