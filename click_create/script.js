const c = document.getElementById("stage");

const stage = c.getBoundingClientRect();

const colors = ["blue", "navy", "cyan"];

let dragging = null;
let offsetX = 0;
let offsetY = 0;
let layer = 1;

for (let i = 0; i < 100; i++) {
  const box = document.createElement("div");

  const size = Math.random() * 300 + 10;

  box.className = "box";
  box.style.left = `${Math.random() * stage.width}px`;
  box.style.top = `${Math.random() * stage.height}px`;
  box.style.background = `${colors[Math.floor(Math.random() * colors.length)]}`;
  box.style.width = `${size}px`;
  box.style.height = `${size}px`;
  2;

  c.appendChild(box);

  box.addEventListener("pointerdown", function (e) {
    dragging = box;
    const t = dragging.getBoundingClientRect();

    layer += 1;
    box.style.zIndex = layer;

    offsetX = e.clientX - t.left;
    offsetY = e.clientY - t.top;
  });
}

document.addEventListener("pointermove", function (e) {
  if (dragging) {
    const t = dragging.getBoundingClientRect();

    dragging.style.left = `${e.clientX - offsetX}px`;
    dragging.style.top = `${e.clientY - offsetY}px`;
  }
});

document.addEventListener("pointerup", () => {
  dragging = null;
});
