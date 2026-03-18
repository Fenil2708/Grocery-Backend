import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("ADMIN_URL:", process.env.ADMIN_URL);
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDb from './config/connectDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import userRouter from './routes/user.route.js';
import homeSliderRouter from './routes/homeSlider.route.js';
import categoryRouter from './routes/category.route.js';
import productRouter from './routes/product.route.js';
import bannerRouter from './routes/banner.route.js';
import homeRouter from './routes/home.route.js';
import dashboardRouter from './routes/dashboard.route.js';
import orderRouter from './routes/order.route.js';
import cartRouter from './routes/cart.route.js';
import addressRouter from './routes/address.route.js';
import paymentRouter from './routes/payment.route.js';
import myListRouter from './routes/myList.route.js';
import reviewRouter from './routes/review.route.js';
import notificationRouter from './routes/notification.route.js';

import { createServer } from 'http';
import { initSocket } from './utils/socket.js';

const app = express();
const server = createServer(app);
const io = initSocket(server);

app.use(cors({
    origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL, "http://localhost:3000", "http://localhost:3001"].filter(Boolean),
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

app.use(helmet({
    crossOriginResourcePolicy:false
}))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Global error handler:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        error: true,
        success: false
    });
});

app.get("/", (request, response)=>{
    response.json({
        message:"Server is running " + process.env.PORT
    })
})

app.use('/api/user', userRouter);
app.use('/api/homeSlider', homeSliderRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use('/api/banner', bannerRouter);
app.use('/api/home', homeRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/order', orderRouter);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/my-list', myListRouter);
app.use('/api/review', reviewRouter);
app.use('/api/notification', notificationRouter);

connectDb().then(()=>{
    server.listen(process.env.PORT, ()=>{
        console.log("Server is running", process.env.PORT)
    })
})