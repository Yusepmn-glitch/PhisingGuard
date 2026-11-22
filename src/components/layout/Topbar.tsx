import React, { useEffect, useState } from 'react';
import { Menu, Sun, Moon, Cpu, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { scanService } from '../../services/scanService';
import { HealthStatus } from '../../types';

interface TopbarProps {
  onOpenMobile: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobile, title }) => {
  const { theme, toggleTheme } = useTheme();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function checkEngine() {
      try {
        const data = await scanService.checkHealth();
        if (isMounted) {
          setHealth(data);
          setIsOnline(data.status === 'healthy' && data.model_status === 'ready');
        }
      } catch {
        if (isMounted) {
          setIsOnline(false);
          setHealth(null);
        }
      }
    }
    checkEngine();
    const interval = setInterval(checkEngine, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="h-16 bg-[#1A1D27]/80 backdrop-blur-md border-b border-[#2E3347] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#252836]"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-base sm:text-lg font-semibold text-[#F8FAFC] truncate">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl bg-[#252836] border border-[#2E3347] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#6366F1]/40 transition-all cursor-pointer flex items-center gap-1.5"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-xs font-medium hidden md:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-[#818CF8]" />
              <span className="text-xs font-medium hidden md:inline">Dark</span>
            </>
          )}
        </button>

        {/* Model Engine Status */}
        <div className="flex items-center gap-2 pl-2 sm:border-l border-[#2E3347]">
          {isOnline ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block animate-pulse"></span>
              <span className="hidden sm:inline">Engine Online (v{health?.model_version || '3.0'})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] text-xs font-medium" title="FastAPI server unreachable">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] inline-block"></span>
              <span className="hidden sm:inline">Backend Offline</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
