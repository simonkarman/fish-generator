# Fish Generator

An experimental project for generating game icons that match an existing art style. This tool helps non-artists create consistent art assets by generating new images based on a set of example images.

![Fish Generator](./examples.png)

> It is called "Fish Generator" because it was initially used to create new fish images, but it has since been adapted to work with other types of images.

## Purpose
This project aims to solve a common challenge in game development: maintaining visual consistency when expanding an art collection. By learning from an existing set of images, the generator can create images that match the same style, allowing developers without artistic skills to expand their game's asset library.

## Example Usage
The current implementation uses a set of fish icons in various colors as reference material to generate new sea creatures that maintain the same artistic style.

You can add new directories with an `images/` prefix to generate new images in different styles. For example, you can create a directory called `images/houses/` and add some image files of houses and a prompt file named `images/houses/prompt.md` to generate houses. See the fish prompt for an example: [images/fish/prompt.md](images/fish/prompt.md).

## Getting Started

```bash
# Install dependencies
npm install

# Authenticate with Google Cloud
gcloud auth application-default login

# Set Google Cloud environment variables
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION=global
export GOOGLE_GENAI_USE_VERTEXAI=True

# Set the parameters for the generator
export ENTITY_CATEGORY='fish' # as found in `images/...` directory)
export ENTITY_GENERATION="shark" # The entity you want to generate (e.g., "dolphin", "shark", "octopus", ect...)

# Run the generator
npm start

# Then, check the results in the in `output/` directory.

# (Optionally) Run directly with entity information
ENTITY_CATEGORY='fish' ENTITY_GENERATION="shark" npm start
```

## Project Structure

- `images/` - Contains the reference fish images in different colors
- `output/` - Generated sea creature images will be saved here
- `src/` - Source code for the generator

## Prerequisites

- Node.js (v14+)
- A Google Cloud account with the Vertex AI API enabled
- The Google Cloud CLI (gcloud) installed
