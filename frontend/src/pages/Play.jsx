// Play.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./play.css";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx"; // Import auth context

console.log("API base:", import.meta.env.VITE_API_BASE);

export default function Play() {
  const [email, setEmail] = useState("");
  const [grid, setGrid] = useState(3);
  const [sessionId, setSessionId] = useState(null);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [puzzle, setPuzzle] = useState([]);
  const [solved, setSolved] = useState(false);
  const [autoSolving, setAutoSolving] = useState(false);

  const timerRef = useRef(null);
  
  // Get authentication state
  const { user: authUser, isAuthenticated } = useAuth();

  // Initialize the puzzle based on grid size
  useEffect(() => {
    if (sessionId) {
      initializePuzzle();
    }
  }, [sessionId, grid]);

  // Load any saved promo codes on component mount
  useEffect(() => {
    const savedPromo = localStorage.getItem('puzzleRewardPromo');
    if (savedPromo) {
      try {
        const promoData = JSON.parse(savedPromo);
        console.log('📥 Loaded saved puzzle reward:', promoData);
      } catch (e) {
        console.error('❌ Failed to parse saved puzzle reward:', e);
        localStorage.removeItem('puzzleRewardPromo');
      }
    }
  }, []);

  function initializePuzzle() {
    const size = grid * grid;
    const numbers = Array.from({ length: size - 1 }, (_, i) => i + 1);
    numbers.push(null);
    
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
      const token = localStorage.getItem('access_token');
      let emailToUse = email;
      
      // If user is logged in, don't send email (backend will use auth user's email)
      if (token && isAuthenticated) {
        console.log("🔐 User is authenticated, using account email");
        emailToUse = authUser.email; // Let backend handle it
      }
      
      const data = await api.startPuzzle({ 
        email: emailToUse, 
        grid_size: grid 
      });
      setSessionId(data.session_id);
      setStartedAt(Date.now());
      setMoves(0);
    } catch (e) {
      setErr(e.message || "Failed to start");
    }
  }

  // Function to save promo code to localStorage
  const savePromoCode = (promoCode, sessionData) => {
    console.log('💾 Saving promo code:', promoCode);
    
    const rewardData = {
      code: promoCode,
      type: 'puzzle_reward',
      earned_at: new Date().toISOString(),
      session_id: sessionId,
      awarded_points: sessionData.awarded_points || 0,
      message: sessionData.message || 'Puzzle Game Reward',
      grid_size: grid,
      moves: moves,
      time_ms: elapsed
    };

    // Save to puzzle rewards storage
    localStorage.setItem('puzzleRewardPromo', JSON.stringify(rewardData));
    
    // Also save to main promo storage for checkout (with discount info)
    const checkoutPromoData = {
      code: promoCode,
      discount_type: 'AMOUNT',
      discount_amount: 50, // You can adjust this based on puzzle difficulty
      message: 'Puzzle Reward - ' + (sessionData.message || 'Congratulations!'),
      source: 'puzzle_game'
    };
    
    localStorage.setItem('appliedPromo', JSON.stringify(checkoutPromoData));
    
    console.log('✅ Promo code saved to localStorage:', {
      puzzleReward: rewardData,
      checkoutPromo: checkoutPromoData
    });

    return rewardData;
  };

  async function complete() {
    if (!sessionId || !startedAt) return;
    
    // If puzzle is not solved, automatically solve it
    if (!solved) {
      setAutoSolving(true);
      
      const estimatedMoves = Math.max(10, grid * grid * 5);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMoves(estimatedMoves);
      setSolved(true);
      setAutoSolving(false);
      
      const size = grid * grid;
      const solvedPuzzle = Array.from({ length: size - 1 }, (_, i) => i + 1);
      solvedPuzzle.push(null);
      setPuzzle(solvedPuzzle);
    }
    
    setFinishing(true);
    try {
      const time_ms = Date.now() - startedAt;
      const data = await api.completePuzzle({ session_id: sessionId, moves, time_ms });
      
      let message = "Completed.";
      if (data.awarded_points > 0) {
        message = `🎉 ${data.awarded_points} points added to your account!`;
      } else if (data.promo_code) {
        message = `🎁 Use promo code: ${data.promo_code}`;
        
        // SAVE THE PROMO CODE TO LOCALSTORAGE
        savePromoCode(data.promo_code, data);
      }
      
      setResult({
        awarded_points: data.awarded_points ?? 0,
        reward_code: data.promo_code || "",
        message: message,
        email_used: data.email_used || false,
        promo_saved: !!data.promo_code // Track if promo was saved
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
    
    if (
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row - emptyRow) === 1)
    ) {
      const newPuzzle = [...puzzle];
      [newPuzzle[index], newPuzzle[emptyIndex]] = [newPuzzle[emptyIndex], newPuzzle[index]];
      setPuzzle(newPuzzle);
      setMoves(moves + 1);
      
      checkSolved(newPuzzle);
    }
  }

  function checkSolved(currentPuzzle) {
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
              <span>
                Email {isAuthenticated ? "(using your account email)" : "(optional)"}
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAuthenticated ? "Using your account email" : "you@email.com"}
                disabled={isAuthenticated}
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
            {isAuthenticated 
              ? "Points will be added directly to your account!"
              : "Tip: Log in or provide email to earn loyalty points. Otherwise, you'll get a promo code."
            }
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
                {result.promo_saved && (
                  <div className="good small" style={{ marginTop: 4 }}>
                    ✅ Promo code automatically saved! It will be available at checkout.
                  </div>
                )}
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