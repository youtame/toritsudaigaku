// src/router/index.ts
import {
    createRouter,
    createWebHistory,
    type RouteRecordRaw,
} from "vue-router";

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        name: "home",
        component: () => import("@/pages/Home.vue"),
        meta: { title: "Secure Cloud Services" },
    },
    {
        path: "/login",
        name: "login",
        component: () => import("@/pages/Login.vue"),
        meta: { title: "Login" },
    },
    {
        path: "/dashboard",
        name: "dashboard",
        component: () => import("@/pages/Dashboard.vue"),
        meta: { title: "Dashboard", requiresAuth: true },
    },
    {
        path: "/dashboard/folder/:pathMatch(.*)*",
        name: "folder-detail",
        component: () => import("@/pages/FolderDetail.vue"),
        meta: { title: "Folder", requiresAuth: true },
    },
];

export const router = createRouter({
    history: createWebHistory("/"),
    routes,
    scrollBehavior: (to, from, savedPosition) => savedPosition || { top: 0 },
});

async function isAuthenticated() {
    try {
        const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/me`;
        const response = await fetch(url, {
            method: "GET",
            credentials: "include",
        });
        if (!response.ok) return false;
        const data = await response.json();
        return !!data.authenticated;
    } catch {
        return false;
    }
}

router.beforeEach(async (to) => {
    const baseTitle = "Secure TASM";
    document.title = to.meta.title
        ? `${baseTitle} | ${to.meta.title}`
        : baseTitle;

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

    if (requiresAuth) {
        const authed = await isAuthenticated();
        if (!authed) {
            return { name: "login" };
        }
    }
});
