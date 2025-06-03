import { useState, useEffect } from "react";
import { ExternalLink, Sword, Ghost, Wallet, Skull, Menu, X, ChevronDown, FileText } from "lucide-react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Market } from "./components/Market";
import ItemsSection from "./components/ItemsSection";
import MonstersSection from "./components/MonstersSection";
import { Item, Community } from "./types";
import { MarketContent } from "./components/MarketContent";
import { ChainGuard } from "./components/ChainGuard";
import { BlackMarketContent } from "./components/BlackMarketContent";
import ItemPage from "./components/ItemPage";
import Changelog from "./components/Changelog";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<
    "items" | "monsters" | "market" | "black-market" | "changelog"
  >("items");
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".mobile-menu-container")) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const path = location.pathname.slice(1) || "items";
    setActiveSection(path as "items" | "monsters" | "market" | "black-market" | "changelog");
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
          const response = await fetch("https://api.tokiemon.io/leaderboards/communities");
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

  const handleNavigation = (section: "items" | "monsters" | "market" | "black-market" | "changelog") => {
    setActiveSection(section);
    navigate(`/${section}`);
  };

  return (
    <ChainGuard>
      <div className="min-h-screen bg-slate-900">
        <header className="bg-slate-800 shadow-lg sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <img
                    src="https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/rarities/legendary.png"
                    alt=""
                    className="w-7 h-7 sm:w-8 sm:h-8"
                  />
                  Tokiemon Wiki & Market
                </h1>
              </div>
              {activeSection === "market" || activeSection === "black-market" ? (
                <Market />
              ) : (
                <div className="flex gap-2">
                  <a
                    href="https://docs.tokiemon.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 
                      text-white rounded-lg transition-colors duration-200 font-medium text-sm"
                  >
                    <span>View Docs</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://app.tokiemon.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#1da1f2] hover:bg-[#1a91da] 
                      text-white rounded-lg transition-colors duration-200 font-medium text-sm shadow-[0_0_10px_rgba(29,161,242,0.3)]"
                  >
                    <span>Play Tokiemon</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <nav className="flex md:flex-wrap gap-1 mt-3">
              <div className="w-full md:w-auto mobile-menu-container">
                <button
                  className="md:hidden flex items-center justify-between w-full text-white p-2 hover:bg-slate-700 rounded-lg bg-slate-700/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    {activeSection === "items" && <Sword className="w-3.5 h-3.5" />}
                    {activeSection === "monsters" && <Ghost className="w-3.5 h-3.5" />}
                    {activeSection === "market" && <Wallet className="w-3.5 h-3.5" />}
                    {activeSection === "black-market" && <Skull className="w-3.5 h-3.5" />}
                    {activeSection === "changelog" && <FileText className="w-3.5 h-3.5" />}
                    <span className="capitalize">{activeSection.replace("-", " ")}</span>
                    {(activeSection === "market" || activeSection === "black-market") && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 ${
                          activeSection === "market" ? "bg-[#1da1f2]" : "bg-red-500"
                        } text-white rounded-full font-medium leading-none`}
                      >
                        {activeSection === "market" ? "beta" : "alpha"}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMobileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <div
                  className={`${
                    isMobileMenuOpen ? "flex" : "hidden"
                  } md:flex flex-col md:flex-row absolute md:relative left-0 right-0 top-full md:top-auto bg-slate-800 md:bg-transparent p-2 md:p-0 gap-1 shadow-lg md:shadow-none border-t border-slate-700/50 md:border-0`}
                >
                  <button
                    onClick={() => {
                      handleNavigation("items");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      activeSection === "items"
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <Sword className="w-3.5 h-3.5" />
                    Items
                  </button>
                  <button
                    onClick={() => {
                      handleNavigation("monsters");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      activeSection === "monsters"
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <Ghost className="w-3.5 h-3.5" />
                    Monsters
                  </button>
                  <button
                    onClick={() => {
                      handleNavigation("market");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      activeSection === "market"
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Market</span>
                  </button>
                  <button
                    onClick={() => {
                      handleNavigation("black-market");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      activeSection === "black-market"
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <Skull className="w-3.5 h-3.5" />
                    <span>Black Market</span>
                  </button>
                  <button
                    onClick={() => {
                      handleNavigation("changelog");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      activeSection === "changelog"
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Changelog</span>
                  </button>
                </div>
              </div>
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
                <Route path="/items/:id" element={<ItemPage items={items} />} />
                <Route path="/monsters" element={<MonstersSection communities={communities} />} />
                <Route path="/market" element={<MarketContent />} />
                <Route path="/black-market" element={<BlackMarketContent />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/" element={<Navigate to="/items" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ChainGuard>
  );
}
