// Photo upload utility for repairs
export async function uploadRepairPhoto(file: File): Promise<string> {
  // For now, convert to base64 data URL
  // In production, upload to Cloudinary or similar service
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadMultiplePhotos(files: FileList): Promise<string[]> {
  const uploadPromises = Array.from(files).map(file => uploadRepairPhoto(file));
  return Promise.all(uploadPromises);
}

// In production, use this for Cloudinary:
/*
export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  const data = await response.json();
  return data.secure_url;
}
*/
