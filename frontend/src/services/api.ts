export const API_BASE_PATH = "/api/v1";
const FILE_NAME_PATTERN = /filename="([^"]+)"/;
const DEFAULT_FILE_NAME = "download";

export interface DownloadedFile {
    blob: Blob;
    fileName: string;
}

export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, detail: string) {
        super(detail);
        this.name = "ApiError";
        this.status = status;
    }
}

interface ErrorBody {
    detail?: unknown;
}

const readErrorDetail = async (response: Response): Promise<string> => {
    const body: ErrorBody | null = await response.json().catch(() => null);
    return typeof body?.detail === "string" ? body.detail : response.statusText;
};

export class ApiClient {
    protected async get<T>(path: string): Promise<T> {
        const response = await this.request(path, { method: "GET" });
        return response.json();
    }

    protected async post<T>(path: string, body?: unknown): Promise<T> {
        const response = await this.request(path, { method: "POST", ...this.jsonBody(body) });
        return response.json();
    }

    protected async put<T>(path: string, body: unknown): Promise<T> {
        const response = await this.request(path, { method: "PUT", ...this.jsonBody(body) });
        return response.json();
    }

    protected async delete<T>(path: string): Promise<T> {
        const response = await this.request(path, { method: "DELETE" });
        return response.json();
    }

    protected async postForm<T>(path: string, formData: FormData): Promise<T> {
        const response = await this.request(path, { method: "POST", body: formData });
        return response.json();
    }

    protected async getFile(path: string): Promise<DownloadedFile> {
        return this.toDownloadedFile(await this.request(path, { method: "GET" }));
    }

    private async toDownloadedFile(response: Response): Promise<DownloadedFile> {
        const fileName = response.headers.get("Content-Disposition")?.match(FILE_NAME_PATTERN)?.[1] ?? DEFAULT_FILE_NAME;
        return { blob: await response.blob(), fileName };
    }

    private jsonBody(body: unknown): RequestInit {
        if (body === undefined) {
            return {};
        }
        return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
    }

    private async request(path: string, init: RequestInit): Promise<Response> {
        const response = await fetch(`${API_BASE_PATH}${path}`, { ...init, credentials: "same-origin" });
        if (!response.ok) {
            throw new ApiError(response.status, await readErrorDetail(response));
        }
        return response;
    }
}
