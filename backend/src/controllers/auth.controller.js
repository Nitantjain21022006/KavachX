import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../utils/db.js';
import { sendOTPEmail, sendResetPasswordEmail } from '../utils/mailer.js';

export const register = async (req, res) => {
    const { email, password, role, name, sector } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 1. Check if user already exists
        const checkUserQuery = 'SELECT id FROM users WHERE email = $1';
        const { rows: existingUsers } = await pool.query(checkUserQuery, [email]);
        if (existingUsers.length > 0) return res.status(400).json({ success: false, message: 'User already exists' });

        // 2. Create unverified user
        const insertUserQuery = `
            INSERT INTO users (email, password, role, name, sector, is_verified)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const userValues = [
            email,
            hashedPassword,
            role,
            name,
            role === 'SECTOR_OWNER' ? sector?.toUpperCase() : null,
            false
        ];
        const { rows: newUserRows } = await pool.query(insertUserQuery, userValues);
        const newUser = newUserRows[0];

        // 3. Store OTP
        const insertOTPQuery = `
            INSERT INTO otp_verifications (email, otp_code, purpose, expires_at)
            VALUES ($1, $2, $3, $4)
        `;
        const otpValues = [
            email,
            otp,
            'REGISTER',
            new Date(Date.now() + 10 * 60 * 1000).toISOString()
        ];
        await pool.query(insertOTPQuery, otpValues);

        // 4. Send Email
        await sendOTPEmail(email, otp);

        res.status(201).json({ success: true, message: 'OTP sent to email. Please verify to complete registration.' });
    } catch (error) {
        console.error('[Auth Controller] Registration Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyOTP = async (req, res) => {
    const { email, otp, purpose } = req.body;

    try {
        const selectOTPQuery = `
            SELECT * FROM otp_verifications
            WHERE email = $1 AND otp_code = $2 AND purpose = $3 AND expires_at > $4
            LIMIT 1
        `;
        const { rows: verificationRows } = await pool.query(selectOTPQuery, [email, otp, purpose, new Date().toISOString()]);
        const verification = verificationRows[0];

        if (!verification) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        if (purpose === 'REGISTER') {
            const updateVerifyQuery = 'UPDATE users SET is_verified = true WHERE email = $1';
            await pool.query(updateVerifyQuery, [email]);
        }

        // Single use OTP - delete after use
        const deleteOTPQuery = 'DELETE FROM otp_verifications WHERE id = $1';
        await pool.query(deleteOTPQuery, [verification.id]);

        res.json({ success: true, message: 'Verification successful' });
    } catch (error) {
        console.error('[Auth Controller] OTP Verification Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const selectUserQuery = 'SELECT * FROM users WHERE email = $1';
        const { rows: userRows } = await pool.query(selectUserQuery, [email]);
        const user = userRows[0];

        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        if (!user.is_verified) return res.status(403).json({ success: false, message: 'Please verify your email first' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name, sector: user.sector },
            process.env.JWT_SECRET || 'supersecret',
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name, sector: user.sector } });
    } catch (error) {
        console.error('[Auth Controller] Login Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const checkUserQuery = 'SELECT id FROM users WHERE email = $1';
        const { rows: userRows } = await pool.query(checkUserQuery, [email]);
        if (userRows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const insertOTPQuery = `
            INSERT INTO otp_verifications (email, otp_code, purpose, expires_at)
            VALUES ($1, $2, $3, $4)
        `;
        const otpValues = [
            email,
            hashedToken,
            'FORGOT_PASSWORD',
            new Date(Date.now() + 30 * 60 * 1000).toISOString()
        ];
        await pool.query(insertOTPQuery, otpValues);

        await sendResetPasswordEmail(email, resetToken);

        res.json({ success: true, message: 'Password reset link sent to email' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    try {
        const selectOTPQuery = `
            SELECT * FROM otp_verifications
            WHERE otp_code = $1 AND purpose = $2 AND expires_at > $3
            LIMIT 1
        `;
        const { rows: verificationRows } = await pool.query(selectOTPQuery, [hashedToken, 'FORGOT_PASSWORD', new Date().toISOString()]);
        const verification = verificationRows[0];

        if (!verification) return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });

        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        
        const updateUserPasswordQuery = 'UPDATE users SET password = $1 WHERE email = $2';
        await pool.query(updateUserPasswordQuery, [newHashedPassword, verification.email]);

        const deleteOTPQuery = 'DELETE FROM otp_verifications WHERE id = $1';
        await pool.query(deleteOTPQuery, [verification.id]);

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = (req, res) => {
    res.json({ success: true, user: req.user });
};

