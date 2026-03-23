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

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
        });

        // ✅ DB data first
        const products = await ProductModel.find({}).limit(5);
        const categories = await CategoryModel.find({}).limit(5);

        const productNames = products.map((p) => p.name).join(", ");
        const catNames = categories.map((c) => c.name).join(", ");

        // ✅ Prompt first define
        const prompt = `
You are a helpful grocery assistant for "Grocery Express".
Reply short and friendly.

Products: ${productNames}
Categories: ${catNames}

User: ${message}
        `;

        // ✅ Only ONE result variable
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
        aiResponse = getMockResponse(lowerMessage);
      }
    } else {
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