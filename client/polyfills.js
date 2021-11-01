import "core-js/es/map";
import "core-js/es/set";
import "core-js/es/array";
import "core-js/es/promise";
import "core-js/es/weak-map";
import "core-js/es/string";
import "regenerator-runtime/runtime";
import "raf/polyfill";

window.oldBrowser = true;

const removeToastsInOldBrowsers = () => {
  setInterval(() => {
    const toastContainer = document.querySelector(".Toastify").children;
    if (toastContainer.length) {
      const toasts = Array.from(toastContainer[0].children);
      toasts.map((toast) => setTimeout(() => toast.remove(), 4000));
    }
  }, 1000);
};

try {
  removeToastsInOldBrowsers(); // to auto remove toasts
} catch {
  //
}
