import { dom } from "../core/dom.js";
import { confirmState } from "../core/state.js";

export function openModal(modal) {
    if (!modal) {
        return;
    }

    modal.hidden = false;
}

export function closeModal(modal) {
    if (!modal) {
        return;
    }

    modal.hidden = true;
}

export function openConfirm({
    title = "Подтверждение",
    message = "Ты уверен?",
    confirmText = "Подтвердить",
    onAccept = null,
} = {}) {
    confirmState.onAccept = onAccept;

    if (dom.confirmTitle) {
        dom.confirmTitle.textContent = title;
    }

    if (dom.confirmMessage) {
        dom.confirmMessage.textContent = message;
    }

    if (dom.confirmAcceptButton) {
        dom.confirmAcceptButton.textContent = confirmText;
    }

    openModal(dom.confirmModal);
}

export function closeConfirm() {
    confirmState.onAccept = null;
    closeModal(dom.confirmModal);
}

export function setupConfirmModal() {
    dom.confirmCancelButton?.addEventListener("click", () => {
        closeConfirm();
    });

    dom.confirmAcceptButton?.addEventListener("click", async () => {
        const handler = confirmState.onAccept;
        closeConfirm();

        if (typeof handler === "function") {
            await handler();
        }
    });

    dom.confirmModal?.addEventListener("click", (event) => {
        if (event.target === dom.confirmModal) {
            closeConfirm();
        }
    });
}