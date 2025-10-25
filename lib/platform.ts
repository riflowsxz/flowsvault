export const Platform = {
  isVercel: (): boolean => {
    return process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
  },

  isVPS: (): boolean => {
    return !Platform.isVercel();
  },

  getName: (): 'vercel' | 'vps' => {
    return Platform.isVercel() ? 'vercel' : 'vps';
  },

  getMaxUploadSize: (): number => {
    if (Platform.isVercel()) {
      return 4.5 * 1024 * 1024;
    }
    return 100 * 1024 * 1024;
  },

  getUploadLimitMessage: (): string => {
    if (Platform.isVercel()) {
      return 'Maximum file size: 4.5MB (vercel serverless limit)';
    }
    return 'Maximum file size: 100MB';
  },
} as const;
