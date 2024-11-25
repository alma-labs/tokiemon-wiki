import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TokiemonData {
  tokiemon: Array<{
    tokiemon: {
      communityId: string;
      name: string;
      image: string;
      purchaseTier: number;
    };
  }>;
}

interface MonsterArtModalProps {
  communityId: string;
  onClose: () => void;
  data?: TokiemonData;
  isLoading: boolean;
}

export default function MonsterArtModal({ communityId, onClose, data, isLoading }: MonsterArtModalProps) {
  const [currentPages, setCurrentPages] = useState<Record<number, number>>({
    0: 0,
    1: 0,
    2: 0,
    3: 0
  });

  const tiers = [
    { name: 'Free (Always the Same)', purchaseTier: 0 },
    { name: 'Kawaii', purchaseTier: 1 },
    { name: 'Dragon', purchaseTier: 2 },
    { name: 'DEGEN', purchaseTier: 3 }
  ];

  const getTierArt = (tier: number) => {
    if (tier === 0) {
      return [{
        image: `https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/starters/${communityId}.png`
      }];
    }
    
    return data?.tokiemon.filter(t => t.tokiemon.purchaseTier === tier) || [];
  };

  const handlePageChange = (tier: number, delta: number) => {
    const artworks = getTierArt(tier);
    setCurrentPages(prev => ({
      ...prev,
      [tier]: (prev[tier] + delta + artworks.length) % Math.max(1, artworks.length)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a2432] border border-[#2a3844] rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto text-[#e2e8f0] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <img 
                src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/${communityId}.png`}
                alt={communityId}
                className="w-8 h-8"
              />
              <h2 className="text-2xl font-bold">{communityId} Art Example Mints</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {tiers.map(tier => {
                const artworks = getTierArt(tier.purchaseTier);
                const currentArtwork = artworks[currentPages[tier.purchaseTier]];
                
                return (
                  <div key={tier.name}>
                    <div className="text-lg font-medium mb-2">{tier.name}</div>
                    <div className="bg-[#141c27] rounded p-4 shadow-inner aspect-square relative">
                      {currentArtwork ? (
                        <>
                          <img
                            src={'image' in currentArtwork ? currentArtwork.image : currentArtwork.tokiemon.image}
                            alt={`${communityId} ${tier.name}`}
                            className="w-full h-full object-contain"
                          />
                          {artworks.length > 1 && (
                            <div className="absolute inset-x-0 bottom-0 flex justify-between p-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePageChange(tier.purchaseTier, -1);
                                }}
                                className="p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-xs bg-slate-800/80 px-2 py-1 rounded-full">
                                {currentPages[tier.purchaseTier] + 1} / {artworks.length}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePageChange(tier.purchaseTier, 1);
                                }}
                                className="p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          No example yet
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 