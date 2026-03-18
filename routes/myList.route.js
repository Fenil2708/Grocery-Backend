import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  addToList,
  getList,
  removeFromList
} from "../controllers/myList.controller.js";

const myListRouter = Router();

myListRouter.post("/add", auth, addToList);
myListRouter.get("/", auth, getList);
myListRouter.delete("/remove/:id", auth, removeFromList);

export default myListRouter;
