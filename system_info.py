import platform
import psutil


def get_system_info():
    """System/OS ki basic info return karo"""
    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "os_release": platform.release(),
        "architecture": platform.machine(),
        "hostname": platform.node(),
        "boot_time": psutil.boot_time(),
    }