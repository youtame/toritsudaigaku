<!-- src/components/dashboard/FolderCreateCard.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { fileApi } from "@/services/api";

const props = defineProps<{
    currentPath?: string;
}>();

const emit = defineEmits<{
    (e: "folder-created"): void;
}>();

const isDialogOpen = ref(false);
const newFolderName = ref("");
const isCreating = ref(false);

const snackbar = ref({
    show: false,
    message: "",
    color: "success" as "success" | "error",
});

const showSnackbar = (
    message: string,
    color: "success" | "error" = "success",
) => {
    snackbar.value = { show: true, message, color };
};

const handleCreateFolder = async () => {
    const folderName = newFolderName.value.trim();
    if (!folderName) return;

    if (folderName.includes("/")) {
        showSnackbar("Folder name cannot contain slashes.", "error");
        return;
    }

    isCreating.value = true;
    try {
        await fileApi.createFolder(folderName, props.currentPath || "");

        isDialogOpen.value = false;
        newFolderName.value = "";
        showSnackbar("Folder created successfully");

        emit("folder-created");
    } catch (error) {
        console.error("Failed to create folder:", error);
        showSnackbar("Failed to create folder.", "error");
    } finally {
        isCreating.value = false;
    }
};
</script>

<template>
    <div>
        <v-btn
            color="secondary"
            prepend-icon="mdi-folder-plus"
            variant="outlined"
            class="font-weight-bold rounded-lg text-none px-4"
            style="height: 44px; font-size: 1rem"
            @click="isDialogOpen = true"
        >
            New Folder
        </v-btn>

        <v-dialog v-model="isDialogOpen" max-width="400px">
            <v-card class="pa-4 rounded-lg elevation-3">
                <v-card-title class="text-h6 font-weight-bold px-1 pt-1 mb-2">
                    Create New Folder
                </v-card-title>

                <v-card-text class="px-1 py-2">
                    <v-text-field
                        v-model="newFolderName"
                        label="Folder Name"
                        variant="outlined"
                        density="comfortable"
                        hint="Enter folder name"
                        hide-details="auto"
                        autofocus
                    ></v-text-field>
                </v-card-text>

                <v-card-actions class="justify-end px-1 pt-3 pb-1">
                    <v-btn
                        variant="text"
                        @click="isDialogOpen = false"
                        :disabled="isCreating"
                        class="text-none"
                    >
                        Cancel
                    </v-btn>
                    <v-btn
                        color="primary"
                        variant="flat"
                        class="text-none px-4"
                        :disabled="!newFolderName.trim()"
                        :loading="isCreating"
                        @click="handleCreateFolder"
                    >
                        Create
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
            <template v-slot:actions
                ><v-btn variant="text" @click="snackbar.show = false"
                    >Close</v-btn
                ></template
            >
        </v-snackbar>
    </div>
</template>
