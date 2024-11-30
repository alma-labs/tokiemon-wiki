import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || ''

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({ appName: 'Tokiemon' })
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
}) 