# GUI Dashboard

Real-time system monitoring dashboard built with Python + Tkinter.
Displays CPU usage, RAM usage, and all storage devices with live updates.

## Features
- 🖥 Real-time CPU usage monitoring
- 🧠 Real-time RAM usage (with swap info)
- 💾 All storage devices with size/used/free
- 🐧 Cross-platform: Linux, Windows, macOS
- ⚡ Updates every 1 second automatically

## Screenshot
(optional - yahan image lagao)

## Requirements
- Python 3.11+
- Tkinter (usually pre-installed)
- psutil

## Installation

### 1. Create Conda Environment
conda create -n gui-dashboard python=3.11 -y
conda activate gui-dashboard

### 2. Install Tkinter
Manjaro/Arch:
sudo pacman -S tk
conda install -c conda-forge tk -y

Ubuntu/Debian:
sudo apt install python3-tk -y

Fedora:
sudo dnf install python3-tkinter -y

### 3. Install Dependencies
pip install -r requirements.txt

## Usage
python main.py

## Project Structure
main.py              → Entry point
dashboard.py         → Main GUI code
cpu_monitor.py       → CPU data
ram_monitor.py       → RAM data
storage_monitor.py   → Storage info
system_info.py       → OS info
utils.py             → Helper functions

## License
MIT
