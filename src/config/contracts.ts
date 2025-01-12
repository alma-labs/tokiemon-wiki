import { base, baseSepolia } from "wagmi/chains";

// Add validation function
export function isBaseChain(chainId: number): boolean {
  return chainId === base.id || chainId === baseSepolia.id;
}

// Add error message
export const WRONG_CHAIN_ERROR = "Please switch to Base network to perform this action";

export const ITEM_CONTRACTS = {
  [base.id]: "0xaD574F7f4Eb563B0CcDCcA0D7d7628aeaf071d65", // Base mainnet contract address
  [baseSepolia.id]: "0xf8DC33C8989259F909F66e5f1D613695Fcaf81D7", // Base Sepolia contract address
} as const;

export const MARKETPLACE_CONTRACTS = {
  [base.id]: "0x5d4f4d0c6E151FCb5f86d7f42ee9D5CCD7c0001c",
  [baseSepolia.id]: "0xb0596Bd90e7411C4a32b1DAf2Ff3EeD118296840",
} as const;

// username registry contract address
export const USERNAME_REGISTRY_CONTRACTS = {
  [base.id]: "0xC0da56fd2b8757eCB5975faD17d5Bc2e974De765",
  [baseSepolia.id]: "0xEb6537A34dB0E656989bc2d455a482025b33ff22",
} as const;

export const BLACK_MARKET_CONTRACTS = {
  [base.id]: "0x608064c907EF4cdE8204a0dB27973695f2b61831",
  [baseSepolia.id]: "0x0Ebc45A38613FFfBAe2b02dcD5CC693c556C88Ff",
} as const;

export const USDC_CONTRACTS = {
  [base.id]: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  [baseSepolia.id]: "0xCB04550cd8Cde63fB17195978998674122572068",
} as const;

export const TOKIEMON_NFT_CONTRACTS = {
  [base.id]: "0x802187c392b15CDC8df8Aa05bFeF314Df1f65C62",
  [baseSepolia.id]: "0x858E828ae680b908a9bC2000a6966385BAeb6651",
} as const;

export const LENS_CONTRACTS = {
  [base.id]: "0xEC545cae11a293FD752B4c9b07167d6a54821d1E",
  [baseSepolia.id]: "0x127E41cB8f53f5097616F8F40A3Eb532F47a3207",
} as const;
