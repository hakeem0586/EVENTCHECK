/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Key, Mail, User, AlertCircle, Sparkles } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: UserType) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAutofill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setIsRegister(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      setLoading(false);
      return;
    }

    if (isRegister && !name) {
      setError('Veuillez renseigner votre nom.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { email, password, name } : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de la connexion.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Impossible de joindre le serveur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden px-4">
      {/* Visual background details */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-100 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 opacity-50"></div>
 
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-blue-600 text-white shadow-sm mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Suivi Billets & Entités
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Gestion, checking et dashboard de billets d'événement
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-6">
            {isRegister ? 'Créer un nouveau compte' : 'Se connecter'}
          </h2>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-md p-3 flex items-start gap-2.5 mb-5 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-0.5">
                  Nom Complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Jean Dupont"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-550 text-gray-500 uppercase tracking-widest mb-1.5 px-0.5">
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: superadmin@suivi.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-550 text-gray-500 uppercase tracking-widest mb-1.5 px-0.5">
                Mot de passe
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition-colors flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-sm"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : isRegister ? (
                'Créer mon compte'
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              {isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? Créer un compte visiteur"}
            </button>
          </div>
        </div>

        {/* Demo Fast Autofill Row */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mt-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Comptes de démo pour l'évaluation</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleAutofill('superadmin@suivi.com', 'admin123')}
              className="px-2.5 py-2 bg-white text-[10px] text-left rounded shadow-sm border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer group"
            >
              <div className="font-bold text-gray-800 group-hover:text-blue-600">Superadmin</div>
              <div className="text-gray-400 mt-0.5 truncate">superadmin@suivi.com</div>
              <div className="text-[10px] text-blue-500 font-mono mt-0.5 font-bold">admin123</div>
            </button>
            <button
              onClick={() => handleAutofill('admin@suivi.com', 'admin123')}
              className="px-2.5 py-2 bg-white text-[10px] text-left rounded shadow-sm border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer group"
            >
              <div className="font-bold text-gray-800 group-hover:text-blue-600">Admin</div>
              <div className="text-gray-400 mt-0.5 truncate">admin@suivi.com</div>
              <div className="text-[10px] text-blue-500 font-mono mt-0.5 font-bold">admin123</div>
            </button>
            <button
              onClick={() => handleAutofill('visiteur@suivi.com', 'visiteur123')}
              className="px-2.5 py-2 bg-white text-[10px] text-left rounded shadow-sm border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer group"
            >
              <div className="font-bold text-gray-800 group-hover:text-blue-600">Visiteur</div>
              <div className="text-gray-400 mt-0.5 truncate">visiteur@suivi.com</div>
              <div className="text-[10px] text-blue-500 font-mono mt-0.5 font-bold">visiteur123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
