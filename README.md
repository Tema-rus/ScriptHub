# ScriptHub

ScriptHub is a desktop launcher for personal tools and scripts with a modern glass-style interface.

## Features

- Launch Python and EXE tools
- Open project folders
- Search and filter tools
- Add, edit, and delete tool entries
- Built-in WireGuard command generator
- Windows file picker integration
- Launch counters and favorites

## Tech stack

- Python
- pywebview
- HTML / CSS / JavaScript

## Project structure

```text
ScriptHub/
├─ main.py
├─ services/
│  ├─ tool_service.py
│  └─ wireguard_service.py
├─ data/
│  └─ tools.example.json
├─ ui/
│  ├─ index.html
│  ├─ style.css
│  └─ app.js
```

## Setup

1. Create a virtual environment
2. Install dependencies
3. Copy `data/tools.example.json` to `data/tools.json`
4. Adjust paths in `data/tools.json`
5. Run the app

## Install dependencies

```bash
pip install -r requirements.txt
```

## Run

```bash
python main.py
```

## Notes

- `data/tools.json` is ignored by git because it contains local file paths
- Python tools can use their own interpreter through `python_path`
- WireGuard config generation is built into the app as a separate modal tool
