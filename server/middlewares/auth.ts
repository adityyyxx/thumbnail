import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.SESSION_SECRET as string) as { id: string };

            req.body = req.body || {};
            req.body.userId = decoded.id; // Pass userId via body to avoid TS type issues

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export default protect;
