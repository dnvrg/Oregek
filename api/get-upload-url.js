import { Storage } from 'megajs';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const { fileName, fileSize } = request.body;

    if (!fileName || !fileSize) {
        return response.status(400).json({ message: 'Missing file name or size' });
    }

    try {
        const mega = await new Storage({
            email: process.env.MEGA_EMAIL,
            password: process.env.MEGA_PASSWORD
        }).ready;

        const upload = mega.upload({
            name: fileName,
            size: fileSize
        });

        const uploadUrl = mega.getUploadLink({
            name: fileName,
            size: fileSize
        });

        return response.status(200).json({ uploadUrl: uploadUrl });
    } catch (error) {
        console.error("Error generating upload URL:", error);
        return response.status(500).json({ error: 'URL generálása sikertelen.' });
    }
}
