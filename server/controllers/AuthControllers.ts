import { Request, Response } from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.SESSION_SECRET as string, {
        expiresIn: '7d',
    });
};

// Controllers For User Registration
export const registerUser = async (req: Request, res: Response) => {
    try {
        console.log('[REGISTER] Request body:', JSON.stringify(req.body));
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // find user by email
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Encrypt the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        const token = generateToken(newUser._id as string);

        return res.json({
            message: 'Account created successfully',
            token,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (error: any) {
        console.error('[REGISTER] Error:', error);
        console.error('[REGISTER] Stack:', error?.stack);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// Controllers For User Login
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password as string);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id as string);

        return res.json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Controllers For User Logout
export const logoutUser = async (req: Request, res: Response) => {
    // Client will remove token
    return res.json({ message: 'Logout successful' });
};

// Controllers For User Verify
export const verifyUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body; // Set by protect middleware

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(400).json({ message: 'Invalid user' });
        }

        return res.json({ user });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
