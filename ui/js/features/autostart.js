import { dom } from "../core/dom.js";
import { appSettings } from "../core/state.js";
import { waitForPywebviewApi } from "../core/utils.js";
import { showToast } from "../ui/toasts.js";
import { closeSystemMenu } from "../ui/systemMenu.js";

export function syncAutostartButton() {
    if (!dom.autostartButton) {
        return;
    }

    dom.autostartButton.textContent = `Автозапуск: ${appSettings.autostart ? "вкл" : "выкл"}`;
    dom.autostartButton.classList.toggle("is-active", appSettings.autostart);
}

export async function loadAppSettings() {
    try {
        const hasPywebviewApi = await waitForPywebviewApi();

        if (!hasPywebviewApi || !window.pywebview?.api?.get_app_settings) {
            return;
        }

        const settings = await window.pywebview.api.get_app_settings();
        appSettings.autostart = Boolean(settings?.autostart);
        syncAutostartButton();
    } catch (error) {
        console.error("Ошибка загрузки настроек приложения:", error);
    }
}

export function setupAutostart() {
    dom.autostartButton?.addEventListener("click", async () => {
        if (!window.pywebview?.api?.set_autostart) {
            showToast({
                title: "Ошибка",
                message: "Python API автозапуска пока не подключён.",
                type: "error",
                duration: 5000,
            });
            return;
        }

        const result = await window.pywebview.api.set_autostart(!appSettings.autostart);

        if (!result?.ok) {
            showToast({
                title: "Ошибка автозапуска",
                message: result?.message ?? "Неизвестная ошибка",
                type: "error",
                duration: 5000,
            });
            return;
        }

        appSettings.autostart = Boolean(result.autostart);
        syncAutostartButton();
        closeSystemMenu();

        showToast({
            title: "Автозапуск обновлён",
            message: appSettings.autostart
                ? "ScriptHub будет запускаться вместе с Windows."
                : "Автозапуск ScriptHub отключён.",
            type: "success",
            duration: 3200,
        });
    });
}