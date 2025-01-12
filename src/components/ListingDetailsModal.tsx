import { X, Plus, ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { useAccount, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { Listing, ItemInfo } from "./BlackMarketContent";
import { useState, useEffect } from "react";
import { Toast } from "./ui/Toast";
import { useUsername } from "../hooks/useUsername";
import { useTokiemonDetails, TokiemonDetails } from "../hooks/useTokiemonDetails";

interface TokiemonAttribute {
  trait_type: string;
  value?: string;
}

interface ListingDetailsModalProps {
  listing: Listing;
  listingId: bigint;
  itemsInfo: Record<string, ItemInfo>;
  onClose: () => void;
  onMakeOffer: () => void;
  onAcceptOffer: (counterOfferId: bigint) => Promise<`0x${string}`>;
  onCancelListing: () => Promise<`0x${string}`>;
  onCancelOffer: (counterOfferId: bigint) => Promise<`0x${string}`>;
  tokiemonInfo: Record<string, TokiemonDetails>;
  refetchOffers?: () => void;
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
  tokiemonInfo,
  refetchOffers,
}: ListingDetailsModalProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [view, setView] = useState<"listing" | "offers">("listing");
  const activeOffers = listing.counterOffers.filter((offer) => offer.isActive);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isAcceptingOffer, setIsAcceptingOffer] = useState(false);
  const [isCancelingOffer, setIsCancelingOffer] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isCancelingListing, setIsCancelingListing] = useState(false);

  const tokiemonDetailsMap = Object.fromEntries(
    [...new Set([...listing.tokiemonIds, ...activeOffers.flatMap((o) => o.tokiemonIds)])].map((id) => {
      const { data: details } = useTokiemonDetails(id, chainId);
      return [id.toString(), details];
    })
  );

  const getRarityScore = (rarity: string | undefined) => {
    switch (rarity) {
      case "Legendary":
        return 5;
      case "Epic":
        return 4;
      case "Rare":
        return 3;
      case "Uncommon":
        return 2;
      case "Common":
        return 1;
      default:
        return 0;
    }
  };

  const sortTokiemon = (ids: bigint[]) => {
    return [...ids].sort((a, b) => {
      const tokiemonA = tokiemonInfo[a.toString()];
      const tokiemonB = tokiemonInfo[b.toString()];
      const rarityA = tokiemonA?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value;
      const rarityB = tokiemonB?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value;
      return getRarityScore(rarityB) - getRarityScore(rarityA);
    });
  };

  const ownerUsername = useUsername(listing.owner);
  const offerOwnerUsername = useUsername(activeOffers[currentOfferIndex]?.owner);

  const { isLoading: isWaitingForTx, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      setShowSuccessToast(true);
      setIsAcceptingOffer(false);
      setIsCancelingOffer(false);
      refetchOffers?.();
      setTimeout(() => {
        onClose();
        setShowSuccessToast(false);
        setTxHash(undefined);
      }, 4000);
    }
  }, [isSuccess, onClose, refetchOffers]);

  const handleAcceptOfferClick = async (offerId: bigint) => {
    try {
      setIsAcceptingOffer(true);
      const hash = await onAcceptOffer(offerId);
      setTxHash(hash);
      setSuccessMessage("Offer accepted successfully!");
    } catch (error) {
      console.error("Failed to accept offer:", error);
      setIsAcceptingOffer(false);
      setShowSuccessToast(true);
      setSuccessMessage("Failed to accept offer. Please try again.");
      setTimeout(() => setShowSuccessToast(false), 4000);
    }
  };

  const handleCancelOfferClick = async (offerId: bigint) => {
    try {
      setIsCancelingOffer(true);
      const hash = await onCancelOffer(offerId);
      setTxHash(hash);
      setSuccessMessage("Offer cancelled successfully!");
    } catch (error) {
      console.error("Failed to cancel offer:", error);
      setIsCancelingOffer(false);
      setShowSuccessToast(true);
      setSuccessMessage("Failed to cancel offer. Please try again.");
      setTimeout(() => setShowSuccessToast(false), 4000);
    }
  };

  const nextOffer = () => {
    setCurrentOfferIndex((prev) => (prev === activeOffers.length - 1 ? prev : prev + 1));
  };

  const previousOffer = () => {
    setCurrentOfferIndex((prev) => (prev === 0 ? prev : prev - 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{listing.name}</h2>
                <p className="text-slate-400 text-sm">
                  Listing #{listingId.toString()} •{" "}
                  {ownerUsername || `${listing.owner.slice(0, 6)}...${listing.owner.slice(-4)}`}
                </p>
                {listing.note && (
                  <p className="text-slate-300 text-sm mt-2">{listing.note}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {address === listing.owner && (
                  <button
                    onClick={async () => {
                      try {
                        setIsCancelingListing(true);
                        const hash = await onCancelListing();
                        setTxHash(hash);
                        setSuccessMessage("Listing cancelled successfully!");
                      } catch (error) {
                        console.error("Failed to cancel listing:", error);
                        setIsCancelingListing(false);
                        setShowSuccessToast(true);
                        setSuccessMessage("Failed to cancel listing. Please try again.");
                        setTimeout(() => setShowSuccessToast(false), 4000);
                      }
                    }}
                    disabled={isCancelingListing || isWaitingForTx || isSuccess}
                    className="flex items-center gap-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSuccess ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                        Success!
                      </>
                    ) : isCancelingListing || isWaitingForTx ? (
                      <>
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        {isWaitingForTx ? "Confirming..." : "Cancel"}
                      </>
                    ) : (
                      "Cancel"
                    )}
                  </button>
                )}
                {address !== listing.owner && (
                  <button
                    onClick={onMakeOffer}
                    className="flex items-center gap-1 px-2 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm rounded-lg transition-colors duration-200 font-medium whitespace-nowrap"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    Make Offer
                  </button>
                )}
                <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setView("listing")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  view === "listing" ? "bg-slate-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                }`}
              >
                Listing
              </button>
              <button
                onClick={() => setView("offers")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  view === "offers" ? "bg-slate-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                }`}
              >
                Offers ({activeOffers.length})
              </button>
            </div>

            {view === "listing" ? (
              <div className="space-y-4">
                {listing.usdcAmount > 0n && (
                  <div className="flex items-center gap-3 bg-slate-700 p-3 rounded-lg">
                    <img
                      src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
                      alt="USDC"
                      className="w-10 h-10 rounded-lg"
                    />
                    <div className="text-lg font-medium text-white">
                      ${(Number(listing.usdcAmount) / 1e6).toFixed(2)}
                    </div>
                  </div>
                )}

                {listing.tokiemonIds.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Tokiemon</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {sortTokiemon(listing.tokiemonIds).map((id) => {
                        const tokiemonDetails = tokiemonDetailsMap[id.toString()];
                        return (
                          <div key={id.toString()} className="bg-slate-700 rounded-lg p-3">
                            <div className="flex gap-4">
                              <img
                                src={tokiemonDetails?.image}
                                alt={tokiemonDetails?.name || `Tokiemon #${id}`}
                                className="w-24 h-24 rounded-lg"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-white font-medium">{tokiemonDetails?.name || `#${id}`}</span>
                                  <span className="text-slate-400 text-sm">
                                    #{tokiemonDetails?.tokenId || id.toString()}
                                  </span>
                                </div>
                                <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2 text-sm mb-2">
                                  <span className="text-white flex items-center gap-1">
                                    <img
                                      src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/${
                                        tokiemonDetails?.attributes?.find(
                                          (a: TokiemonAttribute) => a.trait_type === "Community"
                                        )?.value || "USDC"
                                      }.png`}
                                      alt=""
                                      className="w-4 h-4 rounded-full"
                                    />
                                    {tokiemonDetails?.attributes?.find(
                                      (a: TokiemonAttribute) => a.trait_type === "Community"
                                    )?.value || "-"}
                                  </span>
                                  <span className="text-white">
                                    {tokiemonDetails?.attributes?.find(
                                      (a: TokiemonAttribute) => a.trait_type === "Purchase Tier"
                                    )?.value || "-"}
                                  </span>
                                  <span
                                    className={`${
                                      tokiemonDetails?.attributes?.find(
                                        (a: TokiemonAttribute) => a.trait_type === "Rarity"
                                      )?.value === "Legendary"
                                        ? "text-blue-400 font-bold animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,1)] scale-110"
                                        : tokiemonDetails?.attributes?.find(
                                            (a: TokiemonAttribute) => a.trait_type === "Rarity"
                                          )?.value === "Epic"
                                        ? "text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                                        : tokiemonDetails?.attributes?.find(
                                            (a: TokiemonAttribute) => a.trait_type === "Rarity"
                                          )?.value === "Rare"
                                        ? "text-red-400 font-semibold drop-shadow-[0_0_6px_rgba(248,113,113,0.7)]"
                                        : tokiemonDetails?.attributes?.find(
                                            (a: TokiemonAttribute) => a.trait_type === "Rarity"
                                          )?.value === "Uncommon"
                                        ? "text-green-400 drop-shadow-[0_0_4px_rgba(74,222,128,0.6)]"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    {tokiemonDetails?.attributes?.find(
                                      (a: TokiemonAttribute) => a.trait_type === "Rarity"
                                    )?.value || "-"}
                                  </span>
                                </div>

                                <div className="sm:hidden flex flex-col gap-1 mb-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Community:</span>
                                    <span className="text-white flex items-center gap-1">
                                      <img
                                        src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/${
                                          tokiemonDetails?.attributes?.find(
                                            (a: TokiemonAttribute) => a.trait_type === "Community"
                                          )?.value || "USDC"
                                        }.png`}
                                        alt=""
                                        className="w-4 h-4 rounded-full"
                                      />
                                      {tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Community")?.value || "-"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Tier:</span>
                                    <span className="text-white">{tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Purchase Tier")?.value || "-"}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Rarity:</span>
                                    <span className={`${
                                      tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value === "Legendary"
                                        ? "text-blue-400 font-bold animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,1)] scale-110"
                                        : tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value === "Epic"
                                        ? "text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                                        : tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value === "Rare"
                                        ? "text-red-400 font-semibold drop-shadow-[0_0_6px_rgba(248,113,113,0.7)]"
                                        : tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value === "Uncommon"
                                        ? "text-green-400 drop-shadow-[0_0_4px_rgba(74,222,128,0.6)]"
                                        : "text-gray-300"}`}
                                    >
                                      {tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value || "-"}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div className="text-slate-400 flex items-center">
                                    ATK: <span className="text-white ml-1">{tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Attack")?.value || "-"}</span>
                                  </div>
                                  <div className="text-slate-400 flex items-center">
                                    DEF: <span className="text-white ml-1">{tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Defense")?.value || "-"}</span>
                                  </div>
                                  <div className="text-slate-400 flex items-center">
                                    MAG: <span className="text-white ml-1">{tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Magic")?.value || "-"}</span>
                                  </div>
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
                        <div key={id.toString()} className="bg-slate-700 rounded-lg p-2 relative">
                          <div className="absolute top-3 left-3 bg-black bg-opacity-75 rounded-full w-5 h-5 flex items-center justify-center text-xs text-white">
                            {listing.itemAmounts[index].toString()}
                          </div>
                          <img
                            src={itemsInfo[id.toString()]?.image}
                            alt={itemsInfo[id.toString()]?.name}
                            className="w-full aspect-square rounded-lg mb-1"
                          />
                          <div className="text-white text-xs truncate">{itemsInfo[id.toString()]?.name}</div>
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
                    From:{" "}
                    {offerOwnerUsername ||
                      `${activeOffers[currentOfferIndex].owner.slice(0, 6)}...${activeOffers[
                        currentOfferIndex
                      ].owner.slice(-4)}`}
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
                          currentOfferIndex === 0 ? "text-slate-600" : "text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextOffer}
                        disabled={currentOfferIndex === activeOffers.length - 1}
                        className={`p-1 rounded ${
                          currentOfferIndex === activeOffers.length - 1
                            ? "text-slate-600"
                            : "text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    {address === listing.owner ? (
                      <button
                        onClick={() => handleAcceptOfferClick(activeOffers[currentOfferIndex].offerId)}
                        disabled={isAcceptingOffer || isWaitingForTx || isSuccess}
                        className="px-2 py-1 bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm rounded-lg flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isSuccess ? (
                          <>
                            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            Success!
                          </>
                        ) : isAcceptingOffer || isWaitingForTx ? (
                          <>
                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                            {isWaitingForTx ? "Confirming..." : "Accept"}
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            Accept
                          </>
                        )}
                      </button>
                    ) : (
                      activeOffers[currentOfferIndex].owner === address && (
                        <button
                          onClick={() => handleCancelOfferClick(activeOffers[currentOfferIndex].offerId)}
                          disabled={isCancelingOffer || isWaitingForTx || isSuccess}
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm rounded-lg flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isSuccess ? (
                            <>
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                              Success!
                            </>
                          ) : isCancelingOffer || isWaitingForTx ? (
                            <>
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              {isWaitingForTx ? "Confirming..." : "Cancel"}
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              Cancel
                            </>
                          )}
                        </button>
                      )
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
                      {sortTokiemon(activeOffers[currentOfferIndex].tokiemonIds).map((id) => {
                        const tokiemonDetails = tokiemonDetailsMap[id.toString()];
                        return (
                          <div key={id.toString()} className="bg-slate-700 rounded-lg p-3">
                            <div className="flex gap-4">
                              <img
                                src={tokiemonDetails?.image}
                                alt={tokiemonDetails?.name || `Tokiemon #${id}`}
                                className="w-24 h-24 rounded-lg"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-white font-medium">{tokiemonDetails?.name || `#${id}`}</span>
                                  <span className="text-slate-400 text-sm">
                                    #{tokiemonDetails?.tokenId || id.toString()}
                                  </span>
                                </div>
                                <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2 text-sm mb-2">
                                  <span className="text-white flex items-center gap-1">
                                    <img
                                      src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/${
                                        tokiemonDetails?.attributes?.find(
                                          (a: TokiemonAttribute) => a.trait_type === "Community"
                                        )?.value || "USDC"
                                      }.png`}
                                      alt=""
                                      className="w-4 h-4 rounded-full"
                                    />
                                    {tokiemonDetails?.attributes?.find(
                                      (a: TokiemonAttribute) => a.trait_type === "Community"
                                    )?.value || "-"}
                                  </span>
                                  <span className="text-white">
                                    {tokiemonDetails?.attributes?.find(
                                      (a: TokiemonAttribute) => a.trait_type === "Purchase Tier"
                                    )?.value || "-"}
                                  </span>
                                  <span
                                    className={`${
                                      tokiemonDetails?.attributes?.find(
                                        (a: TokiemonAttribute) => a.trait_type === "Rarity"
                                      )?.value === "Legendary"
                                        ? "text-blue-400 font-bold animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,1)] scale-110"
                                        : tokiemonDetails?.attributes?.find(
                                            (a: TokiemonAttribute) => a.trait_type === "Rarity"
                                          )?.value === "Epic"
                                        ? "text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                                        : tokiemonDetails?.attributes?.find(
                                            (a: TokiemonAttribute) => a.trait_type === "Rarity"
                                          )?.value === "Rare"
                                        ? "text-red-400 font-semibold drop-shadow-[0_0_6px_rgba(248,113,113,0.7)]"
                                        : tokiemonDetails?.attributes?.find(
                                            (a: TokiemonAttribute) => a.trait_type === "Rarity"
                                          )?.value === "Uncommon"
                                        ? "text-green-400 drop-shadow-[0_0_4px_rgba(74,222,128,0.6)]"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    {tokiemonDetails?.attributes?.find(
                                      (a: TokiemonAttribute) => a.trait_type === "Rarity"
                                    )?.value || "-"}
                                  </span>
                                </div>

                                <div className="sm:hidden flex flex-col gap-1 mb-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Community:</span>
                                    <span className="text-white flex items-center gap-1">
                                      <img
                                        src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/${
                                          tokiemonDetails?.attributes?.find(
                                            (a: TokiemonAttribute) => a.trait_type === "Community"
                                          )?.value || "USDC"
                                        }.png`}
                                        alt=""
                                        className="w-4 h-4 rounded-full"
                                      />
                                      {tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Community")?.value || "-"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Tier:</span>
                                    <span className="text-white">{tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Purchase Tier")?.value || "-"}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Rarity:</span>
                                    <span className={`${
                                      tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value === "Legendary"
                                        ? "text-blue-400 font-bold animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,1)] scale-110"
                                        : tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value === "Epic"
                                        ? "text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                                        : tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value === "Rare"
                                        ? "text-red-400 font-semibold drop-shadow-[0_0_6px_rgba(248,113,113,0.7)]"
                                        : tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value === "Uncommon"
                                        ? "text-green-400 drop-shadow-[0_0_4px_rgba(74,222,128,0.6)]"
                                        : "text-gray-300"}`}
                                    >
                                      {tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Rarity")?.value || "-"}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div className="text-slate-400 flex items-center">
                                    ATK: <span className="text-white ml-1">{tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Attack")?.value || "-"}</span>
                                  </div>
                                  <div className="text-slate-400 flex items-center">
                                    DEF: <span className="text-white ml-1">{tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Defense")?.value || "-"}</span>
                                  </div>
                                  <div className="text-slate-400 flex items-center">
                                    MAG: <span className="text-white ml-1">{tokiemonDetails?.attributes?.find((a: TokiemonAttribute) => a.trait_type === "Magic")?.value || "-"}</span>
                                  </div>
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
                        <div key={id.toString()} className="bg-slate-700 rounded-lg p-2 relative">
                          <div className="absolute top-3 left-3 bg-black bg-opacity-75 rounded-full w-5 h-5 flex items-center justify-center text-xs text-white">
                            {activeOffers[currentOfferIndex].itemAmounts[index].toString()}
                          </div>
                          <img
                            src={itemsInfo[id.toString()]?.image}
                            alt={itemsInfo[id.toString()]?.name}
                            className="w-full aspect-square rounded-lg mb-1"
                          />
                          <div className="text-white text-xs truncate">{itemsInfo[id.toString()]?.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">No offers yet</div>
            )}
          </div>
        </div>
      </div>
      {showSuccessToast && (
        <Toast message={successMessage} onClose={() => setShowSuccessToast(false)} duration={5000} />
      )}
    </div>
  );
}
