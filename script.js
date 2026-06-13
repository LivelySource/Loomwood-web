// Replace each "#" with the public URL for that form or voting page.
const destinations = {
  staff: "#",
  media: "#",
  vote: "#"
};

const dialog = document.querySelector(".link-dialog");
const closeButtons = dialog.querySelectorAll(".dialog-close, .dialog-button");

document.querySelectorAll("[data-destination]").forEach((card) => {
  const destination = destinations[card.dataset.destination];

  if (destination && destination !== "#") {
    card.href = destination;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    return;
  }

  card.addEventListener("click", (event) => {
    event.preventDefault();
    dialog.showModal();
  });
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => dialog.close());
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

const copyButton = document.querySelector(".copy-ip");
copyButton.addEventListener("click", async () => {
  const serverIp = copyButton.dataset.serverIp;
  const label = copyButton.querySelector(".copy-label");

  try {
    await navigator.clipboard.writeText(serverIp);
    label.textContent = "COPIED TO CLIPBOARD";
  } catch {
    label.textContent = serverIp;
  }

  window.setTimeout(() => {
    label.textContent = serverIp.toUpperCase();
  }, 1800);
});

document.querySelector("#year").textContent = new Date().getFullYear();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const sceneImage = document.querySelector(".scene-image");
const particleField = document.querySelector(".particles");

function createParticles() {
  if (reducedMotion.matches) return;

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 28; index += 1) {
    const particle = document.createElement("span");
    const size = 2 + Math.random() * 4;

    particle.className = "particle";
    particle.style.setProperty("--x", `${Math.random() * 100}%`);
    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--duration", `${12 + Math.random() * 15}s`);
    particle.style.setProperty("--delay", `${Math.random() * -24}s`);
    particle.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
    particle.style.setProperty("--opacity", `${0.25 + Math.random() * 0.55}`);
    fragment.appendChild(particle);
  }

  particleField.appendChild(fragment);
}

let scrollFrame;

function updateScene() {
  scrollFrame = undefined;
  const scrollProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.5);
  const blur = Math.min(scrollProgress * 2.4, 3.5);
  const shift = Math.min(window.scrollY * -0.035, 0);

  sceneImage.style.setProperty("--scene-blur", `${blur.toFixed(2)}px`);
  sceneImage.style.setProperty("--scene-shift", `${shift.toFixed(2)}px`);
}

window.addEventListener("scroll", () => {
  if (reducedMotion.matches || scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(updateScene);
}, { passive: true });

createParticles();
