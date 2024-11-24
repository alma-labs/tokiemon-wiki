import { useState, useEffect } from 'react';
import { Item } from './types';
import ItemGrid from './components/ItemGrid';
import { Search, AlertCircle, Filter } from 'lucide-react';

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
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
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rarity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType ? item.type === selectedType : true;
    const matchesRarity = selectedRarity ? item.rarity === selectedRarity : true;

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Item Wiki</h1>
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 min-w-[200px]">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 min-w-[200px]">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Rarities</option>
                  {uniqueRarities.map(rarity => (
                    <option key={rarity} value={rarity}>{rarity}</option>
                  ))}
                </select>
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