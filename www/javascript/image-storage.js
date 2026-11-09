import {
  getDownloadURL,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-storage.js";

import {
  auth,
  storage
} from "./firebase-config.js";


const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;


export async function uploadImage(file, folderName) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be signed in to upload an image."
    );
  }

  if (!file) {
    throw new Error("No image was selected.");
  }

  const extension = ALLOWED_IMAGE_TYPES[file.type];

  if (!extension) {
    throw new Error(
      "The image must be a JPG, PNG, or WebP file."
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      "The image must be smaller than 5 MB."
    );
  }

  const filename =
    `${Date.now()}.${extension}`;

  const imageReference = ref(
    storage,
    `${folderName}/${user.uid}/${filename}`
  );

  const snapshot = await uploadBytes(
    imageReference,
    file,
    {
      contentType: file.type
    }
  );

  const downloadUrl = await getDownloadURL(
    snapshot.ref
  );

  return {
    url: downloadUrl,
    path: snapshot.ref.fullPath
  };
}