export interface Item {
  id: string;
  name: string;
  description: string;
  rarity: string;
  type: string;
  impacts: Array<{
    type: string;
    amount?: number;
    time?: number;
  }>;
  requirements: Array<{
    type: string;
    amount: number;
  }>;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  slot?: string;
  secondarySlot?: string;
  maxSupply?: number;
}

export interface Community {
  _id: string;
  chainId: number;
  communityId: string;
  active: number;
  leader: {
    communityId: string;
    name: string;
    image: string;
    ownerUsername: string;
    purchaseTier: number;
    rarity: number;
    skills: {
      [key: string]: {
        level: number;
        manaPerLevelMultiplier: number;
        manaUntilNextLevel: number;
        cumulativeMana: number;
      }
    };
    tokenId: string;
    totalLevel: number;
  };
  rank: number;
  rarePlus: number;
  total: number;
  updatedAt: string;
  wins: number;
}