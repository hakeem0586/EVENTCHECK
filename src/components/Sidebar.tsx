/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, Ticket, ShieldAlert, History, LogOut, User, Activity } from 'lucide-react';
import { User as UserType } from '../types';

interface SidebarProps {
  currentUser: UserType;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentUser, activeTab, setActiveTab, onLogout }: SidebarProps) {
  const isVisitor = currentUser.role === 'Visiteur';
  const roleColors = {
    Superadmin: 'text-orange-400',
    Admin: 'text-blue-400',
    Visiteur: 'text-gray-400'
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Entities Tracking', icon: Ticket }
  ];

  // Admin access restricted tabs
  const adminItems = [
    { id: 'admin', label: 'User Management', icon: ShieldAlert, minRole: ['Superadmin', 'Admin'] },
    { id: 'logs', label: 'System Logs', icon: History }
  ];

  return (
    <aside className="w-64 bg-[#1F2937] flex flex-col border-r border-gray-700 h-screen text-gray-300 shrink-0">
      {/* Brand logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center font-bold text-white text-sm select-none">SB</div>
          <span className="text-white font-semibold text-lg tracking-tight uppercase">Suivi Billets</span>
        </div>
      </div>

      {/* Main navigation menu navigation list */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">Main Menu</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 border-l-4 text-xs font-medium tracking-wide transition-all cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="mt-6 px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">Administration</div>
        {adminItems.map((item) => {
          // If the menu item has restricted role
          if (item.minRole && !item.minRole.includes(currentUser.role)) {
            return (
              <div
                key={item.id}
                className="w-full flex items-center px-6 py-3 text-gray-600 opacity-40 select-none text-xs font-medium cursor-not-allowed"
                title="Accès réservé aux administrateurs"
              >
                <item.icon className="w-4 h-4 mr-3 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <span className="text-[9px] bg-gray-800 px-1.5 py-0.5 rounded font-bold">Bloqué</span>
              </div>
            );
          }

          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 border-l-4 text-xs font-medium tracking-wide transition-all cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System status & exit trigger in footer */}
      <div className="p-6 border-t border-gray-700 bg-gray-900 space-y-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold select-none text-sm shrink-0">
            {currentUser.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-orange-400 truncate font-semibold uppercase tracking-wider">{currentUser.role}</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-800">
          <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono bg-emerald-950/20 px-2 py-1.5 rounded border border-emerald-900/20 leading-none">
            <Activity className="w-3 h-3 animate-pulse text-emerald-500" />
            <span>Synchronisé en direct</span>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gray-800 hover:bg-red-900/60 hover:text-red-200 text-gray-400 hover:text-white rounded border border-gray-700 text-xs font-medium tracking-wide transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
