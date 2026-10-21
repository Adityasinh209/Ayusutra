def camel(obj):
    if isinstance(obj, list):
        return [camel(x) for x in obj]
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            parts = k.split("_")
            key = parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:])
            out[key] = camel(v) if isinstance(v, (dict, list)) else v
        return out
    return obj


def row(model, fields: list[str]) -> dict:
    data = {}
    for f in fields:
        val = getattr(model, f)
        if hasattr(val, "isoformat"):
            val = val.isoformat()
        data[f] = val
    return camel(data)
