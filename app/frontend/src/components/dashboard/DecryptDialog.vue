<!-- src/components/dashboard/DecryptDialog.vue -->
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { FileItem } from "@/services/api";

const props = defineProps<{
    modelValue: boolean;
    file: FileItem | null;
    isDecrypting: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "decrypt", password: string): void;
}>();

const password = ref("");

watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue) {
            password.value = "";
        }
    },
);

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

const handleDecrypt = () => {
    if (!password.value) return;
    emit("decrypt", password.value);
};
</script>

<template>
    <v-dialog v-model="isOpen" max-width="400px">
        <v-card class="pa-3 rounded-lg">
            <v-card-title class="text-h6 font-weight-bold px-3 pt-2">
                Decrypt File
            </v-card-title>
            <v-card-text class="px-3 py-2">
                <p class="text-caption text-grey-darken-1 mb-3">
                    This file is end-to-end encrypted. Please enter the password
                    to decrypt:
                </p>
                <v-text-field
                    v-model="password"
                    label="Password"
                    type="password"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    @keyup.enter="handleDecrypt"
                ></v-text-field>
            </v-card-text>
            <v-card-actions class="justify-end px-3 pb-2">
                <v-btn
                    color="primary"
                    variant="flat"
                    :disabled="!password"
                    :loading="isDecrypting"
                    @click="handleDecrypt"
                >
                    Decrypt & Download
                </v-btn>
                <v-btn
                    variant="text"
                    @click="isOpen = false"
                    :disabled="isDecrypting"
                >
                    Cancel
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
