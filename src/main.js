import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import { i18n } from "./i18n";
import { registerDirectives } from "./directives";
import App from "./App.vue";
import router from "./router";

// Import styles
import "./assets/styles/index.scss";

// Create Vue app
const app = createApp(App);

// Configure Pinia with persistence
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// Register Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// Register custom directives
registerDirectives(app);

// Use plugins
app.use(pinia);
app.use(router);
app.use(i18n);
app.use(ElementPlus);

// Set initial theme from store
import { useAppStore } from "./store/modules/app";
const appStore = useAppStore();
document.body.setAttribute("data-theme", appStore.theme);

// Set body style to prevent scrolling
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.position = "fixed";
document.body.style.width = "100vw";
document.body.style.height = "100vh";

// Mount the app
app.mount("#app");
