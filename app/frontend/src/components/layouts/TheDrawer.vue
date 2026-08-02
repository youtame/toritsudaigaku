<!-- src/components/layouts/TheDrawer.vue -->
<template>
    <v-navigation-drawer location="right" temporary width="280">
        <v-divider></v-divider>
        <v-list nav>
            <v-list-item v-if="isNotHome && user.authenticated" class="mb-2">
                <template v-slot:prepend>
                    <v-avatar size="32" class="mr-2">
                        <v-img :src="user.avatarUrl" alt="User Avatar" />
                    </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">
                    {{ user.displayName }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption opacity-60">
                    {{ user.email }}
                </v-list-item-subtitle>
            </v-list-item>

            <v-divider
                v-if="isNotHome && user.authenticated"
                class="my-2"
            ></v-divider>

            <v-list-item v-if="isNotDashboard" link to="/dashboard">
                <template v-slot:prepend>
                    <v-icon icon="mdi-home"></v-icon>
                </template>
                <v-list-item-title class="font-weight-bold"
                    >Dashboard</v-list-item-title
                >
            </v-list-item>

            <v-divider v-if="isNotDashboard" class="my-2"></v-divider>

            <v-list-item>
                <template v-slot:prepend>
                    <v-icon
                        :icon="
                            theme.global.current.value.dark
                                ? 'mdi-weather-night'
                                : 'mdi-white-balance-sunny'
                        "
                    ></v-icon>
                </template>
                <v-list-item-title class="font-weight-bold"
                    >Dark Mode</v-list-item-title
                >
                <template v-slot:append>
                    <v-switch
                        :model-value="theme.global.current.value.dark"
                        @update:model-value="toggleTheme"
                        color="primary"
                        hide-details
                        density="compact"
                    ></v-switch>
                </template>
            </v-list-item>

            <v-divider class="my-2"></v-divider>

            <v-list-item
                link
                href="https://github.com/youtame/toritsudaigaku"
                target="_blank"
            >
                <template v-slot:prepend>
                    <v-icon icon="mdi-github"></v-icon>
                </template>
                <v-list-item-title class="font-weight-bold"
                    >GitHub</v-list-item-title
                >
            </v-list-item>

            <v-divider v-if="isNotHome" class="my-2"></v-divider>

            <v-list-item
                v-if="isNotHome"
                @click="logout"
                color="error"
                class="text-error"
            >
                <template v-slot:prepend>
                    <v-icon icon="mdi-logout"></v-icon>
                </template>
                <v-list-item-title class="font-weight-bold"
                    >Logout</v-list-item-title
                >
            </v-list-item>
        </v-list>
    </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useTheme } from "vuetify";
import { useAuth } from "@/composables/useAuth";

defineEmits<{
    (e: "logout"): void;
}>();

const route = useRoute();
const theme = useTheme();
const { user, logout } = useAuth();

const isNotHome = computed(() => route.path.replace(/^\/|\/$/g, "") !== "");
const isNotDashboard = computed(() => {
    const path = route.path.replace(/^\/|\/$/g, "");
    return path !== "dashboard" && path !== "";
});

const toggleTheme = (targetValue: boolean) => {
    const next = targetValue ? "dark" : "light";
    theme.global.name.value = next;
    localStorage.setItem("user-theme", next);
};
</script>

<style scoped>
.v-navigation-drawer {
    border: none !important;
    background-color: rgba(var(--v-theme-surface), 0.8) !important;
    backdrop-filter: blur(15px);
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1) !important;
    margin: 12px 0;
    height: calc(100% - 24px) !important;
    border-radius: 24px 0 0 24px !important;
    overflow: hidden !important;
}
</style>
