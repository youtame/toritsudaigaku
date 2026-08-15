<!-- src/components/dashboard/RecentFiles.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { fileApi, type FileItem } from "@/services/api";
import { getFileIcon } from "@/utils/getFileIcon";

import FileDetailsDialog from "./FileDetailsDialog.vue";
import ShareDialog from "./ShareDialog.vue";

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

const handleDownload = async (fileId: string) => {
    try {
        const downloadUrl = await fileApi.GetDownloadsUrl(fileId);
        window.open(downloadUrl, "_blank");
    } catch (error) {
        console.error("Failed to get download URL", error);
        showSnackbar("Failed to get download URL.", "error");
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
        showSnackbar("File deleted successfully!");
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
                        :icon="getFileIcon(file.mimeType)"
                        size="large"
                        :color="file.isOwner ? 'primary' : undefined"
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

                        <v-list density="compact" width="200">
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

                            <!-- Download -->
                            <v-list-item
                                @click="handleDownload(String(file.id))"
                            >
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
        <v-dialog v-model="isDeleteDialogOpen" max-width="400px">
            <v-card class="pa-3 rounded-lg">
                <v-card-title class="text-h6 font-weight-bold px-3 pt-2">
                    Delete file?
                </v-card-title>
                <v-card-text class="px-3 py-2">
                    Are you sure you want to permanently delete "<span
                        class="font-weight-bold"
                        >{{ fileToDelete?.originalName }}</span
                    >"? This action cannot be undone.
                </v-card-text>
                <v-card-actions class="justify-end px-3 pb-2">
                    <v-btn
                        color="error"
                        variant="flat"
                        @click="confirmDelete"
                        :loading="isDeleting"
                    >
                        Delete
                    </v-btn>
                    <v-btn
                        variant="text"
                        @click="isDeleteDialogOpen = false"
                        :disabled="isDeleting"
                    >
                        Cancel
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Share Dialog -->
        <ShareDialog
            v-model="isShareDialogVisible"
            :file="fileToShare"
            :is-sharing="isSharing"
            @share="handleShare"
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
