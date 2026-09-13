/**
 * Google Cloud Vision API Client
 * 
 * Performs OCR text extraction via plain HTTP REST call to Google Cloud Vision API.
 * Uses DOCUMENT_TEXT_DETECTION for high-precision micro-print, multi-lingual, and curved package OCR.
 */

export interface VisionOcrResult {
  text: string;
  confidence: number;
  lines: string[];
  raw?: any;
}

export async function extractTextWithGoogleVision(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<VisionOcrResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GOOGLE_VISION_API_KEY') {
    console.warn('[Vision API] Warning: GOOGLE_VISION_API_KEY is not configured.');
    return {
      text: '',
      confidence: 0,
      lines: [],
    };
  }

  const base64Image = imageBuffer.toString('base64');
  const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey.trim())}`;

  const requestBody = {
    requests: [
      {
        image: {
          content: base64Image,
        },
        features: [
          {
            type: 'DOCUMENT_TEXT_DETECTION',
            maxResults: 1,
          },
        ],
        imageContext: {
          languageHints: ['en', 'hi'],
        },
      },
    ],
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`[Vision API] HTTP ${response.status} Error (fallback to multimodal inspection):`, errorText);
    return { text: '', confidence: 0, lines: [] };
  }

  const data = await response.json();
  const annotation = data.responses?.[0];

  if (!annotation) {
    return { text: '', confidence: 0, lines: [] };
  }

  if (annotation.error) {
    console.warn('[Vision API] Annotation Error (fallback to multimodal inspection):', annotation.error);
    return { text: '', confidence: 0, lines: [] };
  }

  // Extract full document text or fallback to textAnnotations[0].description
  const fullText = annotation.fullTextAnnotation?.text || annotation.textAnnotations?.[0]?.description || '';
  const lines = fullText
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  // Compute average confidence from pages/blocks if available
  let totalConfidence = 0;
  let blockCount = 0;

  if (annotation.fullTextAnnotation?.pages) {
    for (const page of annotation.fullTextAnnotation.pages) {
      if (page.confidence !== undefined) {
        totalConfidence += page.confidence;
        blockCount++;
      } else if (page.blocks) {
        for (const block of page.blocks) {
          if (block.confidence !== undefined) {
            totalConfidence += block.confidence;
            blockCount++;
          }
        }
      }
    }
  }

  const avgConfidence = blockCount > 0 ? Math.round((totalConfidence / blockCount) * 100) / 100 : 0.92;

  return {
    text: fullText,
    confidence: avgConfidence,
    lines,
    raw: annotation,
  };
}
