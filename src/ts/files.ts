import { DEFAULT_EXTENSIONS, renderPreview } from "./editor";
import { EditorState } from "@codemirror/state";
import { EditorView } from "codemirror";
import { view } from "./editor";


const fileStateCache = new Map<string, EditorState>();
const pathCrums = document.getElementById("path-crumbs")!;

let activeFilePath: string | null = null;
let currentAbortController: AbortController | null = null;


function updatePage(path: string, state: EditorState, view: EditorView): void {
    window.history.pushState({ path }, "", `#${encodeURIComponent(path)}`);

    const crums = path.split("/");
    let crumbsTrail = "Editing ";

    for (let i = 1; i < crums.length; i++) {
        crumbsTrail += `<span>${crums[i-1]} &rsaquo;</span> `;
    }

    const fileName = crums[crums.length - 1];
    crumbsTrail += fileName.substring(0, fileName.length - 3); // remove .md

    pathCrums.innerHTML = crumbsTrail;

    activeFilePath = path;
    view.setState(state);
    renderPreview(view.state.doc.toString());
}


export async function loadFile(elm: HTMLLIElement): Promise<void> {
    const filePath = elm.dataset.path!;
    if (activeFilePath === filePath) return;

    document.querySelector(".file.active")?.classList.remove("active");
    elm.classList.add("active");

    // Save current document state before switching away
    if (activeFilePath)
        fileStateCache.set(activeFilePath, view.state);

    // Cache switch if already loaded in session
    const cachedState = fileStateCache.get(filePath);
    if (cachedState)
        return updatePage(filePath, cachedState, view);

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
        return updatePage(filePath, newState, view);
        
    } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError")
            return; // Request deliberately canceled; ignore

        console.error("Failed to load file:", err);
    }
}


function loadFromHash(path: string): void {
    console.log(path);

    if (!path) return;
    if (path === activeFilePath) return;

    const elm = document.querySelector(`[data-path="${path}"]`) as HTMLLIElement;
    console.log(`[data-path="${path}"]`, elm);

    loadFile(elm);
}


window.addEventListener("popstate", (event: PopStateEvent) => {
    const path = event.state?.path ?? decodeURIComponent(window.location.hash.slice(1));
    loadFromHash(path);
});


(document.querySelectorAll(".file") as NodeListOf<HTMLLIElement>).forEach(elm => {
    elm.addEventListener("click", () => 
        loadFile(elm)
    );
});


loadFromHash(decodeURIComponent(window.location.hash.slice(1)) || "index.md");
