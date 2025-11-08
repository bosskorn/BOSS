# OneCut Studio - Quick Start Guide

## ⚡ Get Started in 3 Steps

### Step 1: Install FFmpeg (Required)

**macOS**:
```bash
brew install ffmpeg
```

**Windows** (PowerShell as Admin):
```powershell
choco install ffmpeg
```

**Linux**:
```bash
sudo apt install ffmpeg
```

Verify:
```bash
ffmpeg -version
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run the App

```bash
npm run dev
```

The OneCut Studio app will open automatically! 🎬

---

## 🎯 Your First Project (5 minutes)

### 1. Import Media
1. Click **Import** button in the left panel (Media Bin)
2. Select video files (MP4, MOV, etc.) or audio files (MP3, WAV)
3. Files will appear in the Media Bin

### 2. Create Your Timeline
1. **Drag** a video from Media Bin to the **Video track** (blue)
2. **Drag** audio/music to the **Audio track** (green)
3. Clips snap into place automatically

### 3. Edit Your Clips
1. **Click** on a clip to select it
2. Use the **Inspector panel** (right side) to adjust:
   - Start time and duration
   - Video opacity and scale
   - Audio volume (gain in dB)
   - Fade in/out

### 4. Preview
- Click **Play** button to preview
- The **Viewer** (center top) shows your output
- Red playhead shows current position

### 5. Export
1. Click **Export** button (top right)
2. Choose a preset:
   - **Fast Merge** - Quick merge without re-encoding
   - **YouTube 1080p** - High quality for uploads
   - **Mobile 720p** - Smaller file size
3. Select save location
4. Click **Start Export**
5. Watch progress bar

### 6. Save Your Project
1. **File → Save Project**
2. Choose location (saves as `.onecut.json`)
3. Can reopen later to continue editing

---

## 🎬 Common Tasks

### Adjust Audio Volume
1. Select audio clip
2. Open Inspector panel
3. Adjust **Gain** slider (-30dB to +12dB)
4. 0dB = no change, +6dB = double volume, -6dB = half volume

### Add Audio Fade
1. Select audio clip
2. In Inspector, set:
   - **Fade In**: Duration in seconds (e.g., 1.5)
   - **Fade Out**: Duration in seconds (e.g., 2.0)

### Trim a Clip
1. Select clip
2. Adjust **In Point** and **Out Point** in Inspector
3. Or drag clip edges on timeline (future feature)

### Change Video Opacity (for logos/overlays)
1. Select video clip
2. Adjust **Opacity** slider (0% = invisible, 100% = solid)

### Remove a Clip
1. Select clip
2. Click **Remove Clip** button at bottom of Inspector

---

## ⌨️ Keyboard Shortcuts (Coming Soon)

- `Space` - Play/Pause
- `I` - Mark In
- `O` - Mark Out
- `S` - Split clip
- `Delete` - Remove selected clip
- `Cmd/Ctrl + S` - Save project
- `Cmd/Ctrl + Z` - Undo

---

## 📁 Project Files

OneCut Studio saves projects as `.onecut.json` files:

- **Portable**: Uses relative paths to media files
- **Small**: Only saves edit decisions, not video data
- **Editable**: Plain JSON format

**Important**: Keep your project file and media files in the same folder structure!

---

## 🎨 Export Presets Explained

### Fast Merge (Copy)
- **What**: Joins clips without re-encoding
- **Speed**: ⚡⚡⚡ Very fast (seconds)
- **When**: Clips have same codec, resolution, frame rate
- **Quality**: Perfect (no quality loss)

### YouTube 1080p
- **What**: Re-encodes to H.264 at 1920x1080
- **Speed**: ⚡⚡ Moderate (depends on length)
- **When**: Final output for YouTube/Vimeo
- **Quality**: High (CRF 18)

### YouTube 1080p (NVENC)
- **What**: Same as above, but uses NVIDIA GPU
- **Speed**: ⚡⚡⚡ Fast (3-5x faster than CPU)
- **When**: You have NVIDIA graphics card
- **Quality**: High (similar to CPU)

### Mobile 720p
- **What**: Smaller file size at 1280x720
- **Speed**: ⚡⚡⚡ Fast
- **When**: Sharing on mobile or limited bandwidth
- **Quality**: Good (CRF 21)

---

## 🔧 Troubleshooting

### "FFmpeg not found"
FFmpeg is not installed or not in PATH.

**Fix**:
```bash
# Verify FFmpeg is installed
ffmpeg -version

# If not found, install it (see Step 1 above)
```

### "Failed to probe media"
File format not supported or file is corrupted.

**Fix**:
- Try converting file to MP4 first
- Check if file plays in VLC or other player
- Ensure file is not DRM-protected

### Export fails
Various reasons: disk space, permissions, invalid settings.

**Fix**:
1. Check available disk space
2. Try different export location
3. Try "Fast Merge" preset first
4. Check DevTools console for errors (Cmd/Ctrl+Option/Shift+I)

### App won't start
Likely missing dependencies or FFmpeg.

**Fix**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify FFmpeg
ffmpeg -version
```

---

## 💡 Tips & Tricks

### Faster Exports
- Use **Fast Merge** when possible (no re-encoding)
- Use **NVENC** preset if you have NVIDIA GPU
- Close other apps to free up CPU/RAM

### Better Quality
- Use **YouTube 1080p** preset
- Keep original files (don't delete after export)
- Avoid re-encoding multiple times

### Organize Your Projects
```
MyVideo/
  ├── footage/          # Original video files
  ├── audio/           # Music and sound effects
  ├── exports/         # Exported videos
  └── project.onecut.json
```

### Loudness Normalization
Audio clips automatically use **EBU R128 loudness normalization** on export for consistent volume levels.

---

## 🆘 Need Help?

1. **Check README.md** - Full documentation
2. **Check SETUP.md** - Development setup guide
3. **GitHub Issues** - Report bugs or request features
4. **FFmpeg Docs** - [ffmpeg.org/documentation.html](https://ffmpeg.org/documentation.html)

---

## 🚀 Next Steps

Once you're comfortable with basics:

1. Try **multiple video layers** for picture-in-picture
2. Experiment with **audio mixing** (background music + voiceover)
3. Learn **FFmpeg presets** for custom encoding
4. Explore **project files** to understand the structure

---

**Enjoy creating with OneCut Studio!** 🎥✨

Questions? Open an issue on GitHub!
