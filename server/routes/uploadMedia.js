import express from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/uploadMedia
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const bucket = process.env.SUPABASE_BUCKET || 'whatsapp-media';
    const ext = (req.file.originalname.split('.').pop() || 'bin').toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const folder = req.body.folder || 'uploads';
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: req.file.mimetype || 'application/octet-stream',
      });

    if (uploadError) {
      console.error('[uploadMedia] Upload error', uploadError);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return res.status(200).json({
      success: true,
      bucket,
      path: filePath,
      media_url: data.publicUrl,
    });
  } catch (err) {
    console.error('[uploadMedia] Unexpected error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
