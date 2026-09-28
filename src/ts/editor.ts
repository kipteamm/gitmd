import { defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { EditorState, type Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { EditorView, basicSetup } from "codemirror";


const initialMarkdown = "# Markdown";

export const DEFAULT_EXTENSIONS: Extension[] = [
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
