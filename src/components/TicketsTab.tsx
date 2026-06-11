/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, Plus, FileSpreadsheet, Download, RefreshCw, CheckCircle, XCircle, 
  Trash2, Edit, Check, AlertTriangle, HelpCircle, ArrowUpRight, X, Sparkles, Filter
} from 'lucide-react';
import { Ticket, User as UserType } from '../types';
import { parseExcelOrCsv, exportToExcel } from '../utils/excel';

interface TicketsTabProps {
  tickets: Ticket[];
  currentUser: UserType;
  selectedEntityFilter: string;
  setSelectedEntityFilter: (entity: string) => void;
  onRefresh: () => void;
  onTicketStatusChange: (id: string, checked: boolean) => Promise<void>;
  onTicketDelete: (id: string) => Promise<void>;
  onTicketCreate: (ticketData: any) => Promise<void>;
  onTicketUpdate: (id: string, updatedData: any) => Promise<void>;
  onImportBulk: (importedTickets: Partial<Ticket>[]) => Promise<any>;
}

export default function TicketsTab({
  tickets,
  currentUser,
  selectedEntityFilter,
  setSelectedEntityFilter,
  onRefresh,
  onTicketStatusChange,
  onTicketDelete,
  onTicketCreate,
  onTicketUpdate,
  onImportBulk
}: TicketsTabProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [checkingFilter, setCheckingFilter] = useState<'all' | 'checked' | 'unchecked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [importedTempList, setImportedTempList] = useState<Partial<Ticket>[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<{ success: number; dup: number } | null>(null);

  // Form states (Add/Edit)
  const [formData, setFormData] = useState({
    ticketNumber: '',
    holderName: '',
    entityName: '',
    responsibleName: '',
    paymentStatus: 'En attente' as Ticket['paymentStatus'],
    category: 'Standard',
    price: 0,
    checked: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isReadOnly = currentUser.role === 'Visiteur';

  // Compute unique lists for options
  const uniqueEntities = useMemo(() => {
    const list = new Set(tickets.map(t => t.entityName).filter(Boolean));
    return Array.from(list).sort();
  }, [tickets]);

  const uniqueCategories = useMemo(() => {
    const list = new Set(tickets.map(t => t.category).filter(Boolean));
    return Array.from(list).sort();
  }, [tickets]);

  // Filtered tickets logic
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const fieldString = `${t.ticketNumber} ${t.holderName} ${t.entityName} ${t.responsibleName}`.toLowerCase();
      const matchesSearch = fieldString.includes(searchTerm.toLowerCase());
      
      const matchesEntity = selectedEntityFilter === 'all' || t.entityName === selectedEntityFilter;
      const matchesPayment = paymentFilter === 'all' || t.paymentStatus === paymentFilter;
      const matchesChecking = checkingFilter === 'all' || 
                            (checkingFilter === 'checked' && t.checked) || 
                            (checkingFilter === 'unchecked' && !t.checked);
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

      return matchesSearch && matchesEntity && matchesPayment && matchesChecking && matchesCategory;
    });
  }, [tickets, searchTerm, selectedEntityFilter, paymentFilter, checkingFilter, categoryFilter]);

  // Handle local checked toggles
  const handleToggleChecked = async (ticket: Ticket) => {
    if (isReadOnly) {
      alert("Mode Lecture seule : Vous devez posséder le rôle Admin ou Superadmin pour émarger un billet.");
      return;
    }
    // Optimistic UI updates could be nice, but directly trigger state reload
    await onTicketStatusChange(ticket.id, !ticket.checked);
  };

  // Trigger Excel parse on select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportLoading(true);
      const list = await parseExcelOrCsv(file);
      setImportedTempList(list);
      setIsImportConfirmOpen(true);
    } catch (err: any) {
      alert(`Erreur lors de l'analyse du fichier Excel : ${err.message || err}`);
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const executeBulkImport = async () => {
    try {
      setImportLoading(true);
      const result = await onImportBulk(importedTempList);
      setImportSummary({ success: result.successCount, dup: result.duplicateCount });
      setImportedTempList([]);
      setTimeout(() => {
        setIsImportConfirmOpen(false);
        setImportSummary(null);
      }, 3500);
    } catch (err: any) {
      alert(`Échec de l'importation global: ${err.message || err}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleExport = () => {
    exportToExcel(filteredTickets, `suivi_billets_${selectedEntityFilter === 'all' ? 'complet' : selectedEntityFilter.replace(/\s+/g, '_')}.xlsx`);
  };

  // CRU handlers
  const openAddModal = () => {
    setFormData({
      ticketNumber: `TIK-${Math.floor(1000 + Math.random() * 9000)}`,
      holderName: '',
      entityName: selectedEntityFilter !== 'all' ? selectedEntityFilter : '',
      responsibleName: '',
      paymentStatus: 'En attente',
      category: 'Standard',
      price: 45,
      checked: false
    });
    setIsAddOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.holderName || !formData.entityName || !formData.responsibleName || !formData.ticketNumber) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    try {
      await onTicketCreate(formData);
      setIsAddOpen(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message || err}`);
    }
  };

  const openEditModal = (t: Ticket) => {
    setEditingTicket(t);
    setFormData({
      ticketNumber: t.ticketNumber,
      holderName: t.holderName,
      entityName: t.entityName,
      responsibleName: t.responsibleName,
      paymentStatus: t.paymentStatus,
      category: t.category,
      price: t.price || 0,
      checked: t.checked
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;
    try {
      await onTicketUpdate(editingTicket.id, formData);
      setIsEditOpen(false);
      setEditingTicket(null);
    } catch (err: any) {
      alert(`Erreur: ${err.message || err}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le billet de "${name}" définitivement des registres ?`)) {
      try {
        await onTicketDelete(id);
      } catch (err: any) {
        alert(err.message || err);
      }
    }
  };

  // Payment badge styles
  const paymentBadges = {
    Payé: 'bg-green-100 text-green-700 border-green-200 font-bold',
    'En attente': 'bg-yellow-105 bg-yellow-101 bg-yellow-100 text-yellow-700 border-yellow-250 font-bold',
    Gratuit: 'bg-blue-105 bg-blue-101 bg-blue-100 text-blue-700 border-blue-200 font-bold',
    Annulé: 'bg-red-105 bg-red-101 bg-red-100 text-red-700 border-red-200 font-bold'
  };

  return (
    <div className="space-y-6">
      {/* Title & Fast Trigger Actions Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-850 text-gray-800 tracking-tight">Registre des Billets</h1>
          <p className="text-gray-500 text-xs mt-1">
            Visualisez, modifiez et faites le checking des billets reçus ou non. Données synchronisées.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded text-gray-700 transition-all cursor-pointer shadow-sm"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-750 hover:bg-green-700 text-white border border-green-700 rounded text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exporter Excel ({filteredTickets.length})</span>
          </button>

          {!isReadOnly && (
            <>
              {/* Excel Import button with hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-uploader"
              />
              <label
                htmlFor="excel-file-uploader"
                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 rounded text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Importer Excel</span>
              </label>

              <button
                onClick={openAddModal}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold tracking-wide flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Billet</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lecture Seule warning notice banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4 flex items-center gap-3.5 text-xs">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
          <div>
            <span className="font-bold">Mode Lecture seule active</span> — Compte visiteur. Les actions d'ajout, de modification, de suppression de billets, de checking tactile et d'importation sont réservées aux admins.
          </div>
        </div>
      )}

      {/* Advanced filters card */}
      <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-4">
        {/* Entity filter indicator bar if active */}
        {selectedEntityFilter !== 'all' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2.5 rounded-md text-xs flex items-center justify-between font-semibold">
            <span className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-blue-500" />
              Filtre actif par entité : <strong className="text-blue-950 font-bold">{selectedEntityFilter}</strong>
            </span>
            <button
              onClick={() => setSelectedEntityFilter('all')}
              className="text-xs text-blue-600 hover:text-blue-800 underline font-bold cursor-pointer"
            >
              Réinitialiser le filtre
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Query search */}
          <div className="col-span-1 md:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par numéro, détenteur, entité..."
              className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white rounded-md transition-all shadow-sm placeholder-gray-400"
            />
          </div>

          {/* Filtering options */}
          <div className="relative">
            <select
              value={checkingFilter}
              onChange={(e: any) => setCheckingFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            >
              <option value="all">Saisie checking (Tous)</option>
              <option value="checked">REÇU (Émargé)</option>
              <option value="unchecked">NON REÇU</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            >
              <option value="all">Statut paiement (Tous)</option>
              <option value="Payé">Payé</option>
              <option value="En attente">En attente</option>
              <option value="Gratuit">Gratuit</option>
              <option value="Annulé">Annulé</option>
            </select>
          </div>
        </div>

        {/* Small filters shortcuts row */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-3 border-t border-gray-150">
          <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Catégorie de Billet:</div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded transition-colors font-semibold border cursor-pointer text-xs ${categoryFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
              Toutes ({tickets.length})
            </button>
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded transition-colors font-semibold border cursor-pointer text-xs ${categoryFilter === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets table interface card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-105 bg-gray-50 border-b border-gray-205 border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-5">Numéro</th>
                <th className="py-3 px-4">Détenteur</th>
                <th className="py-3 px-4">Entité / Service de Suivi</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4">Checking Status</th>
                <th className="py-3 px-4 text-center">Paiement</th>
                <th className="py-3 px-4 text-right">Tarif</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 divide-gray-200 text-xs">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    className={`hover:bg-blue-50/50 transition-colors ${ticket.checked ? 'bg-green-500/[0.015]' : ''}`}
                  >
                    {/* Ticket Reference Code */}
                    <td className="py-3 px-5 font-bold text-gray-900 font-mono text-xs">
                      {ticket.ticketNumber}
                    </td>

                    {/* Holder Full name */}
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      <div>{ticket.holderName}</div>
                      <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{ticket.category}</div>
                    </td>

                    {/* Entity block */}
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      <span className="font-bold text-gray-850 text-gray-800 block text-xs">
                        {ticket.entityName.split(' - ')[1] || ticket.entityName}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 font-semibold block mt-0.5">
                        {ticket.entityName.split(' - ')[0]}
                      </span>
                    </td>

                    {/* Responsible of tracking */}
                    <td className="py-3 px-4 text-gray-700 font-semibold text-xs">
                      {ticket.responsibleName}
                    </td>

                    {/* Check Status Column action */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleChecked(ticket)}
                        disabled={isReadOnly}
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded font-bold transition-all text-[11px] border cursor-pointer select-none ${
                          ticket.checked 
                            ? 'bg-green-105 bg-green-100 text-green-700 border-green-200 hover:bg-green-200/90' 
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'
                        }`}
                        title={isReadOnly ? 'Lecture seule' : 'Clic pour basculer le statut'}
                      >
                        {ticket.checked ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <span>REÇU (Validé)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>NON REÇU</span>
                          </>
                        )}
                      </button>
                      
                      {ticket.checkedAt && (
                        <div className="text-[9px] text-gray-400 mt-1 pl-1.5 font-mono font-semibold">
                          Scanné {new Date(ticket.checkedAt).toLocaleDateString('fr-FR')} par {ticket.checkedBy?.split('@')[0]}
                        </div>
                      )}
                    </td>

                    {/* Payment status */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${paymentBadges[ticket.paymentStatus]}`}>
                        {ticket.paymentStatus}
                      </span>
                    </td>

                    {/* Price in € */}
                    <td className="py-3 px-4 text-right font-bold text-gray-800 font-mono text-xs">
                      {ticket.price || 0} €
                    </td>

                    {/* Actions tools CRUD */}
                    <td className="py-3 px-5 text-right">
                      <div className="inline-flex justify-end items-center gap-1">
                        <button
                          onClick={() => openEditModal(ticket)}
                          disabled={isReadOnly}
                          className="p-1 text-gray-400 hover:text-blue-500 disabled:opacity-30 rounded hover:bg-blue-50 transition-all cursor-pointer"
                          title="Modifier les détails"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ticket.id, ticket.holderName)}
                          disabled={isReadOnly}
                          className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 rounded hover:bg-red-50 transition-all cursor-pointer"
                          title="Supprimer le billet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-gray-500 p-6 bg-gray-50/50">
                    <HelpCircle className="w-10 h-10 text-gray-300 mx-auto animate-pulse-slow mb-3" />
                    <p className="font-bold text-gray-700 text-sm">Aucun billet correspondant</p>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                      Ajustez vos filtres de recherche ou réinitialisez la sélection d'entités pour lister les enregistrements.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer count tracker summaries */}
        <div className="bg-gray-105 bg-gray-50 text-gray-600 border-t border-gray-205 border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold tracking-wider uppercase">
          <div className="flex items-center gap-3">
            <span>Resultats : <strong className="text-gray-850 text-gray-800">{filteredTickets.length} / {tickets.length}</strong> entrées</span>
          </div>
          <div className="flex gap-4">
            <span className="text-green-700 px-2.5 py-0.5 bg-green-50 border border-green-200 rounded font-bold">REÇUS : {filteredTickets.filter(t => t.checked).length}</span>
            <span className="text-gray-500 px-2.5 py-0.5 bg-gray-50 border border-gray-200 rounded font-bold">RESTANTS : {filteredTickets.filter(t => !t.checked).length}</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD TICKET DIALOG */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Créer un nouveau billet
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)} 
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Numéro Billet *</label>
                  <input
                    type="text"
                    required
                    value={formData.ticketNumber}
                    onChange={(e) => setFormData({...formData, ticketNumber: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-indigo-500 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="VIP, Standard, etc"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-indigo-500 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-mono">Détenteur (Nom complet) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clara Boyer"
                  value={formData.holderName}
                  onChange={(e) => setFormData({...formData, holderName: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Entité d'appartenance * (50+ possibles)</label>
                <input
                  type="text"
                  required
                  list="entity-suggestions"
                  placeholder="Ex: Entité 04 - Sécurité Terrain"
                  value={formData.entityName}
                  onChange={(e) => setFormData({...formData, entityName: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-indigo-500 text-xs text-slate-800"
                />
                <datalist id="entity-suggestions">
                  {uniqueEntities.map(ent => (
                    <option key={ent} value={ent} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Personne Responsable du suivi *</label>
                <input
                  type="text"
                  required
                  placeholder="Nom du responsable d'entité"
                  value={formData.responsibleName}
                  onChange={(e) => setFormData({...formData, responsibleName: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Statut Paiement</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e: any) => setFormData({...formData, paymentStatus: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-indigo-500 text-xs text-slate-800 font-bold text-indigo-700"
                  >
                    <option value="En attente">En attente</option>
                    <option value="Payé">Payé</option>
                    <option value="Gratuit">Gratuit</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Tarif (€)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-indigo-500 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <input
                  type="checkbox"
                  id="add-checked-now"
                  checked={formData.checked}
                  onChange={(e) => setFormData({...formData, checked: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="add-checked-now" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                  Valider l'émargement maintenant (Billet reçu)
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-md shadow-indigo-100"
                >
                  Ajouter le billet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TICKET DIALOG */}
      {isEditOpen && editingTicket && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-lg">
                Modifier le billet {editingTicket.ticketNumber}
              </h3>
              <button 
                onClick={() => { setIsEditOpen(false); setEditingTicket(null); }} 
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Numéro Billet</label>
                  <input
                    type="text"
                    required
                    value={formData.ticketNumber}
                    onChange={(e) => setFormData({...formData, ticketNumber: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Nom du Détenteur *</label>
                <input
                  type="text"
                  required
                  value={formData.holderName}
                  onChange={(e) => setFormData({...formData, holderName: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Entité</label>
                <input
                  type="text"
                  required
                  value={formData.entityName}
                  onChange={(e) => setFormData({...formData, entityName: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Responsable de Suivi</label>
                <input
                  type="text"
                  required
                  value={formData.responsibleName}
                  onChange={(e) => setFormData({...formData, responsibleName: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Statut Paiement</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e: any) => setFormData({...formData, paymentStatus: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-indigo-700"
                  >
                    <option value="En attente">En attente</option>
                    <option value="Payé">Payé</option>
                    <option value="Gratuit">Gratuit</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Prix (€)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setEditingTicket(null); }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-md shadow-indigo-100"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EXCEL IMPORT BULK CONFIRMATION DIALOG */}
      {isImportConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5.5 h-5.5 text-indigo-600" />
                Confirmation de l'import Excel
              </h3>
              <button 
                onClick={() => setIsImportConfirmOpen(false)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importSummary ? (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-5 rounded-xl space-y-2 text-center text-xs">
                <Check className="w-8 h-8 text-emerald-500 mx-auto bg-emerald-150 p-1.5 rounded-full animate-bounce" />
                <h4 className="font-bold text-sm text-emerald-900 mt-1">Données importées avec succès !</h4>
                <p>Nouveaux billets ajoutés : <strong>{importSummary.success}</strong></p>
                <p className="text-[11px] text-slate-500">
                  Billets ignorés (doublons de numéros) : {importSummary.dup}
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Le système a détecté <strong className="text-slate-950">{importedTempList.length} lignes valides</strong> dans votre fichier Excel/CSV d'importation. Les en-têtes ont été associés automatiquement.
                </p>

                {/* Previews Table */}
                <div className="border border-slate-150 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left bg-slate-50/50">
                    <thead className="bg-slate-100 text-[10px] font-mono text-slate-500 border-b border-slate-150 sticky top-0 font-bold">
                      <tr>
                        <th className="py-2 px-3">Billet #</th>
                        <th className="py-2 px-3">Détenteur</th>
                        <th className="py-2 px-3">Entité d'importation</th>
                        <th className="py-2 px-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-[11px]">
                      {importedTempList.slice(0, 10).map((imp, idx) => (
                        <tr key={idx} className="hover:bg-slate-100/50">
                          <td className="py-2 px-3 font-mono font-bold text-indigo-700">{imp.ticketNumber}</td>
                          <td className="py-2 px-3 font-semibold">{imp.holderName}</td>
                          <td className="py-2 px-3 truncate max-w-[120px]" title={imp.entityName}>{imp.entityName}</td>
                          <td className="py-2 px-3 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${imp.checked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                              {imp.checked ? 'Reçu' : 'Non reçu'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importedTempList.length > 10 && (
                    <div className="bg-slate-100 text-[10px] font-mono text-slate-500 text-center py-1.5 font-bold">
                      ... Et {importedTempList.length - 10} lignes supplémentaires détectées ...
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-2 text-slate-700 leading-normal">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    Les billets ayant des numéros déjà configurés dans l'application seront <span className="font-bold">strictement ignorés</span> pour empêcher toute duplication de checking.
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsImportConfirmOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={importLoading}
                    onClick={executeBulkImport}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-indigo-100"
                  >
                    {importLoading ? 'Importation...' : "Confirmer l'insertion"}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
