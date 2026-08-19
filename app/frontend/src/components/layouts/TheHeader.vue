<!-- src/components/layouts/TheHeader.vue -->
<template>
    <v-app-bar
        app
        flat
        :class="{ 'v-app-bar--is-scrolled': isScrolled }"
        color="transparent"
        class="px-0"
    >
        <v-container class="d-flex align-center pa-0" style="max-width: 95%">
            <v-app-bar-title class="cursor-pointer" @click="$router.push('/')">
                <v-img
                    :src="logo"
                    height="40"
                    width="80"
                    alt="logo"
                    class="mr-2"
                />
            </v-app-bar-title>

            <v-spacer></v-spacer>

            <v-btn
                v-if="isNotDashboard"
                icon
                variant="text"
                @click="$router.push('/dashboard')"
                class="mr-1 d-none d-md-flex"
            >
                <v-icon>mdi-home</v-icon>
                <v-tooltip activator="parent" location="bottom"
                    >Dashboard</v-tooltip
                >
            </v-btn>

            <div class="d-none d-md-flex align-center">
                <v-btn icon @click="toggleTheme" variant="text">
                    <v-icon>
                        {{
                            theme.global.current.value.dark
                                ? "mdi-white-balance-sunny"
                                : "mdi-weather-night"
                        }}
                    </v-icon>
                    <v-tooltip activator="parent" location="bottom"
                        >Appearance</v-tooltip
                    >
                </v-btn>

                <v-btn
                    icon
                    href="https://github.com/youtame/toritsudaigaku"
                    target="_blank"
                    variant="text"
                    class="mr-1"
                >
                    <v-icon>mdi-github</v-icon>
                    <v-tooltip activator="parent" location="bottom"
                        >GitHub</v-tooltip
                    >
                </v-btn>

                <div v-if="isNotHome && user.authenticated" class="ml-2">
                    <v-menu min-width="200px" rounded>
                        <template v-slot:activator="{ props }">
                            <v-btn icon v-bind="props">
                                <v-avatar size="36">
                                    <v-img
                                        :src="user.avatarUrl"
                                        alt="User Avatar"
                                    />
                                </v-avatar>
                            </v-btn>
                        </template>
                        <v-card class="mt-2 pa-2">
                            <v-card-text>
                                <div class="mx-auto text-center">
                                    <v-avatar size="48" class="mb-2">
                                        <v-img :src="user.avatarUrl" />
                                    </v-avatar>
                                    <p
                                        class="text-subtitle-1 font-weight-bold mb-1"
                                    >
                                        {{ user.displayName }}
                                    </p>
                                    <v-divider class="my-2"></v-divider>
                                    <v-btn
                                        variant="text"
                                        color="error"
                                        prepend-icon="mdi-logout"
                                        block
                                        @click="logout"
                                    >
                                        Logout
                                    </v-btn>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-menu>
                    <v-tooltip activator="parent" location="bottom">{{
                        user.displayName
                    }}</v-tooltip>
                </div>
            </div>

            <v-app-bar-nav-icon
                class="d-md-none"
                @click="$emit('toggle-drawer')"
            />
        </v-container>
    </v-app-bar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useTheme } from "vuetify";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/composables/useAuth";

defineEmits<{
    (e: "toggle-drawer"): void;
}>();

const route = useRoute();
const theme = useTheme();
const isScrolled = ref(false);
const { user, logout } = useAuth();

const isNotHome = computed(() => route.path.replace(/^\/|\/$/g, "") !== "");
const isNotDashboard = computed(() => {
    const path = route.path.replace(/^\/|\/$/g, "");
    return path !== "dashboard" && path !== "";
});

const handleScroll = () => {
    isScrolled.value = window.scrollY > 0;
};

const toggleTheme = () => {
    const next = theme.global.current.value.dark ? "light" : "dark";
    theme.global.name.value = next;
    localStorage.setItem("user-theme", next);
};

onMounted(() => window.addEventListener("scroll", handleScroll));
onUnmounted(() => window.removeEventListener("scroll", handleScroll));
</script>

<style scoped>
:deep(.v-app-bar) {
    transition: all 0.4s ease !important;
}
.v-app-bar--is-scrolled {
    background-color: rgba(var(--v-theme-surface), 0.9) !important;
    backdrop-filter: blur(12px) !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
}
</style>
