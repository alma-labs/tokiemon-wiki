import { useState, useEffect } from "react";
import { useWriteContract, useChainId, useReadContract, useAccount, useWaitForTransactionReceipt } from "wagmi";
import { X, Plus, ChevronDown, Loader2, Check } from "lucide-react";
import { BLACK_MARKET_CONTRACTS, TOKIEMON_NFT_CONTRACTS, USDC_CONTRACTS, LENS_CONTRACTS } from "../config/contracts";
import { BLACK_MARKET_ABI, TOKIEMON_NFT_ABI, ERC20_ABI, LENS_ABI } from "../config/abis";
import { useTokenPermissions } from "../hooks/useTokenPermissions";
import { useUserAssets } from "../hooks/useUserAssets";
import { formatUnits } from "viem";
import { Toast } from "./ui/Toast";

interface CreateCounterOfferModalProps {
  onClose: () => void;
  listingId: bigint;
  listingName: string;
  refetchOffers: () => void;
}

interface TokiemonInfo {
  tokenId: string;
  name: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export function CreateCounterOfferModal({ onClose, listingId, listingName, refetchOffers }: CreateCounterOfferModalProps) {
  const [selectedTokiemon, setSelectedTokiemon] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<{id: string, amount: string}[]>([]);
  const [usdcAmount, setUsdcAmount] = useState<string>("");
  const [showTokiemonDropdown, setShowTokiemonDropdown] = useState(false);
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const [ownedTokiemon, setOwnedTokiemon] = useState<TokiemonInfo[]>([]);
  const [tokiemonSearch, setTokiemonSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [formError, setFormError] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isApprovingNFT, setIsApprovingNFT] = useState(false);
  const [isApprovingUSDC, setIsApprovingUSDC] = useState(false);
  const [localNFTApproved, setLocalNFTApproved] = useState(false);
  const [localUSDCAllowance, setLocalUSDCAllowance] = useState(false);

  const { writeContract, data: hash } = useWriteContract();
  const { writeContract: approveNFT, data: nftApprovalHash } = useWriteContract();
  const { writeContract: approveUSDC, data: usdcApprovalHash } = useWriteContract();
  
  const { isLoading: isWaitingForTx, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const { isLoading: isWaitingForNFTApproval, isSuccess: nftApprovalSuccess } = useWaitForTransactionReceipt({
    hash: nftApprovalHash,
  });
  
  const { isLoading: isWaitingForUSDCApproval, isSuccess: usdcApprovalSuccess } = useWaitForTransactionReceipt({
    hash: usdcApprovalHash,
  });

  // Handle NFT approval success
  useEffect(() => {
    if (nftApprovalSuccess) {
      setIsApprovingNFT(false);
      setLocalNFTApproved(true);
    }
  }, [nftApprovalSuccess]);

  // Handle USDC approval success
  useEffect(() => {
    if (usdcApprovalSuccess) {
      setIsApprovingUSDC(false);
      setLocalUSDCAllowance(true);
    }
  }, [usdcApprovalSuccess]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setShowSuccessToast(true);
      refetchOffers();
      // Don't close modal immediately, let user see the success state
      setTimeout(onClose, 4000);
    }
  }, [isSuccess, refetchOffers, onClose]);

  const chainId = useChainId();
  const { address } = useAccount();
  const { isNFTApproved, hasUSDCAllowance } = useTokenPermissions(
    BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS]
  );
  const { ownedItems } = useUserAssets();

  // Get USDC balance
  const { data: usdcBalance = 0n } = useReadContract({
    address: USDC_CONTRACTS[chainId as keyof typeof USDC_CONTRACTS],
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
  });

  const formattedUsdcBalance = usdcBalance ? formatUnits(usdcBalance, 6) : "0";

  // Get owned Tokiemon IDs from lens contract
  const { data: userTokiemonResult } = useReadContract({
    address: LENS_CONTRACTS[chainId as keyof typeof LENS_CONTRACTS],
    abi: LENS_ABI,
    functionName: "getUserTokiemon",
    args: [address ?? "0x0000000000000000000000000000000000000000", 0n, 1000n],
  });

  // Fetch Tokiemon metadata when we have the IDs
  useEffect(() => {
    const fetchTokiemonMetadata = async () => {
      console.log("Raw data from lens contract:", userTokiemonResult);
      
      if (!userTokiemonResult || !Array.isArray(userTokiemonResult)) {
        console.log("No Tokiemon found for user or invalid format");
        return;
      }
      
      try {
        // Extract token IDs from the lens response
        const ids = userTokiemonResult.map(tokiemon => tokiemon.tokenId.toString());
        console.log("Token IDs from lens:", ids);
        
        // Fetch metadata for each ID
        const apiUrl = `https://api.tokiemon.io/tokiemon?ids=${ids.join(',')}&chainId=${chainId}`;
        console.log("Calling API URL:", apiUrl);
        
        const response = await fetch(apiUrl);
        console.log("API Response status:", response.status);
        
        if (!response.ok) {
          console.error("API Error:", response.statusText);
          throw new Error('Failed to fetch Tokiemon metadata');
        }
        
        const metadata = await response.json();
        console.log("Raw API Response:", metadata);
        
        // Match the API response with lens token IDs
        const matchedTokiemon = metadata.filter((apiTokiemon: TokiemonInfo) => 
          userTokiemonResult.some(lensTokiemon => 
            lensTokiemon.tokenId.toString() === apiTokiemon.tokenId
          )
        );
        
        setOwnedTokiemon(matchedTokiemon);
      } catch (err) {
        console.error('Failed to load Tokiemon metadata:', err);
      }
    };

    if (address && chainId) {
      console.log("Starting fetch with address:", address, "chainId:", chainId);
      fetchTokiemonMetadata();
    }
  }, [userTokiemonResult, chainId, address]);

  const handleApproveNFT = async () => {
    try {
      setIsApprovingNFT(true);
      approveNFT({
        address: TOKIEMON_NFT_CONTRACTS[chainId as keyof typeof TOKIEMON_NFT_CONTRACTS],
        abi: TOKIEMON_NFT_ABI,
        functionName: "setApprovalForAll",
        args: [BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS], true],
      });
    } catch (error) {
      console.error("Failed to approve NFT:", error);
      setIsApprovingNFT(false);
    }
  };

  const handleApproveUSDC = async () => {
    try {
      setIsApprovingUSDC(true);
      approveUSDC({
        address: USDC_CONTRACTS[chainId as keyof typeof USDC_CONTRACTS],
        abi: ERC20_ABI,
        functionName: "approve",
        args: [
          BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
          BigInt(2) ** BigInt(256) - BigInt(1),
        ],
      });
    } catch (error) {
      console.error("Failed to approve USDC:", error);
      setIsApprovingUSDC(false);
    }
  };

  const handleCreateCounterOffer = async () => {
    setFormError("");
    setIsCreating(true);

    try {
      // Validate at least one item or tokiemon
      if (selectedTokiemon.length === 0 && selectedItems.length === 0) {
        setFormError("Please select at least one Tokiemon or item");
        setIsCreating(false);
        return;
      }

      // Validate USDC amount
      if (usdcAmount) {
        const usdcAmountFloat = parseFloat(usdcAmount);
        const usdcBalanceFloat = parseFloat(formattedUsdcBalance);
        
        if (usdcAmountFloat > usdcBalanceFloat) {
          setFormError(`Insufficient USDC balance. You have ${formattedUsdcBalance} USDC`);
          setIsCreating(false);
          return;
        }
      }

      const usdcAmountBigInt = usdcAmount ? BigInt(Math.floor(parseFloat(usdcAmount) * 1e6)) : 0n;
      
      writeContract({
        address: BLACK_MARKET_CONTRACTS[chainId as keyof typeof BLACK_MARKET_CONTRACTS],
        abi: BLACK_MARKET_ABI,
        functionName: "createCounterOffer",
        args: [
          listingId,
          selectedTokiemon.map(id => BigInt(id)),
          selectedItems.map(item => BigInt(item.id)),
          selectedItems.map(item => BigInt(item.amount)),
          usdcAmountBigInt
        ],
      });
    } catch (error) {
      console.error("Failed to create counter offer:", error);
      setFormError("Failed to create counter offer. Please try again.");
      setIsCreating(false);
    }
  };

  const toggleTokiemon = (id: string) => {
    setSelectedTokiemon(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const exists = prev.find(item => item.id === id);
      if (exists) {
        return prev.filter(item => item.id !== id);
      } else {
        return [...prev, { id, amount: "1" }];
      }
    });
  };

  const updateItemAmount = (id: string, amount: string) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, amount } : item
      )
    );
  };

  // Initialize local state from contract state
  useEffect(() => {
    setLocalNFTApproved(isNFTApproved);
    setLocalUSDCAllowance(hasUSDCAllowance);
  }, [isNFTApproved, hasUSDCAllowance]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-md w-full">
        <div className="max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{listingName}</h2>
                <p className="text-slate-400 text-sm">Counter Offer for Listing #{listingId.toString()}</p>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tokiemon</label>
                {!localNFTApproved ? (
                  <button
                    onClick={handleApproveNFT}
                    disabled={isApprovingNFT || isWaitingForNFTApproval}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 
                      text-white rounded-lg transition-colors duration-200 font-medium border border-slate-600
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApprovingNFT || isWaitingForNFTApproval ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isWaitingForNFTApproval ? "Confirming..." : "Approving..."}
                      </>
                    ) : (
                      "Approve Tokiemon Usage"
                    )}
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setShowTokiemonDropdown(!showTokiemonDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-slate-700 border border-slate-600 
                        rounded-lg text-white hover:bg-slate-600 transition-colors"
                    >
                      <span>{selectedTokiemon.length ? `${selectedTokiemon.length} selected` : "Select Tokiemon"}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {showTokiemonDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg 
                        shadow-lg max-h-60 overflow-auto">
                        <div className="sticky top-0 bg-slate-700 p-2 border-b border-slate-600">
                          <input
                            type="text"
                            value={tokiemonSearch}
                            onChange={(e) => setTokiemonSearch(e.target.value)}
                            placeholder="Search Tokiemon..."
                            className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                          />
                        </div>
                        {ownedTokiemon
                          .filter(tokiemon => 
                            tokiemon.name.toLowerCase().includes(tokiemonSearch.toLowerCase())
                          )
                          .map((tokiemon) => (
                          <div
                            key={tokiemon.tokenId}
                            onClick={() => toggleTokiemon(tokiemon.tokenId)}
                            className="flex items-center gap-3 p-2 hover:bg-slate-600 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTokiemon.includes(tokiemon.tokenId)}
                              readOnly
                              className="rounded border-slate-500"
                            />
                            <img
                              src={tokiemon.image}
                              alt={tokiemon.name}
                              className="w-8 h-8 rounded"
                            />
                            <div className="flex-grow">
                              <div className="flex items-center gap-2">
                                <span className="text-white text-sm">{tokiemon.name}</span>
                                <span className="text-white text-xs flex items-center gap-1">
                                  <img 
                                    src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/tokens/${tokiemon.attributes.find(attr => attr.trait_type === 'Community')?.value || "USDC"}.png`}
                                    alt=""
                                    className="w-4 h-4 rounded-full"
                                  />
                                  {tokiemon.attributes.find(attr => attr.trait_type === 'Community')?.value}
                                </span>
                                <span className="text-white text-xs">
                                  {tokiemon.attributes.find(attr => attr.trait_type === 'Purchase Tier')?.value}
                                </span>
                                <span className={`text-xs ${
                                  tokiemon.attributes.find(attr => attr.trait_type === 'Rarity')?.value === 'Legendary'
                                    ? 'text-blue-400 font-bold animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,1)] scale-110'
                                    : tokiemon.attributes.find(attr => attr.trait_type === 'Rarity')?.value === 'Epic'
                                    ? 'text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                                    : tokiemon.attributes.find(attr => attr.trait_type === 'Rarity')?.value === 'Rare'
                                    ? 'text-red-400 font-semibold drop-shadow-[0_0_6px_rgba(248,113,113,0.7)]'
                                    : tokiemon.attributes.find(attr => attr.trait_type === 'Rarity')?.value === 'Uncommon'
                                    ? 'text-green-400 drop-shadow-[0_0_4px_rgba(74,222,128,0.6)]'
                                    : 'text-gray-300'
                                }`}>
                                  {tokiemon.attributes.find(attr => attr.trait_type === 'Rarity')?.value}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {selectedTokiemon.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTokiemon.map((id) => {
                      const tokiemon = ownedTokiemon.find(t => t.tokenId === id);
                      return (
                        <div key={id} className="flex items-center gap-2 bg-slate-700 rounded-lg p-2">
                          <img
                            src={tokiemon?.image}
                            alt={tokiemon?.name}
                            className="w-6 h-6 rounded"
                          />
                          <span className="text-white text-sm">{tokiemon?.name}</span>
                          <button
                            onClick={() => toggleTokiemon(id)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Items</label>
                <div className="relative">
                  <button
                    onClick={() => setShowItemsDropdown(!showItemsDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-700 border border-slate-600 
                      rounded-lg text-white hover:bg-slate-600 transition-colors"
                  >
                    <span>{selectedItems.length ? `${selectedItems.length} selected` : "Select Items"}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showItemsDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg 
                      shadow-lg max-h-60 overflow-auto">
                      <div className="sticky top-0 bg-slate-700 p-2 border-b border-slate-600">
                        <input
                          type="text"
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                          placeholder="Search Items..."
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        />
                      </div>
                      {ownedItems
                        .filter((item: { name: string }) => 
                          item.name.toLowerCase().includes(itemSearch.toLowerCase())
                        )
                        .map((item: { id: string, name: string, image: string, balance: { toString: () => string } }) => (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className="flex items-center gap-3 p-2 hover:bg-slate-600 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.some(i => i.id === item.id)}
                            readOnly
                            className="rounded border-slate-500"
                          />
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-8 h-8 rounded"
                          />
                          <div>
                            <div className="text-white text-sm">{item.name}</div>
                            <div className="text-slate-400 text-xs">Balance: {item.balance.toString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedItems.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {selectedItems.map(({ id, amount }) => {
                      const item = ownedItems.find(i => i.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2 bg-slate-700 rounded-lg p-2">
                          <img
                            src={item?.image}
                            alt={item?.name}
                            className="w-6 h-6 rounded"
                          />
                          <span className="text-white text-sm flex-grow">{item?.name}</span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => updateItemAmount(id, e.target.value)}
                            min="1"
                            max={item?.balance.toString()}
                            className="w-20 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                          />
                          <button
                            onClick={() => toggleItem(id)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">USDC Amount</label>
                {!localUSDCAllowance ? (
                  <button
                    onClick={handleApproveUSDC}
                    disabled={isApprovingUSDC || isWaitingForUSDCApproval}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 
                      text-white rounded-lg transition-colors duration-200 font-medium border border-slate-600
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApprovingUSDC || isWaitingForUSDCApproval ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isWaitingForUSDCApproval ? "Confirming..." : "Approving..."}
                      </>
                    ) : (
                      "Approve USDC Usage"
                    )}
                  </button>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="number"
                      value={usdcAmount}
                      onChange={(e) => setUsdcAmount(e.target.value)}
                      placeholder="100"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                        focus:ring-2 focus:ring-red-500 focus:border-transparent 
                        text-white placeholder-gray-400"
                    />
                    <div className="text-sm text-slate-400">
                      Balance: {formattedUsdcBalance} USDC
                    </div>
                  </div>
                )}
              </div>

              {formError && (
                <div className="text-red-500 text-sm">{formError}</div>
              )}

              <button
                onClick={handleCreateCounterOffer}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 
                  text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={(selectedTokiemon.length === 0 && selectedItems.length === 0) || isCreating || isWaitingForTx || isSuccess}
              >
                {isSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Success!
                  </>
                ) : (isCreating || isWaitingForTx) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isWaitingForTx ? "Confirming..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Counter Offer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showSuccessToast && (
        <Toast
          message="Counter offer submitted successfully!"
          onClose={() => setShowSuccessToast(false)}
          duration={5000}
        />
      )}
    </div>
  );
}
