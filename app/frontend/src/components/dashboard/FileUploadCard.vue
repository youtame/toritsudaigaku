<!-- src/components/dashboard/FileUploadCard.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { fileApi } from "@/services/api";

const emit = defineEmits<{
    (e: "uploaded"): void;
}>();

const isDialogOpen = ref(false);
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);

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

    isUploading.value = true;
    try {
        const file = selectedFile.value;

        const { uploadUrl } = await fileApi.requestUploadUrl({
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
        });

        await fileApi.uploadFileToS3(uploadUrl, file);

        isDialogOpen.value = false;
        selectedFile.value = null;
        showSnackbar("File uploaded successfully!");

        emit("uploaded");
    } catch (error) {
        console.error("Failed to upload file:", error);
        showSnackbar("Failed to upload file.", "error");
    } finally {
        isUploading.value = false;
    }
};
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

        <v-dialog v-model="isDialogOpen" max-width="400px">
            <v-card class="pa-3 rounded-lg">
                <v-card-title class="text-h6 font-weight-bold px-3 pt-2">
                    Upload New File
                </v-card-title>
                <v-card-text class="px-3 py-2">
                    <p class="text-caption text-grey-darken-1 mb-3">
                        Maximum file size: 50MB
                    </p>
                    <v-file-input
                        v-model="selectedFile"
                        label="Select file"
                        variant="outlined"
                        density="compact"
                        hide-details="auto"
                        @update:model-value="handleFileChange"
                    ></v-file-input>
                </v-card-text>
                <v-card-actions class="justify-end px-3 pb-2">
                    <v-btn
                        color="primary"
                        variant="flat"
                        :disabled="!selectedFile"
                        :loading="isUploading"
                        @click="handleUpload"
                    >
                        Upload
                    </v-btn>
                    <v-btn
                        variant="text"
                        @click="isDialogOpen = false"
                        :disabled="isUploading"
                    >
                        Cancel
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
