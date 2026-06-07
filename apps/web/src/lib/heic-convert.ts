export async function convertHeicToJpg(file: File): Promise<File> {
  const isHeic = ['image/heic', 'image/heif'].includes(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (!isHeic) {
    return file;
  }

  try {
    const heic2any = (await import('heic2any')).default;
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8,
    });

    const resultBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    if (!resultBlob) throw new Error('Conversion returned empty result.');
    const newFilename = file.name.replace(/\.(heic|heif)$/i, '.jpg');

    return new File([resultBlob], newFilename, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    throw new Error('Failed to convert HEIC image. Please try uploading a different format.');
  }
}
