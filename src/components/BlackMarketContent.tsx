import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Wallet, Plus, ChevronRight, AlertCircle } from "lucide-react";
import { BLACK_MARKET_CONTRACTS } from "../config/contracts";
import { BLACK_MARKET_ABI } from "../config/abis";
import { CreateListingModal } from "./CreateListingModal";
import { CreateCounterOfferModal } from "./CreateCounterOfferModal";
import { ListingDetailsModal } from "./ListingDetailsModal";
import { useUsername, useUsernames } from "../hooks/useUsername";
import { WalletConnect } from "./WalletConnect";

export interface CounterOffer {
  offerId: bigint;
  owner: string;
  tokiemonIds: bigint[];
  itemIds: bigint[];
  itemAmounts: bigint[];
  usdcAmount: bigint;
  isActive: boolean;
}

export interface Listing {
  name: string;
  owner: string;
  tokiemonIds: bigint[];
  itemIds: bigint[];
  itemAmounts: bigint[];
  usdcAmount: bigint;
  isActive: boolean;
  counterOffers: CounterOffer[];
  counterOfferIds: bigint[];
}

export interface ItemInfo {
  id: string;
  name: string;
  image: string;
  rarity: string;
  type: string;
}

export interface TokiemonInfo {
  tokenId: string;
  name: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export function BlackMarketContent() {
  const { address } = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const chainId = useChainId();
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [selectedListingForDetails, setSelectedListingForDetails] = useState<bigint | null>(null);
  const [itemsInfo, setItemsInfo] = useState<Record<string, ItemInfo>>({});
  const [tokiemonInfo, setTokiemonInfo] = useState<Record<string, TokiemonInfo>>({});
  const [activeTab, setActiveTab] = useState<"open" | "your-listings" | "your-offers">("open");

  const { data: activeListings, refetch: refetchActiveListings } = useReadContract({
    address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
    abi: BLACK_MARKET_ABI,
    functionName: "getActiveListings",
  }) as { data: bigint[] | undefined, refetch: () => void };

  const { data: listingsWithOffers, refetch: refetchListingsWithOffers } = useReadContract({
    address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
    abi: BLACK_MARKET_ABI,
    functionName: "getBulkListingsWithOffers",
    args: activeListings ? [activeListings] : undefined,
    query: {
      enabled: Boolean(activeListings?.length),
    },
  }) as { data: Listing[] | undefined, refetch: () => void };

  const ownerUsernames = useUsernames(
    listingsWithOffers && Array.isArray(listingsWithOffers) ? listingsWithOffers.map((listing) => listing.owner) : []
  );

  const { writeContract } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      const refetchData = async () => {
        await refetchActiveListings();
        await refetchListingsWithOffers();
      };

      refetchData();
    }
  }, [isSuccess, chainId, activeListings, refetchActiveListings, refetchListingsWithOffers]);

  const handleCancelListing = async (listingId: bigint) => {
    console.log("Cancelling listing:", listingId.toString());
    try {
      const hash = await writeContract({
        address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
        abi: BLACK_MARKET_ABI,
        functionName: "cancelListing",
        args: [listingId],
      });
      setTxHash(hash);
    } catch (error) {
      console.error("Failed to cancel listing:", error);
    }
  };

  const handleAcceptCounterOffer = async (listingId: bigint, counterOfferId: bigint) => {
    console.log("Accept offer button clicked with:", {
      listingId: listingId?.toString() || "undefined",
      counterOfferId: counterOfferId?.toString() || "undefined",
      isListingIdValid: Boolean(listingId),
      isCounterOfferIdValid: Boolean(counterOfferId),
      listingIdType: typeof listingId,
      counterOfferIdType: typeof counterOfferId,
      rawCounterOfferId: counterOfferId,
    });

    try {
      const hash = await writeContract({
        address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
        abi: BLACK_MARKET_ABI,
        functionName: "acceptCounterOffer",
        args: [listingId, counterOfferId],
      });
      setTxHash(hash);
    } catch (error) {
      console.error("Failed to accept counter offer:", error);
    }
  };

  const handleCancelOffer = async (counterOfferId: bigint) => {
    console.log("Cancelling offer:", counterOfferId.toString());
    try {
      const hash = await writeContract({
        address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
        abi: BLACK_MARKET_ABI,
        functionName: "cancelCounterOffer",
        args: [counterOfferId],
      });
      setTxHash(hash);
    } catch (error) {
      console.error("Failed to cancel offer:", error);
    }
  };

  useEffect(() => {
    const fetchItemsInfo = async () => {
      try {
        const response = await fetch("https://api.tokiemon.io/items/all");
        if (!response.ok) throw new Error("Failed to fetch items");
        const data = await response.json();
        const info = Object.fromEntries(data.map((item: ItemInfo) => [item.id, item]));
        setItemsInfo(info);
      } catch (err) {
        console.error("Failed to load items:", err);
      }
    };
    fetchItemsInfo();
  }, []);

  useEffect(() => {
    const fetchTokiemonMetadata = async () => {
      if (!listingsWithOffers) return;

      const tokiemonIds = new Set<string>();
      listingsWithOffers.forEach((listing: Listing) => {
        listing.tokiemonIds.forEach((id) => tokiemonIds.add(id.toString()));
        listing.counterOffers.forEach((offer) => {
          offer.tokiemonIds.forEach((id) => tokiemonIds.add(id.toString()));
        });
      });

      if (tokiemonIds.size === 0) return;

      try {
        const response = await fetch(
          `https://api.tokiemon.io/tokiemon?ids=${Array.from(tokiemonIds).join(",")}&chainId=${chainId}`
        );
        if (!response.ok) throw new Error("Failed to fetch Tokiemon metadata");

        const metadata = await response.json();
        const info = Object.fromEntries(metadata.map((tokiemon: TokiemonInfo) => [tokiemon.tokenId, tokiemon]));
        setTokiemonInfo(info);
      } catch (err) {
        console.error("Failed to load Tokiemon metadata:", err);
      }
    };

    fetchTokiemonMetadata();
  }, [listingsWithOffers, chainId]);

  const refetchListings = () => {
    refetchActiveListings?.();
    refetchListingsWithOffers?.();
  };

  const sortedListings = listingsWithOffers && activeListings
    ? [...Array(listingsWithOffers.length).keys()]
        .map((i) => ({ listing: listingsWithOffers[i], id: activeListings[i] }))
        .sort((a, b) => Number(b.id - a.id))
        .filter(({ listing }) => {
          if (activeTab === "open") {
            return listing.owner.toLowerCase() !== address?.toLowerCase();
          }
          if (activeTab === "your-listings") {
            return listing.owner.toLowerCase() === address?.toLowerCase();
          }
          // your-offers tab
          return listing.counterOffers.some(
            (offer) => offer.owner.toLowerCase() === address?.toLowerCase() && offer.isActive
          );
        })
    : [];

  if (!address) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative mb-6">
            <Wallet className="w-12 h-12 text-slate-600" />
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
          </div>
          <h2 className="text-xl font-medium text-slate-400 mb-6">Connect wallet to access the black market</h2>
          <WalletConnect />
        </div>
      </main>
    );
  }

  const selectedListing =
    selectedListingForDetails && listingsWithOffers && activeListings
      ? listingsWithOffers[activeListings.findIndex(id => id === selectedListingForDetails)]
      : null;

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Active Listings</h2>
            <div className="group relative">
              <AlertCircle className="w-5 h-5 text-yellow-500/70 hover:text-yellow-500 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                <div className="bg-slate-800 rounded p-3 shadow-lg whitespace-nowrap border border-yellow-500/20 max-w-xs">
                  <div className="text-yellow-500/90 text-sm font-medium mb-1">⚠️ Heads Up Mfers</div>
                  <ul className="text-slate-300 text-xs space-y-1">
                    <li>• all items in listings and offers are held in escrow</li>
                    <li>• equipment on Tokiemon will transfer with them</li>
                    <li>• i didnt test heavily - use with caution</li>
                    <li>• stay based, stay sexy</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <button
              onClick={() => setActiveTab("open")}
              className={`transition-colors duration-200 
                ${activeTab === "open" ? "text-white font-medium" : "text-slate-400 hover:text-slate-300"}`}
            >
              Open Listings
            </button>
            <button
              onClick={() => setActiveTab("your-listings")}
              className={`transition-colors duration-200 
                ${activeTab === "your-listings" ? "text-white font-medium" : "text-slate-400 hover:text-slate-300"}`}
            >
              Your Listings
            </button>
            <button
              onClick={() => setActiveTab("your-offers")}
              className={`transition-colors duration-200 
                ${activeTab === "your-offers" ? "text-white font-medium" : "text-slate-400 hover:text-slate-300"}`}
            >
              Listings You've Offered
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 sm:px-4 sm:py-2 bg-blue-500 hover:bg-blue-600 
            text-white rounded-lg transition-colors duration-200 font-medium text-sm sm:text-base"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Listing</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden">
        {sortedListings.length === 0 ? (
          <div className="text-slate-400 text-center py-12">
            {activeTab === "your-listings"
              ? "You don't have any active listings"
              : activeTab === "your-offers"
              ? "You haven't made any offers"
              : "No active listings found"}
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {sortedListings.map(({ listing, id }) => {
              const activeOffers = listing.counterOffers.filter((offer) => offer.isActive);
              return (
                <div
                  key={id.toString()}
                  onClick={() => setSelectedListingForDetails(id)}
                  className="p-4 hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-medium text-white">{listing.name}</div>
                          <div className="text-sm text-slate-400">#{id.toString()}</div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div>
                            Owner:{" "}
                            {ownerUsernames[listing.owner] ||
                              `${listing.owner.slice(0, 6)}...${listing.owner.slice(-4)}`}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Offers:</span>
                            <span className="text-white">{activeOffers.length}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {listing.usdcAmount > 0n && (
                        <div className="relative group">
                          <div className="relative">
                            <img
                              src="https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/USDC.png"
                              alt="USDC"
                              className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-800"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-slate-700 px-1.5 rounded text-xs text-white border border-slate-600">
                              ${(Number(listing.usdcAmount) / 1e6).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}

                      {listing.tokiemonIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                          {listing.tokiemonIds.map((id) => {
                            const tokiemon = tokiemonInfo[id.toString()];
                            return (
                              <div key={id.toString()} className="relative group">
                                <img
                                  src={
                                    tokiemon?.image ||
                                    `https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/${id}.png`
                                  }
                                  alt={tokiemon?.name || `Tokiemon #${id}`}
                                  className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-800"
                                />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                  <div className="bg-slate-800 rounded p-2 shadow-lg whitespace-nowrap border border-slate-600">
                                    <div className="text-white text-xs">{tokiemon?.name || `#${id}`}</div>
                                    {tokiemon?.attributes && (
                                      <>
                                        <div className="text-slate-400 text-xs">
                                          {tokiemon.attributes.find((attr) => attr.trait_type === "Community")?.value}
                                        </div>
                                        <div className="text-slate-400 text-xs">
                                          {
                                            tokiemon.attributes.find((attr) => attr.trait_type === "Purchase Tier")
                                              ?.value
                                          }
                                        </div>
                                        <div
                                          className={`text-xs ${
                                            tokiemon.attributes.find((attr) => attr.trait_type === "Rarity")?.value ===
                                            "Rare"
                                              ? "text-yellow-500"
                                              : tokiemon.attributes.find((attr) => attr.trait_type === "Rarity")
                                                  ?.value === "Uncommon"
                                              ? "text-blue-500"
                                              : "text-slate-400"
                                          }`}
                                        >
                                          {tokiemon.attributes.find((attr) => attr.trait_type === "Rarity")?.value}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {listing.itemIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                          {listing.itemIds.map((id, i) => {
                            const item = itemsInfo[id.toString()];
                            return (
                              <div key={id.toString()} className="relative group">
                                <div className="relative">
                                  <img
                                    src={item?.image}
                                    alt={item?.name || `Item #${id}`}
                                    className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-800"
                                  />
                                  <div className="absolute -bottom-1 -right-1 bg-slate-700 px-1.5 rounded text-xs text-white border border-slate-600">
                                    x{listing.itemAmounts[i].toString()}
                                  </div>
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                  <div className="bg-slate-800 rounded p-2 shadow-lg whitespace-nowrap border border-slate-600">
                                    <div className="text-white text-xs">{item?.name || `Item #${id}`}</div>
                                  </div>
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
            })}
          </div>
        )}
      </div>

      {showCreateModal && <CreateListingModal onClose={() => setShowCreateModal(false)} />}

      {selectedListingId !== null && listingsWithOffers && activeListings && (
        <CreateCounterOfferModal
          listingId={BigInt(selectedListingId)}
          listingName={listingsWithOffers[activeListings.findIndex((id) => id === BigInt(selectedListingId))].name}
          onClose={() => setSelectedListingId(null)}
          refetchOffers={() => refetchListings()}
        />
      )}

      {selectedListing && selectedListingForDetails && (
        <ListingDetailsModal
          listing={selectedListing}
          listingId={selectedListingForDetails}
          onClose={() => setSelectedListingForDetails(null)}
          onMakeOffer={() => {
            setSelectedListingId(Number(selectedListingForDetails));
            setSelectedListingForDetails(null);
          }}
          onAcceptOffer={(offerId) => handleAcceptCounterOffer(selectedListingForDetails, offerId)}
          onCancelListing={() => handleCancelListing(selectedListingForDetails)}
          onCancelOffer={handleCancelOffer}
          itemsInfo={itemsInfo}
          tokiemonInfo={tokiemonInfo}
        />
      )}
    </main>
  );
}
