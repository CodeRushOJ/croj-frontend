// src/services/MonacoEditorService.js
let monacoInstance = null;
let isLoading = false;
const modelCache = new Map();
const loadingCallbacks = [];

/**
 * Monaco Editor Service - Singleton pattern
 * Loads Monaco Editor only once and manages models efficiently
 */
export const MonacoEditorService = {
  /**
   * Get Monaco instance (load if needed)
   * @returns {Promise} Promise resolving to monaco instance
   */
  async getMonaco() {
    if (monacoInstance) {
      return monacoInstance;
    }

    if (isLoading) {
      return new Promise((resolve) => {
        loadingCallbacks.push(resolve);
      });
    }

    isLoading = true;

    try {
      // Dynamically import Monaco Editor
      const monaco = await import("monaco-editor");
      monacoInstance = monaco;

      // Register language features once
      this.registerLanguageFeatures(monaco);

      // Notify all waiting callbacks
      loadingCallbacks.forEach((callback) => callback(monaco));
      loadingCallbacks.length = 0;

      return monaco;
    } catch (error) {
      console.error("Failed to load Monaco Editor:", error);
      isLoading = false;
      throw error;
    }
  },

  /**
   * Get or create a model for a language
   * @param {Object} monaco - Monaco instance
   * @param {string} language - Programming language
   * @param {string} value - Initial content
   * @returns {Object} Monaco model
   */
  getOrCreateModel(monaco, language, value) {
    const cacheKey = `${language}-model`;

    // Check if model exists in cache
    if (modelCache.has(cacheKey)) {
      const cachedModel = modelCache.get(cacheKey);

      // Update content without triggering undo stack
      const fullRange = cachedModel.getFullModelRange();
      cachedModel.pushEditOperations(
        [],
        [{ range: fullRange, text: value }],
        () => null
      );

      return cachedModel;
    }

    // Create new model
    const model = monaco.editor.createModel(value, language);
    modelCache.set(cacheKey, model);

    return model;
  },

  /**
   * Dispose of all cached models
   */
  disposeAllModels() {
    modelCache.forEach((model) => model.dispose());
    modelCache.clear();
  },

  /**
   * Register language features (completions, error highlighting)
   * @param {Object} monaco - Monaco instance
   */
  registerLanguageFeatures(monaco) {
    // Register C++ features
    monaco.languages.registerCompletionItemProvider("cpp", {
      provideCompletionItems: function (model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          {
            label: "cout",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "cout << ${1:value} << endl;",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Standard output",
            range: range,
          },
          {
            label: "cin",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "cin >> ${1:variable};",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Standard input",
            range: range,
          },
          {
            label: "for",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "for (int ${1:i} = 0; ${1:i} < ${2:size}; ${1:i}++) {\n\t${3}\n}",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "For loop",
            range: range,
          },
          {
            label: "vector",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "vector<${1:int}> ${2:vec};",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Vector declaration",
            range: range,
          },
        ];
        return { suggestions };
      },
    });

    // Register Java features
    monaco.languages.registerCompletionItemProvider("java", {
      provideCompletionItems: function (model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          {
            label: "sout",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "System.out.println(${1:value});",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Print to console",
            range: range,
          },
          {
            label: "for",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "for (int ${1:i} = 0; ${1:i} < ${2:size}; ${1:i}++) {\n\t${3}\n}",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "For loop",
            range: range,
          },
        ];
        return { suggestions };
      },
    });

    // Register Python features
    monaco.languages.registerCompletionItemProvider("python", {
      provideCompletionItems: function (model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          {
            label: "print",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "print(${1:value})",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Print to console",
            range: range,
          },
          {
            label: "for",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "for ${1:item} in ${2:iterable}:\n\t${3:pass}",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "For loop",
            range: range,
          },
          {
            label: "def",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "def ${1:function_name}(${2:parameters}):\n\t${3:pass}",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Define function",
            range: range,
          },
        ];
        return { suggestions };
      },
    });

    // Register JavaScript features
    monaco.languages.registerCompletionItemProvider("javascript", {
      provideCompletionItems: function (model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          {
            label: "console.log",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "console.log(${1:value});",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Log to console",
            range: range,
          },
          {
            label: "for",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "for (let ${1:i} = 0; ${1:i} < ${2:array.length}; ${1:i}++) {\n\t${3}\n}",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "For loop",
            range: range,
          },
        ];
        return { suggestions };
      },
    });

    // Register Go features
    monaco.languages.registerCompletionItemProvider("go", {
      provideCompletionItems: function (model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          {
            label: "fmt.Println",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "fmt.Println(${1:value})",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Print to standard output",
            range: range,
          },
          {
            label: "for",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "for ${1:i} := 0; ${1:i} < ${2:count}; ${1:i}++ {\n\t${3}\n}",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "For loop",
            range: range,
          },
        ];
        return { suggestions };
      },
    });
  },
};

export default MonacoEditorService;
