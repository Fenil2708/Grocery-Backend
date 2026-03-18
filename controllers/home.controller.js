import HomeSliderModel from "../models/homeSlider.model.js";
import BannerModel from "../models/banner.model.js";
import CategoryModel from "../models/category.model.js";
import ProductModel from "../models/product.model.js";

export async function getHomeData(request, response) {
    try {
        // Fetch all data in parallel for efficiency
        const [slides, banners, categories, featuredProducts] = await Promise.all([
            HomeSliderModel.find()
                .populate('category')
                .populate('product')
                .sort({ dateCreated: -1 }),
            BannerModel.find()
                .populate('category')
                .populate('product')
                .sort({ createdAt: -1 }),
            CategoryModel.find().sort({ createdAt: -1 }),
            ProductModel.find({ isFeatured: true })
                .populate('category')
                .sort({ createdAt: -1 })
                .limit(10) // Limit initial featured products
        ]);

        return response.status(200).json({
            success: true,
            data: {
                slides,
                banners,
                categories,
                featuredProducts
            }
        });
    } catch (error) {
        console.error("Home data error:", error);
        return response.status(500).json({
            message: error.message || "Error fetching home page data",
            error: true,
            success: false
        });
    }
}
