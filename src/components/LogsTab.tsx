/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { History, Eye, Search, Filter, ShieldCheck, KeyRound, Monitor, Shield, Info, ArrowDownAZ } from 'lucide-react';
import { ActionLog, SessionLog } from '../types';

interface LogsTabProps {
  actionLogs: ActionLog[];
  sessionLogs: SessionLog[];
}

export default function LogsTab({ actionLogs, sessionLogs }: LogsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'actions' | 'sessions'>('actions');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const actionTypes = useMemo(() => {
    const list = new Set(actionLogs.map(l => l.actionType).filter(Boolean));
    return Array.from(list).sort();
  }, [actionLogs]);

  // Filter logs
  const filteredActions = useMemo(() => {
    return actionLogs.filter(log => {
      const fieldString = `${log.userEmail} ${log.description} ${log.actionType} ${log.userRole}`.toLowerCase();
      const matchesSearch = fieldString.includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || log.actionType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [actionLogs, searchTerm, typeFilter]);

  const filteredSessions = useMemo(() => {
    return sessionLogs.filter(session => {
      const fieldString = `${session.userEmail} ${session.userRole} ${session.userAgent} ${session.ipAddress}`.toLowerCase();
      return fieldString.includes(searchTerm.toLowerCase());
    });
  }, [sessionLogs, searchTerm]);

  // Role color styles
  const roleColors = {
    Superadmin: 'bg-orange-100 text-orange-700 border-orange-200 font-bold',
    Admin: 'bg-blue-105 bg-blue-100 text-blue-700 border-blue-200 font-bold',
    Visiteur: 'bg-gray-100 text-gray-600 border-gray-200 font-bold'
  };

  return (
    <div className="space-y-6">
      {/* Tab introduction and toggle bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-850 text-gray-800 tracking-tight">Journaux d'Historiques & Audit</h2>
          <p className="text-gray-500 text-xs mt-1">
            Traçabilité totale des sessions actives et des actions d'émargement entreprises sur l'application.
          </p>
        </div>

        {/* Subtab toggles */}
        <div className="flex bg-gray-100 rounded p-1 text-xs font-semibold self-stretch md:self-auto border border-gray-200 shadow-sm">
          <button
            onClick={() => { setActiveSubTab('actions'); setSearchTerm(''); }}
            className={`px-4 py-1.5 rounded transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'actions' 
                ? 'bg-white text-gray-905 text-gray-900 border border-gray-200 shadow-sm font-bold' 
                : 'text-gray-500 hover:text-gray-850 hover:text-gray-800 font-medium'
            }`}
          >
            <History className="w-4 h-4 shrink-0 text-blue-600" />
            <span>Historiques d'Actions ({actionLogs.length})</span>
          </button>
          
          <button
            onClick={() => { setActiveSubTab('sessions'); setSearchTerm(''); }}
            className={`px-4 py-1.5 rounded transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'sessions' 
                ? 'bg-white text-gray-905 text-gray-900 border border-gray-200 shadow-sm font-bold' 
                : 'text-gray-500 hover:text-gray-850 hover:text-gray-800 font-medium'
            }`}
          >
            <KeyRound className="w-4 h-4 shrink-0 text-green-600" />
            <span>Sessions de Connexion ({sessionLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Searching filters card for logs */}
      <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeSubTab === 'actions' ? "Rechercher une action par email, mot-clé, rôle..." : "Rechercher par adresse email, navigateur, IP..."}
            className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md shadow-sm placeholder-gray-400"
          />
        </div>

        {activeSubTab === 'actions' ? (
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <option value="all">Tous les types d'actions</option>
              {actionTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2 rounded-md shadow-sm">
            <Monitor className="w-4 h-4 text-green-500 mr-2 shrink-0" />
            <span>Suivi des hôtes IP et navigateurs</span>
          </div>
        )}
      </div>

      {/* DATA VIEWBOARDS */}

      {activeSubTab === 'actions' ? (
        /* TAB 1: ACTION LOGS TABLE */
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-105 bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Type Action</th>
                  <th className="py-3 px-4">Utilisateur (Email)</th>
                  <th className="py-3 px-4">Rôle</th>
                  <th className="py-3 px-5">Description de l'action accomplie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {filteredActions.length > 0 ? (
                  filteredActions.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3 px-4 text-gray-500 font-mono text-[10px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[10px] bg-gray-150 bg-gray-100 text-gray-800 px-2 py-0.5 rounded border font-mono">
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {log.userEmail}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${roleColors[log.userRole as keyof typeof roleColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-gray-700 max-w-sm font-semibold">
                        {log.description}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-500">
                      Aucune action listée dans l'audit correspondante.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: SESSION LOGS TABLE */
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-105 bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4">Rôle</th>
                  <th className="py-3 px-4">Heure de Connexion</th>
                  <th className="py-3 px-4">Dernière activité</th>
                  <th className="py-3 px-4">Déconnexion Heure</th>
                  <th className="py-3 px-3">Origine (IP)</th>
                  <th className="py-3 px-5">Agent Navigateur</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((sess) => {
                    const isActive = !sess.logoutTime;
                    
                    return (
                      <tr key={sess.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-800">
                          {sess.userEmail}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${roleColors[sess.userRole as keyof typeof roleColors]}`}>
                            {sess.userRole}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-mono text-[10px]">
                          {new Date(sess.loginTime).toLocaleTimeString('fr-FR')} - {new Date(sess.loginTime).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-mono text-[10px]">
                          {new Date(sess.lastActivityTime).toLocaleTimeString('fr-FR')}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-mono text-[10px]">
                          {sess.logoutTime ? (
                            `${new Date(sess.logoutTime).toLocaleTimeString('fr-FR')} - ${new Date(sess.logoutTime).toLocaleDateString('fr-FR')}`
                          ) : (
                            <span className="text-gray-400 font-mono italic">- En cours -</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-gray-650 text-gray-600 font-mono">
                          {sess.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="py-3.5 px-5 text-gray-400 font-mono text-[10px] truncate max-w-[200px]" title={sess.userAgent}>
                          {sess.userAgent}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                              Expirée
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-500">
                      Aucun historique de session correspondant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
