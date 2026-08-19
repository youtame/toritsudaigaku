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
import FileUploadCard from "@/components/dashboard/FileUploadCard.vue";
import FolderCreateCard from "@/components/dashboard/FolderCreateCard.vue";

const route = useRoute();
const router = useRouter();

const allFiles = ref<FileItem[]>([]);
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

const currentPath = computed(() => {
    const pathMatch = route.params.pathMatch;
    if (!pathMatch) return "";
    return Array.isArray(pathMatch) ? pathMatch.join("/") : pathMatch;
});

const breadcrumbs = computed(() => {
    if (!currentPath.value) return [];
    const parts = currentPath.value.split("/");
    return parts.map((part, index) => ({
        title: part,
        path: parts.slice(0, index + 1).join("/"),
    }));
});

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

interface FolderItem {
    name: string;
    fullPath: string;
    placeholderFile: FileItem;
}

const currentFolders = computed<FolderItem[]>(() => {
    const prefix = currentPath.value ? `${currentPath.value}/` : "";
    const folderMap = new Map<string, FileItem>();

    allFiles.value.forEach((file) => {
        if (
            file.originalName.endsWith("/.placeholder") &&
            file.originalName.startsWith(prefix)
        ) {
            const relativePath = file.originalName.slice(prefix.length);
            const parts = relativePath.split("/");
            if (parts.length > 1) {
                const folderName = parts[0];
                const fullPath = `${prefix}${folderName}`;
                if (folderName && !folderMap.has(folderName)) {
                    folderMap.set(folderName, file);
                }
            }
        }
    });

    return Array.from(folderMap.entries()).map(([name, placeholderFile]) => ({
        name,
        fullPath: `${prefix}${name}`,
        placeholderFile,
    }));
});

const currentFiles = computed(() => {
    const prefix = currentPath.value ? `${currentPath.value}/` : "";

    return allFiles.value.filter((file) => {
        if (file.originalName.endsWith("/.placeholder")) return false;
        if (!file.originalName.startsWith(prefix)) return false;

        const relativePath = file.originalName.slice(prefix.length);
        return !relativePath.includes("/");
    });
});

const handleFolderClick = (fullPath: string) => {
    router.push(`/dashboard/folder/${fullPath}`);
};

const navigateToHome = () => {
    router.push("/dashboard");
};

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
        allFiles.value = allFiles.value.filter(
            (f) => f.id !== fileToDelete.value?.id,
        );
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

const fetchData = async () => {
    isLoading.value = true;
    try {
        allFiles.value = await fileApi.getMyFiles();
    } catch (error) {
        showSnackbar("Failed to fetch folder contents", "error");
    } finally {
        isLoading.value = false;
    }
};

onMounted(fetchData);

watch(
    () => route.params.pathMatch,
    () => {},
);
</script>

<template>
    <v-container fluid>
        <v-breadcrumbs class="px-0 mb-2">
            <v-breadcrumbs-item @click="navigateToHome" style="cursor: pointer">
                <v-icon icon="mdi-home" size="small" class="me-1"></v-icon>
                Dashboard
            </v-breadcrumbs-item>
            <v-breadcrumbs-divider>/</v-breadcrumbs-divider>
            <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
                <v-breadcrumbs-item
                    :disabled="index === breadcrumbs.length - 1"
                    @click="
                        index < breadcrumbs.length - 1 &&
                        handleFolderClick(crumb.path)
                    "
                    :style="
                        index < breadcrumbs.length - 1 ? 'cursor: pointer' : ''
                    "
                >
                    {{ crumb.title }}
                </v-breadcrumbs-item>
                <v-breadcrumbs-divider v-if="index < breadcrumbs.length - 1"
                    >/</v-breadcrumbs-divider
                >
            </template>
        </v-breadcrumbs>

        <h1 class="main-title mb-4">
            {{ breadcrumbs[breadcrumbs.length - 1]?.title || "Folder" }}
        </h1>

        <v-row dense class="mb-6 action-row">
            <v-col cols="auto">
                <FileUploadCard
                    :current-path="currentPath"
                    @uploaded="fetchData"
                />
            </v-col>
            <v-col cols="auto">
                <FolderCreateCard
                    :current-path="currentPath"
                    @folder-created="fetchData"
                />
            </v-col>
        </v-row>

        <p v-if="isLoading" class="text-body-1 py-4 text-center text-grey">
            Loading...
        </p>

        <div v-else>
            <v-list
                v-if="currentFolders.length > 0 || currentFiles.length > 0"
                class="rounded-lg pa-2"
            >
                <v-list-item
                    v-for="folder in currentFolders"
                    :key="'folder-' + folder.fullPath"
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
                        @click="handleFolderClick(folder.fullPath)"
                    >
                        {{ folder.name }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-body-2 text-grey-darken-1"
                        >Folder</v-list-item-subtitle
                    >

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

                <v-list-item
                    v-for="file in currentFiles"
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
                    >
                        <span
                            class="text-truncate font-weight-bold text-decoration-underline-hover"
                        >
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
                This folder is empty.
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
