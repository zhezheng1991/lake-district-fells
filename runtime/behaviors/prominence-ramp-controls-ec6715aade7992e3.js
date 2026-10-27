export default async function install(app) {
  const mount = app.getMount("ramp-controls");
  const layer = app.layers[app.config.layerId];
  app.assert(layer, "Lake District Fells layer is not available.");
  await layer.load();

  const ramps = {
    "Blue to red": ["#2166ac", "#f7f7f7", "#b2182b"],
    "Blue to gold": ["#225ea8", "#41b6c4", "#ffffb2"],
    "Purple to orange": ["#542788", "#f7f7f7", "#d6604d"]
  };
  let colours = [...ramps["Blue to red"]];

  const root = document.createElement("div");
  root.style.cssText = "display:grid;gap:12px;padding:4px;min-width:0;color:var(--app-text);font:inherit;";
  const intro = document.createElement("p");
  intro.textContent = "Colour represents prominence; triangle size represents height.";
  intro.style.cssText = "margin:0;color:var(--app-text-muted);font-size:0.9rem;line-height:1.35;";

  const selectLabel = document.createElement("label");
  selectLabel.textContent = "Colour ramp";
  selectLabel.style.cssText = "display:grid;gap:5px;font-weight:600;";
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Colour ramp");
  select.style.cssText = "width:100%;padding:7px;border:1px solid var(--app-border);border-radius:var(--app-radius);background:var(--app-surface-raised);color:var(--app-text);";
  Object.keys(ramps).forEach((name) => { const option = document.createElement("option"); option.value = name; option.textContent = name; select.append(option); });
  selectLabel.append(select);

  const sampleTitle = document.createElement("div");
  sampleTitle.textContent = "Ramp samples";
  sampleTitle.style.fontWeight = "600";
  const samples = document.createElement("div");
  samples.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;";
  const labels = ["Low", "Middle", "High"];
  const pickers = [];
  labels.forEach((label, index) => {
    const wrap = document.createElement("label");
    wrap.style.cssText = "display:grid;gap:4px;font-size:0.8rem;color:var(--app-text-muted);";
    const caption = document.createElement("span"); caption.textContent = label;
    const picker = document.createElement("input");
    picker.type = "color"; picker.value = colours[index]; picker.setAttribute("aria-label", label + " prominence colour");
    picker.style.cssText = "width:100%;height:32px;border:1px solid var(--app-border);border-radius:5px;padding:2px;background:var(--app-surface-raised);cursor:pointer;";
    wrap.append(caption, picker); samples.append(wrap); pickers.push(picker);
  });

  const range = document.createElement("div");
  range.style.cssText = "height:18px;border-radius:9px;border:1px solid var(--app-border);background:linear-gradient(90deg," + colours.join(",") + ");";
  const scale = document.createElement("div");
  scale.style.cssText = "display:flex;justify-content:space-between;color:var(--app-text-muted);font-size:0.78rem;";
  const low = document.createElement("span"); low.textContent = "0 m";
  const high = document.createElement("span"); high.textContent = "912 m";
  scale.append(low, high);

  function applyRenderer() {
    layer.renderer = {
      type: "simple",
      symbol: { type: "simple-marker", style: "triangle", color: colours[0], size: 10, outline: { color: "#24364b", width: 0.75 } },
      visualVariables: [
        { type: "size", field: app.config.heightField, legendOptions: { title: "Height (m)" }, stops: [{ value: app.config.heightMin, size: 6 }, { value: app.config.heightMax, size: 30 }] },
        { type: "color", field: app.config.prominenceField, legendOptions: { title: "Prominence (m)" }, stops: [
          { value: app.config.prominenceMin, color: colours[0], label: "Low prominence" },
          { value: (app.config.prominenceMin + app.config.prominenceMax) / 2, color: colours[1], label: "Medium prominence" },
          { value: app.config.prominenceMax, color: colours[2], label: "High prominence" }
        ] }
      ]
    };
    range.style.background = "linear-gradient(90deg," + colours.join(",") + ")";
  }
  function updateFromPickers() { colours = pickers.map((picker) => picker.value); applyRenderer(); }
  function updateRamp() { colours = [...ramps[select.value]]; pickers.forEach((picker, i) => { picker.value = colours[i]; }); applyRenderer(); }
  select.addEventListener("change", updateRamp);
  pickers.forEach((picker) => picker.addEventListener("input", updateFromPickers));
  app.onCleanup(() => { select.removeEventListener("change", updateRamp); pickers.forEach((picker) => picker.removeEventListener("input", updateFromPickers)); mount.replaceChildren(); });
  root.append(intro, selectLabel, sampleTitle, samples, range, scale);
  mount.replaceChildren(root);
  applyRenderer();
  return { layerId: layer.id, ramps: Object.keys(ramps), sizeField: app.config.heightField, colorField: app.config.prominenceField };
}