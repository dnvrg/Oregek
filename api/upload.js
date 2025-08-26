const { Storage } = require('megajs');
const formidable = require('formidable');
const { createReadStream } = require('fs');

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

    if (!files.documentFile || !fields.patientId) {
      return response.status(400).json({ message: 'Missing file or patient ID' });
    }

    const file = files.documentFile[0];
    const patientId = fields.patientId[0];

    const mega = await new Storage({
      email: process.env.MEGA_EMAIL,
      password: process.env.MEGA_PASSWORD
    }).ready;

    const uploadStream = mega.upload({
      name: file.originalFilename,
      size: file.size
    });

    const fileStream = createReadStream(file.filepath);
    fileStream.pipe(uploadStream);

    await new Promise((resolve, reject) => {
      uploadStream.on('complete', resolve);
      uploadStream.on('error', reject);
    });

    // You would typically save the MEGA file URL here.
    // For this example, we just return a success message and a mock document object.
    const document = {
      id: Date.now(),
      name: file.originalFilename,
      patientId: parseInt(patientId),
      data: 'MEGA File URL',
      type: file.mimetype,
      size: file.size,
      uploadDate: new Date().toLocaleString()
    };
    
    return response.status(200).json({ message: 'File uploaded successfully!', document });
  } catch (error) {
    console.error('Upload Error:', error);
    return response.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

// Disable Vercel's default body parser to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};
