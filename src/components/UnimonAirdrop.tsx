import { useState, useEffect } from "react";
import { useAccount, useContractRead, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, Address } from "viem";

const AIRDROP_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      { indexed: true, internalType: "address", name: "recipient", type: "address" },
    ],
    name: "RecipientSet",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "sender", type: "address" }],
    name: "getRecipient",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address[]", name: "senders", type: "address[]" }],
    name: "getRecipients",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "recipientAddresses",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "recipient", type: "address" }],
    name: "setRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const AIRDROP_CONTRACT = "0x11Eb0F8bBbAd3772CDF5A36Fe49B323C0fA3DbEB" as const;

const AIRDROP_ADDRESSES = [
  {
    address: "0x9F5b8fa8057De43803421E4322b66Ad4C3534f67",
    runes: 1,
  },
  {
    address: "0x12D0f29642Ebf73aB1b636222Fd3eB48eB9b4A03",
    runes: 10,
  },
  {
    address: "0x48963B03d3D7d16efD5E5d302225abc393A8CAd5",
    runes: 41138,
  },
  {
    address: "0xABE6e4C3c2d44768F6a56E8379527Bc3A470de6E",
    runes: 19645,
  },
  {
    address: "0x8631A7Fe663ce6856756B8E12578341B8598C95e",
    runes: 17939,
  },
  {
    address: "0xF6432a777E1adCFBe4EF063dD649c3f5A86c8A32",
    runes: 31238,
  },
  {
    address: "0x52E362b960c02f752A3D88EE2D6E75d4CaC129ac",
    runes: 13619,
  },
  {
    address: "0x9071Fb6b3E3B6D0cD6453b4E7ddce38f22eAaC62",
    runes: 10802,
  },
  {
    address: "0x00E6128EC492536094967F6dd0BD2c2971d217df",
    runes: 27874,
  },
  {
    address: "0x7F2204F49157651F314395F4703622E3FDC8DF4E",
    runes: 12444,
  },
  {
    address: "0x982f971cf283AF08C811D7bC15212aE0df298C64",
    runes: 236245,
  },
  {
    address: "0x98F339640a97963A58c9450d17ecEf6509F5fb6d",
    runes: 24655,
  },
  {
    address: "0x99Fa48ccEa8a38CDE6B437450fF9bBdDAFAA4Fc8",
    runes: 11550,
  },
  {
    address: "0x0CF57CC0104C3eBbb7Ea83BE0A0a86E803194542",
    runes: 27160,
  },
  {
    address: "0xf96FA419329d957b933547150c26Faf840ddDd35",
    runes: 585264,
  },
  {
    address: "0x4d46702265E86BF9776d8d3BFD532e6ac60a5BAd",
    runes: 96401,
  },
  {
    address: "0x628Bf62dcC7aA9Dd37CD0E61BbCDEdaAF846DC4B",
    runes: 10117,
  },
  {
    address: "0xdB3aF13730a655afB831F88A5eeDc3d39e38250d",
    runes: 15914,
  },
  {
    address: "0x30597753b26bC486CA322073e28Fe6cD109EDa1C",
    runes: 56859,
  },
  {
    address: "0x9C4B73d941619DdD922748610ed0E056BD977d71",
    runes: 89457,
  },
  {
    address: "0xE051df1B8756837712646De21bd3124507F20676",
    runes: 21505,
  },
  {
    address: "0x579595F3064AFc04A4b0a1660f3dBa789ddE0448",
    runes: 20045,
  },
  {
    address: "0x3844824Dc6A817C73edA4CF7b4bCa0EF6197dc5F",
    runes: 296111,
  },
  {
    address: "0x7C4A0eb0f588D8A14B670c7388Aa96f77a2143C4",
    runes: 48041,
  },
  {
    address: "0x20862d37dEA1962Dd8651d2D97Dad8c27c521662",
    runes: 34979,
  },
  {
    address: "0x1076951fBBDcE1fBea560a59584D977956E11c6f",
    runes: 180019,
  },
  {
    address: "0xE2a42Ce707f666d7862b134EeC29C2Be8A10fEb5",
    runes: 135000,
  },
  {
    address: "0xc17366B448E75c8B93f03F621D2c2Fe6CC9Ae895",
    runes: 21192,
  },
  {
    address: "0xB3eE90fD0F7c83e996D60Db282eAE48063e2569f",
    runes: 13923,
  },
  {
    address: "0x4E6a01206a2BE0FE6343A39AFb19B83fCAeb6563",
    runes: 20179,
  },
  {
    address: "0xb5A106B81d14B00827950D86421Acb0A0d63a5Ec",
    runes: 17314,
  },
  {
    address: "0xeF41e1D0D1d87C52A71731063E41F20895763360",
    runes: 20656,
  },
  {
    address: "0xE5454A625A99C3BDA441cF985d55891525cB8e68",
    runes: 24076,
  },
  {
    address: "0xB417DF0CbC1f51998747fD013F09fA0272503cE4",
    runes: 25280,
  },
  {
    address: "0x72Ca401b621d8CE0d64f6B39DA27F1dB42DeC9FD",
    runes: 28761,
  },
];

const CATEGORIES = [
  { name: "Tokiemaster", threshold: 100000, mints: 8 },
  { name: "Tokiegrinder", threshold: 50000, mints: 4 },
  { name: "Tokiestud", threshold: 25000, mints: 2 },
  { name: "Tokielover", threshold: 10000, mints: 1 },
];

export default function UnimonAirdrop() {
  const { address, isConnected } = useAccount();
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [unichainAddress, setUnichainAddress] = useState("");
  const [isSettingRecipient, setIsSettingRecipient] = useState(false);
  const [recipientSetSuccess, setRecipientSetSuccess] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  // Contract interactions
  const { data: existingRecipient } = useContractRead({
    address: AIRDROP_CONTRACT as Address,
    abi: AIRDROP_ABI,
    functionName: "getRecipient",
    args: [address as Address],
  });

  const { writeContract } = useWriteContract();

  const { isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Check eligibility whenever address changes
  useEffect(() => {
    if (address) {
      checkEligibility();
    } else {
      setIsEligible(null);
    }
  }, [address]);

  const checkEligibility = async () => {
    if (!address) return;

    try {
      const normalizedUserAddress = address.toLowerCase();
      const isInList = AIRDROP_ADDRESSES.some((entry) => entry.address.toLowerCase() === normalizedUserAddress);
      setIsEligible(isInList);
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setIsEligible(false);
    }
  };

  const handleSetRecipient = async () => {
    if (!unichainAddress || !isEligible || !writeContract) return;

    try {
      setIsSettingRecipient(true);
      setRecipientSetSuccess(false);

      const result = await writeContract({
        address: AIRDROP_CONTRACT as Address,
        abi: AIRDROP_ABI,
        functionName: "setRecipient",
        args: [unichainAddress as Address],
      });

      if (typeof result === "string") {
        setTxHash(result as `0x${string}`);
      }
    } catch (error) {
      console.error("Error setting recipient:", error);
      setIsSettingRecipient(false);
    }
  };

  const getRuneAmount = () => {
    if (!address) return 0;
    const normalizedUserAddress = address.toLowerCase();
    const entry = AIRDROP_ADDRESSES.find((entry) => entry.address.toLowerCase() === normalizedUserAddress);
    return entry?.runes || 0;
  };

  const getUserCategory = () => {
    const runes = getRuneAmount();
    return CATEGORIES.find((cat) => runes >= cat.threshold) || null;
  };

  useEffect(() => {
    if (isSuccess) {
      setRecipientSetSuccess(true);
      setIsSettingRecipient(false);
    }
  }, [isSuccess]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <img
            src="https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/placeholder-egg.png"
            alt="UNIMON"
            className="w-8 h-8"
          />
          <h1 className="text-2xl font-bold text-white">Unimon Airdrop</h1>
        </div>

        {!isConnected ? (
          <div className="bg-slate-700/50 p-4 rounded-lg mb-8">
            <p className="text-slate-300">Connect your wallet using the button in the header to check eligibility.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-slate-300">
                Connected: <span className="font-mono text-sm">{address}</span>
              </p>
            </div>

            {isEligible === null ? (
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-slate-300">Checking eligibility...</p>
              </div>
            ) : isEligible ? (
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-lg">
                  <p className="text-green-400 font-medium">
                    You are eligible! See table below for your Unimon NFT allocation.
                  </p>
                  {getUserCategory() && (
                    <p className="text-green-400 mt-2">
                      Your category: <span className="font-semibold">{getUserCategory()?.name}</span>
                    </p>
                  )}
                </div>

                {existingRecipient && existingRecipient !== "0x0000000000000000000000000000000000000000" ? (
                  <div className="bg-pink-500/20 border border-pink-500/50 p-4 rounded-lg">
                    <p className="text-pink-400 font-medium">You have already registered for the airdrop!</p>
                    <p className="text-pink-400 mt-2">Your Unimon NFTs will be sent to:</p>
                    <p className="text-pink-400 mt-1 font-mono text-sm">{existingRecipient}</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <label htmlFor="unichainAddress" className="block text-sm font-medium text-slate-300 mb-2">
                        Enter Your Unichain Address
                      </label>
                      <input
                        type="text"
                        id="unichainAddress"
                        value={unichainAddress}
                        onChange={(e) => setUnichainAddress(e.target.value)}
                        placeholder="Enter your Unichain address"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white 
                          placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-slate-400">
                        This address cannot be changed after submission. Your Unimon NFTs will be airdropped to this
                        address on Unichain.
                      </p>
                    </div>

                    <button
                      onClick={handleSetRecipient}
                      disabled={isSettingRecipient || !unichainAddress}
                      className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg 
                        transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSettingRecipient ? "Registering Address..." : "Register for Airdrop"}
                    </button>

                    {recipientSetSuccess && (
                      <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-lg">
                        <p className="text-green-400 font-medium">Successfully registered for the airdrop!</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg">
                <p className="text-red-400 font-medium">
                  Sorry, you are not eligible for the Unimon airdrop. Check table below for requirements.
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Airdrop Categories</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-3 px-4 text-slate-300 font-medium">Category</th>
                  <th className="py-3 px-4 text-slate-300 font-medium">Rune Threshold</th>
                  <th className="py-3 px-4 text-slate-300 font-medium">Free Unimon</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((category) => (
                  <tr
                    key={category.name}
                    className={`border-b border-slate-700 ${
                      isEligible && getUserCategory()?.name === category.name
                        ? "bg-pink-500/10"
                        : "hover:bg-slate-700/50"
                    }`}
                  >
                    <td className="py-3 px-4 text-white">{category.name}</td>
                    <td className="py-3 px-4 text-white">{category.threshold.toLocaleString()}</td>
                    <td className="py-3 px-4 text-white">{category.mints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-sm text-slate-400 text-center">Snapshot taken at 16:00 UTC March 26</p>
          </div>
        </div>
      </div>
    </div>
  );
}
