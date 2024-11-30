import { useAccount, useReadContract, useWriteContract, useChainId, useWaitForTransactionReceipt, useSwitchChain, usePublicClient } from 'wagmi'
import { MARKETPLACE_CONTRACTS, MARKETPLACE_ABI, ITEM_CONTRACTS, ITEM_ABI, USERNAME_REGISTRY_CONTRACTS, USERNAME_REGISTRY_ABI, isBaseChain, WRONG_CHAIN_ERROR } from '../config/contracts'
import { useState, useEffect, useRef } from 'react'
import { Plus, Send, X, Loader2, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react'
import { base, baseSepolia } from 'wagmi/chains'

interface TradeOffer {
  offerId: bigint
  offerer: string
  offerTokenIds: bigint[]
  offerAmounts: bigint[]
  wantTokenIds: bigint[]
  wantAmounts: bigint[]
}

interface ItemInfo {
  id: string
  name: string
  image: string
}

interface ItemWithBalance extends ItemInfo {
  balance: bigint
}

interface TradeOffersProps {
  setShowCreateOffer: (show: boolean) => void;
}

export function TradeOffers({ setShowCreateOffer }: TradeOffersProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [itemsInfo, setItemsInfo] = useState<Record<string, ItemInfo>>({})
  const [ownedItems, setOwnedItems] = useState<ItemWithBalance[]>([])
  const [page, setPage] = useState(0)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'forYou'>('all')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const ITEMS_PER_PAGE = 20
  const [usernames, setUsernames] = useState<Record<string, string>>({})

  const chains = [
    { id: base.id, name: 'Base' },
    { id: baseSepolia.id, name: 'Base Sepolia' }
  ]

  const currentChain = chains.find(chain => chain.id === chainId)?.name || 'Select Chain'

  const publicClient = usePublicClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch active trade offers with pagination
  const { data: tradeOffersData, refetch: refetchOffers } = useReadContract({
    address: MARKETPLACE_CONTRACTS[chainId as keyof typeof MARKETPLACE_CONTRACTS],
    abi: MARKETPLACE_ABI,
    functionName: 'getActiveTradeOffers',
    args: [BigInt(page * ITEMS_PER_PAGE), BigInt(ITEMS_PER_PAGE)],
    query: {
      enabled: Boolean(chainId),
    }
  })

  // Transaction receipt
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  })

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess) {
      refetchOffers()
    }
  }, [isSuccess])

  // Get total pages
  const totalOffers = tradeOffersData ? Number(tradeOffersData[1]) : 0
  const currentOffers = tradeOffersData?.[0] ?? []
  const totalPages = Math.ceil(totalOffers / ITEMS_PER_PAGE)
  const hasNextPage = currentOffers.length === ITEMS_PER_PAGE && (page + 1) * ITEMS_PER_PAGE < totalOffers

  useEffect(() => {
    if (chainId) {
      refetchOffers()
    }
  }, [chainId, page])

  // Contract write functions
  const { writeContract: acceptOffer, isPending: isAccepting } = useWriteContract()
  const { writeContract: cancelOffer, isPending: isCancelling } = useWriteContract()

  // Get explorer URL
  const getExplorerLink = (hash: `0x${string}`) => {
    const baseUrl = chainId === base.id 
      ? 'https://basescan.org'
      : 'https://sepolia.basescan.org'
    return `${baseUrl}/tx/${hash}`
  }

  // Fetch item metadata
  useEffect(() => {
    const fetchItemsInfo = async () => {
      try {
        const response = await fetch('https://api.tokiemon.io/items/all')
        if (!response.ok) throw new Error('Failed to fetch items')
        const data = await response.json()
        const info = Object.fromEntries(
          data.map((item: ItemInfo) => [item.id, item])
        )
        setItemsInfo(info)
      } catch (err) {
        console.error('Failed to load items:', err)
      }
    }
    fetchItemsInfo()
  }, [])

  // Fetch balances
  const { data: balanceData } = useReadContract({
    address: ITEM_CONTRACTS[chainId as keyof typeof ITEM_CONTRACTS],
    abi: ITEM_ABI,
    functionName: 'getItemBalances',
    args: [address as `0x${string}`],
    query: {
      enabled: Boolean(address && chainId),
    }
  })

  // Update owned items when balance data changes
  useEffect(() => {
    if (balanceData && itemsInfo) {
      const items: ItemWithBalance[] = []
      const [ids, balances] = balanceData as [bigint[], bigint[]]
      ids.forEach((id, index) => {
        const itemInfo = itemsInfo[id.toString()]
        if (itemInfo && balances[index] > 0n) {
          items.push({
            ...itemInfo,
            balance: balances[index]
          })
        }
      })
      setOwnedItems(items)
    }
  }, [balanceData, itemsInfo, chainId])

  const canAcceptOffer = (offer: any) => {
    // Check if user has enough of each wanted item
    for (let i = 0; i < offer.wantTokenIds.length; i++) {
      const tokenId = offer.wantTokenIds[i].toString()
      const requiredAmount = offer.wantAmounts[i]
      const ownedItem = ownedItems.find(item => item.id === tokenId)
      
      if (!ownedItem || ownedItem.balance < requiredAmount) {
        return false
      }
    }
    return true
  }

  const getMissingItems = (offer: any) => {
    const missing: string[] = []
    for (let i = 0; i < offer.wantTokenIds.length; i++) {
      const tokenId = offer.wantTokenIds[i].toString()
      const requiredAmount = offer.wantAmounts[i]
      const ownedItem = ownedItems.find(item => item.id === tokenId)
      const itemName = itemsInfo[tokenId]?.name || `Item #${tokenId}`
      
      if (!ownedItem) {
        missing.push(`${itemName} (need ${requiredAmount.toString()})`)
      } else if (ownedItem.balance < requiredAmount) {
        missing.push(`${itemName} (have ${ownedItem.balance.toString()}, need ${requiredAmount.toString()})`)
      }
    }
    return missing
  }

  const handleAcceptOffer = (offerId: bigint) => {
    if (!chainId || !address) return
    
    if (!isBaseChain(chainId)) {
      alert(WRONG_CHAIN_ERROR);
      return;
    }

    try {
      acceptOffer({
        address: MARKETPLACE_CONTRACTS[chainId as keyof typeof MARKETPLACE_CONTRACTS],
        abi: MARKETPLACE_ABI,
        functionName: 'acceptTradeOffer',
        args: [offerId],
        chainId: chainId,
      }, {
        onSuccess: (hash) => {
          setTxHash(hash)
        },
        onError: (error) => {
          console.error('Transaction failed:', error)
        },
      })
    } catch (error) {
      console.error('Failed to accept offer:', error)
    }
  }

  const handleCancelOffer = (offerId: bigint) => {
    if (!chainId || !address) return
    
    if (!isBaseChain(chainId)) {
      alert(WRONG_CHAIN_ERROR);
      return;
    }

    try {
      cancelOffer({
        address: MARKETPLACE_CONTRACTS[chainId as keyof typeof MARKETPLACE_CONTRACTS],
        abi: MARKETPLACE_ABI,
        functionName: 'cancelTradeOffer',
        args: [offerId],
        chainId: chainId,
      }, {
        onSuccess: (hash) => {
          setTxHash(hash)
        },
        onError: (error) => {
          console.error('Transaction failed:', error)
        },
      })
    } catch (error) {
      console.error('Failed to cancel offer:', error)
    }
  }

  const renderItemList = (tokenIds: readonly bigint[], amounts: readonly bigint[]) => (
    <div className="flex flex-wrap gap-1.5">
      {tokenIds.map((id, index) => {
        const itemInfo = itemsInfo[id.toString()]
        return (
          <div 
            key={index} 
            className="flex items-center gap-1.5 bg-[#141c27] px-2 py-1 rounded-lg border border-[#2a3844]"
          >
            <img
              src={itemInfo?.image || `https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/items/${id.toString()}.png`}
              alt={itemInfo?.name || `Item #${id.toString()}`}
              className="w-5 h-5"
            />
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-medium text-white truncate max-w-[120px] sm:max-w-[180px]">
                {itemInfo?.name || `Item #${id.toString()}`}
              </span>
              <span className="text-xs text-slate-400">×{amounts[index].toString()}</span>
            </div>
          </div>
        )
      })}
    </div>
  )

  // Filter offers based on active tab
  const filteredOffers = currentOffers.filter((offer: any) => {
    if (activeTab === 'all') return true;
    return offer.offerer !== address && canAcceptOffer(offer);
  });

  // Update usernames when offers change
  useEffect(() => {
    const fetchUsernames = async () => {
      if (!currentOffers?.length || !chainId || !publicClient) return
      
      const uniqueAddresses = [...new Set(currentOffers.map(offer => offer.offerer))]
      const newUsernames: Record<string, string> = {}

      const registryAddress = USERNAME_REGISTRY_CONTRACTS[chainId as keyof typeof USERNAME_REGISTRY_CONTRACTS]
      if (!registryAddress) return

      try {
        const results = await Promise.all(
          uniqueAddresses.map(address => 
            publicClient.readContract({
              address: registryAddress,
              abi: USERNAME_REGISTRY_ABI,
              functionName: 'getUsername',
              args: [address as `0x${string}`],
            })
          )
        )

        uniqueAddresses.forEach((address, index) => {
          const result = results[index]
          if (result) {
            newUsernames[address] = result as string
          }
        })

        setUsernames(newUsernames)
      } catch (err) {
        console.error('Failed to fetch usernames:', err)
      }
    }

    fetchUsernames()
  }, [currentOffers, chainId, publicClient])

  if (!tradeOffersData?.[0].length) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${activeTab === 'all' 
                  ? 'bg-slate-700 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
            >
              All Offers
            </button>
            <button
              onClick={() => setActiveTab('forYou')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${activeTab === 'forYou'
                  ? 'bg-[#1da1f2] text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-[#1da1f2]/10'}`}
            >
              For You
            </button>
          </div>

          <button
            onClick={() => setShowCreateOffer(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#1da1f2] hover:bg-[#1a91da] 
              text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Create Trade Offer</span>
          </button>
        </div>

        <div className="text-center py-12 text-slate-400">
          No active trade offers
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {isSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">Transaction successful!</div>
          <a
            href={getExplorerLink(txHash!)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1da1f2] hover:text-[#1a91da] transition-colors inline-flex items-center gap-1"
          >
            <span>View</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {(isAccepting || isCancelling || isConfirming) && (
        <div className="bg-[#1da1f2]/10 border border-[#1da1f2]/20 text-[#1da1f2] p-3 rounded-lg mb-4 flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          <div className="flex-1">
            {isConfirming ? 'Transaction pending...' : 'Confirm in wallet...'}
          </div>
          {txHash && (
            <a
              href={getExplorerLink(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1da1f2] hover:text-[#1a91da] transition-colors inline-flex items-center gap-1"
            >
              <span>View</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${activeTab === 'all' 
                ? 'bg-slate-700 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            All Offers
          </button>
          <button
            onClick={() => setActiveTab('forYou')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${activeTab === 'forYou'
                ? 'bg-[#1da1f2] text-white' 
                : 'text-slate-400 hover:text-white hover:bg-[#1da1f2]/10'}`}
          >
            For You
          </button>
        </div>

        <button
          onClick={() => setShowCreateOffer(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#1da1f2] hover:bg-[#1a91da] 
            text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Create Trade Offer</span>
        </button>
      </div>

      {/* Grid of offers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredOffers.map((offer: any) => (
          <div 
            key={offer.offerId.toString()} 
            className="bg-[#1a2432] border border-[#2a3844] rounded-lg p-3 hover:border-[#3a4854] transition-colors
              hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-400">
                  From: {usernames[offer.offerer] || `${offer.offerer.slice(0, 6)}...${offer.offerer.slice(-4)}`}
                </div>
                {offer.offerer === address && (
                  <span className="text-xs px-1.5 py-0.5 bg-[#1a91da]/20 text-[#1da1f2] rounded-full border border-[#1da1f2]/20">
                    Your Offer
                  </span>
                )}
              </div>
              {offer.offerer === address ? (
                <button
                  onClick={() => handleCancelOffer(offer.offerId)}
                  disabled={isCancelling}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 
                    text-red-500 rounded-lg transition-colors text-sm font-medium"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="relative group">
                  {!canAcceptOffer(offer) && (
                    <div className="absolute bottom-full mb-2 right-0 w-64 p-2 bg-slate-800 rounded-lg text-xs text-slate-300 
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-slate-700">
                      <div className="font-medium text-red-400 mb-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Missing required items:</span>
                      </div>
                      <ul className="space-y-1 list-disc list-inside">
                        {getMissingItems(offer).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => handleAcceptOffer(offer.offerId)}
                    disabled={isAccepting || !canAcceptOffer(offer)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1da1f2] hover:bg-[#1a91da] 
                      text-white rounded-lg transition-colors text-sm font-medium shadow-[0_0_10px_rgba(29,161,242,0.15)]
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium mb-2 text-slate-400 uppercase tracking-wider">Offering:</div>
                {renderItemList(offer.offerTokenIds, offer.offerAmounts)}
              </div>
              <div>
                <div className="text-xs font-medium mb-2 text-slate-400 uppercase tracking-wider">Wants:</div>
                {renderItemList(offer.wantTokenIds, offer.wantAmounts)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state inside grid */}
      {filteredOffers.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          {activeTab === 'forYou' 
            ? 'No offers for you'
            : 'No active trade offers'}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-3 py-1 bg-[#1a2432] border border-[#2a3844] hover:border-[#3a4854] 
            text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
        >
          Previous
        </button>
        <div className="text-sm text-slate-400">
          {totalOffers > 0 ? (
            <>
              Page {page + 1} of {totalPages} ({totalOffers} offers)
            </>
          ) : (
            'No offers'
          )}
        </div>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!hasNextPage}
          className="px-3 py-1 bg-[#1a2432] border border-[#2a3844] hover:border-[#3a4854] 
            text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
        >
          Next
        </button>
      </div>
    </div>
  )
} 