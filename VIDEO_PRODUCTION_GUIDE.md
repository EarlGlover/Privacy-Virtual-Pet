# Video Production Guide

## One-Minute Demonstration Video

This guide provides specifications and recommendations for producing the mandatory one-minute demonstration video for the Zama Bounty Program submission.

---

## Video Specifications

### Technical Requirements
- **Duration**: Exactly 1 minute (60 seconds)
- **Resolution**: 1080p (1920x1080) minimum, 4K preferred
- **Frame Rate**: 30fps or 60fps
- **Codec**: H.264 or H.265
- **Audio**: Clear narration with background music (optional)
- **Format**: MP4 or WebM
- **File Size**: Under 100MB recommended

### Narration Script
- **File**: `NARRATION`
- **Word Count**: 155 words (approximately 1 minute at natural pace)
- **Language**: English
- **Tone**: Professional, clear, engaging
- **Pace**: 2.5-2.7 words per second

---

## Video Content Sections (Recommended)

### Section 1: Introduction (0-10 seconds)
**Focus**: Project title and privacy concept

Display:
- Project title: "Privacy Virtual Pet"
- Tagline: "FHEVM Example Hub and Confidential Pet Application"
- Visual: Project logo or hero screenshot

Narration: "Meet Privacy Virtual Pet, a revolutionary FHEVM application demonstrating confidential computing on blockchain. Imagine caring for a virtual pet where every stat—health, happiness, energy—remains completely encrypted."

### Section 2: Application Demo (10-30 seconds)
**Focus**: User interface and gameplay

Show:
- MetaMask wallet connection process
- Pet creation transaction
- Pet care actions (feed, play, heal, rest)
- Real blockchain transactions on Sepolia
- Pet statistics and encryption indicators

Narration: "The application is simple to use. Connect your MetaMask wallet to Sepolia network. Create your virtual companion with just one click. Then, care for your encrypted pet using intuitive action buttons. Feed it to boost happiness. Play to increase enjoyment. Heal when health drops. Rest to recover. Watch real blockchain transactions confirm each action."

### Section 3: Automation Tools (30-45 seconds)
**Focus**: Example generation and automation

Show:
- CLI commands being executed
- Example repository generation
- Documentation auto-generation
- Test suite execution
- Project structure visualization

Narration: "But this is more than just a game. Privacy Virtual Pet is a complete FHEVM Example Hub with production-grade automation tools. Our CLI scaffolds generate standalone example repositories in seconds. Generate documentation automatically. Run comprehensive test suites. Deploy to any supported network. The infrastructure includes eighteen to thirty examples organized by learning level, from basic operations to advanced implementations."

### Section 4: Conclusion & Call-to-Action (45-60 seconds)
**Focus**: Project significance and engagement

Show:
- Project statistics overlay
- Documentation files
- Live application website
- Call-to-action button/link

Narration: "Everything is open source, thoroughly documented with fifty thousand words, and production-ready. Experience privacy-preserving blockchain development with Privacy Virtual Pet. Where your pets are secure. Your data is encrypted. And learning FHEVM is simplified. Visit privacy-virtual-pet-v07.vercel.app today."

---

## Visual Assets to Include

### Recommended Visuals
1. **Project Logo**: Privacy Virtual Pet branding
2. **Live Application**: Recorded gameplay showing:
   - Wallet connection flow
   - Pet creation process
   - Pet care interactions
   - Stat updates in real-time
   - Transaction confirmations

3. **Code & Terminal**: Show automation tools:
   - CLI commands executing
   - Example generation output
   - File creation process
   - Test execution results

4. **Documentation**: Showcase:
   - Project structure
   - File organization
   - Documentation samples
   - Example categories

5. **Statistics**: Display:
   - 50,000+ words documentation
   - 18-30 examples
   - 4 supported networks
   - Production deployment status

### Screen Recording Recommendations
- Use high-quality screen recording software
- Capture at 1080p minimum
- Include clear mouse movements
- Show successful transactions
- Highlight key features

---

## Audio & Music Guidelines

### Narration
- **Voice**: Clear, professional narrator
- **Microphone**: Quality USB or external microphone
- **Audio Level**: -12dB to -6dB for optimal levels
- **Editing**: Use professional audio editing software
- **Format**: WAV or AAC for best quality

### Background Music
- Optional but recommended
- License-free alternatives:
  - YouTube Audio Library
  - Bensound.com
  - Epidemic Sound
- Choose uplifting, technology-oriented music
- Volume: 20-30% relative to narration
- Fade in/out at beginning and end

### Sound Effects
- Optional transaction notification sounds
- UI interaction sounds (subtle)
- Keep minimal and professional

---

## Production Steps

### Pre-Production
1. Write and review narration script
2. Gather all visual assets
3. Plan shot list and timing
4. Set up recording environment
5. Test audio equipment
6. Create storyboard/timeline

### Production
1. Record narration in quiet environment
2. Screen record application demos
3. Screen record CLI automation tools
4. Capture relevant documentation
5. Record any additional visuals needed

### Post-Production
1. Edit video sequence with narration timing
2. Add visual transitions (3-5 seconds)
3. Insert background music
4. Add title cards and text overlays
5. Include project statistics overlay
6. Add call-to-action at end
7. Color correct and enhance visuals
8. Export at final specifications

### Quality Assurance
1. Verify audio sync with video
2. Check volume levels (narration -6dB)
3. Ensure clarity of all visuals
4. Test playback on multiple devices
5. Verify duration (exactly 60 seconds)
6. Check file size and format

---

## Recommended Tools

### Video Editing
- **Professional**: Adobe Premiere Pro, Final Cut Pro
- **Accessible**: DaVinci Resolve (free), Shotcut (free)
- **Online**: Camtasia, Movavi, OBS Studio (recording)

### Audio Editing
- **Professional**: Adobe Audition, Logic Pro
- **Accessible**: Audacity (free), Reaper

### Screen Recording
- **Windows**: Camtasia, OBS Studio, Bandicam
- **Mac**: ScreenFlow, Camtasia, QuickTime
- **Cross-platform**: OBS Studio (free)

### Media Hosting
- **YouTube**: Easiest for sharing and embedding
- **Vimeo**: Professional video hosting
- **GitHub**: Upload as release asset
- **Custom Server**: Self-hosted option

---

## File Organization

```
video-assets/
├── scripts/
│   ├── NARRATION
│   └── VIDEO_SCRIPT.md
├── recordings/
│   ├── narration_final.wav
│   ├── application_demo.mp4
│   ├── automation_tools.mp4
│   └── documentation.mp4
├── assets/
│   ├── logo.png
│   ├── background_music.mp3
│   └── sound_effects/
├── project_file/
│   └── final_video.prproj
└── exports/
    ├── final_video_1080p.mp4
    ├── final_video_4k.mp4
    └── final_video_compressed.mp4
```

---

## Delivery Checklist

Before submission, verify:

- ✅ Video duration is exactly 60 seconds
- ✅ Audio narration matches script (NARRATION)
- ✅ Narration is clear and professional
- ✅ All visuals are high quality
- ✅ Application features are demonstrated
- ✅ Automation tools are shown
- ✅ Project statistics are displayed
- ✅ Call-to-action is included
- ✅ File is in MP4 or WebM format
- ✅ Resolution is 1080p or higher
- ✅ Audio levels are optimized
- ✅ Video is playable on all devices
- ✅ File size is reasonable (under 100MB)
- ✅ Title and credits are included
- ✅ Video has been tested before upload

---

## Upload Instructions

### For GitHub
```bash
# Create release with video attachment
gh release create v1.0 final_video.mp4 \
  --title "Privacy Virtual Pet - Demonstration Video" \
  --notes "One-minute demonstration video showcasing the application and automation tools"
```

### For YouTube
1. Create unlisted or public video
2. Add descriptive title and tags
3. Include timestamps in description
4. Link to live application
5. Include repository links in description

### For Zama Submission
1. Include video URL in submission
2. Provide video file as attachment (if requested)
3. Include video description
4. Add narration script link

---

## Narration Timing Reference

Use this timing guide to synchronize visuals with narration:

- 0:00 - 0:10 (Introduction): Privacy concept and encryption
- 0:10 - 0:30 (Application): Demo and gameplay
- 0:30 - 0:45 (Automation): Tools and examples
- 0:45 - 1:00 (Conclusion): Project summary and CTA

---

## References

- **Full Narration**: `NARRATION`
- **Video Script with Notes**: `VIDEO_SCRIPT.md`
- **Live Application**: https://privacy-virtual-pet-v07.vercel.app/
- **GitHub Repository**: [Repository URL]
- **Etherscan Contract**: https://sepolia.etherscan.io/address/0x2d2548D03606Dd001625BB7015B44E3771f5f700

---

## Questions & Support

For video production questions:
- Consult this guide
- Review narration script
- Check timing recommendations
- Test on multiple platforms
- Verify audio synchronization

---

**Ready to create an amazing demonstration video!** 🎥✨
