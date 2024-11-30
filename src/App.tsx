import { useState, useEffect } from "react";
import { ExternalLink, Sword, Ghost, Wallet } from "lucide-react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Market } from "./components/Market";
import ItemsSection from "./components/ItemsSection";
import MonstersSection from "./components/MonstersSection";
import { Item, Community } from "./types";
import { MarketContent } from "./components/MarketContent";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<
    "items" | "monsters" | "market"
  >("items");
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    const path = location.pathname.slice(1) || "items";
    setActiveSection(path as "items" | "monsters" | "market");
  }, [location]);

  useEffect(() => {
    const fetchItems = async () => {
      if (location.pathname === "/items" || activeSection === "items") {
        try {
          const response = await fetch("https://api.tokiemon.io/items/all");
          if (!response.ok) throw new Error("Failed to fetch items");
          const data = await response.json();
          data.sort((a: Item, b: Item) => parseInt(a.id) - parseInt(b.id));
          setItems(data);
        } catch (err) {
          console.error("Failed to load items:", err);
        }
      }
    };

    const fetchCommunities = async () => {
      if (location.pathname === "/monsters" || activeSection === "monsters") {
        try {
          const response = await fetch(
            "https://api.tokiemon.io/leaderboards/communities"
          );
          if (!response.ok) throw new Error("Failed to fetch communities");
          const data = await response.json();
          setCommunities(data.communities);
        } catch (err) {
          console.error("Failed to load communities:", err);
        }
      }
    };

    fetchItems();
    fetchCommunities();
  }, [location.pathname, activeSection]);

  const handleNavigation = (section: "items" | "monsters" | "market") => {
    setActiveSection(section);
    navigate(`/${section}`);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <img
                  src="https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/rarities/legendary.png"
                  alt=""
                  className="w-8 h-8"
                />
                Tokiemon Wiki & Market
              </h1>
              <p className="text-[#94a3b8] mt-1">
                Discover Tokiemon Monsters & Items of Degenia
              </p>
            </div>
            {activeSection === "market" ? (
              <Market />
            ) : (
              <div className="mt-4 md:mt-0 flex gap-2">
                <a
                  href="https://docs.tokiemon.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 
                    text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  <span>View Docs</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="https://app.tokiemon.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-[#1da1f2] hover:bg-[#1a91da] 
                    text-white rounded-lg transition-colors duration-200 font-medium shadow-[0_0_10px_rgba(29,161,242,0.3)]"
                >
                  <span>Play Tokiemon</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          <nav className="flex space-x-1">
            <button
              onClick={() => handleNavigation("items")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === "items"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Sword className="w-4 h-4" />
              Items
            </button>
            <button
              onClick={() => handleNavigation("monsters")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === "monsters"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Ghost className="w-4 h-4" />
              Monsters
            </button>
            <button
              onClick={() => handleNavigation("market")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === "market"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Market</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#1da1f2] text-white rounded-full font-medium leading-none">
                beta
              </span>
            </button>
          </nav>
        </div>
      </header>

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <Routes location={location} key={location.pathname}>
              <Route
                path="/items"
                element={
                  <ItemsSection
                    items={items}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedTypes={selectedTypes}
                    setSelectedTypes={setSelectedTypes}
                    selectedRarities={selectedRarities}
                    setSelectedRarities={setSelectedRarities}
                  />
                }
              />
              <Route
                path="/monsters"
                element={<MonstersSection communities={communities} />}
              />
              <Route path="/market" element={<MarketContent />} />
              <Route path="/" element={<Navigate to="/items" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
