<!-- src/components/dashboard/FileDetailsDialog.vue -->
<script setup lang="ts">
import type { FileItem } from "@/services/api";

defineProps<{
    modelValue: boolean;
    file: (FileItem & { isEncrypted?: boolean }) | null;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const closeDialog = () => {
    emit("update:modelValue", false);
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
</script>

<template>
    <v-dialog
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        max-width="400px"
    >
        <v-card class="pa-3 rounded-lg">
            <v-card-title class="text-h6 font-weight-bold px-3 pt-2">
                File Details
            </v-card-title>
            <v-card-text class="px-3 py-2">
                <div v-if="file" class="text-body-2">
                    <div class="mb-2">
                        <span class="text-grey-darken-1 font-weight-bold"
                            >File Name:</span
                        >
                        <p class="text-break mt-1">{{ file.originalName }}</p>
                    </div>
                    <div class="mb-2">
                        <span class="text-grey-darken-1 font-weight-bold"
                            >File Size:</span
                        >
                        <p class="mt-1">{{ formatFileSize(file.fileSize) }}</p>
                    </div>
                    <div class="mb-2">
                        <span class="text-grey-darken-1 font-weight-bold"
                            >MIME Type:</span
                        >
                        <p class="mt-1">{{ file.mimeType }}</p>
                    </div>
                    <div class="mb-2">
                        <span class="text-grey-darken-1 font-weight-bold"
                            >Security:</span
                        >
                        <p class="mt-1">
                            <v-chip
                                size="x-small"
                                :color="file.isEncrypted ? 'lock' : 'grey'"
                                :prepend-icon="
                                    file.isEncrypted
                                        ? 'mdi-lock'
                                        : 'mdi-lock-open-outline'
                                "
                                variant="outlined"
                            >
                                {{
                                    file.isEncrypted
                                        ? "End-to-End Encrypted (E2EE)"
                                        : "Standard"
                                }}
                            </v-chip>
                        </p>
                    </div>
                    <div class="mb-2">
                        <span class="text-grey-darken-1 font-weight-bold"
                            >Created At:</span
                        >
                        <p class="mt-1">
                            {{ new Date(file.createdAt).toLocaleString() }}
                        </p>
                    </div>
                    <div>
                        <span class="text-grey-darken-1 font-weight-bold"
                            >Access Role:</span
                        >
                        <p class="mt-1">
                            <v-chip
                                size="x-small"
                                :color="file.isOwner ? 'primary' : 'grey'"
                                variant="outlined"
                            >
                                {{ file.isOwner ? "Owner" : "Shared" }}
                            </v-chip>
                        </p>
                    </div>
                </div>
            </v-card-text>
            <v-card-actions class="justify-end px-3 pb-2">
                <v-btn variant="text" @click="closeDialog"> Close </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
