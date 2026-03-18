import AddressModel from "../models/address.model.js";
import UserModel from "../models/user.model.js";

export async function addAddress(request, response) {
    try {
        const userId = request.userId;
        const { address_line1, city, state, pincode, country, mobile, landmark, addressType } = request.body;

        const newAddress = new AddressModel({
            address_line1,
            city,
            state,
            pincode,
            country,
            mobile,
            landmark,
            addressType,
            userId
        });

        const savedAddress = await newAddress.save();

        await UserModel.findByIdAndUpdate(userId, {
            $push: { address_details: savedAddress._id }
        });

        return response.status(201).json({
            message: "Address added successfully",
            success: true,
            data: savedAddress
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error adding address",
            error: true,
            success: false
        });
    }
}

export async function getAddresses(request, response) {
    try {
        const userId = request.userId;
        const addresses = await AddressModel.find({ userId });

        return response.status(200).json({
            success: true,
            data: addresses
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching addresses",
            error: true,
            success: false
        });
    }
}

export async function updateAddress(request, response) {
    try {
        const { id } = request.params;
        const updateData = request.body;

        const updatedAddress = await AddressModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedAddress) {
            return response.status(404).json({
                message: "Address not found",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            message: "Address updated successfully",
            success: true,
            data: updatedAddress
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error updating address",
            error: true,
            success: false
        });
    }
}

export async function deleteAddress(request, response) {
    try {
        const userId = request.userId;
        const { id } = request.params;

        const deletedAddress = await AddressModel.findByIdAndDelete(id);

        if (!deletedAddress) {
            return response.status(404).json({
                message: "Address not found",
                error: true,
                success: false
            });
        }

        await UserModel.findByIdAndUpdate(userId, {
            $pull: { address_details: id }
        });

        return response.status(200).json({
            message: "Address deleted successfully",
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error deleting address",
            error: true,
            success: false
        });
    }
}
