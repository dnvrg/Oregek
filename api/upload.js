import { Storage } from 'megajs';
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
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(request, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Use a single variable for files to avoid confusion
    const file = files.documentFile[0];
    const patientId = fields.patientId[0];

    if (!file || !patientId) {
      return response.status(400).json({ message: 'Missing file or patient ID' });
    }

    const fileName = file.originalFilename;
    const fileSize = file.size;
    const filePath = file.filepath;

    const mega = await new Storage({
      email: process.env.MEGA_EMAIL,
      password: process.env.MEGA_PASSWORD
    }).ready;

    const uploadedFile = await new Promise((resolve, reject) => {
      const uploadStream = mega.upload({
        name: fileName,
        size: fileSize
      });
      const fileStream = createReadStream(filePath);
      fileStream.pipe(uploadStream);
      uploadStream.on('complete', (file) => resolve(file));
      uploadStream.on('error', reject);
    });

    const fileUrl = await uploadedFile.link();
    const document = {
      id: Date.now(),
      name: fileName,
      patientId: parseInt(patientId),
      data: fileUrl,
      type: file.mimetype,
      size: fileSize,
      uploadDate: new Date().toISOString()
    };

    return response.status(200).json({ message: 'File uploaded successfully!', document });
  } catch (error) {
    console.error("Error during file upload:", error);
    return response.status(500).json({ error: 'Fájl feltöltése sikertelen.' });
  }
}
