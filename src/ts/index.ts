import "../css/index.css";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { keymap } from "@codemirror/view";


const initialMarkdown = "# Markdown";


const elm = document.getElementById("editor")!;
const state = EditorState.create({
    doc: initialMarkdown,
    extensions: [
        basicSetup,
        markdown(),
        keymap.of([
            ...markdownKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            indentWithTab
        ]),
        EditorView.lineWrapping // remove?
    ]
});

new EditorView({
    state, parent: elm
});
