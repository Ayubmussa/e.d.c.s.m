const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');
const { createReadStream } = require('fs');
const { Readable } = require('stream');

// Function to ensure the profile-images bucket exists
const ensureProfileImagesBucket = async () => {
  try {
    console.log('Checking if profile-images bucket exists...');
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'profile-images');
    console.log('Bucket exists:', bucketExists);
    
    if (!bucketExists) {
      console.log('Creating profile-images bucket...');
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('profile-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }
      
      console.log('Bucket created successfully:', newBucket);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
};

// Set up multer storage for profile images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/profile'));
  },
  filename: function (req, file, cb) {
    const userId = req.user.id;
    const ext = path.extname(file.originalname);
    cb(null, `${userId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// POST /api/profile/upload-image (Supabase Storage)
const uploadProfileImage = [
  (req, res, next) => {
    console.log('Received upload request');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    next();
  },
  upload.single('profileImage'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }
      const userId = req.user.id;
      const ext = path.extname(req.file.originalname);
      const supabasePath = `profile/${userId}${ext}`;
      
      // Ensure bucket exists before upload
      const bucketReady = await ensureProfileImagesBucket();
      if (!bucketReady) {
        logger.error('Failed to ensure profile-images bucket exists');
        return res.status(500).json({ success: false, error: 'Storage bucket not available' });
      }
      
      // Debug logs for Supabase upload
      console.log('Starting Supabase upload...');
      console.log('User ID:', userId);
      console.log('File path:', req.file.path);
      console.log('File size:', req.file.size);
      console.log('File mimetype:', req.file.mimetype);
      console.log('Supabase path:', supabasePath);
      
      // Upload to Supabase Storage
      const fileBuffer = fs.readFileSync(req.file.path);
      console.log('File buffer size:', fileBuffer.length);
      
      const { data, error } = await supabaseAdmin.storage
        .from('profile-images')
        .upload(supabasePath, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: true
        });
      
      console.log('Supabase upload response data:', data);
      console.log('Supabase upload error:', error);
      
      if (error) {
        logger.error('Supabase Storage upload error:', error);
        return res.status(500).json({ success: false, error: 'Failed to upload image to storage' });
      }
      
      // Get public URL
      console.log('Getting public URL for path:', supabasePath);
      const { data: urlData } = supabaseAdmin.storage
        .from('profile-images')
        .getPublicUrl(supabasePath);
      
      console.log('URL data:', urlData);
      const publicURL = urlData?.publicUrl;
      console.log('Public URL:', publicURL);
      
      if (!publicURL) {
        logger.error('Failed to get public URL for uploaded image');
        return res.status(500).json({ success: false, error: 'Failed to get image URL' });
      }
      
      // Save public URL to user_profiles
      const { error: dbError } = await supabaseAdmin
        .from('user_profiles')
        .update({ profile_image: publicURL, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (dbError) {
        logger.error('Failed to update profile image URL:', dbError);
        return res.status(500).json({ success: false, error: 'Failed to save image URL' });
      }
      
      console.log('Successfully uploaded image and saved URL:', publicURL);
      console.log('About to send response with imageUrl:', publicURL);
      console.log('Full response object:', { success: true, imageUrl: publicURL });
      res.json({ success: true, imageUrl: publicURL });
    } catch (err) {
      logger.error('Profile image upload error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
];

// GET /api/profile/image/:filename (Supabase Storage)
const getProfileImage = async (req, res) => {
  try {
    const filename = req.params.filename;
    const supabasePath = `profile/${filename}`;
    const { data, error } = await supabaseAdmin.storage
      .from('profile-images')
      .download(supabasePath);
    if (error || !data) {
      return res.status(404).send('Image not found');
    }
    res.set('Content-Type', data.type || 'image/jpeg');
    res.send(Buffer.from(await data.arrayBuffer()));
  } catch (err) {
    logger.error('Get profile image error:', err);
    res.status(500).send('Error retrieving image');
  }
};

module.exports = {
  uploadProfileImage,
  getProfileImage
};
