# Interlinear Translation App

A browser-based app that runs locally and provides interlinear translations of text in ~70 languages. The app shows a word-by-word translation beneath the original text, along with a more readable translation with proper word ordering in the target language.

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
3. Set up your API key in one of the following ways:
   - **Environment variable**: Copy `.env.example` to `.env` and add your API key
   - **Manual entry**: When you first click the "Translate" button without a configured key, you'll be prompted to enter it

### Setting Up Environment Variables

The recommended way to provide your API key is through environment variables:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file and replace `your-api-key-here` with your actual OpenAI API key
3. The `.env` file is included in `.gitignore` so it won't be committed to version control

### API Usage Notes

- The app uses GPT-4o for fluent translations and word-by-word translations
- Each translation request will consume API credits based on OpenAI's current pricing
- When using environment variables, your API key is never exposed in the source code
- For privacy reasons, consider using this app for non-sensitive content

## Screenshot

<img width="1200" alt="Screenshot 2025-05-01 at 12 11 31 PM" src="https://github.com/user-attachments/assets/1cee9fb7-f7f6-4384-bf54-60c413533380" />

