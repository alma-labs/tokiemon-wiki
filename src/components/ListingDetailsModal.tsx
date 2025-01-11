import { X, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useAccount } from "wagmi";
import { Listing, ItemInfo } from "./BlackMarketContent";
import { useState, useEffect } from "react";

interface TokiemonDetails {
  orientation: string;
  tokenId: string;
  chainId: number;
  description: string;
  image: string;
  name: string;
  attributes: Array<{
    trait_type: string;
    value?: string;
  }>;
}

interface ListingDetailsModalProps {
  listing: Listing;
  listingId: bigint;
  itemsInfo: Record<string, ItemInfo>;
  onClose: () => void;
  onMakeOffer: () => void;
  onAcceptOffer: (counterOfferId: bigint) => void;
  onCancelListing: () => void;
  onCancelOffer: (counterOfferId: bigint) => void;
  tokiemonInfo: Record<string, TokiemonDetails>;
}

export function ListingDetailsModal({ 
  listing, 
  listingId,
  itemsInfo,
  onClose,
  onMakeOffer,
  onAcceptOffer,
  onCancelListing,
  onCancelOffer,
  tokiemonInfo
}: ListingDetailsModalProps) {
  const { address } = useAccount();
  const [view, setView] = useState<'listing' | 'offers'>('listing');
  const activeOffers = listing.counterOffers.filter(offer => offer.isActive);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);

  const nextOffer = () => {
    setCurrentOfferIndex(prev => 
      prev === activeOffers.length - 1 ? prev : prev + 1
    );
  };

  const previousOffer = () => {
    setCurrentOfferIndex(prev => 
      prev === 0 ? prev : prev - 1
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">{listing.name}</h2>
              <p className="text-slate-400 text-sm">
                Listing #{listingId.toString()} • {listing.owner.slice(0, 6)}...{listing.owner.slice(-4)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {address === listing.owner && (
                <button
                  onClick={onCancelListing}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel Listing
                </button>
              )}
              {address !== listing.owner && (
                <button
                  onClick={onMakeOffer}
                  className="flex items-center gap-2 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Make Counter Offer
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setView('listing')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                view === 'listing' 
                  ? 'bg-slate-600 text-white' 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Listing
            </button>
            <button
              onClick={() => setView('offers')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                view === 'offers' 
                  ? 'bg-slate-600 text-white' 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Offers ({activeOffers.length})
            </button>
          </div>

          {view === 'listing' ? (
            <div className="space-y-4">
              {listing.usdcAmount > 0n && (
                <div className="flex items-center gap-3 bg-slate-700 p-3 rounded-lg">
                  <img
                    src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
                    alt="USDC"
                    className="w-10 h-10 rounded-lg"
                  />
                  <div className="text-lg font-medium text-white">${(Number(listing.usdcAmount) / 1e6).toFixed(2)}</div>
                </div>
              )}

              {listing.tokiemonIds.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Tokiemon</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {listing.tokiemonIds.map((id) => {
                      const tokiemon = tokiemonInfo[id.toString()];
                      console.log('Tokiemon data:', {
                        id: id.toString(),
                        attributes: tokiemon?.attributes?.map(a => ({
                          trait_type: a.trait_type,
                          value: a.value
                        })),
                        rawAttributes: tokiemon?.attributes
                      });
                      return (
                        <div key={id.toString()} className="bg-slate-700 rounded-lg p-3">
                          <div className="flex gap-4">
                            <img
                              src={tokiemon?.image}
                              alt={tokiemon?.name || `Tokiemon #${id}`}
                              className="w-24 h-24 rounded-lg"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">{tokiemon?.name || `#${id}`}</span>
                                <span className="text-slate-400 text-sm">#{tokiemon?.tokenId || id.toString()}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <div className="text-slate-400">Community: <span className="text-white">{tokiemon?.attributes?.find(a => a.trait_type === 'Community')?.value || '-'}</span></div>
                                <div className="text-slate-400">Tier: <span className="text-white">{tokiemon?.attributes?.find(a => a.trait_type === 'Purchase Tier')?.value || '-'}</span></div>
                                <div className="text-slate-400">Rarity: 
                                  <span className={`ml-1 ${
                                    tokiemon?.attributes?.find(a => a.trait_type === 'Rarity')?.value === 'Rare' ? 'text-yellow-500' :
                                    tokiemon?.attributes?.find(a => a.trait_type === 'Rarity')?.value === 'Uncommon' ? 'text-blue-500' :
                                    'text-white'
                                  }`}>
                                    {tokiemon?.attributes?.find(a => a.trait_type === 'Rarity')?.value || '-'}
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                                <div className="text-slate-400">ATK: <span className="text-white">{tokiemon?.attributes?.find(a => a.trait_type === 'Attack')?.value || '-'}</span></div>
                                <div className="text-slate-400">DEF: <span className="text-white">{tokiemon?.attributes?.find(a => a.trait_type === 'Defense')?.value || '-'}</span></div>
                                <div className="text-slate-400">MAG: <span className="text-white">{tokiemon?.attributes?.find(a => a.trait_type === 'Magic')?.value || '-'}</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {listing.itemIds.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Items</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {listing.itemIds.map((id, index) => (
                      <div key={id.toString()} className="bg-slate-700 rounded-lg p-2">
                        <img
                          src={itemsInfo[id.toString()]?.image}
                          alt={itemsInfo[id.toString()]?.name}
                          className="w-full aspect-square rounded-lg mb-1"
                        />
                        <div className="text-white text-sm truncate">{itemsInfo[id.toString()]?.name}</div>
                        <div className="text-slate-400 text-xs">x{listing.itemAmounts[index].toString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeOffers.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-400">
                  From: {activeOffers[currentOfferIndex].owner.slice(0, 6)}...{activeOffers[currentOfferIndex].owner.slice(-4)}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-400">
                    {currentOfferIndex + 1} of {activeOffers.length}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={previousOffer}
                      disabled={currentOfferIndex === 0}
                      className={`p-1 rounded ${
                        currentOfferIndex === 0 
                          ? 'text-slate-600' 
                          : 'text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextOffer}
                      disabled={currentOfferIndex === activeOffers.length - 1}
                      className={`p-1 rounded ${
                        currentOfferIndex === activeOffers.length - 1 
                          ? 'text-slate-600' 
                          : 'text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  {address === listing.owner ? (
                    <button
                      onClick={() => onAcceptOffer(activeOffers[currentOfferIndex].offerId)}
                      className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg"
                    >
                      Accept Offer
                    </button>
                  ) : activeOffers[currentOfferIndex].owner === address && (
                    <button
                      onClick={() => onCancelOffer(activeOffers[currentOfferIndex].offerId)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg"
                    >
                      Cancel Offer
                    </button>
                  )}
                </div>
              </div>

              {activeOffers[currentOfferIndex].usdcAmount > 0n && (
                <div className="flex items-center gap-3 bg-slate-700 p-3 rounded-lg">
                  <img
                    src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
                    alt="USDC"
                    className="w-10 h-10 rounded-lg"
                  />
                  <div className="text-lg font-medium text-white">
                    ${(Number(activeOffers[currentOfferIndex].usdcAmount) / 1e6).toFixed(2)}
                  </div>
                </div>
              )}

              {activeOffers[currentOfferIndex].tokiemonIds.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Tokiemon</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {activeOffers[currentOfferIndex].tokiemonIds.map((id) => {
                      const tokiemon = tokiemonInfo[id.toString()];
                      return (
                        <div key={id.toString()} className="bg-slate-700 rounded-lg p-3">
                          <div className="flex gap-4">
                            <img
                              src={tokiemon?.image}
                              alt={tokiemon?.name || `Tokiemon #${id}`}
                              className="w-24 h-24 rounded-lg"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">{tokiemon?.name || `#${id}`}</span>
                                <span className="text-slate-400 text-sm">#{tokiemon?.tokenId || id.toString()}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <div className="text-slate-400">Community: <span className="text-white">{tokiemon?.attributes?.find(a => a.trait_type === 'Community')?.value || '-'}</span></div>
                                <div className="text-slate-400">Tier: <span className="text-white">{tokiemon?.attributes?.find(a => a.trait_type === 'Purchase Tier')?.value || '-'}</span></div>
                                <div className="text-slate-400">Rarity: 
                                  <span className={`ml-1 ${
                                    tokiemon?.attributes?.find(a => a.trait_type === 'Rarity')?.value === 'Rare' ? 'text-yellow-500' :
                                    tokiemon?.attributes?.find(a => a.trait_type === 'Rarity')?.value === 'Uncommon' ? 'text-blue-500' :
                                    'text-white'
                                  }`}>
                                    {tokiemon?.attributes?.find(a => a.trait_type === 'Rarity')?.value || '-'}
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                                <div className="text-slate-400">ATK: <span className="text-white">{tokiemon?.attributes?.find(a => a.trait_type === 'Attack')?.value || '-'}</span></div>
                                <div className="text-slate-400">DEF: <span className="text-white">{tokiemon?.attributes?.find(a => a.trait_type === 'Defense')?.value || '-'}</span></div>
                                <div className="text-slate-400">MAG: <span className="text-white">{tokiemon?.attributes?.find(a => a.trait_type === 'Magic')?.value || '-'}</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeOffers[currentOfferIndex].itemIds.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Items</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {activeOffers[currentOfferIndex].itemIds.map((id, index) => (
                      <div key={id.toString()} className="bg-slate-700 rounded-lg p-2">
                        <img
                          src={itemsInfo[id.toString()]?.image}
                          alt={itemsInfo[id.toString()]?.name}
                          className="w-full aspect-square rounded-lg mb-1"
                        />
                        <div className="text-white text-sm truncate">{itemsInfo[id.toString()]?.name}</div>
                        <div className="text-slate-400 text-xs">x{activeOffers[currentOfferIndex].itemAmounts[index].toString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              No offers yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 