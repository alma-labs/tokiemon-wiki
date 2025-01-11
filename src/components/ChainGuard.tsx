import { useEffect, useRef } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { base } from "wagmi/chains";
import { connect, switchChain } from "wagmi/actions";

export function ChainGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const hasAttemptedSwitch = useRef(false);

  useEffect(() => {
    const handleChainSwitch = async () => {
      if (!isConnected || chainId === base.id || hasAttemptedSwitch.current) return;

      try {
        hasAttemptedSwitch.current = true;
        if (window?.ethereum?.isCoinbaseWallet) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // Base chain ID in hex
          });
        } else {
          await switchChain(config, { chainId: base.id });
        }
      } catch (error) {
        console.error('Failed to switch chain:', error);
      }
    };

    //handleChainSwitch();
  }, [isConnected, chainId, config]);

  if (isConnected && chainId !== base.id) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur-sm z-50">
          <div className="max-w-7xl mx-auto px-4 py-2 text-sm text-yellow-200/80 text-center">
            Please switch to Base chain to use Tokiemon
          </div>
        </div>
        <div className="pt-9">{children}</div>
      </>
    );
  }

  return children;
}
