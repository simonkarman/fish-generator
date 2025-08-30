import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ai = new GoogleGenAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
});

// Get entity category from environment variable or use "fish" as default
const entityCategory = process.env.ENTITY_CATEGORY ?? "fish";

// Get entity generation from environment variable or use "shark" as default
const entityGeneration = process.env.ENTITY_GENERATION ?? "shark";
const fileSafeEntityGenerationName = entityGeneration.replace(' ', '');

// Get entity count from environment variable or use 5 as default
let entityCount = parseInt(process.env.ENTITY_COUNT ?? '5', 10);
if (entityCount === undefined || isNaN(entityCount)) {
  entityCount = 5;
}

// Create output dir
const id = new Date().toISOString().substring(0, 16)
  .replace(/:/g, '-')
  .replace(/T/g, '-');
const outputDir = `output/${entityCategory}/${fileSafeEntityGenerationName}/${id}`;
fs.mkdirSync(outputDir, { recursive: true });

// Get all image files from the images directory
function getImageFiles(maxExamples = 0) {
  const imagesDir = `images/${entityCategory}`;
  const files = fs.readdirSync(imagesDir);

  // Filter for PNG files and remove the .png extension
  let pngFiles = files
    .filter(file => file.endsWith('.png'))
    .map(file => path.basename(file, '.png'));

  // Limit files to be random distribution of maximum examples
  while (maxExamples !== 0 && pngFiles.length > maxExamples) {
    const randomIndex = Math.floor(Math.random() * pngFiles.length);
    pngFiles.splice(randomIndex, 1);
  }

  return pngFiles;
}

// Load the image from the local file system
const getImageData = (image_name) => {
  const imagePath = `images/${entityCategory}/${image_name}.png`;
  const imageData = fs.readFileSync(imagePath);
  return imageData.toString('base64');
}

// Get text data from markdown file
const getPromptData = () => {
  const textPath = `images/${entityCategory}/prompt.md`;
  return fs.readFileSync(textPath, 'utf8');
}
const getPromptDescribeData = () => {
  const textPath = `images/${entityCategory}/prompt-describe.md`;
  if (!fs.existsSync(textPath)) {
    return undefined;
  }
  return fs.readFileSync(textPath, 'utf8');
}

// Prepare the content parts
const promptData = getPromptData();
const contents = [
  { text: promptData },
];

// Add all available entity images as examples
for (const imageName of getImageFiles()) {
  // Extract the descriptive part from the filename (assuming format like "entity_blue" or "entity-crazy-house")
  // Split string on _ or - and remove empty strings
  const parts = imageName.split(/[_-]/g).filter(part => part !== '');
  const description = parts.slice(parts.length > 1 && parts[0] === entityCategory ? 1 : 0).join(' ');

  // Add text prompt for this example
  console.info(`Adding reference image ${imageName} with description: ${description}`);
  contents.push({ text: `USER EXAMPLE: Generate a picture of a ${description} ${entityCategory}.` });

  // Add the image data
  contents.push({
    inlineData: {
      mimeType: "image/png",
      data: getImageData(imageName),
    },
  });
}

// Add the final instruction
const describePrompt = getPromptDescribeData();
let describeText = `Now it's your turn. Remember to use a white background: Generate a picture of a ${entityGeneration}.`
if (describePrompt) {
  const entityDescription = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ text: describePrompt.replaceAll('[ENTITY_GENERATION]', entityGeneration) + '\n\nAdhere to following style guide:\n```\n' + promptData + '\n```' }],
  }).then(response => response.candidates[0].content.parts.map(p => p.text).filter(p => p).join(' '));
  describeText += ` ${entityDescription}`;
  console.info(`Generated additional description for ${entityGeneration}: ${describeText}`);
}
contents.push({ text: describeText });

async function generateOne(i) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image-preview",
    contents: contents,
    config: {
      // Set responseModalities to include "Image" so the model can read and generate images
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  let candidateId = 0;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      const imageName = candidateId === 0 ? `${i}` : `${i}-${candidateId}`;
      const imagePath = `${outputDir}/${imageName}.png`;
      fs.writeFileSync(imagePath, buffer);
      console.log(`Image ${imageName}/${entityCount} saved at ${imagePath}`);
      candidateId = candidateId + 1;
    }
  }
}

// Generate the specified number of images in parallel
console.info(`Going to generate ${entityCount} images of ${entityGeneration} ${entityCategory}...`);
const generations = [];
for (let i = 0; i < entityCount; i++) {
  generations.push(generateOne(i).catch(_ => null));
}
await Promise.all(generations);
