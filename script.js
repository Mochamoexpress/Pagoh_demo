Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ZmU0YTkyYy05OTA4LTQwMTYtYjk4OC0yMmMzYWRmNTdhYmMiLCJpZCI6MzUyMDg5LCJpYXQiOjE3NjA5MzAyMjl9.rJS_7Zo5C_f4wHo0o8NWy7Uo6rbO9lJ_Z4FyNeE2Zow";

(async function () {
  const viewer = new Cesium.Viewer("cesiumContainer", {
    terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(1),
    shouldAnimate: true,
  });
  viewer.scene.globe.depthTestAgainstTerrain = true;

  try {
    // --- Load your LiDAR point cloud ---
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(3953107);
    viewer.scene.primitives.add(tileset);
    await tileset.readyPromise;
    await viewer.zoomTo(tileset);
    console.log("✅ Point cloud loaded!");

    // --- Optional: make points circular ---
    tileset.customShader = new Cesium.CustomShader({
      lightingModel: Cesium.LightingModel.UNLIT,
      fragmentShaderText: `
        void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
        {
            vec2 xy = gl_PointCoord.xy - vec2(0.5);
            float r = length(xy);
            if (r > 0.5) discard;
            material.diffuse = fsInput.attributes.color_0.rgb;
            material.alpha = 1.0;
        }
      `,
    });

    tileset.style = new Cesium.Cesium3DTileStyle({
      pointSize: 2,
    });

    // --- Orbit parameters ---
    const centerLat = 2.137294621759021; // Your specified point (latitude)
    const centerLon = 102.72294134825354; // Your specified point (longitude)
    const centerHeight = 40; // meters above ground center
    const orbitRadius = 150; // meters
    const orbitHeight = 40; // camera height above center
    const orbitSpeed = 0.01; // radians per frame

    const center = Cesium.Cartesian3.fromDegrees(
      centerLon,
      centerLat,
      centerHeight
    );
    let angle = 0;

    viewer.scene.postRender.addEventListener(() => {
      angle += orbitSpeed;

      // Calculate camera position in circular orbit
      const offsetX = orbitRadius * Math.cos(angle);
      const offsetY = orbitRadius * Math.sin(angle);

      const cameraLon = centerLon + offsetX / 111320;
      const cameraLat =
        centerLat + offsetY / (111320 * Math.cos((centerLat * Math.PI) / 180));
      const cameraHeight = centerHeight + orbitHeight;

      const position = Cesium.Cartesian3.fromDegrees(
        cameraLon,
        cameraLat,
        cameraHeight
      );

      // Calculate direction FROM camera TO center for correct heading
      const dx = centerLon - cameraLon;
      const dy = centerLat - cameraLat;
      const heading = Math.atan2(dx, dy); // Note: atan2(dx, dy) for proper heading

      // Pitch slightly downward to look at the center point
      const pitch = Cesium.Math.toRadians(-15);

      viewer.camera.setView({
        destination: position,
        orientation: {
          heading: heading,
          pitch: pitch,
          roll: 0.0,
        },
      });
    });

    console.log("🎥 Orbiting smoothly around point cloud center with tracking");
  } catch (err) {
    console.error("❌ Error loading point cloud:", err);
  }
})();
