import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import UserModel from '../models/user.model';

// Configure multer for profile photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'profile-photos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const userId = req.params.id;
    const ext = path.extname(file.originalname);
    cb(null, `user-${userId}-${Date.now()}${ext}`);
  }
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export const uploadProfilePhoto = async (req: Request, res: Response) => {
  try {
    console.log('========================================');
    console.log('[Backend] Upload profile photo request received');
    console.log('========================================');
    console.log('[Backend] User ID param:', req.params.id);
    console.log('[Backend] Current user ID:', req.currentUser?.id);
    console.log('[Backend] File:', req.file);
    
    const userId = parseInt(req.params.id as string);

    if (isNaN(userId)) {
      console.log('[Backend] ❌ Invalid user ID');
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    if (!req.file) {
      console.log('[Backend] ❌ No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Update user profile picture
    const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
    console.log('[Backend] Updating user', userId, 'with photo URL:', photoUrl);
    
    await UserModel.update(userId, { profile_picture: photoUrl });
    
    console.log('[Backend] ✅ Profile photo uploaded successfully');

    return res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profile_picture_url: photoUrl
      }
    });
  } catch (error) {
    console.error('[Backend] Upload photo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload profile photo'
    });
  }
};
