import { Router } from 'express';
import auth from '../middlewares/auth.js';
import adminOnly from '../middlewares/adminOnly.js';
import {
    createOrder,
    getUserOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    getOrderStats,
    cancelOrder,
} from '../controllers/order.controller.js';

const orderRouter = Router();

// User routes
orderRouter.post("/create", auth, createOrder);
orderRouter.get("/my-orders", auth, getUserOrders);
orderRouter.put("/cancel/:id", auth, cancelOrder);

// Admin routes
orderRouter.get("/", auth, adminOnly, getAllOrders);           // GET /api/order?page=1&limit=10&search=&status=
orderRouter.get("/stats", auth, adminOnly, getOrderStats);    // GET /api/order/stats
orderRouter.get("/:id", auth, adminOnly, getOrderById);       // GET /api/order/:id
orderRouter.put("/:id/status", auth, adminOnly, updateOrderStatus); // PUT /api/order/:id/status
orderRouter.delete("/:id", auth, adminOnly, deleteOrder);     // DELETE /api/order/:id

export default orderRouter;
