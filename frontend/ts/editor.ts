import { defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { EditorState, type Extension } from "@codemirror/state";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { render } from "./renderer";
import { api } from "./pagesApi";
import { activeFilePath } from "./files";


const preview = document.getElementById("preview")!;


let saveTimeoutId: number | undefined;
let abortController: AbortController | null = null;


// Auto-save
function autoSave(text: string): void {
    if (abortController) {
        abortController.abort();
        abortController = null;
        return;
    }
    
    if (saveTimeoutId !== undefined)
        window.clearTimeout(saveTimeoutId);

    status.textContent = "Waiting...";

    saveTimeoutId = window.setTimeout( async () => {
        status.textContent = "Saving...";
        abortController = new AbortController();
        
        const response = await api.saveFile(activeFilePath!, text);
        if (!response.success)
            return alert(response.error);

        status.textContent = "Saved";

    }, 1000);
}


// Debounce helper to prevent reparsing on every key event
export function debounce<T extends (... args: any[]) => void>(fn: T, delayMs: number) {
    let timer: number | undefined;

    return (...args: Parameters<T>) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => fn(...args), delayMs);
    }
}


// Preview
export const renderPreview = debounce((text: string) => {
    preview.innerHTML = render(text);
}, 100);


const livePreview = EditorView.updateListener.of((update) => {
    if (!update.docChanged) return;
    const newContent = update.state.doc.toString()

    renderPreview(newContent);
    autoSave(newContent);
});


export const DEFAULT_EXTENSIONS: Extension[] = [
    livePreview,
    basicSetup,
    markdown(),
    keymap.of([
        ...markdownKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab
    ]),
    EditorView.lineWrapping // remove?
];

export const DEFAULT_STATE = EditorState.create({
    extensions: DEFAULT_EXTENSIONS
});


const elm = document.getElementById("editor")!;
const status = document.getElementById("save-status")!;

export const view = new EditorView({
    state: DEFAULT_STATE, parent: elm
});
