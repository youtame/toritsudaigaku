// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

// mdi
import "@mdi/font/css/materialdesignicons.css";
import { mdi } from "vuetify/iconsets/mdi";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";

const vuetify = createVuetify({
    theme: {
        defaultTheme: "light",

        themes: {
            light: {
                colors: {
                    primary: "#00bc74",
                    lock: "#311B92",
                },
            },
            dark: {
                colors: {
                    primary: "#00c87b",
                    lock: "#B388FF",
                },
            },
        },
    },
    icons: {
        defaultSet: "mdi",
        sets: {
            mdi,
        },
    },
});

createApp(App).use(router).use(vuetify).mount("#app");
