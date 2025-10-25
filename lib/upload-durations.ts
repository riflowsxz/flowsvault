export type UploadDurationConfig = {
  ms: number | null;
  label: string;
};

export const UPLOAD_DURATIONS = {
  '1h': { ms: 60 * 60 * 1000, label: '1 hour' },
  '24h': { ms: 24 * 60 * 60 * 1000, label: '24 hours' },
  '7d': { ms: 7 * 24 * 60 * 60 * 1000, label: '7 days' },
  'unlimited': { ms: null, label: 'Unlimited' },
} as const satisfies Record<string, UploadDurationConfig>;

export type UploadDuration = keyof typeof UPLOAD_DURATIONS;

export const DEFAULT_UPLOAD_DURATION: UploadDuration = 'unlimited';

export const uploadDurationOptions: ReadonlyArray<{ value: UploadDuration; label: string }> =
  Object.entries(UPLOAD_DURATIONS).map(([value, config]) => ({
    value: value as UploadDuration,
    label: config.label,
  }));

export const getUploadDurationLabel = (duration: UploadDuration): string =>
  UPLOAD_DURATIONS[duration]?.label ?? duration;
