import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Secure TASM",
    description: "Easy storage built directly into your own private website.",
    head: [
        // Favicon and related icons
        [
            "link",
            {
                rel: "icon",
                type: "image/png",
                href: "/favicon-96x96.png",
                sizes: "96x96",
            },
        ],
        [
            "link",
            {
                rel: "icon",
                type: "image/svg+xml",
                href: "/favicon.svg",
            },
        ],
        ["link", { rel: "shortcut icon", href: "/favicon.ico" }],
        [
            "link",
            {
                rel: "apple-touch-icon",
                sizes: "180x180",
                href: "/apple-touch-icon.png",
            },
        ],
        [
            "meta",
            { name: "apple-mobile-web-app-title", content: "Tekken Wiki" },
        ],
        ["link", { rel: "manifest", href: "/site.webmanifest" }],

        //OG Tag
        ["meta", { property: "og:type", content: "website" }],
        ["meta", { property: "og:title", content: "Secure TASM" }],
        [
            "meta",
            {
                property: "og:description",
                content:
                    "Secure TASM | Great web service for sharing your secure documents safely.",
            },
        ],
        ["meta", { property: "og:image", content: "/assets/home.png" }],

        // theme-color meta tags for light and dark modes
        [
            "meta",
            {
                name: "theme-color",
                content: "#ffffff",
                media: "(prefers-color-scheme: light)",
            },
        ],
        [
            "meta",
            {
                name: "theme-color",
                content: "#1b1b1f",
                media: "(prefers-color-scheme: dark)",
            },
        ],

        // Google Analytics
        [
            "script",
            {
                async: "",
                src: "https://www.googletagmanager.com/gtag/js?id=G-E0J4HP2C0T",
            },
        ],
        [
            "script",
            {},
            `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-E0J4HP2C0T');
      `,
        ],
    ],
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Home", link: "/" },
            { text: "Introduction", link: "/introduction/what-is-securetasm" },
        ],

        sidebar: [
            {
                text: "Introduction",
                items: [
                    {
                        text: "What is Secure TASM",
                        link: "/introduction/what-is-securetasm",
                    },
                    {
                        text: "Getting Started",
                        link: "/introduction/getting-started",
                    },
                ],
            },
        ],

        socialLinks: [
            {
                icon: "github",
                link: "https://github.com/youtame/toritsudaigaku",
            },
        ],
        footer: {
            message:
                '<div style="opacity: 0.6; font-size: 0.85rem;">Secure TASM</div>',
            copyright: `${new Date().getFullYear()} — <strong>102℃</strong>`,
        },
    },
});
