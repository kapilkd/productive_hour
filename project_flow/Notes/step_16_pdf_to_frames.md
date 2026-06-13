# Step 16 — PDF-to-Visual Frames (AI Frame Generation)

**Phase:** 2 — Audio Engine (Frame redesign)
**Status:** Complete
**Date:** 2026-06-11

---

## What Was Done

| File | Change |
|------|--------|
| `api/src/prisma/schema.prisma` | Added `ProcessingStatus` enum, `LayoutType` enum; updated `Chapter` with PDF fields; updated `Frame` with layout + content block fields |
| `api/src/prisma/migrations/20260611080924_pdf_frames/` | Migration applied |
| `api/src/services/pdf.service.ts` | NEW — PDF upload to S3, Claude Vision PDF analysis, frame creation, TTS enqueue |
| `api/src/services/storage.service.ts` | Added generic `uploadFile(key, buffer, contentType)` |
| `api/src/routes/admin/courses.ts` | Added `POST /admin/chapters/:id/upload-pdf` and `GET /admin/chapters/:id/processing-status`; added `multer` middleware |
| `shared/types/index.ts` | Added `ProcessingStatus`, `LayoutType`, `ContentBlocks`; updated `Chapter` and `Frame` interfaces |
| `apps/web/src/types/index.ts` | Same as shared |
| `apps/web/src/components/student/FrameRenderer.tsx` | NEW — renders 8 visual layout types |
| `apps/web/src/pages/admin/ChapterDetailPage.tsx` | Full rewrite — drag & drop PDF upload, processing spinner, frame preview panel |
| `apps/web/src/pages/student/ListenPage.tsx` | Updated — uses `FrameRenderer` + Howler.js play/pause + speed control |

---

## Complete Teaching Flow

```
ADMIN SIDE
──────────
1. Admin drags/drops PDF onto Chapter Detail page
2. POST /admin/chapters/:id/upload-pdf (multer, max 50MB)
   → 202 Accepted immediately (non-blocking)
   → Background: PDF uploaded to S3 (pdfs/chapters/{id}/filename.pdf)
   → processingStatus: idle → processing
3. Claude Vision API receives PDF as base64 document
   → Returns structured JSON array of frames
   → Each frame: { layoutType, title, narrationText, contentBlocks }
4. Old frames deleted (re-processing replaces them)
5. New frames created in DB → TTS job enqueued per frame
6. processingStatus → done
7. Admin's UI polls every 3s → sees frames appear
8. Admin clicks any frame row → visual preview panel opens on right
9. Admin edits title/text, reorders, deletes as needed

STUDENT SIDE
────────────
1. Student opens chapter → FrameRenderer shows visual slide
2. Taps Play → Howler.js streams audio from S3
3. Audio ends → student taps Next or it advances
4. Every N frames → LLM question overlay (existing logic, unchanged)
5. Student answers → IQ updates → continues
6. Chapter complete → progress saved
```

---

## 8 Frame Layout Templates

| Layout | Visual Design | When Claude Uses It |
|--------|---------------|---------------------|
| `title` | Full gradient background, large centered heading + subtitle | Chapter opening |
| `concept` | Numbered bullet points with indigo circles, optional highlight box | Main content, lists |
| `definition` | Term in colored badge, definition text, example chips | Technical vocabulary |
| `image_focus` | Image top 60%, caption + description below | PDF images/diagrams |
| `split` | Left: context card, Right: bullet points | Comparisons |
| `table_layout` | Styled table with alternating rows | Data, comparisons |
| `quote` | Large quote marks, centered pull quote | Important statements |
| `summary` | Green "Key Takeaways" header, checkmark list | Chapter end |

---

## Claude Prompt Design

- System prompt instructs Claude to return **strict JSON array only**
- Each frame: `{ layoutType, title, narrationText, contentBlocks }`
- `narrationText` = spoken TTS text (2–4 conversational sentences)
- `contentBlocks` = visual data (bullets, term, table rows, etc.)
- Rules: always start with `title`, always end with `summary`, one idea per frame
- Retry on JSON parse failure (strips code fences, retries with stricter prompt)

---

## New API Endpoints

```
POST /admin/chapters/:id/upload-pdf     multipart/form-data, field: "pdf"
                                        → 202 { message, chapterId }
                                        → Background processing begins

GET  /admin/chapters/:id/processing-status
                                        → { processingStatus, processingError, sourcePdfUrl, _count: { frames } }
```

## New DB Fields

### chapters
| Field | Type | Description |
|-------|------|-------------|
| `source_pdf_url` | TEXT? | S3 URL of uploaded PDF |
| `processing_status` | ENUM | idle / processing / done / failed |
| `processing_error` | TEXT? | Error message if failed |

### frames
| Field | Type | Description |
|-------|------|-------------|
| `frame_title` | TEXT? | Visual headline (different from narrationText) |
| `layout_type` | ENUM | One of 8 template types |
| `content_blocks` | JSONB | Structured visual data for the layout |
| `extracted_images` | JSONB | [{url, caption}] — images from PDF |

---

## Backward Compatibility

- Existing manually-created frames get `layoutType = concept` (default) and `frameTitle = null`
- `FrameRenderer` falls through to `contentText` if `contentBlocks` is empty
- Manual frame creation (AddFrameForm) still works alongside PDF upload
- `contentText` field kept as the canonical TTS narration text in all cases
