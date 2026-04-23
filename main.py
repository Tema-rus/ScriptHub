from pathlib import Path
from shutil import copyfile
import os
import subprocess
import sys
import ctypes
import webview

from services.startup_service import StartupService
from services.tool_service import ToolService
from services.wireguard_service import WireGuardService


APP_NAME = "ScriptHub"

IS_FROZEN = getattr(sys, "frozen", False)
RESOURCE_BASE_DIR = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
PROJECT_BASE_DIR = Path(sys.executable).resolve().parent if IS_FROZEN else Path(__file__).resolve().parent

UI_DIR = RESOURCE_BASE_DIR / "ui"
BUNDLED_DATA_DIR = RESOURCE_BASE_DIR / "data"

APP_DATA_DIR = (
    Path(os.environ["APPDATA"]) / APP_NAME
    if IS_FROZEN
    else PROJECT_BASE_DIR / "data"
)

INDEX_HTML_PATH = UI_DIR / "index.html"
TOOLS_JSON_PATH = APP_DATA_DIR / "tools.json"
TOOLS_EXAMPLE_PATH = BUNDLED_DATA_DIR / "tools.json"

SINGLE_INSTANCE_MUTEX_NAME = "ScriptHub_SingleInstanceMutex"
_single_instance_mutex = None

def acquire_single_instance() -> bool:
    global _single_instance_mutex

    mutex = ctypes.windll.kernel32.CreateMutexW(None, False, SINGLE_INSTANCE_MUTEX_NAME)
    last_error = ctypes.windll.kernel32.GetLastError()

    ERROR_ALREADY_EXISTS = 183

    if last_error == ERROR_ALREADY_EXISTS:
        return False

    _single_instance_mutex = mutex
    return True

def ensure_app_data() -> None:
    APP_DATA_DIR.mkdir(parents=True, exist_ok=True)

    if TOOLS_JSON_PATH.exists():
        return

    if TOOLS_EXAMPLE_PATH.exists():
        copyfile(TOOLS_EXAMPLE_PATH, TOOLS_JSON_PATH)
        return

    TOOLS_JSON_PATH.write_text("[]", encoding="utf-8")


def build_launch_context() -> tuple[Path, list[str], Path]:
    if IS_FROZEN:
        return Path(sys.executable), [], Path(sys.executable).resolve().parent

    return sys.executable and Path(sys.executable), [str(PROJECT_BASE_DIR / "main.py")], PROJECT_BASE_DIR


class ScriptHubApi:
    def __init__(self) -> None:
        self._window = None
        self._is_maximized = False

        self._tool_service = ToolService(TOOLS_JSON_PATH)
        self._wireguard_service = WireGuardService()

        launch_target, launch_arguments, working_dir = build_launch_context()
        self._startup_service = StartupService(
            app_name=APP_NAME,
            target_path=launch_target,
            arguments=launch_arguments,
            working_dir=working_dir,
        )

    def attach_window(self, window) -> None:
        self._window = window

    @staticmethod
    def _normalize_path(path: str | Path) -> str:
        return str(Path(path)).replace("\\", "/")

    def _pick_single_file(self, file_types) -> str | None:
        if not self._window:
            return None

        result = self._window.create_file_dialog(
            webview.FileDialog.OPEN,
            allow_multiple=False,
            file_types=file_types,
        )

        if not result:
            return None

        if isinstance(result, (list, tuple)):
            return str(result[0])

        return str(result)

    # ----------------------------
    # Window controls
    # ----------------------------

    def close_window(self) -> None:
        if self._window:
            self._window.destroy()

    def minimize_window(self) -> None:
        if self._window:
            self._window.minimize()

    def toggle_maximize_window(self) -> None:
        if not self._window:
            return

        if self._is_maximized:
            self._window.restore()
            self._is_maximized = False
        else:
            self._window.maximize()
            self._is_maximized = True

    # ----------------------------
    # App settings
    # ----------------------------

    def get_app_settings(self) -> dict:
        return {
            "autostart": self._startup_service.is_enabled(),
        }

    def set_autostart(self, enabled: bool) -> dict:
        try:
            self._startup_service.set_enabled(bool(enabled))
            return {
                "ok": True,
                "autostart": self._startup_service.is_enabled(),
                "message": "Автозапуск обновлён.",
            }
        except Exception as error:
            return {
                "ok": False,
                "message": str(error),
            }

    # ----------------------------
    # Tools API
    # ----------------------------

    def get_tools(self) -> list[dict]:
        return self._tool_service.enrich_tools(self._tool_service.load_tools())

    def save_tool(self, raw_tool: dict) -> dict:
        return self._tool_service.save_tool(raw_tool)

    def delete_tool(self, tool_id) -> dict:
        return self._tool_service.delete_tool(tool_id)

    def run_tool(self, tool_id) -> dict:
        return self._tool_service.run_tool(tool_id)

    def open_tool_folder(self, tool_id) -> dict:
        return self._tool_service.open_tool_folder(tool_id)

    def open_app_data_folder(self) -> dict:
        try:
            os.startfile(str(APP_DATA_DIR))
            return {"ok": True, "message": f"Открыта папка данных: {APP_DATA_DIR}"}
        except Exception as error:
            return {"ok": False, "message": str(error)}

    def pick_export_file(self) -> dict:
        if not self._window:
            return {"ok": False, "message": "Окно приложения недоступно."}

        result = self._window.create_file_dialog(
            webview.FileDialog.SAVE,
            save_filename="tools.export.json",
            file_types=("JSON files (*.json)", "All files (*.*)"),
        )

        if not result:
            return {"ok": False, "message": "Файл не выбран."}

        if isinstance(result, (list, tuple)):
            result = result[0]

        return {"ok": True, "path": self._normalize_path(result)}

    def pick_import_file(self) -> dict:
        selected = self._pick_single_file((
            "JSON files (*.json)",
            "All files (*.*)",
        ))

        if not selected:
            return {"ok": False, "message": "Файл не выбран."}

        return {"ok": True, "path": self._normalize_path(selected)}

    def export_tools(self, destination_path: str) -> dict:
        return self._tool_service.export_tools(destination_path)

    def import_tools(self, source_path: str) -> dict:
        return self._tool_service.import_tools(source_path)

    # ----------------------------
    # File pickers
    # ----------------------------

    def pick_tool_file(self, preferred_type: str = "") -> dict:
        preferred_type = str(preferred_type or "").strip().lower()

        match preferred_type:
            case "python":
                file_types = (
                    "Python files (*.py)",
                    "All files (*.*)",
                )
            case "exe":
                file_types = (
                    "Executable files (*.exe)",
                    "All files (*.*)",
                )
            case "bat":
                file_types = (
                    "Batch files (*.bat;*.cmd)",
                    "All files (*.*)",
                )
            case "ps1":
                file_types = (
                    "PowerShell files (*.ps1)",
                    "All files (*.*)",
                )
            case _:
                file_types = (
                    "Script and executable files (*.py;*.exe;*.bat;*.cmd;*.ps1)",
                    "Python files (*.py)",
                    "Executable files (*.exe)",
                    "Batch files (*.bat;*.cmd)",
                    "PowerShell files (*.ps1)",
                    "All files (*.*)",
                )

        selected = self._pick_single_file(file_types)

        if not selected:
            return {"ok": False, "message": "Файл не выбран."}

        tool_path = Path(selected)
        working_dir = tool_path.parent

        payload = {
            "ok": True,
            "path": self._normalize_path(tool_path),
            "working_dir": self._normalize_path(working_dir),
        }

        suffix = tool_path.suffix.lower()

        if suffix == ".py":
            payload["type"] = "python"

            pythonw_path = working_dir / ".venv" / "Scripts" / "pythonw.exe"
            python_path = working_dir / ".venv" / "Scripts" / "python.exe"

            if pythonw_path.exists():
                payload["python_path"] = self._normalize_path(pythonw_path)
            elif python_path.exists():
                payload["python_path"] = self._normalize_path(python_path)

        elif suffix == ".exe":
            payload["type"] = "exe"
            payload["python_path"] = ""

        elif suffix in {".bat", ".cmd"}:
            payload["type"] = "bat"
            payload["python_path"] = ""

        elif suffix == ".ps1":
            payload["type"] = "ps1"
            payload["python_path"] = ""

        return payload

    def pick_python_interpreter(self) -> dict:
        selected = self._pick_single_file((
            "Python interpreter (*.exe)",
            "Executable files (*.exe)",
            "All files (*.*)",
        ))

        if not selected:
            return {"ok": False, "message": "Интерпретатор не выбран."}

        return {
            "ok": True,
            "python_path": self._normalize_path(selected),
        }

    def pick_wireguard_config(self) -> dict:
        selected = self._pick_single_file((
            "Config files (*.conf;*.ini;*.txt)",
            "All files (*.*)",
        ))

        if not selected:
            return {"ok": False, "message": "Файл не выбран."}

        return {
            "ok": True,
            "path": self._normalize_path(selected),
        }

    # ----------------------------
    # WireGuard API
    # ----------------------------

    def generate_wireguard_command(self, config_path: str, interface_name: str) -> dict:
        try:
            command = self._wireguard_service.generate_from_file(config_path, interface_name)
            return {
                "ok": True,
                "command": command,
                "message": "Команда успешно сгенерирована.",
            }
        except Exception as error:
            return {
                "ok": False,
                "message": str(error),
            }

    def copy_text(self, text: str) -> dict:
        try:
            subprocess.run(
                "clip",
                input=str(text),
                text=True,
                shell=True,
                check=True,
            )
            return {
                "ok": True,
                "message": "Текст скопирован в буфер обмена.",
            }
        except Exception as error:
            return {
                "ok": False,
                "message": str(error),
            }


def main() -> None:
    if not acquire_single_instance():
        ctypes.windll.user32.MessageBoxW(
            None,
            "ScriptHub уже запущен.",
            "ScriptHub",
            0x00000040
        )
        return

    ensure_app_data()

    api = ScriptHubApi()

    window = webview.create_window(
        title=" ",
        url=INDEX_HTML_PATH.as_uri(),
        js_api=api,
        width=1440,
        height=920,
        min_size=(1100, 700),
        frameless=False,
    )

    api.attach_window(window)
    webview.start()


if __name__ == "__main__":
    main()