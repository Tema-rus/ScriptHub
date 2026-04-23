export function escapeHtml(value) {
    const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };

    return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}

export function formatFilesCount(count) {
    if (count % 10 === 1 && count % 100 !== 11) {
        return `${count} файл`;
    }

    if (
        count % 10 >= 2 &&
        count % 10 <= 4 &&
        (count % 100 < 12 || count % 100 > 14)
    ) {
        return `${count} файла`;
    }

    return `${count} файлов`;
}

export function formatLastLaunch(value) {
    if (!value) {
        return "Ещё не запускался";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Дата недоступна";
    }

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function waitForPywebviewApi(timeout = 5000) {
    if (window.pywebview?.api) {
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        let resolved = false;

        const finish = (value) => {
            if (resolved) {
                return;
            }

            resolved = true;
            window.removeEventListener("pywebviewready", onReady);
            resolve(value);
        };

        const onReady = () => {
            finish(true);
        };

        window.addEventListener("pywebviewready", onReady, { once: true });
        setTimeout(() => finish(Boolean(window.pywebview?.api)), timeout);
    });
}