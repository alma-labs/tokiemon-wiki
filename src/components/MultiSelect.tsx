import { useState, useRef, useEffect } from 'react';
import { Filter, Check } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}

export function MultiSelect({ options, selected, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center gap-2 w-full cursor-pointer py-2 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="w-5 h-5 text-gray-400" />
        <span className="flex-1 text-left">
          {selected.length ? selected.join(', ') : placeholder}
        </span>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg">
          {options.map(option => (
            <div
              key={option}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-600 cursor-pointer"
              onClick={() => toggleOption(option)}
            >
              <div className="w-4 h-4 border border-gray-400 rounded flex items-center justify-center">
                {selected.includes(option) && (
                  <Check className="w-3 h-3 text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-white">
                {placeholder === "All Rarities" && (
                  <img 
                    src={`https://raw.githubusercontent.com/alma-labs/tokiemon-lists/main/assets/rarities/${option.toLowerCase()}.png`}
                    alt=""
                    className="w-4 h-4"
                  />
                )}
                <span>{option}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 