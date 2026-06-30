const create = document.getElementById("create");
const main = document.getElementById("main-container");

const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let creating = false;

let dragging = null;
let offsetX = 0;
let offsetY = 0;

function getTask() {
  main.querySelectorAll(".task").forEach((e) => e.remove());

  tasks.forEach((t) => {
    const task = document.createElement("div");
    task.className = "task";
    task.draggable = true;

    task.innerHTML = `
              <div id="task-left">
                  <div id="check-button"></div>
                  <p>${t.task}</p>
              </div>
              <button id='delete'>X</button>
          `;

    main.appendChild(task);

    task.querySelector("#delete").addEventListener("mousedown", function () {
      const updateTask = tasks.filter((e) => e.id != t.id);
      tasks.length = 0;
      tasks.push(...updateTask);
      localStorage.setItem("tasks", JSON.stringify(tasks));
      getTask();
    });

    task
      .querySelector("#check-button")
      .addEventListener("mousedown", function () {
        t.status = t.status == "Not Completed" ? "Completed" : "Not Completed";
        localStorage.setItem("tasks", JSON.stringify(tasks));
        getTask();
      });

    if (t.status == "Completed") {
      task.querySelector("#check-button").style.borderColor =
        "rgb(62, 159, 62)";
      task.querySelector("#check-button").style.background = "rgb(99, 224, 99)";
      task.querySelector("#check-button").textContent = "✓";
      task.querySelector("#check-button").style.color = "rgb(62, 159, 62)";
      task.querySelector("p").style.color = "rgb(62, 159, 62)";
    }

    task.addEventListener("dragstart", function (e) {
      dragging = t.id;
      task.classList.add("dragging");
    });

    task.addEventListener("dragend", function () {
      dragging = null;
      task.classList.remove("dragging");
    });

    task.addEventListener("dragover", function (e) {
      e.preventDefault();
    });

    task.addEventListener("drop", function (e) {
      e.preventDefault();
      if (dragging == null) return;

      const fromIndex = tasks.findIndex((x) => x.id === dragging);
      const toIndex = tasks.findIndex((x) => x.id === t.id);

      const [moved] = tasks.splice(fromIndex, 1);
      tasks.splice(toIndex, 0, moved);

      localStorage.setItem("tasks", JSON.stringify(tasks));
      getTask();
    });
  });

  const todo = tasks.filter((e) => e.status != "Completed");
  document.querySelector("#task-count").textContent = `${todo.length} To-do`;
}

create.addEventListener("mousedown", function (e) {
  if (!creating) {
    creating = true;

    const task = document.createElement("div");
    task.className = "task";

    task.innerHTML = `
                <form id="task-left-create">
                  <input type="text" name='list' placeholder='Enter Task...'>
                </form>
                <button id='delete'>X</button>
          `;

    main.appendChild(task);

    main
      .querySelector("#task-left-create")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        creating = false;

        const value = e.target.elements.list.value;
        console.log(value);

        tasks.push({
          id: crypto.randomUUID(),
          task: value,
          status: "Not Completed",
        });

        console.log(tasks);

        localStorage.setItem("tasks", JSON.stringify(tasks));
        task.remove();
        getTask();
      });

    task.querySelector("#delete").addEventListener("mousedown", function () {
      creating = false;
      task.remove();
      getTask();
    });
  }
});

getTask();
