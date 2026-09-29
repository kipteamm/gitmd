import markedKatex from "marked-katex-extension";
import { Marked } from "marked";
import hljs from "highlight.js";


const marked = new Marked(
    markedKatex({
        throwOnError: false,
        nonStandard: true,
        output: "html"
    })
);

marked.setOptions({
    breaks: true,
    gfm: true,
});

// Custom renderer for codeblocks using highlight.js
marked.use({
    renderer: {
        code({ text, lang}) {
            const validLang = lang && hljs.getLanguage(lang) ? lang : undefined;
            const highlighted = validLang
                ? hljs.highlight(text, { language: validLang }).value
                : hljs.highlightAuto(text).value
            
            return `<pre><code class="hljs ${validLang ?? ''}">${highlighted}</code></pre>`;
        }
    }
});

export function render(source: string): string {
    if (!source.trim()) return "";

    const rawHTML = marked.parse(source) as string;
    
    return rawHTML;
    // return DOMPurify.sanitize(rawHTML)
}
