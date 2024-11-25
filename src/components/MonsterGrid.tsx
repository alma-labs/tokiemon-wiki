import { useState } from 'react';
import { Community } from '../types';
import MonsterArtModal from './MonsterArtModal';

interface MonsterGridProps {
  communities: Community[];
}

export default function MonsterGrid({ communities }: MonsterGridProps) {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageLoad = (communityId: string) => {
    setLoadedImages(prev => ({ ...prev, [communityId]: true }));
  };

  const isFullyLoaded = (communityId: string) => {
    return loadedImages[`${communityId}-leader`] && loadedImages[`${communityId}-starter`];
  };

  const fetchCommunityData = async (communityId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.tokiemon.io/leaderboards/tokiemon?communityId=${communityId}`);
      if (!response.ok) throw new Error('Failed to fetch community data');
      const data = await response.json();
      setModalData(data);
    } catch (err) {
      console.error('Failed to load community data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {communities.map((community) => (
        <div
          key={community._id}
          onClick={() => {
            setSelectedCommunity(community.communityId);
            fetchCommunityData(community.communityId);
          }}
          className="bg-[#1a2432] rounded border border-[#2a3844] shadow-[0_0_10px_rgba(0,0,0,0.5)] 
            hover:shadow-[0_0_15px_rgba(0,0,0,0.7)] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
        >
          <div className="p-4">
            {/* Community Token */}
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/${community.communityId}.png`}
                alt={community.communityId}
                className="w-8 h-8"
              />
              <h3 className="text-lg font-bold text-white">{community.communityId}</h3>
            </div>

            {/* Art Showcase */}
            <div className="grid grid-cols-2 gap-4">
              {/* Current Leader Art */}
              <div>
                <div className="text-xs text-[#94a3b8] mb-1 font-medium">Current Leader</div>
                <div className="bg-[#141c27] rounded p-2 shadow-inner aspect-square relative">
                  {!loadedImages[`${community.communityId}-leader`] && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img
                    src={community.leader.image}
                    alt={`${community.communityId} Leader`}
                    className={`w-full h-full object-contain transition-opacity duration-300 ${
                      loadedImages[`${community.communityId}-leader`] ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(`${community.communityId}-leader`)}
                  />
                </div>
              </div>

              {/* Starter Art */}
              <div>
                <div className="text-xs text-[#94a3b8] mb-1 font-medium">Free Tier</div>
                <div className="bg-[#141c27] rounded p-2 shadow-inner aspect-square relative">
                  {!loadedImages[`${community.communityId}-starter`] && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img
                    src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/starters/${community.communityId}.png`}
                    alt={`${community.communityId} Starter`}
                    className={`w-full h-full object-contain transition-opacity duration-300 ${
                      loadedImages[`${community.communityId}-starter`] ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(`${community.communityId}-starter`)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {selectedCommunity && (
        <MonsterArtModal
          communityId={selectedCommunity}
          onClose={() => {
            setSelectedCommunity(null);
            setModalData(null);
          }}
          data={modalData}
          isLoading={isLoading}
        />
      )}
    </div>
  );
} 