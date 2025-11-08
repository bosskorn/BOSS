# OneCut Studio - Project Summary

## 🎯 Project Overview

**OneCut Studio** is a desktop video editing application focused on **fast, simple merging and editing** of video clips. Built with Electron, React, and FFmpeg, it provides a professional timeline interface with audio mixing, overlay support, and hardware-accelerated export.

**Codename**: OneCut Studio  
**Version**: 1.0.0 (MVP)  
**Tech Stack**: Electron + React + TypeScript + FFmpeg  
**Target Users**: Content creators, video producers, office teams

---

## ✅ Implemented Features (MVP)

### Core Functionality
- ✅ Multi-format media import (MP4, MOV, MKV, WebM, MP3, WAV, AAC)
- ✅ Dual-track timeline (Video + Audio with multiple layers)
- ✅ Drag-and-drop editing interface
- ✅ Clip trimming (in/out points)
- ✅ Timeline zoom and navigation
- ✅ Playback controls with timecode display

### Audio Processing
- ✅ Volume control (gain in dB)
- ✅ Fade in/out
- ✅ Loudness normalization (EBU R128)
- ✅ Audio level monitoring

### Video Features
- ✅ Opacity control
- ✅ Scale/transform
- ✅ Multiple video layers support
- ✅ Preview viewer with live updates

### Export System
- ✅ Background job queue
- ✅ Progress tracking with ETA
- ✅ Multiple export presets:
  - Fast Merge (copy codec)
  - YouTube 1080p (H.264 + AAC)
  - YouTube 1080p NVENC (hardware acceleration)
  - Mobile 720p
- ✅ Hardware acceleration detection (NVENC/QSV/AMF)
- ✅ Custom resolution and bitrate support

### Project Management
- ✅ Save/Load project files (.onecut.json)
- ✅ Auto-save every 2 minutes
- ✅ Relative path support for portability
- ✅ Project validation and error handling

### UI/UX
- ✅ Modern dark theme
- ✅ Responsive layout (Media Bin, Viewer, Timeline, Inspector)
- ✅ Context-aware inspector panel
- ✅ Keyboard shortcuts foundation
- ✅ Status bar with project stats

---

## 📁 Project Structure

```
onecut-studio/
├── app/
│   ├── main/                      # Electron Main Process
│   │   ├── main.ts                # App lifecycle, window management
│   │   └── preload.ts             # IPC bridge (contextBridge)
│   └── renderer/                  # React UI (Renderer Process)
│       ├── App.tsx                # Main application component
│       ├── store/
│       │   └── projectStore.ts    # Zustand state management
│       ├── components/
│       │   ├── MediaBin/          # Import and media library
│       │   ├── Timeline/          # Timeline editor with tracks
│       │   ├── Viewer/            # Video preview canvas
│       │   ├── Inspector/         # Clip properties editor
│       │   └── Export/            # Export dialog and presets
│       └── types/
│           └── electron.d.ts      # Electron API types
│
├── core/                          # Business Logic (Shared)
│   ├── ffmpeg/
│   │   └── ffmpeg.ts              # FFmpeg wrapper (probe, export, merge)
│   ├── project/
│   │   └── projectManager.ts     # Save/load/validate projects
│   ├── jobs/
│   │   └── jobQueue.ts            # Background job management
│   └── types/
│       └── project.ts             # Shared type definitions
│
├── client/                        # Entry Point & Assets
│   ├── src/
│   │   ├── main.tsx               # React entry point
│   │   ├── index.css              # Global styles (Tailwind)
│   │   ├── components/ui/         # shadcn/ui components
│   │   └── lib/
│   │       └── utils.ts           # Helper functions
│   └── index.html                 # HTML template
│
├── docs/
│   ├── README.md                  # Main documentation
│   ├── QUICKSTART.md              # User quick start guide
│   ├── SETUP.md                   # Development setup
│   └── DEPLOYMENT.md              # Production deployment guide
│
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite build configuration
├── tailwind.config.ts             # Tailwind CSS config
└── electron-builder.json          # Electron packaging config
```

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Desktop Framework** | Electron 28 | Cross-platform desktop app |
| **UI Framework** | React 18 | Component-based UI |
| **State Management** | Zustand | Lightweight state store |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | shadcn/ui | Pre-built accessible components |
| **Build Tool** | Vite | Fast dev server and bundler |
| **Media Engine** | FFmpeg | Video/audio processing |
| **Language** | TypeScript | Type-safe development |

### Process Architecture

```
┌─────────────────────────────────────────────────┐
│  Electron Main Process (Node.js)                │
│  ┌───────────────────────────────────────────┐  │
│  │ Window Management                         │  │
│  │ IPC Handlers                              │  │
│  │ File System Access                        │  │
│  │ FFmpeg Child Processes                    │  │
│  │ Job Queue                                 │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↕ IPC
┌─────────────────────────────────────────────────┐
│  Electron Renderer Process (Chromium)           │
│  ┌───────────────────────────────────────────┐  │
│  │ React Components                          │  │
│  │ Zustand Store                             │  │
│  │ Canvas Preview                            │  │
│  │ Timeline Editor                           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
User Action (UI)
    ↓
React Component
    ↓
Zustand Store (update state)
    ↓
IPC Call (window.electron.*)
    ↓
Main Process Handler (ipcMain.handle)
    ↓
Core Module (FFmpeg/Project/Jobs)
    ↓
File System / FFmpeg Binary
    ↓
Progress/Result
    ↓
IPC Event (webContents.send)
    ↓
React Component (re-render)
```

---

## 🔧 Key Technical Decisions

### Why Electron?
- Cross-platform (Windows, macOS, Linux)
- Access to Node.js APIs (filesystem, child processes)
- Native FFmpeg integration
- Familiar web technologies

### Why React?
- Component-based architecture
- Large ecosystem
- Fast development
- Easy state management with Zustand

### Why FFmpeg?
- Industry-standard media processing
- Supports all major formats
- Hardware acceleration support
- Command-line interface (easy to integrate)

### Why Zustand over Redux?
- Simpler API (less boilerplate)
- Better TypeScript support
- Smaller bundle size
- Easier to learn

### Why Vite?
- Extremely fast dev server
- Hot Module Replacement (HMR)
- Optimized production builds
- Native ESM support

---

## 🎯 FFmpeg Integration

### Key Operations

1. **Media Probing**
   ```bash
   ffprobe -v quiet -print_format json -show_format -show_streams file.mp4
   ```

2. **Fast Merge (No Re-encoding)**
   ```bash
   ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
   ```

3. **Standard Export (H.264 + AAC)**
   ```bash
   ffmpeg -i video.mp4 -i audio.wav \
     -filter_complex "[1:a]volume=0.8,afade=t=in:d=1.5,loudnorm=I=-16[a]" \
     -map 0:v -map "[a]" \
     -c:v libx264 -crf 18 -preset medium \
     -c:a aac -b:a 192k \
     output.mp4
   ```

4. **Hardware Accelerated (NVENC)**
   ```bash
   ffmpeg -i input.mp4 \
     -c:v h264_nvenc -rc vbr -cq 19 -b:v 6M \
     -c:a aac -b:a 192k \
     output.mp4
   ```

### Progress Tracking

FFmpeg outputs progress to stdout with `-progress pipe:1`:
```
frame=150
fps=30.5
total_size=15728640
out_time_ms=5000000
speed=1.02x
```

Parsed to calculate percentage complete.

---

## 📊 Performance Considerations

### Optimization Strategies

1. **Fast Merge**: Use copy codec when possible (no encoding)
2. **Hardware Acceleration**: Detect and use NVENC/QSV/AMF
3. **Background Processing**: Job queue prevents UI blocking
4. **Canvas Rendering**: Use canvas for preview (vs video element)
5. **Auto-save Throttling**: Save every 2 minutes (not on every change)

### Memory Management

- Media files referenced by path (not loaded into memory)
- Project JSON is lightweight (< 1MB typically)
- FFmpeg processes are spawned/killed as needed
- React components unmount when not visible

---

## 🗺️ Roadmap

### V1.1 (Next Quarter)
- [ ] Transitions (cross-dissolve, dip-to-black, wipe)
- [ ] Templates for intros/outros
- [ ] Subtitle editor (visual timeline)
- [ ] Waveform visualization on audio clips

### V1.2
- [ ] Color correction (3-way color, curves)
- [ ] LUT support (.cube files)
- [ ] Keyframe animation (opacity, volume, position)
- [ ] Multi-camera sync

### V1.3
- [ ] Proxy workflow (4K → 720p for editing)
- [ ] Smart render (only re-encode changed sections)
- [ ] Audio ducking (auto-lower music when voice present)
- [ ] Batch export

### V2.0 (Future)
- [ ] Effects plugins system
- [ ] Green screen keying
- [ ] Motion tracking
- [ ] Multi-user collaboration

---

## 🧪 Testing Strategy

### Manual Testing
- Import various formats (MP4, MOV, MKV, MP3, WAV)
- Timeline editing (drag, trim, reorder)
- Audio mixing (gain, fades)
- Export with all presets
- Project save/load
- Hardware acceleration detection

### Performance Testing
- Large files (4K, 60fps)
- Many clips (50+ on timeline)
- Long duration (2+ hours)
- Memory usage over time
- Export speed benchmarks

### Cross-Platform Testing
- macOS (Intel and Apple Silicon)
- Windows 10/11
- Ubuntu Linux

---

## 📦 Deployment

### Build Process
1. `npm run build` - Build renderer and main
2. `npm run package` - Create installers
3. Code signing (macOS/Windows)
4. Notarization (macOS)

### Distribution
- GitHub Releases (primary)
- Direct download from website
- Auto-update via electron-updater

### System Requirements
- **OS**: macOS 10.13+, Windows 10+, Ubuntu 18.04+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 500MB for app, varies for projects
- **GPU**: Optional (NVIDIA for hardware acceleration)
- **Dependencies**: FFmpeg (bundled or system-installed)

---

## 🔒 Security

### Measures
- Context isolation enabled
- Node integration disabled in renderer
- IPC whitelist (only specific operations allowed)
- Path sanitization (prevent directory traversal)
- No eval() or remote code execution

### FFmpeg Safety
- Spawn process with limited permissions
- Validate all input paths
- Timeout for long operations
- Kill process on cancel

---

## 📚 Documentation

- **README.md** - Overview and features
- **QUICKSTART.md** - User guide (5-minute start)
- **SETUP.md** - Developer setup
- **DEPLOYMENT.md** - Production deployment
- **PROJECT_SUMMARY.md** - This file (architecture overview)

---

## 🎓 Learning Resources

- [Electron Docs](https://www.electronjs.org/docs)
- [React Docs](https://react.dev)
- [FFmpeg Docs](https://ffmpeg.org/documentation.html)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🤝 Contributing

Contributions welcome! See GitHub issues for:
- Bug reports
- Feature requests
- Code improvements
- Documentation updates

---

## 📜 License

**MIT License** - Free for commercial and personal use

**FFmpeg**: LGPL/GPL - bundled with attribution

---

## 🎉 Acknowledgments

- **FFmpeg team** - Incredible media processing library
- **Electron team** - Making desktop apps easy
- **React team** - Powerful UI framework
- **shadcn** - Beautiful UI components
- **Open source community** - All the dependencies

---

**Built with ❤️ for video creators who value speed and simplicity**

Last Updated: 2025-11-08
