export const uploadImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

export const validateImage = (file: File): { isValid: boolean; error?: string } => {
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please select an image file' };
  }
  
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: 'File size exceeds 5MB limit' };
  }

  return { isValid: true };
};