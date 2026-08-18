<!-- src/pages/Dashboard.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { fileApi, type FileItem } from "@/services/api";

import StorageUsageBar from "@/components/dashboard/StorageUsageBar.vue";
import RecentFiles from "@/components/dashboard/RecentFiles.vue";
import FileUploadCard from "@/components/dashboard/FileUploadCard.vue";

const files = ref<FileItem[]>([]);
const recentFilesRef = ref<InstanceType<typeof RecentFiles> | null>(null);

const fetchDashboardFiles = async () => {
    try {
        const data = await fileApi.getMyFiles();
        console.log("Fetched Files:", data);
        files.value = data;
    } catch (error) {
        console.error("Failed to fetch dashboard files", error);
    }
};

const handleFileUploaded = () => {
    fetchDashboardFiles();
    if (recentFilesRef.value) {
        recentFilesRef.value.fetchFiles();
    }
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

        <div class="mb-8">
            <h2 class="sub-title d-flex align-center">
                <span>Recently Uploaded</span>
            </h2>
            <v-divider :thickness="2" class="mt-2"></v-divider>

            <RecentFiles ref="recentFilesRef" class="mt-4" />
        </div>

        <div class="mb-6">
            <FileUploadCard @uploaded="handleFileUploaded" />
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
</style>
