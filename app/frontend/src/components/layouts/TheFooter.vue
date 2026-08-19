<!-- src/components/layouts/TheFooter.vue -->
<template>
    <v-footer class="text-center d-flex flex-column ga-2 py-4">
        <v-divider class="my-2" thickness="2" width="50"></v-divider>
        <div class="text-caption opacity-60">Secure TASM</div>
        <div>
            {{ new Date().getFullYear() }} —
            <strong>102℃</strong>
        </div>
    </v-footer>
</template>
