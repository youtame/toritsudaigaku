// src/composables/useThemeSync.ts
import { onMounted, onUnmounted } from "vue";
import { useTheme } from "vuetify";

export function useThemeSync() {
    const theme = useTheme();
    let mediaQuery: MediaQueryList | null = null;

    const updateThemeFromSystem = (e: MediaQueryList | MediaQueryListEvent) => {
        if (!localStorage.getItem("user-theme")) {
            theme.global.name.value = e.matches ? "dark" : "light";
        }
    };

    const toggleTheme = (targetValue?: boolean) => {
        const isDark =
            targetValue !== undefined
                ? targetValue
                : theme.global.current.value.dark;
        const next = isDark ? "light" : "dark";

        theme.global.name.value = next;
        localStorage.setItem("user-theme", next);
    };

    const initTheme = () => {
        const savedTheme = localStorage.getItem("user-theme");
        mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        if (savedTheme) {
            theme.global.name.value = savedTheme;
        } else {
            theme.global.name.value = mediaQuery.matches ? "dark" : "light";
        }

        mediaQuery.addEventListener("change", updateThemeFromSystem);
    };

    const cleanupTheme = () => {
        if (mediaQuery) {
            mediaQuery.removeEventListener("change", updateThemeFromSystem);
        }
    };

    return {
        theme,
        toggleTheme,
        initTheme,
        cleanupTheme,
    };
}