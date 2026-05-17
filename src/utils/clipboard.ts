/**
 * Copies text to the user's clipboard, preferring the validated Electron IPC
 * bridge (`window.designme.copyText`) when running inside the desktop shell.
 * Falls back to a hidden `<textarea>` + `document.execCommand('copy')` in
 * web/dev contexts, which still works under the strict app CSP.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (window.designme?.copyText) {
      await window.designme.copyText(text);
      return true;
    }

    const scratch = document.createElement('textarea');
    scratch.value = text;
    scratch.setAttribute('readonly', 'true');
    scratch.style.position = 'fixed';
    scratch.style.left = '-9999px';
    document.body.appendChild(scratch);
    scratch.select();
    const ok = document.execCommand('copy');
    scratch.remove();
    return ok;
  } catch {
    return false;
  }
}
