/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, CheckCircle2, XCircle, TrendingUp, Sparkles, FolderKanban, Users2, DollarSign } from 'lucide-react';
import { Ticket } from '../types';

interface DashboardTabProps {
  tickets: Ticket[];
  onSelectEntity: (entityName: string) => void;
}

export default function DashboardTab({ tickets, onSelectEntity }: DashboardTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'alpha' | 'highest' | 'lowest' | 'volume'>('highest');
  const [filterAlert, setFilterAlert] = useState<'all' | 'delayed' | 'completed'>('all');

  // Group tickets dynamically by entity (handles infinite scale, perfectly matching 50+ entities)
  const entitiesData = useMemo(() => {
    const groups: Record<string, { name: string; responsibleName: string; total: number; checked: number; revenue: number }> = {};
    
    tickets.forEach(ticket => {
      const eName = ticket.entityName || 'Sans Entité';
      if (!groups[eName]) {
        groups[eName] = {
          name: eName,
          responsibleName: ticket.responsibleName || 'Non assigné',
          total: 0,
          checked: 0,
          revenue: 0
        };
      }
      
      groups[eName].total += 1;
      if (ticket.checked) {
        groups[eName].checked += 1;
      }
      if (ticket.paymentStatus === 'Payé' && ticket.price) {
        groups[eName].revenue += ticket.price;
      }
    });

    return Object.values(groups);
  }, [tickets]);

  // Global Metrics calculation
  const metrics = useMemo(() => {
    const total = tickets.length;
    const checked = tickets.filter(t => t.checked).length;
    const unchecked = total - checked;
    const checkRate = total > 0 ? Math.round((checked / total) * 100) : 0;
    
    const revenue = tickets
      .filter(t => t.paymentStatus === 'Payé')
      .reduce((sum, t) => sum + (t.price || 0), 0);

    const pendingPayment = tickets
      .filter(t => t.paymentStatus === 'En attente')
      .reduce((sum, t) => sum + (t.price || 0), 0);

    const totalEntitiesCount = entitiesData.length;

    return {
      total,
      checked,
      unchecked,
      checkRate,
      revenue,
      pendingPayment,
      totalEntitiesCount
    };
  }, [tickets, entitiesData]);

  // Search, sort, and filter the 50+ entities list
  const filteredAndSortedEntities = useMemo(() => {
    return entitiesData
      .filter(entity => {
        const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              entity.responsibleName.toLowerCase().includes(searchTerm.toLowerCase());
        
        const rate = entity.total > 0 ? (entity.checked / entity.total) * 100 : 0;
        if (filterAlert === 'delayed') {
          return matchesSearch && rate < 40; // Alert for check-in rates under 40%
        }
        if (filterAlert === 'completed') {
          return matchesSearch && rate === 100; // Highlight 100% completed checking
        }
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'alpha') {
          return a.name.localeCompare(b.name);
        }
        const rateA = a.total > 0 ? a.checked / a.total : 0;
        const rateB = b.total > 0 ? b.checked / b.total : 0;
        if (sortBy === 'highest') {
          return rateB - rateA;
        }
        if (sortBy === 'lowest') {
          return rateA - rateB;
        }
        if (sortBy === 'volume') {
          return b.total - a.total;
        }
        return 0;
      });
  }, [entitiesData, searchTerm, sortBy, filterAlert]);

  // Quick stats computed for the alert banner
  const slowEntitiesCount = useMemo(() => {
    return entitiesData.filter(e => e.total > 0 && (e.checked / e.total < 0.4)).length;
  }, [entitiesData]);

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider w-max mb-2 border border-blue-250">
            <Sparkles className="w-3 h-3" />
            <span>Synthèse Événementielle</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Tableau de Bord Général</h2>
          <p className="text-gray-500 text-xs mt-1 max-w-xl font-medium">
            Suivi temps-réel de l'émargement et du checking des billets pour les <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded border border-blue-200">{metrics.totalEntitiesCount} entités</span> de l'organisation.
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl self-stretch md:self-auto flex items-center gap-4 text-left">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Taux de Checking Global</div>
            <div className="text-3xl font-black font-mono text-blue-600 mt-0.5">{metrics.checkRate}%</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 flex items-center justify-center font-bold text-xs text-gray-700">
            {metrics.checked}/{metrics.total}
          </div>
        </div>
      </div>

      {/* Global Counters Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">Total Tickets</p>
          <p className="text-2xl font-black mt-1 text-gray-900">{metrics.total.toLocaleString('fr-FR')}</p>
          <div className="text-[10px] text-gray-400 font-semibold font-mono mt-2">{metrics.totalEntitiesCount} entités uniques</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">Checked-In</p>
          <p className="text-2xl font-black mt-1 text-blue-600">
            {metrics.checked} <span className="text-xs font-normal text-gray-400 ml-1">({metrics.checkRate}%)</span>
          </p>
          <div className="text-[10px] text-emerald-600 font-semibold mt-2">Billets présentés & validés</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">Pending Tickets</p>
          <p className="text-2xl font-black mt-1 text-red-500">
            {metrics.unchecked}
          </p>
          <div className="text-[10px] text-red-400 font-semibold mt-2">Billets restants à checker</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">Chiffre d'Affaires</p>
          <p className="text-2xl font-black mt-1 text-gray-900">{(metrics.revenue).toLocaleString('fr-FR')} €</p>
          <div className="text-[10px] text-blue-600 font-semibold font-mono mt-2">{(metrics.pendingPayment).toLocaleString('fr-FR')} € en attente</div>
        </div>
      </div>

      {/* Grid Filtering controls */}
      <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-gray-800 text-sm">Ticket Distribution & Tracking</h3>
            <p className="text-xs text-gray-400">Suivi et avancement individuel par service (Total de 50+ entités)</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by checking status */}
            <div className="flex gap-1 border border-gray-200 rounded-md p-1 bg-gray-50 text-xs font-semibold">
              <button
                onClick={() => setFilterAlert('all')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${filterAlert === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Toutes ({metrics.totalEntitiesCount})
              </button>
              <button
                onClick={() => setFilterAlert('delayed')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${filterAlert === 'delayed' ? 'bg-red-600 text-white shadow-sm' : 'text-red-600 hover:text-red-800'}`}
              >
                Retards ({slowEntitiesCount})
              </button>
              <button
                onClick={() => setFilterAlert('completed')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${filterAlert === 'completed' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Terminées
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 border border-gray-200 bg-white rounded-md px-3 py-1.5 text-gray-600 text-xs font-semibold select-none shadow-sm">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              <span>Trier par :</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="focus:outline-none bg-transparent cursor-pointer font-bold text-blue-600 pr-1 ml-0.5 border-none text-xs"
              >
                <option value="highest">Checking décroissant</option>
                <option value="lowest">Checking croissant</option>
                <option value="volume">Quantité de billets</option>
                <option value="alpha">Ordre alphabétique</option>
              </select>
            </div>
          </div>
        </div>

        {/* Input search box */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter entities..."
            className="w-full text-xs font-medium pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md transition-all placeholder-gray-400 shadow-sm"
          />
        </div>
      </div>

      {/* Dynamic 50+ Entities Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedEntities.length > 0 ? (
          filteredAndSortedEntities.map((entity) => {
            const percent = entity.total > 0 ? Math.round((entity.checked / entity.total) * 100) : 0;
            const remaining = entity.total - entity.checked;
            
            // Choose color representation depending on percentage
            let statusColor = "bg-red-100 text-red-700 border-red-200";
            let barColor = "bg-red-500";
            if (percent === 100) {
              statusColor = "bg-green-100 text-green-700 border-green-200";
              barColor = "bg-green-500";
            } else if (percent >= 70) {
              statusColor = "bg-blue-100 text-blue-700 border-blue-200";
              barColor = "bg-blue-600";
            } else if (percent >= 40) {
              statusColor = "bg-yellow-105 bg-yellow-100 text-yellow-700 border-yellow-250";
              barColor = "bg-yellow-500";
            }

            return (
              <div
                key={entity.name}
                onClick={() => onSelectEntity(entity.name)}
                className="bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md rounded-xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] bg-gray-100 text-gray-600 font-mono font-semibold px-2 py-0.5 rounded truncate max-w-[120px]">
                      {entity.name.split(' - ')[0]}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${statusColor}`}>
                      {percent}% Paid
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-2 mt-1 min-h-[40px]">
                    {entity.name.split(' - ')[1] || entity.name}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium pt-1">
                    <Users2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate" title={`Responsable : ${entity.responsibleName}`}>
                      Resp: <strong className="text-gray-700 font-semibold">{entity.responsibleName}</strong>
                    </span>
                  </div>
                </div>

                {/* Progress bar visual and status details */}
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
                    <span>Valide: <strong>{entity.checked}</strong></span>
                    <span>Total tickets: <strong>{entity.total}</strong></span>
                  </div>
                  
                  {/* Outer Bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>

                  {remaining > 0 ? (
                    <div className="text-[9px] text-gray-400 text-right font-semibold">
                      {remaining} billets restants à checker
                    </div>
                  ) : (
                    <div className="text-[9px] text-green-600 font-bold text-right flex items-center justify-end gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                      Émargement complet
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 bg-white border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center p-6 shadow-sm">
            <Search className="w-10 h-10 text-gray-300 animate-pulse-slow mb-3" />
            <p className="font-bold text-gray-700 text-sm">Aucune entité trouvée</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Essayez d'ajuster votre recherche ou filtrez par une autre catégorie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
