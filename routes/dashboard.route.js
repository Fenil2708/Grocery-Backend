import express from 'express';
import { getDashboardStats, getChartData } from '../controllers/dashboard.controller.js';
import auth from '../middlewares/auth.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/stats', auth, getDashboardStats);
dashboardRouter.get('/chart-data', auth, getChartData);

export default dashboardRouter;
