const track = document.getElementById("track");
const items = document.querySelectorAll(".item");
const prev = document.querySelector("#prev");
const next = document.querySelector("#next");
const indicators = Array.from(document.querySelectorAll(".indicator"));

let currentIndex = 0;
let intervalId;

function startTimer() {
  clearInterval(intervalId);
  intervalId = setInterval(() => {
    move(currentIndex + 1);
  }, 2000);
}

function move(index) {
  if (index < 0) index = items.length - 1;
  if (index > items.length - 1) index = 0;

  currentIndex = index;

  track.style.transform = `translateX(-${currentIndex * 100}%)`;

  items.forEach((item, i) => {
    item.classList.toggle("active", i === currentIndex);
  });

  indicators.forEach((indicator, i) => {
    indicator.classList.toggle("checked", i === currentIndex);
  });
}

indicators.forEach((indicator, i) => {
  indicator.addEventListener("click", function () {
    move(i);
    startTimer();
  });
});

items.forEach((item, i) => {
  item.addEventListener("mouseenter", function () {
    clearInterval(intervalId);
  });

  item.addEventListener("mouseleave", function () {
    startTimer();
  });
});

prev.addEventListener("click", function (e) {
  move(currentIndex - 1);
  startTimer();
});

next.addEventListener("click", function (e) {
  move(currentIndex + 1);
  startTimer();
});

startTimer();
