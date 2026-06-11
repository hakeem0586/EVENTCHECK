/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Superadmin' | 'Admin' | 'Visiteur';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // Ex: TIK-8923
  holderName: string;   // Nom de la personne détentrice
  entityName: string;   // Nom de l'entité (ex: Service RH, Entité 12...)
  responsibleName: string; // Responsable du suivi de cette entité
  checked: boolean;     // Reçu ou non
  checkedAt: string | null;
  checkedBy: string | null; // Nom / Email de l'utilisateur qui a fait le check
  paymentStatus: 'Payé' | 'En attente' | 'Gratuit' | 'Annulé';
  category: string;     // Ex: VIP, Standard, Invité
  price?: number;        // Optionnel
  createdAt: string;
}

export interface EntityInfo {
  name: string;
  responsibleName: string;
}

export interface ActionLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  actionType: string; // EX: 'TICKET_CHECK', 'TICKET_CREATE', 'IMPORT_EXCEL', 'ROLE_CHANGE', 'USER_CREATE'
  description: string; // Description textuelle de l'action
  timestamp: string;
  meta?: any; // Informations supplémentaires
}

export interface SessionLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  loginTime: string;
  lastActivityTime: string;
  logoutTime: string | null;
  ipAddress?: string;
  userAgent?: string;
}
