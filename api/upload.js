const { Storage } = require('megajs');
const { head, del } = require('@vercel/blob');

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { url, originalFilename, patientId, size } = await request.json();

  if (!url || !originalFilename || !patientId || !size) {
    return response.status(400).json({ message: 'Missing file URL or metadata.' });
  }

  try {
    // Check if the blob exists and is accessible
    await head(url);

    const mega = await new Storage({
      email: process.env.MEGA_EMAIL,
      password: process.env.MEGA_PASSWORD
    }).ready;

    const fileResponse = await fetch(url);
    const uploadStream = mega.upload({
      name: originalFilename,
      size: size
    });

    await new Promise((resolve, reject) => {
      fileResponse.body.pipe(uploadStream);
      uploadStream.on('complete', resolve);
      uploadStream.on('error', reject);
    });

    // Delete the file from Vercel Blob after successful upload to MEGA
    await del(url);

    const document = {
      id: Date.now(),
      name: originalFilename,
      patientId: parseInt(patientId),
      data: `MEGA File URL for ${originalFilename}`, // You would get the actual MEGA URL here
      type: fileResponse.headers.get('content-type'),
      size: size,
      uploadDate: new Date().toLocaleString()
    };
    
    return response.status(200).json({ message: 'File uploaded successfully!', document });
  } catch (error) {
    console.error('Upload Error:', error);
    return response.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
