import { Storage } from 'megajs';
import { head, del } from '@vercel/blob';
import formidable from 'formidable';
import { createReadStream } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const form = formidable();

  try {
    const form = formidable();

    const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            resolve([fields, files]);
        });
    });
    
    // Check if the file was sent as a stream
    if (!files.documentFile || !files.documentFile[0]) {
        return res.status(400).json({ message: 'Missing file or patient ID' });
    }

    const file = files.documentFile[0];
    const patientId = fields.patientId[0];
    const fileName = file.originalFilename;
    const fileSize = file.size;
    const filePath = file.filepath;

    const mega = await new Storage({
        email: process.env.MEGA_EMAIL,
        password: process.env.MEGA_PASSWORD
    }).ready;

    const uploadStream = mega.upload({
        name: fileName,
        size: fileSize
    });

    const fileStream = createReadStream(filePath);
    
    fileStream.pipe(uploadStream);

    await new Promise((resolve, reject) => {
        uploadStream.on('complete', resolve);
        uploadStream.on('error', reject);
    });

    // The rest of your code for creating the document object remains the same
    const document = {
      id: Date.now(),
      name: fileName,
      patientId: parseInt(patientId),
      data: `MEGA File URL for ${fileName}`,
      type: file.mimetype,
      size: fileSize,
      uploadDate: new Date().toLocaleString()
    };
    
    return res.status(200).json({ message: 'File uploaded successfully!', document });
  }
}
