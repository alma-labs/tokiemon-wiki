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