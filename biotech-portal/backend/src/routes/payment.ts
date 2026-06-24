import { Router, Request, Response } from 'express';
import express from 'express';
import {
  initiatePayment,
  verifyPayment,
  paystackWebhook,
  findReceipt,
  downloadReceipt,
} from '../controllers/paymentController';

const router = Router();

router.post('/initiate', initiatePayment);
router.get('/verify', verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), paystackWebhook);
router.post('/receipt/find', findReceipt);
router.get('/receipt/download/:receipt_number', downloadReceipt);

export default router;
