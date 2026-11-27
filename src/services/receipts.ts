import { Directory, File, Paths } from 'expo-file-system';

import { newId } from '../data/types';

function receiptsDir(): Directory {
  const dir = new Directory(Paths.document, 'receipts');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

/** Copies a picked photo into the app's own document folder so it survives cache cleanup. */
export async function saveReceipt(sourceUri: string): Promise<string> {
  const ext = /\.(jpe?g|png|webp|heic)$/i.exec(sourceUri)?.[1]?.toLowerCase() ?? 'jpg';
  const dest = new File(receiptsDir(), `${newId()}.${ext}`);
  await new File(sourceUri).copy(dest);
  return dest.uri;
}

/** Deletes a receipt previously saved by saveReceipt. Never touches files outside the app folder. */
export function deleteReceipt(uri: string | null): void {
  if (!uri || !uri.startsWith(new Directory(Paths.document, 'receipts').uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The file is already gone: nothing to do.
  }
}
