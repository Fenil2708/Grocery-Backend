import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// CREATE RAZORPAY ORDER
export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency = "USD" } = req.body;

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            return res.status(500).json({
                message: "Razorpay keys are not configured on the server",
                success: false,
                error: true
            });
        }

        console.log("Using Razorpay Key ID:", `${keyId.substring(0, 12)}...${keyId.substring(keyId.length - 3)}`);
        console.log("Using Razorpay Key Secret:", `${keySecret.substring(0, 3)}...${keySecret.substring(keySecret.length - 3)}`);

        const razorpayInstance = new Razorpay({
            key_id: keyId.trim(),
            key_secret: keySecret.trim(),
        });

        if (!amount) {
            return res.status(400).json({
                message: "Amount is required",
                success: false,
                error: true
            });
        }

        const options = {
            amount: Math.round(Number(amount) * 100), // amount in smallest currency unit (paise)
            currency,
            receipt: `receipt_order_${Date.now()}`,
        };

        console.log("Creating Razorpay Order with Options:", JSON.stringify(options, null, 2));

        const order = await razorpayInstance.orders.create(options);
        console.log("Razorpay Order Created Successfully:", order.id);

        if (!order) {
            return res.status(500).json({
                message: "Error creating Razorpay order",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error("Razorpay Order Error:", error);
        return res.status(500).json({
            message: error.error?.description || error.message || "Internal Server Error",
            success: false,
            error: true
        });
    }
};

// VERIFY PAYMENT SIGNATURE
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keySecret) {
            return res.status(500).json({
                message: "Razorpay secret key is not configured on the server",
                success: false,
                error: true
            });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            return res.status(200).json({
                message: "Payment verified successfully",
                success: true
            });
        } else {
            return res.status(400).json({
                message: "Invalid payment signature",
                success: false,
                error: true
            });
        }

    } catch (error) {
        console.error("Verification Error:", error);
        return res.status(500).json({
            message: error.message || "Internal Server Error",
            success: false,
            error: true
        });
    }
};
