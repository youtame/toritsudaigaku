<!-- src/components/dashboard/PreviewDialog.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import VuePdfEmbed from "vue-pdf-embed";
import type { FileItem } from "@/services/api";

const props = defineProps<{
    modelValue: boolean;
    file: FileItem | null;
    previewUrl: string | null;
    textContent: string | null;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "close"): void;
}>();

const isOpen = ref(props.modelValue);
watch(
    () => props.modelValue,
    (val) => {
        isOpen.value = val;
    },
);
watch(isOpen, (val) => {
    emit("update:modelValue", val);
});

const zoomLevel = ref<number>(1.0);

const zoomIn = () => {
    if (zoomLevel.value < 4.5) {
        zoomLevel.value += 0.25;
    }
};

const zoomOut = () => {
    if (zoomLevel.value > 0.5) {
        zoomLevel.value -= 0.25;
    }
};

const handleClose = () => {
    zoomLevel.value = 1.0;
    emit("close");
    isOpen.value = false;
};

const openInNewWindow = () => {
    if (props.previewUrl) {
        window.open(props.previewUrl, "_blank");
    }
};
</script>

<template>
    <v-dialog v-model="isOpen" max-width="800px" @click:outside="handleClose">
        <v-card class="rounded-lg">
            <v-card-title
                class="d-flex justify-space-between align-center px-4 py-3"
            >
                <span
                    class="text-truncate font-weight-bold"
                    style="max-width: 50%"
                >
                    {{ file?.originalName }}
                </span>

                <div
                    v-if="file?.mimeType === 'application/pdf'"
                    class="d-flex align-center gap-1"
                >
                    <v-btn
                        icon="mdi-magnify-minus-outline"
                        variant="text"
                        size="small"
                        @click="zoomOut"
                        title="Zoom Out"
                    ></v-btn>
                    <span class="text-caption font-weight-bold px-1">
                        {{ Math.round(zoomLevel * 100) }}%
                    </span>
                    <v-btn
                        icon="mdi-magnify-plus-outline"
                        variant="text"
                        size="small"
                        @click="zoomIn"
                        title="Zoom In"
                    ></v-btn>
                </div>

                <v-btn
                    icon="mdi-close"
                    variant="text"
                    size="small"
                    @click="handleClose"
                ></v-btn>
            </v-card-title>
            
            <v-card-text
                class="text-center pa-4"
                style="max-height: 70vh; overflow: auto"
            >
                <img
                    v-if="file?.mimeType?.startsWith('image/')"
                    :src="previewUrl ?? undefined"
                    style="
                        max-width: 100%;
                        height: auto;
                        border-radius: 8px;
                        display: block;
                        margin: 0 auto;
                    "
                />

                <div
                    v-else-if="file?.mimeType === 'application/pdf'"
                    class="pdf-container"
                    style="
                        overflow: auto;
                        width: 100%;
                        height: 60vh;
                        position: relative;
                        background-color: #f5f5f5;
                    "
                >
                    <div
                        class="pdf-scaler"
                        :style="{
                            width: `${zoomLevel * 100}%`,
                            minWidth: '400px',
                            margin: '0 auto',
                            transition: 'width 0.1s ease-in-out',
                        }"
                    >
                        <vue-pdf-embed
                            class="pdf-responsive"
                            :source="previewUrl ?? undefined"
                            :scale="1.5"
                        />
                    </div>
                </div>

                <div
                    v-else-if="
                        file?.mimeType?.startsWith('text/') ||
                        file?.mimeType === 'application/json'
                    "
                    class="text-left pa-4 rounded"
                    style="max-height: 60vh; overflow: auto"
                >
                    <pre
                        style="
                            white-space: pre-wrap;
                            word-break: break-all;
                            font-family: monospace;
                        "
                        >{{ textContent }}</pre
                    >
                </div>

                <div v-else class="text-center text-grey py-8">
                    <v-icon size="48" class="mb-2"
                        >mdi-file-alert-outline</v-icon
                    >
                    <p>Preview is not available for this file type.</p>
                </div>
            </v-card-text>

            <v-card-actions class="justify-between px-4 pb-3">
                <div class="d-flex gap-2">
                    <v-btn
                        color="grey-darken-1"
                        class="mr-2"
                        variant="text"
                        prepend-icon="mdi-open-in-new"
                        @click="openInNewWindow"
                        :disabled="!previewUrl"
                    >
                        New Window
                    </v-btn>

                    <v-btn
                        color="primary" 
                        class="font-weight-bold"
                        variant="flat"
                        :href="previewUrl ?? undefined"
                        :download="file?.originalName"
                    >
                        Download
                    </v-btn>
                </div>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.pdf-responsive :deep(canvas) {
    width: 100% !important;
    height: auto !important;
}
.pdf-responsive :deep(div) {
    width: 100% !important;
}
</style>
