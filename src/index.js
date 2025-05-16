import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from 'node:fs';

const ai = new GoogleGenAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
});
const fishType = process.env.FISH_TYPE;

async function main(i) {

  // Load the image from the local file system
  const getImageData = (image_name) => {
    const imagePath = `images/${image_name}.png`;
    const imageData = fs.readFileSync(imagePath);
    return imageData.toString('base64');
  }

  // Prepare the content parts
  const contents = [
    // { text: "Use the same size and styling to generate a shark PNG on a white background in the style of the reference images. Use max 3 shades of a single color and use simple shapes." },
    // { text: "Design:\n - 128x128 pixels \n - Simple, rounded shapes\n" +
    //     "- Flat colors (grey for the body, white for teeth/underbelly if visible)\n" +
    //     "- No outlines\n" +
    //     "- Simple dot eyes\n" +
    //     "- A generally friendly, non-threatening appearance, consistent with the other fish." },
    { text: 'Generate 2D cartoon fish assets in a flat design vector art style, similar to "Kenney game assets.' },
    { text: '**Key Characteristics:**\n' +
        '\n' +
        '1.  **Overall Style:**\n' +
        '    *   **2D, side-view/profile only.**\n' +
        '    *   **No outline.**\n' +
        '    *   **Flat design:** No gradients, minimal to no shading. If shading exists, it\'s a solid block of a slightly darker/lighter color (e.g., a slightly darker fin color than the body).\n' +
        '    *   **Cartoonish and cute:** Simplified, friendly appearance.\n' +
        '    *   **Vector-like appearance:** Clean lines, solid fills, though not necessarily true vector.\n' +
        '\n' +
        '2.  **Shapes & Forms:**\n' +
        '    *   **Simplified, geometric shapes:** Bodies are generally ovoid, teardrop, or rounded rectangular.\n' +
        '    *   **Fins (Dorsal, Pectoral, Caudal/Tail):** Composed of simple geometric shapes like triangles, rounded rectangles, or trapezoids. Clearly demarcated from the body.\n' +
        '    *   **Eyes:** Small, simple, solid dark circles (e.g., black or very dark grey). Occasionally a tiny white dot for a highlight, but often just a solid circle.\n' +
        '    *   **Mouth & Gills:** Usually absent or extremely simplified (e.g., a single curved line for a mouth, or a slightly different colored patch for a gill cover, but often not present). No detailed teeth or internal mouth features.\n' +
        '\n' +
        '3.  **Colors:**\n' +
        '    *   **Solid, flat colors:** Each part (body, fins) is typically a single, uniform color.\n' +
        '    *   **Bright and clear palette:** Colors are distinct and often vibrant, but can also include more muted tones like the grey eel.\n' +
        '    *   **Limited color palette per fish:** Usually 1-3 distinct colors per fish (e.g., orange body, slightly lighter orange fins).\n' +
        '    *   **Examples of color schemes:**\n' +
        '        *   Orange body, lighter orange fins.\n' +
        '        *   Light blue-grey body, slightly darker grey fins.\n' +
        '        *   Green body, slightly darker green fins.\n' +
        '        *   Brown top, beige bottom (pufferfish).\n' +
        '        *   Blue body, slightly darker blue fins.\n' +
        '\n' +
        '4.  **Details & Texture:**\n' +
        '    *   **Minimal to no texture:** No scales, complex patterns, or surface details.\n' +
        '    *   The pufferfish has simple, short, spike-like protrusions, also without an outlines.\n' +
        '\n' +
        '**Target Output:**\n' +
        'The fish should look like clean, ready-to-use assets for a 2D casual or children\'s game. Focus on visual clarity, simplicity, and a friendly aesthetic. Avoid realism, complex anatomical details, or intricate shading.' },
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

  const id = Date.now();
  let candidateId = 0;
  for (const part of response.candidates[0].content.parts) {
    // Based on the part type, either show the text or save the image
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      const imageName = `output/${fishType}-${i}-${++candidateId}-${id}.png`;
      fs.writeFileSync(imageName, buffer);
      console.log(`Image saved as ${imageName}`);
    }
  }
}

// do this 40 times in parallel
const times = 40;
for (let i = 0; i < times; i++) {
  main(i);
}
