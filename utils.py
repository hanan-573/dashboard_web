def bytes_to_gb(bytes_value):
    """Bytes ko GB mein convert karo"""
    return round(bytes_value / (1024 ** 3), 2)


def bytes_to_human(bytes_value):
    """Bytes ko readable format mein convert karo (B, KB, MB, GB, TB)"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024
    return f"{bytes_value:.2f} PB"
