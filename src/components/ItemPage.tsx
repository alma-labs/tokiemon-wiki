import { useParams, useNavigate } from "react-router-dom";
import { Item } from "../types";
import { ExternalLink, ArrowLeft, Globe, MessageCircle } from "lucide-react";
import { useReadContract, useChainId } from "wagmi";
import { ITEM_CONTRACTS } from "../config/contracts";
import { ITEM_ABI } from "../config/abis";
import { useEffect, useRef } from "react";

export default function ItemPage({ items }: { items: Item[] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const chainId = useChainId();
  const item = items.find((i) => i.id === id);
  const isBackNavigation = useRef(false);

  useEffect(() => {
    if (!isBackNavigation.current) {
      window.scrollTo(0, 0);
    }
  }, []);

  const handleBack = () => {
    isBackNavigation.current = true;
    navigate(-1);
  };

  const { data: totalSupply } = useReadContract({
    address: ITEM_CONTRACTS[chainId as keyof typeof ITEM_CONTRACTS],
    abi: ITEM_ABI,
    functionName: "totalSupply",
    args: [BigInt(item?.id || "0")],
  });

  const getItemById = (id: string) => items.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-[#e2e8f0]">
          <h2 className="text-2xl font-bold mb-4">Item not found</h2>
          <p>The item you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={handleBack}
        className="mb-4 flex items-center gap-2 px-4 py-2 bg-[#141c27] hover:bg-[#1a2432] text-[#e2e8f0] 
          rounded-lg transition-colors duration-200 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Items
      </button>

      <div className="bg-[#1a2432] border border-[#2a3844] rounded-lg overflow-hidden text-[#e2e8f0] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <p className="text-sm text-gray-400">ID: {item.id}</p>
            {item.socialLinks && item.socialLinks.length > 0 && (
              <div className="flex gap-1 mt-2">
                {item.socialLinks.map((link, index) => {
                  let icon;
                  switch (link.platform) {
                    case 'twitter':
                      icon = <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13.3174 10.7749L19.1457 4H17.7646L12.7852 9.88256L8.80452 4H4L10.0127 12.8955L4 20H5.38119L10.5446 13.7878L14.6981 20H19.5L13.3171 10.7749H13.3174ZM11.1561 12.9999L10.3984 11.9048L5.7489 5.28921H8.16058L11.8555 10.5641L12.6132 11.6593L17.4452 18.5567H15.0335L11.1561 13.0002V12.9999Z"/></svg>;
                      break;
                    case 'warpcast':
                      icon = <MessageCircle className="w-6 h-6" />;
                      break;
                    case 'coingecko':
                      icon = <img src="https://static.coingecko.com/s/thumbnail-007177f3eca19695592f0b8b0eabbdae282b54154e1be912285c9034ea6cbaf2.png" className="w-6 h-6 rounded-full" alt="CoinGecko" />;
                      break;
                    case 'flooz':
                      icon = <img src="https://storage.googleapis.com/iris_buy_bot_logos/-1001907230551_0x0000000000000000000000000000000000000000_0x0000000000000000000000000000000000000000_eth_hub_logo-317e5607-3a0e-46a1-948c-34d89c6b2bd8" className="w-6 h-6 rounded-full" alt="Flooz" />;
                      break;
                    case 'discord':
                      icon = <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" className="w-6 h-6 rounded-full" alt="Discord" />;
                      break;
                    default:
                      icon = <Globe className="w-6 h-6" />;
                  }
                  
                  return (
                    <a 
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 bg-[#141c27] hover:bg-[#1a2432] rounded-full transition-colors duration-200"
                      title={link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                    >
                      {icon}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8">
            <div className="space-y-4">
              <div className="relative bg-[#141c27] rounded-lg p-6 shadow-inner">
                <span
                  className={`absolute top-4 right-4 text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-2 w-fit z-10
                  ${
                    item.rarity === "Common"
                      ? "bg-blue-950 text-blue-200"
                      : item.rarity === "Uncommon"
                      ? "bg-green-900 text-green-200"
                      : item.rarity === "Rare"
                      ? "bg-red-900 text-red-200"
                      : item.rarity === "Epic"
                      ? "bg-purple-900 text-purple-200"
                      : "bg-cyan-900 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                  }`}
                >
                  <img
                    src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/rarities/${item.rarity.toLowerCase()}.png`}
                    alt=""
                    className="w-5 h-5"
                  />
                  {item.rarity}
                </span>
                <img src={item.image} alt={item.name} className="w-full h-64 object-contain" />
              </div>

              <a
                href={`https://opensea.io/assets/base/0xad574f7f4eb563b0ccdcca0d7d7628aeaf071d65/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1da1f2] hover:bg-[#1a91da] 
                  text-white rounded-lg transition-colors duration-200 font-medium shadow-[0_0_10px_rgba(29,161,242,0.3)]
                  w-full"
              >
                <span>Shop on OpenSea</span>
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#141c27] rounded-lg p-6 shadow-inner">
                  <h2 className="text-xl font-semibold mb-4">Description</h2>
                  <p className="text-[#94a3b8]">{item.description}</p>
                </div>

                <div className="bg-[#141c27] rounded-lg p-6 shadow-inner">
                  <h2 className="text-xl font-semibold mb-4">Details</h2>
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                    <span className="text-gray-400">Type:</span>
                    <span>{item.type}</span>
                    {item.slot && (
                      <>
                        <span className="text-gray-400">Slot:</span>
                        <span>{item.slot}</span>
                      </>
                    )}
                    {item.maxSupply && (
                      <>
                        <span className="text-gray-400">Max Supply:</span>
                        <span>{item.maxSupply}</span>
                      </>
                    )}
                    <span className="text-gray-400">Total Supply:</span>
                    <span>{totalSupply ? totalSupply.toString() : "..."}</span>
                    {item.activeCaptureTiers && item.activeCaptureTiers.length > 0 && (
                      <>
                        <span className="text-gray-400">Capture Tiers:</span>
                        <span>
                          {item.activeCaptureTiers.map(tier => {
                            switch(tier) {
                              case '1': return 'Kawaii';
                              case '2': return 'Dragon';
                              case '3': return 'Degen';
                              case '4': return 'Starter';
                              default: return tier;
                            }
                          }).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.impacts.length > 0 && (
                  <div className="bg-[#141c27] rounded-lg p-6 shadow-inner">
                    <h2 className="text-xl font-semibold mb-4">Impacts</h2>
                    <div className="space-y-3">
                      {item.impacts.map((impact, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-gray-400">{impact.type === "Mood" ? "Energy" : impact.type}:</span>
                          <span>
                            {impact.type === "Mood" && !impact.amount && impact.time
                              ? "Max"
                              : impact.amount && `+${impact.amount}`}
                            {impact.time && ` (${impact.time / 3600}h)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.requirements.length > 0 && (
                  <div className="bg-[#141c27] rounded-lg p-6 shadow-inner">
                    <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                    <div className="space-y-3">
                      {item.requirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-gray-400">{req.type}:</span>
                          <span>{req.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.recipe && (
                  <div className="bg-[#141c27] rounded-lg p-6 shadow-inner">
                    <h2 className="text-xl font-semibold mb-4">Recipe</h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        {item.recipe.inputs.map((input: { itemId: string; amount: number }, index: number) => {
                          const inputItem = getItemById(input.itemId);
                          return (
                            <div key={index} className="flex items-center gap-3">
                              {inputItem && (
                                <img src={inputItem.image} alt={inputItem.name} className="w-8 h-8 object-contain" />
                              )}
                              <span className="text-gray-400">{inputItem?.name || input.itemId}:</span>
                              <span>{input.amount}x</span>
                            </div>
                          );
                        })}
                      </div>

                      {item.recipe.requiredSkillLevel && (
                        <div className="flex items-center gap-3 pt-2 border-t border-[#2a3844]">
                          <span className="text-gray-400">Required Crafting Level:</span>
                          <span>{item.recipe.requiredSkillLevel}</span>
                        </div>
                      )}

                      {item.recipe.earnedXpAmount && (
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">XP Earned:</span>
                          <span>+{item.recipe.earnedXpAmount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {item.disassemblyConfig && (
                  <div className="bg-[#141c27] rounded-lg p-6 shadow-inner">
                    <h2 className="text-xl font-semibold mb-4">Disassembly</h2>
                    <div className="space-y-4">
                      {item.disassemblyConfig.guaranteedDrops.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-400 mb-2">Guaranteed Drops</h3>
                          <div className="grid grid-cols-1 gap-2">
                            {item.disassemblyConfig.guaranteedDrops.map((drop, index) => {
                              const dropItem = getItemById(drop.itemId);
                              return (
                                <div key={index} className="flex items-center gap-3">
                                  {dropItem && (
                                    <img src={dropItem.image} alt={dropItem.name} className="w-8 h-8 object-contain" />
                                  )}
                                  <span>{dropItem?.name || drop.itemId}:</span>
                                  <span>{drop.amount}x</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {(item.disassemblyConfig.randomDrop || item.disassemblyConfig.specialDrop) && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-400 mb-2">Random Drops</h3>
                          {item.disassemblyConfig.randomDrop && (
                            <div className="flex items-center gap-3">
                              {(() => {
                                const dropItem = getItemById(item.disassemblyConfig.randomDrop.itemId);
                                return (
                                  <>
                                    {dropItem && (
                                      <img
                                        src={dropItem.image}
                                        alt={dropItem.name}
                                        className="w-8 h-8 object-contain"
                                      />
                                    )}
                                    <span>{dropItem?.name || item.disassemblyConfig.randomDrop.itemId}</span>
                                    <span>
                                      ({item.disassemblyConfig.randomDrop.minAmount}-
                                      {item.disassemblyConfig.randomDrop.maxAmount})
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          {item.disassemblyConfig.specialDrop && (
                            <div className="flex items-center gap-3 mt-2">
                              {(() => {
                                const dropItem = getItemById(item.disassemblyConfig.specialDrop.itemId);
                                return (
                                  <>
                                    {dropItem && (
                                      <img
                                        src={dropItem.image}
                                        alt={dropItem.name}
                                        className="w-8 h-8 object-contain"
                                      />
                                    )}
                                    <span>{dropItem?.name || item.disassemblyConfig.specialDrop.itemId}</span>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
