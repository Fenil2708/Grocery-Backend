import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export const deleteFromCloudinary = async (imgUrl) => {
    try {
        if (!imgUrl) return { success: false, message: "No image URL provided" };

        let publicId = "";
        if (imgUrl.includes("/upload/")) {
            const parts = imgUrl.split("/upload/")[1].split("/");
            if (parts[0].startsWith("v")) {
                parts.shift();
            }
            publicId = parts.join("/").split(".")[0];
        } else {
            const urlArr = imgUrl.split("/");
            const lastPart = urlArr[urlArr.length - 1];
            publicId = lastPart.split(".")[0];
        }

        if (publicId) {
            const res = await cloudinary.uploader.destroy(publicId);
            return {
                success: res.result === "ok" || res.result === "not found",
                result: res.result
            };
        }
        
        return { success: false, message: "Could not extract public ID" };
    } catch (error) {
        console.error("Cloudinary deletion error:", error);
        return { success: false, message: error.message };
    }
};

export default cloudinary;
