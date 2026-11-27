// Web preview only: keep the picked image URI as is.
export async function saveReceipt(sourceUri: string): Promise<string> {
  return sourceUri;
}

export function deleteReceipt(_uri: string | null): void {}
