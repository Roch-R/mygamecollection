/* ============================================
   WORD SEARCH UNIVERSE GAME
   ============================================ */

// ============================================
// WORD CATEGORIES & DATA
// ============================================

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
    body: ['HEAD', 'HAND', 'FOOT', 'ARM', 'LEG', 'EYE', 'EAR', 'NOSE', 'MOUTH', 'HAIR', 'SKIN', 'BONE', 'HEART', 'BRAIN', 'LUNG', 'LIVER', 'KIDNEY', 'STOMACH', 'SPINE', 'MUSCLE'],
    jobs: ['DOCTOR', 'NURSE', 'TEACHER', 'LAWYER', 'CHEF', 'PILOT', 'ACTOR', 'SINGER', 'ARTIST', 'WRITER', 'DANCER', 'DRIVER', 'FARMER', 'POLICE', 'SOLDIER', 'JUDGE', 'MAYOR', 'CLERK', 'MECHANIC', 'PLUMBER'],
    movies: ['STAR', 'WAR', 'BATMAN', 'SPIDER', 'SUPERMAN', 'JOKER', 'AVENGERS', 'TITANIC', 'JURASSIC', 'MATRIX', 'GLADIATOR', 'TITAN', 'FROZEN', 'TOY', 'FINDING', 'SHREK', 'CINDERELLA', 'ALADDIN', 'PINOCCHIO', 'DUMBO'],
    music: ['ROCK', 'JAZZ', 'POP', 'BLUES', 'RAP', 'COUNTRY', 'METAL', 'FOLK', 'SOUL', 'LATIN', 'REGGAE', 'CLASSICAL', 'PUNK', 'DISCO', 'HOUSE', 'TECHNO', 'TRANCE', 'INDIE', 'HIP', 'HOP'],
    books: ['BIBLE', 'QURAN', 'TORAH', 'Koran', 'EPIC', 'MYTH', 'SAGA', 'TALE', 'STORY', 'NOVEL', 'POEM', 'ESSAY', 'DRAMA', 'FABLE', 'LEGEND', 'FOLKTALE', 'ALLEGORY', 'BIOGRAPHY', 'MANGA', 'COMIC'],
    technology: ['COMPUTER', 'PHONE', 'TABLET', 'ROBOT', 'INTERNET', 'SERVER', 'SOFTWARE', 'HARDWARE', 'KEYBOARD', 'MONITOR', 'MOUSE', 'PRINTER', 'CAMERA', 'SCANNER', 'ROUTER', 'MODEM', 'SPEAKER', 'MICROPHONE', 'FLASH', 'DRIVE'],
    shapes: ['CIRCLE', 'SQUARE', 'TRIANGLE', 'RECTANGLE', 'OVAL', 'PENTAGON', 'HEXAGON', 'OCTAGON', 'DIAMOND', 'STAR', 'HEART', 'CROSS', 'CRESCENT', 'SPIRAL', 'CYLINDER', 'CUBE', 'PYRAMID', 'CONE', 'SPHERE', 'PRISM'],
    numbers: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ZERO', 'DOZEN', 'SCORE', 'CENTURY', 'MILLION', 'BILLION', 'THOUSAND', 'HUNDRED', 'PRIME', 'DOUBLE'],
    time: ['DAY', 'NIGHT', 'MORNING', 'EVENING', 'NOON', 'MIDNIGHT', 'WEEK', 'MONTH', 'YEAR', 'CENTURY', 'DECADE', 'HOUR', 'MINUTE', 'SECOND', 'DAWN', 'DUSK', 'SUNRISE', 'SUNSET', 'TWILIGHT', 'ETERNITY'],
    emotions: ['HAPPY', 'SAD', 'ANGRY', 'FEAR', 'LOVE', 'HOPE', 'JOY', 'GRIEF', 'CALM', 'BORED', 'EXCITED', 'NERVOUS', 'BRAVE', 'SHY', 'PROUD', 'JEALOUS', 'GRATEFUL', 'LONELY', 'EAGER', 'RELAXED'],
    ocean: ['WAVE', 'TIDE', 'SHARK', 'WHALE', 'DOLPHIN', 'CORAL', 'FISH', 'SEAL', 'OCTOPUS', 'CRAB', 'LOBSTER', 'PEARL', 'SHELL', 'SAND', 'REEF', 'SALT', 'SQUID', 'TURTLE', 'STARFISH', 'JELLYFISH']
};

const CHAPTER_THEMES = [
    'animals', 'fruits', 'colors', 'countries', 'sports', 'foods', 'vehicles', 'nature',
    'space', 'weather', 'body', 'jobs', 'movies', 'music', 'books', 'technology',
    'shapes', 'numbers', 'time', 'emotions', 'ocean', 'animals', 'fruits', 'colors',
    'countries', 'sports', 'foods', 'vehicles', 'nature', 'space'
];

// ============================================
// WORD SEARCH GAME STATE
// ============================================

const wordSearchState = {
    canvas: null,
    ctx: null,
    grid: [],
    words: [],
    foundWords: [],
    selectedCells: [],
    isSelecting: false,
    wrongSelection: null,
    showWrongTimeout: null,
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
    highScore: parseInt(localStorage.getItem('wordsearchHighScore')) || 0,
    soundEnabled: true
};

// ============================================
// DIFFICULTY SETTINGS
// ============================================

const DIFFICULTY_SETTINGS = {
    easy: {
        gridSize: 7,
        wordCount: 5,
        timeLimit: 180,
        hintCount: 2
    },
    medium: {
        gridSize: 8,
        wordCount: 6,
        timeLimit: 240,
        hintCount: 1
    },
    hard: {
        gridSize: 10,
        wordCount: 8,
        timeLimit: 300,
        hintCount: 0
    }
};

// ============================================
// INITIALIZATION
// ============================================

function initWordSearch() {
    const state = wordSearchState;
    state.canvas = document.getElementById('wordsearch-canvas');
    state.ctx = state.canvas.getContext('2d');

    const maxW = Math.min(450, window.innerWidth - 60);
    const maxH = Math.min(550, window.innerHeight - 300);
    state.canvas.width = maxW;
    state.canvas.height = maxH;

    state.score = 0;
    state.time = 0;
    state.isRunning = false;
    state.foundWords = [];
    state.selectedCells = [];
    state.isSelecting = false;

    document.getElementById('wordsearch-score').textContent = '0';
    document.getElementById('wordsearch-time').textContent = '3:00';
    document.getElementById('wordsearch-chapter').textContent = '1';
    document.getElementById('wordsearch-high').textContent = state.highScore;
    document.querySelector('.wordsearch-start-btn').style.display = 'inline-block';

    setupWordSearchControls();
    drawWordSearchStartScreen();
}

function setupWordSearchControls() {
    const canvas = document.getElementById('wordsearch-canvas');
    
    canvas.removeEventListener('mousedown', wordSearchMouseDown);
    canvas.removeEventListener('mousemove', wordSearchMouseMove);
    canvas.removeEventListener('mouseup', wordSearchMouseUp);
    canvas.removeEventListener('touchstart', wordSearchTouchStart);
    canvas.removeEventListener('touchmove', wordSearchTouchMove);
    canvas.removeEventListener('touchend', wordSearchTouchEnd);
    
    canvas.addEventListener('mousedown', wordSearchMouseDown);
    canvas.addEventListener('mousemove', wordSearchMouseMove);
    canvas.addEventListener('mouseup', wordSearchMouseUp);
    canvas.addEventListener('touchstart', wordSearchTouchStart, { passive: false });
    canvas.addEventListener('touchmove', wordSearchTouchMove, { passive: false });
    canvas.addEventListener('touchend', wordSearchTouchEnd, { passive: false });
}

// ============================================
// GAME START
// ============================================

function startWordSearch() {
    const state = wordSearchState;
    
    // Get difficulty
    const difficultySelect = document.getElementById('wordsearch-difficulty');
    state.difficulty = difficultySelect.value;
    
    // Get chapter
    const chapterSelect = document.getElementById('wordsearch-chapter-select');
    state.chapter = parseInt(chapterSelect.value);
    
    // Apply difficulty settings
    const settings = DIFFICULTY_SETTINGS[state.difficulty];
    state.gridSize = settings.gridSize;
    
    // Calculate cell size based on canvas size
    const availableSize = Math.min(state.canvas.width - 40, state.canvas.height - 120);
    state.cellSize = Math.floor(availableSize / state.gridSize);
    
    // Center the grid
    state.offsetX = (state.canvas.width - state.cellSize * state.gridSize) / 2;
    state.offsetY = 60;
    
    // Generate words
    generateWordSearchWords(settings.wordCount);
    
    // Generate grid
    generateWordSearchGrid();
    
    // Reset state
    state.score = 0;
    state.time = settings.timeLimit;
    state.isRunning = true;
    state.foundWords = [];
    state.selectedCells = [];
    state.isSelecting = false;
    
    // Update UI
    document.getElementById('wordsearch-score').textContent = '0';
    document.getElementById('wordsearch-time').textContent = formatTime(state.time);
    document.getElementById('wordsearch-chapter').textContent = state.chapter;
    document.querySelector('.wordsearch-start-btn').style.display = 'none';
    
    // Start timer
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
        if (state.isRunning) {
            state.time--;
            document.getElementById('wordsearch-time').textContent = formatTime(state.time);
            
            if (state.time <= 0) {
                wordSearchGameOver();
            }
        }
    }, 1000);
    
    // Draw initial state
    drawWordSearch();
    updateWordList();
    
    playWordSearchSound('start');
    showToast(`Word Search - Chapter ${state.chapter} Started! 🔤`, 'info');
}

function generateWordSearchWords(count) {
    const state = wordSearchState;
    const themeIndex = (state.chapter - 1) % CHAPTER_THEMES.length;
    const theme = CHAPTER_THEMES[themeIndex];
    const categoryWords = WORD_CATEGORIES[theme] || WORD_CATEGORIES.animals;
    
    // Shuffle and pick words
    const shuffled = [...categoryWords].sort(() => Math.random() - 0.5);
    
    // Filter words by length based on difficulty
    const maxLength = state.gridSize - 1;
    state.words = shuffled
        .filter(word => word.length <= maxLength && word.length >= 3)
        .slice(0, count);
}

// Track word placement directions when generating grid
const wordPlacements = {}; // word -> { direction: 'forward' | 'reverse', startR, startC, dr, dc }

function generateWordSearchGrid() {
    const state = wordSearchState;
    const size = state.gridSize;
    
    // Initialize empty grid
    state.grid = Array(size).fill(null).map(() => Array(size).fill(''));
    
    // Clear word placements
    for (const word of state.words) {
        wordPlacements[word] = null;
    }
    
    // Place words
    for (const word of state.words) {
        placeWordInGrid(word);
    }
    
    // Fill empty cells with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (state.grid[r][c] === '') {
                state.grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }
    
    console.log('Word placements:', wordPlacements);
}

function placeWordInGrid(word) {
    const state = wordSearchState;
    const size = state.gridSize;
    const directions = [
        { dr: 0, dc: 1, name: 'forward' },   // Horizontal
        { dr: 1, dc: 0, name: 'forward' },   // Vertical
        { dr: 1, dc: 1, name: 'forward' },   // Diagonal down-right
        { dr: -1, dc: 1, name: 'forward' },  // Diagonal up-right
    ];
    
    // Try to place word in random position and direction
    const shuffledDirs = directions.sort(() => Math.random() - 0.5);
    
    for (let attempt = 0; attempt < 100; attempt++) {
        const dir = shuffledDirs[attempt % shuffledDirs.length];
        
        // Random starting position
        let startR, startC;
        if (dir.dr === 0) {
            startR = Math.floor(Math.random() * size);
            startC = Math.floor(Math.random() * (size - word.length + 1));
        } else if (dir.dc === 0) {
            startR = Math.floor(Math.random() * (size - word.length + 1));
            startC = Math.floor(Math.random() * size);
        } else {
            startR = Math.floor(Math.random() * (size - word.length + 1));
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
        
        // Place word
        if (fits) {
            for (let i = 0; i < word.length; i++) {
                const r = startR + dir.dr * i;
                const c = startC + dir.dc * i;
                state.grid[r][c] = word[i];
            }
            // Track placement
            wordPlacements[word] = { direction: dir.name, startR, startC, dr: dir.dr, dc: dir.dc };
            return true;
        }
    }
    
    // If couldn't place, try reverse
    return placeWordReverse(word);
}

function placeWordReverse(word) {
    const state = wordSearchState;
    const size = state.gridSize;
    const reversed = word.split('').reverse().join('');
    
    const directions = [
        { dr: 0, dc: -1, name: 'reverse' },   // Horizontal reverse
        { dr: -1, dc: 0, name: 'reverse' },   // Vertical reverse
        { dr: -1, dc: -1, name: 'reverse' },  // Diagonal up-left
    ];
    
    const shuffledDirs = directions.sort(() => Math.random() - 0.5);
    
    for (let attempt = 0; attempt < 50; attempt++) {
        const dir = shuffledDirs[attempt % shuffledDirs.length];
        
        let startR, startC;
        if (dir.dr === 0) {
            startR = Math.floor(Math.random() * size);
            startC = Math.floor(Math.random() * (size - word.length + 1));
        } else if (dir.dc === 0) {
            startR = Math.floor(Math.random() * (size - word.length + 1));
            startC = Math.floor(Math.random() * size);
        } else {
            startR = Math.floor(Math.random() * (size - word.length + 1));
            startC = Math.floor(Math.random() * (size - word.length + 1));
        }
        
        let fits = true;
        for (let i = 0; i < word.length; i++) {
            const r = startR + dir.dr * i;
            const c = startC + dir.dc * i;
            const cell = state.grid[r][c];
            if (cell !== '' && cell !== reversed[i]) {
                fits = false;
                break;
            }
        }
        
        if (fits) {
            for (let i = 0; i < word.length; i++) {
                const r = startR + dir.dr * i;
                const c = startC + dir.dc * i;
                state.grid[r][c] = reversed[i];
            }
            // Track placement as REVERSE
            wordPlacements[word] = { direction: 'reverse', startR, startC, dr: dir.dr, dc: dir.dc };
            return true;
        }
    }
    
    return false;
}

// ============================================
// DRAWING
// ============================================

function drawWordSearch() {
    const state = wordSearchState;
    const { ctx, canvas, grid, cellSize, offsetX, offsetY, gridSize } = state;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid background
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
            
            // Check if cell is selected
            const isSelected = state.selectedCells.some(s => s.r === r && s.c === c);
            const isWrongSelection = state.wrongSelection && state.wrongSelection.some(s => s.r === r && s.c === c);
            const foundWord = state.foundWords.find(fw =>
                fw.cells.some(fc => fc.r === r && fc.c === c)
            );
            const isFound = !!foundWord;
            
            // Cell background
            if (isFound) {
                // CORRECT word — always bright green
                ctx.fillStyle = 'rgba(46, 213, 115, 0.35)';
                ctx.strokeStyle = '#2ed573';
                ctx.shadowColor = '#2ed573';
                ctx.shadowBlur = 8;
            } else if (isWrongSelection) {
                // WRONG selection — bright red
                ctx.fillStyle = 'rgba(255, 71, 87, 0.45)';
                ctx.strokeStyle = '#ff4757';
                ctx.shadowColor = '#ff4757';
                ctx.shadowBlur = 10;
            } else if (isSelected) {
                // Current selection — gold/yellow glow
                ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
                ctx.strokeStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 6;
            } else {
                ctx.fillStyle = '#1a1a2e';
                ctx.strokeStyle = '#333355';
                ctx.shadowBlur = 0;
            }

            ctx.lineWidth = isFound || isWrongSelection ? 2 : 1;
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 5);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw letter
            ctx.fillStyle = isFound ? '#ffffff' : isWrongSelection ? '#ff8888' : isSelected ? '#ffd700' : '#e0e0e0';
            ctx.font = `bold ${cellSize * 0.5}px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(grid[r][c], x + cellSize / 2, y + cellSize / 2);
        }
    }
    
    // Draw title bar
    ctx.fillStyle = '#667eea';
    ctx.font = 'bold 16px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(`Chapter ${state.chapter} - ${state.difficulty.toUpperCase()}`, canvas.width / 2, 30);
    
    // Draw word list
    drawWordList();
}

function getCellColor(row, col) {
    const colors = ['#667eea', '#764ba2', '#2ed573', '#ff4757', '#ffd700', '#ff6b81', '#70a1ff', '#ffa502'];
    return colors[(row + col) % colors.length];
}

function drawWordList() {
    const state = wordSearchState;
    const { ctx, canvas, words, foundWords } = state;
    
    const listX = 20;
    const listY = state.offsetY + state.gridSize * state.cellSize + 20;
    const maxWidth = canvas.width - 40;
    
    ctx.font = 'bold 14px Segoe UI';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Words to Find:', listX, listY);
    
    const wordWidth = (maxWidth - 20) / Math.min(words.length, 4);
    const startY = listY + 20;
    
    words.forEach((word, i) => {
        const isFound = foundWords.some(fw => fw.word === word);
        const col = i % 4;
        const row = Math.floor(i / 4);

        const x = listX + col * wordWidth;
        const y = startY + row * 24;

        if (isFound) {
            ctx.shadowColor = '#2ed573';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#2ed573';
            ctx.font = 'bold 14px Segoe UI';
            ctx.fillText('✓ ' + word, x, y);
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = 'rgba(255, 71, 87, 0.85)';
            ctx.font = '14px Segoe UI';
            ctx.fillText(word, x, y);
        }
    });
}

function drawWordSearchStartScreen() {
    const state = wordSearchState;
    const { ctx, canvas } = state;
    
    // Clear
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(0.5, '#16213e');
    bgGrad.addColorStop(1, '#0f0f23');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Decorative grid
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
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
    
    // Letter decorations
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    ctx.font = 'bold 24px Segoe UI';
    letters.forEach((letter, i) => {
        const x = 50 + i * 40;
        const y = 220 + Math.sin(i * 0.8) * 20;
        ctx.fillStyle = `rgba(102, 126, 234, ${0.3 + Math.random() * 0.4})`;
        ctx.fillText(letter, x, y);
    });
    
    // Instructions
    ctx.font = '14px Segoe UI';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Find all the hidden words!', canvas.width / 2, 280);
    ctx.fillText('Drag to select letters horizontally, vertically, or diagonally.', canvas.width / 2, 305);
    
    // Difficulty info boxes
    const diffY = 340;
    const boxW = 100;
    const boxH = 60;
    const startX = (canvas.width - boxW * 3) / 2;
    
    // Easy
    ctx.fillStyle = '#2ed573';
    ctx.beginPath();
    ctx.roundRect(startX, diffY, boxW, boxH, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText('EASY', startX + boxW / 2, diffY + 25);
    ctx.font = '12px Segoe UI';
    ctx.fillText('7×7 Grid', startX + boxW / 2, diffY + 45);
    
    // Medium
    ctx.fillStyle = '#ffa502';
    ctx.beginPath();
    ctx.roundRect(startX + boxW + 10, diffY, boxW, boxH, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText('MEDIUM', startX + boxW + 10 + boxW / 2, diffY + 25);
    ctx.font = '12px Segoe UI';
    ctx.fillText('8×8 Grid', startX + boxW + 10 + boxW / 2, diffY + 45);
    
    // Hard
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.roundRect(startX + (boxW + 10) * 2, diffY, boxW, boxH, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText('HARD', startX + (boxW + 10) * 2 + boxW / 2, diffY + 25);
    ctx.font = '12px Segoe UI';
    ctx.fillText('10×10 Grid', startX + (boxW + 10) * 2 + boxW / 2, diffY + 45);
    
    // Start prompt
    ctx.font = '16px Segoe UI';
    ctx.fillStyle = '#667eea';
    ctx.fillText('Select Difficulty & Chapter above, then click Start!', canvas.width / 2, canvas.height - 30);
}

// ============================================
// INPUT HANDLING
// ============================================

window.wordSearchMouseDown = function(e) {
    if (!wordSearchState || !wordSearchState.isRunning) return;
    
    const rect = wordSearchState.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cell = getCellFromPosition(x, y);
    if (cell) {
        wordSearchState.isSelecting = true;
        wordSearchState.selectedCells = [cell];
        drawWordSearch();
    }
}

window.wordSearchMouseMove = function(e) {
    if (!wordSearchState.isRunning || !wordSearchState.isSelecting) return;
    
    const rect = wordSearchState.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cell = getCellFromPosition(x, y);
    if (cell) {
        updateSelection(cell);
    }
}

window.wordSearchMouseUp = function(e) {
    if (!wordSearchState.isRunning) return;
    
    wordSearchState.isSelecting = false;
    checkSelectedWord();
    wordSearchState.selectedCells = [];
    drawWordSearch();
}

window.wordSearchTouchStart = function(e) {
    e.preventDefault();
    if (!wordSearchState.isRunning) return;
    
    const touch = e.touches[0];
    const rect = wordSearchState.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const cell = getCellFromPosition(x, y);
    if (cell) {
        wordSearchState.isSelecting = true;
        wordSearchState.selectedCells = [cell];
        drawWordSearch();
    }
}

window.wordSearchTouchMove = function(e) {
    e.preventDefault();
    if (!wordSearchState.isRunning || !wordSearchState.isSelecting) return;
    
    const touch = e.touches[0];
    const rect = wordSearchState.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const cell = getCellFromPosition(x, y);
    if (cell) {
        updateSelection(cell);
    }
}

window.wordSearchTouchEnd = function(e) {
    e.preventDefault();
    if (!wordSearchState.isRunning) return;
    
    wordSearchState.isSelecting = false;
    checkSelectedWord();
    wordSearchState.selectedCells = [];
    drawWordSearch();
}

function getCellFromPosition(x, y) {
    const state = wordSearchState;
    const { offsetX, offsetY, cellSize, gridSize } = state;
    
    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);
    
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        return { r: row, c: col };
    }
    return null;
}

function updateSelection(endCell) {
    const state = wordSearchState;
    if (state.selectedCells.length === 0) return;
    
    const startCell = state.selectedCells[0];
    
    // Calculate direction
    const dr = endCell.r - startCell.r;
    const dc = endCell.c - startCell.c;
    
    // Check if valid direction (horizontal, vertical, or diagonal)
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

function checkSelectedWord() {
    const state = wordSearchState;
    if (state.selectedCells.length < 2) return;

    const sel = state.selectedCells;

    for (const word of state.words) {
        if (state.foundWords.some(fw => fw.word === word)) continue;

        const placement = wordPlacements[word];
        if (!placement) continue;

        // Build the exact cells where this word lives in the grid
        const placedCells = [];
        for (let i = 0; i < word.length; i++) {
            placedCells.push({
                r: placement.startR + placement.dr * i,
                c: placement.startC + placement.dc * i
            });
        }

        // Selection must be exactly the same length as the word
        if (sel.length !== word.length) continue;

        // Forward match: user dragged in the same direction as the placement
        const forwardMatch = sel.every((s, i) =>
            s.r === placedCells[i].r && s.c === placedCells[i].c
        );

        // Reverse match: user dragged from the END of the word back to the START
        const reverseMatch = sel.every((s, i) =>
            s.r === placedCells[word.length - 1 - i].r &&
            s.c === placedCells[word.length - 1 - i].c
        );

        if (forwardMatch || reverseMatch) {
            // ✅ CORRECT — highlight the actual placed cells (always green)
            state.foundWords.push({
                word: word,
                cells: placedCells,
                reversed: false
            });

            const points = word.length * 10;
            state.score += points;
            document.getElementById('wordsearch-score').textContent = state.score;

            playWordSearchSound('found');
            showToast(`✅ Found: ${word}! +${points} points`, 'success');

            state.selectedCells = [];
            drawWordSearch();

            if (state.foundWords.length === state.words.length) {
                wordSearchLevelComplete();
            }
            return;
        }
    }

    // ❌ WRONG — flash red
    state.wrongSelection = [...state.selectedCells];
    state.selectedCells = [];
    drawWordSearch();

    if (state.showWrongTimeout) clearTimeout(state.showWrongTimeout);
    state.showWrongTimeout = setTimeout(() => {
        state.wrongSelection = null;
        drawWordSearch();
    }, 700);

    playWordSearchSound('error');
}

function updateWordList() {
    // This is handled by drawWordSearch()
}

// ============================================
// GAME LOGIC
// ============================================

function wordSearchLevelComplete() {
    const state = wordSearchState;
    state.isRunning = false;
    
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
    
    // Bonus points for time remaining
    const timeBonus = state.time * 2;
    state.score += timeBonus;
    document.getElementById('wordsearch-score').textContent = state.score;
    
    // Save high score
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('wordsearchHighScore', state.highScore);
        document.getElementById('wordsearch-high').textContent = state.highScore;
        showToast(`New High Score: ${state.score}! 🏆`, 'success');
    }
    
    saveScore('wordsearch', state.score);
    
    playWordSearchSound('win');
    showConfetti();
    showToast(`Chapter ${state.chapter} Complete! +${timeBonus} time bonus!`, 'success');
    
    // Show completion screen
    setTimeout(() => {
        showWordSearchComplete(state.chapter, state.score);
    }, 500);
}

function showWordSearchComplete(chapter, score) {
    // Remove existing overlay
    const existing = document.querySelector('.wordsearch-complete');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'wordsearch-complete';
    overlay.innerHTML = `
        <div class="wordsearch-complete-content">
            <h3>🎉 Chapter ${chapter} Complete!</h3>
            <div class="final-score">Score: ${score}</div>
            <p>Ready for the next chapter?</p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 15px;">
                <button class="restart-btn" onclick="nextWordSearchChapter()">
                    Next Chapter →
                </button>
                <button class="restart-btn" onclick="restartWordSearch()" style="background: #667eea;">
                    Replay This Chapter
                </button>
            </div>
            <button class="restart-btn" onclick="closeWordSearchComplete()" style="margin-top: 15px; background: #333;">
                Back to Menu
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeWordSearchComplete();
    });
}

function closeWordSearchComplete() {
    const overlay = document.querySelector('.wordsearch-complete');
    if (overlay) overlay.remove();
    initWordSearch();
}

function nextWordSearchChapter() {
    closeWordSearchComplete();
    const state = wordSearchState;
    state.chapter = Math.min(state.chapter + 1, 30);
    
    // Update chapter select
    const chapterSelect = document.getElementById('wordsearch-chapter-select');
    chapterSelect.value = state.chapter;
    
    startWordSearch();
}

function restartWordSearch() {
    closeWordSearchComplete();
    startWordSearch();
}

function wordSearchGameOver() {
    const state = wordSearchState;
    state.isRunning = false;
    
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
    
    playWordSearchSound('gameover');
    showToast('Time\'s Up!', 'error');
    
    // Show game over screen
    setTimeout(() => {
        showWordSearchGameOver();
    }, 500);
}

function showWordSearchGameOver() {
    const existing = document.querySelector('.wordsearch-gameover');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'wordsearch-gameover';
    overlay.innerHTML = `
        <div class="wordsearch-gameover-content">
            <h3>⏰ Time's Up!</h3>
            <p>Words Found: ${wordSearchState.foundWords.length} / ${wordSearchState.words.length}</p>
            <div class="final-score">Score: ${wordSearchState.score}</div>
            <button class="restart-btn" onclick="closeWordSearchGameOver()">
                <i class="fas fa-redo"></i> Try Again
            </button>
            <button class="restart-btn" onclick="closeWordSearchGameOver()" style="margin-top: 10px; background: #333;">
                Back to Menu
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeWordSearchGameOver();
    });
}

function closeWordSearchGameOver() {
    const overlay = document.querySelector('.wordsearch-gameover');
    if (overlay) overlay.remove();
    initWordSearch();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function playWordSearchSound(type) {
    if (!wordSearchState.soundEnabled) return;
    
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        
        switch (type) {
            case 'start':
                oscillator.frequency.setValueAtTime(440, now);
                oscillator.frequency.setValueAtTime(554, now + 0.1);
                oscillator.frequency.setValueAtTime(659, now + 0.2);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                oscillator.start(now);
                oscillator.stop(now + 0.4);
                break;
                
            case 'found':
                oscillator.frequency.setValueAtTime(523.25, now);
                oscillator.frequency.setValueAtTime(659.25, now + 0.1);
                oscillator.frequency.setValueAtTime(783.99, now + 0.2);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;
                
            case 'error':
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;
                
            case 'win':
                oscillator.frequency.setValueAtTime(523.25, now);
                oscillator.frequency.setValueAtTime(659.25, now + 0.15);
                oscillator.frequency.setValueAtTime(783.99, now + 0.3);
                oscillator.frequency.setValueAtTime(1046.50, now + 0.45);
                gainNode.gain.setValueAtTime(0.25, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                oscillator.start(now);
                oscillator.stop(now + 0.6);
                break;
                
            case 'gameover':
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.5);
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;
        }
    } catch (e) {
        console.log('Audio not supported');
    }
}
