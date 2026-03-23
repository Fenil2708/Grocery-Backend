import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import { GoogleGenerativeAI } from "@google/genai";

export const getChatResponse = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
        error: true,
        success: false,
      });
    }

    let aiResponse = "";

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI({
          apiKey: process.env.GEMINI_API_KEY,
        });

        // ✅ DB data
        const products = await ProductModel.find({}).limit(5);
        const categories = await CategoryModel.find({}).limit(5);

        const productNames = products.map(p => p.name).join(", ");
        const catNames = categories.map(c => c.name).join(", ");

        const prompt = `
You are a grocery assistant for Grocery Express.
Reply short and helpful.

Products: ${productNames}
Categories: ${catNames}

User: ${message}
        `;

        // ✅ NEW API CALL (IMPORTANT 🔥)
        const result = await genAI.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
        });

        aiResponse = result.text;

      } catch (err) {
        console.log("Gemini Error:", err);
        aiResponse = getMockResponse(message.toLowerCase());
      }
    } else {
      aiResponse = getMockResponse(message.toLowerCase());
    }

    return res.json({
      message: aiResponse,
      success: true,
      error: false,
    });

  } catch (error) {
    console.log("Chat Error:", error);
    return res.status(500).json({
      message: "Chatbot error",
      error: true,
      success: false,
    });
  }
};


// ✅ fallback
const getMockResponse = (message) => {
  if (message.includes("hi")) return "Hello! 👋";
  if (message.includes("order")) return "Check 'My Orders' 📦";
  return "Ask me anything about groceries 🛒";
};