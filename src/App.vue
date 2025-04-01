<template>
  <div class="container">
    <div v-if="isTranslating" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Translating... This may take a few moments</div>
      </div>
    </div>
    <header class="app-header">
      <h1>Interlinear Translation</h1>
    </header>
    
    <section class="input-section">
      <div class="language-section">
        <div class="form-group">
          <label for="sourceLanguage">Source Language</label>
          <div class="language-select-wrapper">
            <select id="sourceLanguage" v-model="sourceLanguage" :disabled="isTranslating" class="language-select">
              <option value="auto">Auto-detect</option>
              <option v-for="lang in sortedLanguages" :key="lang.code" :value="lang.code">
                {{ lang.name }}
              </option>
            </select>
            <div class="language-count">{{ languages.length }} languages</div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="targetLanguage">Target Language</label>
          <div class="language-select-wrapper">
            <select id="targetLanguage" v-model="targetLanguage" :disabled="isTranslating" class="language-select">
              <!-- English is always at the top -->
              <option value="en">English</option>
              <option v-for="lang in targetLanguages" :key="lang.code" :value="lang.code">
                {{ lang.name }}
              </option>
            </select>
            <div class="language-count">{{ languages.length }} languages</div>
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label for="sourceText">Text to Translate</label>
        <textarea 
          id="sourceText" 
          v-model="sourceText" 
          placeholder="Enter the text you want to translate..."
          :disabled="isTranslating"
        ></textarea>
      </div>
      
      <!-- API key UI elements removed -->
      
      <button @click="translateText" :disabled="isTranslating" class="primary-button">
        <span v-if="isTranslating">Translating...</span>
        <span v-else>Translate</span>
      </button>
      
      <div v-if="error" class="error-message">{{ error }}</div>
    </section>
    
    <div class="translation-container" v-if="translationResult">
      <div class="interlinear-pane" id="interlinear-pane">
        <div class="pane-header">Interlinear Translation</div>
        <div class="interlinear-content">
          <div v-for="(chunk, chunkIndex) in translationResult.interlinear" :key="chunkIndex" class="chunk">
            <div class="word-container">
              <div 
                v-for="(wordPair, wordIndex) in chunk" 
                :key="wordIndex" 
                :class="['interlinear-word', { 'speaker-change': isDialogueChange(wordPair, wordIndex, chunk) }]"
              >
                <div class="original">{{ wordPair.original }}</div>
                <div class="translation">{{ wordPair.translation }}</div>
              </div>
            </div>
            <!-- Add a visual separator between chunks -->
            <div v-if="chunkIndex < translationResult.interlinear.length - 1" class="chunk-separator"></div>
          </div>
        </div>
      </div>
      
      <div class="readable-pane" :class="{ 'floating': isScrolled }" id="readable-pane" :style="floatingStyle">
        <div class="pane-header">Readable Translation</div>
          <div class="readable-content">
            <p v-for="(sentence, index) in translationResult.readable" :key="index"
               :dir="isRTLLanguage(targetLanguage) ? 'rtl' : 'ltr'"
               :lang="targetLanguage"
               :class="{ 'rtl-text': isRTLLanguage(targetLanguage) }">
              {{ sentence }}
            </p>
          </div>
      </div>
      
      <!-- Add spacer to maintain scroll height when the readable panel floats -->
      <div v-if="isScrolled" class="readable-spacer"></div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sourceLanguage: 'auto',
      targetLanguage: 'en',
      sourceText: '',
      translationResult: null,
      apiKey: '', // Store API key
      isTranslating: false,
      error: null,
      isScrolled: false,
      languages: [
        // Top 50 most widely spoken languages by number of speakers
        { code: 'en', name: 'English' },
        { code: 'zh-Hans', name: 'Chinese (Simplified)' },
        { code: 'zh-Hant', name: 'Chinese (Traditional)' },
        { code: 'zh-Latn', name: 'Chinese (Pinyin)' },
        { code: 'hi', name: 'Hindi' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'ar', name: 'Arabic' },
        { code: 'bn', name: 'Bengali' },
        { code: 'ru', name: 'Russian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'id', name: 'Indonesian' },
        { code: 'ur', name: 'Urdu' },
        { code: 'de', name: 'German' },
        { code: 'ja', name: 'Japanese' },
        { code: 'sw', name: 'Swahili' },
        { code: 'mr', name: 'Marathi' },
        { code: 'te', name: 'Telugu' },
        { code: 'tr', name: 'Turkish' },
        { code: 'ta', name: 'Tamil' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'ko', name: 'Korean' },
        { code: 'fa', name: 'Persian' },
        { code: 'it', name: 'Italian' },
        { code: 'pl', name: 'Polish' },
        { code: 'pa', name: 'Punjabi' },
        { code: 'uk', name: 'Ukrainian' },
        { code: 'ml', name: 'Malayalam' },
        { code: 'ro', name: 'Romanian' },
        { code: 'nl', name: 'Dutch' },
        { code: 'hu', name: 'Hungarian' },
        { code: 'el', name: 'Greek' },
        { code: 'th', name: 'Thai' },
        { code: 'gu', name: 'Gujarati' },
        { code: 'ps', name: 'Pashto' },
        { code: 'kn', name: 'Kannada' },
        { code: 'my', name: 'Burmese' },
        { code: 'ha', name: 'Hausa' },
        { code: 'yo', name: 'Yoruba' },
        { code: 'uz', name: 'Uzbek' },
        { code: 'si', name: 'Sinhala' },
        { code: 'mg', name: 'Malagasy' },
        { code: 'km', name: 'Khmer' },
        { code: 'ig', name: 'Igbo' },
        { code: 'ne', name: 'Nepali' },
        { code: 'am', name: 'Amharic' },
        { code: 'he', name: 'Hebrew' },
        { code: 'tl', name: 'Filipino (Tagalog)' }
        // Removed: Sindhi, Malay, Kurdish, Somali
      ]
    }
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll);
    
    // Add keyboard shortcut for power users to reset API key (Ctrl+Shift+A)
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('keydown', this.handleKeydown);
  },
  computed: {
    floatingStyle() {
      if (!this.isScrolled) return {};
      
      // Get input section position
      const inputSection = document.querySelector('.input-section');
      if (!inputSection) return {};
      
      const inputRect = inputSection.getBoundingClientRect();
      
      // If input section is still partially visible, position the readable pane just below it
      if (inputRect.bottom > 0) {
        return {
          top: `${inputRect.bottom + 10}px` // 10px gap
        };
      }
      
      // Otherwise, use the default position (20px from top)
      return {};
    },
    
    // Alphabetically sorted and filtered languages
    sortedLanguages() {
      return [...this.languages].sort((a, b) => a.name.localeCompare(b.name));
    },
    
    // Filter out English from the target languages list since it's already at the top
    targetLanguages() {
      return this.sortedLanguages.filter(lang => lang.code !== 'en');
    }
  },
  methods: {
    async translateText() {
      if (!this.sourceText.trim()) {
        alert('Please enter some text to translate');
        return;
      }
      
      if (!this.apiKey) {
        this.apiKey = prompt('Please enter your OpenAI API key:');
        if (!this.apiKey) {
          alert('API key is required for translation');
          return;
        }
      }
      
      this.isTranslating = true;
      this.error = null;
      
      try {
        console.log("Starting translation process");
        
        // Run both translations in parallel
        const [readablePromise, interlinearPromise] = [
          this.getReadableTranslation(),
          this.getInterlinearTranslation()
        ];
        
        // Wait for both to complete
        const results = await Promise.allSettled([readablePromise, interlinearPromise]);
        
        let readable = [];
        let interlinear = [];
        let errors = [];
        
        // Process readable translation result
        if (results[0].status === 'fulfilled') {
          readable = results[0].value;
          console.log("Readable translation completed successfully");
        } else {
          console.error("Readable translation failed:", results[0].reason);
          errors.push(`Readable translation error: ${results[0].reason.message || "Unknown error"}`);
          readable = ["Error in translation. Please check console for details."];
        }
        
        // Process interlinear translation result
        if (results[1].status === 'fulfilled') {
          interlinear = results[1].value;
          console.log("Interlinear translation completed successfully");
        } else {
          console.error("Interlinear translation failed:", results[1].reason);
          errors.push(`Interlinear translation error: ${results[1].reason.message || "Unknown error"}`);
          // Create fallback
          const words = this.sourceText.split(/\s+/).filter(w => w.trim());
          interlinear = [words.map(word => ({
            original: word,
            translation: `[Error]`
          }))];
        }
        
        this.translationResult = {
          interlinear,
          readable
        };
        
        if (errors.length > 0) {
          this.error = errors.join("\n");
        }
        
        console.log("Translation process completed");
        
      } catch (error) {
        console.error('Unexpected translation error:', error);
        this.error = 'Error during translation: ' + (error.message || error);
      } finally {
        this.isTranslating = false;
      }
    },
    
    async getReadableTranslation() {
      try {
        console.log("Starting readable translation");
        
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({
          apiKey: this.apiKey,
          dangerouslyAllowBrowser: true // In production, proxy through a backend
        });
        
        const prompt = `Translate the following text from ${this.getLanguageName(this.sourceLanguage)} to ${this.getLanguageName(this.targetLanguage)}. Provide a natural, fluent translation:\n\n${this.sourceText}`;
        
        console.log("Sending request for readable translation...");
        const requestPromise = openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a highly accurate language translator." },
            { role: "user", content: prompt }
          ]
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Translation request timed out after 30 seconds")), 30000);
        });
        
        const response = await Promise.race([requestPromise, timeoutPromise]);
        console.log("Received readable translation response");
        
        // Extract and trim the full translation text
        const fullTranslation = response.choices[0].message.content.trim();
        console.log("Readable translation:", fullTranslation);
        
        // Process the text to handle special words and abbreviations
        let processedText = fullTranslation;
        
        // Handle specific patterns like "J. St. Mill"
        processedText = processedText.replace(/J\.\s+St\.\s+Mill/g, 'J_St_Mill_PLACEHOLDER');
        
        // Handle other name patterns with initials (e.g. "A. B" → "A_DOT_B")
        processedText = processedText.replace(/([A-Z])\.\s+([A-Z][a-z]+)/g, '$1_DOT_$2');
        
        // Define common abbreviations to preserve
        const abbreviations = ['e.g.', 'i.e.', 'etc.', 'vs.', 'Mr.', 'Mrs.', 'Dr.', 'Prof.', 'St.', 'Jr.', 'Sr.', 'Inc.', 'Ltd.'];
        
        // Replace each abbreviation with a unique placeholder
        abbreviations.forEach((abbr, index) => {
          const placeholder = `__ABBR${index}__`;
          const regex = new RegExp(abbr.replace(/\./g, '\\.'), 'gi');
          processedText = processedText.replace(regex, placeholder);
        });
        
        // Also handle other initial patterns like "J. K. Rowling"
        processedText = processedText.replace(/\b([A-Z])\.\s+([A-Z])\.\s+/g, '$1__DOT__$2__DOT__ ');
        processedText = processedText.replace(/\b([A-Z])\.\s+([A-Z])\.\s*([A-Z])\./g, '$1__DOT__$2__DOT__$3__DOT__');
        
        // Split the processed text into paragraphs using double newlines as delimiter
        const rawParagraphs = processedText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
        
        // Restore placeholders in each paragraph
        const paragraphs = rawParagraphs.map(paragraph => {
          let restored = paragraph;
          
          // Restore the "J. St. Mill" pattern
          restored = restored.replace(/J_St_Mill_PLACEHOLDER/g, 'J. St. Mill');
          // Restore initials that were replaced (e.g. "A_DOT_B" → "A. B")
          restored = restored.replace(/([A-Z])_DOT_([A-Z][a-z]+)/g, '$1. $2');
          
          // Restore each abbreviation placeholder back to its original form
          abbreviations.forEach((abbr, i) => {
            const placeholder = `__ABBR${i}__`;
            const regex = new RegExp(placeholder, 'g');
            restored = restored.replace(regex, abbr);
          });
          
          // Restore other initials markers
          restored = restored.replace(/__DOT__/g, '.');
          
          return restored;
        });
        
        console.log("Processed into", paragraphs.length, "paragraphs with abbreviations preserved");
        return paragraphs;
      } catch (error) {
        console.error("Error in readable translation:", error);
        return [`Translation error: ${error.message || "Unknown error"}`];
      }
    },
    
    async getInterlinearTranslation() {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true
      });
      
      const interlinear = [];
      
      try {
        // Split the text into manageable chunks, but preserve initials
        // Use a regex that excludes periods in initials like "J. St. Mill" from sentence splitting
        const sentences = this.sourceText
          .replace(/([A-Z])\.\s*([A-Z])\./g, '$1INITIALDOT$2INITIALDOT') // Temporarily replace periods in initials
          .split(/(?<=[.!?])\s+/) // Split after ending punctuation and whitespace
          .map(s => s.replace(/INITIALDOT/g, '.')) // Restore the periods in initials
          .filter(s => s.trim());
        console.log("Starting interlinear translation for", sentences.length, "sentences");
        
        if (sentences.length === 0) {
          return []; // Nothing to translate
        }
        
        const MAX_CHUNK_SIZE = 300; // Characters per chunk
        let chunks = [];
        let currentChunk = "";
        
        // Create chunks of text to process separately
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > MAX_CHUNK_SIZE) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? ". " : "") + sentence;
          }
        }
        
        // Add the last chunk if not empty
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        
        console.log(`Split text into ${chunks.length} chunks for processing`);
        
        // Process each chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`Processing chunk ${i+1}/${chunks.length}: "${chunk.substring(0, 30)}..."`);
          
          // Prepare language-specific instructions
          let sourceLanguageInstructions = '';
          let targetLanguageInstructions = '';
          
          // Add instructions for specific language variants and RTL languages
          if (this.sourceLanguage === 'zh-Hans' || this.sourceLanguage === 'zh-Hant' || this.sourceLanguage === 'zh-Latn') {
            sourceLanguageInstructions = `For Chinese source text: ${this.sourceLanguage === 'zh-Hans' ? 'This is in Simplified Chinese characters.' : this.sourceLanguage === 'zh-Hant' ? 'This is in Traditional Chinese characters.' : 'This is in Pinyin romanization.'}\n\n`;
          } else if (this.isRTLLanguage(this.sourceLanguage)) {
            sourceLanguageInstructions = `For ${this.getLanguageName(this.sourceLanguage)} source text: This is a right-to-left language. Be aware of the reading direction when processing.\n\n`;
          }
          
          if (this.targetLanguage === 'zh-Hans' || this.targetLanguage === 'zh-Hant' || this.targetLanguage === 'zh-Latn') {
            targetLanguageInstructions = `For Chinese target text: ${this.targetLanguage === 'zh-Hans' ? 'Translate into Simplified Chinese characters.' : this.targetLanguage === 'zh-Hant' ? 'Translate into Traditional Chinese characters.' : 'Translate into Pinyin romanization with tone marks.'}\n\n`;
          } else if (this.isRTLLanguage(this.targetLanguage)) {
            targetLanguageInstructions = `For ${this.getLanguageName(this.targetLanguage)} target text: This is a right-to-left language. Ensure proper word order for right-to-left reading direction.\n\n`;
          }
          
          // Add language-specific translation rules
          let languageSpecificRules = '';
          
          // Add Italian-specific rules
          if (this.sourceLanguage === 'it') {
            languageSpecificRules = `
IMPORTANT ITALIAN TRANSLATION RULES:
- When a conjugated verb doesn't have an explicit subject pronoun AND the subject is not clear from the same sentence, include the implied pronoun in brackets in the translation. 
  For example: "Vado" → "[I] go", "Andiamo" → "[we] go", "Hai" → "[you] have"
- The particle "ci" has multiple meanings depending on context - it can mean "there", "to it", "about it", "in it", or be part of idiomatic expressions. Translate it based on context, not always as "us".
- "ce n'è" → "there is" or "there are" (not "of it there is to us")
- "ci si sente" → "one can hear" or "people hear" or "it can be heard" (not "us one feels")
- "ci va" → "goes there" (not "us goes")
- "passarci" → "spend there" (not "pass us")
- "ne" often means "of it" or "about it" but depends on context
- "si" can be reflexive or impersonal depending on context
- Analyze pronominal verbs as whole units (e.g. "andarsene" = "to go away")
- Verb + preposition combinations often have idiomatic meanings
- Pay attention to articulated prepositions (e.g. "della", "alla")
`;
          } else if (this.sourceLanguage === 'fr') {
            // French-specific rules
            languageSpecificRules = `
IMPORTANT FRENCH TRANSLATION RULES:
- When a verb form makes the subject clear without an explicit pronoun, include the implied pronoun in brackets.
  For example in imperative forms: "Parlez!" → "[you] speak!"
- "y" typically means "there" or "to it" depending on context
- "en" typically means "from there" or "of it" depending on context
- "on" is often used as an impersonal subject like "one" or "people"
- Pay attention to expressions like "il y a" (there is/are)
- French negations ("ne...pas", "ne...jamais") should be translated together
`;
          } else if (this.sourceLanguage === 'de') {
            // Additional German-specific rules
            languageSpecificRules = `
IMPORTANT GERMAN TRANSLATION RULES:
- Modal particles like "doch", "mal", "ja", "eben" often don't have direct translations
- "es gibt" → "there is/are"
- Treat separable verb prefixes carefully (e.g. "anfangen" → "to begin")
- Pay attention to compound words that should be translated as a unit
`;
          } else if (this.sourceLanguage === 'pt') {
            // Portuguese-specific rules
            languageSpecificRules = `
IMPORTANT PORTUGUESE TRANSLATION RULES:
- When a conjugated verb doesn't have an explicit subject pronoun AND the subject is not clear from the same sentence, include the implied pronoun in brackets in the translation.
  For example: "Falo" → "[I] speak", "Vamos" → "[we] go", "Tens" → "[you] have"
- Pay attention to different uses of "que"
- Translate the personal infinitive appropriately with implied subjects
`;
          } else if (this.sourceLanguage === 'ru') {
            // Russian-specific rules
            languageSpecificRules = `
IMPORTANT RUSSIAN TRANSLATION RULES:
- When a conjugated verb doesn't have an explicit subject pronoun AND the subject is not clear from the same sentence, include the implied pronoun in brackets in the translation.
  For example: "Говорю" → "[I] speak", "Идём" → "[we] go"
- Pay attention to aspects of verbs (perfective vs. imperfective)
- Cases affect the meaning of nouns and should be reflected in translation
`;
          } else if (this.sourceLanguage === 'ja') {
            // Japanese-specific rules
            languageSpecificRules = `
IMPORTANT JAPANESE TRANSLATION RULES:
- When the subject is omitted AND the subject is not clear from the same sentence, include the implied pronoun in brackets based on context.
  For example: "食べます" → "[I/we] eat" or "行きましょう" → "[let's] go"
- Include implied objects in brackets when they're clear from context
- Pay attention to particles like は, が, を, に and their functions
`;
          } else if (this.sourceLanguage === 'zh-Hans' || this.sourceLanguage === 'zh-Hant' || this.sourceLanguage === 'zh-Latn') {
            // Add missing subject guidance to Chinese
            languageSpecificRules += `
- When the subject is omitted in Chinese AND the subject is not clear from the same sentence, include the implied pronoun in brackets based on context.
  For example: "吃饭" → "[I/we/you] eat", "去了" → "[he/she/they] went"
`;
          } else if (this.sourceLanguage === 'es') {
            // Spanish-specific rules
            languageSpecificRules = `
IMPORTANT SPANISH TRANSLATION RULES:
- When a conjugated verb doesn't have an explicit subject pronoun AND the subject is not clear from the same sentence, include the implied pronoun in brackets in the translation. 
  For example: "Hablo" → "[I] speak", "Vamos" → "[we] go", "Tienes" → "[you] have"
- "se" has multiple uses: reflexive, reciprocal, impersonal, passive
- "hay" → "there is/are"
- Understand when to translate "que" as "that", "which", or "what"
- Pay attention to subjunctive constructions
`;
          }
          
          // Add a general rule for implied subjects and objects in any language
          const generalRules = `
GENERAL TRANSLATION RULES FOR ALL LANGUAGES:
- For any language: When a sentence omits a subject or object that is NOT explicitly mentioned in the same sentence but is clear from context or grammatical form, include the implied word in brackets in the translation.
- DO NOT add implied pronouns when the noun/pronoun is already clearly stated in the same sentence.
- This is especially important for "pro-drop" languages (languages that omit pronouns), but applies to any language where information might be implied rather than stated.
- Examples: 
  • A verb form that indicates a specific person without a pronoun → include [I], [you], [he/she], etc.
  • An imperative without explicit subject → include [you]
  • Implied objects → include [it], [them], etc. when clear from context

DIALOGUE TRANSLATION RULES:
- CRITICAL: For dialogue, simply detect speaker changes but do NOT include any text like "SPEAKER_CHANGE" in the translation output.
- Identify dialogue by: quotation marks (" ", « », „ ", etc.), dashes (—, –) at beginning of lines.
- The application will automatically add line breaks between different speakers.
`;

          const prompt = `Translate the following ${this.getLanguageName(this.sourceLanguage)} text to ${this.getLanguageName(this.targetLanguage)} word by word with these special rules:
          
${sourceLanguageInstructions}${targetLanguageInstructions}${generalRules}${languageSpecificRules}

1. Translate most words individually, one at a time
2. IMPORTANT: Keep punctuation attached to the preceding word in both original and translation. For example:
   - "Hallo," → original: "Hallo," translation: "Hello,"
   - "Ende." → original: "Ende." translation: "End."
3. IMPORTANT: Keep common phrases and idioms together as single units. For example, in German:
   - "z.B." → "for example" (not "z" and "B" separately)
   - "d.h." → "i.e." or "that is"
   - "u.a." → "among others"
   - "bzw." → "respectively" or "or"
   - "usw." → "etc."
   - "im allgemeinen" → "in general"
   - "im Gegensatz zu" → "in contrast to"
   - "und zwar" → "specifically" or "namely"
   - "nach wie vor" → "still"
4. German-specific rules:
   - Keep separable verb prefixes with their verbs when possible
   - Treat compound nouns as single units (e.g., "Grundeigentum" → "land ownership")
   - Keep reflexive verbs with their reflexive pronouns
   - Recognize and properly translate German grammatical constructions
5. Name and initial handling:
   - Treat personal names with initials (like "J. St. Mill") as single units
   - Keep titles with names (like "Dr. Schmidt" or "Prof. Müller")

Return a JSON object with a "translations" array. Each element should have "original" (the original word or phrase including any punctuation) and "translation" (the translated word or phrase without punctuation).

Example format:
{"translations": [{"original":"z.B.", "translation":"for example"}, {"original":"Buch,", "translation":"book"}]}

Text: ${chunk}`;
          
          console.log(`Sending chunk ${i+1} to OpenAI...`);
          // Set up a timeout for the request
          const requestPromise = openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: `You are a precise interlinear translator. Translate word-by-word, preserving original punctuation in 'original' field. Keep common phrases as units.

CRITICAL: For pro-drop languages, include implied pronouns in brackets only when the subject is not clear from the same sentence. E.g., "Vado" → "[I] go"

CRITICAL: For dialogue, detect speaker changes but do NOT insert any text marker. The app will handle visual separation.

CRITICAL: Always preserve punctuation (periods, commas, question marks, exclamation points) in the translation. Attach punctuation to the preceding word rather than treating it as a separate token.

${this.sourceLanguage === 'it' ? 'For Italian: Handle "ci/ne/si" contextually. "ci" can mean "there/to it/about it" not just "us".' : ''}
${this.sourceLanguage === 'es' || this.sourceLanguage === 'pt' ? 'For Spanish/Portuguese: Include implied subjects based on conjugation.' : ''}
${this.sourceLanguage === 'ru' || this.sourceLanguage === 'ja' || this.sourceLanguage.startsWith('zh') ? 'Include all implied subjects/objects in brackets based on context.' : ''}

Return valid JSON with translation pairs.` },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          });
          
          // Create a timeout promise - increased to 60 seconds for longer texts
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Interlinear translation request timed out after 60 seconds")), 60000);
          });
          
          // Race the request against the timeout
          const response = await Promise.race([requestPromise, timeoutPromise]);
          
          console.log(`Received response for chunk ${i+1}`);
          
          // Extract and parse the JSON response
          const content = response.choices[0].message.content.trim();
          
          try {
            const parsed = JSON.parse(content);
            
            let chunkWordPairs = [];
            if (parsed && Array.isArray(parsed.translations)) {
              chunkWordPairs = parsed.translations;
              console.log(`Chunk ${i+1}: Found ${chunkWordPairs.length} translations`);
            } else if (Array.isArray(parsed)) {
              chunkWordPairs = parsed;
              console.log(`Chunk ${i+1}: Using array with ${chunkWordPairs.length} items`);
            } else {
              console.error(`Chunk ${i+1}: Unexpected format:`, parsed);
              throw new Error(`Invalid response format for chunk ${i+1}`);
            }
            
            // Post-process for punctuation: merge standalone punctuation with preceding words
            // and fix issues with double periods and extra punctuation
            let processedPairs = [];
            for (let j = 0; j < chunkWordPairs.length; j++) {
              const pair = chunkWordPairs[j];
              
              // Clean up any duplicate punctuation in input
              if (pair.original) {
                pair.original = pair.original.replace(/\.{2,}/g, '.'); // Replace multiple periods with single
              }
              if (pair.translation) {
                pair.translation = pair.translation
                  .replace(/\.{2,}/g, '.') // Fix double periods
                  .replace(/([!?])\.+/g, '$1'); // Remove periods after ? or !
              }
              
              // If it's standalone punctuation, merge with previous word
              if (/^[,.;:!?]+$/.test(pair.original) && processedPairs.length > 0) {
                // Attach punctuation to the previous word
                processedPairs[processedPairs.length - 1].original += pair.original;
                
                // If translation has punctuation, attach it too
                if (/^[,.;:!?]+$/.test(pair.translation)) {
                  // Check for redundant punctuation (e.g., period after a question mark)
                  const lastChar = processedPairs[processedPairs.length - 1].translation.slice(-1);
                  if (!(lastChar === '.' && /[!?]/.test(pair.translation)) && 
                      !(lastChar === pair.translation)) {
                    processedPairs[processedPairs.length - 1].translation += pair.translation;
                  }
                }
              } else {
                processedPairs.push(pair);
              }
            }
            
            // Add this chunk's processed translations to the result
            interlinear.push(processedPairs);
          } catch (error) {
            console.error(`Error parsing chunk ${i+1}:`, error);
            
            // For this chunk, create a fallback with proper punctuation handling
            const words = chunk.split(/\s+/).filter(w => w.trim());
            const fallbackPairs = [];
            
            for (let j = 0; j < words.length; j++) {
              let word = words[j];
              
              // Clean up any duplicate punctuation
              word = word.replace(/\.{2,}/g, '.'); // Replace multiple periods with single
              
              // If it's standalone punctuation, merge with previous word
              if (/^[,.;:!?]+$/.test(word) && fallbackPairs.length > 0) {
                fallbackPairs[fallbackPairs.length - 1].original += word;
              } else {
                fallbackPairs.push({
                  original: word,
                  translation: `[Error]`
                });
              }
            }
            
            interlinear.push(fallbackPairs);
          }
        }
        
        return interlinear;
        
      } catch (error) {
        console.error('Error in interlinear translation:', error);
        
        // Add at least something to show in the UI
        if (interlinear.length === 0) {
          const words = this.sourceText.split(/\s+/).filter(w => w.trim());
          interlinear.push(words.map(word => ({
            original: word,
            translation: `[Error occurred]`
          })));
        }
        
        // Re-throw to be caught by the caller
        throw new Error(`Interlinear translation failed: ${error.message}`);
      }
      
      return interlinear;
    },
    
    getLanguageName(code) {
      if (code === 'auto') return 'Auto-detect';
      
      // Handle special cases for language variants
      if (code === 'zh-Hans') return 'Chinese (Simplified)';
      if (code === 'zh-Hant') return 'Chinese (Traditional)';
      if (code === 'zh-Latn') return 'Chinese (Pinyin)';
      
      // Otherwise find in the languages array
      const language = this.languages.find(lang => lang.code === code);
      return language ? language.name : code;
    },
    
    maskApiKey(key) {
      if (!key) return '';
      // Show only first 4 and last 4 characters
      return key.substring(0, 4) + '...' + key.substring(key.length - 4);
    },
    
    resetApiKey() {
      this.apiKey = '';
    },
    
    handleScroll() {
      // Get the position of the interlinear pane and input section
      const interlinearPane = document.getElementById('interlinear-pane');
      const inputSection = document.querySelector('.input-section');
      
      if (interlinearPane && inputSection) {
        const interlinearRect = interlinearPane.getBoundingClientRect();
        
        // Start floating when the top of interlinear pane goes above viewport
        // The computed property will handle positioning relative to the input section
        this.isScrolled = interlinearRect.top < 0;
        
        // Force re-evaluation of computed property on every scroll when scrolled
        if (this.isScrolled) {
          this.$forceUpdate();
        }
      } else {
        // Fallback if elements not found
        this.isScrolled = window.scrollY > 250;
      }
    },
    
    // Hidden keyboard shortcut for power users to reset API key
    handleKeydown(event) {
      // Check for Ctrl+Shift+A
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        this.resetApiKey();
        console.log('API key reset via keyboard shortcut');
      }
    },
    
    // Check if a language is written right-to-left
    isRTLLanguage(code) {
      const rtlLanguages = ['ar', 'he', 'ur', 'fa'];
      return rtlLanguages.includes(code);
    },
    
    isDialogueChange(wordPair, wordIndex, chunk) {
      if (!wordPair.original) return false;
      
      const trimmed = wordPair.original.trim();
      
      // DASH LOGIC:
      // If the token is only dashes, don't trigger a speaker change.
      const isDashOnly = /^[-–—]+$/.test(trimmed);
      // If the token starts with a dash (and is more than just a dash) and it's not the first word, flag a speaker change.
      const isDashStart = (trimmed.startsWith('-') || trimmed.startsWith('–') || trimmed.startsWith('—')) && wordIndex > 0;
      
      // QUOTE LOGIC:
      // Check if the token starts with a quote character.
      const isQuote = /^[\"'\«\»\„]/.test(trimmed);
      let isPreviousQuote = false;
      let isNextWordText = false;
      let isPrevWordText = false;
      
      if (wordIndex > 0 && chunk[wordIndex - 1] && chunk[wordIndex - 1].original) {
        isPreviousQuote = /[\"'\«\»\„]$/.test(chunk[wordIndex - 1].original.trim());
      }
      if (wordIndex < chunk.length - 1 && chunk[wordIndex + 1] && chunk[wordIndex + 1].original) {
        isNextWordText = !/^[\"'\«\»\„]/.test(chunk[wordIndex + 1].original.trim());
      }
      if (wordIndex > 1 && chunk[wordIndex - 2] && chunk[wordIndex - 2].original) {
        isPrevWordText = !/[\"'\«\»\„]$/.test(chunk[wordIndex - 2].original.trim());
      }
      
      const isRealQuoteChange = isQuote && isPreviousQuote && (isNextWordText || isPrevWordText);
      
      // Return true if either the quote logic or dash logic (provided it's not a dash-only token) indicates a speaker change.
      if (isRealQuoteChange) {
        return true;
      }
      if (!isDashOnly && isDashStart) {
        return true;
      }
      
      return false;
    },

    
    // Check if a sentence is likely to be dialogue (for readable translation)
    isDialogueSentence(sentence, previousSentence) {
      if (!sentence || !previousSentence) return false;
      
      // Check for quotes at the beginning of sentences
      const startsWithQuote = /^[\s]*[\"\'\"\'\«\»\„]/.test(sentence);
      const previousEndsWithQuote = /[\"\'\"\'\«\»\„][\s]*$/.test(previousSentence);
      
      // Check for dashes that typically indicate dialogue
      const startsWithDash = /^[\s]*[\—\–\-]/.test(sentence);
      const previousEndsWithDash = /[\—\–\-][\s]*$/.test(previousSentence);
      
      // Look for common dialogue patterns
      return (startsWithQuote && !previousEndsWithQuote) || 
             (startsWithDash && !previousEndsWithDash) ||
             (sentence.includes('"') && sentence.includes('said')) ||
             (sentence.includes('"') && sentence.includes('asked')) ||
             (sentence.match(/^[\s]*"[^"]+"/));
    }
  }
}
</script>

<style scoped>
.chunk {
  margin-bottom: 30px;
}

.word-container {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  margin-bottom: 10px;
}

.chunk-separator {
  width: 100%;
  height: 1px;
  background-color: #ddd;
  margin: 20px 0;
  position: relative;
}

.chunk-separator::after {
  content: "•";
  position: absolute;
  top: -10px;
  left: 50%;
  background-color: white;
  padding: 0 10px;
  color: #999;
}

.speaker-change-indicator {
  width: 100%;
  height: 10px; /* Simple line break with spacing */
  margin: 8px 0;
}

/* Style for dialogue breaks in readable translation */
.dialogue-break {
  margin-top: 1em !important;
  position: relative;
}

/* Fix vertical alignment of dashes and punctuation */
.original, .translation {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.5;
  min-height: 1.5em;
}

/* Target dashes directly in interlinear view */
.interlinear-word .original:first-letter {
  vertical-align: middle;
}

/* Ensure consistent vertical alignment for punctuation */
.interlinear-word {
  align-items: stretch;
}

.original, .translation {
  text-align: center;
  width: 100%;
}

/* Add better spacing and alignment for dashes and punctuation */
.interlinear-word {
  position: relative;
}
</style>