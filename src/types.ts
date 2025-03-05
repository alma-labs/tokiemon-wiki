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
  excludeLootbox?: boolean;
  activeCaptureTiers?: string[];
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  recipe?: {
    inputs: Array<{
      itemId: string;
      amount: number;
    }>;
    requiredSkillLevel?: number;
    delay?: number;
    earnedXpAmount?: number;
  };
  disassemblyConfig?: {
    guaranteedDrops: Array<{
      itemId: string;
      amount: number;
    }>;
    randomDrop?: {
      itemId: string;
      minAmount: number;
      maxAmount: number;
    };
    specialDrop?: {
      itemId: string;
      probability: number;
    };
  };
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

export interface CommunityMetadata {
  communityId: string;
  name: string;
  symbol: string;
  logoURI: string;
  extraPaymentTokens: any[];
  tags: string[];
  inactive?: boolean;
}