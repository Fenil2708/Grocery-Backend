import express from 'express';
import { getChatResponse } from '../controllers/chat.controller.js';

const chatRouter = express.Router();

chatRouter.post('/response', getChatResponse);

export default chatRouter;
