/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User as UserType, Ticket, ActionLog, SessionLog, UserRole } from './types';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import DashboardTab from './components/DashboardTab';
import TicketsTab from './components/TicketsTab';
import AdminTab from './components/AdminTab';
import LogsTab from './components/LogsTab';
import { Shield } from 'lucide-react';

export default function App() {
  // Authentication states
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Data lists states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);

  // Filtering drill-down state across views
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('all');

  // Loading indicator states
  const [dataLoading, setDataLoading] = useState(false);

  // Sync data whenever token changes
  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  // Fetch all core data components from the full-stack server
  const fetchAllData = async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Tickets
      const resTickets = await fetch('/api/tickets', { headers });
      if (resTickets.ok) {
        const data = await resTickets.json();
        setTickets(data);
      } else if (resTickets.status === 401) {
        handleLogout();
        return;
      }

      // 2. Fetch Users Directory (restricted internally to non-visitors)
      if (currentUser && currentUser.role !== 'Visiteur') {
        const resUsers = await fetch('/api/users', { headers });
        if (resUsers.ok) {
          const data = await resUsers.json();
          setUsersList(data);
        }
      }

      // 3. Fetch logs and session login trail
      const resActions = await fetch('/api/logs/actions', { headers });
      const resSessions = await fetch('/api/logs/sessions', { headers });

      if (resActions.ok) setActionLogs(await resActions.json());
      if (resSessions.ok) setSessionLogs(await resSessions.json());

    } catch (error) {
      console.error("Erreur de récupération des données :", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLoginSuccess = (newToken: string, user: UserType) => {
    setToken(newToken);
    setCurrentUser(user);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setToken(null);
      setCurrentUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setActiveTab('dashboard');
    }
  };

  // Helper routine for PUT/POST/DELETE API calls
  const executeApiRequest = async (url: string, method: string, bodyObj?: any) => {
    if (!token) throw new Error('Déconnecté.');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    const config: RequestInit = {
      method,
      headers,
      ...(bodyObj && { body: JSON.stringify(bodyObj) })
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `La requête a échoué (${response.status})`);
    }

    return data;
  };

  // Core action handlers communicating to backend

  const onTicketStatusChange = async (ticketId: string, checked: boolean) => {
    try {
      await executeApiRequest(`/api/tickets/${ticketId}`, 'PUT', { checked });
      await fetchAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const onTicketDelete = async (ticketId: string) => {
    await executeApiRequest(`/api/tickets/${ticketId}`, 'DELETE');
    await fetchAllData();
  };

  const onTicketCreate = async (formData: any) => {
    await executeApiRequest('/api/tickets', 'POST', formData);
    await fetchAllData();
  };

  const onTicketUpdate = async (ticketId: string, formData: any) => {
    await executeApiRequest(`/api/tickets/${ticketId}`, 'PUT', formData);
    await fetchAllData();
  };

  const onImportBulk = async (importedTicketsList: Partial<Ticket>[]) => {
    const res = await executeApiRequest('/api/tickets/import', 'POST', { importedTickets: importedTicketsList });
    await fetchAllData();
    return res;
  };

  const onUserCreate = async (userData: any) => {
    await executeApiRequest('/api/users', 'POST', userData);
    await fetchAllData();
  };

  const onRoleChange = async (userId: string, role: UserRole) => {
    await executeApiRequest(`/api/users/${userId}/role`, 'PUT', { role });
    await fetchAllData();
  };

  const onUserDelete = async (userId: string) => {
    await executeApiRequest(`/api/users/${userId}`, 'DELETE');
    await fetchAllData();
  };

  const onResetDatabase = async () => {
    await executeApiRequest('/api/tickets/reset', 'POST');
    await fetchAllData();
  };

  // Quick action from dashboard to tickets with pre-filled filters
  const handleSelectEntityFromDashboard = (entityName: string) => {
    setSelectedEntityFilter(entityName);
    setActiveTab('tickets');
  };

  // Authenticate render guard
  if (!token || !currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Dynamic Sidebar */}
      <Sidebar 
        currentUser={currentUser} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* Main View Area Container */}
      <main className="flex-1 overflow-y-auto relative p-6 md:p-8 space-y-6">
        
        {/* Loading overlay spinner indicator */}
        {dataLoading && (
          <div className="absolute top-4 right-4 z-40 bg-white/80 border border-slate-150 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-sm text-xs text-indigo-700 font-semibold backdrop-blur-xs select-none">
            <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            <span>Mise à jour automatique...</span>
          </div>
        )}

        {/* Tab switcher renderer */}
        {activeTab === 'dashboard' && (
          <DashboardTab 
            tickets={tickets} 
            onSelectEntity={handleSelectEntityFromDashboard} 
          />
        )}

        {activeTab === 'tickets' && (
          <TicketsTab
            tickets={tickets}
            currentUser={currentUser}
            selectedEntityFilter={selectedEntityFilter}
            setSelectedEntityFilter={setSelectedEntityFilter}
            onRefresh={fetchAllData}
            onTicketStatusChange={onTicketStatusChange}
            onTicketDelete={onTicketDelete}
            onTicketCreate={onTicketCreate}
            onTicketUpdate={onTicketUpdate}
            onImportBulk={onImportBulk}
          />
        )}

        {activeTab === 'admin' && (
          <AdminTab
            currentUser={currentUser}
            usersList={usersList}
            onUserCreate={onUserCreate}
            onRoleChange={onRoleChange}
            onUserDelete={onUserDelete}
            onResetDatabase={onResetDatabase}
          />
        )}

        {activeTab === 'logs' && (
          <LogsTab 
            actionLogs={actionLogs} 
            sessionLogs={sessionLogs} 
          />
        )}
      </main>
    </div>
  );
}
