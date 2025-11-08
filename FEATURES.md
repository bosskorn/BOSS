# OneCut Studio - Complete Feature List

## 🎬 Core Editing Features

### Media Import
- ✅ **Multi-format Support**
  - Video: MP4, MOV, MKV, WebM, AVI
  - Audio: MP3, WAV, AAC, M4A
  - Image: JPG, PNG, GIF, WebP
  - Subtitle: SRT, ASS, VTT

- ✅ **Smart Import**
  - Automatic format detection
  - Metadata extraction (duration, resolution, codec, fps)
  - Batch import (multiple files at once)
  - Drag-and-drop from file explorer

- ✅ **Media Bin Management**
  - Thumbnail preview
  - File information display
  - Quick search/filter
  - Remove unused media

### Timeline Editing

- ✅ **Professional Timeline Interface**
  - Multi-track video (layers)
  - Multi-track audio (layers)
  - Visual waveform display (planned)
  - Timecode display (HH:MM:SS:FF)

- ✅ **Clip Operations**
  - Drag-and-drop from Media Bin
  - Snap to grid/playhead
  - In/Out point trimming
  - Split at playhead (planned)
  - Ripple delete (planned)
  - Copy/paste clips (planned)

- ✅ **Timeline Navigation**
  - Zoom in/out (25% to 300%)
  - Scroll horizontally
  - Playhead scrubbing
  - Jump to start/end
  - Frame-by-frame navigation (planned)

- ✅ **Playback Controls**
  - Play/Pause (Space)
  - Skip to start/end
  - Real-time preview
  - Frame-accurate positioning

### Video Editing

- ✅ **Transform & Effects**
  - Position (X, Y)
  - Scale (10% to 300%)
  - Rotation (planned)
  - Opacity (0% to 100%)

- ✅ **Multi-layer Compositing**
  - Unlimited video layers
  - Layer ordering
  - Blend modes (planned)
  - Picture-in-picture

- ✅ **Overlay Support**
  - Logo/watermark
  - Text overlays
  - Image overlays
  - Subtitle tracks

### Audio Editing

- ✅ **Audio Mixing**
  - Volume/Gain control (-30dB to +12dB)
  - Fade in (0 to 10 seconds)
  - Fade out (0 to 10 seconds)
  - Mute/Solo tracks (planned)
  - Pan left/right (planned)

- ✅ **Audio Processing**
  - **Loudness Normalization** (EBU R128)
    - Target: -16 LUFS
    - True Peak: -1.5 dBTP
    - Loudness Range: 11 LU
  - Crossfade between clips (planned)
  - Audio ducking (auto-lower music for voice) (planned)

- ✅ **Multi-track Audio**
  - Unlimited audio tracks
  - Background music + voiceover
  - Sound effects layers
  - Audio sync to video

### Subtitle Support

- ✅ **Subtitle Formats**
  - SRT (SubRip)
  - ASS (Advanced SubStation Alpha)
  - VTT (WebVTT)

- ✅ **Subtitle Customization**
  - Font selection (Thai fonts supported!)
  - Font size
  - Color and outline
  - Position (Y-axis)
  - Style presets

- ✅ **Thai Language Support**
  - Noto Sans Thai (bundled)
  - Proper text rendering
  - No character corruption

---

## 📤 Export & Rendering

### Export Presets

#### 1. Fast Merge (Copy)
**Perfect for**: Quick merging without quality loss

- **Video Codec**: Copy (no re-encoding)
- **Audio Codec**: Copy
- **Speed**: ⚡⚡⚡ Very Fast (seconds)
- **Quality**: Lossless
- **Use Case**: Merge clips with same codec/settings

#### 2. YouTube 1080p
**Perfect for**: High-quality YouTube/Vimeo uploads

- **Video Codec**: H.264 (libx264)
- **Video Quality**: CRF 18 (very high)
- **Preset**: Medium
- **Resolution**: 1920 × 1080
- **Audio Codec**: AAC
- **Audio Bitrate**: 192 kbps
- **Speed**: ⚡⚡ Moderate
- **Use Case**: Final output for web platforms

#### 3. YouTube 1080p (NVENC)
**Perfect for**: Fast encoding with NVIDIA GPU

- **Video Codec**: H.264 (NVENC hardware encoder)
- **Video Quality**: CQ 19
- **Target Bitrate**: 6 Mbps
- **Max Bitrate**: 8 Mbps
- **Resolution**: 1920 × 1080
- **Audio Codec**: AAC
- **Audio Bitrate**: 192 kbps
- **Speed**: ⚡⚡⚡ Fast (3-5x faster than CPU)
- **Requirement**: NVIDIA GPU
- **Use Case**: Fast turnaround with good quality

#### 4. Mobile 720p
**Perfect for**: Mobile viewing, smaller file sizes

- **Video Codec**: H.264 (libx264)
- **Video Quality**: CRF 21 (high)
- **Preset**: Medium
- **Resolution**: 1280 × 720
- **Frame Rate**: 30 fps
- **Audio Codec**: AAC
- **Audio Bitrate**: 128 kbps
- **Speed**: ⚡⚡⚡ Fast
- **Use Case**: Social media, WhatsApp, mobile devices

### Hardware Acceleration

- ✅ **Automatic Detection**
  - NVENC (NVIDIA GeForce/Quadro/Tesla)
  - QSV (Intel Quick Sync Video)
  - AMF (AMD Advanced Media Framework)

- ✅ **Fallback Support**
  - Automatically uses CPU if GPU unavailable
  - No configuration needed

### Export Features

- ✅ **Background Processing**
  - Non-blocking UI
  - Continue editing while exporting
  - Multiple exports queued

- ✅ **Progress Tracking**
  - Real-time percentage
  - Current time / Total time
  - Encoding speed (fps)
  - Estimated time remaining

- ✅ **Error Handling**
  - Automatic retry on I/O errors
  - Detailed error messages
  - Export log for debugging

- ✅ **Custom Settings** (Advanced)
  - Custom resolution
  - Custom bitrate
  - Custom frame rate
  - Custom codec parameters

---

## 💾 Project Management

### Project Files

- ✅ **File Format**: JSON (.onecut.json)
  - Human-readable
  - Version controlled
  - Easy to debug

- ✅ **Portability**
  - Relative paths to media
  - Share project folder = share everything
  - Works across different computers

- ✅ **Project Operations**
  - New project
  - Open existing
  - Save / Save As
  - Auto-save (every 2 minutes)
  - Recovery from auto-save

- ✅ **Project Settings**
  - Resolution (1920×1080, 1280×720, custom)
  - Frame rate (24, 25, 30, 60 fps)
  - Project name
  - Last modified timestamp

### File Organization

```
MyProject/
  ├── footage/              # Original videos
  ├── audio/               # Music and sound
  ├── graphics/            # Logos, images
  ├── exports/             # Rendered videos
  └── project.onecut.json  # Project file
```

---

## 🎨 User Interface

### Layout

- ✅ **Modern Dark Theme**
  - Easy on the eyes for long editing sessions
  - High contrast for clarity
  - Professional appearance

- ✅ **Responsive Panels**
  - Media Bin (left) - 256px
  - Viewer (center top) - 66% height
  - Timeline (center bottom) - 33% height
  - Inspector (right) - 320px

- ✅ **Menubar**
  - File operations (New, Open, Save, Export)
  - Edit operations (Undo/Redo) (planned)
  - View options (planned)
  - Help and About

- ✅ **Status Bar**
  - Ready state indicator
  - Project statistics
  - Media count
  - Clip count

### Viewer

- ✅ **Preview Canvas**
  - Real-time composition preview
  - Aspect ratio preservation
  - Fit-to-window scaling

- ✅ **Playback Info**
  - Current timecode
  - Resolution display
  - Frame rate display

### Inspector Panel

- ✅ **Context-Aware**
  - Shows properties of selected clip
  - "No clip selected" state
  - Clip type detection (video/audio)

- ✅ **Property Groups**
  - Timing (start, in, out, duration)
  - Transform (position, scale, opacity)
  - Audio (gain, fade in/out)
  - Actions (remove clip)

- ✅ **Input Types**
  - Number inputs with step controls
  - Sliders for ranges
  - Real-time preview of changes

---

## ⚡ Performance Features

### Optimization

- ✅ **Fast Operations**
  - Copy codec merge (instant)
  - Hardware acceleration (3-5x faster)
  - Efficient memory usage

- ✅ **Background Processing**
  - Job queue system
  - Non-blocking UI
  - Parallel operations (planned)

- ✅ **Smart Rendering**
  - Only render changed sections (planned)
  - Proxy workflow for 4K (planned)
  - Cache preview frames (planned)

### System Requirements

**Minimum**:
- CPU: Dual-core 2.0 GHz
- RAM: 8 GB
- Storage: 500 MB for app + project space
- OS: Windows 10, macOS 10.13, Ubuntu 18.04

**Recommended**:
- CPU: Quad-core 3.0 GHz or better
- RAM: 16 GB or more
- GPU: NVIDIA GeForce GTX 1050 or better
- Storage: SSD for project files
- OS: Latest version

---

## 🔧 Technical Features

### FFmpeg Integration

- ✅ **Media Probing**
  - Extract all metadata
  - Codec detection
  - Duration calculation
  - Resolution and frame rate

- ✅ **Video Filters**
  - Scale (resize)
  - Overlay (logos, subtitles)
  - Format conversion
  - Concatenation

- ✅ **Audio Filters**
  - Volume adjustment
  - Fade in/out
  - Loudness normalization
  - Audio mixing

### Electron Architecture

- ✅ **Security**
  - Context isolation
  - No Node integration in renderer
  - IPC whitelist
  - Path sanitization

- ✅ **Cross-Platform**
  - Windows 10/11
  - macOS (Intel & Apple Silicon)
  - Linux (Ubuntu, Debian, Fedora)

### Developer Experience

- ✅ **Modern Stack**
  - TypeScript for type safety
  - React for UI components
  - Zustand for state management
  - Vite for fast builds

- ✅ **Hot Reload**
  - UI changes update instantly
  - No need to restart app
  - Fast iteration

---

## 🗺️ Upcoming Features

### Short Term (V1.1)
- [ ] Transitions (dissolve, fade, wipe)
- [ ] Visual waveforms on audio clips
- [ ] Subtitle editor with preview
- [ ] Undo/Redo system
- [ ] Keyboard shortcuts (I/O/S/Del)

### Medium Term (V1.2)
- [ ] Color correction tools
- [ ] LUT (.cube) support
- [ ] Keyframe animation
- [ ] Templates (intro/outro)
- [ ] Batch export

### Long Term (V2.0)
- [ ] Effects plugins
- [ ] Green screen keying
- [ ] Motion tracking
- [ ] Proxy workflow for 4K
- [ ] Multi-user collaboration

---

## 📊 Comparison with Other Tools

| Feature | OneCut Studio | DaVinci Resolve | Adobe Premiere | Final Cut Pro |
|---------|--------------|-----------------|----------------|---------------|
| **Price** | Free | Free (Studio paid) | $22.99/mo | $299 |
| **Learning Curve** | Easy | Steep | Steep | Medium |
| **Fast Merge** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Hardware Accel** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Multi-platform** | ✅ Yes | ✅ Yes | ⚠️ Win/Mac | ❌ Mac only |
| **Thai Subtitles** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Open Source** | ✅ MIT | ❌ No | ❌ No | ❌ No |
| **Best For** | Quick merges | Color grading | Professional editing | Mac users |

---

## 💪 Strengths

1. **Speed**: Fast merge without re-encoding
2. **Simplicity**: Easy to learn, focused feature set
3. **Free**: No subscription, no watermarks
4. **Cross-platform**: Works on Windows, Mac, Linux
5. **Hardware Acceleration**: Uses GPU when available
6. **Thai Support**: Native Thai font support
7. **Open Source**: MIT licensed, extensible

---

## 🎯 Use Cases

### Content Creators
- Merge multiple clips quickly
- Add background music
- Insert logo watermark
- Export for YouTube

### Office/Corporate
- Combine meeting recordings
- Add subtitles to presentations
- Merge training videos
- Share with team

### Education
- Create lecture videos
- Add multiple audio tracks
- Subtitle for accessibility
- Export for LMS platforms

### Event Recording
- Merge multi-camera footage
- Add event logo
- Sync audio from mixer
- Export highlights

---

**OneCut Studio** - Fast, Simple, Powerful Video Editing for Everyone! 🎬✨
