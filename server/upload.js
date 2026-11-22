import Busboy from 'busboy';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function uploadImage(req) {
  return new Promise((resolve, reject) => {
    let busboy;

    try {
      busboy = Busboy({
        headers: req.headers,
        limits: {
          fileSize: 5 * 1024 * 1024,
          files: 1,
          fields: 10,
        },
      });
    } catch {
      return reject(new Error('Invalid upload request.'));
    }

    const fields = {};
    let savedFile = null;
    let fileError = null;
    let outputStream = null;

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (fieldname, file, info) => {
      if (fieldname !== 'image') {
        file.resume();
        fileError = new Error('Unexpected file field.');
        return;
      }

      const extension = ALLOWED_TYPES[info.mimeType];

      if (!extension) {
        file.resume();
        fileError = new Error('Only JPG, PNG, and WEBP images are allowed.');
        return;
      }

      const filename = `${randomUUID()}${extension}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      savedFile = {
        filename,
        filepath,
        url: `/uploads/${filename}`,
      };

      outputStream = fs.createWriteStream(filepath, { flags: 'wx' });

      file.pipe(outputStream);

      file.on('limit', () => {
        fileError = new Error('Image must not exceed 5 MB.');
        outputStream.destroy();
      });

      outputStream.on('error', (err) => {
        fileError = err;
      });
    });

    busboy.on('fieldsLimit', () => {
      fileError = new Error('Too many text fields.');
    });

    busboy.on('filesLimit', () => {
      fileError = new Error('Only one image is allowed.');
    });

    busboy.on('error', (err) => {
      reject(err);
    });

    busboy.on('finish', async () => {
      if (outputStream) {
        await new Promise((resolve) => {
          if (outputStream.closed) return resolve();
          outputStream.on('close', resolve);
          outputStream.on('error', resolve);
        });
      }

      if (fileError) {
        if (savedFile && fs.existsSync(savedFile.filepath)) {
          fs.unlinkSync(savedFile.filepath);
        }

        return reject(fileError);
      }

      if (!savedFile) {
        return reject(new Error('No image was uploaded.'));
      }

      resolve({
        fields,
        file: savedFile,
      });
    });

    req.pipe(busboy);
  });
}