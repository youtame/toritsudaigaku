<!-- App.vue -->
<template>
    <v-app>
        <!-- ヘッダーを別コンポーネント化 -->
        <TheHeader v-if="isNotLogin" @toggle-drawer="drawer = !drawer" />

        <!-- モバイル用ドロワーを別コンポーネント化 -->
        <TheDrawer v-model="drawer" v-if="isNotLogin" />

        <!-- メインコンテンツ -->
        <v-main :class="['flex-grow-1 d-flex', { 'main-view': isNotLogin }]">
            <router-view />
        </v-main>

        <!-- フッターを別コンポーネント化 -->
        <TheFooter v-if="isNotLogin" />
    </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import TheHeader from "@/components/layouts/TheHeader.vue";
import TheDrawer from "@/components/layouts/TheDrawer.vue";
import TheFooter from "@/components/layouts/TheFooter.vue";

const route = useRoute();
const drawer = ref(false);

const isNotLogin = computed(() => {
    const normalizedPath = route.path.replace(/^\/|\/$/g, "");
    return normalizedPath !== "login";
});
</script>
