import { Router } from "express";
import { authWithGoogle, changePasswordByUser, changePasswordController, deleteUserController, forgotPasswordController, getAllUsers, loginUserController, logoutController, registerUserController, resendOtpController, updateUserDetails, uploadAvatar, userDetails, verifyEmailController, verifyForgotPasswordOTP } from "../controllers/user.controller.js";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";

const userRouter = Router();
userRouter.get('/all', getAllUsers);
userRouter.delete('/:id', deleteUserController);
userRouter.post('/register', registerUserController);
userRouter.post('/verifyEmail', verifyEmailController);
userRouter.post('/login', loginUserController);
userRouter.get('/logout', logoutController);
userRouter.post('/forgot-password', forgotPasswordController);
userRouter.post('/verify-forgot-password-otp', verifyForgotPasswordOTP);
userRouter.post('/forgot-password/change-password', changePasswordController);
userRouter.post('/resend-otp', resendOtpController);
userRouter.post('/authWithGoogle', authWithGoogle);

userRouter.get('/user-details', auth, userDetails);
userRouter.put('/update-user', auth, updateUserDetails);
userRouter.put('/upload-avatar', auth, upload.single('avatar'), uploadAvatar);
userRouter.put('/change-password', auth, changePasswordByUser);

export default userRouter; 