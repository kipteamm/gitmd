// @ts-ignore
import "../css/index.css";

import { DEFAULT_STATE } from "./editor";
import { EditorView } from "codemirror";
import { loadFile } from "./files";


const elm = document.getElementById("editor")!;
const view = new EditorView({
    state: DEFAULT_STATE, parent: elm
});


document.getElementById("menu")!.addEventListener("click", () => {
    document.getElementById("nav")!.classList.toggle("active");
});


(document.querySelectorAll(".file") as NodeListOf<HTMLButtonElement>).forEach(elm => {
    elm.addEventListener("click", () => 
        loadFile(view, elm)
    );
});


loadFile(view, (document.getElementById("index-file") as HTMLButtonElement));
