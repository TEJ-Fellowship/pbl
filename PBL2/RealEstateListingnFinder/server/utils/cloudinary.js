import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, "../.env") });

cloudinary.config({
  cloud_name: "dct2ybdrs",
  api_key: 384735274576246,
  api_secret: "PvlIvX5VsKfQfw9pboNeljTivaM",
});

export default cloudinary;2122
