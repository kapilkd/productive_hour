import Anthropic from '@anthropic-ai/sdk';
import prisma from '../lib/prisma';
import { uploadFile } from './storage.service';
import { enqueueTTSJob } from '../jobs/tts.job';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExtractedFrame {
  layoutType: 'title' | 'concept' | 'definition' | 'image_focus' | 'split' | 'table_layout' | 'quote' | 'summary';
  title: string;
  narrationText: string;
  contentBlocks: Record<string, unknown>;
}

// ── Claude prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are an expert educational content designer. Analyze the provided PDF and convert it into a sequence of visual learning frames for a student listening platform.

Each frame represents ONE focused idea. The student will SEE the visual frame while HEARING the narrationText read aloud.

Return a JSON array of frame objects. Each frame must follow this exact shape:

{
  "layoutType": <one of: title | concept | definition | image_focus | split | table_layout | quote | summary>,
  "title": "<frame headline, max 8 words>",
  "narrationText": "<2-4 natural spoken sentences — what the narrator reads aloud. Conversational, no bullet syntax.>",
  "contentBlocks": <layout-specific object — see rules below>
}

Layout rules:
- title:        { "subtitle": "...", "backgroundHint": "tech|science|history|math|general" }
- concept:      { "bullets": ["...", "...", "..."], "highlight": "optional key sentence" }
- definition:   { "term": "...", "definition": "...", "examples": ["...", "..."] }
- image_focus:  { "caption": "...", "description": "..." }
- split:        { "leftContent": "...", "rightBullets": ["...", "..."] }
- table_layout: { "headers": ["...", "..."], "rows": [["...", "..."], ["...", "..."]] }
- quote:        { "quote": "...", "attribution": "optional source" }
- summary:      { "takeaways": ["...", "...", "..."], "callToAction": "optional next step" }

Sequencing rules:
1. Always start with a "title" frame for the chapter opening.
2. Always end with a "summary" frame listing key takeaways.
3. One idea per frame — split long topics into multiple concept frames.
4. Use "definition" for any technical terms introduced.
5. Use "table_layout" if the PDF contains any comparison or structured data.
6. narrationText must sound natural when spoken aloud — no lists, no symbols, no markdown.
7. Keep bullet text under 12 words each.

Respond with ONLY the JSON array. No markdown, no explanation, no code fences.
`.trim();

// ── Main export ───────────────────────────────────────────────────────────────

export async function processPDFForChapter(
  chapterId: string,
  pdfBuffer: Buffer,
  filename: string,
): Promise<void> {
  try {
    // 1. Upload raw PDF to S3
    const pdfKey = `pdfs/chapters/${chapterId}/${filename}`;
    const pdfUrl = await uploadFile(pdfKey, pdfBuffer, 'application/pdf');

    await prisma.chapter.update({
      where: { id: chapterId },
      data: { sourcePdfUrl: pdfUrl, processingStatus: 'processing', processingError: null },
    });

    // 2. Send PDF to Claude for frame extraction
    const frames = await extractFrames(pdfBuffer);

    // 3. Delete existing frames for this chapter (re-processing replaces them)
    await prisma.frame.deleteMany({ where: { chapterId } });

    // 4. Create frames + enqueue TTS per frame
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const frame = await prisma.frame.create({
        data: {
          chapterId,
          orderIndex: i,
          contentText: f.narrationText,
          frameTitle: f.title,
          layoutType: f.layoutType,
          contentBlocks: f.contentBlocks as object,
          audioStatus: 'pending',
        },
      });
      await enqueueTTSJob(frame.id, frame.contentText);
    }

    // 5. Mark done
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { processingStatus: 'done' },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { processingStatus: 'failed', processingError: msg },
    });
    throw err;
  }
}

// ── Claude extraction ─────────────────────────────────────────────────────────

async function extractFrames(pdfBuffer: Buffer): Promise<ExtractedFrame[]> {
  const base64PDF = pdfBuffer.toString('base64');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64PDF,
            },
          } as any,
          {
            type: 'text',
            text: 'Convert this educational PDF into learning frames. Return ONLY the JSON array.',
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  // Strip code fences if Claude wraps them despite instructions
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

  try {
    const frames: ExtractedFrame[] = JSON.parse(cleaned);
    return frames.filter(f => f.layoutType && f.title && f.narrationText);
  } catch {
    // Retry once with a stricter prompt
    return await extractFramesRetry(pdfBuffer);
  }
}

async function extractFramesRetry(pdfBuffer: Buffer): Promise<ExtractedFrame[]> {
  const base64PDF = pdfBuffer.toString('base64');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64PDF },
          } as any,
          {
            type: 'text',
            text: 'IMPORTANT: Return ONLY a valid JSON array starting with [ and ending with ]. No other text.',
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start === -1 || end === -1) return [];

  const frames: ExtractedFrame[] = JSON.parse(raw.slice(start, end + 1));
  return frames.filter(f => f.layoutType && f.title && f.narrationText);
}
