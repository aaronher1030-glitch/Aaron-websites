export interface Photo {
  id: string;
  name: string;
  mime: string;
  width?: number;
  height?: number;
  thumb: string;
  full: string;
}

const isHeic = (mime: string) => /heic|heif/i.test(mime);

export function imageThumb(id: string, mime: string, width = 800): string {
  return isHeic(mime)
    ? `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`
    : `https://lh3.googleusercontent.com/d/${id}=w${width}`;
}

export function imageFull(id: string, mime: string): string {
  return isHeic(mime)
    ? `https://drive.google.com/thumbnail?id=${id}&sz=w2000`
    : `https://lh3.googleusercontent.com/d/${id}=w2000`;
}

export function docThumb(id: string): string {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w600`;
}
