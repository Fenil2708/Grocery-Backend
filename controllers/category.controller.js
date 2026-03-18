import CategoryModel from "../models/category.model.js";
import UserModel from "../models/user.model.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import cloudinary from "../utils/cloudinary.js";
import fs from 'fs';
import { createNotification } from "./notification.controller.js";

export async function createCategory(request, response) {
    try {
        const { name, images, color } = request.body;

        if (!name || !images || images.length === 0 || !color) {
            return response.status(400).json({
                message: "Name, images and color are required",
                error: true,
                success: false
            });
        }

        const userId = request.userId;

        const newCategory = new CategoryModel({
            name,
            images,
            color,
            userId
        });

        const savedCategory = await newCategory.save();

        // Notify admin
        await createNotification(userId, `New category added: ${name}`, 'CATEGORY_ADD', true);

        return response.status(201).json({
            message: "Category created successfully",
            success: true,
            data: savedCategory
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error creating category",
            error: true,
            success: false
        });
    }
}

export async function getCategories(request, response) {
    try {
        const userId = request.userId;
        const { search } = request.query;
        let query = {};

        // adminView=true => show only this admin's own categories (for category management list)
        // adminView=false or not set => show ALL categories (for product form dropdowns & public frontend)
        if (request.query.adminView === 'true' && userId) {
            const user = await UserModel.findById(userId);
            if (user && user.role === 'ADMIN') {
                query.userId = userId;
            }
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const categories = await CategoryModel.find(query).sort({ createdAt: -1 });

        return response.status(200).json({
            data: categories,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching categories",
            error: true,
            success: false
        });
    }
}


export async function getCategoryById(request, response) {
    try {
        const { id } = request.params;
        const category = await CategoryModel.findById(id);

        if (!category) {
            return response.status(404).json({
                message: "Category not found",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            data: category,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching category",
            error: true,
            success: false
        });
    }
}

export async function updateCategory(request, response) {
    try {
        const { id } = request.params;
        const userId = request.userId;
        const { name, images, color } = request.body;

        const category = await CategoryModel.findById(id);
        if (!category) {
            return response.status(404).json({ message: "Category not found", error: true, success: false });
        }

        if (category.userId?.toString() !== userId) {
            return response.status(403).json({ message: "Unauthorized to update this category", error: true, success: false });
        }

        const updatedCategory = await CategoryModel.findByIdAndUpdate(
            id,
            { name, images, color },
            { new: true }
        );

        return response.status(200).json({
            message: "Category updated successfully",
            success: true,
            data: updatedCategory
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error updating category",
            error: true,
            success: false
        });
    }
}

export async function deleteCategory(request, response) {
    try {
        const { id } = request.params;
        const userId = request.userId;
        const category = await CategoryModel.findById(id);
        
        if (!category) {
            return response.status(404).json({
                message: "Category not found",
                error: true,
                success: false
            });
        }

        if (category.userId?.toString() !== userId) {
            return response.status(403).json({ message: "Unauthorized to delete this category", error: true, success: false });
        }

        // Delete images from Cloudinary
        for (const imgUrl of category.images) {
            await deleteFromCloudinary(imgUrl);
        }

        await CategoryModel.findByIdAndDelete(id);

        return response.status(200).json({
            message: "Category deleted successfully",
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error deleting category",
            error: true,
            success: false
        });
    }
}

export async function uploadCategoryImage(request, response){
    try {
        const images = request.files;
        if (!images || images.length === 0) {
            return response.status(400).json({
                message: "No files uploaded",
                error: true,
                success: false
            });
        }
        
        const imagesArr = [];
        const options = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
            folder: 'categories'
        }

        for(let i = 0; i < images.length; i++){
            const result = await cloudinary.uploader.upload(images[i].path, options);
            imagesArr.push(result.secure_url);
            try {
                fs.unlinkSync(images[i].path);
            } catch (unlinkError) {
                console.error(`Error deleting file:`, unlinkError.message);
            }
        }

        return response.status(200).json({
            images: imagesArr,
            success: true,
            message: `${imagesArr.length} images uploaded successfully`
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error uploading images",
            error: true,
            success: false
        });
    }
}
