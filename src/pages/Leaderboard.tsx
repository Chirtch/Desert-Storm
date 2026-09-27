import { useEffect, useState } from "react";
import { supabase } from "../supabase";

type LeaderboardEntry = {
  name: string;
  score: number;
};

function Leaderboard() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScores = async () => {
      const { data, error } = await supabase
        .from("Leaderboard")
        .select("name, score")
        .order("score", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Could not load leaderboard:", error);
      } else {
        setScores(data ?? []);
      }

      setLoading(false);
    };

    loadScores();
  }, []);

  return (
    <div className="leaderboard-page">
      <h1>Desert Storm</h1>
      <h2>Leaderboard</h2>

      {loading ? (
        <p>Loading scores...</p>
      ) : scores.length === 0 ? (
        <p>No scores yet.</p>
      ) : (
        <div className="leaderboard-list">
          {scores.map((entry, index) => (
            <div
              className="leaderboard-row"
              key={`${entry.name}-${index}`}
            >
              <span>
                {index + 1}. {entry.name}
              </span>

              <span>{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;