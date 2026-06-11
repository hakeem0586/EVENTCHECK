/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { Ticket } from '../types';

/**
 * Maps unstructured Excel/CSV key headers to defined Ticket fields in French or English.
 */
function normalizeHeaders(row: Record<string, any>): Partial<Ticket> {
  const result: Partial<Ticket> = {};
  
  const keys = Object.keys(row);
  for (const rawKey of keys) {
    const key = rawKey.toLowerCase().trim();
    const val = row[rawKey];

    // Ticket Number
    if (/billet|ticket|num|code|reference|id/i.test(key) && !/holder|détenteur|detenteur|nom/i.test(key)) {
      result.ticketNumber = String(val).trim();
    }
    // Holder Name
    else if (/holder|nom|detenteur|détenteur|beneficiaire|bénéficiaire|personne|client/i.test(key)) {
      result.holderName = String(val).trim();
    }
    // Entity
    else if (/entity|entité|entite|departement|département|service|bureau|groupe/i.test(key)) {
      result.entityName = String(val).trim();
    }
    // Responsible
    else if (/responsable|suivi|supervisor|superviseur|contact|responsable_suivi/i.test(key)) {
      result.responsibleName = String(val).trim();
    }
    // Payment Status
    else if (/pay|status|statut|payment|paiement/i.test(key)) {
      const pStr = String(val).trim();
      if (/pay/i.test(pStr)) result.paymentStatus = 'Payé';
      else if (/attente|wait|en\s+attente/i.test(pStr)) result.paymentStatus = 'En attente';
      else if (/grat|free/i.test(pStr)) result.paymentStatus = 'Gratuit';
      else if (/annul|cancel/i.test(pStr)) result.paymentStatus = 'Annulé';
      else result.paymentStatus = 'En attente';
    }
    // Category
    else if (/cat|type|classe/i.test(key)) {
      result.category = String(val).trim();
    }
    // Price
    else if (/price|prix|tarif|montant/i.test(key)) {
      result.price = Number(val) || 0;
    }
    // Checked (received status)
    else if (/check|recu|reçu|present|présent|checked|suivi/i.test(key)) {
      const cStr = String(val).toLowerCase().trim();
      result.checked = (cStr === 'oui' || cStr === 'yes' || cStr === 'true' || cStr === '1' || val === 1 || val === true);
    }
  }

  // Set fallbacks for missing essentials
  if (!result.ticketNumber) {
    result.ticketNumber = `TIK-GEN-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  if (!result.holderName) {
    result.holderName = 'Détenteur Anonyme';
  }
  if (!result.entityName) {
    result.entityName = 'Entité Non Spécifiée';
  }
  if (!result.responsibleName) {
    result.responsibleName = 'Responsable Non Assigné';
  }
  if (!result.paymentStatus) {
    result.paymentStatus = 'En attente';
  }
  if (!result.category) {
    result.category = 'Standard';
  }
  if (result.checked === undefined) {
    result.checked = false;
  }

  return result;
}

/**
 * Parses any .xlsx or .csv file and returns structured partial Ticket array objects.
 */
export async function parseExcelOrCsv(file: File): Promise<Partial<Ticket>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Impossible de lire le fichier.');
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON rows
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
        
        // Normalize rows to Tickets schema
        const ticketList = rawRows.map(row => normalizeHeaders(row));
        resolve(ticketList);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Exports current Ticket array to a beautiful Excel download.
 */
export function exportToExcel(tickets: Ticket[], fileName = 'export_tickets.xlsx') {
  // Convert structure to client-friendly French sheet layout
  const formattedData = tickets.map((t, idx) => ({
    'ID Interne': t.id,
    'Numéro de Billet': t.ticketNumber,
    'Nom du Détenteur': t.holderName,
    'Entité ': t.entityName,
    'Responsable de Suivi': t.responsibleName,
    'Statut Checking': t.checked ? 'REÇU (Validé)' : 'NON REÇU',
    'Date de Checking': t.checkedAt ? new Date(t.checkedAt).toLocaleString('fr-FR') : '-',
    'Validé par': t.checkedBy || '-',
    'Statut du Paiement': t.paymentStatus,
    'Catégorie': t.category,
    'Tarif (€)': t.price || 0,
    'Date d\'Ajout': new Date(t.createdAt).toLocaleDateString('fr-FR')
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  
  // Set generous column widths
  const maxW = [15, 20, 25, 30, 25, 20, 25, 25, 20, 15, 12, 15];
  worksheet['!cols'] = maxW.map(w => ({ wch: w }));

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Suivi Billets');
  XLSX.writeFile(workbook, fileName);
}
