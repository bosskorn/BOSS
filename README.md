# OneCut Studio

โปรแกรมตัดต่อ/รวม (merge & edit) ที่โฟกัส "เร็ว เรียบ ใช้ง่าย" สำหรับรวมคลิปหลายไฟล์ + มิกซ์เสียง + ใส่ซับ/โลโก้ แล้วส่งออกเป็นไฟล์เดียว

## Features

- ✅ Import: MP4, MOV, MKV, WebM, MP3, WAV, AAC, SRT, ASS
- ✅ Timeline: Video และ Audio tracks พร้อม drag & drop
- ✅ Audio tools: ปรับระดับเสียง, fade in/out, loudness normalize
- ✅ Overlay: โลโก้, ซับไตเติล (รองรับฟอนต์ไทย)
- ✅ Export presets: Fast Merge, YouTube 1080p, Social 720p, Archival
- ✅ Hardware acceleration: NVENC, AMF, QuickSync
- ✅ Project save/load: บันทึกโปรเจกต์เป็น `.onecut.json`

## Tech Stack

- **UI**: Electron + React + Tailwind CSS
- **Core Engine**: FFmpeg (via child process)
- **Job Queue**: Node.js EventEmitter-based queue
- **Project Format**: JSON schema with Zod validation

## Development

### Prerequisites

- Node.js 18+
- FFmpeg installed and available in PATH

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

This will start:
- Vite dev server for renderer (port 5173)
- TypeScript watch for main process

### Build

```bash
npm run build
```

### Run Built App

```bash
npm start
```

## Project Structure

```
/workspace/
├── app/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Main entry point
│   │   └── preload.ts  # Preload script
│   └── renderer/       # React UI
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── store/       # State management
│       │   └── App.tsx      # Main app component
│       └── index.html
├── core/               # Core business logic
│   ├── project/        # Project schema & I/O
│   ├── ffmpeg/         # FFmpeg wrapper
│   └── jobs/           # Job queue system
└── dist/               # Build output
```

## Export Presets

1. **Fast Merge (Copy Codec)**: รวมเร็วไม่แปลง - คัดลอก codec โดยตรง
2. **YouTube 1080p**: H.264, CRF 19, AAC 192k, yuv420p
3. **Social 720p**: H.264, CRF 21, 30fps, AAC 128k
4. **Archival (HEVC)**: HEVC (H.265) CRF 20, AAC 192k

## Project File Format

Projects are saved as `.onecut.json` with the following structure:

```json
{
  "version": "1.0.0",
  "name": "My Project",
  "media": [
    {
      "id": "m1",
      "path": "assets/video.mp4",
      "type": "video",
      "duration": 120.5,
      "width": 1920,
      "height": 1080,
      "fps": 30
    }
  ],
  "sequence": {
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "tracks": {
      "video": [
        {
          "clipId": "c1",
          "mediaId": "m1",
          "in": 0,
          "out": 12.5,
          "start": 0,
          "transform": {
            "x": 0,
            "y": 0,
            "scale": 1,
            "opacity": 1
          }
        }
      ],
      "audio": []
    },
    "subtitles": []
  }
}
```

## Roadmap

- [ ] Templates (intro/outro)
- [ ] Transitions (cross-dissolve, dip-to-black)
- [ ] Color filters & LUT
- [ ] Keyframe animation
- [ ] Proxy/Smart render for 4K/60fps
- [ ] Multitrack audio send/return
- [ ] Auto ducking

## License

MIT

## Credits

- FFmpeg: LGPL/GPL licensed - binary must be distributed separately
- Uses Radix UI components
- Built with Electron, React, and Tailwind CSS
