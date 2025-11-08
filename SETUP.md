# OneCut Studio - Development Setup Guide

## Quick Start (5 minutes)

### 1. Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **FFmpeg** installed and in PATH

### 2. Install FFmpeg

#### macOS
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows (PowerShell as Administrator)
```powershell
# Using Chocolatey
choco install ffmpeg

# Or using Scoop
scoop install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
ffprobe -version
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

This will start:
- Vite dev server (UI) at http://localhost:5173
- Electron app will launch automatically

## Project Structure Overview

```
onecut-studio/
├── app/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # App entry, window management, IPC
│   │   └── preload.ts          # Bridge between main and renderer
│   └── renderer/                # React UI
│       ├── App.tsx             # Main application component
│       ├── components/         # UI components
│       ├── store/              # Zustand state management
│       └── types/              # TypeScript definitions
├── core/                        # Core business logic
│   ├── ffmpeg/                 # FFmpeg wrapper and operations
│   ├── project/                # Project file management
│   ├── jobs/                   # Background job queue
│   └── types/                  # Shared type definitions
├── client/                      # Entry point and assets
│   ├── src/
│   │   ├── main.tsx            # React entry point
│   │   ├── index.css           # Global styles
│   │   └── components/ui/      # shadcn/ui components
│   └── index.html              # HTML template
└── package.json
```

## Development Workflow

### Making Changes

1. **UI Changes**: Edit files in `app/renderer/` - hot reload is automatic
2. **Core Logic**: Edit files in `core/` - requires restart
3. **Main Process**: Edit `app/main/main.ts` - auto-restarts with tsx watch

### Testing Your Changes

1. **Import a video**: Click Import in Media Bin
2. **Drag to timeline**: Drag video/audio to timeline tracks
3. **Edit properties**: Click clip and use Inspector panel
4. **Export**: Click Export button and choose preset

### Common Development Tasks

#### Add a new UI component

```bash
# Add shadcn/ui component
npx shadcn-ui@latest add [component-name]
```

#### Add a new export preset

Edit `/core/ffmpeg/ffmpeg.ts` and add to `PRESETS` object:

```typescript
myPreset: {
  name: 'My Custom Preset',
  codec: 'h264',
  audioCodec: 'aac',
  crf: 20,
  preset: 'fast',
  // ...
}
```

#### Modify FFmpeg commands

Edit the `buildExportArgs()` method in `/core/ffmpeg/ffmpeg.ts`

## Building for Production

### Build Application

```bash
npm run build
```

This creates:
- `dist/public/` - Optimized UI bundle
- `dist/main/` - Compiled main process

### Package for Distribution

```bash
npm run package
```

Creates installers in `release/` directory:
- **macOS**: `.dmg` and `.zip`
- **Windows**: `.exe` installer and portable
- **Linux**: `.AppImage` and `.deb`

## Architecture

### Data Flow

```
User Action (UI)
    ↓
React Component
    ↓
Zustand Store (State Update)
    ↓
IPC Call (window.electron.*)
    ↓
Main Process Handler
    ↓
Core Module (FFmpeg/Project/Jobs)
    ↓
File System / FFmpeg Binary
    ↓
Progress Events
    ↓
IPC Callback
    ↓
React State Update
    ↓
UI Re-render
```

### Key Technologies

1. **Electron**: Cross-platform desktop framework
   - Main process: Node.js environment
   - Renderer process: Chromium browser
   - IPC: Communication between processes

2. **React**: UI framework
   - Components: Modular UI elements
   - Hooks: State and lifecycle management
   - Context: Global state sharing

3. **Zustand**: State management
   - Simple API
   - No boilerplate
   - TypeScript support

4. **FFmpeg**: Media processing
   - External binary
   - Spawned as child process
   - Progress tracking via stdout parsing

5. **Vite**: Build tool
   - Fast dev server
   - Hot module replacement
   - Optimized production builds

## Debugging

### Enable Developer Tools

Already enabled in development mode. Access with:
- **macOS**: `Cmd + Option + I`
- **Windows/Linux**: `Ctrl + Shift + I`

### Debug Main Process

1. Add breakpoints in VS Code
2. Run with VS Code debugger:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Electron Main",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["${workspaceFolder}/dist/main/main.js"],
      "outputCapture": "std"
    }
  ]
}
```

### View FFmpeg Commands

Check console logs in DevTools to see actual FFmpeg commands being executed.

### Debug Export Issues

1. Open DevTools Console
2. Look for FFmpeg stderr output
3. Check job queue status
4. Verify file paths are correct

## Testing

### Manual Testing Checklist

- [ ] Import various media formats (MP4, MOV, MP3, WAV)
- [ ] Drag media to timeline
- [ ] Select and edit clip properties
- [ ] Adjust audio gain and fades
- [ ] Export with each preset
- [ ] Save and load project
- [ ] Verify auto-save works
- [ ] Test with large files (>1GB)
- [ ] Test with 4K video
- [ ] Test with multi-channel audio

### Performance Testing

1. Import 10+ clips
2. Add to timeline
3. Monitor memory usage
4. Export and check encoding speed

## Common Issues

### "FFmpeg not found"

**Solution**: Ensure FFmpeg is in PATH:
```bash
export PATH="/path/to/ffmpeg/bin:$PATH"  # macOS/Linux
set PATH=C:\path\to\ffmpeg\bin;%PATH%    # Windows
```

### "Module not found" errors

**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

**Solution**:
```bash
npm run check
```

### Hot reload not working

**Solution**: Restart dev server
```bash
# Ctrl+C to stop
npm run dev
```

### Electron window doesn't open

**Solution**: Check main process logs:
```bash
# Terminal will show errors from main process
```

## Contributing

### Code Style

- Use TypeScript for all new files
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

```
feat: Add new export preset
fix: Resolve timeline drag-drop issue
docs: Update README with new features
refactor: Simplify FFmpeg wrapper
```

### Pull Request Process

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Update documentation
5. Submit PR with description

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Vite Documentation](https://vitejs.dev)

## Support

For help:
1. Check README.md
2. Search existing issues
3. Create new issue with:
   - OS and version
   - Node.js version
   - FFmpeg version
   - Steps to reproduce
   - Error messages/logs

---

Happy coding! 🎬
