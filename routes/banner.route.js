import {Router} from 'express';
import auth from '../middlewares/auth.js';
import adminOnly from '../middlewares/adminOnly.js';
import upload from '../middlewares/multer.js';
import { createBanner, getBanners, getBannerById, updateBanner, deleteBanner, uploadBannerImages } from '../controllers/banner.controller.js';
import { removeImageFromCloudinary } from '../controllers/homeSlider.controller.js';

const bannerRouter = Router();

bannerRouter.post("/uploadBannerImages", auth, adminOnly, upload.array('images'), uploadBannerImages);
bannerRouter.delete("/deleteImage", auth, adminOnly, removeImageFromCloudinary);

bannerRouter.post("/create", auth, adminOnly, createBanner);
bannerRouter.get("/", getBanners);
bannerRouter.get("/:id", getBannerById);
bannerRouter.put("/:id", auth, adminOnly, updateBanner);
bannerRouter.delete("/:id", auth, adminOnly, deleteBanner);

export default bannerRouter;
