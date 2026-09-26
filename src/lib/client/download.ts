/**
 * Saves text as a file in the browser, generated entirely client-side.
 * @param fileName - suggested file name.
 * @param content - file contents.
 * @param mimeType - media type, for example "text/calendar".
 */
export function downloadText(fileName: string, content: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Turns a document title into a safe file-name stem.
 * @param title - any text.
 */
export function fileStem(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "clausewise"
  );
}
