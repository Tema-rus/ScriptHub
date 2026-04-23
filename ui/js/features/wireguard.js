import { dom } from "../core/dom.js";
import { showToast } from "../ui/toasts.js";
import { openModal, closeModal } from "../ui/modals.js";

export function resetWireGuardForm() {
    if (dom.wgConfigPath) {
        dom.wgConfigPath.value = "";
    }

    if (dom.wgInterfaceName) {
        dom.wgInterfaceName.value = "Wireguard1";
    }

    if (dom.wgResult) {
        dom.wgResult.value = "";
    }
}

export function openWireguardModal() {
    if (dom.wgInterfaceName && !dom.wgInterfaceName.value.trim()) {
        dom.wgInterfaceName.value = "Wireguard1";
    }

    openModal(dom.wgModal);
}

export function setupWireguard() {
    dom.wgToolButton?.addEventListener("click", () => {
        openWireguardModal();
    });

    dom.wgPickButton?.addEventListener("click", async () => {
        if (!window.pywebview?.api?.pick_wireguard_config) {
            showToast({
                title: "Ошибка",
                message: "Python API выбора файла пока не подключён.",
                type: "error",
                duration: 5000,
            });
            return;
        }

        const result = await window.pywebview.api.pick_wireguard_config();

        if (!result?.ok) {
            return;
        }

        dom.wgConfigPath.value = result.path ?? "";
    });

    dom.wgGenerateButton?.addEventListener("click", async () => {
        const configPath = dom.wgConfigPath?.value?.trim();
        const interfaceName = dom.wgInterfaceName?.value?.trim() || "Wireguard1";

        if (!configPath) {
            showToast({
                title: "Не указан конфиг",
                message: "Укажи путь к конфигу.",
                type: "info",
                duration: 3200,
            });
            return;
        }

        if (!window.pywebview?.api?.generate_wireguard_command) {
            showToast({
                title: "Ошибка",
                message: "Python API генерации WG пока не подключён.",
                type: "error",
                duration: 5000,
            });
            return;
        }

        const result = await window.pywebview.api.generate_wireguard_command(
            configPath,
            interfaceName
        );

        if (!result?.ok) {
            showToast({
                title: "Ошибка генерации",
                message: result?.message ?? "Неизвестная ошибка",
                type: "error",
                duration: 5000,
            });
            return;
        }

        dom.wgResult.value = result.command ?? "";

        showToast({
            title: "Команда сгенерирована",
            message: interfaceName,
            type: "success",
            duration: 2400,
        });
    });

    dom.wgCopyButton?.addEventListener("click", async () => {
        const text = dom.wgResult?.value?.trim();

        if (!text) {
            showToast({
                title: "Нечего копировать",
                message: "Сначала сгенерируй команду.",
                type: "info",
                duration: 2800,
            });
            return;
        }

        if (window.pywebview?.api?.copy_text) {
            const result = await window.pywebview.api.copy_text(text);

            if (!result?.ok) {
                showToast({
                    title: "Ошибка копирования",
                    message: result?.message ?? "Неизвестная ошибка",
                    type: "error",
                    duration: 5000,
                });
                return;
            }

            showToast({
                title: "Скопировано",
                message: "Команда WireGuard скопирована в буфер обмена.",
                type: "success",
                duration: 2400,
            });
            return;
        }

        await navigator.clipboard.writeText(text);

        showToast({
            title: "Скопировано",
            message: "Команда WireGuard скопирована в буфер обмена.",
            type: "success",
            duration: 2400,
        });
    });

    dom.wgClearButton?.addEventListener("click", () => {
        resetWireGuardForm();

        showToast({
            title: "Очищено",
            message: "Поля WireGuard сброшены.",
            type: "info",
            duration: 2000,
        });
    });
}

export function handleWireguardModalBackdropClick(event) {
    if (event.target === dom.wgModal) {
        closeModal(dom.wgModal);
        resetWireGuardForm();
    }
}
