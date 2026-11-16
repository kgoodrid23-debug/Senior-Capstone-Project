export const DEFAULT_PROFILE_IMAGE =
  "assets/default-profile.svg";


export function setProfileImage(
  imageElement,
  photoUrl,
  displayName = "User"
) {
  if (!imageElement) return;

  const requestedUrl = String(
    photoUrl || ""
  ).trim();

  imageElement.alt =
    `${displayName} profile picture`;

  imageElement.hidden = false;
  imageElement.style.display = "block";

  imageElement.onerror = () => {
    imageElement.onerror = null;
    imageElement.src =
      DEFAULT_PROFILE_IMAGE;
  };

  imageElement.src =
    requestedUrl ||
    DEFAULT_PROFILE_IMAGE;
}


export function setProfileBackground(
  element,
  photoUrl,
  displayName = "User"
) {
  if (!element) return;

  const requestedUrl = String(
    photoUrl || ""
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
      "aria-label",
      `${displayName} profile picture`
    );

    element.classList.add("has-image");
    element.classList.remove(
      "profile-avatar-placeholder"
    );
  };

  if (!requestedUrl) {
    applyBackground(
      DEFAULT_PROFILE_IMAGE
    );

    return;
  }

  const imageTest = new Image();

  imageTest.onload = () => {
    applyBackground(requestedUrl);
  };

  imageTest.onerror = () => {
    applyBackground(
      DEFAULT_PROFILE_IMAGE
    );
  };

  imageTest.src = requestedUrl;
}