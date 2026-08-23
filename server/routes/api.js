import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

// Controllers
import * as authController from '../controllers/authController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as incomeController from '../controllers/incomeController.js';
import * as expenseController from '../controllers/expenseController.js';
import * as donorController from '../controllers/donorController.js';
import * as receiptController from '../controllers/receiptController.js';
import * as cashController from '../controllers/cashController.js';
import * as memberController from '../controllers/memberController.js';
import * as eventController from '../controllers/eventController.js';
import * as reportController from '../controllers/reportController.js';
import * as auditController from '../controllers/auditController.js';
import * as settingsController from '../controllers/settingsController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as publicController from '../controllers/publicController.js';

const router = express.Router();

// ==========================================
// 1. PUBLIC ROUTES (No Auth Required)
// ==========================================
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

router.get('/public/verify-receipt/:identifier', receiptController.verifyPublicReceipt);
router.get('/public/donation-info', publicController.getPublicDonationInfo);
router.post('/public/donate', publicController.submitOnlineDonationIntent);

// ==========================================
// 2. AUTHENTICATED ROUTES
// ==========================================
router.use(authenticate);

// Current User
router.get('/auth/me', authController.getMe);

// User Management (Admin Only)
router.get('/users', requireRoles('admin'), authController.getUsers);
router.post('/users', requireRoles('admin'), authController.createUser);
router.put('/users/:id/role', requireRoles('admin'), authController.updateUserRole);
router.put('/users/:id/status', requireRoles('admin'), authController.updateUserStatus);
router.delete('/users/:id', requireRoles('admin'), authController.deleteUser);

// Dashboard
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// Income / Vargani
router.get('/income', incomeController.getIncomeList);
router.post('/income', upload.single('attachment'), incomeController.createIncome);
router.delete('/income/:id', requireRoles('admin'), incomeController.deleteIncome);

// Donors
router.get('/donors', donorController.getDonorsList);
router.get('/donors/search', donorController.searchDonors);
router.get('/donors/:id', donorController.getDonorById);
router.post('/donors', donorController.createDonor);
router.put('/donors/:id', donorController.updateDonor);

// Receipts
router.get('/receipts', receiptController.getAllReceipts);
router.get('/receipts/:id', receiptController.getReceiptById);
router.get('/receipts/number/:receiptNumber', receiptController.getReceiptByNumber);

// Expenses
router.get('/expenses', expenseController.getExpenseList);
router.post('/expenses', upload.single('bill_attachment'), expenseController.createExpense);
router.put('/expenses/:id/approve', requireRoles('admin', 'treasurer'), expenseController.approveExpense);
router.put('/expenses/:id/reject', requireRoles('admin', 'treasurer'), expenseController.rejectExpense);
router.delete('/expenses/:id', requireRoles('admin'), expenseController.deleteExpense);

// Cash Management
router.get('/cash/summary', cashController.getCashSummary);
router.post('/cash/reconcile', requireRoles('admin', 'treasurer'), cashController.reconcileCash);
router.get('/cash/history', cashController.getCashHistory);

// Committee Members
router.get('/members', memberController.getMembersList);
router.post('/members', requireRoles('admin', 'secretary'), upload.single('photo'), memberController.createMember);
router.put('/members/:id', requireRoles('admin', 'secretary'), upload.single('photo'), memberController.updateMember);
router.delete('/members/:id', requireRoles('admin'), memberController.deleteMember);

// Events
router.get('/events', eventController.getEventsList);
router.post('/events', requireRoles('admin', 'secretary'), eventController.createEvent);
router.put('/events/:id', requireRoles('admin', 'secretary'), eventController.updateEvent);
router.delete('/events/:id', requireRoles('admin'), eventController.deleteEvent);

// Reports
router.get('/reports/financial', reportController.getFinancialReport);
router.get('/reports/export/:type', reportController.exportCsvData);

// Audit Logs (Admin only)
router.get('/audit-logs', requireRoles('admin'), auditController.getAuditLogs);

// Settings (Admin only for updating)
router.get('/settings', settingsController.getSettings);
router.put('/settings', requireRoles('admin'), upload.single('logo'), settingsController.updateSettings);

// Notifications
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);

export default router;
