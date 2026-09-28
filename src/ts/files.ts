import { DEFAULT_EXTENSIONS } from "./editor";
import { EditorState } from "@codemirror/state";
import { EditorView } from "codemirror";


const fileStateCache = new Map<string, EditorState>();
let activeFilePath: string | null = null;
let currentAbortController: AbortController | null = null;


export async function loadFile(editorView: EditorView, filePath: string): Promise<void> {
    if (activeFilePath === filePath) return;

    // Save current document state before switching away
    if (activeFilePath)
        fileStateCache.set(activeFilePath, editorView.state);

    // Cache switch if already loaded in session
    const cachedState = fileStateCache.get(filePath);
    if (cachedState) {
        activeFilePath = filePath;
        editorView.setState(cachedState);
        return;
    }

    // Abort prior in-flight network request if user clicks quickly
    if (currentAbortController)
        currentAbortController.abort();
    
    currentAbortController = new AbortController();

    try {
        const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`, {
            signal: currentAbortController.signal
        });

        if (!response.ok)
            throw new Error(`Server returned ${response.status}`);

        const content = await response.text();
        const newState = EditorState.create({
            doc: content,
            extensions: DEFAULT_EXTENSIONS
        });

        fileStateCache.set(filePath, newState);
        activeFilePath = filePath;
        editorView.setState(newState);
        
    } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError")
            return; // Request deliberately canceled; ignore

        console.error("Failed to load file:", err);
    }
}
