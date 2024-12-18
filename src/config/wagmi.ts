import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected, metaMask } from "wagmi/connectors";

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "";

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    metaMask(),
    coinbaseWallet({
      appName: "Tokiemon",
      headlessMode: true,
    }),
    injected(),
  ],
  transports: {
    [base.id]: http(base.rpcUrls.default.http[0]),
    [baseSepolia.id]: http(baseSepolia.rpcUrls.default.http[0]),
  },
});
