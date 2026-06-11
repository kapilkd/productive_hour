import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { Frame, ProcessingStatus } from '../../types';
import { AddFrameForm, FrameRow } from '../../components/admin/FrameEditor';
import FrameRenderer from '../../components/student/FrameRenderer';

export default function ChapterDetailPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const chapterTitle = (location.state as any)?.chapterTitle ?? 'Chapter';

  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // PDF upload state
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [processingError, setProcessingError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFrames = useCallback(async () => {
    const r = await apiClient.get(`/admin/chapters/${chapterId}/frames`);
    setFrames(r.data);
  }, [chapterId]);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/admin/chapters/${chapterId}/frames`),
      apiClient.get(`/admin/chapters/${chapterId}/processing-status`),
    ]).then(([framesRes, statusRes]) => {
      setFrames(framesRes.data);
      setProcessingStatus(statusRes.data.processingStatus);
      setProcessingError(statusRes.data.processingError ?? '');
      if (statusRes.data.processingStatus === 'processing') startPolling();
    }).finally(() => setLoading(false));
  }, [chapterId]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const r = await apiClient.get(`/admin/chapters/${chapterId}/processing-status`);
      const status: ProcessingStatus = r.data.processingStatus;
      setProcessingStatus(status);
      if (status === 'done' || status === 'failed') {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setProcessingError(r.data.processingError ?? '');
        if (status === 'done') await fetchFrames();
      }
    }, 3000);
  }, [chapterId, fetchFrames]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const uploadPDF = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setProcessingError('Only PDF files are allowed');
      return;
    }
    setUploading(true);
    setProcessingError('');
    setPreviewIndex(null);
    const form = new FormData();
    form.append('pdf', file);
    try {
      await apiClient.post(`/admin/chapters/${chapterId}/upload-pdf`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProcessingStatus('processing');
      startPolling();
    } catch (err: any) {
      setProcessingError(err.response?.data?.error ?? 'Upload failed');
      setProcessingStatus('failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadPDF(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPDF(file);
    e.target.value = '';
  };

  const isProcessing = processingStatus === 'processing' || uploading;

  return (
    <div className="p-8 neu-page min-h-screen">
      <button onClick={() => navigate(-1)} className="neu-btn neu-btn-raised neu-btn-sm mb-6">
        ← Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--neu-text)' }}>{chapterTitle}</h1>
          <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
            {frames.length} frame{frames.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowAddForm(f => !f)} className="neu-btn neu-btn-raised">
          {showAddForm ? 'Cancel' : '+ Manual Frame'}
        </button>
      </div>

      {/* ── PDF Upload Zone ──────────────────────────────────────────────── */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        className={`mb-6 neu-dropzone ${dragOver ? 'neu-dropzone-active' : ''}`}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        style={{ cursor: isProcessing ? 'default' : 'pointer' }}
      >
        {isProcessing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--neu-accent)', borderTopColor: 'transparent', borderRadius: '50%' }}
                 className="animate-spin" />
            <p style={{ fontWeight: 600, color: 'var(--neu-accent)' }}>
              {uploading ? 'Uploading PDF…' : 'Claude is analyzing your PDF and building frames…'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--neu-text-muted)' }}>
              This takes 20–40 seconds. Stay on this page.
            </p>
          </div>
        ) : processingStatus === 'done' && frames.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>✅</span>
            <p style={{ fontWeight: 600, color: 'var(--neu-success)' }}>{frames.length} frames generated from PDF</p>
            <button
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="neu-btn neu-btn-raised neu-btn-sm"
            >
              Re-upload a different PDF
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div className="neu-raised" style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              📄
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 600, color: 'var(--neu-text)', marginBottom: '4px' }}>
                Drag & drop your PDF here
              </p>
              <p style={{ fontSize: '13px', color: 'var(--neu-text-muted)' }}>
                Claude Vision will extract content and generate visual frames automatically
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="neu-btn neu-btn-accent"
            >
              Browse Files
            </button>
            {processingError && (
              <p style={{ fontSize: '13px', color: 'var(--neu-danger)' }}>{processingError}</p>
            )}
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileInput} />
      </div>

      {/* ── Manual frame form ────────────────────────────────────────────── */}
      {showAddForm && (
        <div className="mb-4">
          <AddFrameForm
            chapterId={chapterId!}
            nextIndex={frames.length}
            onAdded={frame => { setFrames(prev => [...prev, frame]); setShowAddForm(false); }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* ── Frame list + preview ─────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neu-text-muted)' }}>
          <div style={{ width: '18px', height: '18px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          Loading…
        </div>
      ) : frames.length === 0 ? (
        <p style={{ color: 'var(--neu-text-muted)' }}>No frames yet. Upload a PDF or add frames manually.</p>
      ) : (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left: frame list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {frames.map((frame, idx) => (
              <div
                key={frame.id}
                onClick={() => setPreviewIndex(idx)}
                style={{
                  cursor: 'pointer',
                  outline: previewIndex === idx ? '2px solid var(--neu-accent)' : 'none',
                  borderRadius: '16px',
                }}
              >
                <FrameRow
                  frame={frame}
                  index={idx}
                  onUpdated={updated => setFrames(prev => prev.map(f => f.id === updated.id ? updated : f))}
                  onDeleted={id => {
                    setFrames(prev => prev.filter(f => f.id !== id));
                    if (previewIndex === idx) setPreviewIndex(null);
                  }}
                />
              </div>
            ))}
          </div>

          {/* Right: visual preview panel */}
          {previewIndex !== null && frames[previewIndex] && (
            <div style={{ width: '380px', flexShrink: 0, position: 'sticky', top: '32px' }}>
              <div className="neu-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--neu-text-muted)', fontWeight: 600 }}>
                    Visual Preview
                  </p>
                  <button onClick={() => setPreviewIndex(null)} className="neu-btn-icon neu-btn" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                    ✕
                  </button>
                </div>
                <div style={{ height: '280px' }}>
                  <FrameRenderer
                    frame={frames[previewIndex]}
                    frameNumber={previewIndex + 1}
                    total={frames.length}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => setPreviewIndex(i => Math.max(0, (i ?? 0) - 1))}
                    disabled={previewIndex === 0}
                    className="neu-btn neu-btn-raised neu-btn-sm"
                    style={{ flex: 1 }}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPreviewIndex(i => Math.min(frames.length - 1, (i ?? 0) + 1))}
                    disabled={previewIndex === frames.length - 1}
                    className="neu-btn neu-btn-raised neu-btn-sm"
                    style={{ flex: 1 }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
