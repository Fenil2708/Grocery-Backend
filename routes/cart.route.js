import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from "../controllers/cart.controller.js";

const cartRouter = Router();

cartRouter.post("/add", auth, addToCart);
cartRouter.get("/", auth, getCart);
cartRouter.put("/update/:id", auth, updateCartItem);
cartRouter.delete("/remove/:id", auth, removeCartItem);
cartRouter.delete("/clear", auth, clearCart);

export default cartRouter;
