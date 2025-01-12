import { useEffect, useState } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { USERNAME_REGISTRY_CONTRACTS } from "../config/contracts";
import { USERNAME_REGISTRY_ABI } from "../config/abis";

export function useUsername(address?: string) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsername = async () => {
      if (!address || !chainId || !publicClient) return;

      const registryAddress = USERNAME_REGISTRY_CONTRACTS[chainId as keyof typeof USERNAME_REGISTRY_CONTRACTS];
      if (!registryAddress) return;

      try {
        const result = await publicClient.readContract({
          address: registryAddress,
          abi: USERNAME_REGISTRY_ABI,
          functionName: "getUsername",
          args: [address as `0x${string}`],
        });

        setUsername(result as string);
      } catch (err) {
        console.error("Failed to fetch username:", err);
        setUsername(null);
      }
    };

    fetchUsername();
  }, [address, chainId, publicClient]);

  return username;
}

export function useUsernames(addresses: string[]) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUsernames = async () => {
      if (!addresses.length || !chainId || !publicClient) return;

      const uniqueAddresses = [...new Set(addresses)];
      const newUsernames: Record<string, string> = {};

      const registryAddress = USERNAME_REGISTRY_CONTRACTS[chainId as keyof typeof USERNAME_REGISTRY_CONTRACTS];
      if (!registryAddress) return;

      try {
        const results = await Promise.all(
          uniqueAddresses.map((address) =>
            publicClient.readContract({
              address: registryAddress,
              abi: USERNAME_REGISTRY_ABI,
              functionName: "getUsername",
              args: [address as `0x${string}`],
            })
          )
        );

        uniqueAddresses.forEach((address, index) => {
          const result = results[index];
          if (result) {
            newUsernames[address] = result as string;
          }
        });

        setUsernames(newUsernames);
      } catch (err) {
        console.error("Failed to fetch usernames:", err);
      }
    };

    fetchUsernames();
  }, [addresses, chainId, publicClient]);

  return usernames;
} 