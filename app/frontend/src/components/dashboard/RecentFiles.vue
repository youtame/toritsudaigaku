<!-- src/components/dashboard/RecentFiles.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
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
const decryptionPassword = ref("");
const isDecrypting = ref(false);

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
    try {
        const response = await fileApi.GetDownloadsUrl(String(file.id));

        const { downloadUrl, isEncrypted, encryptionMetadata } =
            response as any;

        if (isEncrypted) {
            fileToDecrypt.value = { ...file, downloadUrl, encryptionMetadata };
            decryptionPassword.value = "";
            isPasswordDialogOpen.value = true;
        } else {
            window.open(downloadUrl, "_blank");
        }
    } catch (error) {
        console.error("Failed to get download URL", error);
        showSnackbar("Failed to get download URL.", "error");
    }
};

const confirmDecryptAndDownload = async (password: string) => {
    if (!fileToDecrypt.value) return;

    isDecrypting.value = true;
    try {
        const { downloadUrl, encryptionMetadata, originalName, mimeType } =
            fileToDecrypt.value as any;

        const res = await fetch(downloadUrl);
        const jsonPayload = await res.json();

        const decryptedBase64 = await decryptData(
            password,
            jsonPayload.ciphertext,
            encryptionMetadata.salt,
            encryptionMetadata.iv,
        );

        const binaryString = atob(decryptedBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], {
            type: mimeType || "application/octet-stream",
        });
        const blobUrl = window.URL.createObjectURL(blob);

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

                <v-list-item-title class="d-flex align-center">
                    <span class="text-truncate font-weight-bold">{{
                        file.originalName
                    }}</span>
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

                        <!-- Share -->
                        <v-list density="compact" width="200">
                            <v-list-item
                                @click="openShareDialog(file)"
                                v-if="file.isOwner && !file.isEncrypted"
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

                            <!-- Delete  -->
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
            @decrypt="confirmDecryptAndDownload"
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
