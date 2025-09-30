async function startTour() {
  const response = await fetch("tour.json");
  const tourData = await response.json();

  const viewer = new Marzipano.Viewer(document.getElementById("pano"));

  const limiter = Marzipano.RectilinearView.limit.traditional(
    1024, (100 * Math.PI) / 180
  );

  const scenes = {};
  const map = document.getElementById("map");

  // find bounds for minimap scaling
  const xs = tourData.scenes.map(s => s.map_x);
  const ys = tourData.scenes.map(s => s.map_y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const scaleX = 200 / (maxX - minX);
  const scaleY = 200 / (maxY - minY);

  function toMapCoords(x, y) {
    return {
      x: (x - minX) * scaleX,
      y: 200 - (y - minY) * scaleY
    };
  }

  // Build scenes
  tourData.scenes.forEach(sceneData => {
    const source = Marzipano.ImageUrlSource.fromString(sceneData.pano);
    const view = new Marzipano.RectilinearView(
      {
        yaw: sceneData.initialViewParameters.yaw || 0,
        pitch: sceneData.initialViewParameters.pitch || 0,
        fov: sceneData.initialViewParameters.fov || Math.PI/2
      },
      limiter
    );

    const scene = viewer.createScene({
      source: source,
      view: view,
      geometry: new Marzipano.EquirectGeometry([{ width: 4000 }])
    });

    // Add hotspots (arrows)
    sceneData.linkHotspots.forEach(hs => {
      const dom = document.createElement("div");
      dom.className = "hotspot";
      dom.style.width = "32px";
      dom.style.height = "32px";
      dom.style.background = "rgba(0,0,0,0.5)";
      dom.style.borderRadius = "50%";
      scene.hotspotContainer().createHotspot(dom, { yaw: hs.yaw, pitch: hs.pitch });
      dom.addEventListener("click", () => {
        scenes[hs.target].switchTo();
      });
    });

    scenes[sceneData.id] = scene;

    // Draw dot on minimap
    const coords = toMapCoords(sceneData.map_x, sceneData.map_y);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("class", "dot");
    dot.setAttribute("cx", coords.x);
    dot.setAttribute("cy", coords.y);
    dot.setAttribute("r", 4);
    dot.addEventListener("click", () => {
      scenes[sceneData.id].switchTo();
    });
    map.appendChild(dot);

    // Optionally connect with lines
    sceneData.linkHotspots.forEach(hs => {
      const target = tourData.scenes.find(s => s.id === hs.target);
      if (target) {
        const coords2 = toMapCoords(target.map_x, target.map_y);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("class", "line");
        line.setAttribute("x1", coords.x);
        line.setAttribute("y1", coords.y);
        line.setAttribute("x2", coords2.x);
        line.setAttribute("y2", coords2.y);
        map.appendChild(line);
      }
    });
  });

  // Start at first pano
  const first = tourData.scenes[0];
  scenes[first.id].switchTo();
}

startTour();
