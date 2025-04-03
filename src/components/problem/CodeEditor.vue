<!-- src/components/problem/CodeEditor.vue -->
<template>
    <div class="code-editor-container">
        <div class="editor-toolbar">
            <div class="language-selector">
                <el-select v-model="selectedLanguage" @change="handleLanguageChange" size="large"
                    :placeholder="$t('problems.select_language')">
                    <el-option v-for="lang in supportedLanguages" :key="lang.value" :label="lang.label"
                        :value="lang.value">
                        <div class="language-option">
                            <el-icon class="language-icon">
                                <component :is="lang.icon" />
                            </el-icon>
                            <span>{{ lang.label }}</span>
                        </div>
                    </el-option>
                </el-select>
            </div>
            <div class="toolbar-actions">
                <el-button type="primary" @click="formatCode" size="large">
                    <el-icon>
                        <Brush />
                    </el-icon>
                    {{ $t('problems.format_code') }}
                </el-button>
                <el-button @click="resetCode" size="large">
                    <el-icon>
                        <Refresh />
                    </el-icon>
                    {{ $t('problems.reset_template') }}
                </el-button>
            </div>
        </div>

        <div class="editor-wrapper" ref="editorContainer" :class="{ 'editor-loading': initializing }">
            <div v-if="initializing" class="editor-loading-indicator">
                <el-icon class="is-loading">
                    <Loading />
                </el-icon>
                <span>{{ $t('problems.initializing_editor') }}</span>
            </div>
        </div>

        <div class="editor-footer">
            <el-button type="primary" :loading="submitting" @click="submitCode" size="large">
                <el-icon>
                    <Upload />
                </el-icon>
                {{ $t('problems.submit_solution') }}
            </el-button>
            <el-button @click="runCode" size="large" :disabled="runningCode">
                <el-icon :class="{ 'is-loading': runningCode }">
                    <VideoPlay v-if="!runningCode" />
                    <Loading v-else />
                </el-icon>
                {{ runningCode ? $t('problems.running_code') : $t('problems.run_code') }}
            </el-button>
            <div class="submission-info" v-if="lastSubmissionTime">
                <el-icon>
                    <Clock />
                </el-icon>
                <span>{{ $t('problems.last_submitted') }}: {{ formatDate(lastSubmissionTime) }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Brush, Refresh, Upload, VideoPlay, Loading, Clock } from '@element-plus/icons-vue';
import MonacoEditorService from '@/services/MonacoEditorService';

const props = defineProps({
    problem: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['submit']);

const { t } = useI18n();
const editorContainer = ref(null);
const editor = ref(null);
const monaco = ref(null);
const selectedLanguage = ref('cpp');
const submitting = ref(false);
const runningCode = ref(false);
const lastSubmissionTime = ref(null);
const initializing = ref(true);
const editorInitialized = ref(false);
const visible = ref(false);
const observer = ref(null);

// Get language templates
const getLanguageTemplate = (language) => {
    const templates = {
        cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

// Problem: ${props.problem?.problemNo} - ${props.problem?.title}

int main() {
  // Your code here
  
  return 0;
}`,
        java: `import java.util.*;

public class Solution {
  // Problem: ${props.problem?.problemNo} - ${props.problem?.title}
  
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    
    // Your code here
    
    scanner.close();
  }
}`,
        python: `# Problem: ${props.problem?.problemNo} - ${props.problem?.title}

def solve():
  # Your code here
  pass

if __name__ == "__main__":
  solve()`,
        javascript: `// Problem: ${props.problem?.problemNo} - ${props.problem?.title}

function solve() {
  // Your code here
}

solve();`,
        go: `package main

import (
  "fmt"
)

// Problem: ${props.problem?.problemNo} - ${props.problem?.title}

func main() {
  // Your code here
}`,
    };

    return templates[language] || '';
};

// Supported languages array with icons
const supportedLanguages = computed(() => [
    { label: 'C++', value: 'cpp', icon: 'Cpu' },
    { label: 'Java', value: 'java', icon: 'Coffee' },
    { label: 'Python', value: 'python', icon: 'Terminal' },
    { label: 'JavaScript', value: 'javascript', icon: 'Document' },
    { label: 'Go', value: 'go', icon: 'Document' },
]);

// Initialize editor (only called when component is visible)
const initializeEditor = async () => {
    if (!editorContainer.value || editorInitialized.value) return;

    initializing.value = true;

    try {
        // Get Monaco instance from service
        monaco.value = await MonacoEditorService.getMonaco();

        // Wait for next tick to ensure DOM is updated
        await nextTick();

        // Get model from service (efficiently reused)
        const model = MonacoEditorService.getOrCreateModel(
            toRaw(monaco.value),
            selectedLanguage.value,
            getLanguageTemplate(selectedLanguage.value)
        );

        // Create editor instance
        editor.value = toRaw(monaco.value).editor.create(editorContainer.value, {
            model: model,
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            wordWrap: 'on',
            suggestOnTriggerCharacters: true,
            formatOnPaste: true,
            formatOnType: true,
            scrollbar: {
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
                alwaysConsumeMouseWheel: false
            },
            renderWhitespace: 'none',
            overviewRulerBorder: false,
            renderLineHighlight: 'line',
            fontLigatures: true,
            snippetSuggestions: 'top',
            mouseWheelZoom: true
        });

        editorInitialized.value = true;

        // Focus editor after initialization
        toRaw(editor.value).focus();
    } catch (error) {
        console.error("Failed to initialize editor:", error);
        ElMessage.error(t('problems.editor_load_error'));
    } finally {
        initializing.value = false;
    }
};

// Format code
const formatCode = async () => {
    if (!editor.value) return;

    try {
        await toRaw(editor.value).getAction('editor.action.formatDocument')?.run();
        ElMessage.success(t('problems.code_formatted'));
    } catch (error) {
        console.error("Error formatting code:", error);
        ElMessage.error(t('problems.format_error'));
    }
};

// Reset code to template
const resetCode = () => {
    if (!editor.value || !monaco.value) return;

    try {
        const template = getLanguageTemplate(selectedLanguage.value);
        const model = toRaw(editor.value).getModel();

        if (model) {
            // Use edit operations for better performance
            const fullRange = model.getFullModelRange();
            toRaw(editor.value).pushUndoStop();
            toRaw(editor.value).executeEdits('reset', [
                { range: fullRange, text: template }
            ]);
            toRaw(editor.value).pushUndoStop();

            // Position cursor after the "Your code here" comment
            const lines = template.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('Your code here')) {
                    const indent = lines[i].indexOf('Your');
                    toRaw(editor.value).setPosition({ lineNumber: i + 1, column: indent });
                    toRaw(editor.value).focus();
                    break;
                }
            }
        }

        ElMessage.info(t('problems.code_reset'));
    } catch (error) {
        console.error("Error resetting code:", error);
        ElMessage.error(t('problems.reset_error'));
    }
};

// Handle language change
const handleLanguageChange = async (language) => {
    if (!editor.value || !monaco.value) return;

    try {
        // Save scroll and cursor position
        const rawEditor = toRaw(editor.value);
        const scrollPosition = rawEditor.getScrollPosition();
        const viewState = rawEditor.saveViewState();

        // Get model for the new language
        const template = getLanguageTemplate(language);
        const model = MonacoEditorService.getOrCreateModel(
            toRaw(monaco.value),
            language,
            template
        );

        // Set the new model
        rawEditor.setModel(model);

        // Try to restore view state if appropriate
        if (viewState) {
            rawEditor.restoreViewState(viewState);
            rawEditor.setScrollPosition(scrollPosition);
        }

        // Focus editor
        rawEditor.focus();
    } catch (error) {
        console.error("Error changing language:", error);
        ElMessage.error(t('problems.language_change_error'));
    }
};

// Submit code
const submitCode = async () => {
    if (!editor.value) return;

    submitting.value = true;
    try {
        const code = toRaw(editor.value).getValue();

        // TODO: Implement actual submission API call
        console.log('Submitting code:', code);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        lastSubmissionTime.value = new Date();
        ElMessage.success(t('problems.submission_success'));

        // Emit submission event
        emit('submit', {
            code,
            language: selectedLanguage.value,
            problemId: props.problem.id
        });
    } catch (error) {
        console.error('Error submitting code:', error);
        ElMessage.error(t('problems.submission_error'));
    } finally {
        submitting.value = false;
    }
};

// Run code
const runCode = async () => {
    if (!editor.value) return;

    runningCode.value = true;
    try {
        const code = toRaw(editor.value).getValue();

        // TODO: Implement actual code running API call
        console.log('Running code:', code);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        ElMessage.success(t('problems.run_success'));
    } catch (error) {
        console.error('Error running code:', error);
        ElMessage.error(t('problems.run_error'));
    } finally {
        runningCode.value = false;
    }
};

// Format date
const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString();
};

// Set up intersection observer to initialize editor only when visible
const setupVisibilityObserver = () => {
    if (!editorContainer.value || !window.IntersectionObserver) return;

    observer.value = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
            visible.value = true;

            // Initialize editor if not already done
            if (!editorInitialized.value) {
                initializeEditor();
            }

            // Disconnect observer after initialization
            observer.value.disconnect();
        }
    }, { threshold: 0.1 });

    observer.value.observe(editorContainer.value);
};

// On component mount
onMounted(() => {
    // Check if editor tab is initially visible
    if (props.problem) {
        setupVisibilityObserver();

        // If browser doesn't support IntersectionObserver, initialize directly
        if (!window.IntersectionObserver) {
            nextTick(() => {
                initializeEditor();
            });
        }
    }
});

// Clean up when component is unmounted
onBeforeUnmount(() => {
    if (editor.value) {
        // Just dispose the editor instance, but keep the model in cache
        toRaw(editor.value).dispose();
    }

    if (observer.value) {
        observer.value.disconnect();
    }
});
</script>

<style scoped>
.code-editor-container {
    display: flex;
    flex-direction: column;
    height: 600px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-color-secondary);
    overflow: hidden;
}

.editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: var(--bg-color);
    border-bottom: 1px solid var(--border-color);
}

.language-selector {
    width: 200px;
}

.toolbar-actions {
    display: flex;
    gap: 10px;
}

.editor-wrapper {
    flex-grow: 1;
    overflow: hidden;
    position: relative;
}

.editor-loading {
    display: flex;
    justify-content: center;
    align-items: center;
}

.editor-loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: var(--text-color-secondary);
}

.editor-loading-indicator .el-icon {
    font-size: 24px;
}

.editor-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: var(--bg-color);
    border-top: 1px solid var(--border-color);
}

.language-option {
    display: flex;
    align-items: center;
    gap: 8px;
}

.language-icon {
    font-size: 18px;
}

.submission-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-color-secondary);
    font-size: 14px;
}

/* Responsive styles */
@media (max-width: 768px) {

    .editor-toolbar,
    .editor-footer {
        flex-direction: column;
        gap: 10px;
    }

    .language-selector,
    .toolbar-actions {
        width: 100%;
    }

    .editor-footer {
        padding: 15px 10px;
    }
}
</style>