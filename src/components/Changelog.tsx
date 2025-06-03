import { useState, useEffect } from "react";
import { Calendar, ChevronRight } from "lucide-react";

interface ChangelogEntry {
  title: string;
  date: string;
  changes: string[];
}

export default function Changelog() {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const response = await fetch("https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/changelog/changelog.json");
        if (!response.ok) throw new Error("Failed to fetch changelog");
        const data = await response.json();
        setChangelog(data);
      } catch (err) {
        console.error("Failed to load changelog:", err);
        setError("Failed to load changelog data");
      } finally {
        setLoading(false);
      }
    };

    fetchChangelog();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-slate-400">Loading changelog...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Changelog</h1>
        <p className="text-slate-400">Latest updates and changes to Tokiemon</p>
      </div>

      <div className="space-y-6">
        {changelog.map((entry, index) => (
          <div key={index} className="bg-slate-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="text-xl font-semibold text-white">{entry.title}</h2>
                <p className="text-sm text-slate-400">{entry.date}</p>
              </div>
            </div>

            <div className="space-y-3">
              {entry.changes.map((change, changeIndex) => (
                <div key={changeIndex} className="flex items-start gap-3">
                  <ChevronRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-300 leading-relaxed">{change}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {changelog.length === 0 && (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-400">No changelog entries found.</p>
        </div>
      )}
    </div>
  );
} 