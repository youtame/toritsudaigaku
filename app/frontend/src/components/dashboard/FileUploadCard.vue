<!-- src/components/dashboard/FileUploadCard.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { fileApi } from "@/services/api";

import { encryptData } from "@/utils/encryption";

const emit = defineEmits<{
    (e: "uploaded"): void;
}>();

const isDialogOpen = ref(false);
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);

const isEncrypted = ref(false);
const password = ref("");

const snackbar = ref({
    show: false,
    message: "",
    color: "success",
});

const showSnackbar = (
    message: string,
    color: "success" | "error" = "success",
) => {
    snackbar.value = {
        show: true,
        message,
        color,
    };
};

const handleFileChange = (file: File | File[] | null) => {
    if (Array.isArray(file)) {
        selectedFile.value = file[0] || null;
    } else {
        selectedFile.value = file;
    }
};

const handleUpload = async () => {
    if (!selectedFile.value) return;
    if (isEncrypted.value && !password.value) {
        showSnackbar("Please enter an encryption password.", "error");
        return;
    }

    isUploading.value = true;
    try {
        const file = selectedFile.value;
        let fileToUpload: File | Blob = file;
        let encryptionMetadata = null;

        const originalMimeType = file.type || "application/octet-stream";

        if (isEncrypted.value) {
            const arrayBuffer = await file.arrayBuffer();

            const encrypted = await encryptData(password.value, arrayBuffer);

            const jsonPayload = JSON.stringify({
                ciphertext: encrypted.ciphertext,
            });

            fileToUpload = new Blob([jsonPayload], {
                type: "application/json",
            });

            encryptionMetadata = {
                salt: encrypted.salt,
                iv: encrypted.iv,
            };
        }

        const { uploadUrl } = await fileApi.requestUploadUrl({
            originalName: file.name,
            fileSize: fileToUpload.size,
            mimeType: originalMimeType,
            isEncrypted: isEncrypted.value,
            encryptionMetadata: encryptionMetadata,
        });

        await fileApi.uploadFileToS3(uploadUrl, fileToUpload);

        isDialogOpen.value = false;
        selectedFile.value = null;
        isEncrypted.value = false;
        password.value = "";
        showSnackbar("File uploaded successfully");

        emit("uploaded");
    } catch (error) {
        console.error("Failed to upload file:", error);
        showSnackbar("Failed to upload file.", "error");
    } finally {
        isUploading.value = false;
    }
};

const isFormInvalid = computed(() => {
    if (!selectedFile.value) return true;
    if (isEncrypted.value && !password.value) return true;
    return false;
});
</script>

<template>
    <div>
        <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            variant="flat"
            class="font-weight-bold rounded-lg text-none px-6 py-4"
            style="height: 44px; font-size: 1rem"
            @click="isDialogOpen = true"
        >
            Add file
        </v-btn>

        <v-dialog v-model="isDialogOpen" max-width="440px">
            <v-card class="pa-4 rounded-lg elevation-3">
                <v-card-title class="text-h6 font-weight-bold px-1 pt-1 mb-2">
                    Upload New File
                </v-card-title>

                <v-card-text class="px-1 py-2">
                    <p class="text-caption text-grey-darken-1 mb-4">
                        Maximum file size: 50MB
                    </p>

                    <div class="mb-4">
                        <v-file-input
                            v-model="selectedFile"
                            label="Select file"
                            variant="outlined"
                            density="comfortable"
                            hide-details="auto"
                            @update:model-value="handleFileChange"
                        ></v-file-input>
                    </div>

                    <div class="mb-3">
                        <v-switch
                            v-model="isEncrypted"
                            color="primary"
                            label="Encrypt file (E2EE)"
                            density="comfortable"
                            hide-details
                        ></v-switch>
                    </div>

                    <v-expand-transition>
                        <div v-if="isEncrypted" class="mt-3 pa-3 rounded-lg">
                            <p
                                class="text-caption font-weight-medium mb-2"
                                color="primary"
                            >
                                E2EE: Encrypt files using End-to-End Encryption.
                            </p>

                            <v-text-field
                                v-model="password"
                                label="Encryption Password"
                                type="password"
                                variant="outlined"
                                density="comfortable"
                                hint="Password required to decrypt this file later"
                                persistent-hint
                                hide-details="auto"
                            ></v-text-field>
                        </div>
                    </v-expand-transition>
                </v-card-text>

                <v-card-actions class="justify-end px-1 pt-3 pb-1">
                    <v-btn
                        variant="text"
                        @click="isDialogOpen = false"
                        :disabled="isUploading"
                        class="text-none"
                    >
                        Cancel
                    </v-btn>
                    <v-btn
                        color="primary"
                        variant="flat"
                        class="text-none px-4"
                        :disabled="isFormInvalid"
                        :loading="isUploading"
                        @click="handleUpload"
                    >
                        Upload
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar
            v-model="snackbar.show"
            :color="snackbar.color"
            timeout="3000"
            location="bottom center"
        >
            {{ snackbar.message }}
            <template v-slot:actions>
                <v-btn variant="text" @click="snackbar.show = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>
