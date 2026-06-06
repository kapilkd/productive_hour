import { Queue, Worker, Job } from 'bullmq';
import { generateAudio } from '../services/tts.service';
import { uploadAudio } from '../services/storage.service';
import prisma from '../lib/prisma';

export interface TTSJobData {
  frameId: string;
  text: string;
  voiceId: string;
  retryCount: number;
}

const connection = { url: process.env.REDIS_URL! };

export const ttsQueue = new Queue<TTSJobData>('tts', { connection });

export const ttsWorker = new Worker<TTSJobData>(
  'tts',
  async (job: Job<TTSJobData>) => {
    const { frameId, text, voiceId } = job.data;

    await prisma.frame.update({
      where: { id: frameId },
      data: { audioStatus: 'generating' },
    });

    try {
      const buffer = await generateAudio(text, voiceId);
      const audioUrl = await uploadAudio(frameId, buffer);

      await prisma.frame.update({
        where: { id: frameId },
        data: { audioStatus: 'ready', audioUrl },
      });
    } catch (err) {
      await prisma.frame.update({
        where: { id: frameId },
        data: { audioStatus: 'failed' },
      });
      throw err;
    }
  },
  { connection }
);

export async function enqueueTTSJob(frameId: string, text: string): Promise<void> {
  await ttsQueue.add(
    'generate',
    {
      frameId,
      text,
      voiceId: process.env.ELEVENLABS_DEFAULT_VOICE_ID!,
      retryCount: 0,
    },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  );
}
