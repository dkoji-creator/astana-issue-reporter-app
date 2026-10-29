// Taking or choosing a photo and compressing it before upload (midterm risk 2: max 2 MB)
import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_BYTES = 2 * 1024 * 1024;

async function fileSize(uri) {
  try {
    if (Platform.OS === 'web') return (await (await fetch(uri)).blob()).size;
    return new File(uri).size;
  } catch {
    return null; // size unknown: the server still checks the 2 MB limit
  }
}

// Resize to at most 1280 px wide and save as JPEG; try harder if it is still above 2 MB
export async function compressPhoto(asset) {
  const attempts = [
    { width: 1280, compress: 0.7 },
    { width: 1024, compress: 0.5 },
    { width: 800, compress: 0.4 },
  ];
  let result = null;
  for (const a of attempts) {
    const ctx = ImageManipulator.manipulate(asset.uri);
    if (!asset.width || asset.width > a.width) ctx.resize({ width: a.width });
    const image = await ctx.renderAsync();
    result = await image.saveAsync({ compress: a.compress, format: SaveFormat.JPEG });
    const size = await fileSize(result.uri);
    if (size === null || size <= MAX_BYTES) return { uri: result.uri, width: result.width, height: result.height, size };
  }
  throw new Error('tooBig');
}

// source: 'camera' or 'gallery'. Returns null if the user cancelled.
// Throws Error('cameraDenied') when camera permission is refused.
export async function pickPhoto(source) {
  const options = { mediaTypes: ['images'], quality: 0.9, exif: false };
  let res;
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('cameraDenied');
    res = await ImagePicker.launchCameraAsync(options);
  } else {
    res = await ImagePicker.launchImageLibraryAsync(options);
  }
  if (res.canceled || !res.assets?.length) return null;
  return compressPhoto(res.assets[0]);
}
