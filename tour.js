async function startTour() {
  const viewer = new Marzipano.Viewer(document.getElementById('pano'));

  const response = await fetch('tour.json');
  const data = await response.json();

  const scenes = {};
  data.scenes.forEach(sceneData => {
    const source = Marzipano.ImageUrlSource.fromString(sceneData.pano);
    const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
    const limiter = Marzipano.RectilinearView.limit.traditional(1024, 100*Math.PI/180);
    const view = new Marzipano.RectilinearView(sceneData.initialViewParameters, limiter);

    const scene = viewer.createScene({ source, geometry, view, pinFirstLevel: true });

    // Add auto-links as arrows
    sceneData.linkHotspots.forEach(hotspot => {
      const element = document.createElement('div');
      element.classList.add('hotspot');
      element.innerHTML = '➤'; // arrow
      element.style.fontSize = '24px';
      element.style.color = 'white';
      element.style.textShadow = '0 0 5px black';
      element.style.cursor = 'pointer';
      element.addEventListener('click', () => switchScene(hotspot.target));
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    scenes[sceneData.id] = { data: sceneData, scene, view };
  });

  // Switch to a given scene
  function switchScene(id) {
    const s = scenes[id];
    if (s) { s.scene.switchTo(); currentScene = s; drawMinimap(); }
  }

  // === Minimap ===
  const minimap = document.getElementById('minimap');
  const overlay = document.getElementById('minimap-overlay');
  const ctx = overlay.getContext('2d');
  let currentScene = null;

  function drawMinimap() {
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    data.scenes.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.map_x*10+100, s.map_y*10+100, 4, 0, 2*Math.PI); // scaled coords
      ctx.fillStyle = (currentScene && currentScene.data.id === s.id) ? 'red' : 'blue';
      ctx.fill();
    });
  }

  overlay.addEventListener('click', e => {
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let nearest = null, bestDist = 1e9;
    data.scenes.forEach(s => {
      const sx = s.map_x*10+100, sy = s.map_y*10+100;
      const d = Math.hypot(sx-x, sy-y);
      if (d < bestDist) { bestDist = d; nearest = s; }
    });
    if (nearest) switchScene(nearest.id);
  });

  // Start at first scene
  switchScene(data.scenes[0].id);
}

startTour();
