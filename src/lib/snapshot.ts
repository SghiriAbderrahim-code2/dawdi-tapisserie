// تصدير لقطة PNG بحجم 800×540 من عنصر <svg> — أقل من 300KB

const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 540;
const MAX_BYTES = 300 * 1024;

function blobSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.floor((base64.length * 3) / 4);
}

function serialize(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  clone.setAttribute("width", String(svg.viewBox?.baseVal.width || 400));
  clone.setAttribute("height", String(svg.viewBox?.baseVal.height || 300));
  return new XMLSerializer().serializeToString(clone);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("تعذّر تحميل صورة الـ SVG"));
    image.src = src;
  });
}

/** يحوي الصور البعيدة داخل الـ SVG إلى data URI حتى لا يفسد الـ canvas */
async function inlineRemoteImages(svg: SVGSVGElement): Promise<void> {
  const images = Array.from(svg.querySelectorAll("image"));
  await Promise.all(
    images.map(async (image) => {
      const href =
        image.getAttribute("href") ?? image.getAttributeNS("", "href");
      if (!href || href.startsWith("data:")) return;
      try {
        const response = await fetch(href, { mode: "cors" });
        if (!response.ok) return;
        const blob = await response.blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        image.setAttribute("href", dataUrl);
      } catch {
        // نترك الرابط كما هو — قد يفشل التصدير لاحقًا
      }
    }),
  );
}

function drawToCanvas(
  image: HTMLImageElement,
  scale: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(TARGET_WIDTH * scale);
  canvas.height = Math.round(TARGET_HEIGHT * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذّر الوصول إلى canvas");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ratio = Math.min(
    (canvas.width * 0.92) / image.width,
    (canvas.height * 0.92) / image.height,
  );
  const width = image.width * ratio;
  const height = image.height * ratio;
  ctx.drawImage(
    image,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height,
  );
  return canvas;
}

/**
 * يحوّل الـ SVG المعروض إلى PNG بمقاس 800×540، ويقلّص الحجم حتى يصبح < 300KB.
 * يرجع data URL أو null عند الفشل.
 */
export async function svgToPng(
  svg: SVGSVGElement | null,
): Promise<string | null> {
  if (!svg) return null;

  try {
    await inlineRemoteImages(svg);

    const source = serialize(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
      const image = await loadImage(url);

      for (const scale of [1, 0.8, 0.6, 0.45]) {
        const canvas = drawToCanvas(image, scale);
        const dataUrl = canvas.toDataURL("image/png");
        if (blobSize(dataUrl) <= MAX_BYTES) return dataUrl;
      }

      // آخر محاولة: أصغر مقياس متاح
      return drawToCanvas(image, 0.45).toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
}
