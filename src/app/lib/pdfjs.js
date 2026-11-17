import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { UserError } from './ui.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export async function openPdf(data) {
  try {
    return await pdfjsLib.getDocument({ data, isEvalSupported: false }).promise;
  } catch (err) {
    if (err?.name === 'PasswordException') throw new UserError('This PDF is password-protected. Remove the password first, then try again.');
    throw new UserError('This file could not be read as a PDF. It may be damaged.');
  }
}

export { pdfjsLib };
