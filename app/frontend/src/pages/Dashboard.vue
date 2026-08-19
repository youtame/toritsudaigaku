<!-- src/pages/Dashboard.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { fileApi, type FileItem } from "@/services/api";

import StorageUsageBar from "@/components/dashboard/StorageUsageBar.vue";
import RecentFiles from "@/components/dashboard/RecentFiles.vue";
import HomeFiles from "@/components/dashboard/HomeFiles.vue";
import FileUploadCard from "@/components/dashboard/FileUploadCard.vue";
import FolderCreateCard from "@/components/dashboard/FolderCreateCard.vue";

const router = useRouter();

const files = ref<FileItem[]>([]);
const recentFilesRef = ref<InstanceType<typeof RecentFiles> | null>(null);
const homeFilesRef = ref<InstanceType<typeof HomeFiles> | null>(null);

const fetchDashboardFiles = async () => {
    try {
        const data = await fileApi.getMyFiles();
        console.log("Fetched Files:", data);
        files.value = data;
    } catch (error) {
        console.error("Failed to fetch dashboard files", error);
    }
};

const handleDataChanged = () => {
    fetchDashboardFiles();
    if (recentFilesRef.value) {
        recentFilesRef.value.fetchFiles();
    }
    if (homeFilesRef.value) {
        homeFilesRef.value.fetchFiles();
    }
};

const handleFileUploaded = () => {
    handleDataChanged();
};

const handleNavigateFolder = (folderName: string) => {
    router.push(`/dashboard/folder/${folderName}`);
};
onMounted(() => {
    fetchDashboardFiles();
});
</script>

<template>
    <v-container fluid>
        <h1 class="main-title">Dashboard</h1>

        <div class="mb-8">
            <h2 class="sub-title d-flex align-center">
                <span>Storage</span>
            </h2>
            <v-divider :thickness="2" class="mt-2"></v-divider>

            <StorageUsageBar :files="files" class="mt-4" />
        </div>

        <div class="mb-6">
            <h2 class="sub-title d-flex align-center">
                <span>Recently Uploaded</span>
            </h2>
            <v-divider :thickness="2" class="mt-2"></v-divider>

            <RecentFiles
                ref="recentFilesRef"
                @file-deleted="handleDataChanged"
                class="mt-4"
            />
        </div>

        <div class="mb-6">
            <h2 class="sub-title d-flex align-center">
                <span>Home</span>
            </h2>
            <v-divider :thickness="2" class="mt-2"></v-divider>

            <v-row dense class="mt-4 action-row">
                <v-col cols="auto">
                    <FileUploadCard @uploaded="handleDataChanged" />
                </v-col>
                <v-col cols="auto">
                    <FolderCreateCard @folder-created="handleDataChanged" />
                </v-col>
            </v-row>

            <HomeFiles
                ref="homeFilesRef"
                @navigate-folder="handleNavigateFolder"
                @file-deleted="handleDataChanged"
                class="mt-4"
            />
        </div>
    </v-container>
</template>

<style lang="scss" scoped>
.main-title {
    font-size: clamp(32px, 5vw, 40px);
    margin-bottom: 10px;
}

.sub-title {
    font-size: clamp(24px, 5vw, 25px);
    margin-bottom: 0;
}

.action-row {
    gap: 8px;
}
</style>
