<!-- pages/Login.vue -->
<template>
    <v-container fluid class="pa-0 login-screen fill-height">
        <v-row no-gutters class="fill-height">
            <v-col
                cols="12"
                md="6"
                class="bg-background d-flex align-center justify-center h-50 h-md-100 pa-6 pa-md-12"
            >
                <div
                    class="hero-content text-center w-100"
                    style="max-width: 640px"
                >
                    <div
                        class="hero-svg-wrapper mb-6 mb-md-8 d-flex justify-center"
                    >
                        <router-link to="/">
                            <img
                                :src="headericon.icon"
                                alt="Hero Illustration"
                                class="hero-svg"
                            />
                        </router-link>
                    </div>

                    <h1
                        class="mt-0 text-h4 text-md-h3 font-weight-black mb-3 mb-md-4 tracking-tight title"
                    >
                        Login
                    </h1>
                    <v-alert
                        v-if="errorMessage"
                        type="error"
                        variant="tonal"
                        class="w-100 mt-5 mb-5 text-left"
                        density="comfortable"
                    >
                        {{ errorMessage }}
                    </v-alert>
                </div>
            </v-col>

            <v-col
                cols="12"
                md="6"
                class="bg-background d-flex h-50 h-md-100 pa-4 pa-md-6"
            >
                <div
                    class="login-card rounded-xl elevation-0 w-100 h-100 d-flex flex-column align-center justify-center pa-6"
                >
                    <div
                        class="flex-grow-1 d-flex flex-column align-center justify-center w-100"
                        style="max-width: 360px"
                    >
                        <v-btn
                            prepend-icon="mdi-google"
                            variant="elevated"
                            color="white"
                            size="large"
                            class="text-none font-weight-bold w-100 py-3 elevation-0"
                            rounded="lg"
                            @click="handleGoogleLogin"
                        >
                            Google Account
                        </v-btn>
                    </div>

                    <div class="login-footer text-white text-body-2 mt-auto">
                        {{ new Date().getFullYear() }} —
                        <strong>102℃</strong>
                    </div>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<style scoped>
.login-screen {
    height: 100vh !important;
    min-height: 100vh !important;

    height: 100dvh !important;
    min-height: 100dvh !important;
    overflow: hidden;
}
.title {
    font-size: 40px;
}

.v-theme--light .login-card {
    background-color: rgba(var(--v-theme-primary), 1);
}

.v-theme--dark .login-card {
    background-color: rgba(var(--v-theme-primary), 1);
}

.fill-height {
    height: 100% !important;
}

.tracking-tight {
    letter-spacing: -0.02em !important;
}

.hero-svg {
    width: 100%;
    max-width: 425px;
    height: auto;
}

.hero-icon {
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05));
}
</style>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import logo from "@/assets/logo.svg";

const route = useRoute();
const errorMessage = ref<string | null>(null);

const handleGoogleLogin = () => {
    const BACKEND_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    window.location.href = `${BACKEND_URL}/auth/google`;
};

const headericon = computed(() => ({
    name: "",
    icon: logo,
}));

onMounted(() => {
    // Keep only login error checks
    if (route.query.error === "not_allowed") {
        errorMessage.value = "Error: Login with this account is not permitted";
    }
});
</script>
