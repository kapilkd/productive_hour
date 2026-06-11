import { Queue, Worker, Job } from 'bullmq';
import prisma from '../lib/prisma';
import { generateAudio } from '../services/tts.service';
import { uploadAudio } from '../services/storage.service';

export interface TTSJobData {
  frameId: string;
  text: string;
  voiceId: string;
  retryCount: number;
}

function parseRedisUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || '6379', 10),
    password: u.password || undefined,
    maxRetriesPerRequest: null as null,
  };
}

const connection = parseRedisUrl(process.env.REDIS_URL!);

export const ttsQueue = new Queue<TTSJobData>('tts', { connection });

export const ttsWorker = new Worker<TTSJobData>(
  'tts',
  async (job: Job<TTSJobData>) => {
    const { frameId, text, voiceId } = job.data;
    console.log(`[TTS] Generating audio for frame ${frameId}: "${text.slice(0, 60)}…"`);

    try {
      await prisma.frame.update({
        where: { id: frameId },
        data: { audioStatus: 'generating' },
      });

      const buffer = await generateAudio(text, voiceId);
      const audioUrl = await uploadAudio(frameId, buffer);

      await prisma.frame.update({
        where: { id: frameId },
        data: { audioStatus: 'ready', audioUrl },
      });

      console.log(`[TTS] Frame ${frameId} ready — ${buffer.length} bytes → ${audioUrl}`);
    } catch (err) {
      console.error(`[TTS] Frame ${frameId} failed:`, (err as Error).message);
      await prisma.frame.update({
        where: { id: frameId },
        data: { audioStatus: 'failed' },
      }).catch(() => {});
      throw err; // re-throw so BullMQ retries
    }
  },
  { connection }
);

ttsWorker.on('failed', (job, err) => {
  console.error(`[TTS] Job ${job?.id} failed:`, err.message);
});

export async function enqueueTTSJob(frameId: string, text: string): Promise<void> {
  await ttsQueue.add(
    'generate' as any,
    {
      frameId,
      text,
      voiceId: process.env.ELEVENLABS_DEFAULT_VOICE_ID ?? 'default',
      retryCount: 0,
    },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  );
}
