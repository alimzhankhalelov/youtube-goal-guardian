# Privacy Policy for Goal Guardian

**Last updated: January 2026**

## Overview

Goal Guardian is a browser extension that helps users stay focused by analyzing YouTube video titles against their personal goals using AI.

## Data Collection

### What we collect:
- **Your goals**: Stored locally in your browser (chrome.storage.sync)
- **Your Gemini API key**: Stored locally in your browser only

### What we DO NOT collect:
- We do not collect any personal information
- We do not track your browsing history
- We do not store any data on external servers
- We do not share any data with third parties

## Data Processing

When you open a YouTube video:
1. The video title is sent to Google's Gemini AI API for analysis
2. This request uses YOUR personal API key (you provide it)
3. The request is made directly from your browser to Google's servers
4. We do not have access to these requests or responses

## Data Storage

All data is stored locally in your browser using Chrome's built-in storage API:
- Your goals
- Your API key
- Your language preference
- Protection enabled/disabled status

This data syncs across your Chrome browsers if you're signed in to Chrome.

## Third-Party Services

We use **Google Gemini AI API** for video analysis:
- You provide your own API key
- Requests go directly to Google
- Google's privacy policy applies to API usage
- See: https://policies.google.com/privacy

## Your Rights

You can:
- Clear all extension data by removing the extension
- View stored data in Chrome DevTools (Application > Storage)
- Disable the extension at any time

## Contact

For questions about this privacy policy, please open an issue on our GitHub repository.

## Changes

We may update this privacy policy from time to time. The latest version will always be available in the extension files.
