import { ElevenLabsClient } from 'elevenlabs';
import { Readable } from 'stream';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

export async function generateAudio(text: string, voiceId?: string): Promise<Buffer> {
  const voice = voiceId ?? process.env.ELEVENLABS_DEFAULT_VOICE_ID!;

  const audioStream = await client.generate({
    voice,
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  });

  return streamToBuffer(audioStream as unknown as Readable);
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
