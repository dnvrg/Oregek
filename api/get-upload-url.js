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

        // Mega.js doesn't have a direct "get pre-signed URL" method.
        // A common pattern is to create an upload stream or promise and use its URL.
        // Here, we simulate getting a direct upload URL.
        // Note: The actual implementation might vary based on the Mega API.
        // This example assumes a synchronous URL is returned.
        const uploadUrl = mega.upload(fileName).url;

        return response.status(200).json({ uploadUrl: uploadUrl });
    } catch (error) {
        console.error("Error generating upload URL:", error);
        return response.status(500).json({ error: 'URL generálása sikertelen.' });
    }
}
