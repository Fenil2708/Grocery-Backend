import NotificationModel from "../models/notification.model.js";
import { getIO } from "../utils/socket.js";

export const createNotification = async (userId, message, type, isAdmin = false) => {
    try {
        const notification = new NotificationModel({
            userId,
            message,
            type,
            isAdmin
        });
        await notification.save();

        const io = getIO();
        
        if (isAdmin) {
            // Emit to admin room
            io.to("admin-room").emit("new-notification", notification);
            // Also emit to specific admin ID
            if (userId) {
                io.to(userId.toString()).emit("new-notification", notification);
            }
        } else {
            // Emit to the specific user room
            if (userId) {
                io.to(userId.toString()).emit("new-notification", notification);
            }
        }

        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

export const getNotifications = async (request, response) => {
    try {
        const userId = request.userId;
        const { isAdmin } = request.query;

        let query = { userId };
        
        // If isAdmin is true, we want either specific admin notifications for this user
        // OR general admin notifications (if we had any without specific userId, but model requires userId)
        if (isAdmin === 'true') {
            query.isAdmin = true;
        } else {
            query.isAdmin = false;
        }

        const notifications = await NotificationModel.find(query).sort({ createdAt: -1 }).limit(50);

        return response.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching notifications",
            error: true,
            success: false
        });
    }
};

export const markAsRead = async (request, response) => {
    try {
        const { id } = request.params;
        await NotificationModel.findByIdAndUpdate(id, { isRead: true });
        
        return response.status(200).json({
            message: "Notification marked as read",
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error updating notification",
            error: true,
            success: false
        });
    }
};

export const deleteAllNotifications = async (request, response) => {
    try {
        const userId = request.userId;
        const { isAdmin } = request.query;

        let query = { userId };
        if (isAdmin === 'true') {
            query.isAdmin = true;
        } else {
            query.isAdmin = false;
        }

        await NotificationModel.deleteMany(query);

        return response.status(200).json({
            message: "All notifications deleted",
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error deleting notifications",
            error: true,
            success: false
        });
    }
};
