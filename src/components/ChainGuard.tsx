import { useEffect, useState } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { connect } from "wagmi/actions";

const SUPPORTED_CHAINS = [base.id, baseSepolia.id] as const;
type SupportedChainId = (typeof SUPPORTED_CHAINS)[number];

const SUPPORTED_CHAIN_NAMES: Record<SupportedChainId, string> = {
  [base.id]: "Base",
  [baseSepolia.id]: "Base Sepolia",
};

export function ChainGuard({ children }: { children: React.ReactNode }) {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const config = useConfig();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isConnected || !chainId) {
      setShowWarning(false);
      return;
    }

    setShowWarning(!SUPPORTED_CHAINS.includes(chainId as SupportedChainId));
  }, [chainId, isConnected]);

  if (!isConnected || !showWarning) return children;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg shadow-lg">
        <p className="text-red-500 text-sm font-medium mb-2">
          Unsupported Network
        </p>
        <button
          onClick={() =>
            connect(config, {
              chainId: base.id,
              connector: config.connectors[0]
            })
          }
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
        >
          Switch to Base
        </button>
      </div>
    </div>
  );
}
