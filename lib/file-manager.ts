import { constants } from 'node:fs';
import { access, mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';

import { APP_CONFIG } from './config';
import { deleteFileFromR2 } from './r2-storage';

export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  size: number;
  mimeType: string;
  extension: string;
  uploadedAt: Date;
  expiresAt: Date | null;
  path?: string;
  hash?: string;
  downloadUrl: string;
}

export class FileManager {
  async ensureUploadDirectory(): Promise<void> {
    try {
      await access(APP_CONFIG.upload.uploadDir, constants.F_OK);
    } catch {
      await mkdir(APP_CONFIG.upload.uploadDir, { recursive: true });
    }
  }

  private generateFileName(originalName: string): string {
    const extension = extname(originalName).toLowerCase();
    const baseName = extension.length > 0 ? originalName.slice(0, -extension.length) : originalName;
    const sanitizedBase = this.sanitizeFileName(baseName);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    return `${sanitizedBase || 'file'}-${timestamp}-${randomSuffix}${extension}`;
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  private async calculateFileHash(buffer: Buffer): Promise<string> {
    return createHash('sha256').update(buffer).digest('hex');
  }

  isValidFileType(fileName: string): boolean {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return false;
    }

    const extension = fileName.slice(lastDotIndex).toLowerCase();
    return (APP_CONFIG.upload.allowedExtensions as readonly string[]).includes(extension);
  }

  isValidFileSize(size: number): boolean {
    return size <= APP_CONFIG.upload.maxFileSize && size > 0;
  }

  private async saveFile(buffer: Buffer, originalName: string): Promise<string> {
    await this.ensureUploadDirectory();
    const targetName = this.generateFileName(originalName);
    const targetPath = join(APP_CONFIG.upload.uploadDir, targetName);
    await writeFile(targetPath, buffer);
    return targetPath;
  }

  async deleteFile(fileName: string): Promise<boolean> {
    let r2DeletionFailed = false;

    try {
      await deleteFileFromR2(fileName);
    } catch (error) {
      r2DeletionFailed = true;
      console.error('Failed to delete file from R2:', error);
    }

    const localPath = join(APP_CONFIG.upload.uploadDir, fileName);

    if (await this.fileExists(localPath)) {
      try {
        await unlink(localPath);
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code !== 'ENOENT') {
          console.error('Failed to delete local file:', error);
          return false;
        }
      }
    }

    return !r2DeletionFailed;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async getFileStats(filePath: string) {
    try {
      return await stat(filePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async cleanupExpiredFiles(fileList: FileMetadata[]): Promise<void> {
    const now = new Date();
    const expiredFiles = fileList.filter((file) => file.expiresAt && file.expiresAt < now);

    for (const file of expiredFiles) {
      if (file.fileName) {
        await this.deleteFile(file.fileName);
      }
    }
  }

  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
