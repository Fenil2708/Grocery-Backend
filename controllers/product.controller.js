import ProductModel from "../models/product.model.js";
import UserModel from "../models/user.model.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import cloudinary from "../utils/cloudinary.js";
import fs from 'fs';
import { createNotification } from "./notification.controller.js";

export async function createProduct(request, response) {
    try {
        const { name, description, images, brand, price, oldPrice, category, countInStock, rating, isFeatured, discount, sku_id } = request.body;

        if (!name || !description || !images || images.length === 0 || !category || countInStock === undefined) {
            return response.status(400).json({
                message: "Missing required fields",
                error: true,
                success: false
            });
        }

        const userId = request.userId;

        let finalSkuId = sku_id;
        if (!finalSkuId || finalSkuId.trim() === "") {
            finalSkuId = "SKU-" + Date.now() + Math.floor(Math.random() * 1000);
        }

        const newProduct = new ProductModel({
            name, description, images, brand, price, oldPrice, category, countInStock, rating, isFeatured, discount, userId, sku_id: finalSkuId
        });

        const savedProduct = await newProduct.save();

        // Notify admin
        await createNotification(userId, `New product added: ${name}`, 'PRODUCT_ADD', true);

        return response.status(201).json({
            message: "Product created successfully",
            success: true,
            data: savedProduct
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error creating product",
            error: true,
            success: false
        });
    }
}

export async function getProducts(request, response) {
    try {
        const { category, search, isFeatured, categoryName } = request.query;
        const userId = request.userId;
        let query = {};

        if (userId && request.query.adminView === 'true') {
            const user = await UserModel.findById(userId);
            if (user && user.role === 'ADMIN') {
                query.userId = userId;
            }
        }

        if (category) {
            query.category = category;
        }

        if (isFeatured !== undefined) {
            query.isFeatured = isFeatured === 'true';
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        let products;
        if (categoryName) {
            // If categoryName is provided, we need to find the category ID first
            products = await ProductModel.find(query).populate({
                path: 'category',
                match: { name: { $regex: categoryName, $options: 'i' } }
            }).sort({ createdAt: -1 });
            
            // Filter out products where category didn't match (because populate match returns null for unmatched)
            products = products.filter(product => product.category !== null);
        } else {
            products = await ProductModel.find(query).populate('category').sort({ createdAt: -1 });
        }

        return response.status(200).json({
            data: products,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching products",
            error: true,
            success: false
        });
    }
}

export async function getLowStockProducts(request, response) {
    try {
        const userId = request.userId;
        let query = { countInStock: { $lt: 3 } };

        if (userId) {
            const user = await UserModel.findById(userId);
            if (user && user.role === 'ADMIN') {
                query.userId = userId;
            }
        }

        const products = await ProductModel.find(query).populate('category');

        return response.status(200).json({
            data: products,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching low stock products",
            error: true,
            success: false
        });
    }
}

export async function getProductById(request, response) {
    try {
        const { id } = request.params;
        const product = await ProductModel.findById(id).populate('category');

        if (!product) {
            return response.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            data: product,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching product",
            error: true,
            success: false
        });
    }
}

export async function updateProduct(request, response) {
    try {
        const { id } = request.params;
        const userId = request.userId;
        const updateData = request.body;

        if (updateData.sku_id !== undefined && updateData.sku_id.trim() === "") {
            updateData.sku_id = "SKU-" + Date.now() + Math.floor(Math.random() * 1000);
        }

        const product = await ProductModel.findById(id);
        if (!product) {
            return response.status(404).json({ message: "Product not found", error: true, success: false });
        }

        if (product.userId?.toString() !== userId) {
            return response.status(403).json({ message: "Unauthorized to update this product", error: true, success: false });
        }

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        return response.status(200).json({
            message: "Product updated successfully",
            success: true,
            data: updatedProduct
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error updating product",
            error: true,
            success: false
        });
    }
}

export async function deleteProduct(request, response) {
    try {
        const { id } = request.params;
        const userId = request.userId;
        const product = await ProductModel.findById(id);
        
        if (!product) {
            return response.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        if (product.userId?.toString() !== userId) {
            return response.status(403).json({ message: "Unauthorized to delete this product", error: true, success: false });
        }

        // Delete images from Cloudinary
        for (const imgUrl of product.images) {
            await deleteFromCloudinary(imgUrl);
        }

        await ProductModel.findByIdAndDelete(id);

        return response.status(200).json({
            message: "Product deleted successfully",
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error deleting product",
            error: true,
            success: false
        });
    }
}

export async function uploadProductImages(request, response){
    try {
        const images = request.files;
        if (!images || images.length === 0) {
            return response.status(400).json({
                message: "No files uploaded",
                error: true,
                success: false
            });
        }
        
        console.log(`Uploading ${images.length} images to Cloudinary...`);
        const imagesArr = [];
        const options = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
            folder: 'products'
        }

        for(let i = 0; i < images.length; i++){
            try {
                console.log(`Uploading file ${i+1}: ${images[i].path}`);
                const result = await cloudinary.uploader.upload(images[i].path, options);
                imagesArr.push(result.secure_url);
                
                // Delete local file after upload
                if (fs.existsSync(images[i].path)) {
                    fs.unlinkSync(images[i].path);
                }
            } catch (uploadErr) {
                console.error(`Error uploading file ${i+1} to Cloudinary:`, uploadErr);
                // Continue with other images or throw? 
                // Better throw to let user know it failed
                throw new Error(`Failed to upload image ${i+1}: ${uploadErr.message}`);
            }
        }

        return response.status(200).json({
            images: imagesArr,
            success: true,
            message: `${imagesArr.length} images uploaded successfully`
        });

    } catch (error) {
        console.error("Overall upload error:", error);
        return response.status(500).json({
            message: error.message || "Error uploading images",
            error: true,
            success: false
        });
    }
}
