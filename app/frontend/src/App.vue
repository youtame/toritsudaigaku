<!-- App.vue -->
<template>
    <v-app>
        <TheHeader @toggle-drawer="drawer = !drawer" v-if="isNotLogin" />

        <TheDrawer v-model="drawer" v-if="isNotLogin" />

        <v-main :class="['flex-grow-1 d-flex', { 'main-view': isNotLogin }]">
            <router-view />
        </v-main>

        <TheFooter v-if="isNotLogin" />
    </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import TheHeader from "@/components/layouts/TheHeader.vue";
import TheDrawer from "@/components/layouts/TheDrawer.vue";
import TheFooter from "@/components/layouts/TheFooter.vue";

const route = useRoute();
const drawer = ref(false);

const { fetchUser } = useAuth();

onMounted(() => {
    fetchUser();
});

const isNotLogin = computed(() => {
    const normalizedPath = route.path.replace(/^\/|\/$/g, "");
    return normalizedPath !== "login";
});
</script>
<style lang="css" scoped>
.main-view {
    width: 90%;
    max-width: 1100px;
    margin: auto;
}
</style>
