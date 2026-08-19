<!-- src/components/dashboard/HomeFiles.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { fileApi, type FileItem } from "@/services/api";
import { getFileIcon } from "@/utils/getFileIcon";
import { useFileActions } from "@/composables/useFileActions";

import FileDetailsDialog from "./dialog/FileDetailsDialog.vue";
import ShareDialog from "./dialog/ShareDialog.vue";
import DeleteDialog from "./dialog/DeleteDialog.vue";
import DecryptDialog from "./dialog/DecryptDialog.vue";
import PreviewDialog from "./dialog/PreviewDialog.vue";

const emit = defineEmits<{
    (e: "navigate-folder", folderName: string): void;
    (e: "file-deleted"): void;
}>();

const allFiles = ref<FileItem[]>([]);
const isLoading = ref(true);
const currentPath = ref("");

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

const handleDownload = async (file: FileItem) => {
    await prepareFileAccess(file, "download");
};

const handlePreview = async (file: FileItem) => {
    await prepareFileAccess(file, "preview");
};

interface FolderItem {
    name: string;
    placeholderFile: FileItem;
}

const folders = computed<FolderItem[]>(() => {
    const folderMap = new Map<string, FileItem>();

    allFiles.value.forEach((file) => {
        if (file.originalName.endsWith("/.placeholder")) {
            const parts = file.originalName.split("/");
            const topFolderName = parts[0];
            if (topFolderName && !folderMap.has(topFolderName)) {
                folderMap.set(topFolderName, file);
            }
        }
    });

    return Array.from(folderMap.entries()).map(([name, placeholderFile]) => ({
        name,
        placeholderFile,
    }));
});

const rootFiles = computed(() => {
    return allFiles.value.filter((file) => {
        if (file.originalName.endsWith("/.placeholder")) return false;
        return !file.originalName.includes("/");
    });
});

const handleFolderClick = (folderName: string) => {
    emit("navigate-folder", folderName);
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

        allFiles.value = allFiles.value.filter(
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
const openShareDialog = (file: FileItem) => {
    fileToShare.value = file;
    isShareDialogVisible.value = true;
};

const handleShare = async (targetEmail: string) => {
    if (!fileToShare.value || !targetEmail) return;
    try {
        await fileApi.shareFile(String(fileToShare.value.id), targetEmail);
        isShareDialogVisible.value = false;
        showSnackbar("File shared successfully");
    } catch (error) {
        showSnackbar("Failed to share file.", "error");
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
        const data = await fileApi.getMyFiles();
        allFiles.value = data;
    } catch (error) {
        showSnackbar("Failed to fetch home files", "error");
    } finally {
        isLoading.value = false;
    }
};

onMounted(fetchFiles);
defineExpose({ fetchFiles });
</script>

<template>
    <div>
        <p v-if="isLoading" class="text-body-1 py-4 text-center text-grey">
            Loading...
        </p>

        <div v-else>
            <v-list
                v-if="folders.length > 0 || rootFiles.length > 0"
                class="rounded-lg pa-2"
            >
                <v-list-item
                    v-for="folder in folders"
                    :key="'folder-' + folder.name"
                    class="rounded-lg my-2 px-4 py-3"
                >
                    <template v-slot:prepend>
                        <v-icon
                            icon="mdi-folder"
                            size="large"
                            color="secondary"
                            class="me-2"
                        ></v-icon>
                    </template>

                    <v-list-item-title
                        class="font-weight-bold"
                        style="cursor: pointer"
                        @click="handleFolderClick(folder.name)"
                    >
                        {{ folder.name }}
                    </v-list-item-title>
                    <v-list-item-subtitle
                        class="text-body-2 text-grey-darken-1"
                    >
                        Folder
                    </v-list-item-subtitle>

                    <template v-slot:append>
                        <v-menu
                            v-if="folder.placeholderFile.isOwner"
                            location="bottom end"
                        >
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
                            <v-list density="compact" width="150">
                                <v-list-item
                                    @click="
                                        openDeleteDialog(folder.placeholderFile)
                                    "
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

                <v-list-item
                    v-for="file in rootFiles"
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
                                <v-list-item
                                    @click="openShareDialog(file)"
                                    v-if="file.isOwner"
                                >
                                    <template v-slot:prepend
                                        ><v-icon size="small" color="primary"
                                            >mdi-share-variant</v-icon
                                        ></template
                                    >
                                    <v-list-item-title class="text-primary"
                                        >Share</v-list-item-title
                                    >
                                </v-list-item>
                                <v-list-item @click="handlePreview(file)">
                                    <template v-slot:prepend
                                        ><v-icon size="small"
                                            >mdi-eye</v-icon
                                        ></template
                                    >
                                    <v-list-item-title
                                        >Preview</v-list-item-title
                                    >
                                </v-list-item>
                                <v-list-item @click="handleDownload(file)">
                                    <template v-slot:prepend
                                        ><v-icon size="small"
                                            >mdi-download</v-icon
                                        ></template
                                    >
                                    <v-list-item-title
                                        >Download</v-list-item-title
                                    >
                                </v-list-item>
                                <v-list-item @click="openDetailsDialog(file)">
                                    <template v-slot:prepend
                                        ><v-icon size="small"
                                            >mdi-information-outline</v-icon
                                        ></template
                                    >
                                    <v-list-item-title
                                        >Details</v-list-item-title
                                    >
                                </v-list-item>
                                <v-list-item
                                    v-if="file.isOwner"
                                    @click="openDeleteDialog(file)"
                                >
                                    <template v-slot:prepend
                                        ><v-icon size="small" color="error"
                                            >mdi-delete</v-icon
                                        ></template
                                    >
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
                No files or folders found in home directory.
            </p>
        </div>

        <PreviewDialog
            v-model="isPreviewDialogOpen"
            :file="fileToPreview"
            :preview-url="previewUrl"
            :text-content="previewTextContent"
            @close="closePreview"
        />
        <FileDetailsDialog
            v-model="isDetailsDialogVisible"
            :file="fileDetails"
        />
        <DeleteDialog
            v-model="isDeleteDialogOpen"
            :file="fileToDelete"
            :is-deleting="isDeleting"
            @delete="confirmDelete"
        />
        <ShareDialog
            v-model="isShareDialogVisible"
            :file="fileToShare"
            @share="handleShare"
        />
        <DecryptDialog
            v-model="isPasswordDialogOpen"
            :file="fileToDecrypt"
            :is-decrypting="isDecrypting"
            @decrypt="confirmDecryptAndAction"
        />

        <v-snackbar
            v-model="snackbar.show"
            :color="snackbar.color"
            timeout="3000"
            location="bottom center"
        >
            {{ snackbar.message }}
            <template v-slot:actions
                ><v-btn variant="text" @click="snackbar.show = false"
                    >Close</v-btn
                ></template
            >
        </v-snackbar>
    </div>
</template>
