import express from 'express';
import { changePasswordAfterFirstLogin, forcePasswordChange } from '../controllers/password-change.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = express.Router();

// Password change routes
router.post('/change', authenticateJWT, changePasswordAfterFirstLogin);
router.patch('/force/:id', authenticateJWT, forcePasswordChange); // For admins to force password change

export default router;