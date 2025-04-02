import { v2 as cloudinary } from "cloudinary"

// Check if all required environment variables are present
const hasValidConfig = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "duslhnwq0",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
  });
  
  // Log configuration status
  if (hasValidConfig) {
    console.log(`Cloudinary configured successfully with cloud name: ${cloudinary.config().cloud_name}`);
  } else {
    console.warn("⚠️ Cloudinary configuration incomplete. Some image operations may fail.");
  }
} catch (error) {
  console.error("Error configuring Cloudinary:", error);
}

export { cloudinary }