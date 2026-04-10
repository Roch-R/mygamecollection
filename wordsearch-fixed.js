/* ============================================
   WORD SEARCH GAME - FIXED VERSION
   ============================================ */

// Make state globally accessible
window.wordSearchState = {
    canvas: null,
    ctx: null,
    grid: [],
    words: [],
    wordPlacements: [], // Track how each word was placed (direction, start position)
    foundWords: [],
    selectedCells: [],
    isSelecting: false,
    isReverseSelection: false,  // Track if current selection is reversed
    wrongDirectionSelected: false, // Track if user selected wrong direction
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

const WORD_CATS = {
    // Chapters 1-10 - Short words (3-6 letters)
    animals: ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'TIGER', 'BEAR', 'WOLF', 'FOX', 'DEER', 'EAGLE', 'HAWK'],
    fruits: ['APPLE', 'BANANA', 'GRAPE', 'MANGO', 'PEACH', 'PLUM', 'PEAR', 'BERRY', 'MELON', 'LEMON', 'ORANGE', 'CHERRY'],
    colors: ['RED', 'BLUE', 'GREEN', 'PINK', 'PURPLE', 'ORANGE', 'YELLOW', 'BLACK', 'WHITE', 'BROWN', 'GRAY', 'SILVER'],
    countries: ['USA', 'CHINA', 'JAPAN', 'FRANCE', 'GERMANY', 'BRAZIL', 'INDIA', 'ITALY', 'SPAIN', 'MEXICO', 'CANADA', 'KOREA'],
    sports: ['SOCCER', 'TENNIS', 'GOLF', 'HOCKEY', 'RUGBY', 'BOXING', 'SWIMMING', 'CYCLING', 'SKIING', 'SURFING', 'VOLLEYBALL'],
    foods: ['PIZZA', 'BURGER', 'PASTA', 'SALAD', 'STEAK', 'CHICKEN', 'RICE', 'BREAD', 'CHEESE', 'BACON', 'WAFFLE', 'PANCAKE'],
    vehicles: ['CAR', 'BUS', 'TRAIN', 'PLANE', 'BOAT', 'SHIP', 'BIKE', 'TRUCK', 'VAN', 'JET', 'HELICOPTER', 'SUBMARINE'],
    nature: ['TREE', 'FLOWER', 'GRASS', 'CLOUD', 'RAIN', 'SNOW', 'WIND', 'FIRE', 'WATER', 'EARTH', 'MOUNTAIN', 'RIVER'],
    space: ['STAR', 'MOON', 'SUN', 'MARS', 'VENUS', 'JUPITER', 'SATURN', 'URANUS', 'PLUTO', 'COMET', 'ASTEROID', 'GALAXY'],
    weather: ['RAIN', 'SNOW', 'WIND', 'STORM', 'CLOUD', 'SUNNY', 'CLOUDY', 'RAINY', 'SNOWY', 'WINDY', 'FOG', 'THUNDER'],
    // Chapters 11-20 - Medium words (4-7 letters)
    ocean: ['WAVE', 'TIDE', 'SHARK', 'WHALE', 'DOLPHIN', 'CORAL', 'FISH', 'SEAL', 'OCTOPUS', 'CRAB', 'LOBSTER', 'PEARL'],
    jungle: ['MONKEY', 'SNAKE', 'PARROT', 'TIGER', 'LEOPARD', 'GORILLA', 'PANDA', 'ZEBRA', 'LIZARD', 'FROG', 'CAMEL', 'HIPPO'],
    desert: ['CAMEL', 'CACTUS', 'SAND', 'DUNE', 'SNAKE', 'SCORPION', 'OASIS', 'LIZARD', 'HAWK', 'FOX', 'VULTURE', 'IGUANA'],
    mountain: ['PEAK', 'CLIFF', 'VALLEY', 'EAGLE', 'GOAT', 'SNOW', 'ROCK', 'MIST', 'PINE', 'CEDAR', 'FIR', 'STONE'],
    forest: ['OAK', 'MAPLE', 'PINE', 'DEER', 'OWL', 'WOLF', 'BEAR', 'FOX', 'TREE', 'BARK', 'LEAF', 'MOSS'],
    // Chapters 21-30 - All word lengths for hard difficulty
    body: ['HEAD', 'HAND', 'FOOT', 'ARM', 'LEG', 'EYE', 'EAR', 'NOSE', 'MOUTH', 'HAIR', 'SKIN', 'BONE'],
    tech: ['CODE', 'DATA', 'BYTE', 'WEB', 'APP', 'NET', 'BOT', 'CPU', 'RAM', 'DISK', 'FILE', 'LINK'],
    music: ['ROCK', 'JAZZ', 'POP', 'BLUES', 'RAP', 'FOLK', 'SOUL', 'LATIN', 'REGGAE', 'PUNK', 'DISCO', 'HOUSE'],
    art: ['PAINT', 'BRUSH', 'COLOR', 'SKETCH', 'DRAW', 'FRAME', 'ART', 'MUSE', 'CLAY', 'INK', 'PEN', 'PAPER'],
    books: ['READ', 'BOOK', 'PAGE', 'WORD', 'TEXT', 'POEM', 'NOVEL', 'STORY', 'PLOT', 'HERO', 'EDIT', 'DRAFT'],
    kitchen: ['PLATE', 'SPOON', 'KNIFE', 'GLASS', 'MUG', 'PAN', 'POT', 'BOWL', 'FORK', 'JUG', 'KETTLE', 'TRAY'],
    bedroom: ['BED', 'LAMP', 'RUG', 'DOOR', 'DESK', 'LACE', 'COAT', 'HOLD', 'RACK', 'MAT', 'PAD', 'CASE'],
    bathroom: ['SOAP', 'TOWEL', 'SHOWER', 'SINK', 'TILE', 'BATH', 'TUB', 'MIRROR', 'FLOOR', 'WALL', 'TAP', 'SPONGE'],
    office: ['DESK', 'CHAIR', 'PAPER', 'PEN', 'STAPLER', 'CLOCK', 'LAMP', 'FILE', 'FOLDER', 'NOTE', 'INBOX', 'OUTBOX'],
    school: ['BOOK', 'DESK', 'TEACHER', 'STUDENT', 'CHALK', 'BOARD', 'CLASS', 'GRADE', 'TEST', 'ESSAY', 'LAB', 'CLASS'],
    city: ['TOWN', 'CITY', 'TOWER', 'STREET', 'STORE', 'PARK', 'HOTEL', 'MUSEUM', 'THEATER', 'LIBRARY', 'POST', 'BANK'],
    home: ['HOUSE', 'DOOR', 'WINDOW', 'ROOF', 'WALL', 'FLOOR', 'YARD', 'GATE', 'ROOM', 'KITCHEN', 'BED', 'BATH'],
    time: ['HOUR', 'MINUTE', 'SECOND', 'TODAY', 'TOMORROW', 'YESTERDAY', 'WEEK', 'MONTH', 'YEAR', 'CLOCK', 'DATE', 'DAWN'],
    number: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ZERO', 'DOZEN'],
    shape: ['CIRCLE', 'SQUARE', 'TRIANGLE', 'STAR', 'HEART', 'OVAL', 'DIAMOND', 'CROSS', 'CRESCENT', 'RING', 'BALL', 'CUBE'],
    feeling: ['HAPPY', 'SAD', 'ANGRY', 'CALM', 'BRAVE', 'SHY', 'JOY', 'FEAR', 'LOVE', 'HOPE', 'GRIEF', 'JEALOUS'],
    job: ['DOCTOR', 'TEACHER', 'COOK', 'DRIVER', 'NURSE', 'POLICE', 'FARMER', 'ARTIST', 'PILOT', 'ACTOR', 'LAWYER', 'CHEF'],
    family: ['MOM', 'DAD', 'SISTER', 'BROTHER', 'GRANDMA', 'GRANDPA', 'COUSIN', 'AUNT', 'UNCLE', 'NEPHEW', 'NIECE', 'FRIEND']
};

const CHAPTER_WORDS = [
    // Chapters 1-10
    'animals', 'fruits', 'colors', 'countries', 'sports',
    'foods', 'vehicles', 'nature', 'space', 'weather',
    // Chapters 11-20
    'ocean', 'jungle', 'desert', 'mountain', 'forest',
    'body', 'tech', 'music', 'art', 'books',
    // Chapters 21-30
    'kitchen', 'bedroom', 'bathroom', 'office', 'school',
    'city', 'home', 'time', 'number', 'shape'
];

// Init function
function initWordSearch() {
    const state = window.wordSearchState;
    state.canvas = document.getElementById('wordsearch-canvas');
    state.ctx = state.canvas.getContext('2d');

    // Apply inline styles to prevent text selection on canvas content
    state.canvas.style.userSelect = 'none';
    state.canvas.style.webkitUserSelect = 'none';
    state.canvas.style.MozUserSelect = 'none';
    state.canvas.style.msUserSelect = 'none';
    state.canvas.style.webkitTouchCallout = 'none';

    const maxW = Math.min(450, window.innerWidth - 40);
    state.canvas.width = maxW;
    // Scale height proportionally for small screens
    state.canvas.height = window.innerWidth < 480 ? Math.min(560, window.innerHeight - 280) : 650;

    state.score = 0;
    state.time = 180;
    state.isRunning = false;
    state.highScore = parseInt(localStorage.getItem('wordsearchHighScore')) || 0;

    document.getElementById('wordsearch-score').textContent = '0';
    document.getElementById('wordsearch-time').textContent = '3:00';
    document.getElementById('wordsearch-chapter').textContent = '1';
    document.getElementById('wordsearch-high').textContent = state.highScore;

    drawStartScreen();
    setupCanvasEvents();
}

function setupCanvasEvents() {
    const canvas = window.wordSearchState.canvas;
    
    // Prevent text selection on canvas - disables browser text selection when dragging
    canvas.onselectstart = function() { return false; };
    canvas.ondragstart = function() { return false; };
    
    // Use direct inline handlers
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
    
    const cell = getCellAt(x, y);
    if (cell) {
        state.isSelecting = true;
        state.selectedCells = [cell];
        drawGame();
    }
}

function handleMouseMove(e) {
    const state = window.wordSearchState;
    if (!state.isRunning || !state.isSelecting) return;
    
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cell = getCellAt(x, y);
    if (cell) {
        updateSelection(cell);
    }
}

function handleMouseUp(e) {
    const state = window.wordSearchState;
    if (!state.isRunning) return;

    state.isSelecting = false;
    checkWord();
    // checkWord() already clears selectedCells and calls drawGame()
    // Only clear if checkWord didn't handle it (e.g. single cell tap)
    if (state.selectedCells.length > 0) {
        state.selectedCells = [];
        drawGame();
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = window.wordSearchState.canvas.getBoundingClientRect();
    handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = window.wordSearchState.canvas.getBoundingClientRect();
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
}

function handleTouchEnd(e) {
    e.preventDefault();
    handleMouseUp(e);
}

function getCellAt(x, y) {
    const state = window.wordSearchState;
    const rect = state.canvas.getBoundingClientRect();
    const scaleX = state.canvas.width / rect.width;
    const scaleY = state.canvas.height / rect.height;
    const col = Math.floor((x * scaleX - state.offsetX) / state.cellSize);
    const row = Math.floor((y * scaleY - state.offsetY) / state.cellSize);

    if (row >= 0 && row < state.gridSize && col >= 0 && col < state.gridSize) {
        return { r: row, c: col };
    }
    return null;
}

function updateSelection(endCell) {
    const state = window.wordSearchState;
    if (state.selectedCells.length === 0) return;
    
    const start = state.selectedCells[0];
    const dr = endCell.r - start.r;
    const dc = endCell.c - start.c;
    
    // Allow horizontal, vertical, or diagonal
    if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
        const steps = Math.max(Math.abs(dr), Math.abs(dc));
        const stepR = dr === 0 ? 0 : dr / steps;
        const stepC = dc === 0 ? 0 : dc / steps;
        
        state.selectedCells = [];
        for (let i = 0; i <= steps; i++) {
            state.selectedCells.push({
                r: start.r + stepR * i,
                c: start.c + stepC * i
            });
        }
    }
    
    drawGame();
}

function checkWord() {
    var state = window.wordSearchState;
    if (state.selectedCells.length < 2) return;

    var sel = state.selectedCells;

    for (var i = 0; i < state.words.length; i++) {
        var target = state.words[i];
        if (state.foundWords.some(function(fw) { return fw.word === target; })) continue;

        // Find where this word is actually placed in the grid
        var placement = state.wordPlacements
            ? state.wordPlacements.find(function(p) { return p.word === target; })
            : null;
        if (!placement) continue;

        // Selection must be exactly as long as the word
        if (sel.length !== target.length) continue;

        // Build the exact cells where this word lives
        var placedCells = [];
        for (var j = 0; j < target.length; j++) {
            placedCells.push({
                r: placement.startR + placement.dr * j,
                c: placement.startC + placement.dc * j
            });
        }

        // Only forward match — user must drag in the same direction the word was placed
        var forwardMatch = sel.every(function(s, idx) {
            return s.r === placedCells[idx].r && s.c === placedCells[idx].c;
        });

        if (forwardMatch) {
            // ✅ CORRECT — store actual placed cells so green highlight is accurate
            state.foundWords.push({ word: target, cells: placedCells });

            var points = target.length * 10;
            state.score += points;
            document.getElementById('wordsearch-score').textContent = state.score;

            if (typeof showToast === 'function') showToast('✅ Found: ' + target + '! +' + points, 'success');

            state.selectedCells = [];
            drawGame();

            if (state.foundWords.length === state.words.length) {
                levelComplete();
            }
            return;
        }
    }

    // ❌ WRONG — flash red on the selected cells
    state.wrongSelection = sel.slice();
    state.selectedCells = [];
    drawGame();

    if (state.wrongTimeout) clearTimeout(state.wrongTimeout);
    state.wrongTimeout = setTimeout(function() {
        state.wrongSelection = null;
        drawGame();
    }, 700);
}

function levelComplete() {
    const state = window.wordSearchState;
    state.isRunning = false;
    
    if (state.timer) clearInterval(state.timer);
    
    const bonus = state.time * 2;
    state.score += bonus;
    document.getElementById('wordsearch-score').textContent = state.score;
    
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('wordsearchHighScore', state.highScore);
        document.getElementById('wordsearch-high').textContent = state.highScore;
        showToast('New High Score: ' + state.score + '! 🏆', 'success');
    }
    
    // Show completion popup instead of auto-progressing
    showLevelCompletePopup(state.chapter, state.difficulty, state.score);
}

// Backup showToast if not available
if (typeof showToast === 'undefined') {
    window.showToast = function(message, type) {
        console.log(message);
        alert(message);
    };
}

function showLevelCompletePopup(chapter, difficulty, score) {
    // Remove existing overlay
    const existing = document.querySelector('.wordsearch-complete');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'wordsearch-complete';
    overlay.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.85) !important; display: flex !important; justify-content: center !important; align-items: center !important; z-index: 99999 !important;';
    
    const timeBonus = window.wordSearchState ? window.wordSearchState.time * 2 : 0;
    
    overlay.innerHTML = '<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px; border-radius: 20px; text-align: center; border: 3px solid #667eea; box-shadow: 0 0 30px rgba(102, 126, 234, 0.5); max-width: 90%; font-family: Segoe UI, sans-serif;">' +
        '<h2 style="color: #ffd700; margin: 0 0 10px 0; font-size: 28px;">🎉 Chapter ' + chapter + ' ' + difficulty.toUpperCase() + ' Complete!</h2>' +
        '<p style="color: #2ed573; font-size: 24px; margin: 10px 0;">Score: ' + score + '</p>' +
        '<p style="color: #aaa; margin: 15px 0 25px 0;">Time Bonus: +' + timeBonus + '</p>' +
        '<button id="ws-continue-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 15px 40px; border-radius: 10px; font-size: 18px; cursor: pointer; margin: 5px; font-weight: bold;">Continue ➡️</button><br>' +
        '<button id="ws-replay-btn" style="background: #ffa502; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; margin: 5px;">Play Again 🔄</button><br>' +
        '<button id="ws-menu-btn" style="background: #333; color: white; border: none; padding: 10px 25px; border-radius: 8px; font-size: 14px; cursor: pointer; margin-top: 10px;">Back to Menu</button></div>';
    document.body.appendChild(overlay);
    
    // Force show the overlay
    overlay.style.display = 'flex';
    
    // Add event listeners
    document.getElementById('ws-continue-btn').addEventListener('click', function() {
        overlay.remove();
        window.autoNextLevel();
    });
    document.getElementById('ws-replay-btn').addEventListener('click', function() {
        overlay.remove();
        window.startWordSearch();
    });
    document.getElementById('ws-menu-btn').addEventListener('click', function() {
        overlay.remove();
        window.initWordSearch();
    });
    
    // Click outside to close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
            window.initWordSearch();
        }
    });
    
    console.log('Level complete popup shown for Chapter ' + chapter);
}

function autoNextLevel() {
    const state = window.wordSearchState;
    
    // Calculate next level
    const difficulties = ['easy', 'medium', 'hard'];
    const currentDiffIndex = difficulties.indexOf(state.difficulty);
    let nextChapter = state.chapter;
    let nextDifficulty = state.difficulty;
    
    if (currentDiffIndex < 2) {
        // Go to next difficulty in same chapter
        nextDifficulty = difficulties[currentDiffIndex + 1];
    } else {
        // Go to next chapter, easy difficulty
        nextChapter = state.chapter + 1;
        if (nextChapter > 30) {
            showToast('🎉 You completed all 90 levels! Amazing!', 'success');
            return;
        }
        nextDifficulty = 'easy';
    }
    
    // Update state
    state.chapter = nextChapter;
    state.difficulty = nextDifficulty;
    
    // Update dropdowns
    const diffSelect = document.getElementById('wordsearch-difficulty');
    const chapSelect = document.getElementById('wordsearch-chapter-select');
    diffSelect.value = nextDifficulty;
    chapSelect.value = nextChapter;
    
    // Update UI
    document.getElementById('wordsearch-chapter').textContent = nextChapter;
    
    // Start next level
    showToast('Starting Chapter ' + nextChapter + ' - ' + nextDifficulty.toUpperCase() + '...', 'info');
    startWordSearch();
}

// Start function
function startWordSearch() {
    var state = window.wordSearchState;
    
    // Get settings from dropdowns if available, otherwise use defaults
    var diffSelect = document.getElementById('wordsearch-difficulty');
    var chapSelect = document.getElementById('wordsearch-chapter-select');
    
    if (diffSelect && chapSelect) {
        state.difficulty = diffSelect.value;
        state.chapter = parseInt(chapSelect.value) || 1;
    } else {
        // Fallback to defaults
        state.difficulty = 'easy';
        state.chapter = 1;
    }
    
    console.log('Starting chapter:', state.chapter, 'difficulty:', state.difficulty);
    
    // Grid settings - adjusted for better gameplay
    var settings = {
        easy: { size: 7, count: 5, time: 180 },
        medium: { size: 8, count: 5, time: 240 },
        hard: { size: 10, count: 6, time: 300 }
    };
    var s = settings[state.difficulty] || settings.easy;
    state.gridSize = s.size;
    
    // Calculate cell size - make it responsive based on canvas size and grid size
    // For hard mode (10x10), we need smaller cells to fit the canvas
    var canvasWidth = state.canvas.width;
    var canvasHeight = state.canvas.height;
    
    // Calculate available space considering header and word list areas
    var headerSpace = 80; // Space for title
    var footerSpace = 100; // Space for words list
    
    var availableWidth = canvasWidth - 40; // padding
    var availableHeight = canvasHeight - headerSpace - footerSpace;
    
    // Calculate cell size to fit both dimensions
    var cellSizeFromWidth = Math.floor(availableWidth / state.gridSize);
    var cellSizeFromHeight = Math.floor(availableHeight / state.gridSize);
    state.cellSize = Math.min(cellSizeFromWidth, cellSizeFromHeight);
    
    // Ensure minimum cell size for readability
    state.cellSize = Math.max(state.cellSize, 25);
    
    // Center the grid
    state.offsetX = (canvasWidth - state.cellSize * state.gridSize) / 2;
    state.offsetY = headerSpace;
    
    // Generate words - filter by maximum length that fits in grid
    const catName = CHAPTER_WORDS[(state.chapter - 1) % CHAPTER_WORDS.length];
    const allWords = WORD_CATS[catName] || WORD_CATS.animals;
    
    // Filter words that can fit in the grid (accounting for diagonal placement)
    const maxWordLen = Math.floor(state.gridSize * 0.9);
    const suitableWords = allWords.filter(function(w) { return w.length <= maxWordLen; });
    
    // Shuffle and pick required number of words
    const shuffled = suitableWords.slice().sort(function() { return Math.random() - 0.5; });
    state.words = shuffled.slice(0, s.count);
    
    // If not enough suitable words, add from original list
    if (state.words.length < s.count) {
        const remaining = allWords.filter(function(w) { return state.words.indexOf(w) === -1; });
        const remainingShuffled = remaining.slice().sort(function() { return Math.random() - 0.5; });
        state.words = state.words.concat(remainingShuffled.slice(0, s.count - state.words.length));
    }
    
    // Generate grid
    state.grid = [];
    for (var r = 0; r < state.gridSize; r++) {
        state.grid[r] = [];
        for (var c = 0; c < state.gridSize; c++) {
            state.grid[r][c] = '';
        }
    }
    
    // Place words - retry until all fit
    var placedWords = [];
    var attempts = 0;
    var maxAttempts = 50;
    
    while (placedWords.length < state.words.length && attempts < maxAttempts) {
        // Clear grid AND placements so stale data doesn't carry over to next attempt
        for (var r2 = 0; r2 < state.gridSize; r2++) {
            for (var c2 = 0; c2 < state.gridSize; c2++) {
                state.grid[r2][c2] = '';
            }
        }
        placedWords = [];
        state.wordPlacements = [];
        
        // Shuffle words for this attempt
        var wordsToTry = state.words.slice().sort(function() { return Math.random() - 0.5; });
        
        for (var wi = 0; wi < wordsToTry.length; wi++) {
            var w = wordsToTry[wi];
            if (placeWord(w)) {
                placedWords.push(w);
            }
        }
        attempts++;
    }
    
    // Update words to only those that were placed
    state.words = placedWords;
    
    // If still no words placed, create a simple fallback
    if (state.words.length === 0) {
        state.words = ['CAT', 'DOG', 'BIRD', 'FISH', 'LION'];
        for (var r3 = 0; r3 < state.gridSize; r3++) {
            for (var c3 = 0; c3 < state.gridSize; c3++) {
                state.grid[r3][c3] = '';
            }
        }
        for (var wi2 = 0; wi2 < state.words.length; wi2++) {
            placeWord(state.words[wi2]);
        }
    }
    
    // Fill empty
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var r4 = 0; r4 < state.gridSize; r4++) {
        for (var c4 = 0; c4 < state.gridSize; c4++) {
            if (state.grid[r4][c4] === '') {
                state.grid[r4][c4] = letters.charAt(Math.floor(Math.random() * letters.length));
            }
        }
    }
    
    // Reset - clear any existing game state first (but keep grid and words)
    if (state.timer) clearInterval(state.timer);
    
    state.score = 0;
    state.time = s.time;
    state.isRunning = true;
    state.foundWords = [];
    state.selectedCells = [];
    // NOTE: do NOT clear state.wordPlacements here — it was built during placement above

    document.getElementById('wordsearch-score').textContent = '0';
    document.getElementById('wordsearch-time').textContent = formatTime(state.time);
    document.getElementById('wordsearch-chapter').textContent = state.chapter;
    
    var startBtn = document.querySelector('.wordsearch-start-btn');
    if (startBtn) startBtn.style.display = 'none';
    
    // Timer
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(function() {
        if (state.isRunning) {
            state.time--;
            document.getElementById('wordsearch-time').textContent = formatTime(state.time);
            
            if (state.time <= 0) {
                state.isRunning = false;
                clearInterval(state.timer);
                showTimeUpOverlay();
            }
        }
    }, 1000);
    
    drawGame();
    showToast('Word Search - Chapter ' + state.chapter + ' Started!', 'info');
}

function placeWord(word) {
    var state = window.wordSearchState;
    var dirs = [
        {dr:0,dc:1, name:'right'},   // Horizontal right
        {dr:1,dc:0, name:'down'},   // Vertical down
        {dr:1,dc:1, name:'down-right'},   // Diagonal down-right
        {dr:-1,dc:1, name:'up-right'},  // Diagonal up-right
        {dr:0,dc:-1, name:'left'},  // Horizontal left
        {dr:-1,dc:0, name:'up'},  // Vertical up
        {dr:-1,dc:-1, name:'up-left'}, // Diagonal up-left
        {dr:1,dc:-1, name:'down-left'}   // Diagonal down-left
    ];
    
    for (var attempt = 0; attempt < 150; attempt++) {
        var dir = dirs[Math.floor(Math.random() * dirs.length)];
        
        var startR, startC;
        
        // Calculate valid starting positions based on direction
        if (dir.dr === 0) {
            // Horizontal
            startR = Math.floor(Math.random() * state.gridSize);
            if (dir.dc > 0) {
                startC = Math.floor(Math.random() * (state.gridSize - word.length + 1));
            } else {
                startC = Math.floor(Math.random() * (state.gridSize - word.length + 1)) + word.length - 1;
            }
        } else if (dir.dc === 0) {
            // Vertical
            startC = Math.floor(Math.random() * state.gridSize);
            if (dir.dr > 0) {
                startR = Math.floor(Math.random() * (state.gridSize - word.length + 1));
            } else {
                startR = Math.floor(Math.random() * (state.gridSize - word.length + 1)) + word.length - 1;
            }
        } else {
            // Diagonal
            if (dir.dr > 0 && dir.dc > 0) {
                // Down-right
                startR = Math.floor(Math.random() * (state.gridSize - word.length + 1));
                startC = Math.floor(Math.random() * (state.gridSize - word.length + 1));
            } else if (dir.dr > 0 && dir.dc < 0) {
                // Down-left
                startR = Math.floor(Math.random() * (state.gridSize - word.length + 1));
                startC = Math.floor(Math.random() * (state.gridSize - word.length + 1)) + word.length - 1;
            } else if (dir.dr < 0 && dir.dc > 0) {
                // Up-right
                startR = Math.floor(Math.random() * (state.gridSize - word.length + 1)) + word.length - 1;
                startC = Math.floor(Math.random() * (state.gridSize - word.length + 1));
            } else {
                // Up-left
                startR = Math.floor(Math.random() * (state.gridSize - word.length + 1)) + word.length - 1;
                startC = Math.floor(Math.random() * (state.gridSize - word.length + 1)) + word.length - 1;
            }
        }
        
        // Validate bounds before checking
        if (startR < 0 || startR >= state.gridSize || startC < 0 || startC >= state.gridSize) {
            continue;
        }
        
        var fits = true;
        for (var i = 0; i < word.length; i++) {
            var r = startR + dir.dr * i;
            var c = startC + dir.dc * i;
            
            // Check bounds
            if (r < 0 || r >= state.gridSize || c < 0 || c >= state.gridSize) {
                fits = false;
                break;
            }
            
            var cell = state.grid[r][c];
            if (cell !== '' && cell !== word.charAt(i)) {
                fits = false;
                break;
            }
        }
        
        if (fits) {
            for (var i2 = 0; i2 < word.length; i2++) {
                state.grid[startR + dir.dr * i2][startC + dir.dc * i2] = word.charAt(i2);
            }
            // Store the placement info (direction and start position)
            if (!state.wordPlacements) state.wordPlacements = [];
            state.wordPlacements.push({
                word: word,
                direction: dir.name,
                startR: startR,
                startC: startC,
                dr: dir.dr,
                dc: dir.dc
            });
            return true;
        }
    }
    return false;
}

function formatTime(sec) {
    return Math.floor(sec / 60) + ':' + (sec % 60).toString().padStart(2, '0');
}

function drawStartScreen() {
    var state = window.wordSearchState;
    var ctx = state.ctx;
    var cvs = state.canvas;
    
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    
    var grad = ctx.createLinearGradient(0, 0, 0, cvs.height);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#667eea';
    ctx.font = 'bold 32px Segoe UI';
    ctx.fillText('WORD SEARCH', cvs.width/2, 100);
    
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Segoe UI';
    ctx.fillText('UNIVERSE', cvs.width/2, 130);
    
    ctx.fillStyle = '#aaa';
    ctx.font = '14px Segoe UI';
    ctx.fillText('Find hidden words!', cvs.width/2, 200);
    ctx.fillText('Drag to select letters', cvs.width/2, 225);
    
    ctx.fillStyle = '#667eea';
    ctx.font = '14px Segoe UI';
    ctx.fillText('Select difficulty & chapter, then click Start', cvs.width/2, cvs.height - 30);
}

function drawGame() {
    var state = window.wordSearchState;
    var ctx = state.ctx;
    var cvs = state.canvas;
    // === BACKGROUND — deep space gradient ===
    var bg = ctx.createLinearGradient(0, 0, cvs.width, cvs.height);
    bg.addColorStop(0,   '#0d0d2b');
    bg.addColorStop(0.5, '#0a1628');
    bg.addColorStop(1,   '#110d2b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    // Subtle star dots
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    var stars = [[30,20],[80,55],[150,15],[200,40],[310,10],[380,60],[420,30],[60,120],[340,90],[410,110],[25,160],[100,190],[250,170],[390,200],[450,140],[70,230],[180,250],[300,220],[430,260],[140,280]];
    for (var si = 0; si < stars.length; si++) {
        ctx.beginPath();
        ctx.arc(stars[si][0] % cvs.width, stars[si][1], 1, 0, Math.PI*2);
        ctx.fill();
    }

    // === HEADER ===
    var catName = CHAPTER_WORDS[(state.chapter - 1) % CHAPTER_WORDS.length];

    // Title glow
    ctx.save();
    ctx.shadowColor = '#7c6cf0';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 18px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Chapter ' + state.chapter + ' \u2014 ' + state.difficulty.toUpperCase(), cvs.width/2, 28);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('\u2728 Category: ' + catName.toUpperCase() + ' \u2728', cvs.width/2, 50);
    ctx.restore();

    // === GRID PANEL — glowing border box ===
    var pad = 8;
    var bgX = state.offsetX - pad;
    var bgY = state.offsetY - pad;
    var bgW = state.cellSize * state.gridSize + pad * 2;
    var bgH = state.cellSize * state.gridSize + pad * 2;

    ctx.save();
    ctx.shadowColor = '#6c63ff';
    ctx.shadowBlur = 30;
    ctx.strokeStyle = '#6c63ff';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(20,15,50,0.85)';
    ctx.beginPath();
    ctx.roundRect(bgX, bgY, bgW, bgH, 14);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Subtle inner grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(108,99,255,0.12)';
    ctx.lineWidth = 1;
    for (var gi = 1; gi < state.gridSize; gi++) {
        // vertical
        ctx.beginPath();
        ctx.moveTo(state.offsetX + gi * state.cellSize, state.offsetY);
        ctx.lineTo(state.offsetX + gi * state.cellSize, state.offsetY + state.gridSize * state.cellSize);
        ctx.stroke();
        // horizontal
        ctx.beginPath();
        ctx.moveTo(state.offsetX, state.offsetY + gi * state.cellSize);
        ctx.lineTo(state.offsetX + state.gridSize * state.cellSize, state.offsetY + gi * state.cellSize);
        ctx.stroke();
    }
    ctx.restore();

    // === CELLS ===
    for (var r = 0; r < state.gridSize; r++) {
        for (var c = 0; c < state.gridSize; c++) {
            var x = state.offsetX + c * state.cellSize;
            var y = state.offsetY + r * state.cellSize;

            var isSel   = state.selectedCells.some(function(s) { return s.r === r && s.c === c; });
            var isWrong = state.wrongSelection && state.wrongSelection.some(function(s) { return s.r === r && s.c === c; });
            var isFnd   = state.foundWords.some(function(fw) {
                return fw.cells.some(function(fc) { return fc.r === r && fc.c === c; });
            });

            var cellPad = 3;
            ctx.save();

            if (isFnd) {
                ctx.shadowColor = '#00ff88';
                ctx.shadowBlur = 16;
                var gf = ctx.createLinearGradient(x, y, x + state.cellSize, y + state.cellSize);
                gf.addColorStop(0, 'rgba(0,230,100,0.55)');
                gf.addColorStop(1, 'rgba(0,180,80,0.35)');
                ctx.fillStyle = gf;
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 2;
            } else if (isWrong) {
                ctx.shadowColor = '#ff3355';
                ctx.shadowBlur = 18;
                var gr = ctx.createLinearGradient(x, y, x + state.cellSize, y + state.cellSize);
                gr.addColorStop(0, 'rgba(255,50,80,0.55)');
                gr.addColorStop(1, 'rgba(200,20,50,0.35)');
                ctx.fillStyle = gr;
                ctx.strokeStyle = '#ff3355';
                ctx.lineWidth = 2;
            } else if (isSel) {
                ctx.shadowColor = '#ffe033';
                ctx.shadowBlur = 20;
                var gs = ctx.createLinearGradient(x, y, x + state.cellSize, y + state.cellSize);
                gs.addColorStop(0, 'rgba(255,220,0,0.45)');
                gs.addColorStop(1, 'rgba(255,160,0,0.25)');
                ctx.fillStyle = gs;
                ctx.strokeStyle = '#ffe033';
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = 'rgba(30,22,65,0.7)';
                ctx.strokeStyle = 'rgba(108,99,255,0.22)';
                ctx.lineWidth = 1;
                ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.roundRect(x + cellPad, y + cellPad, state.cellSize - cellPad*2, state.cellSize - cellPad*2, 7);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Letter
            ctx.save();
            if (isFnd) {
                ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 12;
                ctx.fillStyle = '#ffffff';
            } else if (isWrong) {
                ctx.shadowColor = '#ff3355'; ctx.shadowBlur = 10;
                ctx.fillStyle = '#ffaaaa';
            } else if (isSel) {
                ctx.shadowColor = '#ffe033'; ctx.shadowBlur = 14;
                ctx.fillStyle = '#fff5aa';
            } else {
                ctx.shadowColor = '#6c63ff'; ctx.shadowBlur = 4;
                ctx.fillStyle = '#c8c0ff';
            }
            ctx.font = 'bold ' + Math.round(state.cellSize * 0.48) + 'px Segoe UI';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(state.grid[r][c], x + state.cellSize/2, y + state.cellSize/2);
            ctx.restore();
        }
    }

    // === WORD LIST ===
    var gridBottom = state.offsetY + state.gridSize * state.cellSize;
    var listY = gridBottom + 22;

    // "Words to Find" label
    ctx.save();
    ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('\u25bc  WORDS TO FIND  \u25bc', cvs.width/2, listY);
    ctx.restore();

    listY += 18;
    var cols = Math.min(state.words.length, 3);
    var colW = cvs.width / cols;

    state.words.forEach(function(w, i) {
        var isF = state.foundWords.some(function(fw) { return fw.word === w; });
        var col = i % cols;
        var row = Math.floor(i / cols);
        var wx = colW * col + colW / 2;
        var wy = listY + row * 26;

        // Pill background
        var pillW = Math.min(colW - 10, w.length * 10 + 24);
        var pillH = 20;
        ctx.save();
        if (isF) {
            ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(0,200,80,0.25)';
            ctx.strokeStyle = '#00cc66';
        } else {
            ctx.fillStyle = 'rgba(108,99,255,0.18)';
            ctx.strokeStyle = 'rgba(108,99,255,0.5)';
        }
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(wx - pillW/2, wy - pillH/2, pillW, pillH, 10);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.save();
        if (isF) {
            ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 8;
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 12px Segoe UI';
        } else {
            ctx.fillStyle = '#d0c8ff';
            ctx.font = '11px Segoe UI';
            ctx.shadowBlur = 0;
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((isF ? '\u2713 ' : '') + w, wx, wy);
        ctx.restore();
    });

    // Progress bar
    var found = state.foundWords.length;
    var total = state.words.length;
    if (total > 0) {
        var barY = cvs.height - 18;
        var barX = 20;
        var barW = cvs.width - 40;
        var barH = 6;
        // Track
        ctx.save();
        ctx.fillStyle = 'rgba(108,99,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 3);
        ctx.fill();
        // Fill
        ctx.shadowColor = '#6c63ff'; ctx.shadowBlur = 8;
        var prog = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        prog.addColorStop(0, '#a78bfa');
        prog.addColorStop(1, '#00ff88');
        ctx.fillStyle = prog;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * (found / total), barH, 3);
        ctx.fill();
        ctx.restore();
    }
}

// Make functions globally available
window.initWordSearch = initWordSearch;
window.startWordSearch = startWordSearch;
window.autoNextLevel = autoNextLevel;
window.handleMouseDown = handleMouseDown;
window.handleMouseMove = handleMouseMove;
window.handleMouseUp = handleMouseUp;
window.handleTouchStart = handleTouchStart;
window.handleTouchMove = handleTouchMove;
window.handleTouchEnd = handleTouchEnd;

function showTimeUpOverlay() {
    var state = window.wordSearchState;
    
    // Remove existing overlay
    var existing = document.querySelector('.wordsearch-timeup');
    if (existing) existing.remove();
    
    var overlay = document.createElement('div');
    overlay.className = 'wordsearch-timeup';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;';
    
    overlay.innerHTML = '<div style="background: #1a1a2e; padding: 30px; border-radius: 15px; text-align: center; border: 2px solid #667eea;">' +
        '<h2 style="color: #ff4757; margin: 0 0 15px 0;">⏰ Time\'s Up!</h2>' +
        '<p style="color: #aaa; margin: 0 0 10px 0;">Words Found: ' + state.foundWords.length + ' / ' + state.words.length + '</p>' +
        '<p style="color: #aaa; margin: 0 0 20px 0;">Score: ' + state.score + '</p>' +
        '<button id="ws-timeup-continue" style="background: #667eea; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; margin: 5px;">Continue to Next ➡️</button>' +
        '<button id="ws-timeup-retry" style="background: #ffa502; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; margin: 5px;">Try Again 🔄</button><br>' +
        '<button id="ws-timeup-menu" style="background: #333; color: white; border: none; padding: 10px 25px; border-radius: 8px; font-size: 14px; cursor: pointer; margin-top: 10px;">Back to Menu</button></div>';
    document.body.appendChild(overlay);
    
    // Add event listeners
    document.getElementById('ws-timeup-continue').addEventListener('click', function() {
        overlay.remove();
        window.autoNextLevel();
    });
    document.getElementById('ws-timeup-retry').addEventListener('click', function() {
        overlay.remove();
        window.startWordSearch();
    });
    document.getElementById('ws-timeup-menu').addEventListener('click', function() {
        overlay.remove();
        window.initWordSearch();
    });
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWordSearch);
} else {
    initWordSearch();
}

// ============================================
// DOUBLE SPACE TO START
// ============================================

let lastSpacePress = 0;

document.addEventListener('keydown', function(e) {
    // Check if we're in the word search game area
    var wordsearchGame = document.getElementById('wordsearch-game');
    if (!wordsearchGame || wordsearchGame.classList.contains('hidden')) return;
    
    // Check for space key
    if (e.code === 'Space') {
        e.preventDefault();
        
        var state = window.wordSearchState;
        var currentTime = Date.now();
        
        // Check if it's a double space (within 500ms)
        if (currentTime - lastSpacePress < 500) {
            // Double space detected - start the game
            if (!state.isRunning) {
                startWordSearch();
                showToast('Game Started! 🔤', 'info');
            }
            lastSpacePress = 0;
        } else {
            lastSpacePress = currentTime;
        }
    }
});

