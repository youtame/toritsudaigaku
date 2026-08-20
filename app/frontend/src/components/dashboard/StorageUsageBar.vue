<!-- src/components/dashboard/StorageUsageBar.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { FileItem } from "@/services/api";

const props = defineProps<{
    files: FileItem[];
}>();

interface CategoryInfo {
    label: string;
    color: string;
}

const getFileCategoryInfo = (file: FileItem): CategoryInfo => {
    if (file.isEncrypted) {
        return { label: "Encrypted", color: "lock" };
    }

    const mime = file.mimeType.toLowerCase();

    if (mime.startsWith("image/")) {
        return { label: "Images", color: "#009200" };
    }
    if (mime === "application/pdf") {
        return { label: "PDF", color: "#085d41" };
    }
    if (mime.includes("markdown") || mime.includes("text/plain")) {
        return { label: "Documents", color: "#10b981" };
    }
    if (mime === "application/json") {
        return { label: "JSON", color: "#84aea0" };
    }

    return { label: "Other", color: "#6b7280" };
};

const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const usageStats = computed(() => {
    const categoryMap: {
        [key: string]: { size: number; color: string; label: string };
    } = {};
    let totalSize = 0;

    props.files.forEach((file) => {
        if (file.originalName.endsWith("/.placeholder")) return;

        const info = getFileCategoryInfo(file);
        if (!categoryMap[info.label]) {
            categoryMap[info.label] = {
                size: 0,
                color: info.color,
                label: info.label,
            };
        }
        categoryMap[info.label]!.size += file.fileSize;
        totalSize += file.fileSize;
    });

    const categories = Object.values(categoryMap).map((cat) => ({
        ...cat,
        percentage: totalSize > 0 ? (cat.size / totalSize) * 100 : 0,
    }));

    categories.sort((a, b) => b.size - a.size);

    return {
        totalSize,
        categories,
    };
});
</script>

<template>
    <v-card class="pa-4 rounded-lg mb-6" elevation="0">
        <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-body-2 text-grey-darken-1">
                Total: {{ formatBytes(usageStats.totalSize) }}
            </span>
        </div>

        <div
            class="storage-bar-container d-flex rounded-pill overflow-hidden mb-3"
            style="height: 10px; background-color: #e5e7eb"
        >
            <div
                v-for="(cat, index) in usageStats.categories"
                :key="index"
                :style="{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color.startsWith('#')
                        ? cat.color
                        : undefined,
                }"
                :class="cat.color.startsWith('#') ? '' : `bg-${cat.color}`"
                class="transition-swing"
            >
                <v-tooltip activator="parent" location="top">
                    {{ cat.label }}: {{ formatBytes(cat.size) }} ({{
                        cat.percentage.toFixed(1)
                    }}%)
                </v-tooltip>
            </div>
        </div>

        <div class="d-flex flex-wrap gap-4 text-body-2">
            <div
                v-for="(cat, index) in usageStats.categories"
                :key="index"
                class="d-flex align-center mt-2 me-6 mb-1"
            >
                <span
                    class="rounded-circle me-2"
                    :style="{
                        width: '10px',
                        height: '10px',
                        backgroundColor: cat.color.startsWith('#')
                            ? cat.color
                            : undefined,
                        display: 'inline-block',
                    }"
                    :class="cat.color.startsWith('#') ? '' : `bg-${cat.color}`"
                ></span>
                <span class="font-weight-bold me-1">{{ cat.label }}</span>
                <span class="text-body-2 text-grey-darken-1"
                    >({{ cat.percentage.toFixed(1) }}%)</span
                >
            </div>
        </div>
    </v-card>
</template>
