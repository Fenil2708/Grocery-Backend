import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import UserModel from "../models/user.model.js";
import OrderModel from "../models/order.model.js";

export async function getDashboardStats(request, response) {
    try {
        const userId = request.userId;

        const [
            productCount,
            categoryCount,
            userCount,
            orderCount,
            lowStockCount,
            totalEarningsResult
        ] = await Promise.all([
            ProductModel.countDocuments({ userId }),
            CategoryModel.countDocuments({ userId }),
            UserModel.countDocuments(), 
            OrderModel.countDocuments({ "products.userId": userId }), 
            ProductModel.countDocuments({ userId, countInStock: { $lt: 4 } }), // 3 or below is low stock
            OrderModel.aggregate([
                { $match: { order_status: { $ne: "cancelled" } } },
                { $unwind: "$products" },
                { $match: { "products.userId": userId } },
                {
                    $group: {
                        _id: null,
                        totalEarnings: { $sum: "$products.subTotal" }
                    }
                }
            ])
        ]);

        const totalEarnings = totalEarningsResult.length > 0 ? totalEarningsResult[0].totalEarnings : 0;

        return response.status(200).json({
            success: true,
            data: {
                totalProducts: productCount,
                totalCategories: categoryCount,
                totalUsers: userCount,
                totalOrders: orderCount,
                totalEarnings: totalEarnings,
                lowStockCount: lowStockCount
            }
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return response.status(500).json({
            message: error.message || "Error fetching dashboard statistics",
            error: true,
            success: false
        });
    }
}

export async function getChartData(request, response) {
    try {
        const userId = request.userId;
        const monthNames = ["JAN", "FEB", "MARCH", "APRIL", "MAY", "JUN", "JULY", "AUG", "SEP", "OCT", "NOV", "DEC"];
        
        // aggregate sales by month for specific admin products
        const salesByMonth = await OrderModel.aggregate([
            { $match: { order_status: { $ne: "cancelled" } } },
            { $unwind: "$products" },
            { $match: { "products.userId": userId } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    sales: { $sum: "$products.subTotal" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // aggregate users who bought this admin's products? 
        // This is complex. Let's just keep global user growth for now or filter unique users.
        const usersByMonth = await UserModel.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    users: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Map to full year format
        const salesData = monthNames.map((name, index) => {
            const match = salesByMonth.find(item => item._id === index + 1);
            return { name, sales: match ? match.sales : 0 };
        });

        const usersData = monthNames.map((name, index) => {
            const match = usersByMonth.find(item => item._id === index + 1);
            return { name, users: match ? match.users : 0 };
        });

        return response.status(200).json({
            success: true,
            salesData,
            usersData
        });

    } catch (error) {
        console.error("Chart data error:", error);
        return response.status(500).json({
            message: error.message || "Error fetching chart data",
            error: true,
            success: false
        });
    }
}
