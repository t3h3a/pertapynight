
const ar = {
  scan: 'مسح رمز QR', photo: 'اختر صورة QR', preview: 'معاينة الخطوة التالية',
  demo: 'وضع المعاينة: لم يتم التحقق من التذكرة، والمواعيد تجريبية.',
  reading: 'جاري قراءة الرمز…', done: 'تمت قراءة الرمز. راجع الرقم ثم اضغط تحقق.',
  invalid: 'لم نجد رقم تذكرة صالحًا في الصورة. جرّب صورة أوضح أو أدخل الرقم يدويًا.',
  unavailable: 'تعذّر تشغيل قارئ QR. جرّب فتح الصفحة باتصال إنترنت أو أدخل الرقم يدويًا.',
};
const en = {
  scan: 'Scan QR code', photo: 'Choose QR image', preview: 'Preview next step',
  demo: 'Preview mode: no ticket was verified. Dates are illustrative.',
  reading: 'Reading QR code…', done: 'QR read. Review the reference, then select Verify.',
  invalid: 'No valid ticket reference was found. Try a clearer image or enter it manually.',
  unavailable: 'The QR reader could not start. Try with an internet connection or enter the reference manually.',
};
export const bookingCopy = language => language === 'ar' ? ar : en;
export const staticDemo = Boolean(document.querySelector('meta[name="petra-static-demo"]'));

export function sampleDates() {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + index + 1);
    const value = date.toISOString().slice(0, 10);
    return { id: 'demo-' + value, date: value, availability: 'sample', isSample: true, note: en.demo };
  });
}

let decoderPromise;
function loadDecoder() {
  if (!decoderPromise) {
    decoderPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.onload = () => typeof window.jsQR === 'function' ? resolve(window.jsQR) : reject();
      script.onerror = reject;
      document.head.append(script);
    }).catch(error => {
      decoderPromise = undefined;
      throw error;
    });
  }
  return decoderPromise;
}

async function decodeTicket(image) {
  if ('BarcodeDetector' in window) {
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const results = await detector.detect(image);
      if (results.length) return results[0].rawValue;
    } catch {
      // The JavaScript decoder also supports browsers without native QR detection.
    }
  }
  const decode = await loadDecoder();
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return decode(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data;
}

export async function scanTicket(event, copy, onReference, onStatus) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) {
    onStatus(copy.invalid);
    return;
  }
  onStatus(copy.reading);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const reference = (await decodeTicket(image))?.trim();
    if (!reference || !/^[\p{L}\p{N}._-]{4,80}$/u.test(reference)) {
      onStatus(copy.invalid);
      return;
    }
    onReference(reference);
    onStatus(copy.done);
  } catch {
    onStatus(copy.unavailable);
  } finally {
    URL.revokeObjectURL(url);
  }
}

