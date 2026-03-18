import { Router } from "express";
import auth from "../middlewares/auth.js";
import { getNotifications, markAsRead, deleteAllNotifications } from "../controllers/notification.controller.js";

const notificationRouter = Router();

notificationRouter.get("/", auth, getNotifications);
notificationRouter.put("/mark-as-read/:id", auth, markAsRead);
notificationRouter.delete("/delete-all", auth, deleteAllNotifications);

export default notificationRouter;
