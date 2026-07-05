export interface StoredFile {
  fileName: string;
  originalName: string;
  filePath: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface IStorageProvider {
  save(
    file: Express.Multer.File,
    entityType: string
  ): Promise<StoredFile>;

  delete(filePath: string): Promise<void>;

  getUrl(filePath: string): string;
  resolveRoot(): string;
}
