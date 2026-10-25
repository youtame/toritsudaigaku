<!-- src/components/dashboard/SearchCard.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const isDialogOpen = ref(false);
const searchQuery = ref("");

const handleSearch = () => {
    const query = searchQuery.value.trim();
    if (!query) return;

    isDialogOpen.value = false;
    router.push({
        name: "search-results",
        query: { q: query },
    });
};
</script>

<template>
    <div>
        <v-btn
            color="primary"
            prepend-icon="mdi-magnify"
            variant="outlined"
            class="font-weight-bold rounded-lg text-none px-4"
            style="height: 44px; font-size: 1rem"
            @click="isDialogOpen = true"
        >
            Search Files
        </v-btn>

        <v-dialog v-model="isDialogOpen" max-width="400px">
            <v-card class="pa-4 rounded-lg elevation-3">
                <v-card-title class="text-h6 font-weight-bold px-1 pt-1 mb-2">
                    Search Files
                </v-card-title>

                <v-card-text class="px-1 py-2">
                    <v-text-field
                        v-model="searchQuery"
                        label="File Name"
                        variant="outlined"
                        density="comfortable"
                        hint="Enter keyword to search"
                        hide-details="auto"
                        autofocus
                        @keydown.enter="handleSearch"
                    ></v-text-field>
                </v-card-text>

                <v-card-actions class="justify-end px-1 pt-3 pb-1">
                    <v-btn
                        variant="text"
                        @click="isDialogOpen = false"
                        class="text-none"
                    >
                        Cancel
                    </v-btn>
                    <v-btn
                        color="primary"
                        variant="flat"
                        class="text-none px-4"
                        :disabled="!searchQuery.trim()"
                        @click="handleSearch"
                    >
                        Search
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>