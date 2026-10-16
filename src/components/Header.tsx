import React from 'react';
import { UserRole, AppSettings } from '../types';
import {
  ShieldAlert,
  UserCheck,
  Settings,
  LogOut,
  HeartHandshake,
} from 'lucide-react';

interface HeaderProps {
  role: UserRole;
  settings: AppSettings;
  isSyncing?: boolean;
  onRefreshData?: () => void;
  onOpenSettings: () => void;
  onOpenGuide?: () => void;
  onOpenLogin: () => void;
  onLogoutAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  settings,
  onOpenSettings,
  onOpenLogin,
  onLogoutAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-inner border border-emerald-400/30">
            <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-white shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white truncate">
                {settings.appName}
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-800 border border-emerald-700 text-emerald-200 shrink-0">
                v2.0
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-emerald-200 font-medium truncate max-w-[160px] xs:max-w-[220px] sm:max-w-none">
              {settings.organizationName}
            </p>
          </div>
        </div>

        {/* Right Action Icons & Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Role Status Pill & Action */}
          {role === 'admin' ? (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Admin (Sesi Aktif)</span>
                <span className="sm:hidden">Admin</span>
              </span>
              <button
                onClick={onOpenSettings}
                title="Pengaturan Aplikasi & Google Sheets"
                className="p-1.5 sm:p-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 hover:text-white transition-colors shrink-0 flex items-center justify-center"
              >
                <Settings className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={onLogoutAdmin}
                title="Keluar dari Admin"
                className="p-1.5 sm:p-2 rounded-lg bg-emerald-800/80 hover:bg-rose-900/80 text-emerald-200 hover:text-white transition-colors shrink-0 flex items-center justify-center"
              >
                <LogOut className="w-4 h-4 shrink-0" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-700 rounded-full text-xs font-semibold transition-all active:scale-95 shrink-0 whitespace-nowrap"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="text-[11px] font-bold">Login Admin</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};

