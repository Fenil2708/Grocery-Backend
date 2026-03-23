import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import { GoogleGenAI } from "@google/genai";

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

    const lowerMessage = message.toLowerCase();
    let aiResponse = "";

    // ================= AI PART =================
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });

        // ✅ Fetch DB data
        const products = await ProductModel.find({}).limit(5);
        const categories = await CategoryModel.find({}).limit(5);

        const productNames = products.map((p) => p.name).join(", ");
        const catNames = categories.map((c) => c.name).join(", ");

        // ✅ Prompt
        const prompt = `
You are a smart grocery assistant for "Grocery Express".
Reply short, helpful and friendly.

Available Products: ${productNames}
Categories: ${catNames}

User Question: ${message}
        `;

        // ✅ Gemini API call
        const result = await genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });

        aiResponse = result?.text || "";

      } catch (err) {
        console.log("Gemini Error:", err);

        // ================= SMART FALLBACK =================
        // 🔥 Product search
        const product = await ProductModel.findOne({
          name: { $regex: lowerMessage, $options: "i" },
        });

        if (product) {
          return res.json({
            message: `🛒 ${product.name} - ₹${product.price}`,
            success: true,
            error: false,
          });
        }

        // 🔥 Category suggestion
        const category = await CategoryModel.findOne({
          name: { $regex: lowerMessage, $options: "i" },
        });

        if (category) {
          return res.json({
            message: `📂 You can explore "${category.name}" category in our store.`,
            success: true,
            error: false,
          });
        }

        // 🔥 Final fallback
        aiResponse = getMockResponse(lowerMessage);
      }
    } else {
      aiResponse = getMockResponse(lowerMessage);
    }

    return res.json({
      message: aiResponse,
      success: true,
      error: false,
    });

  } catch (error) {
    console.log("Chat Error:", error);
    return res.status(500).json({
      message: "Something went wrong with chatbot",
      error: true,
      success: false,
    });
  }
};

// ================= MOCK RESPONSES =================
const getMockResponse = (message) => {
  if (message.includes("hello") || message.includes("hi")) {
    return "Hello! 👋 How can I help you today?";
  }

  if (message.includes("product") || message.includes("search")) {
    return "You can search products using the search bar 🛒";
  }

  if (message.includes("order")) {
    return "Go to 'My Orders' to track your order 📦";
  }

  if (message.includes("delivery")) {
    return "Delivery takes 1-2 days 🚚";
  }

  if (message.includes("payment")) {
    return "We support Razorpay payments 💳";
  }

  return "Ask me anything about groceries 😊";
};