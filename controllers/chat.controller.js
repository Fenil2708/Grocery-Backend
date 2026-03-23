import ProductModel from '../models/product.model.js';
import CategoryModel from '../models/category.model.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const getChatResponse = async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({
                message: "Message is required",
                error: true,
                success: false
            });
        }

        const lowerMessage = message.toLowerCase();
        let aiResponse = "";

        // Check if Gemini API key exists
        if (process.env.GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });

                // Fetch some context from DB to provide better answers
                const products = await ProductModel.find({}).limit(5);
                const categories = await CategoryModel.find({}).limit(5);
                
                const productNames = products.map(p => p.name).join(", ");
                const catNames = categories.map(c => c.name).join(", ");

                const prompt = `
                    You are a helpful grocery assistant for our online store called "Grocery Express".
                    Your tone: Friendly, helpful, and concise.
                    Current context:
                    - Available some products: ${productNames}
                    - Main categories: ${catNames}
                    - Services: suburban delivery (24-48h), online payment (Razorpay), order tracking in 'My Orders'.
                    
                    User query: "${message}"
                `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                aiResponse = response.text();
            } catch (aiError) {
                console.error("Gemini AI Error, falling back to mock:", aiError);
                // Fallback to mock if AI fails
                aiResponse = getMockResponse(lowerMessage);
            }
        } else {
            // Mock logic if no API key
            aiResponse = getMockResponse(lowerMessage);
        }

        return res.status(200).json({
            message: aiResponse,
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Chat error:", error);
        return res.status(500).json({
            message: error.message || "Something went wrong with the chatbot",
            error: true,
            success: false
        });
    }
};

const getMockResponse = (message) => {
    if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
        return "Hello! Welcome to our Grocery Store. How can I help you today?";
    } else if (message.includes("product") || message.includes("search") || message.includes("find")) {
        return "You can search for products using the search bar at the top! We have fresh vegetables, fruits, dairy, and more.";
    } else if (message.includes("order") || message.includes("track")) {
        return "To track your order, please log in and visit the 'My Orders' section in your account dashboard.";
    } else if (message.includes("delivery") || message.includes("shipping")) {
        return "We offer fast suburban delivery! Most orders are delivered within 1-2 business days.";
    } else if (message.includes("payment")) {
        return "We accept various online payments securely through Razorpay.";
    } else if (message.includes("offer") || message.includes("discount")) {
        return "Please check our 'Banners' and 'Featured Products' sections for the latest deals and discounts!";
    }
    return "I'm your grocery assistant! I can help you find products, check categories, or answer questions about our grocery service. What's on your mind?";
};
