// src/composables/useFileActions.ts
import { ref } from "vue";
import { fileApi, type FileItem } from "@/services/api";
import { decryptData } from "@/utils/encryption";

export function useFileActions(
    showSnackbar: (msg: string, color?: "success" | "error") => void,
) {
    const isDecrypting = ref(false);
    const isPasswordDialogOpen = ref(false);
    const fileToDecrypt = ref<FileItem | null>(null);
    const pendingAction = ref<"download" | "preview">("download");

    const previewUrl = ref<string | null>(null);
    const previewTextContent = ref<string | null>(null);
    const fileToPreview = ref<FileItem | null>(null);
    const isPreviewDialogOpen = ref(false);

    const prepareFileAccess = async (
        file: FileItem,
        action: "download" | "preview",
    ) => {
        pendingAction.value = action;
        try {
            const response = await fileApi.GetDownloadsUrl(String(file.id));
            const { downloadUrl, isEncrypted, encryptionMetadata } =
                response as any;

            if (isEncrypted) {
                fileToDecrypt.value = {
                    ...file,
                    downloadUrl,
                    encryptionMetadata,
                } as any;
                isPasswordDialogOpen.value = true;
            } else {
                await handleUnencryptedAccess(file, downloadUrl, action);
            }
        } catch (error) {
            console.error("Failed to get file URL", error);
            showSnackbar("Failed to access file.", "error");
        }
    };

    const handleUnencryptedAccess = async (
        file: FileItem,
        downloadUrl: string,
        action: "download" | "preview",
    ) => {
        if (action === "preview") {
            const mimeType = file.mimeType || "";
            const isTextFile =
                mimeType.startsWith("text/") ||
                mimeType === "application/json" ||
                mimeType === "application/javascript" ||
                file.originalName.endsWith(".md") ||
                file.originalName.endsWith(".txt") ||
                file.originalName.endsWith(".json");

            if (isTextFile) {
                const res = await fetch(downloadUrl);
                previewTextContent.value = await res.text();
                previewUrl.value = null;
            } else {
                previewUrl.value = downloadUrl;
                previewTextContent.value = null;
            }

            fileToPreview.value = file;
            isPreviewDialogOpen.value = true;
        } else {
            window.open(downloadUrl, "_blank");
        }
    };

    const confirmDecryptAndAction = async (password: string) => {
        if (!fileToDecrypt.value) return;

        isDecrypting.value = true;
        try {
            const {
                downloadUrl,
                encryptionMetadata,
                originalName,
                mimeType: rawMimeType,
            } = fileToDecrypt.value as any;

            const res = await fetch(downloadUrl);
            const textData = await res.text();

            let ciphertextB64: string;
            try {
                ciphertextB64 = JSON.parse(textData).ciphertext;
            } catch {
                ciphertextB64 = textData;
            }

            const decryptedBuffer = await decryptData(
                password,
                ciphertextB64,
                encryptionMetadata.salt,
                encryptionMetadata.iv,
            );

            const mimeType = rawMimeType || "";
            const isTextFile =
                mimeType.startsWith("text/") ||
                mimeType === "application/json" ||
                mimeType === "application/javascript" ||
                originalName.endsWith(".md") ||
                originalName.endsWith(".txt") ||
                originalName.endsWith(".json");

            const fileData = isTextFile
                ? new TextDecoder().decode(decryptedBuffer)
                : decryptedBuffer;
            const blob = new Blob([fileData], {
                type: mimeType || "application/octet-stream",
            });
            const blobUrl = window.URL.createObjectURL(blob);

            if (pendingAction.value === "preview") {
                if (isTextFile) {
                    previewTextContent.value = fileData as string;
                    previewUrl.value = null;
                } else {
                    previewUrl.value = blobUrl;
                    previewTextContent.value = null;
                }
                fileToPreview.value = fileToDecrypt.value;
                isPasswordDialogOpen.value = false;
                isPreviewDialogOpen.value = true;
                showSnackbar("File decrypted successfully");
            } else {
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = originalName;
                a.click();
                window.URL.revokeObjectURL(blobUrl);

                isPasswordDialogOpen.value = false;
                fileToDecrypt.value = null;
                showSnackbar("File decrypted and downloaded successfully");
            }
        } catch (error) {
            console.error("Failed to decrypt file:", error);
            showSnackbar(
                "Decryption failed. Incorrect password or corrupted data.",
                "error",
            );
        } finally {
            isDecrypting.value = false;
        }
    };

    const closePreview = () => {
        if (previewUrl.value?.startsWith("blob:")) {
            window.URL.revokeObjectURL(previewUrl.value);
        }
        previewUrl.value = null;
        fileToPreview.value = null;
        previewTextContent.value = null;
        isPreviewDialogOpen.value = false;
    };

    return {
        isDecrypting,
        isPasswordDialogOpen,
        fileToDecrypt,
        previewUrl,
        previewTextContent,
        fileToPreview,
        isPreviewDialogOpen,
        prepareFileAccess,
        confirmDecryptAndAction,
        closePreview,
    };
}
