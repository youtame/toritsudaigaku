// src/utils/getFileIcon.ts
import { MIME_ICON_MAP } from "@/constants/fileIcons";

export function getFileIcon(mimeType: string): string {
    if (MIME_ICON_MAP[mimeType]) {
        return MIME_ICON_MAP[mimeType];
    }

    const prefix = mimeType.split("/")[0] + "/";
    if (MIME_ICON_MAP[prefix]) {
        return MIME_ICON_MAP[prefix];
    }

    return MIME_ICON_MAP["default"];
}
