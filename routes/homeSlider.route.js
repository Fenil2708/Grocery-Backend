import {Router} from 'express';
import auth from '../middlewares/auth.js';
import adminOnly from '../middlewares/adminOnly.js';
import upload from '../middlewares/multer.js';
import { uploadImages, removeImageFromCloudinary, createSlide, getSlides, getSlideById, updateSlide, deleteSlide } from '../controllers/homeSlider.controller.js';

const homeSliderRouter = Router();

homeSliderRouter.post("/uploadImages", auth, adminOnly, upload.array('images'), uploadImages);
homeSliderRouter.delete("/deleteImage", auth, adminOnly, removeImageFromCloudinary);

// CRUD routes
homeSliderRouter.post("/create", auth, adminOnly, createSlide);
homeSliderRouter.get("/", getSlides);
homeSliderRouter.get("/:id", getSlideById);
homeSliderRouter.put("/:id", auth, adminOnly, updateSlide);
homeSliderRouter.delete("/:id", auth, adminOnly, deleteSlide);

export default homeSliderRouter;