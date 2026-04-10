// ============================================
// WORD SEARCH GAME - COMPLETE WORKING IMPLEMENTATION
// ============================================

// Word Categories
const WORD_CATEGORIES = {
    animals: ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'TIGER', 'BEAR', 'WOLF', 'FOX', 'DEER', 'EAGLE', 'HAWK', 'SHARK', 'WHALE', 'TURTLE', 'SNAKE', 'LIZARD', 'FROG', 'MOUSE', 'RABBIT'],
    fruits: ['APPLE', 'BANANA', 'GRAPE', 'MANGO', 'PEACH', 'PLUM', 'PEAR', 'BERRY', 'MELON', 'LEMON', 'ORANGE', 'CHERRY', 'KIWI', 'PAPAYA', 'OLIVE', 'FIG', 'DATE', 'LIME', 'COCONUT', 'PINEAPPLE'],
    colors: ['RED', 'BLUE', 'GREEN', 'PINK', 'PURPLE', 'ORANGE', 'YELLOW', 'BLACK', 'WHITE', 'BROWN', 'GRAY', 'SILVER', 'GOLD', 'VIOLET', 'INDIGO', 'MAROON', 'TEAL', 'CORAL', 'BEIGE', 'TURQUOISE'],
    countries: ['USA', 'CHINA', 'JAPAN', 'FRANCE', 'GERMANY', 'BRAZIL', 'INDIA', 'ITALY', 'SPAIN', 'MEXICO', 'CANADA', 'RUSSIA', 'KOREA', 'EGYPT', 'GREECE', 'TURKEY', 'SWEDEN', 'NORWAY', 'PERU', 'CHILE'],
    sports: ['SOCCER', 'TENNIS', 'GOLF', 'HOCKEY', 'RUGBY', 'CRICKET', 'BOXING', 'SWIMMING', 'CYCLING', 'SKIING', 'SURFING', 'VOLLEYBALL', 'BASKETBALL', 'BASEBALL', 'FOOTBALL', 'ARCHERY', 'FENCING', 'ROWING', 'JUDO', 'KARATE'],
    foods: ['PIZZA', 'BURGER', 'PASTA', 'SALAD', 'STEAK', 'CHICKEN', 'RICE', 'BREAD', 'CHEESE', 'BACON', 'SAUSAGE', 'WAFFLE', 'PANCAKE', 'TACOS', 'SUSHI', 'NOODLES', 'CURRY', 'STEW', 'ROAST', 'GRILL'],
    vehicles: ['CAR', 'BUS', 'TRAIN', 'PLANE', 'BOAT', 'SHIP', 'BIKE', 'TRUCK', 'VAN', 'JET', 'HELICOPTER', 'SUBMARINE', 'MOTORCYCLE', 'SCOOTER', 'TRAM', 'CABLE', 'FERRY', 'ROVER', 'DRONE', 'HOVERCRAFT'],
    nature: ['TREE', 'FLOWER', 'GRASS', 'CLOUD', 'RAIN', 'SNOW', 'WIND', 'FIRE', 'WATER', 'EARTH', 'MOUNTAIN', 'RIVER', 'LAKE', 'OCEAN', 'FOREST', 'DESERT', 'VALLEY', 'CANYON', 'BEACH', 'ISLAND'],
    space: ['STAR', 'MOON', 'SUN', 'MARS', 'VENUS', 'JUPITER', 'SATURN', 'URANUS', 'PLUTO', 'COMET', 'ASTEROID', 'GALAXY', 'NEBULA', 'ORBIT', 'PLANET', 'ROCKET', 'SHUTTLE', 'STATION', 'ASTRONAUT', 'TELESCOPE'],
    weather: ['RAIN', 'SNOW', 'WIND', 'STORM', 'CLOUD', 'SUNNY', 'CLOUDY', 'RAINY', 'SNOWY', 'WINDY', 'FOG', 'HAIL', 'SLEET', 'THUNDER', 'LIGHTNING', 'TORNADO', 'HURRICANE', 'MONSOON', 'DROUGHT', 'BLIZZARD'],
    body: ['HEAD', 'HAND', 'FOOT', 'ARM', 'LEG', 'EYE', 'EAR', 'NOSE', 'MOUTH', 'HAIR', 'SKIN', 'BONE', 'HEART', 'BRAIN', 'LUNG', 'LIVER', 'KIDNEY', 'STOMACH', 'SPINE', 'BLOOD']
};

// Create global state
window.wordSearchState = {
    canvas: null,
    ctx: null,
    grid: [],
    words: [],
    foundWords: [],
    selectedCells: [],
    isSelecting: false,
    score: 0,
    time: 0,
    timer: null,
    isRunning: false,
    difficulty: 'easy',
    chapter: 1,
    gridSize: 7,
    cellSize: 40,
    offsetX: 0,
    offsetY: 0,
    highScore: parseInt(localStorage.getItem('wordsearchHighScore')) || 0
};

// ============================================
// INITIALIZATION
// ============================================

function initWordSearch() {
    const state = window.wordSearchState;
    state.canvas = document.getElementById('wordsearch-canvas');
    
    if (state.canvas) {
        state.ctx = state.canvas.getContext('2d');
        const maxW = Math.min(450, window.innerWidth - 60);
        const maxH = Math.min(550, window.innerHeight - 300);
        state.canvas.width = maxW;
        state.canvas.height = maxH;
        
        state.score = 0;
        state.time = 180;
        state.isRunning = false;
        state.highScore = parseInt(localStorage.getItem('wordsearchHighScore')) || 0;
        
        document.getElementById('wordsearch-score').textContent = '0';
        document.getElementById('wordsearch-time').textContent = '3:00';
        document.getElementById('wordsearch-chapter').textContent = '1';
        document.getElementById('wordsearch-high').textContent = state.highScore;
        
        drawWordSearchStartScreen();
    }
}

// ============================================
// START GAME
// ============================================

// Track last space press for double-space detection
let lastSpacePress = 0;
let wordSearchDoubleSpaceEnabled = true;

function startWordSearch() {
    const state = window.wordSearchState;
    if (!state.canvas || !state.ctx) {
        initWordSearch();
    }
    
    // Use default difficulty and chapter (removed select dependencies)
    state.difficulty = 'easy';
    state.chapter = 1;
    
    // Apply difficulty settings
    const settings = {
        easy: { gridSize: 7, wordCount: 5, timeLimit: 180 },
        medium: { gridSize: 8, wordCount: 6, timeLimit: 240 },
        hard: { gridSize: 10, wordCount: 8, timeLimit: 300 }
    };
    
    const diffSettings = settings[state.difficulty] || settings.easy;
    state.gridSize = diffSettings.gridSize;
    
    // Calculate cell size
    if (state.canvas) {
        const availableSize = Math.min(state.canvas.width - 40, state.canvas.height - 120);
        state.cellSize = Math.floor(availableSize / state.gridSize);
        state.offsetX = (state.canvas.width - state.cellSize * state.gridSize) / 2;
        state.offsetY = 60;
    }
    
    // Generate words based on chapter
    generateWords(diffSettings.wordCount);
    
    // Generate grid
    generateGrid();
    
    // Reset state
    state.score = 0;
    state.time = diffSettings.timeLimit;
    state.isRunning = true;
    state.foundWords = [];
    state.selectedCells = [];
    state.isSelecting = false;
    
    // Update UI
    document.getElementById('wordsearch-score').textContent = '0';
    document.getElementById('wordsearch-time').textContent = formatTime(state.time);
    document.getElementById('wordsearch-chapter').textContent = state.chapter;
    
    // Start timer
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
        if (state.isRunning) {
            state.time--;
            document.getElementById('wordsearch-time').textContent = formatTime(state.time);
            
            if (state.time <= 0) {
                state.isRunning = false;
                if (state.timer) clearInterval(state.timer);
                showToast("Time's Up!", 'error');
                
                if (state.score > state.highScore) {
                    state.highScore = state.score;
                    localStorage.setItem('wordsearchHighScore', state.highScore);
                    document.getElementById('wordsearch-high').textContent = state.highScore;
                    showToast(`New High Score: ${state.score}! 🏆`, 'success');
                }
            }
        }
    }, 1000);
    
    // Draw game
    drawWordSearch();
    
    // Setup controls
    setupControls();
}

// ============================================
// WORD GENERATION
// ============================================

function generateWords(wordCount) {
    const state = window.wordSearchState;
    const chapterCategories = [
        'animals', 'fruits', 'colors', 'countries', 'sports',
        'foods', 'vehicles', 'nature', 'space', 'weather'
    ];
    
    const categoryIndex = (state.chapter - 1) % chapterCategories.length;
    const category = chapterCategories[categoryIndex];
    const categoryWords = WORD_CATEGORIES[category] || WORD_CATEGORIES.animals;
    
    // Shuffle and pick words
    const shuffled = [...categoryWords].sort(() => Math.random() - 0.5);
    state.words = shuffled.slice(0, Math.min(wordCount, shuffled.length));
}

// ============================================
// GRID GENERATION
// ============================================

function generateGrid() {
    const state = window.wordSearchState;
    const { gridSize, words } = state;
    
    // Initialize empty grid
    state.grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    
    // Place words
    for (const word of words) {
        placeWord(word);
    }
    
    // Fill empty cells
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (state.grid[r][c] === '') {
                state.grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }
}

function placeWord(word) {
    const state = window.wordSearchState;
    const size = state.gridSize;
    const directions = [
        { dr: 0, dc: 1 },   // horizontal
        { dr: 1, dc: 0 },   // vertical
        { dr: 1, dc: 1 },   // diagonal
        { dr: -1, dc: 1 },  // diagonal up-right
    ];
    
    for (let attempt = 0; attempt < 100; attempt++) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        
        let startR, startC;
        
        // Calculate valid starting positions
        if (dir.dr === 0) {
            startR = Math.floor(Math.random() * size);
            startC = Math.floor(Math.random() * (size - word.length + 1));
        } else if (dir.dc === 0) {
            startR = Math.floor(Math.random() * (size - word.length + 1));
            startC = Math.floor(Math.random() * size);
        } else if (dir.dr === 1) {
            startR = Math.floor(Math.random() * (size - word.length + 1));
            startC = Math.floor(Math.random() * (size - word.length + 1));
        } else {
            startR = Math.floor(Math.random() * (size - word.length + 1)) + (word.length - 1);
            startC = Math.floor(Math.random() * (size - word.length + 1));
        }
        
        // Check if word fits
        let fits = true;
        for (let i = 0; i < word.length; i++) {
            const r = startR + dir.dr * i;
            const c = startC + dir.dc * i;
            const cell = state.grid[r][c];
            if (cell !== '' && cell !== word[i]) {
                fits = false;
                break;
            }
        }
        
        if (fits) {
            for (let i = 0; i < word.length; i++) {
                const r = startR + dir.dr * i;
                const c = startC + dir.dc * i;
                state.grid[r][c] = word[i];
            }
            return true;
        }
    }
    
    return false;
}

// ============================================
// DRAWING
// ============================================

function drawWordSearchStartScreen() {
    const state = window.wordSearchState;
    if (!state.ctx || !state.canvas) return;
    
    const ctx = state.ctx;
    const canvas = state.canvas;
    
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(0.5, '#16213e');
    bgGrad.addColorStop(1, '#0f0f23');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Segoe UI';
    ctx.fillStyle = '#667eea';
    ctx.shadowColor = '#667eea';
    ctx.shadowBlur = 20;
    ctx.fillText('WORD SEARCH', canvas.width / 2, 120);
    ctx.shadowBlur = 0;
    
    ctx.font = 'bold 20px Segoe UI';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('UNIVERSE', canvas.width / 2, 155);
    
    // Instructions
    ctx.font = '14px Segoe UI';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Find all the hidden words!', canvas.width / 2, 280);
    ctx.fillText('Drag to select letters horizontally, vertically, or diagonally.', canvas.width / 2, 305);
    
    // Start prompt
    ctx.font = '16px Segoe UI';
    ctx.fillStyle = '#667eea';
    ctx.fillText('Click Start or press SPACE twice to begin!', canvas.width / 2, canvas.height - 30);
}

function drawWordSearch() {
    const state = window.wordSearchState;
    if (!state.ctx || !state.canvas) return;
    
    const ctx = state.ctx;
    const canvas = state.canvas;
    const { grid, cellSize, offsetX, offsetY, gridSize } = state;
    
    // Clear
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid background
    const gridBgX = offsetX - 10;
    const gridBgY = offsetY - 10;
    const gridBgW = cellSize * gridSize + 20;
    const gridBgH = cellSize * gridSize + 20;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.roundRect(gridBgX, gridBgY, gridBgW, gridBgH, 10);
    ctx.fill();
    
    // Draw cells
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const x = offsetX + c * cellSize;
            const y = offsetY + r * cellSize;
            
            const isSelected = state.selectedCells.some(s => s.r === r && s.c === c);
            const isFound = state.foundWords.some(fw => fw.cells.some(fc => fc.r === r && fc.c === c));
            
            if (isFound) {
                const colors = ['#667eea', '#764ba2', '#2ed573', '#ff4757'];
                const color = colors[(r + c) % colors.length];
                ctx.fillStyle = color + '40';
                ctx.strokeStyle = color;
            } else if (isSelected) {
                ctx.fillStyle = '#667eea40';
                ctx.strokeStyle = '#667eea';
            } else {
                ctx.fillStyle = '#1a1a2e';
                ctx.strokeStyle = '#333355';
            }
            
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 5);
            ctx.fill();
            ctx.stroke();
            
            // Draw letter
            ctx.fillStyle = isFound ? '#fff' : '#e0e0e0';
            ctx.font = `bold ${cellSize * 0.5}px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(grid[r][c], x + cellSize / 2, y + cellSize / 2);
        }
    }
    
    // Title bar
    ctx.fillStyle = '#667eea';
    ctx.font = 'bold 16px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(`Chapter ${state.chapter} - ${state.difficulty.toUpperCase()}`, canvas.width / 2, 30);
    
    // Words to find - position below the grid with proper spacing
    const gridBottom = offsetY + gridSize * cellSize;
    const wordsStartY = gridBottom + 25;
    const wordsPerRow = Math.ceil(state.words.length / 2);
    
    ctx.font = '12px Segoe UI';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    
    state.words.forEach((word, i) => {
        const isFound = state.foundWords.some(fw => fw.word === word);
        const row = Math.floor(i / wordsPerRow);
        const col = i % wordsPerRow;
        
        // Calculate word position - center words below grid
        const wordSpacing = canvas.width / wordsPerRow;
        const wordX = wordSpacing * col + wordSpacing / 2;
        const wordY = wordsStartY + row * 20;
        
        ctx.fillStyle = isFound ? '#2ed573' : '#aaa';
        ctx.fillText(word, wordX, wordY);
    });
    
    // Reset text alignment
    ctx.textAlign = 'left';
}

// ============================================
// CONTROLS
// ============================================

function setupControls() {
    const canvas = window.wordSearchState.canvas;
    if (!canvas) return;
    
    canvas.onmousedown = handleMouseDown;
    canvas.onmousemove = handleMouseMove;
    canvas.onmouseup = handleMouseUp;
    canvas.ontouchstart = handleTouchStart;
    canvas.ontouchmove = handleTouchMove;
    canvas.ontouchend = handleTouchEnd;
}

function handleMouseDown(e) {
    const state = window.wordSearchState;
    if (!state.isRunning) return;
    
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor((x - state.offsetX) / state.cellSize);
    const row = Math.floor((y - state.offsetY) / state.cellSize);
    
    if (row >= 0 && row < state.gridSize && col >= 0 && col < state.gridSize) {
        state.isSelecting = true;
        state.selectedCells = [{ r: row, c: col }];
        drawWordSearch();
    }
}

function handleMouseMove(e) {
    const state = window.wordSearchState;
    if (!state.isRunning || !state.isSelecting) return;
    
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor((x - state.offsetX) / state.cellSize);
    const row = Math.floor((y - state.offsetY) / state.cellSize);
    
    if (row >= 0 && row < state.gridSize && col >= 0 && col < state.gridSize) {
        updateSelection(row, col);
    }
}

function handleMouseUp(e) {
    const state = window.wordSearchState;
    if (!state.isRunning) return;
    
    state.isSelecting = false;
    checkWord();
    state.selectedCells = [];
    drawWordSearch();
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    handleMouseMove(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    handleMouseUp(e);
}

function updateSelection(row, col) {
    const state = window.wordSearchState;
    const startCell = state.selectedCells[0];
    const endCell = { r: row, c: col };
    
    const dr = endCell.r - startCell.r;
    const dc = endCell.c - startCell.c;
    
    // Only allow straight lines or diagonals
    if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
        const steps = Math.max(Math.abs(dr), Math.abs(dc));
        const stepR = dr === 0 ? 0 : dr / steps;
        const stepC = dc === 0 ? 0 : dc / steps;
        
        state.selectedCells = [];
        for (let i = 0; i <= steps; i++) {
            state.selectedCells.push({
                r: startCell.r + stepR * i,
                c: startCell.c + stepC * i
            });
        }
    }
    
    drawWordSearch();
}

function checkWord() {
    const state = window.wordSearchState;
    
    if (state.selectedCells.length < 2) return;
    
    // Build selected word
    let selectedWord = '';
    state.selectedCells.forEach(cell => {
        selectedWord += state.grid[cell.r][cell.c];
    });
    
    const reversedWord = selectedWord.split('').reverse().join('');
    
    // Check against all words
    for (const word of state.words) {
        if (state.foundWords.some(fw => fw.word === word)) continue;
        
        if (selectedWord === word || reversedWord === word) {
            // Found!
            state.foundWords.push({
                word: word,
                cells: [...state.selectedCells]
            });
            
            const points = word.length * 10;
            state.score += points;
            document.getElementById('wordsearch-score').textContent = state.score;
            
            showToast(`Found: ${word}! +${points} points`, 'success');
            
            // Check win
            if (state.foundWords.length === state.words.length) {
                gameWon();
            }
            
            return;
        }
    }
}

function gameWon() {
    const state = window.wordSearchState;
    state.isRunning = false;
    
    if (state.timer) clearInterval(state.timer);
    
    const timeBonus = state.time * 2;
    state.score += timeBonus;
    document.getElementById('wordsearch-score').textContent = state.score;
    
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('wordsearchHighScore', state.highScore);
        document.getElementById('wordsearch-high').textContent = state.highScore;
        showToast(`New High Score: ${state.score}! 🏆`, 'success');
    }
    
    showToast(`Chapter ${state.chapter} Complete! +${timeBonus} time bonus!`, 'success');
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Make functions globally available
window.initWordSearch = initWordSearch;
window.startWordSearch = startWordSearch;

// ============================================
// DOUBLE SPACE TO START
// ============================================

// Listen for double space to start the game
document.addEventListener('keydown', function(e) {
    // Check if we're in the word search game area
    const wordsearchGame = document.getElementById('wordsearch-game');
    if (!wordsearchGame || wordsearchGame.classList.contains('hidden')) return;
    
    // Check for space key
    if (e.code === 'Space') {
        e.preventDefault();
        
        const state = window.wordSearchState;
        const currentTime = Date.now();
        
        // Check if it's a double space (within 500ms)
        if (currentTime - lastSpacePress < 500) {
            // Double space detected - start the game
            if (!state.isRunning) {
                startWordSearch();
                showToast('Game Started! 🔤', 'info');
            }
            lastSpacePress = 0; // Reset to prevent triple-space triggering
        } else {
            lastSpacePress = currentTime;
        }
    }
});

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWordSearch);
} else {
    initWordSearch();
}
