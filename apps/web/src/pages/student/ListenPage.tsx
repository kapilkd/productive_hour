import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Howl } from 'howler';
import { apiClient } from '../../services/api.service';
import type { Frame } from '../../types';
import FrameRenderer from '../../components/student/FrameRenderer';

interface ChapterDetail {
  id: string;
  title: string;
  frames: Frame[];
  myProgress: { status: string; lastFrameIndex: number } | null;
}

export default function ListenPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectId, subjectName } = (location.state as any) ?? {};

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [marking, setMarking] = useState(false);
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    apiClient.get(`/student/chapters/${chapterId}`)
      .then(r => {
        const data: ChapterDetail = r.data;
        setChapter(data);
        const resumeIndex = data.myProgress?.lastFrameIndex ?? 0;
        setCurrentIndex(Math.min(resumeIndex, Math.max(0, data.frames.length - 1)));
      })
      .finally(() => setLoading(false));
  }, [chapterId]);

  // Stop + destroy current sound when frame changes
  useEffect(() => {
    return () => {
      soundRef.current?.unload();
      soundRef.current = null;
      setIsPlaying(false);
    };
  }, [currentIndex]);

  const playAudio = useCallback((frame: Frame) => {
    if (!frame.audioUrl) return;
    soundRef.current?.unload();
    const sound = new Howl({
      src: [frame.audioUrl],
      html5: true,
      rate: playbackRate,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
      onend: () => {
        setIsPlaying(false);
        markListened(frame.id);
      },
      onloaderror: () => setIsPlaying(false),
    });
    soundRef.current = sound;
    sound.play();
  }, [playbackRate]);

  const markListened = useCallback(async (frameId: string) => {
    if (marking) return;
    setMarking(true);
    try { await apiClient.post('/student/progress/frame', { frameId }); }
    finally { setMarking(false); }
  }, [marking]);

  const togglePlay = () => {
    const frame = chapter?.frames[currentIndex];
    if (!frame) return;
    if (soundRef.current?.playing()) {
      soundRef.current.pause();
    } else if (soundRef.current) {
      soundRef.current.play();
    } else {
      playAudio(frame);
    }
  };

  const goNext = async () => {
    if (!chapter) return;
    soundRef.current?.stop();
    const frame = chapter.frames[currentIndex];
    if (frame) await markListened(frame.id);
    if (currentIndex < chapter.frames.length - 1) setCurrentIndex(i => i + 1);
  };

  const goPrev = () => {
    soundRef.current?.stop();
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5];
    const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(next);
    if (soundRef.current) soundRef.current.rate(next);
  };

  if (loading) {
    return (
      <div className="neu-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid var(--neu-accent)', borderTopColor: 'transparent', borderRadius: '50%' }}
             className="animate-spin" />
        <span style={{ color: 'var(--neu-text-muted)' }}>Loading chapter…</span>
      </div>
    );
  }

  if (!chapter || chapter.frames.length === 0) {
    return (
      <div className="neu-page p-8" style={{ minHeight: '100vh' }}>
        <div className="neu-card" style={{ maxWidth: '360px' }}>
          <p style={{ color: 'var(--neu-text-muted)', marginBottom: '16px' }}>No frames in this chapter yet.</p>
          <button onClick={() => navigate(-1)} className="neu-btn neu-btn-raised neu-btn-sm">← Back</button>
        </div>
      </div>
    );
  }

  const frame = chapter.frames[currentIndex];
  const total = chapter.frames.length;
  const isLast = currentIndex === total - 1;
  const progressPct = ((currentIndex + 1) / total) * 100;

  return (
    <div className="neu-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px var(--neu-shadow-dark)', flexShrink: 0 }}>
        <button
          onClick={() => { soundRef.current?.unload(); navigate(`/student/subjects/${subjectId}`, { state: { subjectName } }); }}
          className="neu-btn-icon neu-btn"
          style={{ fontSize: '16px' }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '11px', color: 'var(--neu-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {subjectName}
          </p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neu-text)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {chapter.title}
          </p>
        </div>
        <button onClick={cycleSpeed} className="neu-btn neu-btn-raised neu-btn-sm"
          style={{ fontFamily: 'monospace', minWidth: '48px' }}>
          {playbackRate}×
        </button>
      </div>

      {/* Progress bar */}
      <div className="neu-progress-track" style={{ margin: '0', borderRadius: 0, height: '6px', flexShrink: 0 }}>
        <div className="neu-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Visual frame */}
      <div style={{ flex: 1, padding: '20px 24px 8px', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <FrameRenderer frame={frame} frameNumber={currentIndex + 1} total={total} />
      </div>

      {/* Frame dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '10px', flexShrink: 0 }}>
        {chapter.frames.map((_, i) => (
          <div key={i} style={{
            borderRadius: '99px',
            transition: 'all 0.3s ease',
            width: i === currentIndex ? '16px' : '8px',
            height: '8px',
            background: i === currentIndex ? 'var(--neu-accent)'
              : i < currentIndex ? 'rgba(129,140,248,0.4)'
              : 'var(--neu-shadow-lite)',
          }} />
        ))}
      </div>

      {/* Controls */}
      <div style={{ padding: '12px 24px 20px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, boxShadow: '0 -4px 12px var(--neu-shadow-dark)' }}>
        <button onClick={goPrev} disabled={currentIndex === 0}
          className="neu-btn neu-btn-raised"
          style={{ padding: '10px 16px', fontSize: '16px' }}>
          ←
        </button>

        <button onClick={togglePlay} disabled={!frame.audioUrl}
          className="neu-btn neu-btn-accent"
          style={{ flex: 1, padding: '12px', fontSize: '14px', gap: '8px' }}>
          {isPlaying ? <><span>⏸</span> Pause</> : <><span>▶</span> {frame.audioUrl ? 'Play' : 'Generating audio…'}</>}
        </button>

        {isLast ? (
          <button
            onClick={async () => { soundRef.current?.stop(); await markListened(frame.id); navigate(`/student/subjects/${subjectId}`, { state: { subjectName } }); }}
            className="neu-btn"
            style={{ background: '#166534', color: 'var(--neu-success)', padding: '10px 16px', borderRadius: 'var(--neu-radius-sm)', boxShadow: '5px 5px 12px rgba(74,222,128,0.2), -3px -3px 8px var(--neu-shadow-lite)' }}
          >
            ✓ Done
          </button>
        ) : (
          <button onClick={goNext} disabled={marking}
            className="neu-btn neu-btn-raised"
            style={{ padding: '10px 16px', fontSize: '16px' }}>
            →
          </button>
        )}
      </div>
    </div>
  );
}
