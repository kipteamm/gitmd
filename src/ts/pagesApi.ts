interface FileApiResult {
    success: boolean;
    error?: string;
}

export class FileTreeApi {
    private baseUrl = "/api/file";

    public async saveFile(path: string, content: string): Promise<FileApiResult> {
        return this.request("/save", { method: "PUT", body: JSON.stringify({ path, content }) });
    }

    public async createFile(folderPath: string, name: string): Promise<FileApiResult> {
        return this.request("/create", { method: "POST", body: JSON.stringify({ folderPath, name, type: "file" }) });
    }

    public async createFolder(folderPath: string, name: string): Promise<FileApiResult> {
        return this.request("/create", { method: "POST", body: JSON.stringify({ folderPath, name, type: "directory" }) });
    }

    public async rename(path: string, newName: string): Promise<FileApiResult> {
        return this.request("/rename", { method: "PATCH", body: JSON.stringify({ path, newName }) });
    }

    public async delete(path: string): Promise<FileApiResult> {
        return this.request("/delete", { method: "DELETE", body: JSON.stringify({ path }) });
    }

    public async move(sourcePath: string, destinationDir: string): Promise<FileApiResult> {
        return this.request("/move", { method: "POST", body: JSON.stringify({ sourcePath, destinationDir }) });
    }

    public async copy(sourcePath: string, destinationDir: string): Promise<FileApiResult> {
        return this.request("/copy", { method: "POST", body: JSON.stringify({ sourcePath, destinationDir }) });
    }

    private async request(endpoint: string, options: RequestInit): Promise<FileApiResult> {
        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: { "Content-Type": "application/json", ...(options.headers || {}) }
            });

            if (res.ok)
                return { success: true };

            const data = await res.json().catch(() => ({}));
            return { success: false, error: data.message || `Request failed with status ${res.status}` };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : "Network error" };
        }
    }
}

export const api = new FileTreeApi();
