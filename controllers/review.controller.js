import ReviewModel from "../models/review.model.js";
import ProductModel from "../models/product.model.js";
import mongoose from "mongoose";

// Get all reviews for a product
export async function getProductReviews(request, response) {
    try {
        const { productId } = request.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return response.status(400).json({
                message: "Invalid Product ID",
                error: true,
                success: false
            });
        }

        const reviews = await ReviewModel.find({ productId })
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 });

        // Calculate average rating
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

        return response.status(200).json({
            success: true,
            data: reviews,
            totalReviews: reviews.length,
            avgRating: parseFloat(avgRating)
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching reviews",
            error: true,
            success: false
        });
    }
}

// Add a review for a product
export async function addReview(request, response) {
    try {
        const userId = request.userId;
        const { productId, review, rating } = request.body;

        if (!productId || !review || !rating) {
            return response.status(400).json({
                message: "Product ID, review, and rating are required",
                error: true,
                success: false
            });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return response.status(400).json({
                message: "Invalid Product ID",
                error: true,
                success: false
            });
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
            return response.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        // Check if user already reviewed this product
        const existingReview = await ReviewModel.findOne({ productId, userId });
        if (existingReview) {
            return response.status(400).json({
                message: "You have already reviewed this product",
                error: true,
                success: false
            });
        }

        const newReview = new ReviewModel({
            productId,
            userId,
            review,
            rating: Number(rating)
        });

        await newReview.save();

        // Update product's average rating
        const allReviews = await ReviewModel.find({ productId });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await ProductModel.findByIdAndUpdate(productId, { rating: parseFloat(avgRating.toFixed(1)) });

        const populatedReview = await ReviewModel.findById(newReview._id).populate('userId', 'name avatar');

        return response.status(201).json({
            message: "Review added successfully",
            success: true,
            data: populatedReview
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error adding review",
            error: true,
            success: false
        });
    }
}

// Delete a review (only the reviewer can delete)
export async function deleteReview(request, response) {
    try {
        const userId = request.userId;
        const { id } = request.params;

        const review = await ReviewModel.findById(id);
        if (!review) {
            return response.status(404).json({
                message: "Review not found",
                error: true,
                success: false
            });
        }

        if (review.userId.toString() !== userId) {
            return response.status(403).json({
                message: "Unauthorized to delete this review",
                error: true,
                success: false
            });
        }

        const productId = review.productId;
        await ReviewModel.findByIdAndDelete(id);

        // Recalculate product rating
        const allReviews = await ReviewModel.find({ productId });
        const avgRating = allReviews.length > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            : 0;
        await ProductModel.findByIdAndUpdate(productId, { rating: parseFloat(avgRating.toFixed(1)) });

        return response.status(200).json({
            message: "Review deleted successfully",
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error deleting review",
            error: true,
            success: false
        });
    }
}
