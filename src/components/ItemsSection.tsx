import { Search } from "lucide-react";
import { MultiSelect } from "./MultiSelect";
import ItemGrid from "./ItemGrid";
import { Item } from "../types";

interface ItemsSectionProps {
  items: Item[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  selectedRarities: string[];
  setSelectedRarities: (rarities: string[]) => void;
}

export default function ItemsSection({
  items,
  searchTerm,
  setSearchTerm,
  selectedTypes,
  setSelectedTypes,
  selectedRarities,
  setSelectedRarities,
}: ItemsSectionProps) {
  const uniqueTypes = Array.from(
    new Set(items.map((item) => item.type))
  ).sort();
  const uniqueRarities = Array.from(
    new Set(items.map((item) => item.rarity))
  ).sort();

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(item.type);
    const matchesRarity =
      selectedRarities.length === 0 || selectedRarities.includes(item.rarity);

    return matchesSearch && matchesType && matchesRarity;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
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

      <div className="overflow-hidden">
        <ItemGrid items={filteredItems} />
      </div>
    </main>
  );
}
