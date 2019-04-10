Vue.component("cala-meter", {
  template: `
    <div class="p-2">
      <div style="width: 100%; background: lightgrey; height: 60px;">
        <span class="float-left" style="background: green; height: 60px; display: block;" ref="left" v-bind:style="{ 'width': value.left + '%' }"></span>
        <span class="float-right" style="background: yellow; height: 60px; display: block;" ref="right" v-bind:style="{ 'width': value.right + '%' }"></span>
      </div>
      <div style="display: block;" class="mt-3">
        <button class="float-left btn-primary btn btn-lg p-3">{{label.left}}</button>
        <button class="float-right btn-warning btn btn-lg p-3">{{label.right}}</button>
      </div>
    </div>`,
  props: {
    left: Number,
    right: Number,
    labelLeft: String,
    labelRight: String
  },
  data() {
    return {
      value: {
        left: this.left || 0,
        right: this.right || 0
      },
      label: {
        left: this.labelLeft || "Label 1",
        right: this.labelRight || "Label 2"
      },
    };
  },
  watch: {
    left: function (val) {
      this.value.left = Math.min(50, Math.random() * 100 / 2);
    },
    right: function (val) {
      this.value.right = Math.min(50, Math.random() * 100 / 2);
    }
  }
});

Vue.component("cala-upload", {
  name: "cala-upload",
  props: {
    url: String,
    uploaded: Function
  },
  //language=HTML
  template: `
    <div class="overlay">
      <button class="btn btn-primary btn-lg shadow-sm" @click="upload" v-html="caption"></button>
      <form class="hidden" id="imageForm" method="post" enctype="multipart/form-data" action="/upload">
        <input ref="inputFile" @change="submit" class="hidden" type="file" accept="image/jpeg,image/jpg,image/png;capture=camera">
      </form>
    </div>`,
  data() {
    return {
      caption: "Upload",
      resourceUrl: this.url
    };
  },
  methods: {
    upload() {
      this.$refs.inputFile.click();
      console.log(this.resourceUrl);
    },
    submit() {
      if (this.$refs.inputFile.files.length > 0) {
        const file = this.$refs.inputFile.files[0];

        this.uploadFile(file)
          .then(response => {
            this.$emit("uploaded", response);
          })
          .catch(error => {
            alert(error);
          });
      }
    },
    /**
     * @param {File} file
     * @returns {Promise<{}>}
     */
    uploadFile(file) {
      return new Promise((resolve, reject) => {
        //spinner.classList.remove("hidden");
        const formData = new FormData();
        formData.append('file', file);

        axios.post(this.resourceUrl, formData)
          .then(response => {
            //spinner.classList.add("hidden");
            resolve(response);
          })
          .catch(error => {
            console.error(error);
            alert(error);
            //spinner.classList.add("hidden");
          });
      });
    }
  },
});