# 🎯 Goal Guardian - YouTube Focus Blocker

**AI-powered Chrome extension that blocks YouTube videos not aligned with your goals.**

Stay focused and productive by letting AI analyze video content before you watch.

## ✨ Features

- 🤖 **AI-Powered Analysis**: Uses Google Gemini AI to analyze video titles
- 🎯 **Goal-Based Filtering**: Set your goals, and AI blocks unrelated content
- 🔒 **Privacy-First**: All data stored locally in your browser
- 🌍 **Multilingual**: Supports English and Russian
- ⚡ **Background Processing**: No interruption for allowed videos
- 😴 **Fail-Open Design**: If AI is unavailable, shows friendly "Lucky You" message

## 🚀 How It Works

1. Set your goals (e.g., "Learn React", "Prepare for interview")
2. Get a free Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
3. Browse YouTube normally
4. When you open a video:
   - If it matches your goals → plays normally
   - If it doesn't → shows blocking overlay with option to justify

## 📦 Installation

### From Chrome Web Store
1. Visit the Chrome Web Store (link coming soon)
2. Click "Add to Chrome"
3. Configure your goals and API key

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension folder

## 🔐 Privacy

- All data is stored locally in your browser
- Your API key is never shared with anyone except Google's API
- No tracking, no analytics, no data collection
- See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for details

## 🛠️ Tech Stack

- Manifest V3
- Google Gemini Flash Lite API
- Vanilla JavaScript
- CSS Variables & Modern Design

## 📝 License

MIT License - feel free to use and modify.

---

**Made with ❤️ for productivity enthusiasts**
