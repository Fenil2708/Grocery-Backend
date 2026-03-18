import {Router} from 'express';
import auth from '../middlewares/auth.js';
import adminOnly from '../middlewares/adminOnly.js';
import upload from '../middlewares/multer.js';
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory, uploadCategoryImage } from '../controllers/category.controller.js';
import { removeImageFromCloudinary } from '../controllers/homeSlider.controller.js';
import { optionalAuth } from '../middlewares/auth.js';

const categoryRouter = Router();

categoryRouter.post("/uploadCategoryImage", auth, adminOnly, upload.array('images'), uploadCategoryImage);
categoryRouter.delete("/deleteImage", auth, adminOnly, removeImageFromCloudinary);

categoryRouter.post("/create", auth, adminOnly, createCategory);
categoryRouter.get("/", optionalAuth, getCategories);
categoryRouter.get("/:id", getCategoryById);
categoryRouter.put("/:id", auth, adminOnly, updateCategory);
categoryRouter.delete("/:id", auth, adminOnly, deleteCategory);

export default categoryRouter;
