import { useEffect } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { base } from "wagmi/chains";
import { connect, switchChain } from "wagmi/actions";

export function ChainGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();

  useEffect(() => {
    const handleChainSwitch = async () => {
      if (!isConnected || chainId === base.id) return;

      try {
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

    handleChainSwitch();
  }, [isConnected, chainId, config]);

  return children;
}
