function createVue(param) {
  return new Promise((resolve, reject) => {
    document.addEventListener("DOMContentLoaded", function () {
      resolve(new Vue(param));
    });
  });
}