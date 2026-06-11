import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { User, UserRole, Ticket, ActionLog, SessionLog, EntityInfo } from "./src/types";

// Setup server and paths
const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File database paths
const USERS_FILE = path.join(DATA_DIR, "users.json");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");
const ACTIONS_FILE = path.join(DATA_DIR, "actions.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

// In-Memory fallback backups in case of write issues, initialized on boot
let users: (User & { passwordHash: string })[] = [];
let tickets: Ticket[] = [];
let actionLogs: ActionLog[] = [];
let sessionLogs: SessionLog[] = [];

// Helper functions for reading and writing with locks
function loadData() {
  try {
    // 1. Users
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    } else {
      // Default users
      users = [
        {
          id: "u-superadmin",
          email: "superadmin@suivi.com",
          name: "Marc Antoine (Superadmin)",
          role: "Superadmin",
          createdAt: new Date().toISOString(),
          passwordHash: "admin123" // Simple plain text comparisons for bulletproof sandbox compilation
        },
        {
          id: "u-admin",
          email: "admin@suivi.com",
          name: "Sophie Bernard (Admin)",
          role: "Admin",
          createdAt: new Date().toISOString(),
          passwordHash: "admin123"
        },
        {
          id: "u-visiteur",
          email: "visiteur@suivi.com",
          name: "Jean Petit (Visiteur)",
          role: "Visiteur",
          createdAt: new Date().toISOString(),
          passwordHash: "visiteur123"
        }
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    }

    // 2. Tickets
    if (fs.existsSync(TICKETS_FILE)) {
      tickets = JSON.parse(fs.readFileSync(TICKETS_FILE, "utf-8"));
    } else {
      generateSeedTickets();
    }

    // 3. Actions logs
    if (fs.existsSync(ACTIONS_FILE)) {
      actionLogs = JSON.parse(fs.readFileSync(ACTIONS_FILE, "utf-8"));
    } else {
      actionLogs = [
        {
          id: "log-initial",
          userId: "system",
          userEmail: "system@suivi.com",
          userRole: "Superadmin",
          actionType: "SYSTEM_BOOT",
          description: "Initialisation et amorçage du système avec 50 entités et données de démo.",
          timestamp: new Date().toISOString()
        }
      ];
      fs.writeFileSync(ACTIONS_FILE, JSON.stringify(actionLogs, null, 2), "utf-8");
    }

    // 4. Session logs
    if (fs.existsSync(SESSIONS_FILE)) {
      sessionLogs = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
    } else {
      sessionLogs = [];
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessionLogs, null, 2), "utf-8");
    }
  } catch (error) {
    console.error("Error loading seed data:", error);
  }
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function saveTickets() {
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf-8");
}

function saveActions() {
  fs.writeFileSync(ACTIONS_FILE, JSON.stringify(actionLogs, null, 2), "utf-8");
}

function saveSessions() {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessionLogs, null, 2), "utf-8");
}

// Generate rich database seeding for 50 distinct entities
function generateSeedTickets() {
  const departments = [
    "Ressources Humaines", "Marketing & Com", "Direction Technique", "Département Finance",
    "Relations Publiques", "Logistique Événement", "Sécurité Terrain", "Sponsor VIP",
    "Service IT & Réseaux", "Affaires Juridiques", "Com Digitale", "Régie Générale",
    "Achats & Logistique", "Support & Accueil", "Qualité & Audit", "Presse & Média"
  ];
  const responsibles = [
    "Jean Martin", "Alice Bernard", "Michel Petit", "Marie Robert", "François Richard",
    "Sophie Durand", "Pierre Dubois", "Nicolas Moreau", "Claude Laurent", "Chantal Simon",
    "Christian Michel", "Patricia Lefevre", "René Roux", "Monique Legrand", "Julien Garcia",
    "Françoise Bertrand", "Alexandre Vincent"
  ];
  const categories = ["VIP", "Standard", "Presse", "Partenaire", "Étudiant"];
  const paymentStatuses = ["Payé", "En attente", "Gratuit", "Annulé"];
  
  const holders = [
    "Paul Lefebvre", "Thomas Leroy", "Lucas Roux", "Charlotte David", "Léa Bertrand",
    "Kévin Morel", "Emma Fournier", "Hugo Girard", "Chloé Bonnet", "Nathan Dupont",
    "Camille Lambert", "Manon Guer", "Louis Fontaine", "Mathieu Roussel", "Clara Boyer",
    "Arthur Chevalier", "Manon Francois", "Jade Robin", "Victor Masson", "Zoé Sanchez",
    "Antoine Denis", "Sébastien Lemaire", "Justine Meyer", "Maxime Martin", "Guillaume Roy"
  ];

  const generatedTickets: Ticket[] = [];

  // Generate 50 entities
  const entitiesList: { name: string; responsible: string }[] = [];
  for (let i = 1; i <= 52; i++) {
    const dept = departments[i % departments.length];
    const resp = responsibles[i % responsibles.length];
    entitiesList.push({
      name: `Entité ${String(i).padStart(2, "0")} - ${dept}`,
      responsible: resp
    });
  }

  // Create around 150 tickets distributed across these entities
  let ticketIdCounter = 1000;
  for (let i = 0; i < 155; i++) {
    const entity = entitiesList[i % entitiesList.length];
    const category = categories[i % categories.length];
    const isChecked = i % 3 === 0; // 33% checked
    const paymentStatus = i % 5 === 0 ? "En attente" : i % 8 === 0 ? "Gratuit" : i % 25 === 0 ? "Annulé" : "Payé";
    
    const holderFirst = holders[i % holders.length];
    const holderLast = responsibles[(i + 3) % responsibles.length].split(" ")[1] || "Dupont";
    const holderName = `${holderFirst} ${holderLast}`;

    ticketIdCounter++;

    generatedTickets.push({
      id: `t-sys-${i}`,
      ticketNumber: `TIK-${ticketIdCounter}`,
      holderName,
      entityName: entity.name,
      responsibleName: entity.responsible,
      checked: isChecked,
      checkedAt: isChecked ? new Date(Date.now() - (i * 3600000)).toISOString() : null,
      checkedBy: isChecked ? "superadmin@suivi.com" : null,
      paymentStatus: paymentStatus as any,
      category,
      price: category === "VIP" ? 150 : category === "Standard" ? 45 : category === "Partenaire" ? 80 : 0,
      createdAt: new Date(Date.now() - (10 * 86400000)).toISOString()
    });
  }

  tickets = generatedTickets;
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf-8");
}

// Initial Boot Data Loading
loadData();

// Middlewares
app.use(express.json({ limit: "50mb" }));

// Helper to log actions
function logAction(userId: string, email: string, role: UserRole, actionType: string, description: string, meta?: any) {
  const newLog: ActionLog = {
    id: `act-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    userEmail: email,
    userRole: role,
    actionType,
    description,
    timestamp: new Date().toISOString(),
    meta
  };
  actionLogs.unshift(newLog); // Put newest logs at top
  // limit logs file size to 2000 entries
  if (actionLogs.length > 2000) actionLogs = actionLogs.slice(0, 2000);
  saveActions();
}

// Authentication API
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Veuillez fournir l'email et le mot de passe" });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: "Identifiants invalides" });
  }

  // Create session log
  const sessionToken = `sess-${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 9)}`;
  const newSession: SessionLog = {
    id: sessionToken,
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    loginTime: new Date().toISOString(),
    lastActivityTime: new Date().toISOString(),
    logoutTime: null,
    ipAddress: req.ip || "127.0.0.1",
    userAgent: req.headers["user-agent"] || "Inconnu"
  };

  sessionLogs.unshift(newSession);
  if (sessionLogs.length > 1000) sessionLogs = sessionLogs.slice(0, 1000);
  saveSessions();

  logAction(user.id, user.email, user.role, "USER_LOGIN", `Connexion réussie de l'utilisateur ${user.name}`);

  res.json({
    token: sessionToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "S'il vous plaît remplir tous les champs requis." });
  }

  const normalizedEmail = email.toLowerCase();
  if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: "Cet email est déjà enregistré." });
  }

  const newUser: User & { passwordHash: string } = {
    id: `u-${Math.random().toString(36).substring(2, 9)}`,
    email: normalizedEmail,
    name,
    role: "Visiteur", // Registering user always defaults to Visitor
    createdAt: new Date().toISOString(),
    passwordHash: password
  };

  users.push(newUser);
  saveUsers();

  logAction(newUser.id, newUser.email, newUser.role, "USER_REGISTER", `Création d'un nouveau compte visiteur pour ${name}`);

  // Create session log
  const sessionToken = `sess-${Math.random().toString(36).substring(2, 9)}`;
  const newSession: SessionLog = {
    id: sessionToken,
    userId: newUser.id,
    userEmail: newUser.email,
    userRole: newUser.role,
    loginTime: new Date().toISOString(),
    lastActivityTime: new Date().toISOString(),
    logoutTime: null,
    ipAddress: req.ip || "127.0.0.1",
    userAgent: req.headers["user-agent"] || "Inconnu"
  };

  sessionLogs.unshift(newSession);
  saveSessions();

  res.json({
    token: sessionToken,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    }
  });
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const session = sessionLogs.find(s => s.id === token);
    if (session) {
      session.logoutTime = new Date().toISOString();
      saveSessions();
      logAction(session.userId, session.userEmail, session.userRole, "USER_LOGOUT", `Déconnexion de l'utilisateur ${session.userEmail}`);
    }
  }
  res.json({ success: true });
});

// Helper validation middleware checking token and role parameters
function getAuthenticatedUser(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const session = sessionLogs.find(s => s.id === token && s.logoutTime === null);
  if (!session) return null;

  // Touch session last activity
  session.lastActivityTime = new Date().toISOString();
  saveSessions();

  const user = users.find(u => u.id === session.userId);
  return user || null;
}

// Tickets REST API
app.get("/api/tickets", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Non autorisé. Session expirée ou invalide." });
  }
  res.json(tickets);
});

app.post("/api/tickets", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  if (user.role === "Visiteur") {
    return res.status(403).json({ error: "Action restreinte: Les visiteurs ne peuvent pas modifier les données." });
  }

  const { ticketNumber, holderName, entityName, responsibleName, paymentStatus, category, price, checked } = req.body;

  if (!ticketNumber || !holderName || !entityName || !responsibleName) {
    return res.status(400).json({ error: "Remplir tous les champs obligatoires du billet." });
  }

  if (tickets.some(t => t.ticketNumber === ticketNumber)) {
    return res.status(400).json({ error: `Le numéro de billet ${ticketNumber} existe déjà.` });
  }

  const newTicket: Ticket = {
    id: `t-${Math.random().toString(36).substring(2, 9)}`,
    ticketNumber,
    holderName,
    entityName,
    responsibleName,
    checked: !!checked,
    checkedAt: checked ? new Date().toISOString() : null,
    checkedBy: checked ? user.email : null,
    paymentStatus: paymentStatus || "En attente",
    category: category || "Standard",
    price: price ? Number(price) : 0,
    createdAt: new Date().toISOString()
  };

  tickets.unshift(newTicket);
  saveTickets();

  logAction(
    user.id,
    user.email,
    user.role,
    "TICKET_CREATE",
    `Création du billet ${newTicket.ticketNumber} pour ${newTicket.holderName} (${newTicket.entityName})`,
    { ticketId: newTicket.id }
  );

  res.status(201).json(newTicket);
});

app.put("/api/tickets/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  if (user.role === "Visiteur") {
    return res.status(403).json({ error: "Action restreinte: Les visiteurs ne peuvent pas effectuer de modifications." });
  }

  const ticketIndex = tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Billet non trouvé" });
  }

  const oldTicket = tickets[ticketIndex];
  const { checked, paymentStatus, holderName, entityName, responsibleName, category, price, ticketNumber } = req.body;

  // If ticking checking status
  let checkChanged = false;
  let oldChecked = oldTicket.checked;
  
  const updatedTicket: Ticket = {
    ...oldTicket,
    ...(ticketNumber !== undefined && { ticketNumber }),
    ...(holderName !== undefined && { holderName }),
    ...(entityName !== undefined && { entityName }),
    ...(responsibleName !== undefined && { responsibleName }),
    ...(paymentStatus !== undefined && { paymentStatus }),
    ...(category !== undefined && { category }),
    ...(price !== undefined && { price: Number(price) })
  };

  if (checked !== undefined && checked !== oldTicket.checked) {
    checkChanged = true;
    updatedTicket.checked = checked;
    updatedTicket.checkedAt = checked ? new Date().toISOString() : null;
    updatedTicket.checkedBy = checked ? user.email : null;
  }

  tickets[ticketIndex] = updatedTicket;
  saveTickets();

  let logMessage = `Mise à jour du billet ${updatedTicket.ticketNumber}`;
  if (checkChanged) {
    logMessage = `Checking billet ${updatedTicket.ticketNumber} : ${updatedTicket.checked ? "REÇU" : "NON REÇU"} (Détenteur: ${updatedTicket.holderName}, Entité: ${updatedTicket.entityName})`;
  }

  logAction(
    user.id,
    user.email,
    user.role,
    checkChanged ? "TICKET_CHECK" : "TICKET_UPDATE",
    logMessage,
    { ticketId: updatedTicket.id, checkChanged, checkedState: updatedTicket.checked }
  );

  res.json(updatedTicket);
});

app.delete("/api/tickets/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  if (user.role === "Visiteur") {
    return res.status(403).json({ error: "Action restreinte: Accès refusé." });
  }

  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: "Billet non trouvé" });
  }

  tickets = tickets.filter(t => t.id !== req.params.id);
  saveTickets();

  logAction(
    user.id,
    user.email,
    user.role,
    "TICKET_DELETE",
    `Suppression du billet ${ticket.ticketNumber} appartenant à ${ticket.holderName} (Entité: ${ticket.entityName})`,
    { ticketNumber: ticket.ticketNumber }
  );

  res.json({ success: true });
});

// Import endpoints
app.post("/api/tickets/import", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  if (user.role === "Visiteur") {
    return res.status(403).json({ error: "Les visiteurs ne peuvent pas importer de données." });
  }

  const { importedTickets } = req.body; // Array of Ticket structures
  if (!Array.isArray(importedTickets) || importedTickets.length === 0) {
    return res.status(400).json({ error: "Données importées invalides." });
  }

  let successCount = 0;
  let duplicateCount = 0;

  importedTickets.forEach((raw: any) => {
    // Generate code or validate
    const ticketNumber = raw.ticketNumber || `TIK-IMP-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Check duplication in global scope
    if (tickets.some(t => t.ticketNumber === ticketNumber)) {
      duplicateCount++;
      return;
    }

    const newTicket: Ticket = {
      id: `t-imp-${Math.random().toString(36).substring(2, 9)}`,
      ticketNumber,
      holderName: raw.holderName || "Inconnu",
      entityName: raw.entityName || "Sans Entité",
      responsibleName: raw.responsibleName || "Non assigné",
      checked: raw.checked !== undefined ? !!raw.checked : false,
      checkedAt: raw.checked ? new Date().toISOString() : null,
      checkedBy: raw.checked ? user.email : null,
      paymentStatus: raw.paymentStatus || "En attente",
      category: raw.category || "Standard",
      price: raw.price ? Number(raw.price) : 0,
      createdAt: new Date().toISOString()
    };

    tickets.unshift(newTicket);
    successCount++;
  });

  if (successCount > 0) {
    saveTickets();
    logAction(
      user.id,
      user.email,
      user.role,
      "IMPORT_EXCEL",
      `Importation réussie de ${successCount} billets via Excel/CSV (Ignorés car doublons: ${duplicateCount})`
    );
  }

  res.json({
    success: true,
    successCount,
    duplicateCount,
    totalCount: tickets.length
  });
});

app.post("/api/tickets/reset", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  if (user.role !== "Superadmin") {
    return res.status(403).json({ error: "Seul le Superadmin peut réinitialiser la base de données." });
  }

  generateSeedTickets();
  logAction(user.id, user.email, user.role, "DB_RESET", "La base de données des billets a été réinitialisée par le Superadmin.");
  res.json({ success: true, message: "Réinitialisation effectuée." });
});

// Administration User Management API (Hidden dashboard)
app.get("/api/users", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  if (user.role === "Visiteur") {
    return res.status(403).json({ error: "Accès refusé. Les visiteurs ne peuvent pas lister les utilisateurs." });
  }

  // Hide password hashes for safety transit
  const formattedUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt
  }));

  res.json(formattedUsers);
});

app.post("/api/users", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role === "Visiteur") {
    return res.status(403).json({ error: "Action restreinte." });
  }

  const { email, name, password, role } = req.body;
  if (!email || !name || !password || !role) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  // Authorization level gating:
  // Admin can only create other Admins or Visitors. Admin CANNOT create a Superadmin.
  if (user.role === "Admin" && (role === "Superadmin")) {
    return res.status(403).json({ error: "Un administrateur ne peut pas attribuer le rôle Superadmin." });
  }

  const normalizedEmail = email.toLowerCase();
  if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: "Cette adresse email est déjà prise." });
  }

  const newUser = {
    id: `u-${Math.random().toString(36).substring(2, 9)}`,
    email: normalizedEmail,
    name,
    role: role as UserRole,
    createdAt: new Date().toISOString(),
    passwordHash: password
  };

  users.push(newUser);
  saveUsers();

  logAction(
    user.id,
    user.email,
    user.role,
    "USER_CREATE",
    `Création de l'utilisateur ${name} (${email}) avec le rôle ${role} par ${user.name}`
  );

  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    createdAt: newUser.createdAt
  });
});

app.put("/api/users/:id/role", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });

  // Only Superadmin can edit & attribute roles to everyone.
  // Admin can create admins, but changing roles of active users is restricted to Superadmin.
  if (user.role !== "Superadmin") {
    return res.status(403).json({ error: "Seul le rôle Superadmin peut attribuer et modifier les privilèges." });
  }

  const targetUserIndex = users.findIndex(u => u.id === req.params.id);
  if (targetUserIndex === -1) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }

  const targetUser = users[targetUserIndex];
  const { role } = req.body;

  if (!role || (role !== "Superadmin" && role !== "Admin" && role !== "Visiteur")) {
    return res.status(400).json({ error: "Rôle invalide" });
  }

  // Prevent demoting yourself (if superadmin)
  if (targetUser.id === user.id && role !== "Superadmin") {
    return res.status(400).json({ error: "Vous ne pouvez pas révoquer vos propres privilèges Superadmin d'ici." });
  }

  const oldRole = targetUser.role;
  targetUser.role = role as UserRole;
  users[targetUserIndex] = targetUser;
  saveUsers();

  logAction(
    user.id,
    user.email,
    user.role,
    "ROLE_CHANGE",
    `Rôle de ${targetUser.name} changé de ${oldRole} à ${role} par ${user.name}`
  );

  res.json({
    id: targetUser.id,
    email: targetUser.email,
    name: targetUser.name,
    role: targetUser.role
  });
});

app.delete("/api/users/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  
  // Superadmin checks
  if (user.role !== "Superadmin") {
    return res.status(403).json({ error: "Seul le Superadmin est autorisé à supprimer d'autres utilisateurs." });
  }

  if (req.params.id === user.id) {
    return res.status(400).json({ error: "Vous ne pouvez pas vous supprimer vous-même." });
  }

  const targetUser = users.find(u => u.id === req.params.id);
  if (!targetUser) {
    return res.status(404).json({ error: "Utilisateur introuvable" });
  }

  users = users.filter(u => u.id !== req.params.id);
  saveUsers();

  logAction(
    user.id,
    user.email,
    user.role,
    "USER_DELETE",
    `Suppression définitive de l'utilisateur ${targetUser.name} (${targetUser.email}) par ${user.name}`
  );

  res.json({ success: true });
});

// Logs viewing APIs
app.get("/api/logs/actions", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  
  // Visitors can see action logs as well, as requested ("visiteurs peuvent simplement voir les donnees...").
  res.json(actionLogs);
});

app.get("/api/logs/sessions", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  
  res.json(sessionLogs);
});

// Vite & Frontend Fallpack
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode under Vite Node middleware Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode serving compiled static assets from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
