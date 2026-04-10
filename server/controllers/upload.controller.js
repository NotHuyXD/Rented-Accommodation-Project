// ============================================================
// Upload Controller - File upload for images/docs
// ============================================================
const multer = require('multer');
const path = require('path');
const { generateUUID } = require('../utils/helpers');
const { query } = require('../config/db');

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${generateUUID().substring(0, 8)}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
                         'video/mp4', 'video/quicktime',
                         'application/pdf', 'application/msword',
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Loại file không được hỗ trợ'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') } // 10MB
});

const uploadSingle = upload.single('file');
const uploadMultiple = upload.array('files', 20);

async function uploadFile(req, res, next) {
  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File quá lớn, tối đa 10MB' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được upload' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' :
                     req.file.mimetype.startsWith('video/') ? 'video' : 'document';

    // Save to media library
    query(
      `INSERT INTO media_library (id, uploaded_by, original_filename, file_url, file_size, mime_type, file_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), req.user.id, req.file.originalname, fileUrl, req.file.size, req.file.mimetype, fileType]
    ).catch(console.error);

    res.json({
      message: 'Upload thành công',
      data: {
        url: fileUrl,
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileType,
      }
    });
  });
}

async function uploadFiles(req, res, next) {
  uploadMultiple(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File quá lớn, tối đa 10MB' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Không có file nào được upload' });
    }

    const results = req.files.map(file => {
      const fileUrl = `/uploads/${file.filename}`;
      const fileType = file.mimetype.startsWith('image/') ? 'image' :
                       file.mimetype.startsWith('video/') ? 'video' : 'document';

      // Save to media library async
      query(
        `INSERT INTO media_library (id, uploaded_by, original_filename, file_url, file_size, mime_type, file_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), req.user.id, file.originalname, fileUrl, file.size, file.mimetype, fileType]
      ).catch(console.error);

      return {
        url: fileUrl,
        originalFilename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileType,
      };
    });

    res.json({ message: 'Upload thành công', data: results });
  });
}

async function listMedia(req, res, next) {
  try {
    const { page = 1, limit = 20, fileType, folder } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE uploaded_by = ?';
    const params = [req.user.id];

    if (fileType) { whereClause += ' AND file_type = ?'; params.push(fileType); }
    if (folder) { whereClause += ' AND folder = ?'; params.push(folder); }

    params.push(parseInt(limit), offset);
    const media = await query(
      `SELECT id, original_filename, file_url, thumbnail_url, file_size, mime_type, file_type, created_at
       FROM media_library ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json({ data: media });
  } catch (error) { next(error); }
}

module.exports = { uploadFile, uploadFiles, listMedia };
