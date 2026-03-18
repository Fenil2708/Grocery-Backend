import { Router } from 'express';
import auth from '../middlewares/auth.js';
import { createRazorpayOrder, verifyPayment } from '../controllers/payment.controller.js';

const paymentRouter = Router();

paymentRouter.post("/create-order", auth, createRazorpayOrder);
paymentRouter.post("/verify", auth, verifyPayment);

export default paymentRouter;
