<!-- src/components/dashboard/RecentFiles.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { fileApi, type FileItem } from "@/services/api";
import { getFileIcon } from "@/utils/getFileIcon";
import { useFileActions } from "@/composables/useFileActions";

import FileDetailsDialog from "./dialog/FileDetailsDialog.vue";
import ShareDialog from "./dialog/ShareDialog.vue";
import DeleteDialog from "./dialog/DeleteDialog.vue";
import DecryptDialog from "./dialog/DecryptDialog.vue";
import PreviewDialog from "./dialog/PreviewDialog.vue";

const files = ref<FileItem[]>([]);
const isLoading = ref(true);

const snackbar = ref({
    show: false,
    message: "",
    color: "success" as "success" | "error",
});
const showSnackbar = (
    message: string,
    color: "success" | "error" = "success",
) => {
    snackbar.value = { show: true, message, color };
};

// import from composables/useFileActions.ts
const {
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
} = useFileActions(showSnackbar);

// Preview handlers wrappers
const handleDownload = async (file: FileItem) => {
    await prepareFileAccess(file, "download");
};

const handlePreview = async (file: FileItem) => {
    await prepareFileAccess(file, "preview");
};

const isDeleteDialogOpen = ref(false);
const fileToDelete = ref<FileItem | null>(null);
const isDeleting = ref(false);

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

        emit("file-deleted");
    } catch (error) {
        console.error("Failed to delete file", error);
        showSnackbar("Failed to delete file.", "error");
    } finally {
        isDeleting.value = false;
    }
};

const isShareDialogVisible = ref(false);
const fileToShare = ref<FileItem | null>(null);
const isSharing = ref(false);

const openShareDialog = (file: FileItem) => {
    fileToShare.value = file;
    isShareDialogVisible.value = true;
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

const isDetailsDialogVisible = ref(false);
const fileDetails = ref<FileItem | null>(null);

const openDetailsDialog = (file: FileItem) => {
    fileDetails.value = file;
    isDetailsDialogVisible.value = true;
};

const fetchFiles = async () => {
    try {
        const allFiles = await fileApi.getMyFiles();
        files.value = allFiles
            .filter((file) => !file.originalName.endsWith("/.placeholder"))
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            )
            .slice(0, 3);
    } catch (error) {
        showSnackbar("Failed to fetch recent files", "error");
    } finally {
        isLoading.value = false;
    }
};
const emit = defineEmits<{
    (e: "file-deleted"): void;
}>();

onMounted(fetchFiles);

defineExpose({ fetchFiles });
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
        <PreviewDialog
            v-model="isPreviewDialogOpen"
            :file="fileToPreview"
            :preview-url="previewUrl"
            :text-content="previewTextContent"
            @close="handleClosePreview"
        />

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
