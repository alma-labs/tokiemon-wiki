import { Item } from "../types";
import { Gift, Target, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

interface ItemGridProps {
  items: Item[];
}

export default function ItemGrid({ items }: ItemGridProps) {
  const scrollPosition = useRef(0);

  useEffect(() => {
    // Restore scroll position when component mounts
    const savedPosition = sessionStorage.getItem('itemGridScroll');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
      sessionStorage.removeItem('itemGridScroll');
    }
  }, []);

  const handleItemClick = () => {
    // Save current scroll position before navigating
    scrollPosition.current = window.scrollY;
    sessionStorage.setItem('itemGridScroll', scrollPosition.current.toString());
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/items/${item.id}`}
          onClick={handleItemClick}
          className="bg-[#1a2432] rounded border border-[#2a3844] shadow-[0_0_10px_rgba(0,0,0,0.5)] 
            hover:shadow-[0_0_15px_rgba(0,0,0,0.7)] transition-shadow duration-200
            transform hover:scale-105 transition-transform duration-200"
        >
          <div className="p-3 md:p-4">
            <div className="relative bg-[#141c27] rounded p-2 mb-3 shadow-inner">
              {item.socialLinks && item.socialLinks.length > 0 && (
                <div className="absolute top-0 left-0 w-full h-full border-2 border-yellow-400 rounded pointer-events-none" style={{ boxShadow: '0 0 10px rgba(250, 204, 21, 0.5)' }}></div>
              )}
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                {item.excludeLootbox === false && (
                  <div className="bg-[#1a2432]/80 p-1.5 rounded-full group">
                    <Gift className="w-4 h-4 text-cyan-400" />
                    <div
                      className="absolute invisible group-hover:visible bg-black/90 text-white text-xs py-1 px-2 rounded 
                      -bottom-8 right-0 whitespace-nowrap z-10"
                    >
                      Is/Was Available in Lootbox
                    </div>
                  </div>
                )}
                {item.activeCaptureTiers && item.activeCaptureTiers.length > 0 && (
                  <div className="bg-[#1a2432]/80 p-1.5 rounded-full group">
                    <Target className="w-4 h-4 text-green-400" />
                    <div
                      className="absolute invisible group-hover:visible bg-black/90 text-white text-xs py-1 px-2 rounded 
                      -bottom-8 right-0 whitespace-nowrap z-10"
                    >
                      Available in Capture
                    </div>
                  </div>
                )}
                {item.socialLinks && item.socialLinks.length > 0 && (
                  <div className="bg-[#1a2432]/80 p-1.5 rounded-full group">
                    <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                    <div
                      className="absolute invisible group-hover:visible bg-black/90 text-white text-xs py-1 px-2 rounded 
                      -bottom-8 right-0 whitespace-nowrap z-10"
                    >
                      Partner Item
                    </div>
                  </div>
                )}
              </div>
              <img src={item.image} alt={item.name} className="w-full h-32 md:h-48 object-contain" />
            </div>
            <h3 className="text-base md:text-lg font-bold mb-2 truncate text-[#e2e8f0]">
              {item.name}
              {item.socialLinks && item.socialLinks.length > 0 && (
                <span className="ml-1 inline-flex items-center">
                  <Star className="w-3 h-3 text-yellow-400 inline" fill="currentColor" />
                </span>
              )}
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <span className="text-xs md:text-sm font-medium text-[#94a3b8]">{item.type}</span>
                <span
                  className={`text-xs md:text-sm font-medium px-2 py-1 rounded-full flex items-center gap-1 w-fit
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
                    className="w-3 h-3 md:w-4 md:h-4"
                  />
                  {item.rarity}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 text-[10px] text-[#94a3b8]/70">
                {item.impacts.map((impact, index) => (
                  <span key={index} className="flex items-center">
                    {impact.type === "Mood" ? "Energy" : impact.type}
                    {impact.type === "Mood" && !impact.amount && impact.time ? (
                      <span className="text-green-400/70">Max</span>
                    ) : (
                      impact.amount && <span className="text-green-400/70">+{impact.amount}</span>
                    )}
                    {impact.time && <span className="text-blue-400/70">{(impact.time / 3600).toFixed(2)}h</span>}
                    {index < item.impacts.length - 1 && "·"}
                  </span>
                ))}
                {item.impacts.length > 0 && item.requirements.length > 0 && " | "}
                {item.requirements.map((req, index) => (
                  <span key={index} className="flex items-center">
                    {req.type}
                    <span className="text-yellow-400/70">{req.amount}</span>
                    {index < item.requirements.length - 1 && "·"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
