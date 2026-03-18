import mongoose from "mongoose";
import CartModel from "../models/cart.model.js";
import ProductModel from "../models/product.model.js";

export async function addToCart(request, response) {
    try {
        const userId = request.userId;
        const { productId, quantity = 1 } = request.body;

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

        let cart = await CartModel.findOne({ userId });

        const price = product.price;
        const subTotal = price * quantity;

        if (cart) {
            // Use findIndex with string comparison for reliability
            const itemIndex = cart.items.findIndex(p => p.productId?.toString() === productId.toString());

            if (itemIndex > -1) {
                const newQuantity = cart.items[itemIndex].quantity + quantity;
                if (newQuantity > product.countInStock) {
                    return response.status(400).json({
                        message: `Cannot add more items. Only ${product.countInStock} items available in stock.`,
                        error: true,
                        success: false
                    });
                }
                cart.items[itemIndex].quantity = newQuantity;
                cart.items[itemIndex].subTotal = cart.items[itemIndex].quantity * price;
            } else {
                if (quantity > product.countInStock) {
                    return response.status(400).json({
                        message: `Cannot add ${quantity} items. Only ${product.countInStock} items available in stock.`,
                        error: true,
                        success: false
                    });
                }
                cart.items.push({ productId, quantity, price, subTotal });
            }
        } else {
            if (quantity > product.countInStock) {
                return response.status(400).json({
                    message: `Cannot add ${quantity} items. Only ${product.countInStock} items available in stock.`,
                    error: true,
                    success: false
                });
            }
            cart = new CartModel({
                userId,
                items: [{ productId, quantity, price, subTotal }]
            });
        }

        await cart.save();
        
        const populatedCart = await CartModel.findById(cart._id).populate('items.productId');

        return response.status(200).json({
            message: "Item added to cart",
            success: true,
            data: populatedCart ? populatedCart.items : []
        });
    } catch (error) {
        console.error("Add to Cart Error:", error);
        return response.status(500).json({
            message: error.message || "Error adding to cart",
            error: true,
            success: false
        });
    }
}

export async function getCart(request, response) {
    try {
        const userId = request.userId;
        const cart = await CartModel.findOne({ userId }).populate('items.productId');

        return response.status(200).json({
            success: true,
            data: cart ? cart.items : []
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching cart",
            error: true,
            success: false
        });
    }
}

export async function updateCartItem(request, response) {
    try {
        const userId = request.userId;
        const { id } = request.params; // this is the productId
        const { quantity } = request.body;

        if (quantity < 1) {
             return response.status(400).json({
                message: "Quantity must be at least 1",
                error: true,
                success: false
            });
        }

        const cart = await CartModel.findOne({ userId });
        if (!cart) {
             return response.status(404).json({
                message: "Cart not found",
                error: true,
                success: false
            });
        }

        const itemIndex = cart.items.findIndex(p => p.productId?.toString() === id.toString());
        if (itemIndex > -1) {
            const product = await ProductModel.findById(id);
            if (!product) {
                return response.status(404).json({
                    message: "Product not found",
                    error: true,
                    success: false
                });
            }

            if (quantity > product.countInStock) {
                return response.status(400).json({
                    message: `Only ${product.countInStock} items available in stock.`,
                    error: true,
                    success: false
                });
            }

            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].subTotal = cart.items[itemIndex].price * quantity;
            await cart.save();

            const populatedCart = await CartModel.findById(cart._id).populate('items.productId');
            
            return response.status(200).json({
                message: "Cart updated",
                success: true,
                data: populatedCart ? populatedCart.items : []
            });
        } else {
             return response.status(404).json({
                message: "Item not in cart",
                error: true,
                success: false
            });
        }
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error updating cart",
            error: true,
            success: false
        });
    }
}

export async function removeCartItem(request, response) {
    try {
        const userId = request.userId;
        const { id } = request.params; 

        const cart = await CartModel.findOne({ userId });
        if (!cart) {
             return response.status(404).json({
                message: "Cart not found",
                error: true,
                success: false
            });
        }

        cart.items = cart.items.filter(p => p.productId?.toString() !== id.toString());
        await cart.save();

        const populatedCart = await CartModel.findById(cart._id).populate('items.productId');

        return response.status(200).json({
            message: "Item removed from cart",
            success: true,
            data: populatedCart ? populatedCart.items : []
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error removing item",
            error: true,
            success: false
        });
    }
}

export async function clearCart(request, response) {
    try {
        const userId = request.userId;
        await CartModel.findOneAndDelete({ userId });

        return response.status(200).json({
            message: "Cart cleared",
            success: true,
            data: []
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error clearing cart",
            error: true,
            success: false
        });
    }
}
