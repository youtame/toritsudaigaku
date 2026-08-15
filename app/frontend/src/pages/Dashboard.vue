<!-- src/pages/Dashboard.vue -->
<script setup lang="ts">
import { ref } from "vue";
import RecentFiles from "@/components/dashboard/RecentFiles.vue";
import FileUploadCard from "@/components/dashboard/FileUploadCard.vue";

const recentFilesRef = ref<InstanceType<typeof RecentFiles> | null>(null);

const handleFileUploaded = () => {
    if (recentFilesRef.value) {
        recentFilesRef.value.fetchFiles();
    }
};
</script>

<template>
    <v-container fluid>
        <h1 class="main-title">Dashboard</h1>

        <div class="mb-6">
            <h2 class="sub-title d-flex align-center">
                <v-icon icon="mdi-history" size="small" class="me-2"></v-icon>
                <span>Recents</span>
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
