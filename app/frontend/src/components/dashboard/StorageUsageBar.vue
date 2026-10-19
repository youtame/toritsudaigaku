<!-- src/components/dashboard/StorageUsageBar.vue -->
<script setup lang="ts">
import { computed } from "vue";

interface UsageSummary {
    totalSize: number;
    categories: Array<{
        label: string;
        size: number;
        percentage: number;
        color?: string;
    }>;
}

const props = defineProps<{
    files: UsageSummary;
}>();

const getCategoryColor = (label: string): string => {
    const l = label.toLowerCase();
    if (l.includes("image")) return "#009200";
    if (l.includes("pdf")) return "#085d41";
    if (l.includes("document") || l.includes("text") || l.includes("markdown"))
        return "#10b981";
    if (l.includes("json")) return "#84aea0";
    if (l.includes("encrypt")) return "lock";
    return "#6b7280";
};

const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const usageStats = computed(() => {
    if (!props.files || !props.files.categories) {
        return { totalSize: 0, categories: [] };
    }

    const categories = props.files.categories.map((cat) => ({
        ...cat,
        color: cat.color || getCategoryColor(cat.label),
    }));

    return {
        totalSize: props.files.totalSize || 0,
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
