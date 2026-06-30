const c = document.getElementById("stage");

const viewport = document.getElementById("viewport");
const world = document.getElementById("world");

let zoom = 1;
let panX = 0;
let panY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

function applyTransform() {
  world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
}

function screenToWorld(clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  const x = (clientX - rect.left - panX) / zoom;
  const y = (clientY - rect.top - panY) / zoom;
  return { x, y };
}

function zoomAt(clientX, clientY, newZoom) {
  newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
  const rect = viewport.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;

  const worldX = (px - panX) / zoom;
  const worldY = (py - panY) / zoom;

  zoom = newZoom;
  panX = px - worldX * zoom;
  panY = py - worldY * zoom;

  applyTransform();
}

viewport.addEventListener(
  "wheel",
  function (e) {
    if (!e.ctrlKey) return;
    e.preventDefault();

    const delta = -e.deltaY * 0.001;
    zoomAt(e.clientX, e.clientY, zoom * (1 + delta));
  },
  { passive: false },
);

document.addEventListener("keydown", function (e) {
  if (!e.ctrlKey) return;

  if (e.key === "+" || e.key === "=") {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoom * 1.2);
  }

  if (e.key === "-") {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoom / 1.2);
  }
});

let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panOriginX = 0;
let panOriginY = 0;

viewport.addEventListener("mousedown", function (e) {
  if (e.target.closest(".box, .info, .connect, .create")) return;

  isPanning = true;
  panStartX = e.clientX;
  panStartY = e.clientY;
  panOriginX = panX;
  panOriginY = panY;
});

window.addEventListener("mousemove", function (e) {
  if (!isPanning) return;
  panX = panOriginX + (e.clientX - panStartX);
  panY = panOriginY + (e.clientY - panStartY);
  applyTransform();
});

window.addEventListener("mouseup", function () {
  isPanning = false;
});

applyTransform();

let creating = false;

let connecting = null;
let deleting = null;

let startLine = {
  id: null,
  x: 0,
  y: 0,
};

let endLine = {
  id: null,
  x: 0,
  y: 0,
};

let transport = [
  { id: 1, name: "Train", speed: 120, cost: 500, color: "#33E339" },
  { id: 2, name: "Bus", speed: 80, cost: 100, color: "#A83BE8" },
  { id: 3, name: "Airplane", speed: 800, cost: 1000, color: "#000000" },
];

console.log(transport);

const pins = JSON.parse(localStorage.getItem("pins")) || [];
const connections = JSON.parse(localStorage.getItem("connections")) || [];

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.style.left = "0";
svg.style.top = "0";
svg.style.width = "100%";
svg.style.height = "100%";
svg.style.pointerEvents = "none";
c.appendChild(svg);

function getLineOffset(startId, endId, conn) {
  const same = connections.filter(
    (c) =>
      (c.startLine.id === startId && c.endLine.id === endId) ||
      (c.startLine.id === endId && c.endLine.id === startId),
  );

  const index = same.indexOf(conn);
  return index * 6;
}

function makeLine(x1, x2, y1, y2, conId, offset = 0, color) {
  const hitLine = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line",
  );
  hitLine.setAttribute("x1", x1 + offset);
  hitLine.setAttribute("x2", x2 + offset);
  hitLine.setAttribute("y1", y1 + offset);
  hitLine.setAttribute("y2", y2 + offset);
  hitLine.setAttribute("stroke", "transparent");
  hitLine.setAttribute("stroke-width", 15);
  hitLine.setAttribute("pointer-events", "auto");
  svg.appendChild(hitLine);

  const visibleLine = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line",
  );
  visibleLine.setAttribute("id", conId);
  visibleLine.setAttribute("x1", x1 + offset);
  visibleLine.setAttribute("x2", x2 + offset);
  visibleLine.setAttribute("y1", y1 + offset);
  visibleLine.setAttribute("y2", y2 + offset);
  visibleLine.setAttribute("stroke", deleting == conId ? "red" : color);
  visibleLine.setAttribute("stroke-width", 3);
  visibleLine.setAttribute("pointer-events", "none"); // hitLine handles interaction now
  svg.appendChild(visibleLine);

  hitLine.addEventListener("click", function () {
    deleting = conId;
    getPin();
  });

  const label = document.getElementById(`dist-${conId}`);
  if (label) {
    hitLine.addEventListener("mouseenter", () => label.classList.add("show"));
    hitLine.addEventListener("mouseleave", () =>
      label.classList.remove("show"),
    );
  }
}

document.addEventListener("keydown", function (e) {
  if (deleting) {
    if (e.key == "Backspace") {
      const updateCon = connections.filter((item) => item.conId != deleting);

      connections.length = 0;
      connections.push(...updateCon);
      localStorage.setItem("connections", JSON.stringify(connections));

      deleting = null;
      getPin();
    }
  }
});

c.addEventListener("mousedown", function (e) {
  if (e.target == c || e.target == svg) {
    if (connecting) {
      connecting = null;
      getPin();
    }
  }

  if (e.target == c || e.target == svg) {
    if (deleting) {
      deleting = null;
      getPin();
    }
  }
});

function getPin() {
  c.querySelectorAll(".box, .info, .distance").forEach((el) => el.remove());
  svg.innerHTML = "";

  connections.forEach((conn) => {
    const from = pins.find((p) => p.id === conn.startLine.id);
    const to = pins.find((p) => p.id === conn.endLine.id);

    if (!from || !to) return;

    const offset = getLineOffset(conn.startLine.id, conn.endLine.id, conn);

    const midX = (from.x + to.x) / 2 + offset;
    const midY = (from.y + to.y) / 2 + offset;

    const dist = document.createElement("p");
    dist.className = "distance";
    dist.id = `dist-${conn.conId}`;
    dist.style.position = "absolute";
    dist.style.left = `${midX}px`;
    dist.style.top = `${midY}px`;
    dist.style.transform = "translate(-50%, -50%)";
    dist.style.color = `${transport[conn.data.transport_id - 1].color}`;
    dist.style.margin = 0;
    dist.style.pointerEvents = "none";
    dist.style.borderBlockColor = `${conn.data.distance}`;
    dist.textContent = `${conn.data.distance} km`;
    c.appendChild(dist);

    makeLine(
      from.x,
      to.x,
      from.y,
      to.y,
      conn.conId,
      offset,
      transport[conn.data.transport_id - 1].color,
    );
  });

  pins.forEach((pin) => {
    const size = 50;

    const box = document.createElement("div");

    box.className = "box";

    if (connecting == pin.id) {
      box.style.background = "orange";
    } else {
      box.style.background = "red";
    }
    box.style.position = "absolute";
    box.style.width = `${size}px`;
    box.style.height = `${size}px`;
    box.style.left = `${pin.x - size / 2}px`;
    box.style.top = `${pin.y - size / 2}px`;

    const info = document.createElement("div");

    info.className = "info";
    info.style.top = `${pin.y - size / 2 - 50}px`;

    info.innerHTML = `
      <p>${pin.name}</p>
      <div></div>
      <p class='con-pin'>Con</p>
      <div></div>
      <p class='delete-pin'>Del</p>
    `;

    c.appendChild(box);
    c.appendChild(info);

    const rect = info.getBoundingClientRect();
    info.style.left = `${pin.x - rect.width / zoom / 2}px`;

    info.querySelector(".delete-pin").addEventListener("click", function (e) {
      const updated = pins.filter((item) => item.id !== pin.id);
      const updatedCon = connections.filter((item) =>
        item.startLine.id !== pin.id ? item.endLine.id !== pin.id : "",
      );
      console.log(updatedCon);

      connections.length = 0;
      connections.push(...updatedCon);
      localStorage.setItem("connections", JSON.stringify(connections));

      pins.length = 0;
      pins.push(...updated);
      localStorage.setItem("pins", JSON.stringify(pins));

      getPin();
    });

    info.querySelector(".con-pin").addEventListener("click", function (e) {
      connecting = pin.id;
      if (connecting) {
        startLine.x = connecting;
        startLine.x = pin.x;
        startLine.y = pin.y;
      }

      console.log(connecting);
      getPin();
    });

    box.addEventListener("click", function (e) {
      if (connecting) {
        endLine.id = pin.id;
        endLine.x = pin.x;
        endLine.y = pin.y;

        const connect = document.createElement("div");
        connect.className = "connect";
        connect.style.zIndex = 99;

        connect.innerHTML = `
          <div id="connect-head-container">
            <p>Add pinpoint</p>
            <p id="connect-close">x</p>
          </div>
          <form id="connect-foot-container">
            <div id="input-container">
              <input
                type="number"
                placeholder="Enter distance (km)"
                id="connect-input-dis"
                min='1'
                name="distance"
              />
              <select
                type="text"
                placeholder="Cho"
                id="connect-input-mode"
                name="mode"
              >
                <option value="" selected disabled>Choose mode</option>
                <option value="1">Train</option>
                <option value="2">Bus</option>
                <option value="3">Airplane</option>
              </select>
            </div>
            <button>Connect</button>
          </form>
        `;

        c.appendChild(connect);

        const midX = (startLine.x + endLine.x) / 2;
        const midY = (startLine.y + endLine.y) / 2;

        const rect = connect.getBoundingClientRect();

        connect.style.left = `${midX - rect.width / zoom / 2}px`;
        connect.style.top = `${midY - rect.height / zoom / 2}px`;

        connect
          .querySelector("#connect-close")
          .addEventListener("click", function () {
            connecting = null;
            connect.remove();
            getPin();
          });

        c.addEventListener("click", function (e) {
          if (connecting == null) {
            connect.remove();
            return;
          }
        });

        connect
          .querySelector("#connect-foot-container")
          .addEventListener("submit", function (e) {
            e.preventDefault();

            const distance = e.target.elements.distance.value;
            const mode = e.target.elements.mode.value - 1;

            if (distance && mode != null) {
              connections.push({
                conId: crypto.randomUUID(),
                data: {
                  transport_id: transport[mode].id,
                  transport: transport[mode].name,
                  distance: distance,
                  price: transport[mode].cost * distance,
                  time: distance / transport[mode].speed,
                },
                startLine: {
                  id: connecting,
                  x: startLine.x,
                  y: startLine.y,
                },
                endLine: {
                  id: pin.id,
                  x: endLine.x,
                  y: endLine.y,
                },
              });

              localStorage.setItem("connections", JSON.stringify(connections));

              connect.remove();

              connecting = null;
              startLine.x = 0;
              startLine.y = 0;
              endLine.x = 0;
              endLine.y = 0;
              getPin();
              e.stopPropagation();
            }
          });
      }
    });

    let mouseX = 0;
    let mouseY = 0;
  });
}

c.addEventListener("dblclick", function (e) {
  if (creating) return;

  if (e.target.closest(".box, .info, .connect, .create")) return;

  const hit = document
    .elementsFromPoint(e.clientX, e.clientY)
    .some((e) => e.classList.contains("box"));

  if (hit) return;

  creating = true;

  const box = document.createElement("div");
  const { x, y } = screenToWorld(e.clientX, e.clientY);
  const size = 50;

  box.className = "box";
  box.style.background = "red";
  box.style.position = "absolute";
  box.style.width = `${size}px`;
  box.style.height = `${size}px`;
  box.style.left = `${x - size / 2}px`;
  box.style.top = `${y - size / 2}px`;

  const create = document.createElement("div");

  create.className = "create";
  create.style.left = `${x - 190 / 2}px`;
  create.style.top = `${y - size / 2 - 115}px`;

  create.innerHTML = `
    <div id="create-head-container">
        <p>Add pinpoint</p>
        <p id="create-close">x</p>
    </div>
    <form id="create-foot-container">
        <input type="text" id='create-input' name='name'/>
        <button>Add</button>
    </form>
  `;

  c.appendChild(create);
  c.appendChild(box);

  create.querySelector("#create-close").addEventListener("click", function () {
    creating = false;
    create.remove();
    box.remove();
  });

  create
    .querySelector("#create-foot-container")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const value = e.target.elements.name.value;

      if (value) {
        pins.push({
          id: crypto.randomUUID(),
          x,
          y,
          name: value,
        });

        localStorage.setItem("pins", JSON.stringify(pins));

        creating = false;
        create.remove();
        box.remove();

        getPin();
      }
    });
});

getPin();
