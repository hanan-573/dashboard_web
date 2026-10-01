import psutil


def get_cpu_info():
    """CPU ki saari info return karo"""
    freq = psutil.cpu_freq()
    return {
        "usage_percent": psutil.cpu_percent(interval=None),
        "cores_physical": psutil.cpu_count(logical=False),
        "cores_logical": psutil.cpu_count(logical=True),
        "frequency": freq.current if freq else 0,
        "per_cpu": psutil.cpu_percent(percpu=True, interval=None),
    }
