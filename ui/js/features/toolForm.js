import { dom } from "../core/dom.js";
import { setToolsState } from "../core/state.js";
import { showToast } from "../ui/toasts.js";
import {
    openModal,
    closeModal,
    openConfirm,
} from "../ui/modals.js";
import { applyFilters } from "./tools.js";

export function applyToolTypePreset(type) {
    if (!dom.toolLaunchMode || !dom.toolPythonPath || !dom.toolPythonPathField) {
        return;
    }

    const isPython = type === "python";

    dom.toolPythonPathField.hidden = !isPython;
    dom.toolPythonPath.disabled = !isPython;

    if (dom.toolPickPythonButton) {
        dom.toolPickPythonButton.disabled = !isPython;
    }

    switch (type) {
        case "python":
            dom.toolLaunchMode.value = "gui";
            break;

        case "exe":
            dom.toolLaunchMode.value = "gui";
            dom.toolPythonPath.value = "";
            break;

        case "bat":
            dom.toolLaunchMode.value = "console";
            dom.toolPythonPath.value = "";
            break;

        case "ps1":
            dom.toolLaunchMode.value = "console";
            dom.toolPythonPath.value = "";
            break;

        default:
            dom.toolLaunchMode.value = "gui";
            dom.toolPythonPathField.hidden = false;
            dom.toolPythonPath.disabled = false;

            if (dom.toolPickPythonButton) {
                dom.toolPickPythonButton.disabled = false;
            }
    }
}

function resetToolForm() {
    if (!dom.toolForm) {
        return;
    }

    dom.toolForm.reset();
    dom.toolId.value = "";
    dom.toolModalTitle.textContent = "Добавить инструмент";

    if (dom.toolDeleteButton) {
        dom.toolDeleteButton.hidden = true;
    }

    if (dom.toolArgs) {
        dom.toolArgs.value = "";
    }

    applyToolTypePreset(dom.toolType.value);
}

function fillToolForm(tool) {
    if (!tool) {
        return;
    }

    dom.toolId.value = tool.id ?? "";
    dom.toolName.value = tool.name ?? "";
    dom.toolType.value = tool.type ?? "python";
    dom.toolLaunchMode.value = tool.launch_mode ?? "gui";
    dom.toolPath.value = tool.path ?? "";
    dom.toolWorkingDir.value = tool.working_dir ?? "";
    dom.toolPythonPath.value = tool.python_path ?? "";
    dom.toolDescription.value = tool.description ?? "";
    dom.toolCategory.value = tool.category ?? "";
    dom.toolFavorite.checked = Boolean(tool.favorite);
    dom.toolArgs.value = Array.isArray(tool.args) ? tool.args.join("\n") : "";

    dom.toolModalTitle.textContent = "Настроить инструмент";

    if (dom.toolDeleteButton) {
        dom.toolDeleteButton.hidden = false;
    }

    applyToolTypePreset(dom.toolType.value);
}

function collectToolFormData() {
    return {
        id: dom.toolId.value.trim(),
        name: dom.toolName.value.trim(),
        type: dom.toolType.value,
        launch_mode: dom.toolLaunchMode.value,
        path: dom.toolPath.value.trim(),
        working_dir: dom.toolWorkingDir.value.trim(),
        python_path: dom.toolPythonPath.value.trim(),
        description: dom.toolDescription.value.trim(),
        category: dom.toolCategory.value.trim(),
        favorite: dom.toolFavorite.checked,
        args: dom.toolArgs.value
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
    };
}

export function openCreateToolModal() {
    resetToolForm();
    openModal(dom.toolModal);
}

export function openEditToolModal(tool) {
    fillToolForm(tool);
    openModal(dom.toolModal);
}

async function refreshTools() {
    const updatedTools = await window.pywebview.api.get_tools();
    setToolsState(updatedTools);
    applyFilters();
}

export function setupToolForm() {
    dom.addToolButton?.addEventListener("click", () => {
        openCreateToolModal();
    });

    dom.toolType?.addEventListener("change", () => {
        applyToolTypePreset(dom.toolType.value);
    });

    dom.toolPickFileButton?.addEventListener("click", async () => {
        if (!window.pywebview?.api?.pick_tool_file) {
            return;
        }

        const result = await window.pywebview.api.pick_tool_file(dom.toolType?.value || "");

        if (!result?.ok) {
            return;
        }

        dom.toolPath.value = result.path ?? "";
        dom.toolWorkingDir.value = result.working_dir ?? "";

        if (result.type) {
            dom.toolType.value = result.type;
        }

        if (typeof result.python_path === "string") {
            dom.toolPythonPath.value = result.python_path;
        }

        applyToolTypePreset(dom.toolType.value);
    });

    dom.toolPickPythonButton?.addEventListener("click", async () => {
        if (!window.pywebview?.api?.pick_python_interpreter) {
            return;
        }

        const result = await window.pywebview.api.pick_python_interpreter();

        if (!result?.ok) {
            return;
        }

        dom.toolPythonPath.value = result.python_path ?? "";
    });

    dom.toolForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!window.pywebview?.api?.save_tool) {
            showToast({
                title: "Ошибка",
                message: "Python API для сохранения пока не подключён.",
                type: "error",
                duration: 5000,
            });
            return;
        }

        const formData = collectToolFormData();
        const result = await window.pywebview.api.save_tool(formData);

        if (!result?.ok) {
            showToast({
                title: "Ошибка сохранения",
                message: result?.message ?? "Неизвестная ошибка",
                type: "error",
                duration: 5000,
            });
            return;
        }

        closeModal(dom.toolModal);
        resetToolForm();

        showToast({
            title: "Сохранено",
            message: result?.message ?? "Инструмент сохранён.",
            type: "success",
            duration: 2600,
        });

        await refreshTools();
    });

    dom.toolDeleteButton?.addEventListener("click", async () => {
        const toolId = dom.toolId.value.trim();

        if (!toolId) {
            return;
        }

        openConfirm({
            title: "Удаление инструмента",
            message: "Удалить этот инструмент из ScriptHub?",
            confirmText: "Удалить",
            onAccept: async () => {
                if (!window.pywebview?.api?.delete_tool) {
                    showToast({
                        title: "Ошибка",
                        message: "Python API для удаления пока не подключён.",
                        type: "error",
                        duration: 5000,
                    });
                    return;
                }

                const result = await window.pywebview.api.delete_tool(toolId);

                if (!result?.ok) {
                    showToast({
                        title: "Ошибка удаления",
                        message: result?.message ?? "Неизвестная ошибка",
                        type: "error",
                        duration: 5000,
                    });
                    return;
                }

                closeModal(dom.toolModal);
                resetToolForm();

                showToast({
                    title: "Удалено",
                    message: result?.message ?? "Инструмент удалён.",
                    type: "success",
                    duration: 2600,
                });

                await refreshTools();
            },
        });
    });
}