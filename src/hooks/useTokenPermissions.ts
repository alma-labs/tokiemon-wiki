import { useReadContract, useChainId, useAccount } from "wagmi";
import { TOKIEMON_NFT_CONTRACTS, USDC_CONTRACTS } from "../config/contracts";
import { TOKIEMON_NFT_ABI, ERC20_ABI } from "../config/abis";

export function useTokenPermissions(spenderAddress: `0x${string}`) {
  const chainId = useChainId();
  const { address } = useAccount();

  const { data: isNFTApproved } = useReadContract({
    address: TOKIEMON_NFT_CONTRACTS[chainId as keyof typeof TOKIEMON_NFT_CONTRACTS],
    abi: TOKIEMON_NFT_ABI,
    functionName: "isApprovedForAll",
    args: [address, spenderAddress],
  });

  const { data: usdcAllowance } = useReadContract({
    address: USDC_CONTRACTS[chainId as keyof typeof USDC_CONTRACTS],
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address, spenderAddress],
  });

  return {
    isNFTApproved: Boolean(isNFTApproved),
    hasUSDCAllowance: usdcAllowance ? (usdcAllowance as bigint) > BigInt(100000000) : false,
  };
}
