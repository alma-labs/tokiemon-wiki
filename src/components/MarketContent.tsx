import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { ChevronDown, Plus, Wallet } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Market } from './Market'
import { TradeOffers } from './TradeOffers'
import { CreateTradeOffer } from './CreateTradeOffer'

export function MarketContent() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [isOpen, setIsOpen] = useState(false)
  const [showCreateOffer, setShowCreateOffer] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const chains = [
    { id: base.id, name: 'Base' },
    { id: baseSepolia.id, name: 'Base Sepolia' }
  ]

  const currentChain = chains.find(chain => chain.id === chainId)?.name || 'Select Chain'

  if (!address) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative mb-6">
            <Wallet className="w-12 h-12 text-slate-600" />
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
          </div>
          <h2 className="text-xl font-medium text-slate-400 mb-6">Connect your wallet to view your items</h2>
          <Market />
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <TradeOffers setShowCreateOffer={setShowCreateOffer} />

      {showCreateOffer && (
        <CreateTradeOffer onClose={() => setShowCreateOffer(false)} />
      )}
    </main>
  )
} 