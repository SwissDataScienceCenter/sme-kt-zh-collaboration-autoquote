export const downloadFile = (blob: Blob, fileName: string): void => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    // Revoked on the next tick: some browsers start the download asynchronously after the click.
    setTimeout(() => URL.revokeObjectURL(url));
};
