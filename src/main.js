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

// 导入样式
import "./assets/styles/index.scss";

// 创建Vue应用
const app = createApp(App);

// 配置Pinia持久化
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 注册自定义指令
registerDirectives(app);

// 使用插件
app.use(pinia);
app.use(router);
app.use(i18n);
app.use(ElementPlus);

// 从存储中设置初始主题
import { useAppStore } from "./store/modules/app";
const appStore = useAppStore();

// 确保DOM加载后设置主题
document.addEventListener('DOMContentLoaded', () => {
  document.body.setAttribute("data-theme", appStore.theme);
});

// 设置body样式以防止滚动
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.position = "fixed";
document.body.style.width = "100vw";
document.body.style.height = "100vh";

// 立即设置主题，避免闪烁
document.body.setAttribute("data-theme", appStore.theme);

// 挂载应用
app.mount("#app");