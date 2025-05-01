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
    <div class="pane-header">
      Interlinear Translation
      <div class="pane-actions">
        <button @click="printInterlinear" class="action-button" title="Print interlinear translation">
          <span class="action-icon">🖨️</span>
        </button>
      </div>
    </div>
    <div class="interlinear-content">
      <div v-for="(chunk, chunkIndex) in translationResult.interlinear" :key="chunkIndex" class="chunk">
        <div class="word-container">
          <div 
            v-for="(wordPair, wordIndex) in chunk" 
            :key="wordIndex" 
            :class="['interlinear-word', { 'speaker-change': isDialogueChange(wordPair, wordIndex, chunk) }]"
            @dblclick="showWordDetails(wordPair.original)"
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
    <div class="pane-header">
      Readable Translation
      <div class="pane-actions">
        <button @click="copyReadableTranslation" class="action-button" title="Copy to clipboard">
          <span class="action-icon">📋</span>
        </button>
      </div>
    </div>
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
  <div v-if="isScrolled" class="readable-spacer" :style="{ height: readablePaneHeight + 'px' }"></div>
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
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '', // Use environment variable or empty string
      isTranslating: false,
      error: null,
      isScrolled: false,
      readablePaneHeight: 400, // Default height for the spacer
      wordDetails: null,
      isLoadingWordDetails: false,
      languages: [
        // Major languages
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
        { code: 'tl', name: 'Filipino (Tagalog)' },
        
        // Added languages
        { code: 'la', name: 'Latin' },
        { code: 'sv', name: 'Swedish' },
        { code: 'no', name: 'Norwegian' },
        { code: 'da', name: 'Danish' },
        { code: 'et', name: 'Estonian' },
        { code: 'lv', name: 'Latvian' },
        { code: 'lt', name: 'Lithuanian' },
        { code: 'sr', name: 'Serbian' },
        { code: 'cs', name: 'Czech' },
        { code: 'sk', name: 'Slovak' },
        { code: 'sl', name: 'Slovenian' },
        { code: 'hr', name: 'Croatian' },
        { code: 'sq', name: 'Albanian' },
        { code: 'bo', name: 'Tibetan' },
        { code: 'sa', name: 'Sanskrit' },
        { code: 'cy', name: 'Welsh' },
        { code: 'ga', name: 'Irish Gaelic' },
        { code: 'kk', name: 'Kazakh' },
        { code: 'mn', name: 'Mongolian' },
        { code: 'hy', name: 'Armenian' },
        { code: 'az', name: 'Azeri' },
        { code: 'fi', name: 'Finnish' }
      ]
    }
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll);
    
    // Add keyboard shortcut for power users to reset API key (Ctrl+Shift+A)
    window.addEventListener('keydown', this.handleKeydown);
    
    // Calculate and update the readable pane height once translations are available
    this.$nextTick(() => {
      this.updateReadablePaneHeight();
      
      // Also update on window resize to keep spacer accurate
      window.addEventListener('resize', this.updateReadablePaneHeight);
    });
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('resize', this.updateReadablePaneHeight);
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
          top: `${inputRect.bottom + 10}px`, // 10px gap below input section
        };
      }
      
      // Default position (20px from top)
      return {
        top: '20px'
      };
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
      
      // Check if we have the API key from the environment variable, otherwise prompt
      if (!this.apiKey) {
        // Try to get from import.meta.env for Vite
        this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        
        // If still no API key, prompt the user
        if (!this.apiKey) {
          this.apiKey = prompt('Please enter your OpenAI API key:');
          if (!this.apiKey) {
            alert('API key is required for translation');
            return;
          }
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
        
        // Update the readable pane height after translation is complete
        this.$nextTick(() => {
          this.updateReadablePaneHeight();
        });
      }
    },
    
    async getReadableTranslation() {
      try {
        console.log("Starting readable translation");
        
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({
          apiKey: this.apiKey || import.meta.env.VITE_OPENAI_API_KEY,
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
        apiKey: this.apiKey || import.meta.env.VITE_OPENAI_API_KEY,
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
        
        // Check if the scroll state is changing
        const wasScrolled = this.isScrolled;
        
        // Start floating when the top of interlinear pane goes above viewport
        // The computed property will handle positioning relative to the input section
        this.isScrolled = interlinearRect.top < 0;
        
        // Update the height measurement if scroll state changes
        if (this.isScrolled !== wasScrolled) {
          this.updateReadablePaneHeight();
        }
        
        // Force re-evaluation of computed property on every scroll when scrolled
        if (this.isScrolled) {
          this.$forceUpdate();
        }
      } else {
        // Fallback if elements not found
        this.isScrolled = window.scrollY > 250;
      }
    },
    
    // Calculate and store the height of the readable pane for the spacer
    updateReadablePaneHeight() {
      // Wait for nextTick to ensure DOM has updated
      this.$nextTick(() => {
        const readablePane = document.getElementById('readable-pane');
        if (readablePane) {
          this.readablePaneHeight = readablePane.offsetHeight;
        }
      });
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
    },
    
    // Copy the readable translation to the clipboard
    copyReadableTranslation() {
      if (!this.translationResult || !this.translationResult.readable) return;
      
      const readableText = this.translationResult.readable.join(' ');
      
      navigator.clipboard.writeText(readableText)
        .then(() => {
          alert('Translation copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          // Fallback for older browsers
          this.fallbackCopy(readableText);
        });
    },
    
    // Fallback copy method for browsers that don't support clipboard API
    fallbackCopy(text) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        alert('Translation copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy. Please try selecting and copying the text manually.');
      }
      
      document.body.removeChild(textArea);
    },
    
    // Show word details including gloss, etymology, and derivations
    async showWordDetails(word) {
      if (!word || word.trim() === '') {
        return;
      }
      
      // Make sure we have an API key
      if (!this.apiKey) {
        this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!this.apiKey) {
          alert('API key is required for word details');
          return;
        }
      }
      
      this.isLoadingWordDetails = true;
      this.wordDetails = null;
      
      try {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({
          apiKey: this.apiKey || import.meta.env.VITE_OPENAI_API_KEY,
          dangerouslyAllowBrowser: true
        });
        
        const prompt = `Provide a detailed linguistic analysis for the word "${word}" in ${this.getLanguageName(this.sourceLanguage)}. Include:
1. Exact gloss (concise definition)
2. Etymology (word origin)
3. Related derivations or cognates in other languages
4. Grammatical details specific to the word:
   - For verbs: tense, mood, aspect, person, number, conjugation pattern
   - For nouns: case, number, gender, declension pattern
   - For adjectives: gender, number, comparison forms
   - For other parts of speech: relevant morphological features

Format as JSON with these keys: "gloss", "etymology", "derivations", "grammar" (for detailed grammatical analysis), "notes" (for additional usage information).`;
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a linguistic expert providing concise, accurate information about words. Always respond with valid JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
        
        const content = response.choices[0].message.content.trim();
        this.wordDetails = JSON.parse(content);
        
        // Create and show a modal with the word details
        this.displayWordDetailsModal(word, this.wordDetails);
        
      } catch (error) {
        console.error('Error fetching word details:', error);
        this.wordDetails = {
          gloss: "Error retrieving details",
          etymology: "Could not load etymology information",
          derivations: [],
          grammar: "Could not load grammatical information",
          notes: "There was a problem connecting to the OpenAI service."
        };
        
        // Still show the modal but with error information
        this.displayWordDetailsModal(word, this.wordDetails);
      } finally {
        this.isLoadingWordDetails = false;
      }
    },
    
    // Display word details in a modal
    displayWordDetailsModal(word, details) {
      // Create modal element
      let modal = document.getElementById('word-details-modal');
      
      // If modal doesn't exist, create it
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'word-details-modal';
        document.body.appendChild(modal);
      }
      
      // Set content
      modal.innerHTML = `
        <div class="word-details-content">
          <div class="word-details-header">
            <h2>${word}</h2>
            <button class="close-button" onclick="document.getElementById('word-details-modal').style.display='none'">×</button>
          </div>
          <div class="word-details-body">
            <div class="detail-section">
              <h3>Gloss</h3>
              <p>${details.gloss || 'Not available'}</p>
            </div>
            <div class="detail-section">
              <h3>Etymology</h3>
              <p>${details.etymology || 'Not available'}</p>
            </div>
            <div class="detail-section">
              <h3>Related Words/Derivations</h3>
              <p>${this.formatDerivations(details.derivations)}</p>
            </div>
            <div class="detail-section">
              <h3>Grammar</h3>
              <p>${this.formatGrammar(details.grammar) || 'Not available'}</p>
            </div>
            <div class="detail-section">
              <h3>Notes</h3>
              <p>${details.notes || 'None available'}</p>
            </div>
          </div>
        </div>
      `;
      
      // Display the modal
      modal.style.display = 'flex';
      
      // Add event listener to close when clicking outside
      modal.addEventListener('click', function(event) {
        if (event.target === modal) {
          modal.style.display = 'none';
        }
      });
    },
    
    // Format derivations data for display
    formatDerivations(derivations) {
      let formattedString = 'None available'; // Use a variable to hold the intermediate result

      if (!derivations) return formattedString; // Return default early

      try {
        // Check if it's a string that contains JSON (starts with [ or {)
        if (typeof derivations === 'string' &&
            (derivations.trim().startsWith('[') || derivations.trim().startsWith('{'))) {
          try {
            // Try to parse it as JSON
            const parsedData = JSON.parse(derivations);
            // Call the function again with the parsed data
            formattedString = this.formatDerivations(parsedData); // Assign result
          } catch (e) {
            console.warn("Failed to parse JSON string in derivations, treating as plain string:", derivations);
            // Continue with normal string handling if parsing fails
            formattedString = derivations; // Assign original string
          }
        }
        // Special case for "cognates:" string which might contain JSON-like data
        else if (typeof derivations === 'string' && derivations.includes('cognates:')) {
          try {
            // Extract the part after "cognates:"
            const potentialJsonPart = derivations.substring(derivations.indexOf('cognates:') + 'cognates:'.length).trim();
            // Check if it looks like an array or object
            if (potentialJsonPart.startsWith('[') || potentialJsonPart.startsWith('{')) {
              const parsedData = JSON.parse(potentialJsonPart);

              // Format array of cognate objects specifically
              if (Array.isArray(parsedData)) {
                formattedString = parsedData.map(item => {
                  if (item && typeof item === 'object' && item.language && item.word) {
                     let result = `<strong>${item.language}</strong>: ${item.word}`;
                     if (item.meaning) result += `, ${item.meaning}`;
                     else if (item.origin) result += `, ${item.origin}`;
                     return result;
                  } else if (typeof item === 'string'){
                      return item; // Return simple string cognates directly
                  }
                  // Fallback for unexpected item format in array
                  return JSON.stringify(item);
                }).join('<br>');
              } else {
                 // If parsed data is not an array, treat as object or fallback stringify
                 formattedString = this.formatGrammar(parsedData); // Use grammar formatter for objects
              }
            } else {
              // If it doesn't look like JSON, treat the whole string as plain text
              formattedString = derivations;
            }
          } catch (e) {
            console.warn("Failed to parse cognates data, treating as plain string:", derivations, e);
            formattedString = derivations; // Assign original string on error
          }
        }
        // If it's a regular string, assign it directly
        else if (typeof derivations === 'string') {
          formattedString = derivations;
        }
        // Handle array of objects (potentially cognates already parsed)
        else if (Array.isArray(derivations) && derivations.length > 0 && typeof derivations[0] === 'object') {
           formattedString = derivations.map(item => {
             if (item && typeof item === 'object' && item.language && item.word) {
                let result = `<strong>${item.language}</strong>: ${item.word}`;
                if (item.meaning) result += `, ${item.meaning}`;
                else if (item.origin) result += `, ${item.origin}`;
                return result;
             } else if (typeof item === 'string'){
                return item; // Handle string items in the array
             }
             // Fallback for unexpected item format in array
             return JSON.stringify(item);
           }).join('<br>');
        }
        // If it's a simple array of strings, join with commas
        else if (Array.isArray(derivations)) {
          formattedString = derivations.join(', ');
        }
        // If it's an object (which might cause [object Object])
        else if (typeof derivations === 'object' && derivations !== null) {
          // Use the grammar formatter logic for a nicer object display
          formattedString = this.formatGrammar(derivations);
        }
        // Fallback for other types
        else {
          formattedString = String(derivations);
        }

      } catch (error) {
         console.error("Error during derivations formatting:", error);
         // Fallback to original input or error message
         formattedString = typeof derivations === 'string' ? derivations : JSON.stringify(derivations);
         formattedString = `Error formatting: ${formattedString}`;
      }

      // --- ADDED CLEANING STEP ---
      // Remove square brackets and double/single quotes from the final string
      // Be careful not to remove brackets/quotes if they are part of HTML tags (like <strong>)
      // We can do this by temporarily replacing HTML tags, cleaning, then restoring.
      const tagPlaceholder = '___HTMLTAG___';
      const tags = formattedString.match(/<[^>]*>/g) || [];
      let tempString = formattedString;
      tags.forEach((tag, index) => {
          tempString = tempString.replace(tag, `${tagPlaceholder}${index}`);
      });

      // Now remove the unwanted characters from the non-tag parts
      tempString = tempString.replace(/\[|\]|"|'/g, '');

      // Restore the HTML tags
      tags.forEach((tag, index) => {
          tempString = tempString.replace(`${tagPlaceholder}${index}`, tag);
      });

      return tempString || 'None available'; // Return the cleaned string or default
    },
    
    // Format grammar data for display
    formatGrammar(grammar) {
      if (!grammar) return 'Not available';
      
      // If it's a string, return it directly
      if (typeof grammar === 'string') return grammar;
      
      // If it's an object, format it nicely
      if (typeof grammar === 'object') {
        try {
          let result = '';
          for (const key in grammar) {
            if (grammar.hasOwnProperty(key)) {
              let value = grammar[key];
              // Handle nested objects
              if (typeof value === 'object' && value !== null) {
                value = Object.entries(value)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ');
              }
              result += `<strong>${key}</strong>: ${value}<br>`;
            }
          }
          return result || 'Not available';
        } catch (e) {
          console.error("Error formatting grammar object:", e);
          return JSON.stringify(grammar);
        }
      }
      
      // Fallback
      return String(grammar);
    },
    
    // Print the interlinear translation with margin notes
    printInterlinear() {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow pop-ups for printing functionality');
        return;
      }
      
      // Get the readable translation
      const readableText = this.translationResult.readable.join(' ');
      
      // Get interlinear content
      const interlinearContent = document.querySelector('.interlinear-content').cloneNode(true);
      
      // Create print HTML with both interlinear and readable in margin
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Interlinear Translation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .print-container {
              display: flex;
            }
            .interlinear-section {
              flex: 3;
              padding-right: 20px;
            }
            .readable-section {
              flex: 1;
              padding: 10px;
              background-color: #f9f9f9;
              border-left: 1px solid #ccc;
              font-size: 0.85em;
            }
            .interlinear-word {
              display: inline-block;
              margin: 0 5px 10px 0;
              vertical-align: top;
            }
            .original {
              font-weight: bold;
            }
            .translation {
              color: #666;
              font-size: 0.9em;
            }
            .chunk {
              margin-bottom: 20px;
            }
            .chunk-separator {
              height: 1px;
              background-color: #ddd;
              margin: 15px 0;
            }
            .word-container {
              display: flex;
              flex-wrap: wrap;
            }
            
            /* Print-specific styles */
            @media print {
              body {
                font-size: 12pt;
              }
              .readable-section {
                font-size: 10pt;
              }
              .no-print {
                display: none;
              }
            }
            
            /* Add speaker change indicator for print */
            .speaker-change {
              margin-top: 15px;
            }
            .speaker-change-indicator {
              width: 100%;
              height: 10px;
              margin: 8px 0;
            }
            
            /* Header for the document */
            .print-header {
              padding: 10px 0;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            
            /* Action buttons */
            .print-actions {
              text-align: right;
              margin-bottom: 20px;
            }
            .print-button {
              background-color: #4361ee;
              color: white;
              border: none;
              padding: 8px 15px;
              border-radius: 4px;
              cursor: pointer;
            }
          </style>
</head>
    <body>
      <div class="print-header">
        <h1>Interlinear Translation</h1>
        <p>Source Language: ${this.getLanguageName(this.sourceLanguage)} | Target Language: ${this.getLanguageName(this.targetLanguage)}</p>
      </div>
      
      <div class="print-actions no-print">
        <button class="print-button" onclick="window.print()">Print Document</button>
      </div>
      
      <div class="print-container">
        <div class="interlinear-section">
          <h2>Interlinear Translation</h2>
          ${interlinearContent.outerHTML}
        </div>
        
        <div class="readable-section">
          <h2>Readable Translation</h2>
          <div>
            ${this.translationResult.readable.map(s => `<p>${s}</p>`).join('')}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Write to the new window
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Optional: Wait for resources to load then print
  printWindow.onload = function() {
    // Uncomment to automatically print
    // printWindow.print();
  };
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

/* Styling for action buttons in pane headers */
.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pane-actions {
  display: flex;
  gap: 5px;
}

.action-button {
  background: none;
  border: none;
  color: #4361ee;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: rgba(67, 97, 238, 0.1);
}

.action-icon {
  font-size: 1.2rem;
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
  cursor: pointer;
}

/* Word details modal styles */
#word-details-modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  justify-content: center;
  align-items: center;
}

.word-details-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalFadeIn 0.3s;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.word-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.word-details-header h2 {
  margin: 0;
  font-size: 1.6rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0 5px;
}

.close-button:hover {
  color: #333;
}

.word-details-body {
  padding: 20px;
}

.detail-section {
  margin-bottom: 15px;
}

.detail-section h3 {
  margin: 0 0 5px 0;
  font-size: 1rem;
  color: #555;
}

.detail-section p {
  margin: 0;
  line-height: 1.5;
}
</style>