import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import CartModel from "../models/cart.model.js";
import ProductModel from "../models/product.model.js";
import { createNotification } from "./notification.controller.js";

// CREATE a new order (user)
export async function createOrder(request, response) {
    try {
        const userId = request.userId;
        const { delivery_address, totalAmt, products, paymentId = "", payment_status = "" } = request.body;

        if (!delivery_address || !products || products.length === 0) {
            return response.status(400).json({
                message: "Missing required fields (delivery address or products)",
                error: true,
                success: false
            });
        }

        // Fetch products to verify, check stock, and get their owners (userId)
        const enrichedProducts = await Promise.all(products.map(async (item) => {
            const productDoc = await ProductModel.findById(item.productId);
            if (!productDoc) {
                throw new Error(`Product not found: ${item.productId}`);
            }
            if (productDoc.countInStock < item.quantity) {
                throw new Error(`Insufficient stock for product: ${productDoc.name}. Available: ${productDoc.countInStock}`);
            }
            return {
                ...item,
                userId: productDoc?.userId?.toString() // The owner of the product
            };
        }));

        const newOrder = new OrderModel({
            userId,
            products: enrichedProducts,
            paymentId,
            payment_status,
            order_status: "confirm", // default
            delivery_address,
            totalAmt
        });

        const savedOrder = await newOrder.save();

        // Update Stock and check for Low Stock
        for (const item of enrichedProducts) {
            const product = await ProductModel.findById(item.productId);
            if (product) {
                const newStock = product.countInStock - item.quantity;
                product.countInStock = newStock < 0 ? 0 : newStock;
                await product.save();

                // Check for low stock notification (<= 3)
                if (product.countInStock <= 3) {
                    await createNotification(
                        product.userId, 
                        `Low Stock Alert: ${product.name} has only ${product.countInStock} items remaining.`, 
                        'LOW_STOCK', 
                        true
                    );
                }
            }
        }

        // Add to user's orderHistory
        await UserModel.findByIdAndUpdate(userId, {
            $push: { orderHistory: savedOrder._id }
        });

        // Clear user's cart
        await CartModel.findOneAndDelete({ userId });

        // Notify admins (owners of the products)
        const uniqueAdmins = [...new Set(enrichedProducts.map(p => p.userId))];
        for (const adminId of uniqueAdmins) {
            if (adminId) {
                await createNotification(adminId, `New order received: #${savedOrder._id}`, 'NEW_ORDER', true);
            }
        }

        return response.status(201).json({
            message: "Order placed successfully",
            success: true,
            data: savedOrder
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error creating order",
            error: true,
            success: false
        });
    }
}

// GET user's orders
export async function getUserOrders(request, response) {
    try {
        const userId = request.userId;
        const orders = await OrderModel.find({ userId })
            .populate("delivery_address")
            .sort({ createdAt: -1 });

        return response.status(200).json({
            success: true,
            data: orders
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching your orders",
            error: true,
            success: false,
        });
    }
}

// User explicitly cancels their order
export async function cancelOrder(request, response) {
    try {
        const userId = request.userId;
        const { id } = request.params; // order id

        const order = await OrderModel.findById(id).populate("products.productId");

        if (!order) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            });
        }

        if (order.userId.toString() !== userId.toString()) {
            return response.status(403).json({
                message: "You can only cancel your own orders",
                error: true,
                success: false
            });
        }

        // Only allow cancel if not already delivered/cancelled
        if (["delivered", "cancelled"].includes(order.order_status.toLowerCase())) {
            return response.status(400).json({
                message: `Order cannot be cancelled because it is already ${order.order_status}`,
                error: true,
                success: false
            });
        }

        // Restock products since order is cancelled
        const productsToRestock = order.products || [];
        for (const item of productsToRestock) {
            const product = await ProductModel.findById(item.productId);
            if (product) {
                product.countInStock += item.quantity;
                await product.save();
            }
        }

        // Update order status
        order.order_status = "cancelled";
        const savedOrder = await order.save();

        // Notify admins (owners of the products)
        const uniqueAdmins = [...new Set(order.products.map(p => p.userId?.toString()))];
        for (const adminId of uniqueAdmins) {
            if (adminId) {
                await createNotification(adminId, `Customer cancelled order: #${order._id}`, 'ORDER_CANCELLED', true);
            }
        }

        return response.status(200).json({
            message: "Order successfully cancelled and stock has been updated",
            success: true,
            data: savedOrder
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error cancelling order",
            error: true,
            success: false
        });
    }
}

// GET all orders with pagination, search and filters (admin)
export async function getAllOrders(request, response) {
    try {
        const userId = request.userId;
        const { page = 1, limit = 10, search = "", status = "" } = request.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        let query = { "products.userId": userId };
        
        if (status) {
            query.order_status = status;
        }

        if (search) {
            // 1. Try to find users matching the search
            const users = await UserModel.find({
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);

            // 2. Add search conditions to the query
            // We search by order ID, payment ID, or matching user IDs
            query.$or = [
                { userId: { $in: userIds } },
                { paymentId: { $regex: search, $options: "i" } }
            ];

            // If search is a valid MongoDB ObjectId, search by _id too
            if (search.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or.push({ _id: search });
            }
        }

        const totalOrders = await OrderModel.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / parseInt(limit));

        // Get all orders with populated fields
        const orders = await OrderModel.find(query)
            .populate("userId", "name email avatar mobile")
            .populate("delivery_address")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Filter products within each order to only show those belonging to the logged-in admin
        let cleanedOrders = orders.map(order => {
            const orderObj = order.toObject();
            orderObj.products = orderObj.products.filter(p => p.userId?.toString() === userId.toString());
            // Add a shared/total amount for this specific admin
            orderObj.adminTotalAmt = orderObj.products.reduce((acc, curr) => acc + (curr.subTotal || 0), 0);
            return orderObj;
        });

        return response.status(200).json({
            success: true,
            data: cleanedOrders,
            totalOrders,
            totalPages,
            currentPage: parseInt(page),
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching orders",
            error: true,
            success: false,
        });
    }
}

// GET a single order by ID
export async function getOrderById(request, response) {
    try {
        const { id } = request.params;
        const order = await OrderModel.findById(id)
            .populate("userId", "name email avatar mobile")
            .populate("delivery_address");

        if (!order) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false,
            });
        }

        return response.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching order",
            error: true,
            success: false,
        });
    }
}

// PUT update order status (admin)
export async function updateOrderStatus(request, response) {
    try {
        const { id } = request.params;
        const { order_status } = request.body;

        if (!order_status) {
            return response.status(400).json({
                message: "order_status is required",
                error: true,
                success: false,
            });
        }

        const allowedStatuses = ["confirm", "ordered", "delivered", "cancelled", "pending"];
        if (!allowedStatuses.includes(order_status.toLowerCase())) {
            return response.status(400).json({
                message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
                error: true,
                success: false,
            });
        }

        const updatedOrder = await OrderModel.findByIdAndUpdate(
            id,
            { order_status: order_status.toLowerCase() },
            { new: true }
        )
            .populate("userId", "name email avatar mobile")
            .populate("delivery_address");

        if (!updatedOrder) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false,
            });
        }

        // Notify user
        await createNotification(updatedOrder.userId._id, `Your order status has been updated to: ${order_status}`, 'ORDER_STATUS', false);

        return response.status(200).json({
            message: "Order status updated successfully",
            success: true,
            data: updatedOrder,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error updating order",
            error: true,
            success: false,
        });
    }
}

// DELETE an order (admin)
export async function deleteOrder(request, response) {
    try {
        const { id } = request.params;
        const order = await OrderModel.findByIdAndDelete(id);

        if (!order) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false,
            });
        }

        return response.status(200).json({
            message: "Order deleted successfully",
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error deleting order",
            error: true,
            success: false,
        });
    }
}

// GET order stats summary (admin dashboard helper)
export async function getOrderStats(request, response) {
    try {
        const total = await OrderModel.countDocuments();
        const pending = await OrderModel.countDocuments({ order_status: "pending" });
        const confirmed = await OrderModel.countDocuments({ order_status: "confirm" });
        const ordered = await OrderModel.countDocuments({ order_status: "ordered" });
        const delivered = await OrderModel.countDocuments({ order_status: "delivered" });
        const cancelled = await OrderModel.countDocuments({ order_status: "cancelled" });

        // Total revenue from delivered orders
        const revenueResult = await OrderModel.aggregate([
            { $match: { order_status: "delivered" } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmt" } } },
        ]);
        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        return response.status(200).json({
            success: true,
            data: {
                total,
                pending,
                confirmed,
                ordered,
                delivered,
                cancelled,
                totalRevenue,
            },
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching order stats",
            error: true,
            success: false,
        });
    }
}
