import { Queue, Worker, Job } from 'bullmq';
import prisma from '../lib/prisma';

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
    const { frameId, text } = job.data;
    console.log(`[TTS Stub] Processing frame ${frameId}: "${text.slice(0, 60)}..."`);

    // TTS stub: replace with real ElevenLabs + S3 calls in Phase 2 Step 14
    await prisma.frame.update({
      where: { id: frameId },
      data: {
        audioStatus: 'ready',
        audioUrl: `https://placeholder-audio.example.com/frames/${frameId}.mp3`,
      },
    });

    console.log(`[TTS Stub] Frame ${frameId} marked ready`);
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
