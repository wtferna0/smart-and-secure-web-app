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

  const timerRef = useRef(null);

  function resetAll() {
    setSessionId(null);
    setMoves(0);
    setStartedAt(null);
    setFinishing(false);
    setResult(null);
    setErr("");
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

  // Very simple “moves” demo — replace with your actual puzzle interactions.
  function performMove() {
    if (!sessionId) return;
    setMoves((m) => m + 1);
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
              <button className="btn" onClick={performMove}>Make a Move</button>
              <button className="btn btn-primary" onClick={complete} disabled={finishing}>
                {finishing ? "Finishing..." : "Complete Puzzle"}
              </button>
              <button className="btn" onClick={resetAll}>Reset</button>
            </div>
            {err && <div className="bad" style={{ marginTop: 8 }}>{err}</div>}
          </div>

          {/* Placeholder grid; swap with your real puzzle board */}
          <div className="card c-pad">
            <div className="muted small">Puzzle board placeholder — hook your actual UI here.</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${grid}, 64px)`, gap: 6, marginTop: 8 }}>
              {Array.from({ length: grid * grid }).map((_, i) => (
                <div key={i} style={{
                  width: 64, height: 64, borderRadius: 8, border: "1px solid var(--border)",
                  display: "grid", placeItems: "center", background: "var(--card)"
                }}>
                  {i + 1}
                </div>
              ))}
            </div>
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
