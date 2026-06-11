/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, UserPlus, Trash2, Key, Mail, User, AlertCircle, RefreshCw, AlertTriangle, Sparkles, UserCheck } from 'lucide-react';
import { User as UserType, UserRole } from '../types';

interface AdminTabProps {
  currentUser: UserType;
  usersList: UserType[];
  onUserCreate: (userData: any) => Promise<void>;
  onRoleChange: (id: string, newRole: UserRole) => Promise<void>;
  onUserDelete: (id: string) => Promise<void>;
  onResetDatabase: () => Promise<void>;
}

export default function AdminTab({
  currentUser,
  usersList,
  onUserCreate,
  onRoleChange,
  onUserDelete,
  onResetDatabase
}: AdminTabProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Visiteur');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbResetting, setDbResetting] = useState(false);

  const isSuperadmin = currentUser.role === 'Superadmin';
  const isAdmin = currentUser.role === 'Admin';

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email || !password || !name) {
      setError('Veuillez renseigner tous les champs obligatoires.');
      setLoading(false);
      return;
    }

    // Role safeguard check
    if (isAdmin && role === 'Superadmin') {
      setError("Désolé. En tant qu'Admin vous ne pouvez pas attribuer le rôle Superadmin.");
      setLoading(false);
      return;
    }

    try {
      await onUserCreate({ email, name, password, role });
      setSuccess(`L'utilisateur "${name}" de rôle [${role}] a été créé avec succès.`);
      // Clear forms
      setName('');
      setEmail('');
      setPassword('');
      setRole('Visiteur');
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création d'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelectChange = async (userId: string, targetRole: UserRole, targetName: string) => {
    if (!isSuperadmin) {
      alert("Droits insuffisants. Seul le Superadmin gère et attribue les rôles de chacun.");
      return;
    }

    if (confirm(`Voulez-vous modifier le rôle de "${targetName}" à [${targetRole}] ?`)) {
      try {
        await onRoleChange(userId, targetRole);
        setSuccess(`Le privilège de "${targetName}" est désormais mis à jour : ${targetRole}`);
      } catch (err: any) {
        alert(err.message || err);
      }
    }
  };

  const handleDeleteUser = async (userId: string, targetName: string) => {
    if (!isSuperadmin) {
      alert("Droits insuffisants. Seul le Superadmin peut supprimer définitivement d'autres comptes utilisateurs.");
      return;
    }

    if (confirm(`ATTENTION : Voulez-vous supprimer définitivement le compte de "${targetName}" ? Toutes ses sessions d'activité seront conservées dans l'historique.`)) {
      try {
        await onUserDelete(userId);
        setSuccess(`Compte utilisateur "${targetName}" supprimé avec succès.`);
      } catch (err: any) {
        alert(err.message || err);
      }
    }
  };

  const handleResetTicketsDB = async () => {
    if (!isSuperadmin) {
      alert("Droits insuffisants. Action réservée au Superadmin.");
      return;
    }

    if (confirm("🚨 DANGER : Voulez-vous vraiment réinitialiser le registre des billets ?\nCette opération écrasera toutes les modifications en cours et recréera les 52 entités de démo et les billets d'origine.")) {
      try {
        setDbResetting(true);
        await onResetDatabase();
        alert("La base de données des billets d'événements a bien été réinitialisée.");
      } catch (err: any) {
        alert(err.message || err);
      } finally {
        setDbResetting(false);
      }
    }
  };

  // Helper styles for roles badges
  const roleBadges = {
    Superadmin: 'bg-orange-100 text-orange-700 border-orange-200 font-bold',
    Admin: 'bg-blue-105 bg-blue-100 text-blue-700 border-blue-200 font-bold',
    Visiteur: 'bg-gray-100 text-gray-650 text-gray-600 border-gray-200 font-bold'
  };

  return (
    <div className="space-y-6">
      {/* Tab banner introduction */}
      <div>
        <h2 className="text-2xl font-black text-gray-850 text-gray-800 tracking-tight">Gestion des Rôles & Accès Administrateur</h2>
        <p className="text-gray-500 text-xs mt-1">
          Attribuez les responsabilités, créez des comptes administrateurs ou simples visiteurs, et gérez les droits conformément à la politique RBAC.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL A: CREATE PROFILE FORM */}
        <div className="lg:col-span-1 bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-gray-900 text-sm">Enregistrer un utilisateur</h3>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
            {isAdmin 
              ? "En tant qu'Admin, vous pouvez uniquement enregistrer d'autres comptes Admins et des simples Visiteurs." 
              : "En tant que Superadmin, vous possédez le plein contrôle sur tous les niveaux de privilèges."}
          </p>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-100 text-green-800 text-xs rounded-xl p-3 flex items-start gap-2">
              <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-green-605 text-green-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleCreateUserSubmit} className="space-y-3.5 text-xs font-semibold">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Nom Complet</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Sophie Durant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Adresse Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="Ex: sophie.d@suivi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Mot De Passe initial</label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Mot de passe de connexion"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md font-mono shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Rôle d'Accès</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md font-bold text-gray-700 shadow-sm"
              >
                <option value="Visiteur">Visiteur (Consultation seule)</option>
                <option value="Admin">Admin (Gestion des Billets, émargements)</option>
                {isSuperadmin && (
                  <option value="Superadmin">Superadmin (Contrôle total des privilèges)</option>
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-sm cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              {loading ? 'Création...' : 'Créer le Compte'}
            </button>
          </form>
        </div>

        {/* PANEL B: ACTIVE ACCOUNTS DIRECTORY TABLE */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-gray-990 text-gray-900 text-sm">Répertoire des Utilisateurs ({usersList.length})</h3>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-105 bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Utilisateur</th>
                  <th className="py-2.5 px-3">Role Attribuable</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {usersList.map((user) => {
                  const selfAccount = user.id === currentUser.id;
                  
                  return (
                    <tr key={user.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-800 flex items-center gap-1.5">
                          {user.name}
                          {selfAccount && (
                            <span className="bg-blue-105 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded-sm uppercase tracking-wide">Vous</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{user.email}</div>
                      </td>

                      <td className="py-3 px-3">
                        {isSuperadmin ? (
                          <select
                            value={user.role}
                            disabled={selfAccount}
                            onChange={(e) => handleRoleSelectChange(user.id, e.target.value as UserRole, user.name)}
                            className="bg-gray-50 border border-gray-200 rounded px-2.5 py-1 font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs shadow-sm"
                          >
                            <option value="Superadmin">Superadmin</option>
                            <option value="Admin">Admin</option>
                            <option value="Visiteur">Visiteur</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${roleBadges[user.role]}`}>
                            {user.role}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {isSuperadmin ? (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={selfAccount}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 rounded-md font-bold text-[10px] transition-colors disabled:opacity-30 cursor-pointer flex items-center gap-1 ml-auto shadow-sm"
                            title="Supprimer définitivement l'utilisateur"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-450 text-gray-400 font-semibold font-mono select-none">Restrict - Superadmin seul</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* POLICY RULES CHECKSUM BAR */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
            <h4 className="text-xs font-black text-gray-850 text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-orange-500" />
              Politique de privilèges (RBAC)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] leading-normal font-medium text-gray-500">
              <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1 shadow-sm">
                <div className="font-bold text-orange-605 text-orange-700">★ Superadmin</div>
                <p>Gestion totale des utilisateurs, édition de tous les billets/entités, réinitialisation de la DB.</p>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1 shadow-sm">
                <div className="font-bold text-blue-605 text-blue-700">★ Admin</div>
                <p>Création d'admins et de visiteurs. CRUD complet sur les billets d'événements. Pas d'édition des rôles.</p>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1 shadow-sm font-semibold">
                <div className="font-bold text-gray-650 text-gray-600">★ Visiteur</div>
                <p>Consultation brute, tableaux de bord interactifs en temps réel, exportations. Aucun droit de modification ou d'émargement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUPERADMIN UTILITIES - DATABASE SEEDING RESET */}
      {isSuperadmin && (
        <div className="bg-red-500/[0.02] border border-red-200 p-6 rounded-xl space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-red-100 pb-3">
            <AlertTriangle className="w-5.5 h-5.5 text-red-500" />
            <h3 className="font-extrabold text-red-900 text-sm font-bold">Zone de réinitialisation d'urgence (Superadmin)</h3>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-xs text-red-700 max-w-2xl leading-normal font-semibold">
              Rétablir l'état d'usine : Cette commande écrasera instantanément le registre et rechargera les 52 entités programmées avec plus de 150 billets de démonstration simulés pour évaluer la fluidité du dashboard de suivi des émargements.
            </p>
            <button
              onClick={handleResetTicketsDB}
              disabled={dbResetting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-md text-xs font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${dbResetting ? 'animate-spin' : ''}`} />
              <span>Réinitialiser les billets</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
