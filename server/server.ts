import express, { Request, Response } from 'express';
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.js';
import session from 'express-session'
import MongoStore from 'connect-mongo'
import AuthRouter from './routes/AuthRoutes.js';
import ThumbnailRouter from './routes/ThumbnailRoutes.js';
import UserRouter from './routes/UserRoutes.js';

declare module 'express-session' {
    interface SessionData {
        isLoggedIn: boolean;
        userId: string
    }
}

const app = express();

// Connect to DB (wrapped to support Vercel serverless)
connectDB();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://thumbnail-client.vercel.app'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true
}))

app.set('trust proxy', 1)

app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI as string,
        collectionName: 'sessions'
    })
}))

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});
app.use('/api/auth', AuthRouter)
app.use('/api/thumbnail', ThumbnailRouter)
app.use('/api/user', UserRouter)

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});