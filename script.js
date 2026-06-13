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
