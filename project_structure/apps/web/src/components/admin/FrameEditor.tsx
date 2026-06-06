import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '../../services/api.service';
import { Frame } from '../../types';

interface Props {
  chapterId: string;
  frame?: Frame;
  onSave: (frame: Frame) => void;
}

interface FormValues {
  contentText: string;
  imageUrl: string;
  orderIndex: number;
}

export default function FrameEditor({ chapterId, frame, onSave }: Props) {
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: frame
      ? { contentText: frame.contentText, imageUrl: frame.imageUrl ?? '', orderIndex: frame.orderIndex }
      : { orderIndex: 0 },
  });
  const [ttsStatus, setTtsStatus] = useState(frame?.audioStatus ?? 'pending');
  const [previewUrl, setPreviewUrl] = useState(frame?.audioUrl);

  const onSubmit = async (data: FormValues) => {
    const res = frame
      ? await apiClient.put(`/admin/frames/${frame.id}`, data)
      : await apiClient.post('/admin/frames', { ...data, chapterId });
    onSave(res.data);
    pollTtsStatus(res.data.id);
  };

  const pollTtsStatus = (frameId: string) => {
    setTtsStatus('generating');
    const interval = setInterval(async () => {
      const { data } = await apiClient.get(`/admin/frames/${frameId}/tts-status`);
      setTtsStatus(data.audioStatus);
      if (data.audioStatus === 'ready') {
        setPreviewUrl(data.audioUrl);
        clearInterval(interval);
      } else if (data.audioStatus === 'failed') {
        clearInterval(interval);
      }
    }, 3000);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-700 text-gray-300',
    generating: 'bg-yellow-800 text-yellow-200',
    ready: 'bg-green-800 text-green-200',
    failed: 'bg-red-800 text-red-200',
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <textarea
        {...register('contentText', { required: true })}
        rows={5}
        placeholder="Frame narration text..."
        className="w-full bg-gray-800 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        {...register('imageUrl')}
        placeholder="Image URL (optional)"
        className="w-full bg-gray-800 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-lg font-semibold text-white transition-colors"
        >
          {frame ? 'Update Frame' : 'Add Frame'}
        </button>

        <span className={`text-xs px-2 py-1 rounded ${statusColors[ttsStatus] ?? statusColors.pending}`}>
          TTS: {ttsStatus}
        </span>

        {ttsStatus === 'ready' && previewUrl && (
          <audio controls src={previewUrl} className="h-8" />
        )}
      </div>
    </form>
  );
}
