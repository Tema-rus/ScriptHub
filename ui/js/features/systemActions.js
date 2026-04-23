import { dom } from "../core/dom.js";
import { setToolsState } from "../core/state.js";
import { showToast } from "../ui/toasts.js";
import { openConfirm } from "../ui/modals.js";
import { closeSystemMenu } from "../ui/systemMenu.js";
import { applyFilters } from "./tools.js";

export function setupSystemActions() {
    dom.appDataButton?.addEventListener("click", async () => {
        const result = await window.pywebview?.api?.open_app_data_folder?.();

        if (!result?.ok) {
            showToast({
                title: "Ошибка",
                message: result?.message ?? "Не удалось открыть папку данных.",
                type: "error",
                duration: 5000,
            });
            return;
        }

        closeSystemMenu();

        showToast({
            title: "Папка открыта",
            message: "Открыта папка данных ScriptHub.",
            type: "success",
            duration: 2400,
        });
    });

    dom.exportToolsButton?.addEventListener("click", async () => {
        const pickResult = await window.pywebview?.api?.pick_export_file?.();

        if (!pickResult?.ok) {
            return;
        }

        const result = await window.pywebview.api.export_tools(pickResult.path);

        if (!result?.ok) {
            showToast({
                title: "Ошибка экспорта",
                message: result?.message ?? "Не удалось экспортировать конфигурацию.",
                type: "error",
                duration: 5000,
            });
            return;
        }

        closeSystemMenu();

        showToast({
            title: "Экспорт завершён",
            message: result.message,
            type: "success",
            duration: 3200,
        });
    });

    dom.importToolsButton?.addEventListener("click", async () => {
        const pickResult = await window.pywebview?.api?.pick_import_file?.();

        if (!pickResult?.ok) {
            return;
        }

        openConfirm({
            title: "Импорт конфигурации",
            message: "Импорт заменит текущий список инструментов. Продолжить?",
            confirmText: "Импортировать",
            onAccept: async () => {
                const result = await window.pywebview.api.import_tools(pickResult.path);

                if (!result?.ok) {
                    showToast({
                        title: "Ошибка импорта",
                        message: result?.message ?? "Не удалось импортировать конфигурацию.",
                        type: "error",
                        duration: 5000,
                    });
                    return;
                }

                closeSystemMenu();

                showToast({
                    title: "Импорт завершён",
                    message: result.message,
                    type: "success",
                    duration: 3200,
                });

                const updatedTools = await window.pywebview.api.get_tools();
                setToolsState(updatedTools);
                applyFilters();
            },
        });
    });
}