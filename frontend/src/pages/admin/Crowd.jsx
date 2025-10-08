import React, { useEffect, useState } from "react";
import AdminTabs from "../../components/admin/AdminTabs.jsx";
import { api } from "../../lib/api.js";
import "./crowd.css"; // We'll create this CSS file

const hours = Array.from({ length: 15 }, (_, i) => 7 + i); // 7 AM → 9 PM
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CROWD_STATES = { "Quiet": "Normal", "Normal": "Busy", "Busy": "Quiet" };

export default function AdminCrowd() {
  const [grid, setGrid] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentCrowd, setCurrentCrowd] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  // Fetch current crowd level and predictions
  const fetchCrowdData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current crowd level - use getCurrentCrowd instead of getPredictions
      const currentData = await api.getCurrentCrowd();
      setCurrentCrowd(currentData);
      
      // Get crowd history - this should now work
      const historyData = await api.getCrowdHistory(20);
      setHistory(historyData);
      
      // Initialize grid with default predictions
      initializeGrid();
      
    } catch (err) {
      console.error("Failed to load crowd data:", err);
      setError(`Failed to load crowd data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize prediction grid
  const initializeGrid = () => {
    const schedule = {};
    
    // Create default predictions based on time patterns
    days.forEach((day, dayIndex) => {
      hours.forEach(hour => {
        const key = `${dayIndex}-${hour}`;
        let state = "Normal";
        let confidence = 0.7;
        
        // Pattern-based predictions
        if (hour >= 8 && hour <= 10) { // Morning rush
          state = "Busy";
          confidence = 0.8;
        } else if (hour >= 12 && hour <= 14) { // Lunch rush
          state = "Busy";
          confidence = 0.9;
        } else if (hour >= 17 && hour <= 19) { // Evening rush
          state = "Busy";
          confidence = 0.85;
        } else if (hour < 7 || hour > 20) { // Early/Late
          state = "Quiet";
          confidence = 0.6;
        } else if (dayIndex >= 5) { // Weekend
          state = hour >= 10 && hour <= 16 ? "Busy" : "Normal";
          confidence = 0.75;
        }
        
        schedule[key] = {
          state,
          confidence,
          isOverride: false
        };
      });
    });
    
    setGrid(schedule);
  };

  // Toggle crowd state and send feedback
  const toggleCrowdState = async (dayIndex, hour) => {
    try {
      const key = `${dayIndex}-${hour}`;
      const current = grid[key]?.state || "Normal";
      const nextState = CROWD_STATES[current] || "Quiet";
      
      // Update local state immediately for responsive UI
      setGrid(prev => ({
        ...prev,
        [key]: { 
          ...prev[key], 
          state: nextState, 
          isOverride: true,
          confidence: 0.95 
        }
      }));

      // Convert to crowd level (0-50) based on state
      const levelMap = { "Quiet": 10, "Normal": 25, "Busy": 40 };
      const level = levelMap[nextState] || 25;
      
      // Send override to backend
      await api.sendFeedback({
        level: level,
        ttl_minutes: 60 // 1 hour override
      });
      
      setSuccess(`Crowd level set to ${nextState} for ${days[dayIndex]} ${hour}:00`);
      setTimeout(() => setSuccess(""), 3000);
      
      // Refresh current crowd data
      const updatedData = await api.getPredictions();
      setCurrentCrowd(updatedData);
      
    } catch (err) {
      console.error("Failed to update crowd level:", err);
      setError(`Failed to update: ${err.message}`);
      
      // Revert on error
      fetchCrowdData();
    }
  };

  // Get crowd level description
  const getCrowdDescription = (level) => {
    if (level < 15) return "Quiet";
    if (level < 30) return "Normal";
    return "Busy";
  };

  // Get color class for crowd state
  const getCrowdColorClass = (state) => {
    switch (state) {
      case "Quiet": return "quiet";
      case "Normal": return "normal";
      case "Busy": return "busy";
      default: return "normal";
    }
  };

  useEffect(() => {
    fetchCrowdData();
    
    // Refresh data every 2 minutes
    const interval = setInterval(fetchCrowdData, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section className="admin">
        <AdminTabs />
        <h1>Crowd Meter Management</h1>
        <p className="muted">Loading crowd data...</p>
      </section>
    );
  }

  return (
    <section className="admin">
      <AdminTabs />
      <h1>Crowd Meter Management (AI-assisted)</h1>
      <p className="muted">
        Real-time crowd monitoring and predictions. Click cells to override AI predictions.
      </p>

      {error && (
        <div className="error-message" style={{
          background: "#f8d7da",
          color: "#721c24",
          padding: "0.75rem",
          borderRadius: "4px",
          marginBottom: "1rem",
          border: "1px solid #f5c6cb"
        }}>
          ❌ {error}
          <button className="btn" onClick={fetchCrowdData} style={{ marginLeft: "0.5rem" }}>
            Retry
          </button>
        </div>
      )}

      {success && (
        <div className="success-message" style={{
          background: "#d4edda",
          color: "#155724",
          padding: "0.75rem",
          borderRadius: "4px",
          marginBottom: "1rem",
          border: "1px solid #c3e6cb"
        }}>
          ✅ {success}
        </div>
      )}

      {/* Current Crowd Status */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h3>Current Crowd Status</h3>
        {currentCrowd ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem" }}>
            <div className={`crowd-indicator ${getCrowdColorClass(getCrowdDescription(currentCrowd.level))}`}>
              <div className="crowd-level">{currentCrowd.level}</div>
              <div className="crowd-label">{getCrowdDescription(currentCrowd.level)}</div>
            </div>
            <div style={{ flex: 1 }}>
              <p><strong>Source:</strong> {currentCrowd.source}</p>
              <p><strong>Last Updated:</strong> {new Date(currentCrowd.updated_at).toLocaleTimeString()}</p>
              <p><strong>Capacity:</strong> {currentCrowd.level}/50 people</p>
            </div>
          </div>
        ) : (
          <p className="muted">No current crowd data available</p>
        )}
      </div>

      {/* Weekly Predictions Grid */}
      <div className="card">
        <h3>Weekly Crowd Predictions</h3>
        <p className="muted" style={{ marginBottom: "1rem" }}>
          AI-generated predictions.
        </p>

        <div className="crowd-grid-container">
          <table className="crowd-table">
            <thead>
              <tr>
                <th className="time-header">Time</th>
                {days.map((day, index) => (
                  <th key={day} className="day-header">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className="hour-cell">{hour}:00</td>
                  {days.map((_, dayIndex) => {
                    const key = `${dayIndex}-${hour}`;
                    const cell = grid[key] || { state: "Normal", confidence: 0.5, isOverride: false };
                    
                    return (
                      <td
                        key={key}
                        className={`crowd-cell ${getCrowdColorClass(cell.state)} ${
                          cell.isOverride ? "override" : ""
                        }`}
                        title={`${days[dayIndex]} ${hour}:00 - ${cell.state} (${Math.round(cell.confidence * 100)}% confidence)${
                          cell.isOverride ? " - MANUAL OVERRIDE" : ""
                        }`}
                        onClick={() => toggleCrowdState(dayIndex, hour)}
                      >
                        <div className="cell-content">
                          <span className="state-text">{cell.state}</span>
                          {!cell.isOverride && (
                            <span className="confidence-badge">
                              {Math.round(cell.confidence * 100)}%
                            </span>
                          )}
                          {cell.isOverride && (
                            <span className="override-indicator">⚡</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="crowd-legend" style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <h4>Legend</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color quiet"></span>
              <span>Quiet (0-15 people)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color normal"></span>
              <span>Normal (15-30 people)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color busy"></span>
              <span>Busy (30-50 people)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Crowd History */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <h3>Recent Crowd History</h3>
        {history.length > 0 ? (
          <div className="history-list">
            {history.slice(0, 10).map((snapshot, index) => (
              <div key={index} className="history-item">
                <span className={`status-badge ${getCrowdColorClass(getCrowdDescription(snapshot.level))}`}>
                  {snapshot.level} people
                </span>
                <span className="muted">
                  {new Date(snapshot.timestamp).toLocaleString()}
                </span>
                <span className="source-badge">{snapshot.source}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No crowd history available</p>
        )}
      </div>

      {/* Actions */}
      <div className="row" style={{ marginTop: "1rem", gap: "0.5rem" }}>
        <button className="btn btn-primary" onClick={fetchCrowdData}>
          🔄 Refresh Data
        </button>
      </div>
    </section>
  );
}