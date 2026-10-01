import psutil


def get_storage_info():
    """Saare storage devices ki info - cross platform"""
    devices = []
    for partition in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(partition.mountpoint)
            devices.append({
                "device": partition.device,
                "mountpoint": partition.mountpoint,
                "fstype": partition.fstype,
                "total": usage.total,
                "used": usage.used,
                "free": usage.free,
                "percent": usage.percent,
            })
        except PermissionError:
            # Windows pe kuch drives pe permission issue hota hai
            continue
    return devices
