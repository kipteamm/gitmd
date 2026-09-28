import { defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { EditorState, type Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { EditorView, basicSetup } from "codemirror";
import { render } from "./renderer";


const initialMarkdown = "# Markdown";
const preview = document.getElementById("preview")!;


// Debounce helper to prevent heavy reparsing on every key event
export function debounce<T extends (... args: any[]) => void>(fn: T, delayMs: number) {
    let timer: number | undefined;

    return (...args: Parameters<T>) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => fn(...args), delayMs);
    }
}

export const renderPreview = debounce((text: string) => {
    preview.innerHTML = render(text);
}, 100);

const livePreview = EditorView.updateListener.of((update) => {
    if (!update.docChanged) return;

    renderPreview(update.state.doc.toString());
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
    doc: initialMarkdown,
    extensions: DEFAULT_EXTENSIONS
});
