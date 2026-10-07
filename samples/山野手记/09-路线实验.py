"""Compare walking plans with real Python output."""
import json
from pathlib import Path

routes = [("溪谷轻徒步", 3.2), ("山脊日落线", 6.8), ("环山摄影线", 10.5)]
for name, distance in routes:
    hours = round(distance / 2.5, 2)
    print(f"{name}: {distance:.1f} km / {hours:.2f} h")

result = {"route_count": len(routes), "total_km": sum(distance for _, distance in routes)}
Path("route-summary.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print("Saved route-summary.json")
