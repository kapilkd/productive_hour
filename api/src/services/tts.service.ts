import { ElevenLabsClient } from 'elevenlabs';
import type { Readable } from 'stream';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });

async function streamToBuffer(readable: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function generateAudio(text: string, voiceId: string): Promise<Buffer> {
  const stream = await client.textToSpeech.convert(voiceId, {
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  });

  return streamToBuffer(stream as Readable);
}
