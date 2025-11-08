# OneCut Studio

A fast and easy video editing and merging application built with Electron, React, and FFmpeg.

## 🎯 Features (MVP)

- **Import Media**: Support for MP4, MOV, MKV, WebM, MP3, WAV, AAC
- **Timeline Editing**: Drag-drop clips, trim, split, and arrange
- **Audio Mixing**: Volume control, crossfade, loudness normalization (EBU R128)
- **Overlay Support**: Add logos, text, and subtitles (SRT/ASS) with Thai font support
- **Export Presets**:
  - Fast Merge (copy codec) - no re-encoding
  - YouTube 1080p (H.264 + AAC)
  - YouTube 1080p NVENC (hardware acceleration)
  - Mobile 720p
- **Background Jobs**: Non-blocking export with progress tracking
- **Project Management**: Save/load projects as `.onecut.json` files

## 🚀 Tech Stack

- **UI**: Electron + React + Tailwind CSS + shadcn/ui
- **Core Engine**: FFmpeg (external binary)
- **State Management**: Zustand
- **Build Tools**: Vite + esbuild
- **Language**: TypeScript

## 📦 Installation

### Prerequisites

1. **Node.js** (v18 or higher)
2. **FFmpeg** (must be installed and available in PATH)

#### Installing FFmpeg

**macOS** (with Homebrew):
```bash
brew install ffmpeg
```

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows** (with Chocolatey):
```bash
choco install ffmpeg
```

Or download from [ffmpeg.org](https://ffmpeg.org/download.html)

### Setup

1. **Clone the repository** (if not already done)

2. **Install dependencies**:
```bash
npm install
```

3. **Verify FFmpeg installation**:
```bash
ffmpeg -version
ffprobe -version
```

## 🎬 Development

Run the development server:

```bash
npm run dev
```

This will:
- Start Vite dev server for the renderer process (UI)
- Watch and compile the Electron main process

The application will automatically reload when you make changes.

## 🏗️ Building

Build the application:

```bash
npm run build
```

This creates:
- `dist/public/` - Renderer (UI) build
- `dist/main/` - Main process build

## 📦 Packaging

Package the application for distribution:

```bash
npm run package
```

This will create platform-specific installers in the `dist/` directory.

## 🎨 Project Structure

```
onecut-studio/
├── app/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Main entry point
│   │   └── preload.ts     # Preload script for IPC
│   └── renderer/          # React UI
│       ├── App.tsx        # Main app component
│       ├── components/    # UI components
│       │   ├── MediaBin/  # Media library
│       │   ├── Timeline/  # Timeline editor
│       │   ├── Viewer/    # Video viewer
│       │   ├── Inspector/ # Clip properties
│       │   └── Export/    # Export panel
│       ├── store/         # State management
│       └── types/         # TypeScript types
├── core/
│   ├── ffmpeg/            # FFmpeg wrapper
│   ├── project/           # Project management
│   ├── jobs/              # Job queue
│   └── types/             # Shared types
├── client/
│   ├── src/
│   │   ├── main.tsx       # React entry point
│   │   └── index.css      # Global styles
│   └── index.html         # HTML template
└── package.json
```

## 🎯 Usage

### Creating a New Project

1. Launch OneCut Studio
2. The app will automatically create a new project
3. Set your project name and sequence settings

### Importing Media

1. Click the **Import** button in the Media Bin (left panel)
2. Select video, audio, or image files
3. Files will be analyzed and added to the Media Bin

### Editing Timeline

1. **Drag and drop** media from Media Bin to Timeline
2. **Select clips** by clicking on them
3. **Trim clips** by adjusting In/Out points in Inspector
4. **Adjust audio** using the gain slider in Inspector
5. **Add fades** by setting Fade In/Out duration

### Exporting

1. Click the **Export** button in the top toolbar
2. Choose an export preset:
   - **Fast Merge**: Quick merge without re-encoding
   - **YouTube 1080p**: High-quality H.264 encode
   - **YouTube 1080p NVENC**: Hardware-accelerated (if available)
   - **Mobile 720p**: Optimized for mobile devices
3. Select output location
4. Click **Start Export**
5. Monitor progress in the export dialog

### Saving Projects

- **File → Save Project**: Save current project
- **File → Save Project As...**: Save with new name
- Auto-save runs every 2 minutes
- Projects are saved as `.onecut.json` files with relative paths

## 🔧 FFmpeg Integration

OneCut Studio uses FFmpeg for all media operations:

- **Probing**: `ffprobe` analyzes media files
- **Merging**: Fast concat using `-c copy`
- **Encoding**: H.264/AAC with configurable quality
- **Hardware Acceleration**: NVENC support for NVIDIA GPUs
- **Audio Processing**: Volume, fades, loudness normalization

## 🎨 Export Presets

### Fast Merge (Copy)
- **Codec**: Copy (no re-encoding)
- **Speed**: Very fast
- **Use case**: Merging clips with same codec/resolution

### YouTube 1080p
- **Video**: H.264, CRF 18, Medium preset
- **Audio**: AAC 192k
- **Resolution**: 1920x1080
- **Use case**: High-quality uploads

### YouTube 1080p (NVENC)
- **Video**: H.264 NVENC, CQ 19, 6Mbps
- **Audio**: AAC 192k
- **Resolution**: 1920x1080
- **Hardware**: NVIDIA GPU required
- **Use case**: Fast encoding with GPU

### Mobile 720p
- **Video**: H.264, CRF 21, Medium preset
- **Audio**: AAC 128k
- **Resolution**: 1280x720, 30fps
- **Use case**: Mobile-optimized videos

## ⌨️ Keyboard Shortcuts (Planned)

- `Space` - Play/Pause
- `I` - Mark In point
- `O` - Mark Out point
- `S` - Split clip at playhead
- `Delete` - Ripple delete selected clip
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + S` - Save project
- `Cmd/Ctrl + =/-` - Zoom timeline

## 🗺️ Roadmap

### V1.1 - V1.3
- [ ] Templates (intro/outro)
- [ ] Transitions (cross-dissolve, dip-to-black)
- [ ] Color filters and LUTs
- [ ] Multitrack audio send/return
- [ ] Keyframe animation
- [ ] Proxy workflow for 4K footage
- [ ] Smart render (only re-encode changed portions)

## 🐛 Troubleshooting

### FFmpeg not found
Make sure FFmpeg is installed and available in your system PATH:
```bash
which ffmpeg  # macOS/Linux
where ffmpeg  # Windows
```

### Hardware acceleration not available
Check if your GPU supports hardware acceleration:
```bash
ffmpeg -encoders | grep nvenc  # NVIDIA
ffmpeg -encoders | grep qsv    # Intel QuickSync
ffmpeg -encoders | grep amf    # AMD
```

### Export fails
- Check disk space
- Ensure output path is writable
- Verify input files are not corrupted
- Check FFmpeg logs in developer console

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Credits

- **FFmpeg**: The core multimedia framework (LGPL/GPL)
- **Electron**: Cross-platform desktop application framework
- **React**: UI library
- **shadcn/ui**: UI component library
- **Tailwind CSS**: Utility-first CSS framework

## 📧 Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Built with ❤️ for creators who need fast, simple video editing**
