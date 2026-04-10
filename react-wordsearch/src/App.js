import React, { useState, useEffect, useCallback } from 'react';

// Word categories
const WORD_CATEGORIES = {
  // Chapters 1-10 - Short words (3-6 letters)
  animals: ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'TIGER', 'BEAR', 'WOLF', 'FOX', 'DEER', 'EAGLE', 'HAWK'],
  fruits: ['APPLE', 'BANANA', 'GRAPE', 'MANGO', 'PEACH', 'PLUM', 'PEAR', 'BERRY', 'MELON', 'LEMON', 'ORANGE', 'CHERRY'],
  colors: ['RED', 'BLUE', 'GREEN', 'PINK', 'PURPLE', 'ORANGE', 'YELLOW', 'BLACK', 'WHITE', 'BROWN', 'GRAY', 'SILVER'],
  countries: ['USA', 'CHINA', 'JAPAN', 'FRANCE', 'GERMANY', 'BRAZIL', 'INDIA', 'ITALY', 'SPAIN', 'MEXICO', 'CANADA', 'KOREA'],
  sports: ['SOCCER', 'TENNIS', 'GOLF', 'HOCKEY', 'RUGBY', 'CRICKET', 'BOXING', 'SWIMMING', 'CYCLING', 'SKIING', 'SURFING', 'VOLLEYBALL'],
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
  // Chapters 21-30 - All word lengths
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
  shape: ['CIRCLE', 'SQUARE', 'TRIANGLE', 'STAR', 'HEART', 'OVAL', 'DIAMOND', 'CROSS', 'CRESCENT', 'RING', 'BALL', 'CUBE']
};

const CHAPTER_THEMES = [
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

const DIFFICULTY_SETTINGS = {
  easy: { size: 7, count: 5, time: 180 },
  medium: { size: 8, count: 5, time: 240 },
  hard: { size: 10, count: 6, time: 300 }
};

function App() {
  const [difficulty, setDifficulty] = useState('easy');
  const [chapter, setChapter] = useState(1);
  const [grid, setGrid] = useState([]);
  const [words, setWords] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Generate grid based on difficulty
  const generateGrid = useCallback(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const gridSize = settings.size;
    
    // Get theme for current chapter
    const themeIndex = (chapter - 1) % CHAPTER_THEMES.length;
    const theme = CHAPTER_THEMES[themeIndex];
    const categoryWords = WORD_CATEGORIES[theme] || WORD_CATEGORIES.animals;
    
    // Shuffle and pick words that fit in the grid
    const shuffled = [...categoryWords].sort(() => Math.random() - 0.5);
    const maxWordLen = Math.floor(gridSize * 0.9);
    const suitableWords = shuffled.filter(w => w.length <= maxWordLen && w.length >= 3);
    const selectedWords = suitableWords.slice(0, settings.count);
    
    // Initialize empty grid
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    
    // Place words
    const directions = [
      { dr: 0, dc: 1 },   // horizontal
      { dr: 1, dc: 0 },   // vertical
      { dr: 1, dc: 1 },   // diagonal
      { dr: -1, dc: 1 }   // diagonal up-right
    ];
    
    const placedWords = [];
    
    for (const word of selectedWords) {
      let placed = false;
      
      for (let attempt = 0; attempt < 100 && !placed; attempt++) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        
        let startR, startC;
        if (dir.dr === 0) {
          startR = Math.floor(Math.random() * gridSize);
          startC = Math.floor(Math.random() * (gridSize - word.length + 1));
        } else if (dir.dc === 0) {
          startR = Math.floor(Math.random() * (gridSize - word.length + 1));
          startC = Math.floor(Math.random() * gridSize);
        } else if (dir.dr === 1) {
          startR = Math.floor(Math.random() * (gridSize - word.length + 1));
          startC = Math.floor(Math.random() * (gridSize - word.length + 1));
        } else {
          startR = Math.floor(Math.random() * (gridSize - word.length + 1)) + (word.length - 1);
          startC = Math.floor(Math.random() * (gridSize - word.length + 1));
        }
        
        // Check if word fits
        let fits = true;
        for (let i = 0; i < word.length; i++) {
          const r = startR + dir.dr * i;
          const c = startC + dir.dc * i;
          const cell = newGrid[r][c];
          if (cell !== '' && cell !== word[i]) {
            fits = false;
            break;
          }
        }
        
        if (fits) {
          for (let i = 0; i < word.length; i++) {
            const r = startR + dir.dr * i;
            const c = startC + dir.dc * i;
            newGrid[r][c] = word[i];
          }
          placedWords.push(word);
          placed = true;
        }
      }
    }
    
    // Fill empty cells with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (newGrid[r][c] === '') {
          newGrid[r][c] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }
    
    setGrid(newGrid);
    setWords(placedWords);
    setFoundWords([]);
    setSelectedCells([]);
  }, [difficulty, chapter]);

  // Start game
  const startGame = () => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    setScore(0);
    setTime(settings.time);
    setIsRunning(true);
    setGameOver(false);
    setGameWon(false);
    generateGrid();
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (isRunning && time > 0) {
      timer = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, time]);

  // Check if all words found
  useEffect(() => {
    if (isRunning && words.length > 0 && foundWords.length === words.length) {
      setIsRunning(false);
      setGameWon(true);
      const timeBonus = time * 2;
      setScore(prev => prev + timeBonus);
    }
  }, [foundWords, words, isRunning, time]);

  // Handle cell selection
  const handleCellMouseDown = (row, col) => {
    if (!isRunning) return;
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  };

  const handleCellMouseEnter = (row, col) => {
    if (!isSelecting || !isRunning) return;
    
    const start = selectedCells[0];
    const dr = row - start.row;
    const dc = col - start.col;
    
    // Allow horizontal, vertical, or diagonal
    if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      const stepR = dr === 0 ? 0 : dr / steps;
      const stepC = dc === 0 ? 0 : dc / steps;
      
      const newSelection = [];
      for (let i = 0; i <= steps; i++) {
        newSelection.push({
          row: start.row + stepR * i,
          col: start.col + stepC * i
        });
      }
      setSelectedCells(newSelection);
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    
    // Check if selected cells form a word
    if (selectedCells.length >= 2) {
      let selectedWord = '';
      selectedCells.forEach(cell => {
        selectedWord += grid[cell.row][cell.col];
      });
      
      const reversed = selectedWord.split('').reverse().join('');
      
      for (const word of words) {
        if (!foundWords.includes(word) && (selectedWord === word || reversed === word)) {
          setFoundWords(prev => [...prev, word]);
          const points = word.length * 10;
          setScore(prev => prev + points);
          break;
        }
      }
    }
    setSelectedCells([]);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get cell class
  const getCellClass = (row, col) => {
    const isSelected = selectedCells.some(c => c.row === row && c.col === col);
    const cellWord = selectedCells.length > 0 ? 
      selectedCells.map(c => grid[c.row][c.col]).join('') : '';
    const isFound = words.some(word => {
      if (foundWords.includes(word)) return false;
      const reversed = word.split('').reverse().join('');
      return cellWord === word || cellWord === reversed;
    }) && selectedCells.length >= 2;

    // Check if this cell is part of a found word
    const isInFoundWord = foundWords.some(word => {
      // Check all possible positions of this word in the grid
      const wordLen = word.length;
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid.length; c++) {
          // Check horizontal
          if (c + wordLen <= grid.length) {
            let match = true;
            for (let i = 0; i < wordLen; i++) {
              if (grid[r][c + i] !== word[i]) {
                match = false;
                break;
              }
            }
            if (match && row === r && col >= c && col < c + wordLen) return true;
          }
          // Check vertical
          if (r + wordLen <= grid.length) {
            let match = true;
            for (let i = 0; i < wordLen; i++) {
              if (grid[r + i][c] !== word[i]) {
                match = false;
                break;
              }
            }
            if (match && col === c && row >= r && row < r + wordLen) return true;
          }
          // Check diagonal
          if (r + wordLen <= grid.length && c + wordLen <= grid.length) {
            let match = true;
            for (let i = 0; i < wordLen; i++) {
              if (grid[r + i][c + i] !== word[i]) {
                match = false;
                break;
              }
            }
            if (match && row - r === col - c && row >= r && col >= c) return true;
          }
        }
      }
      return false;
    });

    let className = `cell ${difficulty}`;
    if (isInFoundWord || foundWords.some(fw => {
      // Check if this cell is part of any found word
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid.length; c++) {
          const wordLen = fw.length;
          // Check horizontal
          if (c + wordLen <= grid.length) {
            let match = true;
            for (let i = 0; i < wordLen; i++) {
              if (grid[r][c + i] !== fw[i]) { match = false; break; }
            }
            if (match && row === r && col >= c && col < c + wordLen) return true;
          }
          // Check vertical
          if (r + wordLen <= grid.length) {
            let match = true;
            for (let i = 0; i < wordLen; i++) {
              if (grid[r + i][c] !== fw[i]) { match = false; break; }
            }
            if (match && col === c && row >= r && row < r + wordLen) return true;
          }
          // Check diagonal
          if (r + wordLen <= grid.length && c + wordLen <= grid.length) {
            let match = true;
            for (let i = 0; i < wordLen; i++) {
              if (grid[r + i][c + i] !== fw[i]) { match = false; break; }
            }
            if (match && row - r === col - c && row >= r && col >= c) return true;
          }
        }
      }
      return false;
    })) {
      className += ' found';
    } else if (isSelected) {
      className += ' selected';
    }
    return className;
  };

  // Calculate grid style
  const getGridStyle = () => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    return {
      gridTemplateColumns: `repeat(${settings.size}, 1fr)`
    };
  };

  return (
    <div className="app" onMouseUp={handleMouseUp}>
      <div className="header">
        <h1>WORD SEARCH</h1>
        <h2>UNIVERSE</h2>
      </div>

      <div className="controls">
        <div className="select-wrapper">
          <label>Difficulty</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={isRunning}
          >
            <option value="easy">Easy (7×7)</option>
            <option value="medium">Medium (8×8)</option>
            <option value="hard">Hard (10×10)</option>
          </select>
        </div>
        
        <div className="select-wrapper">
          <label>Chapter</label>
          <select 
            value={chapter} 
            onChange={(e) => setChapter(parseInt(e.target.value))}
            disabled={isRunning}
          >
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>

        <button onClick={startGame} disabled={isRunning}>
          {isRunning ? 'Playing...' : 'Start Game'}
        </button>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{score}</span>
          <span className="stat-label">Score</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatTime(time)}</span>
          <span className="stat-label">Time</span>
        </div>
        <div className="stat">
          <span className="stat-value">{chapter}</span>
          <span className="stat-label">Chapter</span>
        </div>
        <div className="stat">
          <span className="stat-value">{foundWords.length}/{words.length}</span>
          <span className="stat-label">Words</span>
        </div>
      </div>

      {grid.length > 0 && (
        <div className="game-container">
          <div 
            className="grid" 
            style={getGridStyle()}
            onMouseLeave={() => {
              if (isSelecting) {
                setIsSelecting(false);
                setSelectedCells([]);
              }
            }}
          >
            {grid.map((row, rowIndex) => (
              row.map((letter, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellClass(rowIndex, colIndex)}
                  onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                >
                  {letter}
                </div>
              ))
            ))}
          </div>
        </div>
      )}

      {words.length > 0 && (
        <div className="words-list">
          <h3>Words to Find:</h3>
          <div className="words">
            {words.map((word, index) => (
              <span 
                key={index} 
                className={`word ${foundWords.includes(word) ? 'found' : ''}`}
              >
                {foundWords.includes(word) ? '✓ ' : ''}{word}
              </span>
            ))}
          </div>
        </div>
      )}

      {gameOver && (
        <div className="overlay">
          <div className="message">
            <h2>⏰ Time's Up!</h2>
            <p>Words Found: {foundWords.length} / {words.length}</p>
            <p>Final Score: {score}</p>
            <div className="message-buttons">
              <button onClick={startGame}>Try Again</button>
              <button onClick={() => { setGameOver(false); setGrid([]); }}>
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {gameWon && (
        <div className="overlay">
          <div className="message">
            <h2>🎉 Chapter {chapter} Complete!</h2>
            <p>Final Score: {score}</p>
            <p>Time Bonus: +{time * 2}</p>
            <div className="message-buttons">
              <button onClick={() => {
                setGameWon(false);
                setChapter(prev => Math.min(prev + 1, 30));
              }}>
                Next Chapter →
              </button>
              <button onClick={() => {
                setGameWon(false);
                startGame();
              }}>
                Play Again
              </button>
              <button onClick={() => { setGameWon(false); setGrid([]); }}>
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

