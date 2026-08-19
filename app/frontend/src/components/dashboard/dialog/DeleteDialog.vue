<!-- src/components/dashboard/DeleteDialog.vue -->
<script setup lang="ts">
import type { FileItem } from "@/services/api";

defineProps<{
    modelValue: boolean;
    file: FileItem | null;
    isDeleting: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "delete"): void;
}>();

const closeDialog = () => {
    emit("update:modelValue", false);
};

const handleDelete = () => {
    emit("delete");
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
                Delete file?
            </v-card-title>
            <v-card-text class="px-3 py-2">
                Are you sure you want to permanently delete "<span
                    class="font-weight-bold"
                    >{{ file?.originalName }}</span
                >"? This action cannot be undone.
            </v-card-text>
            <v-card-actions class="justify-end px-3 pb-2">
                <v-btn
                    color="error"
                    variant="flat"
                    @click="handleDelete"
                    :loading="isDeleting"
                >
                    Delete
                </v-btn>
                <v-btn
                    variant="text"
                    @click="closeDialog"
                    :disabled="isDeleting"
                >
                    Cancel
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
