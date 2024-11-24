import { Item } from '../types';
import { X } from 'lucide-react';

interface ItemModalProps {
  item: Item;
  onClose: () => void;
}

export default function ItemModal({ item, onClose }: ItemModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{item.name}</h2>
              <p className="text-sm text-gray-500">ID: {item.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-64 object-contain mb-4"
              />
            </div>

            <div>
              <p className="text-gray-600 mb-4">{item.description}</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600">Type:</span>
                    <span>{item.type}</span>
                    <span className="text-gray-600">Rarity:</span>
                    <span>{item.rarity}</span>
                    {item.slot && (
                      <>
                        <span className="text-gray-600">Slot:</span>
                        <span>{item.slot}</span>
                      </>
                    )}
                    {item.maxSupply && (
                      <>
                        <span className="text-gray-600">Max Supply:</span>
                        <span>{item.maxSupply}</span>
                      </>
                    )}
                  </div>
                </div>

                {item.impacts.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Impacts</h3>
                    <div className="space-y-2">
                      {item.impacts.map((impact, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-gray-600">{impact.type}:</span>
                          <span>
                            {impact.amount && `+${impact.amount}`}
                            {impact.time && ` (${impact.time / 3600}h)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.requirements.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Requirements</h3>
                    <div className="space-y-2">
                      {item.requirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-gray-600">{req.type}:</span>
                          <span>{req.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}