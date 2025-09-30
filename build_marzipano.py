import csv, json, os, math

CSV_FILE = "pano-poses.csv"   # correct CSV file
PANOS_DIR = "Panos_csv"       # folder with original panos
OUTPUT_FILE = "tour.json"

def read_poses():
    poses = []
    with open(CSV_FILE, newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        # normalize fieldnames
        reader.fieldnames = [h.strip().lower().replace("# pano poses v1.0: ", "") for h in reader.fieldnames]
        for row in reader:
            poses.append({
                "id": row["id"].strip(),
                "filename": row["filename"].strip(),
                "x": float(row["pano_pos_x"]),
                "y": float(row["pano_pos_y"]),
                "z": float(row["pano_pos_z"]),
                "yaw": float(row["pano_ori_y"]),
                "pitch": 0.0,
                "fov": 1.5708
            })
    return poses

def nearest_neighbors(poses, current, k=3):
    distances = []
    for other in poses:
        if other["id"] == current["id"]:
            continue
        dx = other["x"] - current["x"]
        dy = other["y"] - current["y"]
        dist = math.sqrt(dx*dx + dy*dy)
        distances.append((dist, other))
    distances.sort(key=lambda d: d[0])
    return [d[1] for d in distances[:k]]

def build_tour(poses):
    scenes = []
    for pose in poses:
        neighbors = nearest_neighbors(poses, pose, k=3)
        links = []
        for n in neighbors:
            links.append({
                "yaw": 0,  # placeholder
                "pitch": 0,
                "target": os.path.splitext(n["filename"])[0]
            })
        scenes.append({
            "id": os.path.splitext(pose["filename"])[0],
            "name": pose["id"],
            "pano": f"{PANOS_DIR}/{pose['filename']}",
            "initialViewParameters": {
                "yaw": pose["yaw"],
                "pitch": pose["pitch"],
                "fov": pose["fov"]
            },
            "map_x": pose["x"],
            "map_y": pose["y"],
            "linkHotspots": links,
            "infoHotspots": []
        })
    return { "scenes": scenes }

def main():
    poses = read_poses()
    tour = build_tour(poses)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(tour, f, indent=2)
    print(f"[INFO] Wrote {OUTPUT_FILE} with {len(tour['scenes'])} scenes.")

if __name__ == "__main__":
    main()
