import { Search, Star } from "lucide-react";
import { MultiSelect } from "./MultiSelect";
import ItemGrid from "./ItemGrid";
import { Item } from "../types";
import { useState } from "react";

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
  const [showPartnerItemsOnly, setShowPartnerItemsOnly] = useState(false);
  
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
    const matchesPartner = 
      !showPartnerItemsOnly || (item.socialLinks && item.socialLinks.length > 0);

    return matchesSearch && matchesType && matchesRarity && matchesPartner;
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
          
          <div className="flex items-center">
            <button
              onClick={() => setShowPartnerItemsOnly(!showPartnerItemsOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                showPartnerItemsOnly 
                  ? "bg-yellow-500 text-slate-900 hover:bg-yellow-400" 
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <Star className={`w-4 h-4 ${showPartnerItemsOnly ? "fill-slate-900" : ""}`} />
              <span>Partner Items</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <ItemGrid items={filteredItems} />
      </div>
    </main>
  );
}
