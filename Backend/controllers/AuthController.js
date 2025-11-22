import UserModel from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import User from '../models/user.js';
import AdminProfile from '../models/AdminProfile.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // --- NEW: Check verification status ---
    if (!user.is_verified) {
      return res.status(403).json({ 
        success: false, 
        message: "Account not verified", 
        isVerified: false, // Flag for frontend
        email: user.email 
      });
    }
    // --------------------------------------

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const signup = async (req, res) => {
    console.log("Signup Payload:", req.body);

  try {
    const { name, email, password, role } = req.body;
     console.log({ name, email, password, role }); 

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required", success: false });
    }

    if (!/^[A-Za-z ]{3,}$/.test(name)) {
      return res.status(400).json({ message: "Name must be at least 3 letters and only alphabets allowed", success: false });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format", success: false });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Password must be 8+ chars with upper, lower, number & special char", success: false });
    }

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      if (!existingUser.is_verified) {
        await UserModel.deleteOne({ _id: existingUser._id });
      } else {
        return res.status(409).json({ message: "User already exists", success: false });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      role,
      is_active: true,
      is_verified: false,
      otp,
    });

    await newUser.save();

    await sendEmail(
      email,
      "Master Motor ATS - Email Verification OTP",
      `Hello ${name},\n\nYour OTP is: ${otp}\n\nPlease enter this to verify your account.`
    );

    return res.status(201).json({ message: "Signup successful. OTP sent to email.", success: true });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const verify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(409).json({ message: "Auth failed: email or password wrong", success: false });
    }

    if (user.otp != otp) {
      return res.status(403).json({ message: "OTP is wrong", success: false });
    }

    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    user.is_verified = true;
    await user.save();

    res.status(200).json({
      message: "OTP has been verified",
      name: user.name,
      email: user.email,
      role: user.role,
      jwtToken,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (user) {
      user.otp = Math.floor(Math.random() * 1000000 + 1);

      await user.save();
      await sendEmail(
        email,
        "Master Motor ATS - Password Reset OTP",
        `Hello ${user.name || "User"},

            We received a request to reset your password.

            🔐 Your One-Time Password (OTP) is: ${user.otp}

            Please enter this OTP in the app to proceed with resetting your password.

            ⚠️ Do not share this code with anyone. It will expire shortly.

            If you did not request this, please ignore this email.

            Regards,  
            Master Motor ATS Support Team`
      );
    }
    if (!user) {
      return res
        .status(409)
        .json({ message: "Auth failed: email is wrong", success: false });
    }

    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Otp has sent to your email",
      name: user.name,
      email: user.email,
      role: user.role,
      jwtToken: jwtToken,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!password || password.length < 4) {
      return res.status(400).json({
        message: "Password must be at least 4 characters long",
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res
        .status(409)
        .json({ message: "Auth failed: email is wrong", success: false });
    }

    if (user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
    }

    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Password Reset Successfully",
      name: user.name,
      email: user.email,
      role: user.role,
      jwtToken: jwtToken,
      success: true,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// List all users and populate their profile details if available
export const listUsers = async (req, res) => {
    try {
        const users = await User.find({}).lean();
        const profiles = await AdminProfile.find({}).populate('user', 'email').lean();
        
        const profileMap = new Map(profiles.map(p => [p.user.email, p]));
        
        const usersWithDetails = users.map(user => {
            const profile = profileMap.get(user.email);
            return {
                ...user,
                department: profile?.department || 'N/A',
                designation: profile?.designation || 'N/A',
                employeeId: profile?.employeeId || 'N/A',
            };
        });

        res.json(usersWithDetails);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update a user's role
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User role updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete a user
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// ADD THIS NEW FUNCTION FOR PASSWORD RESET
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    if (user.otp != otp) {
      return res.status(403).json({ message: "Invalid or expired OTP", success: false });
    }

    user.otp = Math.floor(100000 + Math.random() * 900000).toString(); // Invalidate old OTP
    await user.save();

    res.status(200).json({
      message: "OTP verified successfully",
      success: true,
    });

  } catch (error) {
    console.error("Verify Reset OTP Error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const sendResetOtpLoggedIn = async (req, res) => {
  try {
    const userId = req.user.id; // From authMiddleware
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    user.otp = Math.floor(100000 + Math.random() * 900000).toString();
    await user.save();
    
    await sendEmail(
      user.email,
      "Master Motor ATS - Password Reset OTP",
      `Hello ${user.name},\n\nYour OTP for password reset is: ${user.otp}\n\nIf you did not request this, please ignore this email.`
    );

    res.status(200).json({
      message: "OTP has been sent to your email",
      success: true,
    });

  } catch (error) {
    console.error("Send Reset OTP Error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required", success: false });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    await user.save();

    await sendEmail(
      email,
      "Resend OTP - Master Motor ATS",
      `Hello ${user.name},\n\nYour new OTP is: ${otp}\n\nPlease enter this to verify your account.`
    );

    res.status(200).json({ message: "OTP resent successfully", success: true });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};