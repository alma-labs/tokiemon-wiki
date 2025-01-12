import { useQuery } from '@tanstack/react-query';

interface TokiemonAttribute {
  trait_type: string;
  value?: string;
}

export interface TokiemonDetails {
  orientation: string;
  tokenId: string;
  chainId: number;
  description: string;
  image: string;
  name: string;
  attributes: TokiemonAttribute[];
}

export function useTokiemonDetails(tokenId: string | bigint, chainId: number) {
  return useQuery<TokiemonDetails>({
    queryKey: ['tokiemon', tokenId.toString(), chainId],
    queryFn: async () => {
      const response = await fetch(
        `https://api.tokiemon.io/tokiemon/${tokenId}?chainId=${chainId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch tokiemon details');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
} 