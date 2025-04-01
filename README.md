# Interlinear Translation App

A browser-based app that runs locally and provides interlinear translations of text in any language. The app shows a word-by-word translation beneath the original text, along with a more readable translation with proper word ordering in the target language.

## Features

- Input text in any supported language
- Select source and target languages
- View interlinear translation (word-by-word)
- View readable translation with proper grammar and syntax
- Simple, responsive UI with split-pane view
- Powered by OpenAI's API (GPT-3.5 and GPT-4o) for accurate translations

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone this repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

### Running the App

```bash
npm run dev
# or
yarn dev
```

This will start the development server at http://localhost:3000. Open your browser to this address to use the app.

### Building for Production

```bash
npm run build
# or
yarn build
```

This will create a production-ready build in the `dist` directory.

## Usage

1. Select the source language (or use auto-detect)
2. Select the target language
3. Enter or paste the text you want to translate
4. Click the "Translate" button
5. View the interlinear translation on the left and the readable translation on the right

## Using with OpenAI API

This application uses OpenAI's API for translation. You'll need an OpenAI API key to use it:

1. Sign up for an account at [OpenAI's website](https://openai.com)
2. Create an API key in your account dashboard
3. When you first click the "Translate" button, you'll be prompted to enter your API key
4. The app will store your API key in memory for the session (it is not saved permanently)

### API Usage Notes

- The app uses GPT-3.5-Turbo for fluent translations and GPT-4o for word-by-word translations
- Each translation request will consume API credits based on OpenAI's current pricing
- Your API key is only stored in browser memory and is never sent to any server except OpenAI's API servers
- For privacy reasons, consider using this app for non-sensitive content

### Security Notice

In a production environment, API requests should be proxied through a backend server to avoid exposing your API key in browser code. This example uses `dangerouslyAllowBrowser: true` for demonstration purposes only.

## Future Enhancements

- Integration with professional translation APIs
- Support for more languages
- Advanced language analysis for better interlinear translations
- Export/import functionality
- Saving translations for later reference
- Custom dictionaries