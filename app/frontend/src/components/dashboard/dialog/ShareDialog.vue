<!-- src/components/dashboard/ShareDialog.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import type { FileItem } from "@/services/api";

const props = defineProps<{
    modelValue: boolean;
    file: FileItem | null;
    isSharing: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "share", targetEmail: string): void;
}>();

const targetEmail = ref("");

watch(
    () => props.modelValue,
    (isOpen) => {
        if (isOpen) {
            targetEmail.value = "";
        }
    },
);

const closeDialog = () => {
    emit("update:modelValue", false);
};

const handleShare = () => {
    if (!targetEmail.value.trim()) return;
    emit("share", targetEmail.value.trim());
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
                Share File
            </v-card-title>
            <v-card-text class="px-3 py-2">
                <p class="text-subtitle-2 mb-3 text-grey-darken-1">
                    Enter the email address of the user you want to share "<span
                        class="font-weight-bold"
                        >{{ file?.originalName }}</span
                    >" with.
                </p>
                <v-text-field
                    v-model="targetEmail"
                    label="User TASM Email"
                    type="email"
                    variant="outlined"
                    density="compact"
                    autofocus
                    @keyup.enter="handleShare"
                ></v-text-field>
            </v-card-text>
            <v-card-actions class="justify-end px-3 pb-2">
                <v-btn
                    color="primary"
                    variant="flat"
                    @click="handleShare"
                    :loading="isSharing"
                    :disabled="!targetEmail.trim()"
                >
                    Share
                </v-btn>
                <v-btn
                    variant="text"
                    @click="closeDialog"
                    :disabled="isSharing"
                >
                    Cancel
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
