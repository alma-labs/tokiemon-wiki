import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Item, Community } from './types';
import ItemsSection from './components/ItemsSection';
import MonstersSection from './components/MonstersSection';
import { AlertCircle, ExternalLink, Sword, Ghost } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="text-red-500 w-6 h-6" />
        <p className="text-red-700">{error}</p>
      </div>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<'items' | 'monsters'>('items');
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('https://api.tokiemon.io/items/all');
        if (!response.ok) throw new Error('Failed to fetch items');
        const data = await response.json();
        // Sort items by ID
        data.sort((a: Item, b: Item) => parseInt(a.id) - parseInt(b.id));
        setItems(data);
        setError(null);
      } catch (err) {
        setError('Failed to load items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    const fetchCommunities = async () => {
      if (activeSection === 'monsters') {
        try {
          const response = await fetch('https://api.tokiemon.io/leaderboards/communities');
          if (!response.ok) throw new Error('Failed to fetch communities');
          const data = await response.json();
          setCommunities(data.communities);
        } catch (err) {
          setError('Failed to load communities. Please try again later.');
        }
      }
    };

    fetchCommunities();
  }, [activeSection]);

  // Keep nav and URL in sync
  useEffect(() => {
    const path = location.pathname.slice(1) || 'items';
    setActiveSection(path as 'items' | 'monsters');
  }, [location]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <img 
                  src="https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/rarities/legendary.png"
                  alt=""
                  className="w-8 h-8"
                />
                Tokiemon Wiki
              </h1>
              <p className="text-[#94a3b8] mt-1">Browse and discover the world of Tokiemon</p>
            </div>
            <a 
              href="https://app.tokiemon.io"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 md:mt-0 flex items-center justify-center gap-2 px-6 py-2 bg-[#1da1f2] hover:bg-[#1a91da] 
                text-white rounded-lg transition-colors duration-200 font-medium shadow-[0_0_10px_rgba(29,161,242,0.3)]"
            >
              <span>Play Tokiemon</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <nav className="flex space-x-1">
            <button
              onClick={() => navigate('/items')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'items' 
                  ? 'bg-slate-700 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sword className="w-4 h-4" />
              Items
            </button>
            <button
              onClick={() => navigate('/monsters')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'monsters' 
                  ? 'bg-slate-700 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Ghost className="w-4 h-4" />
              Monsters
            </button>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/items" element={<ItemsSection
          items={items}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          selectedRarities={selectedRarities}
          setSelectedRarities={setSelectedRarities}
        />} />
        <Route path="/monsters" element={<MonstersSection communities={communities} />} />
        <Route path="/" element={<Navigate to="/items" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}