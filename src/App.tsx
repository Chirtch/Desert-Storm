import { useEffect, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";
import { Routes, Route, Link } from "react-router-dom";
import About from "./pages/about";
import Leaderboard from "./pages/leaderboard";

type Obstacle = {
  id: number;
  x: number;
  y: number;
};

type LeaderboardEntry = {
  name: string;
  score: number;
};

function Game() {
  const [playerX, setPlayerX] = useState(50);
const playerXRef = useRef(50);

const playerRef = useRef<HTMLImageElement>(null);

const isInvincible = useRef(false);

  const keysPressed = useRef({
    left: false,
    right: false,
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([
    { id: 1, x: 20, y: 0 },
    { id: 2, x: 50, y: -35 },
    { id: 3, x: 80, y: -70 },
  ]);

  const [gameStarted, setGameStarted] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playerFlashing, setPlayerFlashing] = useState(false);
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const deathSoundRef = useRef<HTMLAudioElement | null>(null);

  // --------------------------------
  // KEYBOARD INPUT
  // --------------------------------

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
      ) {
        keysPressed.current.left = true;
      }

      if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
      ) {
        keysPressed.current.right = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
      ) {
        keysPressed.current.left = false;
      }

      if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
      ) {
        keysPressed.current.right = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

 // --------------------------------
// SMOOTH PLAYER MOVEMENT
// --------------------------------

useEffect(() => {
  if (gameOver || !gameStarted) return;

  const movementLoop = setInterval(() => {
    let newPosition = playerXRef.current;

    if (keysPressed.current.left) {
      newPosition -= 2;
    }

    if (keysPressed.current.right) {
      newPosition += 2;
    }

    newPosition = Math.max(5, Math.min(95, newPosition));

    playerXRef.current = newPosition;
    setPlayerX(newPosition);
  }, 16);

  return () => {
    clearInterval(movementLoop);
  };
}, [gameOver, gameStarted]);

  // --------------------------------
  // OBSTACLE GAME LOOP
  // --------------------------------

  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const isColliding = (obstacleId: number) => {
  const player = playerRef.current;

  const obstacle = document.getElementById(
    `obstacle-${obstacleId}`
  );

  if (!player || !obstacle) {
    return false;
  }

  const playerRect = player.getBoundingClientRect();
  const obstacleRect = obstacle.getBoundingClientRect();

  // Shrink player's hitbox to 70% of its visible size
const playerHitbox = {
  left: playerRect.left,
  right: playerRect.right - 45,
  top: playerRect.top,
  bottom: playerRect.bottom,
};

  return (
    playerHitbox.left < obstacleRect.right &&
    playerHitbox.right > obstacleRect.left &&
    playerHitbox.top < obstacleRect.bottom &&
    playerHitbox.bottom > obstacleRect.top
  );
};

    const gameLoop = setInterval(() => {
      const speed = 1 + score * 0.05;

      setObstacles((currentObstacles) =>
        currentObstacles.map((obstacle) => {
          const newY = obstacle.y + speed;

        
          // Real pixel-based collision detection
if (isColliding(obstacle.id) && !isInvincible.current) {
  isInvincible.current = true;
  setPlayerFlashing(true);

  setLives((currentLives) => {
    const newLives = currentLives - 1;

   if (newLives <= 0) {
  setGameOver(true);

  // Stop background music
  if (musicRef.current) {
    musicRef.current.pause();
    musicRef.current.currentTime = 0;
  }

  // Play death sound
  if (deathSoundRef.current) {
    deathSoundRef.current.currentTime = 0;

    deathSoundRef.current.play().catch((error) => {
      console.error("Death sound could not play:", error);
    });
  }

  return 0;
}

    return newLives;
  });

  setTimeout(() => {
    isInvincible.current = false;
    setPlayerFlashing(false);
  }, 1000);

  return {
    ...obstacle,
    x: Math.random() * 90 + 5,
    y: -20,
  };
}
             
          // Obstacle successfully dodged
          if (newY >= 100) {
            setScore((currentScore) => currentScore + 1);

            return {
              ...obstacle,
              x: Math.random() * 90 + 5,
              y: -20,
            };
          }

          return {
            ...obstacle,
            y: newY,
          };
        })
      );
    }, 30);

    return () => {
      clearInterval(gameLoop);
    };
  }, [score, gameOver, gameStarted]);

 const [playerName, setPlayerName] = useState("");

const [leaderboard, setLeaderboard] =
  useState<LeaderboardEntry[]>([]);

const [scoreSaved, setScoreSaved] = useState(false);

const loadLeaderboard = async () => {
  const { data, error } = await supabase
    .from("Leaderboard")
    .select("name, score")
    .order("score", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Could not load leaderboard:", error);
    return;
  }

  setLeaderboard(data ?? []);
};

useEffect(() => {
  loadLeaderboard();
}, []);

const saveScore = async () => {
  const name = playerName.trim();

  if (!name || scoreSaved) return;

  const { error } = await supabase
    .from("Leaderboard")
    .insert({
      name,
      score,
    });

  if (error) {
    console.error("Could not save score:", error);
    return;
  }

  setScoreSaved(true);

  await loadLeaderboard();
};



  // --------------------------------
  // RESTART GAME
  // --------------------------------
  const startGame = () => {
  // Start button sound
  if (!startSoundRef.current) {
    startSoundRef.current = new Audio("/Start.mp3");
    startSoundRef.current.volume = 0.7;
  }

  startSoundRef.current.currentTime = 0;

  startSoundRef.current.play().catch((error) => {
    console.error("Start sound could not play:", error);
  });

  // Background music
  if (!musicRef.current) {
    musicRef.current = new Audio("/music.mp3");
    musicRef.current.loop = true;
    musicRef.current.volume = 0.3;
  }

  musicRef.current.currentTime = 0;

  musicRef.current.play().catch((error) => {
    console.error("Music could not play:", error);
  });

  // Death sound
  if (!deathSoundRef.current) {
    deathSoundRef.current = new Audio("/Death.mp3");
    deathSoundRef.current.volume = 0.7;
  }

  // Your existing game-start code continues here...
  keysPressed.current.left = false;
  keysPressed.current.right = false;

  playerXRef.current = 50;
  setPlayerX(50);

  setObstacles([
    { id: 1, x: 20, y: 0 },
    { id: 2, x: 50, y: -35 },
    { id: 3, x: 80, y: -70 },
  ]);

  setLives(3);
  setScore(0);
  setGameOver(false);
  setGameStarted(true);
};
const restartGame = () => {

  if (!startSoundRef.current) {
    startSoundRef.current = new Audio("/Start.mp3");
    startSoundRef.current.volume = 0.7;
  }

  startSoundRef.current.currentTime = 0;

  startSoundRef.current.play().catch((error) => {
    console.error("Start sound could not play:", error);
  });

  // Background music
  if (!musicRef.current) {
    musicRef.current = new Audio("/music.mp3");
    musicRef.current.loop = true;
    musicRef.current.volume = 0.3;
  }

  musicRef.current.currentTime = 0;

  musicRef.current.play().catch((error) => {
    console.error("Music could not play:", error);
  });
  keysPressed.current.left = false;
  keysPressed.current.right = false;

  isInvincible.current = false;
  setPlayerFlashing(false);

  playerXRef.current = 50;
  setPlayerX(50);

  setObstacles([
    { id: 1, x: 20, y: 0 },
    { id: 2, x: 50, y: -35 },
    { id: 3, x: 80, y: -70 },
  ]);

  setLives(3);
  setScore(0);
  setGameOver(false);

  setPlayerName("");
  setScoreSaved(false);
};

  // --------------------------------
  // DISPLAY
  // --------------------------------

  return (
    <div className="page">
      <h1>Desert Storm</h1>

      <h2>
        Score: {score} | Lives: {"❤️".repeat(lives)}
      </h2>

      <p>Use A/D or ←/→ to move</p>

      <div className="game">
        {!gameStarted && (
  <div className="home-page">
    <div className="home-content">
      <h1>DESERT STORM</h1>

      <p className="tagline">
        Dodge. Survive. Beat your high score.
      </p>

      <button
        className="play-button"
        onClick={startGame}
      >
        PLAY GAME
      </button>

      <div className="how-to-play">
        <h2>HOW TO PLAY</h2>

        <p>💣 Dodge the falling bombs</p>
        <p>❤️ You have 3 lives</p>
        <p>⌨️ Use A / D or ← / → to move</p>
        <p>🏆 Survive to increase your score</p>
      </div>
    </div>
  </div>
)}
  {gameStarted &&
  !gameOver &&
  obstacles.map((obstacle) => (
    <img
      key={obstacle.id}
      id={`obstacle-${obstacle.id}`}
      className="obstacle"
      src="/bomb.png"
      alt=""
      draggable="false"
      style={{
        left: `${obstacle.x}%`,
        top: `${obstacle.y}%`,
      }}
    />
  ))}

        {gameStarted && (
  <img
    ref={playerRef}
    className={`player ${playerFlashing ? "flashing" : ""}`}
    src="/soldier.png"
    alt="player"
    draggable="false"
    style={{
      left: `${playerX}%`,
    }}
  />
)}



{gameOver && (
  <div className="game-over">
    <h1>GAME OVER</h1>

    <p>Final Score: {score}</p>

    {!scoreSaved ? (
      <>
        <input
          type="text"
          maxLength={12}
          placeholder="Enter your name"
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
        />

        <button
          onClick={saveScore}
          disabled={!playerName.trim()}
        >
          Save Score
        </button>
      </>
    ) : (
      <p>Score saved!</p>
    )}

    <div className="Leaderboard">
      <h2>🏆 Leaderboard</h2>

      {leaderboard.length === 0 ? (
        <p>No scores yet</p>
      ) : (
        leaderboard.map((entry, index) => (
          <div
            className="Leaderboard-entry"
            key={`${entry.name}-${entry.score}-${index}`}
          >
            <span>
              {index + 1}. {entry.name} {entry.score}
            </span>

          </div>
        ))
      )}
    </div>

    <button onClick={restartGame}>
      Play Again
    </button>
  </div>
)}
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <nav className="navbar">
        <Link to="/">Home</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/about">About</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default App;