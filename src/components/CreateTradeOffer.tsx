import { useAccount, useReadContract, useWriteContract, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { MARKETPLACE_CONTRACTS, ITEM_CONTRACTS, isBaseChain, WRONG_CHAIN_ERROR } from "../config/contracts";
import { MARKETPLACE_ABI, ITEM_ABI } from "../config/abis";
import { useState, useEffect } from "react";
import { Plus, X, Loader2, Search, Wallet, CheckCircle2, ExternalLink } from "lucide-react";
import { base } from "wagmi/chains";

interface ItemInfo {
  id: string;
  name: string;
  image: string;
}

interface ItemSelection {
  tokenId: string;
  amount: string;
}

interface ItemWithBalance {
  id: string;
  name: string;
  image: string;
  balance: bigint;
}

export function CreateTradeOffer({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [offerItems, setOfferItems] = useState<ItemSelection[]>([{ tokenId: "", amount: "" }]);
  const [wantItems, setWantItems] = useState<ItemSelection[]>([{ tokenId: "", amount: "" }]);
  const [itemsInfo, setItemsInfo] = useState<Record<string, ItemInfo>>({});
  const [ownedItems, setOwnedItems] = useState<ItemWithBalance[]>([]);
  const [searchOffer, setSearchOffer] = useState("");
  const [searchWant, setSearchWant] = useState("");
  const [showOfferSelector, setShowOfferSelector] = useState(false);
  const [showWantSelector, setShowWantSelector] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  // Contract write function
  const { writeContract: createOffer, isPending } = useWriteContract();

  // Transaction receipt
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  });

  // Get explorer URL
  const getExplorerLink = (hash: `0x${string}`) => {
    const baseUrl = chainId === base.id ? "https://basescan.org" : "https://sepolia.basescan.org";
    return `${baseUrl}/tx/${hash}`;
  };

  // Fetch balances
  const { data: balanceData } = useReadContract({
    address: ITEM_CONTRACTS[chainId as keyof typeof ITEM_CONTRACTS],
    abi: ITEM_ABI,
    functionName: "getItemBalances",
    args: [address as `0x${string}`],
    query: {
      enabled: Boolean(address),
    },
  });

  // Fetch item metadata
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

  // Update owned items when balance data changes
  useEffect(() => {
    if (balanceData && itemsInfo) {
      const items: ItemWithBalance[] = [];
      const [ids, balances] = balanceData as [bigint[], bigint[]];
      ids.forEach((id, index) => {
        const itemInfo = itemsInfo[id.toString()];
        if (itemInfo && balances[index] > 0n) {
          items.push({
            ...itemInfo,
            balance: balances[index],
          });
        }
      });
      setOwnedItems(items);
    }
  }, [balanceData, itemsInfo]);

  const validateOffer = () => {
    const errors: string[] = [];

    // Remove empty items before validation
    const validOfferItems = offerItems.filter((item) => item.tokenId && item.amount);
    const validWantItems = wantItems.filter((item) => item.tokenId && item.amount);

    // Check if there are any items
    if (validOfferItems.length === 0) {
      errors.push("You must offer at least one item");
      return errors;
    }
    if (validWantItems.length === 0) {
      errors.push("You must request at least one item");
      return errors;
    }

    // Check for duplicate items in offer items
    const offerDuplicates = validOfferItems.filter(
      (item, index) => validOfferItems.findIndex((i) => i.tokenId === item.tokenId) !== index
    );
    if (offerDuplicates.length > 0) {
      const duplicateNames = [
        ...new Set(offerDuplicates.map((item) => itemsInfo[item.tokenId]?.name || `Item #${item.tokenId}`)),
      ];
      errors.push(`Duplicate items in offer: ${duplicateNames.join(", ")}`);
    }

    // Check for duplicate items in want items
    const wantDuplicates = validWantItems.filter(
      (item, index) => validWantItems.findIndex((i) => i.tokenId === item.tokenId) !== index
    );
    if (wantDuplicates.length > 0) {
      const duplicateNames = [
        ...new Set(wantDuplicates.map((item) => itemsInfo[item.tokenId]?.name || `Item #${item.tokenId}`)),
      ];
      errors.push(`Duplicate items in request: ${duplicateNames.join(", ")}`);
    }

    // Validate each offer item
    validOfferItems.forEach((item) => {
      const ownedItem = ownedItems.find((i) => i.id === item.tokenId);
      const itemName = itemsInfo[item.tokenId]?.name || `Item #${item.tokenId}`;
      if (!ownedItem) {
        errors.push(`You don't own ${itemName}`);
      } else if (!item.amount || BigInt(item.amount) <= 0n) {
        errors.push(`Invalid amount for ${itemName}`);
      } else if (BigInt(item.amount) > ownedItem.balance) {
        errors.push(`Insufficient balance for ${itemName}`);
      }
    });

    // Validate each want item
    validWantItems.forEach((item) => {
      const itemName = itemsInfo[item.tokenId]?.name || `Item #${item.tokenId}`;
      if (!itemsInfo[item.tokenId]) {
        errors.push(`${itemName} does not exist`);
      } else if (!item.amount || BigInt(item.amount) <= 0n) {
        errors.push(`Invalid amount for ${itemName}`);
      }
    });

    setErrors(errors);
    return errors.length === 0;
  };

  const handleCreateOffer = () => {
    // Remove empty items
    const validOfferItems = offerItems.filter((item) => item.tokenId && item.amount);
    const validWantItems = wantItems.filter((item) => item.tokenId && item.amount);

    // Validate chain
    if (!isBaseChain(chainId)) {
      alert(WRONG_CHAIN_ERROR);
      return;
    }

    // Validate
    if (!validateOffer()) return;

    const offerTokenIds = validOfferItems.map((item) => BigInt(item.tokenId));
    const offerAmounts = validOfferItems.map((item) => BigInt(item.amount));
    const wantTokenIds = validWantItems.map((item) => BigInt(item.tokenId));
    const wantAmounts = validWantItems.map((item) => BigInt(item.amount));

    try {
      createOffer(
        {
          address: MARKETPLACE_CONTRACTS[chainId as keyof typeof MARKETPLACE_CONTRACTS],
          abi: MARKETPLACE_ABI,
          functionName: "createTradeOffer",
          args: [offerTokenIds, offerAmounts, wantTokenIds, wantAmounts],
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
          },
        }
      );
    } catch (error) {
      console.error("Failed to create offer:", error);
    }
  };

  const selectOfferItem = (item: ItemWithBalance) => {
    const newItems = [...offerItems];
    newItems[selectedIndex] = { tokenId: item.id, amount: "1" };
    setOfferItems(newItems);
    setShowOfferSelector(false);
  };

  const selectWantItem = (item: ItemInfo) => {
    const newItems = [...wantItems];
    newItems[selectedIndex] = { tokenId: item.id, amount: "1" };
    setWantItems(newItems);
    setShowWantSelector(false);
  };

  const filteredOwnedItems = ownedItems.filter(
    (item) => item.name.toLowerCase().includes(searchOffer.toLowerCase()) || item.id.includes(searchOffer)
  );

  const filteredWantItems = Object.values(itemsInfo).filter(
    (item) => item.name.toLowerCase().includes(searchWant.toLowerCase()) || item.id.includes(searchWant)
  );

  // Also update the Add Item buttons to only allow adding if current items are complete
  const canAddOfferItem = offerItems.every((item) => item.tokenId && item.amount);
  const canAddWantItem = wantItems.every((item) => item.tokenId && item.amount);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a2432] border border-[#2a3844] rounded-lg max-w-2xl w-full text-[#e2e8f0] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Create Trade Offer</h2>
            {!txHash && (
              <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Trade Offer Created!</h3>
              <a
                href={getExplorerLink(txHash!)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#1da1f2] hover:text-[#1a91da] transition-colors mb-6"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 
                  text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Close
              </button>
            </div>
          ) : isPending || isConfirming ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-[#1da1f2] mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-white mb-2">
                {isPending ? "Confirm in Wallet" : "Transaction Pending"}
              </h3>
              {txHash && (
                <a
                  href={getExplorerLink(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#1da1f2] hover:text-[#1a91da] transition-colors"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ) : (
            <>
              {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-400">
                      {error}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Offer Items */}
                <div>
                  <div className="text-xs font-medium mb-3 text-slate-400 uppercase tracking-wider">
                    You're Offering:
                  </div>
                  {offerItems.map((item, index) => (
                    <div key={index} className="mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedIndex(index);
                            setShowOfferSelector(true);
                            setShowWantSelector(false);
                          }}
                          className={`flex-1 flex items-center gap-2 px-2 py-1.5 bg-[#141c27] border 
                            ${
                              (!item.tokenId && item.amount) || (item.tokenId && !item.amount)
                                ? "border-red-500/50"
                                : "border-[#2a3844] hover:border-[#3a4854]"
                            } 
                            rounded text-sm text-white text-left transition-colors`}
                        >
                          {item.tokenId && itemsInfo[item.tokenId] ? (
                            <>
                              <img
                                src={itemsInfo[item.tokenId].image}
                                alt={itemsInfo[item.tokenId].name}
                                className="w-5 h-5"
                              />
                              <div className="flex-1 flex items-baseline gap-1.5">
                                <span>{itemsInfo[item.tokenId].name}</span>
                                {!showWantSelector && (
                                  <span className="text-xs text-slate-400">
                                    ({ownedItems.find((i) => i.id === item.tokenId)?.balance.toString() || "0"})
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400">Select Item</span>
                          )}
                        </button>
                        <input
                          type="number"
                          placeholder="Amt"
                          value={item.amount}
                          onChange={(e) => {
                            const newItems = [...offerItems];
                            newItems[index] = {
                              ...item,
                              amount: e.target.value,
                            };
                            setOfferItems(newItems);
                          }}
                          className={`w-20 px-2 py-1 bg-[#141c27] border rounded text-sm text-white
                            placeholder:text-slate-500 focus:ring-1 focus:ring-[#1da1f2] focus:border-[#1da1f2]
                            ${
                              (!item.tokenId && item.amount) || (item.tokenId && !item.amount)
                                ? "border-red-500/50"
                                : "border-[#2a3844]"
                            }`}
                        />
                        {index > 0 && (
                          <button
                            onClick={() => setOfferItems((items) => items.filter((_, i) => i !== index))}
                            className="p-1 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setOfferItems((items) => [...items, { tokenId: "", amount: "" }])}
                    disabled={!canAddOfferItem}
                    className="flex items-center gap-1.5 px-2 py-1 bg-[#141c27] border border-[#2a3844] hover:border-[#3a4854] 
                      text-slate-300 hover:text-white rounded transition-colors text-sm font-medium w-full justify-center mt-2
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Want Items */}
                <div>
                  <div className="text-xs font-medium mb-3 text-slate-400 uppercase tracking-wider">You Want:</div>
                  {wantItems.map((item, index) => (
                    <div key={index} className="mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedIndex(index);
                            setShowWantSelector(true);
                            setShowOfferSelector(false);
                          }}
                          className={`flex-1 flex items-center gap-2 px-2 py-1.5 bg-[#141c27] border 
                            ${
                              (!item.tokenId && item.amount) || (item.tokenId && !item.amount)
                                ? "border-red-500/50"
                                : "border-[#2a3844] hover:border-[#3a4854]"
                            } 
                            rounded text-sm text-white text-left transition-colors`}
                        >
                          {item.tokenId && itemsInfo[item.tokenId] ? (
                            <>
                              <img
                                src={itemsInfo[item.tokenId].image}
                                alt={itemsInfo[item.tokenId].name}
                                className="w-5 h-5"
                              />
                              <div className="flex-1 flex items-baseline gap-1.5">
                                <span>{itemsInfo[item.tokenId].name}</span>
                                <span className="text-xs text-slate-400">
                                  ({ownedItems.find((i) => i.id === item.tokenId)?.balance.toString() || "0"})
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400">Select Item</span>
                          )}
                        </button>
                        <input
                          type="number"
                          placeholder="Amt"
                          value={item.amount}
                          onChange={(e) => {
                            const newItems = [...wantItems];
                            newItems[index] = {
                              ...item,
                              amount: e.target.value,
                            };
                            setWantItems(newItems);
                          }}
                          className={`w-20 px-2 py-1 bg-[#141c27] border rounded text-sm text-white
                            placeholder:text-slate-500 focus:ring-1 focus:ring-[#1da1f2] focus:border-[#1da1f2]
                            ${
                              (!item.tokenId && item.amount) || (item.tokenId && !item.amount)
                                ? "border-red-500/50"
                                : "border-[#2a3844]"
                            }`}
                        />
                        {index > 0 && (
                          <button
                            onClick={() => setWantItems((items) => items.filter((_, i) => i !== index))}
                            className="p-1 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setWantItems((items) => [...items, { tokenId: "", amount: "" }])}
                    disabled={!canAddWantItem}
                    className="flex items-center gap-1.5 px-2 py-1 bg-[#141c27] border border-[#2a3844] hover:border-[#3a4854] 
                      text-slate-300 hover:text-white rounded transition-colors text-sm font-medium w-full justify-center mt-2
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Item Selector Modal */}
              {(showOfferSelector || showWantSelector) && (
                <div
                  className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-[#1a2432] border border-[#2a3844] 
                  rounded-lg shadow-xl p-4 max-h-[60vh] overflow-y-auto z-10 max-w-lg mx-auto"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={showOfferSelector ? searchOffer : searchWant}
                        onChange={(e) => {
                          if (showOfferSelector) setSearchOffer(e.target.value);
                          else setSearchWant(e.target.value);
                        }}
                        className="w-full pl-8 pr-3 py-1.5 bg-[#141c27] border border-[#2a3844] rounded text-sm text-white
                          placeholder:text-slate-500 focus:ring-1 focus:ring-[#1da1f2] focus:border-[#1da1f2]"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setShowOfferSelector(false);
                        setShowWantSelector(false);
                      }}
                      className="p-1 hover:bg-slate-700 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {showOfferSelector && ownedItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-3">
                        <Wallet className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="text-slate-400 mb-2">No Items Available</div>
                      <div className="text-sm text-slate-500">You don't have any items to offer yet.</div>
                    </div>
                  ) : (showOfferSelector ? filteredOwnedItems : filteredWantItems).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-3">
                        <Search className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="text-slate-400">No Items Found</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {(showOfferSelector ? filteredOwnedItems : filteredWantItems).map((item) => (
                        <button
                          key={item.id}
                          onClick={() =>
                            showOfferSelector ? selectOfferItem(item as ItemWithBalance) : selectWantItem(item)
                          }
                          className="flex items-center gap-2 p-2 bg-[#141c27] border border-[#2a3844] hover:border-[#3a4854] 
                            rounded transition-colors text-left"
                        >
                          <img src={item.image} alt={item.name} className="w-8 h-8" />
                          <div>
                            <div className="text-sm text-white">{item.name}</div>
                            {showOfferSelector && (
                              <div className="text-xs text-slate-400">
                                Balance: {(item as ItemWithBalance).balance.toString()}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end relative z-[5]">
                <button
                  onClick={handleCreateOffer}
                  disabled={isPending || !canAddOfferItem || !canAddWantItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1da1f2] hover:bg-[#1a91da] 
                    text-white rounded-lg transition-colors font-medium text-sm shadow-[0_0_10px_rgba(29,161,242,0.15)]
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Offer</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
