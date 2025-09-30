import csv
import json
import math
import os

CSV_FILE = "Panos_csv/pano-poses.csv"
OUTPUT_JSON = "tour.json"
PANOS_DIR = "Panos_csv"
MAX_LINKS = 3  # number of nearest neighbors to link

def read_poses():
    poses = []
    with open(CSV_FILE, newline="") as f:
        reader = csv.reader(f, delimiter=';')
        headers = next(reader)  # Skip header
        print("[DEBUG] CSV headers:", headers)
        for row in reader:
            filename = row[1].strip()
            poses.append({
                "id": os.path.splitext(filename)[0],
                "filename": filename,
                "map_x": float(row[3]),
                "map_y": float(row[4]),
                "z": float(row[5]),
                "yaw": float(row[8]) if row[8].strip() else 0.0,
                "pitch": 0.0,
                "fov": 1.5708
            })
    return poses

def compute_yaw(x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    return math.atan2(dy, dx)

def build_tour(poses):
    scenes = []
    for i, p in enumerate(poses):
        scene = {
            "id": p["id"],
            "name": p["id"],
            "pano": f"{PANOS_DIR}/{p['filename']}",
            "initialViewParameters": {
                "yaw": p["yaw"],
                "pitch": p["pitch"],
                "fov": p["fov"]
            },
            "map_x": p["map_x"],
            "map_y": p["map_y"],
            "linkHotspots": [],
            "infoHotspots": []
        }

        # find nearest neighbors
        distances = []
        for j, q in enumerate(poses):
            if i == j:
                continue
            dist = math.sqrt((p["map_x"] - q["map_x"])**2 + (p["map_y"] - q["map_y"])**2)
            distances.append((dist, q))
        distances.sort(key=lambda d: d[0])

        for _, neighbor in distances[:MAX_LINKS]:
            yaw = compute_yaw(p["map_x"], p["map_y"], neighbor["map_x"], neighbor["map_y"])
            scene["linkHotspots"].append({
                "yaw": yaw,
                "pitch": -0.3,
                "target": neighbor["id"]
            })

        scenes.append(scene)
    return {"scenes": scenes}

def main():
    poses = read_poses()
    tour = build_tour(poses)
    with open(OUTPUT_JSON, "w") as f:
        json.dump(tour, f, indent=2)
    print(f"[INFO] Tour JSON written to {OUTPUT_JSON} with {len(tour['scenes'])} scenes")

if __name__ == "__main__":
    main()
