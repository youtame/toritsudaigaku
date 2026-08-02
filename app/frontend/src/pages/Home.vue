<!-- pages/Home.vue -->
<template>
    <v-container fluid>
        <div class="hero">
            <v-img :src="logoimage" alt="Main Visual" class="hero-image" />
            <div class="main-title">
                <h1>Secure TASM</h1>
                <h2>Access your files<br />Anywhere</h2>
                <h3>
                    Easy storage built directly into your own private website.
                </h3>
                <v-btn
                    variant="outlined"
                    color="primary"
                    class="code-style-btn px-10"
                    size="x-large"
                    to="/dashboard"
                >
                    <span class="btn-text font-weight-bold">Login</span>
                    <v-icon
                        end
                        icon="mdi-chevron-right"
                        class="arrow-icon"
                    ></v-icon>
                </v-btn>
            </div>
        </div>

        <div class="features-section rounded-lg">
            <v-row>
                <v-col cols="12" md="4">
                    <div class="feature-item glass-card">
                        <div class="feature-icon-wrapper mb-4">
                            <v-icon
                                icon="mdi-account-lock"
                                color="primary"
                                size="40"
                            ></v-icon>
                        </div>
                        <h3 class="text-h6 font-weight-bold mb-3">Secure</h3>
                        <p
                            class="text-body-2 text-medium-emphasis leading-relaxed"
                        >
                            Securely stored on our own servers and encrypted
                            media. Please use with confidence. Secure is
                            important.
                        </p>
                    </div>
                </v-col>

                <v-col cols="12" md="4">
                    <div class="feature-item glass-card">
                        <div class="feature-icon-wrapper mb-4">
                            <v-icon
                                icon="mdi-export-variant"
                                color="primary"
                                size="40"
                            ></v-icon>
                        </div>
                        <h3 class="text-h6 font-weight-bold mb-3">
                            Easy to Share
                        </h3>
                        <p
                            class="text-body-2 text-medium-emphasis leading-relaxed"
                        >
                            Strictly control file access by precisely specifying
                            authorized individuals for each file, ensuring
                            secure sharing.
                        </p>
                    </div>
                </v-col>

                <v-col cols="12" md="4">
                    <div class="feature-item glass-card">
                        <div class="feature-icon-wrapper mb-4">
                            <v-icon
                                icon="mdi-cloud-check"
                                color="primary"
                                size="40"
                            ></v-icon>
                        </div>
                        <h3 class="text-h6 font-weight-bold mb-3">
                            High Availability
                        </h3>
                        <p
                            class="text-body-2 text-medium-emphasis leading-relaxed"
                        >
                            Powered by Amazon S3 for exceptional reliability,
                            scalability, and seamless content delivery.
                        </p>
                    </div>
                </v-col>
            </v-row>
        </div>

        <div class="notice-section">
            <v-alert v-if="loading" type="info" variant="tonal">
                Loading…
            </v-alert>

            <v-alert v-else-if="error" type="error" variant="tonal">
                Failed to retrieve notifications.
            </v-alert>

            <v-list class="rounded-lg mb-1 pa-1" v-else>
                <v-expansion-panels variant="accordion">
                    <v-expansion-panel
                        v-for="(item, index) in notices"
                        :key="index"
                        elevation="0"
                        class="pt-2 pb-2"
                    >
                        <v-expansion-panel-title>
                            <div class="notice-header">
                                <span class="notice-date font-weight-semibold">
                                    {{ formatDate(item.info_date) }}
                                </span>
                                <span class="notice-title">
                                    {{ item.title || item.information }}
                                </span>
                            </div>
                        </v-expansion-panel-title>

                        <v-expansion-panel-text>
                            <span class="notice-text">{{
                                item.information
                            }}</span>

                            <div v-if="item.links?.length">
                                <template v-for="(link, i) in item.links">
                                    <v-btn
                                        v-if="link.external"
                                        :key="'external-' + i"
                                        :href="link.url"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="text"
                                        class="notice-link font-weight-semibold"
                                    >
                                        {{ link.text }}
                                    </v-btn>

                                    <v-btn
                                        v-else
                                        :key="'internal-' + i"
                                        :to="link.url"
                                        variant="text"
                                        class="notice-link font-weight-semibold border-md"
                                    >
                                        {{ link.text }}
                                    </v-btn>
                                </template>
                            </div>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-list>
        </div>
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import logoimage from "@/assets/logo.svg";

interface Language {
    name: string;
    ratio: number;
    color: string;
}

export interface NoticeLink {
    text: string;
    url: string;
    external?: boolean;
}

type Notice = {
    title: string;
    information: string;
    info_date: string;
    links?: NoticeLink[];
};

const notices = ref<Notice[]>([]);
const loading = ref(true);
const error = ref(false);

onMounted(async () => {
    try {
        const baseUrl = import.meta.env.BASE_URL;
        const res = await fetch(`${baseUrl}information/securetasm-info.json`);

        if (!res.ok) throw new Error("fetch failed");
        notices.value = await res.json();
    } catch (e) {
        error.value = true;
    } finally {
        loading.value = false;
    }
});

const formatDate = (dateStr: string) => {
    // "2025-03-12-10:35" to "2025/03/12 10:35"
    const [y, m, d, hm] = dateStr.split("-");
    return `${y}/${m}/${d} ${hm}`;
};
</script>

<style lang="scss" scoped>
.glass-card {
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);

    box-shadow: 0 8px 32px 0 rgba(var(--v-theme-primary), 0.1) !important;
}

.v-theme--dark .glass-card {
    background: rgba(30, 30, 30, 0.4) !important;
}

.code-style-btn {
    font-family: "Fira Code", "Courier New", monospace;
    border-width: 2px;
}
.btn-text::before {
    content: "$ ";
    opacity: 0.6;
}
.leading-relaxed {
    line-height: 1.8 !important;
    letter-spacing: 0.02em;
}

.v-container {
    padding: 16px 0px 16px 0px !important;
}

.hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 35px;
    max-width: 1100px;
    margin: 45px auto 0;
    animation: fadeUp 0.6s ease-out;
}

.hero-image {
    flex: 1;
    order: 2;
    width: 500px;
    height: 250px;
}

.yoko {
    display: block;
}

.main-visual {
    max-width: 1000px;
    margin: 80px auto 0;
}

.main-photo {
    border-radius: 12px;
    filter: grayscale(75%) brightness(0.9) contrast(0.95);
}

.visual-wrapper {
    width: 100%;
    aspect-ratio: 16 / 9;
}

.main-title {
    flex: 1.2;
    order: 1;
    font-size: 25px;
}

.main-title h1 {
    font-family: "Inter";
    letter-spacing: 1px;
    font-size: 60px;
    font-weight: bold;
    line-height: 1;
    margin-bottom: 12px;
    color: rgb(var(--v-theme-primary));
}

.main-title h2 {
    font-family: "Inter", "Zen Kaku Gothic New", sans-serif;
    font-size: 50px;
    font-weight: bold;
    line-height: 1.3;
    margin-bottom: 12px;
}

.main-title h3 {
    font-weight: bold;
    font-size: 24px;
    color: #999999;
}

.hero-image {
    flex-shrink: 0;
}

.features-section {
    max-width: 1100px;
    margin: 60px 0px 30px 0px;
}

.feature-item {
    padding: 16px;
    border-radius: 12px;
    transition: background-color 0.3s ease;
}

.feature-item:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
}

.feature-card:hover {
    transform: translateY(-4px);
    border-color: rgb(var(--v-theme-primary));
}

.notice-section {
    max-width: 1200px;
    margin: 60px auto 60px;
}

.notice-item {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding: 18px 0;
}

.notice-text {
    font-size: 20px;
}

.notice-link {
    margin: 10px 0px 10px 0px;
}

.notice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 24px;

    .notice-title {
        font-weight: 600;
        font-size: 18px;
        line-height: 1.5;
        flex: 1 1 auto;
        min-width: 0;
        word-break: break-word;
    }

    .notice-date {
        padding: 4px 18px;
        border-radius: 5px;
        font-size: 16px;
        color: #fff;
        background-color: rgb(var(--v-theme-primary));
        flex-shrink: 0;
    }
}

.main-button {
    display: block;
    width: 100%;
    max-width: 1100px;
    min-width: 220px;
    height: 50px;
    gap: 12px;
    padding: 0 16px;

    font-size: 17px;
    font-weight: 600;
    text-align: center;
}

.warning-card {
    max-width: 1100px;
    margin: 10px auto 45px;
    font-size: 16px;
}

.warning-section {
    max-width: 1000px;
}

.slide-enter-active,
.slide-leave-active {
    transition:
        transform 1s ease,
        opacity 1s ease;
}

.slide-enter-from {
    transform: translateX(20px);
    opacity: 0;
}

.slide-leave-to {
    transform: translateX(-20px);
    opacity: 0;
}

@media (max-width: 1100px) and (min-width: 961px) {
    .main-title {
        flex: 1;
    }
    .hero-image {
        flex: 1;
        width: 400px;
    }
    .main-title h1 {
        font-size: 48px;
    }
    .main-title h2 {
        font-size: 42px;
    }
}

@media (max-width: 960px) {
    .hero {
        margin: 40px auto 0;
        flex-direction: column;
        text-align: center;
    }

    .hero-image {
        order: 1;
    }

    .main-title {
        order: 2;
    }

    .main-title h1 {
        text-align: center;
        font-size: 45px;
    }
    .main-title h2 {
        text-align: center;
        font-size: 40px;
    }
    .main-title h3 {
        text-align: center;
    }

    .main-title h3 {
        font-size: 20px;
    }
}

@media (max-width: 600px) {
    .hero-image {
        width: 90% !important;
        max-width: 400px;
        height: auto !important;
        margin: 0 auto;
    }

    .line-button {
        flex: 1 1 95%;
        max-width: none;
    }
}

@keyframes fadeUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 480px) {
    .notice-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;

        .notice-date {
            margin-top: 4px;
        }
    }
}
</style>
