import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    // ✅ Check API key
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // ✅ FIXED MODEL (important 🔥)
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash-latest",
        });

        // ✅ Fetch DB data
        const products = await ProductModel.find({}).limit(5);
        const categories = await CategoryModel.find({}).limit(5);

        const productNames = products.map((p) => p.name).join(", ");
        const catNames = categories.map((c) => c.name).join(", ");

        // ✅ Prompt
        const prompt = `
You are a helpful grocery assistant for "Grocery Express".
Reply short, friendly, and helpful.

Available Products: ${productNames}
Categories: ${catNames}

User Query: ${message}
        `;

        // ✅ Gemini API call (correct format)
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });

        const response = result.response.text();
        aiResponse = response;

      } catch (aiError) {
        console.error("Gemini AI Error:", aiError);

        // ✅ fallback
        aiResponse = getMockResponse(lowerMessage);
      }
    } else {
      console.log("❌ No GEMINI_API_KEY found");
      aiResponse = getMockResponse(lowerMessage);
    }

    return res.status(200).json({
      message: aiResponse,
      error: false,
      success: true,
    });

  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      message: "Something went wrong with chatbot",
      error: true,
      success: false,
    });
  }
};


// ✅ Mock fallback function (IMPORTANT 🔥)
const getMockResponse = (message) => {
  if (
    message.includes("hello") ||
    message.includes("hi") ||
    message.includes("hey")
  ) {
    return "Hello! Welcome to Grocery Express 🛒 How can I help you?";
  } 
  else if (
    message.includes("product") ||
    message.includes("search") ||
    message.includes("find")
  ) {
    return "You can search products using the search bar. We have fruits, vegetables, dairy & more.";
  } 
  else if (message.includes("order") || message.includes("track")) {
    return "Go to 'My Orders' section to track your order 📦";
  } 
  else if (message.includes("delivery")) {
    return "Delivery takes 1-2 days 🚚";
  } 
  else if (message.includes("payment")) {
    return "We support secure payments via Razorpay 💳";
  } 
  else if (message.includes("offer") || message.includes("discount")) {
    return "Check banners for latest offers 🔥";
  }

  return "I'm your grocery assistant 🛒 Ask me about products, orders, or offers!";
};