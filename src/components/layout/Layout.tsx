import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const location = useLocation();

  // Page title mapping
  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case '/': return 'Cybersecurity Command Center';
      case '/scanner': return 'URL Feature Extraction & Scanner';
      case '/history': return 'Inspection Logs & Scan History';
      case '/evaluation': return 'Random Forest Classifier Metrics';
      case '/about': return 'Architecture & System Documentation';
      case '/settings': return 'System Preferences';
      default: return 'PhishingGuard';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] flex">
      <Sidebar 
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
        collapsed ? 'lg:pl-[72px]' : 'lg:pl-[240px]'
      }`}>
        <Topbar 
          onOpenMobile={() => setMobileOpen(true)}
          title={getPageTitle(location.pathname)}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>

        <footer className="py-4 px-6 border-t border-[#2E3347] text-center sm:text-left text-xs text-[#64748B] flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            PhishingGuard &copy; 2026. UAS Keamanan Informasi — Model Machine Learning Random Forest.
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Dark-First Sentinel Precision</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
