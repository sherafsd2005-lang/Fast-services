import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, dbManager, hashPassword, generateSalt, verifyPassword } from './src/server/db';
import {
  User,
  WorkerProfile,
  Booking,
  CustomJob,
  JobOffer,
  Payment,
  PaymentMethod,
  WorkerPayout,
  Review,
  ChatMessage,
  AppNotification,
  Dispute,
  Refund,
  HeroPoster,
  AuditLog
} from './src/types';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper for audit logging
function logAdminAction(adminId: string, adminName: string, action: string, details: string) {
  const entry: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    adminId,
    adminName,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(entry);
  dbManager.persist();
}

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: User;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.substring(7);

  // Check in adminTokens if it's an admin token
  if (db.adminTokens && Array.isArray(db.adminTokens)) {
    const adminTokenObj = db.adminTokens.find(t => t.token === token);
    if (adminTokenObj) {
      const adminUser = db.users.find(u => u.id === adminTokenObj.adminId);
      if (adminUser && adminUser.status === 'active' && adminUser.role === 'admin') {
        req.user = adminUser;
        return next();
      }
    }
  }

  // Check structured token format: role_userId_timestamp
  const parts = token.split('_');
  if (parts.length >= 2) {
    const rolePrefix = parts[0];
    const userId = parts[1];
    const user = db.users.find(u => u.id === userId);
    if (user && user.status === 'active') {
      // Security check: if token claims admin, user MUST have role 'admin'
      if (rolePrefix === 'admin' || rolePrefix === 'adm') {
        if (user.role === 'admin') {
          req.user = user;
          return next();
        } else {
          return next();
        }
      }
      req.user = user;
      return next();
    }
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin credentials required' });
  }
  next();
}

app.use('/api', authMiddleware);

// ==========================================
// 1. AUTHENTICATION & SECURITY
// ==========================================

// Register (Customer or Worker)
app.post('/api/auth/register', (req, res) => {
  const { role, name, mobile, email, password, city, area, address } = req.body;
  if (!name || !mobile || !password || !city || !area) {
    return res.status(400).json({ error: 'Name, mobile, password, city, and area are required' });
  }

  const existing = db.users.find(u => u.mobile === mobile);
  if (existing) {
    return res.status(400).json({ error: 'A user with this mobile number already exists' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const newUser: User & { passwordHash: string; salt: string } = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    role: role === 'worker' ? 'worker' : 'customer',
    name,
    mobile,
    email: email || '',
    city,
    area,
    address: address || '',
    createdAt: new Date().toISOString(),
    status: 'active',
    salt,
    passwordHash
  };

  db.users.push(newUser);
  dbManager.persist();

  const token = `${newUser.role}_${newUser.id}_${Date.now()}`;
  const { passwordHash: _, salt: __, ...userProfile } = newUser;
  res.status(201).json({ token, user: userProfile });
});

// User Login (Customer / Worker)
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body; // mobile or email
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Mobile/Email and password are required' });
  }

  const cleanId = identifier.trim().toLowerCase();
  const user = db.users.find(u => u.mobile === identifier.trim() || (u.email && u.email.toLowerCase() === cleanId));
  if (!user) {
    return res.status(401).json({ error: 'Invalid mobile/email or password' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Account has been suspended. Please contact FIRST STEP support.' });
  }

  const valid = verifyPassword(password, user.passwordHash, user.salt);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid mobile/email or password' });
  }

  let token = `${user.role}_${user.id}_${Date.now()}`;
  if (user.role === 'admin') {
    token = `admin_${user.id}_${Date.now()}`;
    if (!db.adminTokens) db.adminTokens = [];
    db.adminTokens.push({
      token,
      adminId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    });
    dbManager.persist();
  }

  const { passwordHash: _, salt: __, ...userProfile } = user;
  res.json({ token, user: userProfile });
});

// Dedicated Admin Login Checkpoint
app.post('/api/auth/admin-login', (req, res) => {
  const { identifier, password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Admin password is required' });
  }

  const cleanId = (identifier || '').trim().toLowerCase();

  // STRICT ROLE SEPARATION: Check if the identifier belongs to a Customer or Worker
  if (cleanId && cleanId !== 'admin' && cleanId !== 'administrator') {
    const nonAdmin = db.users.find(u => 
      (u.mobile === identifier.trim() || (u.email && u.email.toLowerCase() === cleanId)) &&
      u.role !== 'admin'
    );
    if (nonAdmin) {
      logAdminAction('system', 'Security Guard', 'Unauthorized Admin Login Attempt', `User ${nonAdmin.name} (${nonAdmin.mobile}, Role: ${nonAdmin.role}) attempted to authenticate via Admin Portal`);
      return res.status(403).json({ error: 'Access denied: Customer and Worker accounts are strictly prohibited from accessing the Admin Portal.' });
    }
  }

  // Find admin account: by identifier (admin, administrator, email, mobile, id) or primary admin
  let admin = db.users.find(u => u.role === 'admin' && (
    cleanId === '' ||
    cleanId === 'admin' ||
    cleanId === 'administrator' ||
    cleanId === 'admin@firststep.pk' ||
    cleanId === '03209976716' ||
    u.mobile === identifier.trim() ||
    (u.email && u.email.toLowerCase() === cleanId) ||
    u.id === identifier.trim()
  ));

  // Fallback to primary admin account if identifier is standard or omitted
  if (!admin) {
    admin = db.users.find(u => u.role === 'admin');
  }

  if (!admin) {
    return res.status(404).json({ error: 'Admin account not configured in database' });
  }

  const valid = verifyPassword(password, admin.passwordHash, admin.salt);
  if (!valid) {
    logAdminAction(admin.id, admin.name, 'Admin Login Failed', 'Incorrect admin password attempt');
    return res.status(401).json({ error: 'Incorrect Admin password. Please check your password and try again.' });
  }

  // Valid session token created and committed
  const token = `admin_${admin.id}_${Date.now()}`;
  if (!db.adminTokens) db.adminTokens = [];
  db.adminTokens.push({
    token,
    adminId: admin.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
  });
  dbManager.persist();

  logAdminAction(admin.id, admin.name, 'Admin Login', 'Admin authenticated successfully');

  const { passwordHash: _, salt: __, ...adminProfile } = admin;
  res.json({ token, user: adminProfile });
});

// Admin Password Recovery / Reset
app.post('/api/admin/recover-password', (req, res) => {
  const { identifier, recoveryKey, newPassword, confirmPassword } = req.body;
  if (!recoveryKey || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Recovery security key, new password and confirmation are required' });
  }

  const cleanId = (identifier || '').trim().toLowerCase();
  let admin = db.users.find(u => u.role === 'admin' && (
    cleanId === '' ||
    cleanId === 'admin' ||
    cleanId === 'administrator' ||
    cleanId === 'admin@firststep.pk' ||
    cleanId === '03209976716' ||
    u.mobile === identifier.trim() ||
    (u.email && u.email.toLowerCase() === cleanId)
  ));
  if (!admin) {
    admin = db.users.find(u => u.role === 'admin');
  }
  if (!admin) {
    return res.status(404).json({ error: 'Admin account not found' });
  }

  // Verify recovery key
  const validRecoveryKeys = ['FIRSTSTEP-ADMIN-SAFE-03209976716', db.settings?.contactNumber || '03209976716', 'FIRSTSTEP2026', 'admin123'];
  if (!validRecoveryKeys.includes(recoveryKey.trim())) {
    logAdminAction(admin.id, admin.name, 'Admin Recovery Failed', 'Invalid security recovery key entered');
    return res.status(403).json({ error: 'Invalid security recovery key. Please check your credentials or contact FIRST STEP Operations.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirmation do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const newSalt = generateSalt();
  admin.salt = newSalt;
  admin.passwordHash = hashPassword(newPassword, newSalt);

  // Invalidate old tokens
  if (db.adminTokens) {
    db.adminTokens = db.adminTokens.filter(t => t.adminId !== admin.id);
  } else {
    db.adminTokens = [];
  }

  const freshToken = `admin_${admin.id}_${Date.now()}`;
  db.adminTokens.push({
    token: freshToken,
    adminId: admin.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
  });

  logAdminAction(admin.id, admin.name, 'Admin Password Recovered', 'Admin password recovered using verified security key');
  dbManager.persist();

  res.json({ success: true, message: 'Admin password recovered and updated successfully', token: freshToken });
});

// User Self Password Change (Customer or Worker)
app.post('/api/auth/change-my-password', requireAuth, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const user = db.users.find(u => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Current password, new password, and confirmation are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirmation do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const valid = verifyPassword(currentPassword, user.passwordHash, user.salt);
  if (!valid) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const newSalt = generateSalt();
  user.salt = newSalt;
  user.passwordHash = hashPassword(newPassword, newSalt);
  dbManager.persist();

  res.json({ success: true, message: 'Password updated successfully' });
});

// Admin Password Change (Strictly authenticated Admin only)
app.post('/api/admin/change-password', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const admin = db.users.find(u => u.id === req.user!.id);
  if (!admin) {
    return res.status(404).json({ error: 'Admin account not found' });
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Current password, new password, and confirmation are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirmation do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  // Verify current password
  const isMatch = verifyPassword(currentPassword, admin.passwordHash, admin.salt);
  if (!isMatch) {
    logAdminAction(admin.id, admin.name, 'Password Change Failed', 'Incorrect current password provided');
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  // Hash new password with fresh salt
  const newSalt = generateSalt();
  const newHash = hashPassword(newPassword, newSalt);
  admin.salt = newSalt;
  admin.passwordHash = newHash;

  // Revoke previous admin tokens
  if (db.adminTokens) {
    db.adminTokens = db.adminTokens.filter(t => t.adminId !== admin.id);
  } else {
    db.adminTokens = [];
  }

  // Create new session token for the admin
  const freshToken = `admin_${admin.id}_${Date.now()}`;
  db.adminTokens.push({
    token: freshToken,
    adminId: admin.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
  });

  logAdminAction(admin.id, admin.name, 'Password Changed', 'Admin password successfully updated. Previous sessions invalidated.');
  dbManager.persist();

  res.json({ success: true, message: 'Admin password changed successfully', token: freshToken });
});

// Get Current User Profile & Role Data
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let workerProfile: WorkerProfile | undefined;
  if (user.role === 'worker') {
    workerProfile = db.workers.find(w => w.userId === user.id);
  }
  const { passwordHash: _, salt: __, ...cleanUser } = user as any;
  res.json({ user: cleanUser, workerProfile });
});

// ==========================================
// 2. CATEGORIES & SERVICES SYSTEM
// ==========================================

// Get All Categories (Public)
app.get('/api/categories', (req, res) => {
  const isAdmin = (req as AuthenticatedRequest).user?.role === 'admin';
  const categories = isAdmin ? db.categories : db.categories.filter(c => c.isActive);
  res.json(categories.sort((a, b) => a.order - b.order));
});

// Admin Add Category
app.post('/api/admin/categories', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { name, nameUrdu, icon, description, services } = req.body;
  if (!name || !nameUrdu) {
    return res.status(400).json({ error: 'Category name in English and Urdu required' });
  }

  const newCat = {
    id: `cat-${Date.now()}`,
    name,
    nameUrdu,
    icon: icon || '🛠️',
    description: description || '',
    order: db.categories.length + 1,
    isActive: true,
    services: Array.isArray(services) ? services : []
  };

  db.categories.push(newCat);
  logAdminAction(req.user!.id, req.user!.name, 'Category Added', `Added category: ${name}`);
  dbManager.persist();

  res.status(201).json(newCat);
});

// Admin Edit Category
app.put('/api/admin/categories/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const index = db.categories.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const existing = db.categories[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id // protect ID
  };

  db.categories[index] = updated;
  logAdminAction(req.user!.id, req.user!.name, 'Category Updated', `Updated category: ${updated.name}`);
  dbManager.persist();

  res.json(updated);
});

// Admin Delete Category
app.delete('/api/admin/categories/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const cat = db.categories.find(c => c.id === id);
  if (!cat) {
    return res.status(404).json({ error: 'Category not found' });
  }

  db.categories = db.categories.filter(c => c.id !== id);
  logAdminAction(req.user!.id, req.user!.name, 'Category Deleted', `Deleted category: ${cat.name}`);
  dbManager.persist();

  res.json({ success: true });
});

// ==========================================
// 3. WORKER REGISTRATION & PROFILES
// ==========================================

// Worker Registration (8 Steps)
app.post('/api/workers/register', (req, res) => {
  const {
    name,
    mobile,
    password,
    city,
    area,
    services,
    experience,
    startingPrice,
    priceType,
    visitCharge,
    avatarUrl,
    cnicFrontUrl,
    cnicBackUrl
  } = req.body;

  if (!name || !mobile || !password || !city || !area || !services || !services.length) {
    return res.status(400).json({ error: 'Name, mobile, password, city, area and at least one service are required' });
  }

  const existingUser = db.users.find(u => u.mobile === mobile);
  if (existingUser) {
    return res.status(400).json({ error: 'A user with this mobile number already exists' });
  }

  // Automatic category assignment: find all categories that contain the selected services
  const assignedCategoriesSet = new Set<string>();
  for (const srvName of services) {
    for (const cat of db.categories) {
      if (cat.services.some(s => s.name.toLowerCase() === srvName.toLowerCase())) {
        assignedCategoriesSet.add(cat.name);
      }
    }
  }

  // If none matched directly, assign 'Other Services' or primary match
  if (assignedCategoriesSet.size === 0) {
    assignedCategoriesSet.add('Other Services');
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const userId = `usr-wkr-${Date.now()}`;

  const newUser: User & { passwordHash: string; salt: string } = {
    id: userId,
    role: 'worker',
    name,
    mobile,
    city,
    area,
    createdAt: new Date().toISOString(),
    status: 'active',
    salt,
    passwordHash,
    avatarUrl: avatarUrl || ''
  };

  const newWorker: WorkerProfile = {
    id: `wkr-${Date.now()}`,
    userId,
    name,
    mobile,
    city,
    area,
    services: Array.isArray(services) ? services : [services],
    categories: Array.from(assignedCategoriesSet),
    experience: experience || '1–3 years',
    startingPrice: priceType === 'discuss' ? null : (Number(startingPrice) || null),
    priceType: priceType === 'discuss' ? 'discuss' : 'fixed',
    visitCharge: Number(visitCharge) || 300,
    about: `Professional service provider specializing in ${services.slice(0, 3).join(', ')}.`,
    rating: 5.0,
    reviewCount: 0,
    completedJobsCount: 0,
    verificationStatus: 'pending', // Reviewed by admin
    availability: 'available',
    avatarUrl: avatarUrl || '',
    cnicFrontUrl: cnicFrontUrl || '',
    cnicBackUrl: cnicBackUrl || '',
    cnicStatus: (cnicFrontUrl && cnicBackUrl) ? 'under_review' : 'pending',
    portfolio: [],
    badges: [],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  db.workers.push(newWorker);

  // Send admin notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: 'admin-1',
    role: 'admin',
    title: 'New Worker Registration',
    message: `${name} registered for ${newWorker.services.join(', ')} in ${city}. Pending review.`,
    type: 'system',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  dbManager.persist();

  const token = `worker_${newUser.id}_${Date.now()}`;
  res.status(201).json({
    token,
    user: newUser,
    worker: newWorker,
    message: 'Registration Submitted! Your profile will be reviewed by FIRST STEP.'
  });
});

// Admin Add Worker Manually
app.post('/api/admin/workers', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const {
    name,
    mobile,
    email,
    password,
    city,
    area,
    services,
    categories,
    experience,
    startingPrice,
    visitCharge,
    about,
    verificationStatus,
    avatarUrl
  } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ error: 'Name and mobile number are required' });
  }

  const existingUser = db.users.find(u => u.mobile === mobile);
  if (existingUser) {
    return res.status(400).json({ error: 'User with this mobile already exists' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password || 'worker123', salt);
  const userId = `usr-wkr-${Date.now()}`;

  const newUser: User & { passwordHash: string; salt: string } = {
    id: userId,
    role: 'worker',
    name,
    mobile,
    email: email || '',
    city: city || 'Karachi',
    area: area || '',
    avatarUrl: avatarUrl || '',
    createdAt: new Date().toISOString(),
    status: 'active',
    salt,
    passwordHash
  };

  const newWorker: WorkerProfile = {
    id: `wkr-${Date.now()}`,
    userId,
    name,
    mobile,
    city: city || 'Karachi',
    area: area || '',
    services: Array.isArray(services) ? services : [],
    categories: Array.isArray(categories) ? categories : [],
    experience: experience || '3–5 years',
    startingPrice: startingPrice ? Number(startingPrice) : null,
    priceType: startingPrice ? 'fixed' : 'discuss',
    visitCharge: Number(visitCharge) || 300,
    about: about || '',
    rating: 5.0,
    reviewCount: 0,
    completedJobsCount: 0,
    verificationStatus: verificationStatus || 'verified',
    availability: 'available',
    avatarUrl: avatarUrl || '',
    cnicStatus: 'approved',
    portfolio: [],
    badges: verificationStatus === 'verified' ? ['Verified ID'] : [],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  db.workers.push(newWorker);
  logAdminAction(req.user!.id, req.user!.name, 'Worker Created Manually', `Created worker ${name} (${mobile})`);
  dbManager.persist();

  res.status(201).json({ user: newUser, worker: newWorker });
});

// Search & List Workers (Public)
app.get('/api/workers', (req, res) => {
  const { category, service, city, area, availability, minRating, maxPrice, verifiedOnly } = req.query;
  const isAdmin = (req as AuthenticatedRequest).user?.role === 'admin';

  let list = db.workers.map(w => {
    // CRITICAL PRIVACY: Never expose CNIC URLs on public endpoint!
    if (!isAdmin) {
      const { cnicFrontUrl, cnicBackUrl, ...safeWorker } = w;
      return safeWorker as WorkerProfile;
    }
    return w;
  });

  if (!isAdmin) {
    // Only show approved/verified workers to general public unless searching specific
    list = list.filter(w => w.verificationStatus === 'verified');
  }

  if (category) {
    list = list.filter(w => w.categories.some(c => c.toLowerCase() === String(category).toLowerCase()));
  }

  if (service) {
    list = list.filter(w => w.services.some(s => s.toLowerCase().includes(String(service).toLowerCase())));
  }

  if (city) {
    list = list.filter(w => w.city.toLowerCase() === String(city).toLowerCase());
  }

  if (area) {
    list = list.filter(w => w.area.toLowerCase().includes(String(area).toLowerCase()));
  }

  if (availability) {
    list = list.filter(w => w.availability === availability);
  }

  if (minRating) {
    list = list.filter(w => w.rating >= Number(minRating));
  }

  if (maxPrice) {
    list = list.filter(w => w.startingPrice === null || w.startingPrice <= Number(maxPrice));
  }

  if (verifiedOnly === 'true') {
    list = list.filter(w => w.verificationStatus === 'verified');
  }

  res.json(list);
});

// Get Single Worker Profile
app.get('/api/workers/:id', (req, res) => {
  const { id } = req.params;
  const worker = db.workers.find(w => w.id === id || w.userId === id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const isAdmin = (req as AuthenticatedRequest).user?.role === 'admin';
  if (!isAdmin) {
    const { cnicFrontUrl, cnicBackUrl, ...safeWorker } = worker;
    return res.json(safeWorker);
  }

  res.json(worker);
});

// Worker Update Availability (One-tap "Off Today" or "Available")
app.put('/api/workers/:id/availability', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { availability, weeklyOffDays, vacationDates } = req.body;
  const worker = db.workers.find(w => w.id === id || w.userId === id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  // Authorization check
  if (req.user!.role !== 'admin' && req.user!.id !== worker.userId) {
    return res.status(403).json({ error: 'Unauthorized to change this worker availability' });
  }

  if (availability) worker.availability = availability;
  if (weeklyOffDays) worker.weeklyOffDays = weeklyOffDays;
  if (vacationDates) worker.vacationDates = vacationDates;

  dbManager.persist();
  res.json({ success: true, availability: worker.availability, worker });
});

// Worker Update Profile Details
app.put('/api/workers/:id/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const worker = db.workers.find(w => w.id === id || w.userId === id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  if (req.user!.role !== 'admin' && req.user!.id !== worker.userId) {
    return res.status(403).json({ error: 'Unauthorized to modify profile' });
  }

  const { about, services, visitCharge, startingPrice, priceType, avatarUrl, portfolio } = req.body;
  if (about !== undefined) worker.about = about;
  if (visitCharge !== undefined) worker.visitCharge = Number(visitCharge);
  if (startingPrice !== undefined) worker.startingPrice = startingPrice !== null ? Number(startingPrice) : null;
  if (priceType !== undefined) worker.priceType = priceType;
  if (avatarUrl) worker.avatarUrl = avatarUrl;
  if (portfolio) worker.portfolio = portfolio;

  if (services && Array.isArray(services)) {
    worker.services = services;
    // Auto-update categories
    const catSet = new Set<string>();
    for (const s of services) {
      for (const cat of db.categories) {
        if (cat.services.some(item => item.name.toLowerCase() === s.toLowerCase())) {
          catSet.add(cat.name);
        }
      }
    }
    if (catSet.size > 0) {
      worker.categories = Array.from(catSet);
    }
  }

  dbManager.persist();
  res.json({ success: true, worker });
});

// Worker Profile Picture Upload / Change / Remove
app.put('/api/workers/:id/profile-picture', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { avatarUrl } = req.body;
  const worker = db.workers.find(w => w.id === id || w.userId === id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  // Only the worker himself or admin can change the profile picture
  if (req.user!.role !== 'admin' && req.user!.id !== worker.userId) {
    return res.status(403).json({ error: 'Unauthorized to change this profile picture' });
  }

  worker.avatarUrl = avatarUrl || '';
  const userObj = db.users.find(u => u.id === worker.userId);
  if (userObj) {
    userObj.avatarUrl = avatarUrl || '';
  }

  dbManager.persist();
  res.json({ success: true, avatarUrl: worker.avatarUrl, worker });
});

// Worker Re-upload Documents & Profile Photo
app.put('/api/workers/:id/reupload-documents', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { cnicFrontUrl, cnicBackUrl, avatarUrl } = req.body;
  const worker = db.workers.find(w => w.id === id || w.userId === id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  if (req.user!.role !== 'admin' && req.user!.id !== worker.userId) {
    return res.status(403).json({ error: 'Unauthorized to re-upload documents for this worker' });
  }

  if (cnicFrontUrl) worker.cnicFrontUrl = cnicFrontUrl;
  if (cnicBackUrl) worker.cnicBackUrl = cnicBackUrl;
  if (avatarUrl) {
    worker.avatarUrl = avatarUrl;
    const userObj = db.users.find(u => u.id === worker.userId);
    if (userObj) userObj.avatarUrl = avatarUrl;
  }

  worker.cnicStatus = 'under_review';
  worker.verificationStatus = 'under_review';
  worker.verificationNote = 'Documents re-uploaded by worker. Pending administrative verification.';

  // Notify admin
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: 'admin-1',
    role: 'admin',
    title: 'Worker Documents Re-uploaded',
    message: `${worker.name} has re-uploaded identity documents. Pending review.`,
    type: 'system',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  dbManager.persist();
  res.json({ success: true, worker, message: 'Documents submitted for verification review.' });
});

// Admin Worker Verification Action (Approve, Reject, Request Re-upload, Keep Pending, Suspend, Restore)
app.put('/api/admin/workers/:id/verify', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { action, verificationStatus, note } = req.body;
  const worker = db.workers.find(w => w.id === id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  let finalStatus: 'pending' | 'under_review' | 'verified' | 'rejected' | 'reupload_required' | 'suspended' = worker.verificationStatus;

  if (action === 'approve' || verificationStatus === 'verified') {
    finalStatus = 'verified';
    worker.cnicStatus = 'approved';
    if (!worker.badges.includes('Verified ID')) {
      worker.badges.push('Verified ID');
    }
    const u = db.users.find(usr => usr.id === worker.userId);
    if (u) u.status = 'active';
  } else if (action === 'reject' || verificationStatus === 'rejected') {
    finalStatus = 'rejected';
    worker.badges = worker.badges.filter(b => b !== 'Verified ID');
  } else if (action === 'request_reupload' || verificationStatus === 'reupload_required') {
    finalStatus = 'reupload_required';
    worker.cnicStatus = 'reupload_required';
  } else if (action === 'keep_pending' || verificationStatus === 'pending') {
    finalStatus = 'pending';
  } else if (action === 'suspend' || verificationStatus === 'suspended') {
    finalStatus = 'suspended';
    worker.availability = 'offline';
    const u = db.users.find(usr => usr.id === worker.userId);
    if (u) u.status = 'suspended';
  } else if (action === 'restore') {
    finalStatus = 'verified';
    const u = db.users.find(usr => usr.id === worker.userId);
    if (u) u.status = 'active';
    if (!worker.badges.includes('Verified ID')) {
      worker.badges.push('Verified ID');
    }
  } else if (verificationStatus) {
    finalStatus = verificationStatus;
  }

  worker.verificationStatus = finalStatus;
  if (note !== undefined) {
    worker.verificationNote = note;
  }

  // Notify worker
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: worker.userId,
    role: 'worker',
    title: 'Verification Status Update',
    message: `Your FIRST STEP profile status has been set to: ${finalStatus.replace(/_/g, ' ').toUpperCase()}.${note ? ` Note: ${note}` : ''}`,
    type: 'system',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  logAdminAction(req.user!.id, req.user!.name, 'Worker Verification Updated', `Worker ${worker.name} set to ${finalStatus} (${note || 'No note'})`);
  dbManager.persist();

  res.json({ success: true, worker });
});

// Admin Review Worker CNIC (Approve / Reject)
app.put('/api/admin/workers/:id/cnic', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { cnicStatus, rejectReason } = req.body;
  const worker = db.workers.find(w => w.id === id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  worker.cnicStatus = cnicStatus;
  if (rejectReason) {
    worker.cnicRejectReason = rejectReason;
  }

  if (cnicStatus === 'approved') {
    worker.verificationStatus = 'verified';
    if (!worker.badges.includes('Verified ID')) {
      worker.badges.push('Verified ID');
    }
  }

  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: worker.userId,
    role: 'worker',
    title: 'CNIC Review Result',
    message: cnicStatus === 'approved' ? 'Your CNIC documents have been approved by FIRST STEP.' : `CNIC update: ${cnicStatus}. ${rejectReason || ''}`,
    type: 'system',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  logAdminAction(req.user!.id, req.user!.name, 'CNIC Status Changed', `Worker ${worker.name} CNIC status set to ${cnicStatus}`);
  dbManager.persist();

  res.json({ success: true, worker });
});

// Admin Only: Access Worker Verification Documents (CNIC)
app.get('/api/admin/workers/:id/documents', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const worker = db.workers.find(w => w.id === id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  res.json({
    workerId: worker.id,
    workerName: worker.name,
    cnicStatus: worker.cnicStatus,
    cnicFrontUrl: worker.cnicFrontUrl,
    cnicBackUrl: worker.cnicBackUrl,
    cnicRejectReason: worker.cnicRejectReason
  });
});

// ==========================================
// 4. NORMAL BOOKINGS SYSTEM
// ==========================================

// Create Normal Booking Request
app.post('/api/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
  const { workerId, serviceName, categoryName, bookingDate, bookingTime, city, area, address, description, photos } = req.body;
  const customer = req.user!;

  if (!workerId || !serviceName || !bookingDate || !bookingTime || !city || !address) {
    return res.status(400).json({ error: 'Worker, service, date, time, city and address are required' });
  }

  const worker = db.workers.find(w => w.id === workerId);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  // Determine estimated price: service base price or worker starting price + visit charge
  let estAmount = worker.startingPrice || 1000;
  const matchedCat = db.categories.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
  const matchedSrv = matchedCat?.services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
  if (matchedSrv?.basePrice) {
    estAmount = matchedSrv.basePrice;
  }

  const commissionPercent = worker.customCommissionRate || db.settings.defaultCommissionPercent;
  const commissionAmount = Math.round((estAmount * commissionPercent) / 100);
  const workerPayoutAmount = estAmount - commissionAmount;

  const newBooking: Booking = {
    id: `bk-${Date.now().toString().slice(-6)}`,
    customerId: customer.id,
    customerName: customer.name,
    customerMobile: customer.mobile,
    workerId: worker.id,
    workerName: worker.name,
    workerMobile: worker.mobile,
    serviceName,
    categoryName: categoryName || worker.categories[0] || 'General Service',
    bookingDate,
    bookingTime,
    city,
    area: area || customer.area,
    address,
    description: description || '',
    photos: Array.isArray(photos) ? photos : [],
    status: 'requested',
    totalAmount: estAmount,
    commissionPercent,
    commissionAmount,
    workerPayoutAmount,
    additionalCharges: [],
    isPaid: false,
    createdAt: new Date().toISOString()
  };

  db.bookings.unshift(newBooking);

  // Notify Worker
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: worker.userId,
    role: 'worker',
    title: 'New Booking Request',
    message: `${customer.name} requested ${serviceName} on ${bookingDate} at ${bookingTime}.`,
    type: 'booking',
    link: `/worker/bookings`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Notify Admin
  db.notifications.push({
    id: `notif-adm-${Date.now()}`,
    userId: 'admin-1',
    role: 'admin',
    title: 'New Booking Created',
    message: `Booking #${newBooking.id} created for ${worker.name} by ${customer.name}.`,
    type: 'booking',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  dbManager.persist();
  res.status(201).json(newBooking);
});

// List Bookings (Customer, Worker, or Admin)
app.get('/api/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'admin') {
    return res.json(db.bookings);
  }

  if (user.role === 'worker') {
    const workerProfile = db.workers.find(w => w.userId === user.id);
    if (!workerProfile) {
      return res.json([]);
    }
    return res.json(db.bookings.filter(b => b.workerId === workerProfile.id));
  }

  // Customer
  res.json(db.bookings.filter(b => b.customerId === user.id));
});

// Update Booking Status Lifecycle
app.put('/api/bookings/:id/status', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const booking = db.bookings.find(b => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const user = req.user!;
  const workerProfile = db.workers.find(w => w.id === booking.workerId);

  // Status transitions handling
  if (status === 'accepted') {
    // Worker accepts booking
    if (user.role !== 'admin' && workerProfile?.userId !== user.id) {
      return res.status(403).json({ error: 'Only assigned worker can accept this booking' });
    }
    booking.status = 'payment_pending';
    // Notify customer
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: booking.customerId,
      role: 'customer',
      title: 'Booking Accepted',
      message: `${booking.workerName} accepted your booking for ${booking.serviceName}. Please submit payment to FIRST STEP company account to confirm.`,
      type: 'booking',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } else if (status === 'rejected') {
    booking.status = 'rejected';
    booking.rejectionReason = reason || 'Worker is unavailable at the requested time slot';
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: booking.customerId,
      role: 'customer',
      title: 'Booking Declined',
      message: `${booking.workerName} could not accept your booking. ${reason ? `Reason: ${reason}` : ''}`,
      type: 'booking',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } else if (status === 'in_progress') {
    booking.status = 'in_progress';
  } else if (status === 'completed') {
    booking.status = 'completed';
    booking.completedAt = new Date().toISOString();
    // Notify customer to confirm completion
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: booking.customerId,
      role: 'customer',
      title: 'Job Completed by Worker',
      message: `${booking.workerName} has marked your ${booking.serviceName} job as completed. Please confirm to release payment.`,
      type: 'booking',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } else if (status === 'customer_confirmed') {
    // Customer confirms completion
    if (user.role !== 'admin' && user.id !== booking.customerId) {
      return res.status(403).json({ error: 'Only customer can confirm job completion' });
    }
    booking.status = 'customer_confirmed';
    booking.customerConfirmedAt = new Date().toISOString();

    // Increment completed jobs count for worker
    if (workerProfile) {
      workerProfile.completedJobsCount = (workerProfile.completedJobsCount || 0) + 1;
    }

    // Automatically create pending worker payout for admin release
    const existingPayout = db.workerPayouts.find(p => p.bookingId === booking.id);
    if (!existingPayout) {
      const newPayout: WorkerPayout = {
        id: `payout-${Date.now()}`,
        workerId: booking.workerId,
        workerName: booking.workerName,
        bookingId: booking.id,
        customerPayment: booking.totalAmount,
        commission: booking.commissionAmount,
        bonus: 0,
        adjustments: 0,
        netPayout: booking.workerPayoutAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      db.workerPayouts.unshift(newPayout);
    }

    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: workerProfile?.userId || '',
      role: 'worker',
      title: 'Customer Confirmed Job',
      message: `${booking.customerName} has confirmed completion of #${booking.id}. Payout PKR ${booking.workerPayoutAmount} queued for release.`,
      type: 'payout',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } else if (status === 'cancelled') {
    booking.status = 'cancelled';
  }

  dbManager.persist();
  res.json({ success: true, booking });
});

// Worker Request Additional Charges
app.post('/api/bookings/:id/additional-charge', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason, amount } = req.body;
  const booking = db.bookings.find(b => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (!reason || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid reason and positive charge amount are required' });
  }

  const charge = {
    id: `chg-${Date.now()}`,
    reason,
    amount: Number(amount),
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };

  booking.additionalCharges.push(charge);

  // Notify customer
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: booking.customerId,
    role: 'customer',
    title: 'Additional Charge Request',
    message: `${booking.workerName} requested PKR ${amount} for: ${reason}. Please approve or reject.`,
    type: 'booking',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  dbManager.persist();
  res.status(201).json({ success: true, charge, booking });
});

// Customer Approve / Reject Additional Charge
app.put('/api/bookings/:id/additional-charge/:chargeId', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id, chargeId } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'
  const booking = db.bookings.find(b => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const charge = booking.additionalCharges.find(c => c.id === chargeId);
  if (!charge) {
    return res.status(404).json({ error: 'Additional charge not found' });
  }

  charge.status = status;
  if (status === 'approved') {
    booking.totalAmount += charge.amount;
    const addCommission = Math.round((charge.amount * booking.commissionPercent) / 100);
    booking.commissionAmount += addCommission;
    booking.workerPayoutAmount += (charge.amount - addCommission);
  }

  dbManager.persist();
  res.json({ success: true, charge, booking });
});

// ==========================================
// 5. CUSTOM JOB SYSTEM & COUNTER OFFERS
// ==========================================

// Create Custom Job (Customer)
app.post('/api/custom-jobs', requireAuth, (req: AuthenticatedRequest, res) => {
  const { title, categoryName, serviceName, description, photos, city, area, address, date, urgency, budget } = req.body;
  const customer = req.user!;

  if (!title || !categoryName || !budget || !city || !address) {
    return res.status(400).json({ error: 'Title, category, budget, city and address are required' });
  }

  const newJob: CustomJob = {
    id: `job-${Date.now().toString().slice(-6)}`,
    customerId: customer.id,
    customerName: customer.name,
    customerMobile: customer.mobile,
    title,
    categoryName,
    serviceName: serviceName || 'General Custom Task',
    description: description || '',
    photos: Array.isArray(photos) ? photos : [],
    city,
    area: area || customer.area,
    address,
    date: date || new Date().toISOString().split('T')[0],
    urgency: urgency || 'normal',
    budget: Number(budget),
    status: 'open',
    offersCount: 0,
    createdAt: new Date().toISOString()
  };

  db.customJobs.unshift(newJob);

  // Notify workers in this category
  const relevantWorkers = db.workers.filter(w => w.city.toLowerCase() === city.toLowerCase() && w.categories.includes(categoryName));
  for (const w of relevantWorkers) {
    db.notifications.push({
      id: `notif-${Date.now()}-${w.id}`,
      userId: w.userId,
      role: 'worker',
      title: 'New Custom Job Posted',
      message: `New job in ${city}: "${title}" (Budget: PKR ${budget}). Tap to make an offer!`,
      type: 'job',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  dbManager.persist();
  res.status(201).json(newJob);
});

// List Custom Jobs
app.get('/api/custom-jobs', (req, res) => {
  const { category, city, status } = req.query;
  let list = db.customJobs;

  if (status) {
    list = list.filter(j => j.status === status);
  }
  if (category) {
    list = list.filter(j => j.categoryName.toLowerCase() === String(category).toLowerCase());
  }
  if (city) {
    list = list.filter(j => j.city.toLowerCase() === String(city).toLowerCase());
  }

  res.json(list);
});

// Send Counter Offer (Worker)
app.post('/api/custom-jobs/:id/offers', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { proposedPrice, message, estimatedArrival } = req.body;
  const job = db.customJobs.find(j => j.id === id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const worker = db.workers.find(w => w.userId === req.user!.id);
  if (!worker) {
    return res.status(403).json({ error: 'Only registered workers can submit job offers' });
  }

  const newOffer: JobOffer = {
    id: `off-${Date.now().toString().slice(-6)}`,
    jobId: job.id,
    workerId: worker.id,
    workerName: worker.name,
    workerAvatar: worker.avatarUrl,
    workerRating: worker.rating,
    workerCompletedJobs: worker.completedJobsCount,
    proposedPrice: Number(proposedPrice),
    message: message || '',
    estimatedArrival: estimatedArrival || 'Within 1 hour',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.jobOffers.unshift(newOffer);
  job.offersCount = (job.offersCount || 0) + 1;

  // Notify customer
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: job.customerId,
    role: 'customer',
    title: 'New Offer Received',
    message: `${worker.name} submitted an offer of PKR ${proposedPrice} for "${job.title}".`,
    type: 'offer',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  dbManager.persist();
  res.status(201).json(newOffer);
});

// Get Offers for a Job
app.get('/api/custom-jobs/:id/offers', (req, res) => {
  const { id } = req.params;
  const offers = db.jobOffers.filter(o => o.jobId === id);
  res.json(offers);
});

// Accept / Counter Offer (Customer)
app.put('/api/custom-jobs/:id/offers/:offerId/status', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id, offerId } = req.params;
  const { status, counterPrice } = req.body; // 'accepted', 'rejected', 'countered'
  const job = db.customJobs.find(j => j.id === id);
  const offer = db.jobOffers.find(o => o.id === offerId);

  if (!job || !offer) {
    return res.status(404).json({ error: 'Job or Offer not found' });
  }

  offer.status = status;

  if (status === 'countered' && counterPrice) {
    offer.counterPrice = Number(counterPrice);
  }

  if (status === 'accepted') {
    job.status = 'assigned';
    job.selectedWorkerId = offer.workerId;

    const worker = db.workers.find(w => w.id === offer.workerId);
    const commPercent = worker?.customCommissionRate || db.settings.defaultCommissionPercent;
    const finalAmount = offer.proposedPrice;
    const commAmount = Math.round((finalAmount * commPercent) / 100);

    // Automatically convert into formal booking!
    const newBooking: Booking = {
      id: `bk-cst-${Date.now().toString().slice(-6)}`,
      customerId: job.customerId,
      customerName: job.customerName,
      customerMobile: job.customerMobile,
      workerId: offer.workerId,
      workerName: offer.workerName,
      workerMobile: worker?.mobile || '',
      serviceName: job.serviceName,
      categoryName: job.categoryName,
      bookingDate: job.date,
      bookingTime: 'As agreed',
      city: job.city,
      area: job.area,
      address: job.address,
      description: job.description,
      photos: job.photos,
      status: 'payment_pending',
      totalAmount: finalAmount,
      commissionPercent: commPercent,
      commissionAmount: commAmount,
      workerPayoutAmount: finalAmount - commAmount,
      additionalCharges: [],
      isPaid: false,
      createdAt: new Date().toISOString()
    };

    db.bookings.unshift(newBooking);
    job.bookingId = newBooking.id;

    // Reject other pending offers
    db.jobOffers.forEach(o => {
      if (o.jobId === job.id && o.id !== offer.id && o.status === 'pending') {
        o.status = 'rejected';
      }
    });

    // Notify worker
    if (worker) {
      db.notifications.push({
        id: `notif-${Date.now()}`,
        userId: worker.userId,
        role: 'worker',
        title: 'Offer Accepted! Booking Created',
        message: `${job.customerName} accepted your PKR ${finalAmount} offer for "${job.title}". Booking #${newBooking.id} created!`,
        type: 'booking',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  dbManager.persist();
  res.json({ success: true, offer, job });
});

// ==========================================
// 6. PAYMENT SYSTEM (COMPANY COLLECTION)
// ==========================================

// Get Public Active Payment Methods (Meezan, Raast, Easypaisa)
app.get('/api/payment-methods', (req, res) => {
  const activeMethods = db.paymentMethods.filter(pm => pm.isActive).sort((a, b) => a.order - b.order);
  res.json(activeMethods);
});

// Customer Submit Payment Verification
app.post('/api/payments/submit', requireAuth, (req: AuthenticatedRequest, res) => {
  const { bookingId, amount, paymentMethodId, transactionId, screenshotUrl, paymentDate } = req.body;
  const customer = req.user!;

  if (!bookingId || !amount || !paymentMethodId || !transactionId) {
    return res.status(400).json({ error: 'Booking ID, amount, payment method and Transaction ID (Trx ID) are required' });
  }

  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const method = db.paymentMethods.find(m => m.id === paymentMethodId);
  const methodName = method?.name || 'Bank Transfer';

  const newPayment: Payment = {
    id: `pay-${Date.now().toString().slice(-6)}`,
    bookingId,
    customerId: customer.id,
    customerName: customer.name,
    amount: Number(amount),
    paymentMethodId,
    paymentMethodName: methodName,
    transactionId,
    screenshotUrl: screenshotUrl || '',
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    status: 'under_verification',
    createdAt: new Date().toISOString()
  };

  db.payments.unshift(newPayment);
  booking.paymentId = newPayment.id;
  booking.status = 'payment_submitted';

  // Notify Admin for Verification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: 'admin-1',
    role: 'admin',
    title: 'Payment Verification Needed',
    message: `${customer.name} submitted PKR ${amount} via ${methodName} for Booking #${bookingId} (Trx: ${transactionId}).`,
    type: 'payment',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  dbManager.persist();
  res.status(201).json({ success: true, payment: newPayment, message: 'Payment submitted for FIRST STEP verification.' });
});

// Admin Verify Payment
app.put('/api/admin/payments/:id/verify', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body; // 'confirmed' or 'rejected'
  const payment = db.payments.find(p => p.id === id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  payment.status = status;
  payment.verifiedAt = new Date().toISOString();
  payment.verifiedByAdminId = req.user!.id;
  if (rejectionReason) payment.rejectionReason = rejectionReason;

  const booking = db.bookings.find(b => b.id === payment.bookingId);
  if (booking) {
    if (status === 'confirmed') {
      booking.isPaid = true;
      booking.status = 'payment_verified';

      // Notify customer & worker
      db.notifications.push({
        id: `notif-${Date.now()}-c`,
        userId: booking.customerId,
        role: 'customer',
        title: 'Payment Confirmed by FIRST STEP',
        message: `Your payment of PKR ${payment.amount} has been verified and safely held. The worker will proceed with the job.`,
        type: 'payment',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      const worker = db.workers.find(w => w.id === booking.workerId);
      if (worker) {
        db.notifications.push({
          id: `notif-${Date.now()}-w`,
          userId: worker.userId,
          role: 'worker',
          title: 'Customer Payment Confirmed',
          message: `Payment for booking #${booking.id} is confirmed by FIRST STEP! You may now begin the job.`,
          type: 'booking',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    } else {
      booking.status = 'payment_pending';
      db.notifications.push({
        id: `notif-${Date.now()}-c`,
        userId: booking.customerId,
        role: 'customer',
        title: 'Payment Verification Failed',
        message: `Your payment verification could not be confirmed: ${rejectionReason || 'Invalid Transaction ID'}. Please re-submit or contact support.`,
        type: 'payment',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  logAdminAction(req.user!.id, req.user!.name, 'Payment Verified', `Payment ${payment.id} for Booking ${payment.bookingId} set to ${status}`);
  dbManager.persist();

  res.json({ success: true, payment });
});

// Admin List All Payments
app.get('/api/admin/payments', requireAuth, requireAdmin, (req, res) => {
  res.json(db.payments);
});

// Admin Payment Settings
app.get('/api/admin/payment-settings', requireAuth, requireAdmin, (req, res) => {
  res.json(db.paymentMethods);
});

// Admin Update Payment Method
app.put('/api/admin/payment-settings/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const index = db.paymentMethods.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Payment method not found' });
  }

  const existing = db.paymentMethods[index];
  const updated: PaymentMethod = {
    ...existing,
    ...req.body,
    id: existing.id
  };

  db.paymentMethods[index] = updated;
  logAdminAction(req.user!.id, req.user!.name, 'Payment Method Updated', `Updated account settings for ${updated.name}`);
  dbManager.persist();

  res.json(updated);
});

// Admin Add Payment Method
app.post('/api/admin/payment-settings', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { name, accountTitle, accountNumber, iban, easypaisaNumber, raastId, instructions, isActive } = req.body;
  if (!name || !accountTitle || !accountNumber) {
    return res.status(400).json({ error: 'Name, Account Title, and Account Number are required' });
  }

  const newMethod: PaymentMethod = {
    id: `pm-${Date.now()}`,
    name,
    accountTitle,
    accountNumber,
    iban: iban || '',
    easypaisaNumber: easypaisaNumber || '',
    raastId: raastId || '',
    instructions: instructions || '',
    isActive: isActive !== false,
    order: db.paymentMethods.length + 1
  };

  db.paymentMethods.push(newMethod);
  logAdminAction(req.user!.id, req.user!.name, 'Payment Method Added', `Added payment method: ${name}`);
  dbManager.persist();

  res.status(201).json(newMethod);
});

// ==========================================
// 7. WORKER PAYOUTS & EARNINGS
// ==========================================

// Worker Earnings Summary
app.get('/api/workers/:id/earnings', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const worker = db.workers.find(w => w.id === id || w.userId === id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const payouts = db.workerPayouts.filter(p => p.workerId === worker.id);
  const released = payouts.filter(p => p.status === 'released').reduce((sum, p) => sum + p.netPayout, 0);
  const pending = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.netPayout, 0);
  const totalCommission = payouts.reduce((sum, p) => sum + p.commission, 0);
  const totalBonus = payouts.reduce((sum, p) => sum + p.bonus, 0);

  res.json({
    totalEarnings: released + pending,
    releasedEarnings: released,
    pendingEarnings: pending,
    totalCommissionPaid: totalCommission,
    bonusesEarned: totalBonus,
    payoutHistory: payouts
  });
});

// Admin List All Payouts
app.get('/api/admin/payouts', requireAuth, requireAdmin, (req, res) => {
  res.json(db.workerPayouts);
});

// Admin Release Payout
app.put('/api/admin/payouts/:id/release', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const payout = db.workerPayouts.find(p => p.id === id);
  if (!payout) {
    return res.status(404).json({ error: 'Payout record not found' });
  }

  payout.status = 'released';
  payout.releasedAt = new Date().toISOString();

  // Notify worker
  const worker = db.workers.find(w => w.id === payout.workerId);
  if (worker) {
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: worker.userId,
      role: 'worker',
      title: 'Payout Released!',
      message: `FIRST STEP has released PKR ${payout.netPayout} to your registered payout account for Booking #${payout.bookingId}.`,
      type: 'payout',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  logAdminAction(req.user!.id, req.user!.name, 'Payout Released', `Released PKR ${payout.netPayout} to ${payout.workerName}`);
  dbManager.persist();

  res.json({ success: true, payout });
});

// Admin Hold Payout
app.put('/api/admin/payouts/:id/hold', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const payout = db.workerPayouts.find(p => p.id === id);
  if (!payout) {
    return res.status(404).json({ error: 'Payout not found' });
  }

  payout.status = 'held';
  payout.holdReason = reason || 'Under investigation / dispute hold';

  logAdminAction(req.user!.id, req.user!.name, 'Payout Held', `Held payout ${payout.id}: ${reason}`);
  dbManager.persist();

  res.json({ success: true, payout });
});

// ==========================================
// 8. RATINGS, REVIEWS & FAVORITES
// ==========================================

// Add Review (Only after completed confirmed booking)
app.post('/api/reviews', requireAuth, (req: AuthenticatedRequest, res) => {
  const { bookingId, rating, comment } = req.body;
  const customer = req.user!;

  if (!bookingId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Booking ID and rating (1–5 stars) are required' });
  }

  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.customerId !== customer.id) {
    return res.status(403).json({ error: 'Only the customer who booked can review this service' });
  }

  if (booking.status !== 'customer_confirmed' && booking.status !== 'completed') {
    return res.status(400).json({ error: 'Reviews can only be given after job is completed and confirmed' });
  }

  const existingReview = db.reviews.find(r => r.bookingId === bookingId);
  if (existingReview) {
    return res.status(400).json({ error: 'You have already reviewed this booking' });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    bookingId,
    workerId: booking.workerId,
    customerId: customer.id,
    customerName: customer.name,
    rating: Number(rating),
    comment: comment || '',
    createdAt: new Date().toISOString()
  };

  db.reviews.unshift(newReview);

  // Recalculate Worker Rating
  const worker = db.workers.find(w => w.id === booking.workerId);
  if (worker) {
    const workerReviews = db.reviews.filter(r => r.workerId === worker.id);
    const avgRating = workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length;
    worker.rating = Math.round(avgRating * 10) / 10;
    worker.reviewCount = workerReviews.length;
  }

  dbManager.persist();
  res.status(201).json(newReview);
});

// Get Worker Reviews
app.get('/api/reviews', (req, res) => {
  const { workerId } = req.query;
  if (workerId) {
    return res.json(db.reviews.filter(r => r.workerId === workerId));
  }
  res.json(db.reviews);
});

// Toggle Favorite Worker
app.post('/api/favorites/toggle', requireAuth, (req: AuthenticatedRequest, res) => {
  const { workerId } = req.body;
  const customerId = req.user!.id;
  const existingIdx = db.favorites.findIndex(f => f.customerId === customerId && f.workerId === workerId);

  if (existingIdx !== -1) {
    db.favorites.splice(existingIdx, 1);
    dbManager.persist();
    return res.json({ favorited: false });
  }

  db.favorites.push({
    id: `fav-${Date.now()}`,
    customerId,
    workerId,
    createdAt: new Date().toISOString()
  });

  dbManager.persist();
  res.json({ favorited: true });
});

// Get Customer Favorites
app.get('/api/favorites', requireAuth, (req: AuthenticatedRequest, res) => {
  const customerId = req.user!.id;
  const favIds = db.favorites.filter(f => f.customerId === customerId).map(f => f.workerId);
  const workers = db.workers.filter(w => favIds.includes(w.id));
  res.json(workers);
});

// ==========================================
// 9. REAL-TIME CHAT
// ==========================================

app.get('/api/chat/messages', requireAuth, (req: AuthenticatedRequest, res) => {
  const { conversationId, bookingId, jobId } = req.query;
  let messages = db.messages;

  if (conversationId) {
    messages = messages.filter(m => m.conversationId === conversationId);
  } else if (bookingId) {
    messages = messages.filter(m => m.bookingId === bookingId);
  } else if (jobId) {
    messages = messages.filter(m => m.jobId === jobId);
  }

  res.json(messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
});

app.post('/api/chat/messages', requireAuth, (req: AuthenticatedRequest, res) => {
  const { conversationId, bookingId, jobId, recipientId, text, attachmentUrl } = req.body;
  const sender = req.user!;

  if (!text && !attachmentUrl) {
    return res.status(400).json({ error: 'Text or attachment is required' });
  }

  const convId = conversationId || (bookingId ? `conv-bk-${bookingId}` : (jobId ? `conv-job-${jobId}` : `conv-${sender.id}-${recipientId}`));

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    conversationId: convId,
    bookingId: bookingId || '',
    jobId: jobId || '',
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    recipientId: recipientId || '',
    text: text || '',
    attachmentUrl: attachmentUrl || '',
    timestamp: new Date().toISOString(),
    isRead: false
  };

  db.messages.push(newMsg);
  dbManager.persist();

  res.status(201).json(newMsg);
});

// ==========================================
// 10. NOTIFICATIONS
// ==========================================

app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const notifs = db.notifications.filter(n => n.userId === user.id || (user.role === 'admin' && n.role === 'admin'));
  res.json(notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.put('/api/notifications/:id/read', requireAuth, (req, res) => {
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.isRead = true;
    dbManager.persist();
  }
  res.json({ success: true });
});

// ==========================================
// 11. DISPUTES & REFUNDS
// ==========================================

app.post('/api/disputes', requireAuth, (req: AuthenticatedRequest, res) => {
  const { bookingId, issueType, description } = req.body;
  const user = req.user!;

  if (!bookingId || !description) {
    return res.status(400).json({ error: 'Booking ID and description are required' });
  }

  const newDispute: Dispute = {
    id: `disp-${Date.now().toString().slice(-6)}`,
    bookingId,
    raisedByUserId: user.id,
    raisedByName: user.name,
    raisedByRole: user.role === 'worker' ? 'worker' : 'customer',
    issueType: issueType || 'service_problem',
    description,
    status: 'open',
    createdAt: new Date().toISOString()
  };

  db.disputes.unshift(newDispute);

  // Notify Admin
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: 'admin-1',
    role: 'admin',
    title: 'New Dispute Filed',
    message: `Dispute filed by ${user.name} for Booking #${bookingId}: "${description.slice(0, 40)}..."`,
    type: 'dispute',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  dbManager.persist();
  res.status(201).json(newDispute);
});

app.get('/api/disputes', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'admin') {
    return res.json(db.disputes);
  }
  res.json(db.disputes.filter(d => d.raisedByUserId === user.id));
});

app.put('/api/admin/disputes/:id/resolve', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, resolution, adminNotes } = req.body;
  const dispute = db.disputes.find(d => d.id === id);
  if (!dispute) {
    return res.status(404).json({ error: 'Dispute not found' });
  }

  dispute.status = status || 'resolved';
  dispute.resolution = resolution || '';
  dispute.adminNotes = adminNotes || '';
  dispute.resolvedAt = new Date().toISOString();

  logAdminAction(req.user!.id, req.user!.name, 'Dispute Resolved', `Dispute ${id} set to ${dispute.status}`);
  dbManager.persist();

  res.json({ success: true, dispute });
});

// Refunds
app.post('/api/refunds', requireAuth, (req: AuthenticatedRequest, res) => {
  const { bookingId, amount, type, reason } = req.body;
  const customer = req.user!;

  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const newRefund: Refund = {
    id: `ref-${Date.now().toString().slice(-6)}`,
    bookingId,
    customerId: customer.id,
    customerName: customer.name,
    originalAmount: booking.totalAmount,
    refundAmount: Number(amount) || booking.totalAmount,
    type: type || 'full',
    reason: reason || 'Customer requested refund',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.refunds.unshift(newRefund);
  dbManager.persist();

  res.status(201).json(newRefund);
});

app.get('/api/refunds', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'admin') {
    return res.json(db.refunds);
  }
  res.json(db.refunds.filter(r => r.customerId === user.id));
});

app.put('/api/admin/refunds/:id/approve', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body; // 'approved', 'rejected', 'processed'
  const refund = db.refunds.find(r => r.id === id);
  if (!refund) {
    return res.status(404).json({ error: 'Refund record not found' });
  }

  refund.status = status;
  refund.adminNotes = adminNotes || '';
  if (status === 'processed') {
    refund.processedAt = new Date().toISOString();
  }

  logAdminAction(req.user!.id, req.user!.name, 'Refund Processed', `Refund ${refund.id} of PKR ${refund.refundAmount} set to ${status}`);
  dbManager.persist();

  res.json({ success: true, refund });
});

// ==========================================
// 12. HERO WORKER POSTERS
// ==========================================

app.get('/api/posters', (req, res) => {
  const activePosters = db.posters.filter(p => p.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  res.json(activePosters);
});

app.get('/api/admin/posters', requireAuth, requireAdmin, (req, res) => {
  res.json(db.posters.sort((a, b) => a.displayOrder - b.displayOrder));
});

app.post('/api/admin/posters', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { title, titleUrdu, subtitle, subtitleUrdu, category, serviceName, imageUrl, buttonText, buttonTextUrdu, durationSeconds } = req.body;
  if (!title || !imageUrl) {
    return res.status(400).json({ error: 'Poster title and image are required' });
  }

  const newPoster: HeroPoster = {
    id: `poster-${Date.now()}`,
    title,
    titleUrdu: titleUrdu || title,
    subtitle: subtitle || '',
    subtitleUrdu: subtitleUrdu || subtitle || '',
    category: category || 'Plumbing',
    serviceName: serviceName || 'General',
    imageUrl,
    buttonText: buttonText || 'Book Now',
    buttonTextUrdu: buttonTextUrdu || 'ابھی بک کریں',
    displayOrder: db.posters.length + 1,
    durationSeconds: Number(durationSeconds) || 5,
    isActive: true
  };

  db.posters.push(newPoster);
  logAdminAction(req.user!.id, req.user!.name, 'Hero Poster Created', `Created poster: ${title}`);
  dbManager.persist();

  res.status(201).json(newPoster);
});

app.put('/api/admin/posters/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const index = db.posters.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Poster not found' });
  }

  const updated: HeroPoster = {
    ...db.posters[index],
    ...req.body,
    id: db.posters[index].id
  };

  db.posters[index] = updated;
  logAdminAction(req.user!.id, req.user!.name, 'Hero Poster Updated', `Updated poster: ${updated.title}`);
  dbManager.persist();

  res.json(updated);
});

app.delete('/api/admin/posters/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const poster = db.posters.find(p => p.id === id);
  if (!poster) {
    return res.status(404).json({ error: 'Poster not found' });
  }

  db.posters = db.posters.filter(p => p.id !== id);
  logAdminAction(req.user!.id, req.user!.name, 'Hero Poster Deleted', `Deleted poster: ${poster.title}`);
  dbManager.persist();

  res.json({ success: true });
});

// ==========================================
// 13. ADMIN DASHBOARD STATS & AUDIT LOGS
// ==========================================

app.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
  const customersCount = db.users.filter(u => u.role === 'customer').length;
  const workersCount = db.workers.length;
  const activeBookings = db.bookings.filter(b => ['requested', 'accepted', 'payment_submitted', 'payment_verified', 'in_progress'].includes(b.status)).length;
  const completedJobs = db.bookings.filter(b => ['completed', 'customer_confirmed', 'payout_released'].includes(b.status)).length;
  const totalRevenue = db.payments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = db.payments.filter(p => p.status === 'under_verification').length;
  const pendingPayouts = db.workerPayouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.netPayout, 0);
  const reviewsCount = db.reviews.length;

  res.json({
    customersCount,
    workersCount,
    activeBookings,
    completedJobs,
    totalRevenue,
    pendingPayments,
    pendingPayouts,
    reviewsCount
  });
});

app.get('/api/admin/needs-attention', requireAuth, requireAdmin, (req, res) => {
  const pendingWorkers = db.workers.filter(w => w.verificationStatus === 'pending' || w.verificationStatus === 'under_review');
  const pendingCnics = db.workers.filter(w => w.cnicStatus === 'under_review');
  const pendingPayments = db.payments.filter(p => p.status === 'under_verification');
  const openDisputes = db.disputes.filter(d => d.status === 'open' || d.status === 'under_review');
  const pendingRefunds = db.refunds.filter(r => r.status === 'pending');

  res.json({
    pendingWorkers,
    pendingCnics,
    pendingPayments,
    openDisputes,
    pendingRefunds
  });
});

app.get('/api/admin/audit-logs', requireAuth, requireAdmin, (req, res) => {
  res.json(db.auditLogs);
});

// ==========================================
// 14. SETTINGS
// ==========================================

app.get('/api/settings', (req, res) => {
  res.json(db.settings);
});

app.put('/api/admin/settings', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { contactNumber, siteName, supportEmail, defaultCommissionPercent, heroPostersEnabled, announcementText } = req.body;
  if (contactNumber) db.settings.contactNumber = contactNumber;
  if (siteName) db.settings.siteName = siteName;
  if (supportEmail) db.settings.supportEmail = supportEmail;
  if (defaultCommissionPercent !== undefined) db.settings.defaultCommissionPercent = Number(defaultCommissionPercent);
  if (heroPostersEnabled !== undefined) db.settings.heroPostersEnabled = Boolean(heroPostersEnabled);
  if (announcementText !== undefined) db.settings.announcementText = announcementText;

  logAdminAction(req.user!.id, req.user!.name, 'Settings Updated', `Updated site settings. Contact: ${db.settings.contactNumber}`);
  dbManager.persist();

  res.json(db.settings);
});

// Serve frontend in development using Vite middlewares
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FIRST STEP service marketplace running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
