# OneCut Studio - Development Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- FFmpeg installed and in PATH (test with `ffmpeg -version`)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
This starts both the renderer (Vite) and main process (tsx watch).

### Build
```bash
npm run build
npm start
```

## Architecture Overview

### Core Modules (`core/`)
- **project/schema.ts**: Zod schemas for Project, MediaItem, Clips, etc.
- **project/io.ts**: Load/save project files, relink media paths
- **ffmpeg/index.ts**: FFmpeg wrapper with progress tracking, hardware detection
- **jobs/queue.ts**: Job queue system for export operations

### Electron Main (`app/main/`)
- **index.ts**: Main process - IPC handlers, window management
- **preload.ts**: Preload script exposing safe API to renderer

### React Renderer (`app/renderer/`)
- **App.tsx**: Main app component with layout
- **components/**: MediaBin, Timeline, Viewer, Inspector, ExportPanel
- **store/**: Zustand store for project state

## Key Features Implemented

✅ **Media Import**: Drag & drop or file dialog, supports MP4/MOV/MKV/WebM/MP3/WAV/AAC/SRT/ASS
✅ **Project Management**: Save/load `.onecut.json` with relative paths
✅ **Timeline**: Video and Audio tracks with zoom, scroll, clip visualization
✅ **Export System**: Presets (Fast Merge, YouTube, Social, Archival) with hardware acceleration
✅ **Job Queue**: Background export with progress tracking
✅ **IPC Communication**: Secure context isolation between main and renderer

## FFmpeg Integration

The app uses FFmpeg via child processes:
- Hardware acceleration detection (NVENC/AMF/QuickSync)
- Progress parsing from stderr
- Filter complex for audio/video processing
- Subtitle rendering with Thai font support

## Project File Format

Projects are saved as `.onecut.json`:
- Media references (with relative paths)
- Sequence configuration (fps, resolution)
- Video/Audio tracks with clips
- Subtitle configurations

## Next Steps (Roadmap)

- [ ] Drag & drop clips to timeline
- [ ] Clip trimming/splitting UI
- [ ] Audio waveform visualization
- [ ] Logo overlay positioning UI
- [ ] Real-time preview playback
- [ ] Keyboard shortcuts (I/O marks, split, delete)
- [ ] Auto-save and recovery
- [ ] Proxy generation for 4K files

## Troubleshooting

### FFmpeg not found
Ensure FFmpeg is installed and in PATH:
```bash
ffmpeg -version
```

### Build errors
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Type errors
Run type check:
```bash
npm run check
```
