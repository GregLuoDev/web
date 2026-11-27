import { AppError } from "./errors";

const IMAGE_MARKDOWN = /!\[[^\]]*\]\((data:[^)]+)\)/g;
const VALID_DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_TOTAL_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 50;

export function validateEmbeddedImages(fields: readonly string[]): void {
  let totalBytes = 0;
  let imageCount = 0;

  for (const field of fields) {
    for (const match of field.matchAll(IMAGE_MARKDOWN)) {
      imageCount += 1;
      if (imageCount > MAX_IMAGES) {
        throw new AppError(422, "VALIDATION_ERROR", `A question can contain no more than ${MAX_IMAGES} pasted images.`);
      }

      const dataUrl = match[1];
      const imageMatch = VALID_DATA_IMAGE.exec(dataUrl);
      if (!imageMatch) {
        throw new AppError(
          422,
          "VALIDATION_ERROR",
          "Pasted images must be PNG, JPEG, GIF, or WebP data URLs.",
        );
      }

      const encoded = imageMatch[1];
      const bytes = Buffer.from(encoded, "base64");
      if (bytes.toString("base64") !== encoded) {
        throw new AppError(422, "VALIDATION_ERROR", "A pasted image contains invalid base64 data.");
      }
      totalBytes += bytes.byteLength;
      if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
        throw new AppError(422, "VALIDATION_ERROR", "Pasted images must total no more than 5 MB per question.");
      }
    }
  }
}
