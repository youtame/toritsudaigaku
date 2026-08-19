// src/composables/useAuth.ts
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";

export interface UserState {
    authenticated: boolean;
    userId?: string;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
}

const user = ref<UserState>({ authenticated: false });

export function useAuth() {
    const router = useRouter();
    const route = useRoute();

    const fetchUser = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/me`,
                { credentials: "include" },
            );
            if (response.ok) {
                const data = await response.json();
                user.value = data;
            } else {
                user.value = { authenticated: false };

                const requiresAuth = route.matched.some(
                    (record) => record.meta.requiresAuth,
                );

                if (requiresAuth && route.path !== "/login") {
                    router.push("/login");
                }
            }
        } catch (error) {
            console.error("Failed to fetch user information:", error);
            user.value = { authenticated: false };
        }
    };

    const logout = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/auth/logout`,
                {
                    method: "POST",
                    credentials: "include",
                },
            );

            if (response.ok) {
                router.push("/login");
            } else {
                console.error("Failed to log out.");
            }
        } catch (error) {
            console.error("A network error has occurred:", error);
        }
    };

    return {
        user,
        fetchUser,
        logout,
    };
}
