from pathlib import Path
import os
import subprocess


class StartupService:
    def __init__(
            self,
            app_name: str,
            target_path: Path,
            arguments: list[str] | None = None,
            working_dir: Path | None = None,
    ) -> None:
        self._app_name = app_name
        self._target_path = Path(target_path)
        self._arguments = [str(arg) for arg in (arguments or [])]
        self._working_dir = Path(working_dir) if working_dir else self._target_path.parent

        self._startup_dir = (
                Path(os.environ["APPDATA"])
                / "Microsoft"
                / "Windows"
                / "Start Menu"
                / "Programs"
                / "Startup"
        )
        self._shortcut_path = self._startup_dir / f"{self._app_name}.lnk"

    def is_enabled(self) -> bool:
        return self._shortcut_path.exists()

    def set_enabled(self, enabled: bool) -> None:
        if enabled:
            self._create_shortcut()
        else:
            self._remove_shortcut()

    def _remove_shortcut(self) -> None:
        if self._shortcut_path.exists():
            self._shortcut_path.unlink()

    def _create_shortcut(self) -> None:
        self._startup_dir.mkdir(parents=True, exist_ok=True)

        target = self._ps_quote(self._target_path)
        arguments = self._ps_quote(subprocess.list2cmdline(self._arguments))
        working_dir = self._ps_quote(self._working_dir)
        shortcut_path = self._ps_quote(self._shortcut_path)

        script = f"""
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut({shortcut_path})
$Shortcut.TargetPath = {target}
$Shortcut.Arguments = {arguments}
$Shortcut.WorkingDirectory = {working_dir}
$Shortcut.Save()
""".strip()

        subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
            check=True,
        )

    @staticmethod
    def _ps_quote(value: Path | str) -> str:
        return "'" + str(value).replace("'", "''") + "'"
