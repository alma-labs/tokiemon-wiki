import { useState, useEffect } from 'react';
import { Community, CommunityMetadata } from '../types';
import MonsterArtModal from './MonsterArtModal';
import { Search } from 'lucide-react';
import { LazyImage } from './LazyImage';

export default function MonsterGrid({ communities }: { communities: Community[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, CommunityMetadata>>({});
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/alma-labs/tokiemon-lists/refs/heads/main/tokens/allCommunity.json');
        const data: CommunityMetadata[] = await response.json();
        
        // Create metadata lookup and collect all unique tags
        const metadataMap = Object.fromEntries(
          data.filter(item => !item.inactive).map(item => [item.communityId, item])
        );
        setMetadata(metadataMap);
        
        const tags = Array.from(new Set(
          data.flatMap(item => item.tags)
        )).sort();
        setAllTags(tags);
      } catch (err) {
        console.error('Failed to load community metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  const filteredCommunities = communities.filter(community => {
    const communityMeta = metadata[community.communityId];
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      community.communityId.toLowerCase().includes(searchTermLower) || 
      communityMeta?.name.toLowerCase().includes(searchTermLower);
    const matchesTags = selectedTags.length === 0 || 
      (communityMeta?.tags && selectedTags.every(tag => communityMeta.tags.includes(tag)));
    return matchesSearch && matchesTags;
  });

  const handleImageLoad = (communityId: string) => {
    setLoadedImages(prev => ({ ...prev, [communityId]: true }));
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

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'BASE':
        return 'bg-blue-600/30 text-blue-200';
      case 'PARTNER':
        return 'bg-slate-600/30 text-slate-200';
      case 'MEME':
        return 'bg-green-600/30 text-green-200';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Tags */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTags(prev => 
                prev.includes(tag) 
                  ? prev.filter(t => t !== tag)
                  : [...prev, tag]
              )}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${selectedTags.includes(tag)
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredCommunities.map((community) => {
          return (
            <div
              key={community._id}
              onClick={() => {
                setSelectedCommunity(community.communityId);
                fetchCommunityData(community.communityId);
              }}
              className="bg-[#1a2432] rounded border border-[#2a3844] shadow-[0_0_10px_rgba(0,0,0,0.5)] 
                hover:shadow-[0_0_15px_rgba(0,0,0,0.7)] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/${community.communityId}.png`}
                      alt={community.communityId}
                      className="w-8 h-8"
                    />
                    <div className="leading-tight">
                      <h3 className="text-base font-bold text-white">{metadata[community.communityId]?.name || community.communityId}</h3>
                      <div className="text-[11px] text-[#94a3b8]">{community.communityId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      className="h-5 px-2 text-[11px] font-medium text-slate-400 bg-[#141c27] rounded hover:bg-slate-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCommunity(community.communityId);
                        fetchCommunityData(community.communityId);
                      }}
                    >
                      See All Art
                    </button>
                    <a
                      href={`https://app.tokiemon.io/mint?communityId=${community.communityId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-5 px-2 text-[11px] font-medium text-white bg-[#1da1f2] hover:bg-[#1a91da] rounded transition-colors flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Mint Now
                    </a>
                  </div>
                </div>

                {/* Art Showcase */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Current Leader Art */}
                  <div>
                    <div className="text-xs text-[#94a3b8] mb-1 font-medium">Current Leader</div>
                    <div className="bg-[#141c27] rounded p-2 shadow-inner">
                      <LazyImage
                        src={community.leader.image}
                        alt={`${community.communityId} Leader`}
                      />
                    </div>
                  </div>

                  {/* Starter Art */}
                  <div>
                    <div className="text-xs text-[#94a3b8] mb-1 font-medium">Free Tier</div>
                    <div className="bg-[#141c27] rounded p-2 shadow-inner">
                      <LazyImage
                        src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/starters/${community.communityId}.png`}
                        alt={`${community.communityId} Starter`}
                      />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {metadata[community.communityId]?.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-700">
                    {metadata[community.communityId].tags.map((tag: string) => (
                      <span 
                        key={tag} 
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
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