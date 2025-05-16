import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from 'node:fs';

const ai = new GoogleGenAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
});

// Get fish type from environment variable or use "fish" as default
const fishType = process.env.FISH_TYPE ?? "shark";

// Get fish count from environment variable or use 40 as default
let fishCount = parseInt(process.env.FISH_COUNT ?? '40', 10);
if (fishCount === undefined || isNaN(fishCount)) {
  fishCount = 40;
}

// Create output dir
const id = Date.now();
const outputDir = `output/${id}`;
fs.mkdirSync(outputDir, { recursive: true });

async function generateOne(i) {

  // Load the image from the local file system
  const getImageData = (image_name) => {
    const imagePath = `images/${image_name}.png`;
    const imageData = fs.readFileSync(imagePath);
    return imageData.toString('base64');
  }

  // Get text data from markdown file
  const getPromptData = (text_name) => {
    const textPath = `prompts/${text_name}.md`;
    return fs.readFileSync(textPath, 'utf8');
  }

  // Prepare the content parts
  const contents = [
    { text: getPromptData('prompt_detailed') },
    {
      inlineData: {
        mimeType: "image/png",
        data: getImageData('fish_blue'),
      },
    },
    { text: "EXAMPLES Generate a picture of a brown fish." },
    {
      inlineData: {
        mimeType: "image/png",
        data: getImageData('fish_brown'),
      },
    },
    { text: "EXAMPLES Generate a picture of a green fish." },
    {
      inlineData: {
        mimeType: "image/png",
        data: getImageData('fish_green'),
      },
    },
    { text: "EXAMPLES Generate a picture of a red fish." },
    {
      inlineData: {
        mimeType: "image/png",
        data: getImageData('fish_red'),
      },
    },
    { text: `Now it's your turn: Generate a picture of a ${fishType}.` },
  ];

  // Set responseModalities to include "Image" so the model can generate an image
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    // model: 'imagen-3.0-generate-002',
    contents: contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  let candidateId = 0;
  for (const part of response.candidates[0].content.parts) {
    // Based on the part type, either show the text or save the image
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      const imageName = `${outputDir}/${fishType}-${i}-${++candidateId}.png`;
      fs.writeFileSync(imageName, buffer);
      console.log(`Image saved as ${imageName}`);
    }
  }
}

// do this 40 times in parallel
const times = 40;
for (let i = 0; i < times; i++) {
  generateOne(i);
}
