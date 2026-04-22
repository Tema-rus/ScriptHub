from datetime import datetime
from pathlib import Path
import json
import os
import subprocess


class ToolService:
    def __init__(self, tools_json_path: Path):
        self._tools_json_path = tools_json_path

    def load_tools(self) -> list[dict]:
        if not self._tools_json_path.exists():
            return []

        with self._tools_json_path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        return data if isinstance(data, list) else []

    def save_tools(self, tools: list[dict]) -> None:
        with self._tools_json_path.open("w", encoding="utf-8") as file:
            json.dump(tools, file, ensure_ascii=False, indent=4)

    def find_tool(self, tool_id) -> tuple[dict | None, list[dict]]:
        tools = self.load_tools()

        for tool in tools:
            if str(tool.get("id")) == str(tool_id):
                return tool, tools

        return None, tools

    def normalize_tool_payload(self, raw_tool: dict) -> tuple[dict | None, str | None]:
        name = str(raw_tool.get("name", "")).strip()
        tool_type = str(raw_tool.get("type", "python")).strip().lower()
        launch_mode = str(raw_tool.get("launch_mode", "gui")).strip().lower()
        path = str(raw_tool.get("path", "")).strip()
        working_dir = str(raw_tool.get("working_dir", "")).strip()
        python_path = str(raw_tool.get("python_path", "")).strip()
        description = str(raw_tool.get("description", "")).strip()
        category = str(raw_tool.get("category", "")).strip()
        favorite = bool(raw_tool.get("favorite", False))

        if not name:
            return None, "Укажи название инструмента."

        if tool_type not in {"python", "exe"}:
            return None, "Тип инструмента должен быть python или exe."

        if launch_mode not in {"gui", "capture", "console"}:
            return None, "Режим запуска должен быть gui, capture или console."

        if not path:
            return None, "Укажи путь к файлу."

        normalized = {
            "name": name,
            "type": tool_type,
            "launch_mode": launch_mode,
            "description": description,
            "favorite": favorite,
            "category": category,
            "path": path.replace("\\", "/"),
            "working_dir": working_dir.replace("\\", "/") if working_dir else str(Path(path).parent).replace("\\", "/"),
            "python_path": python_path.replace("\\", "/") if python_path else "",
            "args": list(raw_tool.get("args") or []),
        }

        if tool_type == "python" and not normalized["python_path"]:
            return None, "Для Python-инструмента укажи python_path."

        return normalized, None

    def save_tool(self, raw_tool: dict) -> dict:
        tools = self.load_tools()

        normalized, error = self.normalize_tool_payload(raw_tool)
        if error:
            return {"ok": False, "message": error}

        raw_id = raw_tool.get("id")

        if raw_id in ("", None):
            next_id = max((int(tool.get("id", 0)) for tool in tools), default=0) + 1
            normalized["id"] = next_id
            normalized["launch_count"] = 0

            tools.append(normalized)
            self.save_tools(tools)

            return {"ok": True, "message": "Инструмент добавлен.", "tool": normalized}

        target_id = int(raw_id)

        for existing_tool in tools:
            if int(existing_tool.get("id", 0)) == target_id:
                launch_count = int(existing_tool.get("launch_count", 0))

                existing_tool.update(normalized)
                existing_tool["id"] = target_id
                existing_tool["launch_count"] = launch_count

                self.save_tools(tools)

                return {"ok": True, "message": "Инструмент обновлён.", "tool": existing_tool}

        return {"ok": False, "message": "Инструмент для обновления не найден."}

    def delete_tool(self, tool_id) -> dict:
        tools = self.load_tools()

        new_tools = [
            tool for tool in tools
            if str(tool.get("id")) != str(tool_id)
        ]

        if len(new_tools) == len(tools):
            return {"ok": False, "message": "Инструмент не найден."}

        self.save_tools(new_tools)
        return {"ok": True, "message": "Инструмент удалён."}

    def build_command(self, tool: dict) -> tuple[list[str] | None, str | None]:
        path = tool.get("path")
        if not path:
            return None, "У инструмента не указан путь."

        tool_path = Path(path)
        if not tool_path.exists():
            return None, f"Файл не найден: {tool_path}"

        args = [str(arg) for arg in (tool.get("args") or [])]
        tool_type = str(tool.get("type", "")).lower()

        if tool_type == "python":
            python_path = tool.get("python_path")
            if not python_path:
                return None, "Для Python-инструмента не указан python_path."

            interpreter = Path(python_path)
            if not interpreter.exists():
                return None, f"Интерпретатор не найден: {interpreter}"

            return [str(interpreter), str(tool_path), *args], None

        if tool_type == "exe":
            return [str(tool_path), *args], None

        return None, f"Неподдерживаемый тип инструмента: {tool_type}"

    def get_working_dir(self, tool: dict) -> tuple[Path | None, str | None]:
        path = tool.get("path")
        working_dir = tool.get("working_dir")

        if working_dir:
            folder = Path(working_dir)
        elif path:
            folder = Path(path).parent
        else:
            return None, "Не удалось определить рабочую папку."

        if not folder.exists():
            return None, f"Рабочая папка не найдена: {folder}"

        return folder, None

    def increment_launch_count(self, tool: dict, tools: list[dict]) -> None:
        tool["launch_count"] = int(tool.get("launch_count", 0)) + 1
        tool["last_launch_at"] = datetime.now().isoformat(timespec="seconds")
        self.save_tools(tools)

    def run_tool(self, tool_id) -> dict:
        tool, tools = self.find_tool(tool_id)

        if not tool:
            return {"ok": False, "message": "Инструмент не найден."}

        command, command_error = self.build_command(tool)
        if command_error:
            return {"ok": False, "message": command_error}

        working_dir, dir_error = self.get_working_dir(tool)
        if dir_error:
            return {"ok": False, "message": dir_error}

        launch_mode = str(tool.get("launch_mode", "gui")).lower()

        try:
            if launch_mode == "gui":
                subprocess.Popen(command, cwd=str(working_dir), shell=False)
                self.increment_launch_count(tool, tools)
                return {"ok": True, "mode": "gui", "message": f"Запущено: {tool.get('name', 'Без названия')}"}

            if launch_mode == "capture":
                completed = subprocess.run(
                    command,
                    cwd=str(working_dir),
                    shell=False,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace"
                )

                self.increment_launch_count(tool, tools)

                output_parts = []
                stdout_text = (completed.stdout or "").strip()
                stderr_text = (completed.stderr or "").strip()

                if stdout_text:
                    output_parts.append(stdout_text)

                if stderr_text:
                    output_parts.append(f"[stderr]\n{stderr_text}")

                combined_output = "\n\n".join(output_parts).strip()

                return {
                    "ok": completed.returncode == 0,
                    "mode": "capture",
                    "return_code": completed.returncode,
                    "output": combined_output,
                    "message": "Команда выполнена." if completed.returncode == 0 else "Команда завершилась с ошибкой."
                }

            if launch_mode == "console":
                command_line = subprocess.list2cmdline(command)

                subprocess.Popen(
                    ["cmd.exe", "/k", command_line],
                    cwd=str(working_dir),
                    shell=False
                )

                self.increment_launch_count(tool, tools)
                return {"ok": True, "mode": "console",
                        "message": f"Открыта консоль: {tool.get('name', 'Без названия')}"}

            return {"ok": False, "message": f"Неподдерживаемый launch_mode: {launch_mode}"}

        except Exception as error:
            return {"ok": False, "message": str(error)}

    def open_tool_folder(self, tool_id) -> dict:
        tool, _ = self.find_tool(tool_id)

        if not tool:
            return {"ok": False, "message": "Инструмент не найден."}

        working_dir, dir_error = self.get_working_dir(tool)
        if dir_error:
            return {"ok": False, "message": dir_error}

        try:
            os.startfile(str(working_dir))
            return {"ok": True, "message": f"Открыта папка: {working_dir}"}
        except Exception as error:
            return {"ok": False, "message": str(error)}
