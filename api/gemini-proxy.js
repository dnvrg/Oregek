const { GoogleGenerativeAI } = require("@google/generative-ai");

// The API key is stored securely as an environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { image, prompt } = req.body;

    if (!image || !prompt) {
        return res.status(400).json({ error: 'Image and prompt are required' });
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

        const imagePart = {
            inlineData: {
                data: image,
                mimeType: "image/png"
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ text: text });
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: 'Error processing the image with Gemini API.' });
    }
};
