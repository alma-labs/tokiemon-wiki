import { useState } from 'react';
import { Item } from '../types';
import ItemModal from './ItemModal';

interface ItemGridProps {
  items: Item[];
}

export default function ItemGrid({ items }: ItemGridProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const rarityColors = {
    Common: 'bg-gray-100',
    Uncommon: 'bg-green-100',
    Rare: 'bg-blue-100',
    Epic: 'bg-purple-100',
    Legendary: 'bg-yellow-100'
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className={`${rarityColors[item.rarity as keyof typeof rarityColors]} 
              rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer
              transform hover:scale-105 transition-transform duration-200`}
          >
            <div className="p-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-contain mb-4"
              />
              <h3 className="text-lg font-bold mb-2 truncate">{item.name}</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">{item.type}</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full
                  ${item.rarity === 'Common' ? 'bg-gray-200 text-gray-700' :
                    item.rarity === 'Uncommon' ? 'bg-green-200 text-green-700' :
                    item.rarity === 'Rare' ? 'bg-blue-200 text-blue-700' :
                    item.rarity === 'Epic' ? 'bg-purple-200 text-purple-700' :
                    'bg-yellow-200 text-yellow-700'}`}
                >
                  {item.rarity}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
}