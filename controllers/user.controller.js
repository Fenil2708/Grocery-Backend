import UserModel from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";
import sendEmailFun from "../config/sendEmail.js";
import VerificationEmail from "../utils/verifyEmailTemplate.js";
import { createNotification } from "./notification.controller.js";

export async function registerUserController(request, response) {
    try {
        let user;

        const { name, email, password, role } = request.body;
        console.log(name, email, password)
        if (!name || !email || !password) {
            return response.status(400).json({
                message: "provide name email and password",
                error: true,
                success: false,
            });
        }

        user = await UserModel.findOne({ email: email });

        if (user) {
            return response.json({
                message: "User already registered with this email",
                error: true,
                success: false,
            });
        }

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        user = new UserModel({
            email: email,
            password: hashPassword,
            name: name,
            otp: verifyCode,
            otpExpires: Date.now() + 600000,
            role: role || "USER"
        });
        await user.save();
        await sendEmailFun({
            sendTo: email,
            subject: "very email from BroBazar",
            text: "",
            html: VerificationEmail(name, verifyCode)
        })
        const token = jwt.sign(
            { email: user?.email, id: user?._id },
            process.env.JSON_WEB_TOKEN_SECRET_KEY
        )

        return response.status(200).json({
            success: true,
            error: false,
            message: "User registered successfully! Please verify your email",
            token: token
        })
    } catch (error) {
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || error,
        })
    }
}

export async function verifyEmailController(request, response) {
    try {
        const { email, otp } = request.body;

        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return response.status(400).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        const isCodeValid = user.otp?.toString() === otp?.toString().trim();
        const isNotExpired = user.otpExpires > Date.now();

        if (isCodeValid && isNotExpired) {
            user.verify_Email = true;
            user.otp = "";
            user.otpExpires = null;

            await user.save();

            return response.status(200).json({
                message: "Email verified",
                error: false,
                success: true
            });
        }
        else if (!isCodeValid) {
            return response.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false
            });
        }
        else {
            return response.status(400).json({
                message: "OTP Expired",
                error: true,
                success: false
            });
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function loginUserController(request, response) {
    try {

        const { email, password } = request.body;

        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return response.status(400).json({
                message: "User not register",
                error: true,
                success: false
            })
        }

        if (user.status !== "Active") {
            return response.status(400).json({
                message: "Contact to admin",
                error: true,
                success: false
            })
        }

        if (user?.verify_Email !== true) {
            return response.status(400).json({
                message: "Your email is not verify yet please verify your email address",
                error: true,
                success: false
            })
        }

        const checkPassword = await bcryptjs.compare(password, user.password);

        if (!checkPassword) {
            return response.status(400).json({
                message: "Check your password",
                error: true,
                success: false
            })
        }

        const accessToken = await generateAccessToken(user?._id);
        const refreshToken = await generateRefreshToken(user?._id);

        const updateUser = await UserModel.findByIdAndUpdate(user?._id, {
            last_login_date: new Date()
        })

        const cookiesOption = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "None"
        }

        response.cookie('accessToken', accessToken, cookiesOption);
        response.cookie('refreshToken', refreshToken, cookiesOption);

        return response.json({
            message: "Login Successfully",
            error: false,
            success: true,
            data: {
                accessToken,
                refreshToken,
                userEmail: user?.email,
                userName: user?.name,
                role: user?.role
            }
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function logoutController(request, response) {
    try {

        const userId = request?.userId;

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }

        response.clearCookie('accessToken', cookiesOption);
        response.clearCookie('refreshToken', cookiesOption);

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userId, {
            refreshToken: ""
        })

        return response.json({
            message: "Logout Successfully",
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// forgot password
export async function forgotPasswordController(request, response) {
    try {

        const { email } = request.body;
        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return response.status(400).json({
                message: "User not available",
                error: true,
                success: false
            })
        }
        else {
            const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

            user.otp = verifyCode;
            user.otpExpires = Date.now() + 600000;

            // 🔥 ADD THIS
            user.forgotPasswordVerified = false;

            await user.save();

            await sendEmailFun({
                sendTo: email,
                subject: "Verify OTP from Brobazar",
                text: "",
                html: VerificationEmail(user.name, verifyCode)
            })

            return response.json({
                message: "Check your email",
                error: false,
                success: true
            })
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function verifyForgotPasswordOTP(request, response) {
    try {

        const { email, otp } = request.body;

        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return response.status(400).json({
                message: "User not found with this email",
                error: true,
                success: false
            })
        }

        if (!email || !otp) {
            return response.status(400).json({
                message: "Provide required fileds email, otp",
                error: true,
                success: false
            })
        }

        if (otp?.toString().trim() !== user.otp?.toString().trim()) {
            return response.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false
            });
        }

        if (!user.otpExpires || user.otpExpires < Date.now()) {
            return response.status(400).json({
                message: "OTP is expired",
                error: true,
                success: false
            });
        }

        user.otp = "";
        user.otpExpires = null;
        user.forgotPasswordVerified = true; // 🔥 add this

        await user.save();

        return response.status(200).json({
            message: "Verify OTP successfully",
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// change password
export async function changePasswordController(request, response) {
    try {

        const { email, newPassword, confirmPassword } = request.body;

        if (!email || !newPassword || !confirmPassword) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Provide required fields email, new password and confirm password"
            })
        }

        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return response.status(400).json({
                message: "User not found with this email",
                error: true,
                success: false,
            })
        }

        // 🔥 NEW CHECK (VERY IMPORTANT)
        // 🔥 BEST CHECK
        if (!user.forgotPasswordVerified) {
            return response.status(400).json({
                message: "Please verify OTP first",
                error: true,
                success: false
            });
        }

        if (newPassword !== confirmPassword) {
            return response.status(400).json({
                message: "new password and confirm password must be same",
                error: true,
                success: false,
            })
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(confirmPassword, salt);

        user.password = hashPassword;
        user.signUpWithGoogle = false;
        user.forgotPasswordVerified = false;

        await user.save();

        return response.status(200).json({
            message: "Password updated successfully",
            error: false,
            success: true,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// resend Otp
export async function resendOtpController(request, response) {
    const { email } = request.body;
    const user = await UserModel.findOne({ email: email });

    if (!user) {
        return response.json({
            message: "User not Registered with this email",
            error: true,
            success: false
        })
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = verifyCode;
    user.otpExpires = Date.now() + 2 * 60 * 1000;

    await sendEmailFun({
        sendTo: email,
        subject: "Verify email from Ecommerce App",
        text: "",
        html: VerificationEmail(user?.name, verifyCode)
    })
    await user.save();


    return response.status(200).json({
        success: true,
        error: false,
        message: "OTP send successfully",
    });
}

export async function authWithGoogle(request, response) {
    const { name, email, password, avatar, mobile, role } = request.body;

    try {
        const existUser = await UserModel.findOne({ email: email });
        if (!existUser) {
            const user = await UserModel.create({
                name: name,
                mobile: mobile,
                email: email,
                password: null,
                avatar: avatar,
                verify_Email: true,
                signUpWithGoogle: true,
                role: role || "USER"
            })

            await user.save();

            const accessToken = await generateAccessToken(user?._id);
            const refreshToken = await generateRefreshToken(user?._id);

            await UserModel.findByIdAndUpdate(user?._id, {
                last_login_date: new Date()
            })

            const cookiesOption = {
                httpOnly: true,
                secure: true,
                sameSite: "None"
            }

            response.cookie('accessToken', accessToken, cookiesOption);
            response.cookie('refreshToken', refreshToken, cookiesOption);

            return response.json({
                message: "Login Successfully",
                error: false,
                success: true,
                data: {
                    accessToken,
                    refreshToken,
                    userEmail: user?.email,
                    userName: user?.name
                }
            })


        } else {
            const accessToken = await generateAccessToken(existUser?._id);
            const refreshToken = await generateRefreshToken(existUser?._id);

            await UserModel.findByIdAndUpdate(existUser?._id, {
                last_login_date: new Date()
            })

            const cookiesOption = {
                httpOnly: true,
                secure: true,
                sameSite: "None"
            }

            response.cookie('accessToken', accessToken, cookiesOption);
            response.cookie('refreshToken', refreshToken, cookiesOption);

            return response.json({
                message: "Login Successfully",
                error: false,
                success: true,
                data: {
                    accessToken,
                    refreshToken,
                    userEmail: existUser?.email,
                    userName: existUser?.name
                }
            })

        }
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function getAllUsers(request, response) {
    try {
        const { search } = request.query;
        let query = {};

        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const users = await UserModel.find(query).sort({ createdAt: -1 });
        return response.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error fetching users",
            error: true,
            success: false
        });
    }
}


export async function deleteUserController(request, response) {
    try {
        const { id } = request.params;
        const deleteUser = await UserModel.findByIdAndDelete(id);

        if (!deleteUser) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            message: "User deleted successfully",
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Error deleting user",
            error: true,
            success: false
        });
    }
}

export async function userDetails(request, response) {
    try {
        const userId = request.userId;

        const user = await UserModel.findById(userId).select("-password");

        return response.json({
            message: "User Details",
            data: user,
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

export async function updateUserDetails(request, response) {
    try {
        const userId = request.userId;
        const { name, email, mobile } = request.body;

        const updateUser = await UserModel.findByIdAndUpdate(userId, {
            name,
            email,
            mobile,
        }, { new: true });

        // Notify user/admin
        await createNotification(userId, `Profile information updated successfully`, 'PROFILE_UPDATE', updateUser.role === 'ADMIN');

        return response.json({
            message: "Updated successfully",
            error: false,
            success: true,
            data: updateUser,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

export async function uploadAvatar(request, response) {
    try {
        const userId = request.userId;
        const image = request.file;

        if (!image) {
            return response.status(400).json({
                message: "Please upload an image",
                error: true,
                success: false
            })
        }

        const updateUser = await UserModel.findByIdAndUpdate(userId, {
            avatar: image.filename
        }, { new: true })

        // Notify user/admin
        await createNotification(userId, `Profile image updated successfully`, 'PROFILE_UPDATE', updateUser.role === 'ADMIN');

        return response.json({
            message: "Avatar uploaded successfully",
            data: updateUser,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function changePasswordByUser(request, response) {
    try {
        const userId = request.userId;
        const { oldPassword, newPassword, confirmPassword } = request.body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return response.status(400).json({
                message: "Provide all fields",
                error: true,
                success: false
            })
        }

        if (newPassword !== confirmPassword) {
            return response.status(400).json({
                message: "New password and confirm password does not match",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findById(userId);

        const checkPassword = await bcryptjs.compare(oldPassword, user.password);

        if (!checkPassword) {
            return response.status(400).json({
                message: "Old password is wrong",
                error: true,
                success: false
            })
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(newPassword, salt);

        const updatedUser = await UserModel.findByIdAndUpdate(userId, {
            password: hashPassword
        }, { new: true })

        // Notify user/admin
        await createNotification(userId, `Password changed successfully`, 'PROFILE_UPDATE', updatedUser.role === 'ADMIN');

        return response.json({
            message: "Password changed successfully",
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}