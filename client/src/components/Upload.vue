<template>
  <div>
    <cala-busy ref="busy"></cala-busy>

    <button class="btn btn-lg" @click="upload" v-bind:class="btn.className">
      <font-awesome icon="upload"></font-awesome>
      <span v-html="caption" class="ml-2"></span>
    </button>
    <form style="display: none" id="imageForm" method="post" enctype="multipart/form-data" action="/upload">
      <input ref="inputFile" @change="submit" class="hidden" type="file" accept="image/jpeg,image/jpg,image/png;capture=camera">
    </form>
  </div>
</template>

<script>
  import cb from "./Busy";

  export default {
    name: "cala-upload",
    components: {
      "cala-busy": cb,
    },
    props: {
      url: String,
      buttonClass: String,
      uploaded: Function,
      uploading: Function,
    },
    data() {
      return {
        btn: {
          className: this.buttonClass || "btn-primary",
        },
        caption: "Upload",
        resourceUrl: this.url,
      };
    },
    methods: {
      upload() {
        this.$refs.inputFile.click();
        this.$log.debug(this.resourceUrl);
      },
      submit() {
        if (this.$refs.inputFile.files.length > 0) {
          const file = this.$refs.inputFile.files[0];
          this.$emit("uploading", file);

          this.uploadFile(file)
            .then(response => {
              this.$emit("uploaded", response.data);
            })
            .catch(error => {
              this.$emit("error", error);
            });
        }
      },
      /**
       * @param {File} file
       * @returns {Promise<{}>}
       */
      uploadFile(file) {
        return new Promise((resolve, reject) => {
          this.$refs.work = true;
          const formData = new FormData();
          formData.append("file", file);

          this.$http.post(this.resourceUrl, formData)
            .then(response => {
              this.$refs.work = true;
              resolve(response);
            })
            .catch(error => {
              this.$log.error(error);
              reject(error);
              this.$refs.work = false;
            });
        });
      },
    },
  };
</script>

<style scoped>

</style>
