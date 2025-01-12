import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300 z-50
        ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} 
        ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <span className="text-white">{message}</span>
      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
} 