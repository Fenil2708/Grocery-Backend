import {Router} from 'express';
import auth from '../middlewares/auth.js';
import adminOnly from '../middlewares/adminOnly.js';
import upload from '../middlewares/multer.js';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct, uploadProductImages, getLowStockProducts } from '../controllers/product.controller.js';
import { removeImageFromCloudinary } from '../controllers/homeSlider.controller.js';
import { optionalAuth } from '../middlewares/auth.js';

const productRouter = Router();

productRouter.post("/uploadProductImages", auth, adminOnly, upload.array('images'), uploadProductImages);
productRouter.delete("/deleteImage", auth, adminOnly, removeImageFromCloudinary);

productRouter.post("/create", auth, adminOnly, createProduct);
productRouter.get("/", optionalAuth, getProducts);
productRouter.get("/low-stock", auth, adminOnly, getLowStockProducts);
productRouter.get("/:id", getProductById);
productRouter.put("/:id", auth, adminOnly, updateProduct);
productRouter.delete("/:id", auth, adminOnly, deleteProduct);

export default productRouter;
