import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { Wallet, Plus, LogOut, X, Coins, Chrome, Copy, Check, ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { base, baseSepolia } from 'wagmi/chains'

export function Market() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isChainOpen, setIsChainOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const chains = [
    { id: base.id, name: 'Base' },
    { id: baseSepolia.id, name: 'Base Sepolia' }
  ]

  const currentChain = chains.find(chain => chain.id === chainId)?.name || 'Select Chain'

  // Handle chain changes from MetaMask
  useEffect(() => {
    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId)
      if (chains.some(chain => chain.id === newChainId)) {
        window.location.reload()
      }
    }

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged)
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsChainOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopyAddress}
          className="flex items-center gap-2 text-sm text-slate-200 hover:text-white transition-colors group"
        >
          <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsChainOpen(!isChainOpen)}
            disabled={isSwitchingChain}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 
              transition-colors text-sm disabled:opacity-50"
          >
            {isSwitchingChain ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Switching...</span>
              </>
            ) : (
              <>
                <span>{currentChain}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isChainOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
          
          {isChainOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-slate-800 rounded-lg shadow-lg py-1 z-10">
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={async () => {
                    try {
                      await switchChain({ chainId: chain.id })
                      setIsChainOpen(false)
                    } catch (error) {
                      console.error('Failed to switch chain:', error)
                    }
                  }}
                  disabled={isSwitchingChain}
                  className={`w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors disabled:opacity-50
                    ${chainId === chain.id ? 'text-white bg-slate-700' : 'text-slate-300'}`}
                >
                  {chain.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => disconnect()}
          className="flex items-center justify-center gap-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 
            text-white rounded-lg transition-colors duration-200 font-medium text-sm"
        >
          <span>Disconnect</span>
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => {
            connect({ connector: coinbaseWallet({ appName: "Tokiemon" }), chainId: 8453 });
          }}
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 
            text-white rounded-lg transition-colors duration-200 font-medium"
        >
          <span>Create</span>
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowModal(true)}
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-[#1da1f2] hover:bg-[#1a91da] 
            text-white rounded-lg transition-colors duration-200 font-medium shadow-[0_0_10px_rgba(29,161,242,0.3)]"
        >
          <span>Connect</span>
          <Wallet className="w-4 h-4" />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a2432] border border-[#2a3844] rounded-lg max-w-md w-full text-[#e2e8f0] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Connect Wallet</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    connect({ 
                      connector: coinbaseWallet({ appName: "Tokiemon" }),
                      chainId: base.id 
                    });
                    setShowModal(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-700 hover:bg-slate-600 
                    rounded-lg transition-colors"
                >
                  <span className="font-medium">Coinbase Wallet</span>
                  <Coins className="w-6 h-6 text-blue-400" />
                </button>

                <button
                  onClick={() => {
                    connect({ 
                      connector: injected(),
                      chainId: base.id 
                    });
                    setShowModal(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-700 hover:bg-slate-600 
                    rounded-lg transition-colors"
                >
                  <span className="font-medium">Browser Wallet</span>
                  <Chrome className="w-6 h-6 text-orange-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
