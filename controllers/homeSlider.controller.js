import HomeSliderModel from "../models/homeSlider.model.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import cloudinary from "../utils/cloudinary.js";
import fs from 'fs';
import path from 'path';

// CRUD operations for Home Slider

export async function createSlide(request, response) {
    try {
        const { images, category, product } = request.body;

        if (!images || images.length === 0) {
            return response.status(400).json({
                message: "Images are required",
                error: true,
                success: false
            });
        }

        const newSlide = new HomeSliderModel({
            images: images,
            category: category || null,
            product: product || null
        });

        const savedSlide = await newSlide.save();

        return response.status(201).json({
            message: "Slide created successfully",
            success: true,
            data: savedSlide
        });
    } catch (error) {
        console.error("Create slide error:", error);
        return response.status(500).json({
            message: error.message || "Error creating slide",
            error: true,
            success: false
        });
    }
}

export async function getSlides(request, response) {
    try {
        const slides = await HomeSliderModel.find()
            .populate('category')
            .populate('product')
            .sort({ dateCreated: -1 });

        return response.status(200).json({
            data: slides,
            success: true
        });
    } catch (error) {
        console.error("Get slides error:", error);
        return response.status(500).json({
            message: error.message || "Error fetching slides",
            error: true,
            success: false
        });
    }
}

export async function getSlideById(request, response) {
    try {
        const { id } = request.params;
        const slide = await HomeSliderModel.findById(id)
            .populate('category')
            .populate('product');

        if (!slide) {
            return response.status(404).json({
                message: "Slide not found",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            data: slide,
            success: true
        });
    } catch (error) {
        console.error("Get slide by ID error:", error);
        return response.status(500).json({
            message: error.message || "Error fetching slide",
            error: true,
            success: false
        });
    }
}

export async function updateSlide(request, response) {
    try {
        const { id } = request.params;
        const { images, category, product } = request.body;

        if (!images || images.length === 0) {
            return response.status(400).json({
                message: "Images are required",
                error: true,
                success: false
            });
        }

        const updatedSlide = await HomeSliderModel.findByIdAndUpdate(
            id,
            { images, category: category || null, product: product || null },
            { new: true }
        );

        if (!updatedSlide) {
            return response.status(404).json({
                message: "Slide not found",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            message: "Slide updated successfully",
            success: true,
            data: updatedSlide
        });
    } catch (error) {
        console.error("Update slide error:", error);
        return response.status(500).json({
            message: error.message || "Error updating slide",
            error: true,
            success: false
        });
    }
}

export async function deleteSlide(request, response) {
    try {
        const { id } = request.params;
        
        // Find the slide first to get image URLs for Cloudinary deletion
        const slide = await HomeSliderModel.findById(id);
        
        if (!slide) {
            return response.status(404).json({
                message: "Slide not found",
                error: true,
                success: false
            });
        }

        // Delete images from Cloudinary when slide is deleted
        for (const imgUrl of slide.images) {
            await deleteFromCloudinary(imgUrl);
        }

        await HomeSliderModel.findByIdAndDelete(id);

        return response.status(200).json({
            message: "Slide deleted successfully",
            success: true
        });
    } catch (error) {
        console.error("Delete slide error:", error);
        return response.status(500).json({
            message: error.message || "Error deleting slide",
            error: true,
            success: false
        });
    }
}

// image upload
var imagesArr = [];

export async function uploadImages(request, response){
    try {
        const images = request.files;
        if (!images || images.length === 0) {
            return response.status(400).json({
                message: "No files uploaded",
                error: true,
                success: false
            });
        }
        
        imagesArr = [];
        const options = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
            folder: 'home-slider'
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

export async function removeImageFromCloudinary(request, response) {
    try {
        const imgUrl = request.query.img;

        if (!imgUrl) {
            return response.status(400).json({
                message: "Image URL is required",
                error: true,
                success: false
            });
        }

        const result = await deleteFromCloudinary(imgUrl);
        
        if (result.success) {
            return response.status(200).json({
                message: result.result === "ok" ? "Image deleted successfully" : "Image not found on Cloudinary",
                success: true
            });
        } else {
            return response.status(400).json({
                message: result.message || "Failed to delete image from Cloudinary",
                error: true,
                success: false
            });
        }
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

