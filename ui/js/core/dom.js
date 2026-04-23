export const dom = {
    tiles: document.getElementById("tiles"),
    filesCount: document.getElementById("files-count"),

    searchToggle: document.querySelector(".search-toggle"),
    searchToggleButton: document.getElementById("search-toggle-button"),
    searchInput: document.getElementById("tools-search"),
    searchField: document.querySelector(".search-inline-field"),

    filterSelect: document.getElementById("library-filter-select"),

    addToolButton: document.getElementById("add-tool-button"),
    wgToolButton: document.getElementById("wg-tool-button"),

    systemMenuToggle: document.getElementById("system-menu-toggle"),
    systemMenu: document.getElementById("system-menu"),

    autostartButton: document.getElementById("autostart-button"),
    appDataButton: document.getElementById("app-data-button"),
    exportToolsButton: document.getElementById("export-tools-button"),
    importToolsButton: document.getElementById("import-tools-button"),

    toolModal: document.getElementById("tool-modal"),
    wgModal: document.getElementById("wg-modal"),
    confirmModal: document.getElementById("confirm-modal"),

    toolModalTitle: document.getElementById("tool-modal-title"),
    toolForm: document.getElementById("tool-form"),

    toolId: document.getElementById("tool-id"),
    toolName: document.getElementById("tool-name"),
    toolType: document.getElementById("tool-type"),
    toolLaunchMode: document.getElementById("tool-launch-mode"),
    toolPath: document.getElementById("tool-path"),
    toolWorkingDir: document.getElementById("tool-working-dir"),
    toolPythonPathField: document.getElementById("tool-python-path-field"),
    toolPythonPath: document.getElementById("tool-python-path"),
    toolDescription: document.getElementById("tool-description"),
    toolCategory: document.getElementById("tool-category"),
    toolFavorite: document.getElementById("tool-favorite"),
    toolArgs: document.getElementById("tool-args"),

    toolPickFileButton: document.getElementById("tool-pick-file-button"),
    toolPickPythonButton: document.getElementById("tool-pick-python-button"),
    toolDeleteButton: document.getElementById("tool-delete-button"),

    wgConfigPath: document.getElementById("wg-config-path"),
    wgInterfaceName: document.getElementById("wg-interface-name"),
    wgResult: document.getElementById("wg-result"),
    wgGenerateButton: document.getElementById("wg-generate-button"),
    wgCopyButton: document.getElementById("wg-copy-button"),
    wgPickButton: document.getElementById("wg-pick-button"),
    wgClearButton: document.getElementById("wg-clear-button"),

    confirmTitle: document.getElementById("confirm-title"),
    confirmMessage: document.getElementById("confirm-message"),
    confirmAcceptButton: document.getElementById("confirm-accept-button"),
    confirmCancelButton: document.getElementById("confirm-cancel-button"),
};