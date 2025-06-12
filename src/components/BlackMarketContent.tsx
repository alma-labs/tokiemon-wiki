import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Wallet, Plus, ChevronRight, AlertCircle, ArrowRight } from "lucide-react";
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
  owner: `0x${string}`;
  name: string;
  note: string;
  tokiemonIds: bigint[];
  itemIds: bigint[];
  itemAmounts: bigint[];
  usdcAmount: bigint;
  isActive: boolean;
  counterOffers: CounterOffer[];
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

interface TradeDetails {
  listingId: bigint;
  listingName: string;
  listingNote: string;
  listingOwner: `0x${string}`;
  listingTokiemonIds: bigint[];
  listingItemIds: bigint[];
  listingItemAmounts: bigint[];
  listingUsdcAmount: bigint;
  acceptedOfferId: bigint;
  offerOwner: `0x${string}`;
  offerTokiemonIds: bigint[];
  offerItemIds: bigint[];
  offerItemAmounts: bigint[];
  offerUsdcAmount: bigint;
  timestamp: bigint;
}

function HistoryContent({ itemsInfo, tokiemonInfo }: { itemsInfo: Record<string, ItemInfo>; tokiemonInfo: Record<string, TokiemonInfo> }) {
  const chainId = useChainId();
  const [trades, setTrades] = useState<TradeDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const tradesPerPage = 10n;
  const [localTokiemonInfo, setLocalTokiemonInfo] = useState<Record<string, TokiemonInfo>>(tokiemonInfo);

  const { data: tradeHistory } = useReadContract({
    address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
    abi: BLACK_MARKET_ABI,
    functionName: "getTradeHistory",
    args: [BigInt(0), BigInt(5000)], // Get a large batch of trades to sort
  });

  const listingOwnerUsernames = useUsernames(trades.map(trade => trade.listingOwner));
  const offerOwnerUsernames = useUsernames(trades.map(trade => trade.offerOwner));

  useEffect(() => {
    if (tradeHistory) {
      // Sort all trades by timestamp descending
      const sortedTrades = (tradeHistory as TradeDetails[]).sort((a, b) => Number(b.timestamp - a.timestamp));
      
      // Apply pagination after sorting
      const start = currentPage * Number(tradesPerPage);
      const end = start + Number(tradesPerPage);
      setTrades(sortedTrades.slice(start, end));
      setLoading(false);

      // Collect all unique Tokiemon IDs from the visible trades
      const tokiemonIds = new Set<string>();
      sortedTrades.slice(start, end).forEach(trade => {
        trade.listingTokiemonIds.forEach(id => tokiemonIds.add(id.toString()));
        trade.offerTokiemonIds.forEach(id => tokiemonIds.add(id.toString()));
      });

      // Fetch metadata for any Tokiemon IDs we don't have yet
      const missingIds = Array.from(tokiemonIds).filter(id => !localTokiemonInfo[id]);
      if (missingIds.length > 0) {
        fetch(`https://api.tokiemon.io/tokiemon?ids=${missingIds.join(',')}&chainId=${chainId}`)
          .then(response => response.json())
          .then(metadata => {
            setLocalTokiemonInfo(prev => {
              const newInfo = { ...prev };
              metadata.forEach((tokiemon: TokiemonInfo) => {
                newInfo[tokiemon.tokenId] = tokiemon;
              });
              return newInfo;
            });
          })
          .catch(err => console.error('Failed to load Tokiemon metadata:', err));
      }
    }
  }, [tradeHistory, chainId, currentPage, tradesPerPage]);

  if (loading) {
    return (
      <div className="text-slate-400 text-center py-12">
        Loading trade history...
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-slate-700">
        {trades.map((trade) => (
          <div key={`${trade.listingId}-${trade.acceptedOfferId}`} className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-medium text-white">{trade.listingName}</div>
                  <div className="text-sm text-slate-400">#{trade.listingId.toString()}</div>
                </div>
                <div className="text-sm text-slate-400">
                  {new Date(Number(trade.timestamp) * 1000).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm text-slate-400 mb-2">Original Listing</div>
                  <div className="text-xs text-slate-500 mb-2">
                    by {listingOwnerUsernames[trade.listingOwner] || `${trade.listingOwner.slice(0, 6)}...${trade.listingOwner.slice(-4)}`}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {trade.listingUsdcAmount > 0n && (
                      <div className="relative">
                        <img
                          src="https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/USDC.png"
                          alt="USDC"
                          className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-800"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-slate-700 px-1.5 rounded text-xs text-white border border-slate-600">
                          ${(Number(trade.listingUsdcAmount) / 1e6).toFixed(2)}
                        </div>
                      </div>
                    )}
                    {trade.listingTokiemonIds.map((id) => (
                      <div key={id.toString()} className="relative group">
                        <img
                          src={localTokiemonInfo[id.toString()]?.image}
                          alt={localTokiemonInfo[id.toString()]?.name || `Tokiemon #${id}`}
                          className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-800"
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[100]">
                          <div className="bg-slate-800 rounded p-2 shadow-lg whitespace-nowrap border border-slate-600">
                            <div className="text-white text-xs">{localTokiemonInfo[id.toString()]?.name || `Tokiemon #${id}`}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {trade.listingItemIds.map((id, index) => (
                      <div key={id.toString()} className="relative group">
                        <img
                          src={itemsInfo[id.toString()]?.image}
                          alt={itemsInfo[id.toString()]?.name}
                          className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-800"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-slate-700 px-1.5 rounded text-xs text-white border border-slate-600">
                          x{trade.listingItemAmounts[index].toString()}
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[100]">
                          <div className="bg-slate-800 rounded p-2 shadow-lg whitespace-nowrap border border-slate-600">
                            <div className="text-white text-xs">{itemsInfo[id.toString()]?.name}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0" />

                <div className="flex-1">
                  <div className="text-sm text-slate-400 mb-2">Accepted Offer</div>
                  <div className="text-xs text-slate-500 mb-2">
                    by {offerOwnerUsernames[trade.offerOwner] || `${trade.offerOwner.slice(0, 6)}...${trade.offerOwner.slice(-4)}`}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {trade.offerUsdcAmount > 0n && (
                      <div className="relative">
                        <img
                          src="https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/USDC.png"
                          alt="USDC"
                          className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-800"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-slate-700 px-1.5 rounded text-xs text-white border border-slate-600">
                          ${(Number(trade.offerUsdcAmount) / 1e6).toFixed(2)}
                        </div>
                      </div>
                    )}
                    {trade.offerTokiemonIds.map((id) => (
                      <div key={id.toString()} className="relative group">
                        <img
                          src={localTokiemonInfo[id.toString()]?.image}
                          alt={localTokiemonInfo[id.toString()]?.name || `Tokiemon #${id}`}
                          className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-800"
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[100]">
                          <div className="bg-slate-800 rounded p-2 shadow-lg whitespace-nowrap border border-slate-600">
                            <div className="text-white text-xs">{localTokiemonInfo[id.toString()]?.name || `Tokiemon #${id}`}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {trade.offerItemIds.map((id, index) => (
                      <div key={id.toString()} className="relative group">
                        <img
                          src={itemsInfo[id.toString()]?.image}
                          alt={itemsInfo[id.toString()]?.name}
                          className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-800"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-slate-700 px-1.5 rounded text-xs text-white border border-slate-600">
                          x{trade.offerItemAmounts[index].toString()}
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[100]">
                          <div className="bg-slate-800 rounded p-2 shadow-lg whitespace-nowrap border border-slate-600">
                            <div className="text-white text-xs">{itemsInfo[id.toString()]?.name}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center p-4 border-t border-slate-700">
        <button
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
          className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Previous
        </button>
        <div className="text-sm text-slate-400">
          Page {currentPage + 1}
        </div>
        <button
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={trades.length < Number(tradesPerPage)}
          className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function BlackMarketContent() {
  const { address } = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const chainId = useChainId();
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [selectedListingForDetails, setSelectedListingForDetails] = useState<bigint | null>(null);
  const [itemsInfo, setItemsInfo] = useState<Record<string, ItemInfo>>({});
  const [tokiemonInfo, setTokiemonInfo] = useState<Record<string, TokiemonInfo>>({});
  const [activeTab, setActiveTab] = useState<"all" | "open" | "your-listings" | "your-offers" | "history">("all");

  const { data: activeListings, refetch: refetchActiveListings } = useReadContract({
    address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
    abi: BLACK_MARKET_ABI,
    functionName: "getActiveListings",
  });

  const { data: listingsWithOffers, refetch: refetchListingsWithOffers } = useReadContract({
    address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
    abi: BLACK_MARKET_ABI,
    functionName: "getBulkListingsWithOffers",
    args: activeListings ? [activeListings] : undefined,
    query: {
      enabled: Boolean(activeListings?.length),
    },
  });

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
        const { refetch: refetchActive } = useReadContract({
          address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
          abi: BLACK_MARKET_ABI,
          functionName: "getActiveListings",
        });

        const { refetch: refetchWithOffers } = useReadContract({
          address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
          abi: BLACK_MARKET_ABI,
          functionName: "getBulkListingsWithOffers",
          args: activeListings ? [activeListings] : undefined,
          query: {
            enabled: Boolean(activeListings?.length),
          },
        });

        await refetchActive();
        await refetchWithOffers();
      };

      refetchData();
    }
  }, [isSuccess, chainId, activeListings]);

  const handleCancelListing = async (listingId: bigint) => {
    console.log("Cancelling listing:", listingId.toString());
    try {
      writeContract({
        address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
        abi: BLACK_MARKET_ABI,
        functionName: "cancelListing",
        args: [listingId],
      });
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
      writeContract({
        address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
        abi: BLACK_MARKET_ABI,
        functionName: "acceptCounterOffer",
        args: [listingId, counterOfferId],
      });
    } catch (error) {
      console.error("Failed to accept counter offer:", error);
    }
  };

  const handleCancelOffer = async (counterOfferId: bigint) => {
    console.log("Cancelling offer:", counterOfferId.toString());
    try {
      writeContract({
        address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
        abi: BLACK_MARKET_ABI,
        functionName: "cancelCounterOffer",
        args: [counterOfferId],
      });
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
      listingsWithOffers.forEach((listing) => {
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

  const sortedListings = listingsWithOffers
    ? [...Array(listingsWithOffers.length).keys()]
        .map((i) => ({ listing: listingsWithOffers[i], id: activeListings![i] }))
        .sort((a, b) => Number(b.id - a.id))
        .filter(({ listing }) => {
          if (activeTab === "all") {
            return true;
          }
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
      ? listingsWithOffers[activeListings.indexOf(selectedListingForDetails)]
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
              onClick={() => setActiveTab("all")}
              className={`transition-colors duration-200 
                ${activeTab === "all" ? "text-white font-medium" : "text-slate-400 hover:text-slate-300"}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("open")}
              className={`transition-colors duration-200 
                ${activeTab === "open" ? "text-white font-medium" : "text-slate-400 hover:text-slate-300"}`}
            >
              Open
            </button>
            <button
              onClick={() => setActiveTab("your-listings")}
              className={`transition-colors duration-200 
                ${activeTab === "your-listings" ? "text-white font-medium" : "text-slate-400 hover:text-slate-300"}`}
            >
              Yours
            </button>
            <button
              onClick={() => setActiveTab("your-offers")}
              className={`transition-colors duration-200 
                ${activeTab === "your-offers" ? "text-white font-medium" : "text-slate-400 hover:text-slate-300"}`}
            >
              Offers
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`transition-colors duration-200 
                ${activeTab === "history" ? "text-white font-medium" : "text-slate-400 hover:text-slate-300"}`}
            >
              History
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

      <div className="bg-slate-800 rounded-lg overflow-visible">
        {activeTab === "history" ? (
          <HistoryContent itemsInfo={itemsInfo} tokiemonInfo={tokiemonInfo} />
        ) : sortedListings.length === 0 ? (
          <div className="text-slate-400 text-center py-12">
            {activeTab === "your-listings"
              ? "You don't have any active listings"
              : activeTab === "your-offers"
              ? "You haven't made any offers"
              : "No active listings found"}
          </div>
        ) : (
          <div className="divide-y divide-slate-700 overflow-visible">
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
                          {listing.note && (
                            <div className="group relative">
                              <div className="w-4 h-4 rounded-full border border-slate-500 flex items-center justify-center text-xs text-slate-400 cursor-help">i</div>
                              <div className="absolute left-0 hidden group-hover:block z-[100]" style={{
                                bottom: 'calc(100% + 0.5rem)',
                              }}>
                                <div className="bg-slate-800 rounded p-2 shadow-lg whitespace-pre-wrap border border-slate-600" style={{ width: 'max-content', maxWidth: '300px' }}>
                                  <p className="text-slate-300 text-sm">{listing.note}</p>
                                </div>
                              </div>
                            </div>
                          )}
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
