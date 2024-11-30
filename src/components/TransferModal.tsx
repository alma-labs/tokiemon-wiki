import { useState } from 'react'
import { X, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { ITEM_CONTRACTS, ITEM_ABI } from '../config/contracts'
import { base, baseSepolia } from 'wagmi/chains'

interface TransferModalProps {
  itemId: bigint
  balance: bigint
  onClose: () => void
  chainId: number
}

export function TransferModal({ itemId, balance, onClose, chainId }: TransferModalProps) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('1')
  const { address } = useAccount()
  
  const { writeContract, isPending: isWritePending, data: hash } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleTransfer = async () => {
    if (!address) return

    try {
      writeContract({
        address: ITEM_CONTRACTS[chainId as keyof typeof ITEM_CONTRACTS],
        abi: ITEM_ABI,
        functionName: 'safeTransferFrom',
        args: [address, recipient as `0x${string}`, itemId, BigInt(amount), '0x' as `0x${string}`],
      })
    } catch (error) {
      console.error('Transfer failed:', error)
    }
  }

  const getExplorerLink = (hash: `0x${string}`) => {
    const baseUrl = chainId === base.id 
      ? 'https://basescan.org'
      : 'https://sepolia.basescan.org'
    return `${baseUrl}/tx/${hash}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a2432] border border-[#2a3844] rounded-lg max-w-md w-full text-[#e2e8f0] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Transfer Item #{itemId.toString()}</h2>
            {!hash && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Transfer Complete!</h3>
              <a
                href={getExplorerLink(hash!)}
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
          ) : isWritePending || isConfirming ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-[#1da1f2] mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-white mb-2">
                {isWritePending ? 'Confirm in Wallet' : 'Transaction Pending'}
              </h3>
              {hash && (
                <a
                  href={getExplorerLink(hash)}
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                    text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Amount (Max: {balance.toString()})
                </label>
                <input
                  type="number"
                  min="1"
                  max={balance.toString()}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                    text-white placeholder-gray-400"
                />
              </div>

              <button
                onClick={handleTransfer}
                disabled={isWritePending || !recipient || !amount || !address}
                className="w-full px-4 py-2 bg-[#1da1f2] hover:bg-[#1a91da] 
                  text-white rounded-lg transition-colors duration-200 font-medium 
                  shadow-[0_0_10px_rgba(29,161,242,0.3)]
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Transfer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 