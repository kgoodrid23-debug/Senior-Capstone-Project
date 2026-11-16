export const DEFAULT_EVENT_IMAGE =
  "assets/default-event.svg";


export function setEventImage(
  imageElement,
  imageUrl,
  eventTitle = "Event"
) {
  if (!imageElement) return;

  const requestedUrl = String(
    imageUrl || ""
  ).trim();

  imageElement.alt =
    `${eventTitle} event image`;

  imageElement.hidden = false;

  imageElement.onerror = () => {
    imageElement.onerror = null;
    imageElement.src =
      DEFAULT_EVENT_IMAGE;
  };

  imageElement.src =
    requestedUrl ||
    DEFAULT_EVENT_IMAGE;
}


export function setEventBackground(
  element,
  imageUrl,
  eventTitle = "Event"
) {
  if (!element) return;

  const requestedUrl = String(
    imageUrl || ""
  ).trim();

  const applyBackground = (url) => {
    element.style.backgroundImage =
      `url("${url}")`;

    element.style.backgroundPosition =
      "center";

    element.style.backgroundSize =
      "cover";

    element.style.backgroundRepeat =
      "no-repeat";

    element.setAttribute(
      "role",
      "img"
    );

    element.setAttribute(
      "aria-label",
      `${eventTitle} event image`
    );

    element.classList.remove(
      "event-image-placeholder"
    );
  };

  if (!requestedUrl) {
    applyBackground(
      DEFAULT_EVENT_IMAGE
    );

    return;
  }

  const imageTest = new Image();

  imageTest.onload = () => {
    applyBackground(requestedUrl);
  };

  imageTest.onerror = () => {
    applyBackground(
      DEFAULT_EVENT_IMAGE
    );
  };

  imageTest.src = requestedUrl;
}