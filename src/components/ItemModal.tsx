import { Item } from '../types';
import { X, ExternalLink } from 'lucide-react';

interface ItemModalProps {
  item: Item;
  onClose: () => void;
}

export default function ItemModal({ item, onClose }: ItemModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a2432] border border-[#2a3844] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto text-[#e2e8f0] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{item.name}</h2>
              <p className="text-sm text-gray-400">ID: {item.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-[#141c27] rounded p-4 shadow-inner">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-64 object-contain"
                />
              </div>
              
              <a 
                href={`https://opensea.io/assets/base/0xad574f7f4eb563b0ccdcca0d7d7628aeaf071d65/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1da1f2] hover:bg-[#1a91da] 
                  text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-[0_0_10px_rgba(29,161,242,0.3)]
                  w-full"
              >
                <span>Shop on OpenSea</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div>
              <p className="text-[#94a3b8] mb-4">{item.description}</p>

              <div className="space-y-4">
                <div className="bg-[#141c27] rounded p-4 shadow-inner">
                  <h3 className="font-semibold mb-2 text-[#e2e8f0]">Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">Type:</span>
                    <span>{item.type}</span>
                    <span className="text-gray-400">Rarity:</span>
                    <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full
                      ${item.rarity === 'Common' ? 'bg-blue-950 text-blue-200' :
                        item.rarity === 'Uncommon' ? 'bg-green-900 text-green-200' :
                        item.rarity === 'Rare' ? 'bg-red-900 text-red-200' :
                        item.rarity === 'Epic' ? 'bg-purple-900 text-purple-200' :
                        'bg-cyan-900 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.3)]'}`}
                    >
                      <img 
                        src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/rarities/${item.rarity.toLowerCase()}.png`}
                        alt=""
                        className="w-4 h-4"
                      />
                      {item.rarity}
                    </span>
                    {item.slot && (
                      <>
                        <span className="text-gray-400">Slot:</span>
                        <span>{item.slot}</span>
                      </>
                    )}
                    {item.maxSupply && (
                      <>
                        <span className="text-gray-400">Max Supply:</span>
                        <span>{item.maxSupply}</span>
                      </>
                    )}
                  </div>
                </div>

                {item.impacts.length > 0 && (
                  <div className="bg-[#141c27] rounded p-4 shadow-inner">
                    <h3 className="font-semibold mb-2 text-[#e2e8f0]">Impacts</h3>
                    <div className="space-y-2">
                      {item.impacts.map((impact, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-gray-400">{impact.type === 'Mood' ? 'Energy' : impact.type}:</span>
                          <span>
                            {impact.type === 'Mood' && !impact.amount && impact.time ? (
                              'Max'
                            ) : (
                              impact.amount && `+${impact.amount}`
                            )}
                            {impact.time && ` (${impact.time / 3600}h)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.requirements.length > 0 && (
                  <div className="bg-[#141c27] rounded p-4 shadow-inner">
                    <h3 className="font-semibold mb-2 text-[#e2e8f0]">Requirements</h3>
                    <div className="space-y-2">
                      {item.requirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-gray-400">{req.type}:</span>
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