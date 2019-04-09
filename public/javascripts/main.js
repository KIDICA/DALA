document.addEventListener("DOMContentLoaded", function () {
  const app = new Vue({
    el: '#app',
    data: function () {
      return {
        taggedCount: 0,
        untaggedCount: 0
      };
    }
  });

  const guess = document.getElementById("guess");
  const image = document.getElementById("image");
  const tagged = document.getElementById("tagged");
  const untagged = document.getElementById("untagged");
  const spinner = document.getElementById("spinner");

  axios.get("/counts")
    .then(counts => {
      tagged.innerText = counts.data.tagged;
      untagged.innerText = counts.data.untagged;
    });

  function removeTagButtonSelection() {
    const allTags = [...document.querySelectorAll(".tag")];
    allTags.forEach(tag => {
      tag.classList.add("btn-light");
      tag.classList.remove("btn-success");
    });
  }

  function selectTag(id) {
    removeTagButtonSelection();
    const tagBtn = document.querySelector(`.tag[data-id="${id}"]`);
    console.log("select-tag", id, tagBtn);
    tagBtn.classList.add("btn-success");
    tagBtn.classList.remove("btn-light");
  }

  /**
   * @param {File} file
   * @returns {Promise<{}>}
   */
  function uploadFile(file) {
    return new Promise((resolve, reject) => {
      spinner.classList.remove("hidden");
      const formData = new FormData();
      formData.append('file', file);

      axios.post("/upload", formData)
        .then(response => {
          spinner.classList.add("hidden");
          resolve(response);
        })
        .catch(error => {
          console.error(error);
          alert(error);
          spinner.classList.add("hidden");
        });
    });
  }

  image.addEventListener("change", function (event) {
    if (this.files.length > 0) {
      const file = this.files[0];
      //const reader = new FileReader();

      uploadFile(file)
        .then(response => {
          console.log(response);
        })
        .catch(error => {
          alert(error);
        });
      //reader.addEventListener("load", function () {
      //preview.src = reader.result;
      //console.log(bg);
      //bg.style.backgroundImage = `url("${reader.result}")`;
      //}, false);
      //reader.readAsDataURL(file);
    }
  });

  document.querySelector("#btnUpload").addEventListener("click", function (event) {
    image.click();
  });

  function highlightTag() {
    axios.get("/image/" + currentImageId())
      .then(response => {
        response.data.forEach(image => {
          if (image.tags.length > 0) {
            const id = image.tags[0].tagId;
            selectTag(id);
          }
        });
      });
  }

  const glide = new Glide('#intro', {
    type: 'carousel',
    perView: 1,
    focusAt: 'center',
    /*
    breakpoints: {
      800: {
        perView: 2
      },
      480: {
        perView: 1
      }
    }
    */
  });

  glide.on("swipe.move", function () {
    guess.innerText = "Guess: ... %";
    removeTagButtonSelection();
  });

  glide.on("swipe.end", function () {
    highlightTag();
  });

  glide.on("mount.after", function () {
    highlightTag();
  });

  glide.mount();

  function currentImageId() {
    const images = document.querySelectorAll("#slideContainer img");
    const imageEl = [...images][glide.index + 1];
    const imageId = imageEl.getAttribute("data-id");

    return imageId;
  }

  function postTag(tagData) {
    console.info("POST", tagData);
    axios.post("/", tagData)
      .then(response => {
        console.log("tag-data", tagData);
        selectTag(tagData.tagId);
      })
      .catch(error => alert(error.message));
  }

  /**
   * @param param.id {string} Tag UUID
   */
  function tagImage(param) {
    const imageId = currentImageId();
    const tagId = param.id;
    const data = {imageId, tagId};
    console.log("tag-image", data);

    postTag(data);
  }

  const buttons = document.querySelectorAll(".overlay .tag");

  [...buttons].forEach(button => button.addEventListener("click", event => {
    const el = event.target;
    tagImage({id: el.getAttribute("data-id")})
  }));
});