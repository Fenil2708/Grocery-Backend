import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress
} from "../controllers/address.controller.js";

const addressRouter = Router();

addressRouter.post("/add", auth, addAddress);
addressRouter.get("/", auth, getAddresses);
addressRouter.put("/update/:id", auth, updateAddress);
addressRouter.delete("/delete/:id", auth, deleteAddress);

export default addressRouter;
