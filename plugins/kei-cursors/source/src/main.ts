import CursorsStyle from "./cursors.css?raw";

declare global {
  const Kaede: any;
}

function execute(): { "resume": () => void; "stop": () => void } {
  // 'style' addition
  const style = document.createElement("style");

  style.textContent = CursorsStyle;

  document.head.append(style);

  // 'document.body.style.cursor = expression ? "progress" : ""' handler
  const observer = new MutationObserver(() => {
    if (document.body.style.cursor === "progress") {
      return document.body.classList.add("cursor-working");
    }

    return document.body.classList.remove("cursor-working");
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["style"]
  });

  return {
    "resume": (): void => {
      style.disabled = false;
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["style"]
      });
    },
    "stop": (): void => {
      style.disabled = true;
      observer.disconnect();
    },
  };
}

const { resume, stop } = execute();

Kaede.subscribe("lifecycle::dirty-enable", resume);
Kaede.subscribe("lifecycle::disable", stop);
