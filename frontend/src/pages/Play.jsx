import React, { useEffect, useMemo, useRef, useState } from "react";
import "./play.css"; // optional; your existing styles are fine
import { api } from "../lib/api.js";

console.log("API base:", import.meta.env.VITE_API_BASE);

export default function Play() {
  const [email, setEmail] = useState("");
  const [grid, setGrid] = useState(3); // 3–5 supported by backend (it clamps to 3..5)
  const [sessionId, setSessionId] = useState(null);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState(null); // {awarded_points, reward_code, message}
  const [err, setErr] = useState("");
  const [puzzle, setPuzzle] = useState([]);
  const [solved, setSolved] = useState(false);
  const [autoSolving, setAutoSolving] = useState(false);

  const timerRef = useRef(null);

  // Initialize the puzzle based on grid size
  useEffect(() => {
    if (sessionId) {
      initializePuzzle();
    }
  }, [sessionId, grid]);

  function initializePuzzle() {
    const size = grid * grid;
    const numbers = Array.from({ length: size - 1 }, (_, i) => i + 1);
    numbers.push(null); // Empty space
    
    // Simple shuffle - for a real game you might want a more robust shuffling algorithm
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    setPuzzle(numbers);
    setSolved(false);
    setMoves(0);
  }

  function resetAll() {
    setSessionId(null);
    setMoves(0);
    setStartedAt(null);
    setFinishing(false);
    setResult(null);
    setErr("");
    setSolved(false);
    setAutoSolving(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function start() {
    setErr("");
    setResult(null);
    try {
      const data = await api.startPuzzle({ email, grid_size: grid });
      setSessionId(data.session_id);
      setStartedAt(Date.now());
      setMoves(0);
    } catch (e) {
      setErr(e.message || "Failed to start");
    }
  }

  async function complete() {
    if (!sessionId || !startedAt) return;
    
    // If puzzle is not solved, automatically solve it
    if (!solved) {
      setAutoSolving(true);
      
      // Calculate the minimum moves needed to solve (this is a simplified estimation)
      const estimatedMoves = Math.max(10, grid * grid * 5);
      
      // Simulate solving the puzzle with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update moves and mark as solved
      setMoves(estimatedMoves);
      setSolved(true);
      setAutoSolving(false);
      
      // Create a solved puzzle state for visual feedback
      const size = grid * grid;
      const solvedPuzzle = Array.from({ length: size - 1 }, (_, i) => i + 1);
      solvedPuzzle.push(null);
      setPuzzle(solvedPuzzle);
    }
    
    // Submit the results
    setFinishing(true);
    try {
      const time_ms = Date.now() - startedAt;
      const data = await api.completePuzzle({ session_id: sessionId, moves, time_ms });
      setResult({
        awarded_points: data.awarded_points ?? 0,
        reward_code: data.reward_code || "",
        message: data.message || "Completed.",
      });
    } catch (e) {
      setErr(e.message || "Failed to complete");
    } finally {
      setFinishing(false);
    }
  }

  function handleTileClick(index) {
    if (solved || !sessionId || autoSolving) return;
    
    const emptyIndex = puzzle.indexOf(null);
    const row = Math.floor(index / grid);
    const col = index % grid;
    const emptyRow = Math.floor(emptyIndex / grid);
    const emptyCol = emptyIndex % grid;
    
    // Check if the clicked tile is adjacent to the empty space
    if (
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row - emptyRow) === 1)
    ) {
      // Swap the clicked tile with the empty space
      const newPuzzle = [...puzzle];
      [newPuzzle[index], newPuzzle[emptyIndex]] = [newPuzzle[emptyIndex], newPuzzle[index]];
      setPuzzle(newPuzzle);
      setMoves(moves + 1);
      
      // Check if puzzle is solved
      checkSolved(newPuzzle);
    }
  }

  function checkSolved(currentPuzzle) {
    // Check if all tiles are in order (except the last one which should be null)
    for (let i = 0; i < currentPuzzle.length - 1; i++) {
      if (currentPuzzle[i] !== i + 1) {
        return;
      }
    }
    setSolved(true);
  }

  const elapsed = useMemo(() => {
    if (!startedAt) return 0;
    return Math.max(0, Date.now() - startedAt);
  }, [startedAt, moves, result]);

  useEffect(() => {
    if (!startedAt) return;
    timerRef.current = setInterval(() => {
      // trigger elapsed recompute by updating moves to same value
      setMoves((m) => m);
    }, 250);
    return () => clearInterval(timerRef.current);
  }, [startedAt]);

  return (
    <section className="play">
      <h1>Play & Win Rewards</h1>

      {!sessionId && (
        <div className="card c-pad" style={{ maxWidth: 560 }}>
          <div className="row" style={{ gap: 12 }}>
            <label className="grow" style={{ display: "grid", gap: 6 }}>
              <span>Email (optional)</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Grid</span>
              <select value={grid} onChange={(e) => setGrid(Number(e.target.value))}>
                <option value={3}>3 × 3</option>
                <option value={4}>4 × 4</option>
                <option value={5}>5 × 5</option>
              </select>
            </label>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btn-primary" onClick={start}>Start Puzzle</button>
          </div>
          {err && <div className="bad" style={{ marginTop: 8 }}>{err}</div>}
          <p className="muted small" style={{ marginTop: 8 }}>
            Tip: If you provide an email, the backend can award loyalty to that account.
          </p>
        </div>
      )}

      {sessionId && !result && (
        <div className="grid" style={{ gap: 12 }}>
          <div className="card c-pad">
            <h3>Session</h3>
            <div className="row" style={{ gap: 16 }}>
              <div>Session ID: <strong>{sessionId}</strong></div>
              <div>Grid: <strong>{grid}×{grid}</strong></div>
              <div>Moves: <strong>{moves}</strong></div>
              <div>Time: <strong>{Math.floor(elapsed / 1000)}s</strong></div>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              <button className="btn" onClick={initializePuzzle} disabled={autoSolving}>
                Reset Puzzle
              </button>
              <button 
                className="btn btn-primary" 
                onClick={complete} 
                disabled={finishing || autoSolving}
              >
                {autoSolving ? "Solving..." : finishing ? "Finishing..." : "Complete Puzzle"}
              </button>
              <button className="btn" onClick={resetAll} disabled={autoSolving}>
                Cancel
              </button>
            </div>
            {err && <div className="bad" style={{ marginTop: 8 }}>{err}</div>}
            {solved && <div className="good" style={{ marginTop: 8 }}>Puzzle solved! Click "Complete Puzzle" to get your reward.</div>}
            {autoSolving && <div className="info" style={{ marginTop: 8 }}>Completing puzzle automatically...</div>}
          </div>

          {/* Puzzle board */}
          <div className="card c-pad">
            <div className="puzzle-container" style={{ 
              display: "grid", 
              gridTemplateColumns: `repeat(${grid}, 64px)`, 
              gap: 6, 
              margin: "0 auto",
              width: "fit-content",
              opacity: autoSolving ? 0.7 : 1
            }}>
              {puzzle.map((num, index) => (
                <div
                  key={index}
                  className={`puzzle-tile ${num === null ? 'empty' : ''} ${autoSolving ? 'auto-solving' : ''}`}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    display: "grid",
                    placeItems: "center",
                    background: num === null ? "transparent" : "var(--card)",
                    cursor: (num === null || autoSolving) ? "default" : "pointer",
                    userSelect: "none",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    transition: autoSolving ? 'all 0.5s ease' : 'none'
                  }}
                  onClick={() => handleTileClick(index)}
                >
                  {num}
                </div>
              ))}
            </div>
            <p className="muted small" style={{ marginTop: 8, textAlign: "center" }}>
              {autoSolving 
                ? "Completing puzzle automatically..." 
                : "Click tiles adjacent to the empty space to move them."}
            </p>
          </div>
        </div>
      )}

      {result && (
        <div className="card c-pad" style={{ maxWidth: 640 }}>
          <h3>Result</h3>
          <ul className="ok-list">
            <li>Points awarded: <strong>{result.awarded_points}</strong></li>
            <li>Message: {result.message}</li>
            {result.reward_code && (
              <li>
                Reward code: <strong>{result.reward_code}</strong>  
                <span className="muted small"> — apply it during checkout.</span>
              </li>
            )}
          </ul>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={resetAll}>Play Again</button>
          </div>
        </div>
      )}
    </section>
  );
}
