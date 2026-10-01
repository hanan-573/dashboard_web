import socket
import time
import json
from flask import Flask, Response
from flask_cors import CORS

from cpu_monitor import get_cpu_info
from ram_monitor import get_ram_info
from storage_monitor import get_storage_info
from system_info import get_system_info
from utils import bytes_to_human


HOST = "0.0.0.0"
PORT = 3002
API_ENDPOINT = "/api"
INTERVAL = 1.0


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


def get_system_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def build_snapshot():
    cpu = get_cpu_info()
    ram = get_ram_info()

    ram_out = {
        "total": ram["total"],
        "used": ram["used"],
        "available": ram["available"],
        "percent": round(ram["percent"], 2),
        "total_human": bytes_to_human(ram["total"]),
        "used_human": bytes_to_human(ram["used"]),
        "available_human": bytes_to_human(ram["available"]),
        "swap_total": ram["swap_total"],
        "swap_used": ram["swap_used"],
        "swap_percent": round(ram["swap_percent"], 2),
        "swap_total_human": bytes_to_human(ram["swap_total"]),
        "swap_used_human": bytes_to_human(ram["swap_used"]),
    }

    storage_out = []
    for d in get_storage_info():
        storage_out.append({
            "device": d["device"],
            "mountpoint": d["mountpoint"],
            "fstype": d["fstype"],
            "total": d["total"],
            "used": d["used"],
            "free": d["free"],
            "percent": round(d["percent"], 2),
            "total_human": bytes_to_human(d["total"]),
            "used_human": bytes_to_human(d["used"]),
            "free_human": bytes_to_human(d["free"]),
        })

    sysinfo = get_system_info()
    boot_time = sysinfo.pop("boot_time", 0)
    uptime_seconds = int(time.time() - boot_time) if boot_time else 0
    sysinfo_out = {
        **sysinfo,
        "boot_time": boot_time,
        "uptime_seconds": uptime_seconds,
        "uptime_human": _fmt_uptime(uptime_seconds),
    }

    return {
        "status": "ok",
        "timestamp": time.time(),
        "cpu": {
            "usage_percent": round(cpu["usage_percent"], 2),
            "cores_physical": cpu["cores_physical"],
            "cores_logical": cpu["cores_logical"],
            "frequency": round(cpu["frequency"], 2),
            "per_cpu": [round(x, 2) for x in cpu["per_cpu"]],
        },
        "ram": ram_out,
        "storage": storage_out,
        "system": sysinfo_out,
    }


def _fmt_uptime(seconds):
    d = seconds // 86400
    h = (seconds % 86400) // 3600
    m = (seconds % 3600) // 60
    parts = []
    if d: parts.append(f"{d}d")
    if h: parts.append(f"{h}h")
    parts.append(f"{m}m")
    return " ".join(parts)


@app.route(API_ENDPOINT, methods=["GET"])
def api_sse():
    def stream():
        while True:
            try:
                data = build_snapshot()
                yield f"data: {json.dumps(data)}\n\n"
            except Exception as e:
                err = {"status": "error", "message": str(e), "timestamp": time.time()}
                yield f"data: {json.dumps(err)}\n\n"
            time.sleep(INTERVAL)

    return Response(
        stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/event-stream; charset=utf-8",
        },
    )


@app.route("/", methods=["GET"])
def index():
    ip = get_system_ip()
    return Response(
        json.dumps({
            "name": "System Monitor SSE Stream",
            "stream": f"http://{ip}:{PORT}{API_ENDPOINT}",
            "interval_seconds": INTERVAL,
        }, indent=2),
        mimetype="application/json",
    )


if __name__ == "__main__":
    ip = get_system_ip()
    print("\n" + "=" * 68)
    print("  🚀 SSE JSON Stream Server")
    print("=" * 68)
    print(f"  Stream :  http://{ip}:{PORT}{API_ENDPOINT}")
    print(f"  Interval: {INTERVAL}s  |  Press CTRL+C to stop")
    print("=" * 68 + "\n")
    app.run(host=HOST, port=PORT, debug=False, threaded=True)