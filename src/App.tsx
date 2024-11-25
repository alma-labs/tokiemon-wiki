import { useState, useEffect, useRef } from 'react';
import { Item } from './types';
import ItemGrid from './components/ItemGrid';
import { Search, AlertCircle, Filter, Check, ExternalLink } from 'lucide-react';

interface DropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}

function MultiSelect({ options, selected, onChange, placeholder }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center gap-2 w-full cursor-pointer py-2 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="w-5 h-5 text-gray-400" />
        <span className="flex-1 text-left">
          {selected.length ? selected.join(', ') : placeholder}
        </span>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg">
          {options.map(option => (
            <div
              key={option}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-600 cursor-pointer"
              onClick={() => toggleOption(option)}
            >
              <div className="w-4 h-4 border border-gray-400 rounded flex items-center justify-center">
                {selected.includes(option) && (
                  <Check className="w-3 h-3 text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-white">
                {placeholder === "All Rarities" && (
                  <img 
                    src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/rarities/${option.toLowerCase()}.png`}
                    alt=""
                    className="w-4 h-4"
                  />
                )}
                <span>{option}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const uniqueTypes = Array.from(new Set(items.map(item => item.type))).sort();
  const uniqueRarities = Array.from(new Set(items.map(item => item.rarity))).sort();

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(item.type);
    const matchesRarity = selectedRarities.length === 0 || selectedRarities.includes(item.rarity);

    return matchesSearch && matchesType && matchesRarity;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500 w-6 h-6" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

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
                Tokiemon Item Wiki
              </h1>
              <p className="text-[#94a3b8] mt-1">Browse and discover items, consumables, and equipment</p>
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

          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-[2] min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search items by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-[200px]">
                <MultiSelect
                  options={uniqueTypes}
                  selected={selectedTypes}
                  onChange={setSelectedTypes}
                  placeholder="All Types"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <MultiSelect
                  options={uniqueRarities}
                  selected={selectedRarities}
                  onChange={setSelectedRarities}
                  placeholder="All Rarities"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6">
        <ItemGrid items={filteredItems} />
      </main>
    </div>
  );
}

export default App;