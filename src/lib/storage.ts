export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

export class UploadError extends Error {}

export function assertUploadable(file: File) {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new UploadError(`${file.name} is larger than 25 MB`);
  }
}
