from pathlib import Path
import configparser


class WireGuardService:
    REQUIRED_KEYS = ("Jc", "Jmin", "Jmax", "S1", "S2", "H1", "H2", "H3", "H4")

    def read_interface(self, config_path: str | Path) -> dict:
        path = Path(config_path)

        if not path.exists():
            raise ValueError(f"Файл не найден: {path}")

        config = configparser.ConfigParser()
        config.optionxform = str

        read_files = config.read(path, encoding="utf-8")
        if not read_files:
            raise ValueError("Не удалось прочитать конфиг.")

        if not config.has_section("Interface"):
            raise ValueError("В конфиге отсутствует секция [Interface].")

        interface = config["Interface"]

        missing = [
            key for key in self.REQUIRED_KEYS
            if key not in interface or not str(interface[key]).strip()
        ]

        if missing:
            raise ValueError(
                "В секции [Interface] отсутствуют параметры: " + ", ".join(missing)
            )

        return {
            key: str(interface[key]).strip()
            for key in self.REQUIRED_KEYS
        }

    def build_command(self, interface: dict, interface_name: str) -> str:
        interface_name = str(interface_name).strip()

        if not interface_name:
            raise ValueError("Не указано имя интерфейса WireGuard.")

        return (
            f"interface {interface_name} wireguard asc "
            f"{interface['Jc']} "
            f"{interface['Jmin']} "
            f"{interface['Jmax']} "
            f"{interface['S1']} "
            f"{interface['S2']} "
            f"{interface['H1']} "
            f"{interface['H2']} "
            f"{interface['H3']} "
            f"{interface['H4']}"
        )

    def generate_from_file(self, config_path: str | Path, interface_name: str) -> str:
        interface = self.read_interface(config_path)
        return self.build_command(interface, interface_name)
