import bcrypt from "bcrypt";
import { usersDB } from "./db.js";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

const secretKey = process.env.JWT_SECRET_KEY

const handleSignUpRequest = async (req, res) => {
    const { id, password } = req.body;

    if (usersDB.find(id)) {
        res.status(409).json({ error: "User already exists" });
        return;
    }

    usersDB.create({ id, password: bcrypt.hashSync(password, 10) });

    res.redirect('/signin');
};

const handleSignInRequest = async (req, res) => {
    const { id, password } = req.body;

    if (!usersDB.find(id)) {
        res.status(401).json({ error: "User not found" });
        return;
    }

    const user = usersDB.find(id);

    if (!bcrypt.compareSync(password, user.password)) {
        res.status(401).json({ error: "Invalid password" });
        return;
    }

    const token = jwt.sign({ id }, secretKey, { expiresIn: '1h' });

    res.cookie('token', token, {
        maxAge: 3600000,
    });

    const { redirect_uri } = req.query

    if (redirect_uri) {
        res.redirect(redirect_uri)
        return
    }

    res.redirect('/profile')
};

const mustBeAuthenticated = (req, res, next) => {
    const token = req.cookies.token || '';

    const { originalUrl } = req

    try {
        const { id } = jwt.verify(token, secretKey);
        const user = usersDB.find(id);

        if (!user) {
            res.redirect(`/signin?redirect_uri=${encodeURIComponent(originalUrl)}`);
            return;
        }

        req.user = user;

        next();
    } catch (err) {
        res.redirect(`/signin?redirect_uri=${encodeURIComponent(originalUrl)}`);
        return;
    }
}

const handleProfileRequest = async (req, res) => {
    const { id } = req.user;

    res.send(`Profile: ${id}`);
}

export { handleSignUpRequest, handleSignInRequest, mustBeAuthenticated, handleProfileRequest };
