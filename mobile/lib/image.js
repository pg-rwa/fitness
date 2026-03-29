import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const MAX_DIMENSION = 2048;

/**
 * Resize an image to fit within maxDimension on its longest side.
 * Pass the image width/height from ImagePicker result to determine orientation.
 * Returns the resized image URI, or original if already within limits.
 */
export async function resizeImageIfNeeded(uri, { width, height, maxDimension = MAX_DIMENSION, compress = 0.8 } = {}) {
  try {
    // Skip resize if already within limits or dimensions unknown
    if (width && height && width <= maxDimension && height <= maxDimension) {
      return uri;
    }

    // Constrain the longest side
    const resize = width && height && height > width
      ? { height: maxDimension }
      : { width: maxDimension };

    const result = await manipulateAsync(
      uri,
      [{ resize }],
      { compress, format: SaveFormat.JPEG }
    );
    return result.uri;
  } catch (err) {
    console.warn("[image-resize] Failed to resize, using original:", err.message);
    return uri;
  }
}
