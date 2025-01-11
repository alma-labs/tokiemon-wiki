import { useState, useEffect } from "react";
import { useReadContract, useChainId, useAccount } from "wagmi";
import { TOKIEMON_NFT_CONTRACTS, ITEM_CONTRACTS, LENS_CONTRACTS } from "../config/contracts";
import { TOKIEMON_NFT_ABI, ITEM_ABI, LENS_ABI } from "../config/abis";

interface ItemInfo {
  id: string;
  name: string;
  image: string;
  rarity: string;
  type: string;
}

interface TokiemonInfo {
  id: string;
  name: string;
  image: string;
  rarity: string;
}

interface ItemWithBalance extends ItemInfo {
  balance: bigint;
}

export function useUserAssets() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [itemsInfo, setItemsInfo] = useState<Record<string, ItemInfo>>({});
  const [ownedItems, setOwnedItems] = useState<ItemWithBalance[]>([]);
  const [ownedTokiemon, setOwnedTokiemon] = useState<TokiemonInfo[]>([]);

  // Fetch user's Tokiemon from lens contract
  const { data: userTokiemon } = useReadContract({
    address: LENS_CONTRACTS[chainId as keyof typeof LENS_CONTRACTS],
    abi: LENS_ABI,
    functionName: "getUserTokiemon",
    args: [address as `0x${string}`, 0n, 1000n],
    query: {
      enabled: Boolean(address && chainId),
    },
  });

  // Fetch item balances
  const { data: itemBalanceData } = useReadContract({
    address: ITEM_CONTRACTS[chainId as keyof typeof ITEM_CONTRACTS],
    abi: ITEM_ABI,
    functionName: "getItemBalances",
    args: [address as `0x${string}`],
    query: {
      enabled: Boolean(address && chainId),
    },
  });

  // Fetch item metadata
  useEffect(() => {
    const fetchItemsInfo = async () => {
      try {
        const response = await fetch("https://api.tokiemon.io/items/all");
        if (!response.ok) throw new Error("Failed to fetch items");
        const data = await response.json();
        const info = Object.fromEntries(data.map((item: ItemInfo) => [item.id, item]));
        setItemsInfo(info);
      } catch (err) {
        console.error("Failed to load items:", err);
      }
    };
    fetchItemsInfo();
  }, []);

  // Update owned items when balance data changes
  useEffect(() => {
    if (itemBalanceData && itemsInfo) {
      const items: ItemWithBalance[] = [];
      const [ids, balances] = itemBalanceData as [bigint[], bigint[]];
      ids.forEach((id, index) => {
        const itemInfo = itemsInfo[id.toString()];
        if (itemInfo && balances[index] > 0n) {
          items.push({
            ...itemInfo,
            balance: balances[index],
          });
        }
      });
      setOwnedItems(items);
    }
  }, [itemBalanceData, itemsInfo]);

  // Fetch metadata for owned Tokiemon
  useEffect(() => {
    const fetchTokiemonMetadata = async () => {
      if (!userTokiemon || !Array.isArray(userTokiemon)) return;

      try {
        const indices = userTokiemon.map(id => id.toString());
        if (indices.length === 0) return;

        const response = await fetch(`https://api.tokiemon.io/tokiemon?ids=${indices.join(',')}&chainId=${chainId}`);
        if (!response.ok) throw new Error('Failed to fetch Tokiemon metadata');
        
        const metadata = await response.json();
        const tokiemonData = metadata.map((tokiemon: any) => ({
          id: tokiemon.tokenId,
          name: tokiemon.name,
          image: tokiemon.image,
          rarity: tokiemon.attributes.find((attr: any) => attr.trait_type === 'Rarity')?.value || 'Unknown'
        }));
        
        setOwnedTokiemon(tokiemonData);
      } catch (err) {
        console.error('Failed to load Tokiemon metadata:', err);
      }
    };

    fetchTokiemonMetadata();
  }, [userTokiemon, chainId]);

  return {
    ownedItems,
    ownedTokiemon,
  };
}
