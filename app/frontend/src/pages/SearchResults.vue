<!-- src/pages/SearchResults.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fileApi, type FileItem } from "@/services/api";
import { getFileIcon } from "@/utils/getFileIcon";
import { useFileActions } from "@/composables/useFileActions";

import FileDetailsDialog from "@/components/dashboard/dialog/FileDetailsDialog.vue";
import ShareDialog from "@/components/dashboard/dialog/ShareDialog.vue";
import DeleteDialog from "@/components/dashboard/dialog/DeleteDialog.vue";
import DecryptDialog from "@/components/dashboard/dialog/DecryptDialog.vue";
import PreviewDialog from "@/components/dashboard/dialog/PreviewDialog.vue";

import SearchCard from "@/components/dashboard/SearchCard.vue";

const route = useRoute();
const router = useRouter();

const filesData = ref<FileItem[]>([]);
const isLoading = ref(true);
const isSharing = ref(false);

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

const searchQuery = computed(() => (route.query.q as string) || "");

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

const handleDownload = async (file: FileItem) =>
    await prepareFileAccess(file, "download");
const handlePreview = async (file: FileItem) =>
    await prepareFileAccess(file, "preview");

const isDeleteDialogOpen = ref(false);
const fileToDelete = ref<FileItem | null>(null);
const isDeleting = ref(false);

const openDeleteDialog = (item: FileItem) => {
    fileToDelete.value = item;
    isDeleteDialogOpen.value = true;
};

const confirmDelete = async () => {
    if (!fileToDelete.value) return;

    isDeleting.value = true;
    try {
        await fileApi.deleteFile(String(fileToDelete.value.id));
        await searchFiles();
        isDeleteDialogOpen.value = false;
        fileToDelete.value = null;
        showSnackbar("Deleted successfully");
    } catch (error) {
        showSnackbar("Failed to delete.", "error");
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

const getEnclosingFolder = (originalName: string) => {
    const parts = originalName.split("/");
    if (parts.length <= 1) return null;
    parts.pop();
    return parts.join("/");
};

const handleOpenEnclosingFolder = (file: FileItem) => {
    const folderPath = getEnclosingFolder(file.originalName);
    if (!folderPath) return;

    router.push(`/dashboard/folder/${folderPath}`);
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

const searchFiles = async () => {
    if (!searchQuery.value.trim()) {
        filesData.value = [];
        isLoading.value = false;
        return;
    }

    isLoading.value = true;
    try {
        filesData.value = await fileApi.searchFiles(searchQuery.value);
    } catch (error) {
        showSnackbar("Failed to search files", "error");
    } finally {
        isLoading.value = false;
    }
};

onMounted(searchFiles);

watch(
    () => route.query.q,
    () => {
        searchFiles();
    },
);
</script>

<template>
    <v-container fluid>
        <v-breadcrumbs class="px-0 mb-2">
            <v-breadcrumbs-item
                @click="router.push('/dashboard')"
                style="cursor: pointer"
            >
                <v-icon icon="mdi-home" size="small" class="me-1"></v-icon>
                Dashboard
            </v-breadcrumbs-item>
            <v-breadcrumbs-divider>/</v-breadcrumbs-divider>
            <v-breadcrumbs-item disabled>Search Results</v-breadcrumbs-item>
        </v-breadcrumbs>

        <h1 class="main-title mb-6">Results for "{{ searchQuery }}"</h1>

        <v-row dense class="mt-2 mb-2 action-row">
            <v-col cols="auto">
                <SearchCard />
            </v-col>
        </v-row>

        <p v-if="isLoading" class="text-body-1 py-4 text-center text-grey">
            Searching...
        </p>

        <div v-else>
            <v-list v-if="filesData.length > 0" class="rounded-lg pa-2 mb-10">
                <v-list-item
                    v-for="file in filesData"
                    :key="String(file.id)"
                    class="rounded-lg my-2 px-4 py-3"
                    style="cursor: pointer"
                    @click="handlePreview(file)"
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
                        <span class="text-truncate font-weight-bold">
                            {{ file.originalName.split("/").pop() }}
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
                                    @click.stop
                                ></v-btn>
                            </template>
                            <v-list density="compact" width="240">
                                <v-list-item
                                    @click.stop="openShareDialog(file)"
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
                                <v-list-item
                                    v-if="getEnclosingFolder(file.originalName)"
                                    @click.stop="
                                        handleOpenEnclosingFolder(file)
                                    "
                                >
                                    <template v-slot:prepend>
                                        <v-icon size="small"
                                            >mdi-folder-open-outline</v-icon
                                        >
                                    </template>
                                    <v-list-item-title
                                        >Enclosing folder</v-list-item-title
                                    >
                                </v-list-item>
                                <v-list-item @click.stop="handlePreview(file)">
                                    <template v-slot:prepend>
                                        <v-icon size="small">mdi-eye</v-icon>
                                    </template>
                                    <v-list-item-title
                                        >Preview</v-list-item-title
                                    >
                                </v-list-item>
                                <v-list-item @click.stop="handleDownload(file)">
                                    <template v-slot:prepend>
                                        <v-icon size="small"
                                            >mdi-download</v-icon
                                        >
                                    </template>
                                    <v-list-item-title
                                        >Download</v-list-item-title
                                    >
                                </v-list-item>
                                <v-list-item
                                    @click.stop="openDetailsDialog(file)"
                                >
                                    <template v-slot:prepend>
                                        <v-icon size="small"
                                            >mdi-information-outline</v-icon
                                        >
                                    </template>
                                    <v-list-item-title
                                        >Details</v-list-item-title
                                    >
                                </v-list-item>
                                <v-list-item
                                    v-if="file.isOwner"
                                    @click.stop="openDeleteDialog(file)"
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
                No files found matching "{{ searchQuery }}".
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
            :is-sharing="isSharing"
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
            <template v-slot:actions>
                <v-btn variant="text" @click="snackbar.show = false"
                    >Close</v-btn
                >
            </template>
        </v-snackbar>
    </v-container>
</template>

<style lang="scss" scoped>
.main-title {
    font-size: clamp(28px, 4vw, 36px);
}

.action-row {
    gap: 8px;
}
</style>
