import { Router } from 'express';
import {
  loginController,
  logoutController,
  meController,
  signupController,
  updateAccountController,
} from '../controllers/authController';
import { executeController } from '../controllers/executionController';
import { healthController } from '../controllers/healthController';
import { problemBankController } from '../controllers/problemController';
import { listSubmissionsController } from '../controllers/submissionController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/health', healthController);
router.get('/problems', problemBankController);
router.post('/auth/signup', signupController);
router.post('/auth/login', loginController);
router.post('/auth/logout', logoutController);
router.get('/auth/me', requireAuth, meController);
router.patch('/auth/account', requireAuth, updateAccountController);

router.get('/submissions', requireAuth, listSubmissionsController);
router.post('/execute', requireAuth, executeController);

export default router;
