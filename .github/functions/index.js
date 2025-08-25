const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.analyzeShoppingList = functions.https.onCall(async (data, context) => {
  // Check for authentication, if needed
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'The function must be called by an authenticated user.');
  // }

  const image = data.image;
  const prompt = data.prompt;

  if (!image || !prompt) {
    throw new functions.https.HttpsError('invalid-argument', 'Image and prompt are required.');
  }

  const genAI = new GoogleGenerativeAI(functions.config().gemini.key);
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const imagePart = {
    inlineData: {
      data: image,
      mimeType: "image/png"
    }
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return { text: text };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new functions.https.HttpsError('internal', 'Error processing the image with Gemini API.');
  }
});
