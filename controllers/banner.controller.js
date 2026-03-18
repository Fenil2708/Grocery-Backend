import BannerModel from "../models/banner.model.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import cloudinary from "../utils/cloudinary.js";
import fs from 'fs';

export async function createBanner(request, response) {
    try {
        const { images, category, product } = request.body;

        if (!images || images.length === 0) {
            return response.status(400).json({
                message: "Images are required",
                error: true,
                success: false
            });
        }

        const newBanner = new BannerModel({
            images,
            category: category || null,
            product: product || null
        });

        const savedBanner = await newBanner.save();

        return response.status(201).json({
            message: "Banner created successfully",
            success: true,
            data: savedBanner
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error creating banner",
            error: true,
            success: false
        });
    }
}

export async function getBanners(request, response) {
    try {
        const banners = await BannerModel.find()
            .populate('category')
            .populate('product')
            .sort({ createdAt: -1 });

        return response.status(200).json({
            data: banners,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching banners",
            error: true,
            success: false
        });
    }
}

export async function getBannerById(request, response) {
    try {
        const { id } = request.params;
        const banner = await BannerModel.findById(id)
            .populate('category')
            .populate('product');

        if (!banner) {
            return response.status(404).json({
                message: "Banner not found",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            data: banner,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching banner",
            error: true,
            success: false
        });
    }
}

export async function updateBanner(request, response) {
    try {
        const { id } = request.params;
        const { images, category, product } = request.body;

        const updatedBanner = await BannerModel.findByIdAndUpdate(
            id,
            { images, category: category || null, product: product || null },
            { new: true }
        );

        if (!updatedBanner) {
            return response.status(404).json({
                message: "Banner not found",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            message: "Banner updated successfully",
            success: true,
            data: updatedBanner
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error updating banner",
            error: true,
            success: false
        });
    }
}

export async function deleteBanner(request, response) {
    try {
        const { id } = request.params;
        const banner = await BannerModel.findById(id);
        
        if (!banner) {
            return response.status(404).json({
                message: "Banner not found",
                error: true,
                success: false
            });
        }

        // Delete images from Cloudinary
        for (const imgUrl of banner.images) {
            await deleteFromCloudinary(imgUrl);
        }

        await BannerModel.findByIdAndDelete(id);

        return response.status(200).json({
            message: "Banner deleted successfully",
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error deleting banner",
            error: true,
            success: false
        });
    }
}

export async function uploadBannerImages(request, response){
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
            folder: 'banners'
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
