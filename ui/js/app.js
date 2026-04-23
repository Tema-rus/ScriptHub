import { dom } from "./core/dom.js";

import { initCustomSelects } from "./ui/customSelect.js";

import {
    openModal,
    closeModal,
    closeConfirm,
    setupConfirmModal,
} from "./ui/modals.js";
import {
    setupSearch,
    syncSearchFieldState,
} from "./ui/search.js";
import {
    setupSystemMenu,
    closeSystemMenu,
} from "./ui/systemMenu.js";

import {
    applyFilters,
    setupFilters,
    setupTileActions,
    loadTools,
} from "./features/tools.js";
import {
    setupToolForm,
    openEditToolModal,
} from "./features/toolForm.js";
import {
    setupWireguard,
    resetWireGuardForm,
    handleWireguardModalBackdropClick,
} from "./features/wireguard.js";
import {
    setupAutostart,
    loadAppSettings,
} from "./features/autostart.js";
import { setupSystemActions } from "./features/systemActions.js";
import { setupWindowControls } from "./features/windowControls.js";

function setupModals() {
    document.addEventListener("click", (event) => {
        const closeButton = event.target.closest("[data-close-modal]");
        if (!closeButton) {
            return;
        }

        const modalId = closeButton.dataset.closeModal;

        if (modalId === "confirm-modal") {
            closeConfirm();
            return;
        }

        const modal = document.getElementById(modalId);
        closeModal(modal);

        if (modalId === "wg-modal") {
            resetWireGuardForm();
        }
    });

    dom.toolModal?.addEventListener("click", (event) => {
        if (event.target === dom.toolModal) {
            closeModal(dom.toolModal);
        }
    });

    dom.wgModal?.addEventListener("click", (event) => {
        handleWireguardModalBackdropClick(event);
    });
}

function setupGlobalHotkeys() {
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && dom.systemMenu && !dom.systemMenu.hidden) {
            closeSystemMenu();
            return;
        }

        if (event.key !== "Escape") {
            return;
        }

        if (dom.confirmModal && !dom.confirmModal.hidden) {
            closeConfirm();
            return;
        }

        if (dom.toolModal && !dom.toolModal.hidden) {
            closeModal(dom.toolModal);
            return;
        }

        if (dom.wgModal && !dom.wgModal.hidden) {
            closeModal(dom.wgModal);
            resetWireGuardForm();
        }
    });
}

async function initializeApp() {
    setupWindowControls();
    setupModals();
    setupConfirmModal();
    setupSystemMenu();

    setupTileActions((tool) => {
        openEditToolModal(tool);
    });

    setupSearch(applyFilters);
    setupToolForm();
    setupFilters();
    setupGlobalHotkeys();
    setupAutostart();
    setupSystemActions();
    setupWireguard();

    syncSearchFieldState();

    await Promise.all([
        loadTools(),
        loadAppSettings(),
    ]);

    initCustomSelects();
}

initializeApp();