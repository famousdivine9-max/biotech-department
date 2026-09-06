import { Router } from 'express';
import {
  initiatePayment,
  verifyPayment,
  paystackWebhook,
  findReceipt,
  downloadReceipt
} from '../controllers/paymentController';

const router = Router();

router.post('/initiate', initiatePayment);
router.get('/verify', verifyPayment);
router.post('/webhook', paystackWebhook);
router.post('/receipt/find', findReceipt);
router.get('/receipt/download/:receipt_number', downloadReceipt);

export default router;
