<!-- src/components/dashboard/RecentFiles.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import VuePdfEmbed from "vue-pdf-embed";
import { fileApi, type FileItem } from "@/services/api";
import { getFileIcon } from "@/utils/getFileIcon";

import FileDetailsDialog from "./FileDetailsDialog.vue";
import ShareDialog from "./ShareDialog.vue";
import DeleteDialog from "./DeleteDialog.vue";
import DecryptDialog from "./DecryptDialog.vue";

import { decryptData } from "@/utils/encryption";

const files = ref<FileItem[]>([]);
const isLoading = ref(true);

const isDeleteDialogOpen = ref(false);
const fileToDelete = ref<FileItem | null>(null);
const isDeleting = ref(false);

const isShareDialogVisible = ref(false);
const fileToShare = ref<FileItem | null>(null);
const targetEmail = ref("");
const isSharing = ref(false);

const isDetailsDialogVisible = ref(false);
const fileDetails = ref<FileItem | null>(null);

const isPasswordDialogOpen = ref(false);
const fileToDecrypt = ref<FileItem | null>(null);
const isDecrypting = ref(false);

const isPreviewDialogOpen = ref(false);
const previewUrl = ref<string | null>(null);
const fileToPreview = ref<FileItem | null>(null);
const pendingAction = ref<"download" | "preview">("download");

const previewTextContent = ref<string | null>(null);

const snackbar = ref({
    show: false,
    message: "",
    color: "success",
});

const showSnackbar = (
    message: string,
    color: "success" | "error" = "success",
) => {
    snackbar.value = {
        show: true,
        message,
        color,
    };
};

const fetchFiles = async () => {
    try {
        const allFiles = await fileApi.getMyFiles();
        files.value = allFiles
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            )
            .slice(0, 5);
    } catch (error) {
        console.error("Failed to fetch recent files", error);
        showSnackbar("Failed to fetch recent files", "error");
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchFiles();
});

const handleDownload = async (file: FileItem) => {
    pendingAction.value = "download";
    await prepareFileAccess(file);
};

const handlePreview = async (file: FileItem) => {
    pendingAction.value = "preview";
    await prepareFileAccess(file);
};

const prepareFileAccess = async (file: FileItem) => {
    console.log("File mimeType:", file.mimeType);
    try {
        const response = await fileApi.GetDownloadsUrl(String(file.id));
        const { downloadUrl, isEncrypted, encryptionMetadata } =
            response as any;

        if (isEncrypted) {
            fileToDecrypt.value = { ...file, downloadUrl, encryptionMetadata };
            isPasswordDialogOpen.value = true;
        } else {
            if (pendingAction.value === "preview") {
                previewUrl.value = downloadUrl;
                fileToPreview.value = file;
                isPreviewDialogOpen.value = true;
            } else {
                window.open(downloadUrl, "_blank");
            }
        }
    } catch (error) {
        console.error("Failed to get file URL", error);
        showSnackbar("Failed to access file.", "error");
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
            const jsonPayload = JSON.parse(textData);
            ciphertextB64 = jsonPayload.ciphertext;
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
        let fileData: ArrayBuffer | string = decryptedBuffer;

        const isTextFile =
            mimeType.startsWith("text/") ||
            mimeType === "application/json" ||
            mimeType === "application/javascript" ||
            originalName.endsWith(".md") ||
            originalName.endsWith(".txt") ||
            originalName.endsWith(".json");

        if (isTextFile) {
            const decoder = new TextDecoder();
            fileData = decoder.decode(decryptedBuffer);
        }

        const blob = new Blob([fileData], {
            type: mimeType || "application/octet-stream",
        });
        const blobUrl = window.URL.createObjectURL(blob);

        // --- 復号が終わったあとに分岐する ---
        if (pendingAction.value === "preview") {
            if (isTextFile) {
                previewTextContent.value = fileData as string; // テキストの内容を格納
                previewUrl.value = null; // テキストなのでURLは不要
            } else {
                previewUrl.value = blobUrl; // 画像やPDFはBlob URLを使用
            }
            fileToPreview.value = fileToDecrypt.value;
            isPasswordDialogOpen.value = false;
            isPreviewDialogOpen.value = true;
            showSnackbar("File decrypted successfully");
        } else {
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = originalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
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

const zoomLevel = ref<number>(1.0);

const zoomIn = () => {
    if (zoomLevel.value < 4.5) {
        zoomLevel.value += 0.25;
    }
};

const zoomOut = () => {
    if (zoomLevel.value > 0.5) {
        zoomLevel.value -= 0.25;
    }
};

const handleClosePreview = () => {
    if (previewUrl.value && previewUrl.value.startsWith("blob:")) {
        window.URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = null;
    fileToPreview.value = null;
    isPreviewDialogOpen.value = false;
    zoomLevel.value = 1.0; // リセット
};

const openDeleteDialog = (file: FileItem) => {
    fileToDelete.value = file;
    isDeleteDialogOpen.value = true;
};

const confirmDelete = async () => {
    if (!fileToDelete.value) return;

    isDeleting.value = true;
    try {
        await fileApi.deleteFile(String(fileToDelete.value.id));
        files.value = files.value.filter(
            (f) => f.id !== fileToDelete.value?.id,
        );
        isDeleteDialogOpen.value = false;
        fileToDelete.value = null;
        showSnackbar("File deleted successfully");
    } catch (error) {
        console.error("Failed to delete file", error);
        showSnackbar("Failed to delete file.", "error");
    } finally {
        isDeleting.value = false;
    }
};

const openShareDialog = (file: FileItem) => {
    fileToShare.value = file;
    targetEmail.value = "";
    isShareDialogVisible.value = true;
};

const openDetailsDialog = (file: FileItem) => {
    fileDetails.value = file;
    isDetailsDialogVisible.value = true;
};

const handleShare = async (targetEmail: string) => {
    if (!fileToShare.value || !targetEmail) return;

    isSharing.value = true;
    try {
        await fileApi.shareFile(String(fileToShare.value.id), targetEmail);
        isShareDialogVisible.value = false;
        fileToShare.value = null;
        showSnackbar("File shared successfully");
    } catch (error) {
        console.error("Failed to share file", error);
        showSnackbar(
            "Failed to share file. Please check the email address.",
            "error",
        );
    } finally {
        isSharing.value = false;
    }
};

defineExpose({
    fetchFiles,
});
</script>

<template>
    <div>
        <p v-if="isLoading" class="text-body-1 py-4 text-center text-grey">
            Loading...
        </p>
        <v-list v-else-if="files.length > 0" class="rounded-lg pa-2">
            <v-list-item
                v-for="file in files"
                :key="String(file.id)"
                class="rounded-lg my-2 px-4 py-3"
            >
                <template v-slot:prepend>
                    <v-icon
                        :icon="
                            file.isEncrypted
                                ? 'mdi-lock'
                                : getFileIcon(file.mimeType)
                        "
                        size="large"
                        :color="
                            file.isEncrypted
                                ? 'lock'
                                : file.isOwner
                                  ? 'primary'
                                  : undefined
                        "
                        class="me-2"
                    ></v-icon>
                </template>

                <v-list-item-title
                    class="d-flex align-center"
                    style="cursor: pointer"
                    @click="handlePreview(file)"
                    title="Click to preview"
                >
                    <span
                        class="text-truncate font-weight-bold text-decoration-underline-hover"
                    >
                        {{ file.originalName }}
                    </span>
                </v-list-item-title>

                <v-list-item-subtitle
                    class="text-body-2 mt-1 text-grey-darken-1"
                >
                    {{ new Date(file.createdAt).toLocaleString() }}
                </v-list-item-subtitle>

                <template v-slot:append>
                    <v-menu location="bottom end">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                v-bind="props"
                                icon="mdi-dots-vertical"
                                variant="text"
                                size="small"
                                color="grey-darken-1"
                                class="ms-2"
                            ></v-btn>
                        </template>

                        <v-list density="compact" width="200">
                            <!-- Share -->
                            <v-list-item
                                @click="openShareDialog(file)"
                                v-if="file.isOwner"
                            >
                                <template v-slot:prepend>
                                    <v-icon size="small" color="primary"
                                        >mdi-share-variant</v-icon
                                    >
                                </template>
                                <v-list-item-title class="text-primary"
                                    >Share</v-list-item-title
                                >
                            </v-list-item>

                            <v-list-item @click="handlePreview(file)">
                                <template v-slot:prepend>
                                    <v-icon size="small">mdi-eye</v-icon>
                                </template>
                                <v-list-item-title>Preview</v-list-item-title>
                            </v-list-item>

                            <!-- Download -->
                            <v-list-item @click="handleDownload(file)">
                                <template v-slot:prepend>
                                    <v-icon size="small">mdi-download</v-icon>
                                </template>
                                <v-list-item-title>Download</v-list-item-title>
                            </v-list-item>

                            <!-- Details -->
                            <v-list-item @click="openDetailsDialog(file)">
                                <template v-slot:prepend>
                                    <v-icon size="small"
                                        >mdi-information-outline</v-icon
                                    >
                                </template>
                                <v-list-item-title>Details</v-list-item-title>
                            </v-list-item>

                            <!-- Delete -->
                            <v-list-item
                                v-if="file.isOwner"
                                @click="openDeleteDialog(file)"
                            >
                                <template v-slot:prepend>
                                    <v-icon size="small" color="error"
                                        >mdi-delete</v-icon
                                    >
                                </template>
                                <v-list-item-title class="text-error"
                                    >Delete</v-list-item-title
                                >
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
            </v-list-item>
        </v-list>
        <p v-else class="text-grey text-body-1 py-4 text-center">
            No files uploaded recently.
        </p>

        <!-- Preview Dialog -->
        <v-dialog
            v-model="isPreviewDialogOpen"
            max-width="800px"
            @click:outside="handleClosePreview"
        >
            <v-card class="rounded-lg">
                <v-card-title
                    class="d-flex justify-space-between align-center px-4 py-3"
                >
                    <span
                        class="text-truncate font-weight-bold"
                        style="max-width: 50%"
                    >
                        {{ fileToPreview?.originalName }}
                    </span>

                    <div
                        v-if="fileToPreview?.mimeType === 'application/pdf'"
                        class="d-flex align-center gap-1"
                    >
                        <v-btn
                            icon="mdi-magnify-minus-outline"
                            variant="text"
                            size="small"
                            @click="zoomOut"
                            title="Zoom Out"
                        ></v-btn>
                        <span class="text-caption font-weight-bold px-1"
                            >{{ Math.round(zoomLevel * 100) }}%</span
                        >
                        <v-btn
                            icon="mdi-magnify-plus-outline"
                            variant="text"
                            size="small"
                            @click="zoomIn"
                            title="Zoom In"
                        ></v-btn>
                    </div>

                    <v-btn
                        icon="mdi-close"
                        variant="text"
                        size="small"
                        @click="handleClosePreview"
                    ></v-btn>
                </v-card-title>

                <v-card-text
                    class="text-center pa-4"
                    style="max-height: 70vh; overflow: auto"
                >
                    <img
                        v-if="fileToPreview?.mimeType?.startsWith('image/')"
                        :src="previewUrl ?? undefined"
                        style="
                            max-width: 100%;
                            height: auto;
                            border-radius: 8px;
                            display: block;
                            margin: 0 auto;
                        "
                    />

                    <div
                        v-else-if="
                            fileToPreview?.mimeType === 'application/pdf'
                        "
                        class="pdf-container"
                        style="
                            overflow: auto;
                            width: 100%;
                            height: 60vh;
                            position: relative;
                            background-color: #f5f5f5;
                        "
                    >
                        <div
                            class="pdf-scaler"
                            :style="{
                                width: `${zoomLevel * 100}%`,
                                minWidth: '400px',
                                margin: '0 auto',
                                transition: 'width 0.1s ease-in-out',
                            }"
                        >
                            <vue-pdf-embed
                                class="pdf-responsive"
                                :source="previewUrl ?? undefined"
                                :scale="1.5"
                            />
                        </div>
                    </div>

                    <div
                        v-else-if="
                            fileToPreview?.mimeType?.startsWith('text/') ||
                            fileToPreview?.mimeType === 'application/json'
                        "
                        class="text-left pa-4 rounded"
                        style="max-height: 60vh; overflow: auto"
                    >
                        <pre
                            style="
                                white-space: pre-wrap;
                                word-break: break-all;
                                font-family: monospace;
                            "
                            >{{ previewTextContent }}</pre
                        >
                    </div>

                    <div v-else class="text-center text-grey py-8">
                        <v-icon size="48" class="mb-2"
                            >mdi-file-alert-outline</v-icon
                        >
                        <p>Preview is not available for this file type.</p>
                    </div>
                </v-card-text>

                <v-card-actions class="justify-end px-4 pb-3">
                    <v-btn
                        color="primary"
                        class="font-weight-bold"
                        variant="flat"
                        :href="previewUrl ?? undefined"
                        :download="fileToPreview?.originalName"
                    >
                        Download File
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Details Dialog -->
        <FileDetailsDialog
            v-model="isDetailsDialogVisible"
            :file="fileDetails"
        />

        <!-- Delete Dialog -->
        <DeleteDialog
            v-model="isDeleteDialogOpen"
            :file="fileToDelete"
            :is-deleting="isDeleting"
            @delete="confirmDelete"
        />

        <!-- Share Dialog -->
        <ShareDialog
            v-model="isShareDialogVisible"
            :file="fileToShare"
            :is-sharing="isSharing"
            @share="handleShare"
        />

        <!-- Decrypt Dialog -->
        <DecryptDialog
            v-model="isPasswordDialogOpen"
            :file="fileToDecrypt"
            :is-decrypting="isDecrypting"
            @decrypt="confirmDecryptAndAction"
        />

        <!-- Snackbar -->
        <v-snackbar
            v-model="snackbar.show"
            :color="snackbar.color"
            timeout="3000"
            location="bottom center"
        >
            {{ snackbar.message }}
            <template v-slot:actions>
                <v-btn variant="text" @click="snackbar.show = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>
<style scoped>
.pdf-responsive :deep(canvas) {
    width: 100% !important;
    height: auto !important;
}
.pdf-responsive :deep(div) {
    width: 100% !important;
}
</style>
