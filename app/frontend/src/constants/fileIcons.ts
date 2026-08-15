// src/constants/fileIcons.ts
export const MIME_ICON_MAP: Record<string, string> = {
    // Documents or Text
    "text/markdown": "mdi-language-markdown",
    "text/x-markdown": "mdi-language-markdown",
    "text/plain": "mdi-text",
    "application/pdf": "mdi-file-pdf-box",
    "application/json": "mdi-code-json",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "mdi-file-word",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "mdi-file-excel",

    // Media
    "image/": "mdi-file-image",
    "audio/": "mdi-file-music",
    "video/": "mdi-file-video",

    // Default and Other
    "application/zip": "mdi-folder-zip",
    default: "mdi-file-document-outline",
};
