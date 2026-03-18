import mongoose from "mongoose";
import MyListModel from "../models/myList.model.js";
import ProductModel from "../models/product.model.js";
import { createNotification } from "./notification.controller.js";

export async function addToList(request, response) {
    try {
        const userId = request.userId;
        const { productId } = request.body;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return response.status(400).json({
                message: "Valid Product ID is required",
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

        let myList = await MyListModel.findOne({ userId });

        if (myList) {
            const itemIndex = myList.items.findIndex(p => p.productId?.toString() === productId.toString());
            if (itemIndex > -1) {
                return response.status(400).json({
                    message: "Product already in My List",
                    error: true,
                    success: false
                });
            } else {
                myList.items.push({ productId });
            }
        } else {
            myList = new MyListModel({
                userId,
                items: [{ productId }]
            });
        }

        await myList.save();

        // Notify user
        await createNotification(userId, `Product "${product.name}" added to your My List`, 'MY_LIST', false);

        const populatedList = await MyListModel.findById(myList._id).populate('items.productId');

        return response.status(200).json({
            message: "Added to My List",
            success: true,
            data: populatedList ? populatedList.items : []
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error adding to My List",
            error: true,
            success: false
        });
    }
}

export async function getList(request, response) {
    try {
        const userId = request.userId;
        const myList = await MyListModel.findOne({ userId }).populate('items.productId');

        return response.status(200).json({
            success: true,
            data: myList ? myList.items : []
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching My List",
            error: true,
            success: false
        });
    }
}

export async function removeFromList(request, response) {
    try {
        const userId = request.userId;
        const { id } = request.params; // this is the productId

        const myList = await MyListModel.findOne({ userId });
        if (!myList) {
             return response.status(404).json({
                message: "My List not found",
                error: true,
                success: false
            });
        }

        myList.items = myList.items.filter(p => p.productId?.toString() !== id.toString());
        await myList.save();

        const populatedList = await MyListModel.findById(myList._id).populate('items.productId');

        return response.status(200).json({
            message: "Removed from My List",
            success: true,
            data: populatedList ? populatedList.items : []
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error removing item",
            error: true,
            success: false
        });
    }
}
