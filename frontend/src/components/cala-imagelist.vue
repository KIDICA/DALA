<template>
  <div class="m-2">
    <cala-busy ref="busy"></cala-busy>
    <div class="card">
      <div class="card-header p-2"><strong>Labeling Overview</strong></div>
      <div class="card-body p-1">
        <ul class="list-group border-0">
          <li v-if="!hasImages" class="m-0 p-1 border-0 list-group-item d-flex justify-content-between align-items-center">
            <div class="row">
              <div class="col">
                No data.
              </div>
            </div>
          </li>
          <li v-else v-for="image in images" :key="image.id" class="animated rollIn m-0 mb-1 pb-2 p-1 border-top-0 border-left-0 border-right-0 list-group-item d-flex justify-content-between align-items-center">
            <div class="row">

              <div class="col">
                <div class="card p-1">
                  <div class="card-body p-0 bg-secondary">
                    <img class="rounded" style="object-fit: contain; height: 110px; width: 110px;" v-bind:src="image.thumbnailUrl"/>
                  </div>
                  <div class="card-footer p-0">
                    <button class="btn btn-sm btn-danger mt-1 w-100" @click="deleteImage(image)">
                      Delete <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div class="col">
                <div class="btn-group">
                  <button @click="tagItem(image, tag)" v-for="tag in allTags" :key="tag.id" class="btn" v-bind:class="{ 'btn-secondary': !image.hasTags || (image.tags[0].id !== tag.id), 'btn-success': image.hasTags && image.tags[0].id === tag.id }">
                    {{tag.name}}
                  </button>
                </div>
                <div class="mt-1" v-if="!image.hasTags">
                  <div class="badge badge-warning mr-1 p-2">
                    Unlabeled
                  </div>
                  <div class="badge badge-info p-2">
                    <i class="fa fa-brain"></i><span class="ml-1">Guess: Tag 123</span>
                  </div>
                </div>
              </div>

            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
  import cb from "./cala-busy";

  export default {
    name: "cala-imagelist",

    props: {
      removeButton: Boolean,
    },

    components: {
      "cala-busy": cb,
    },
    data() {
      return {
        button: {
          remove: ((typeof this.removeButton === "undefined") ? true : this.removeButton)
        },
        images: [],
        imageBuffer: [],
        busy: false,
        init: false,
      };
    },
    watch: {
      images(val) {
        if (val.length > 0) {
          this.init = true;
        }
      },
      busy(val) {
        this.$refs.busy.work = val;
      }
    },
    computed: {
      hasImages: function () {
        return this.images.length > 0;
      },
      // TODO: ISSUE: Global intersection of "tags" variable values due to the same name on cala-live component, when
      // cala-dashboard and cala-imagelist are on the same page.
      allTags: {
        get() {
          return this.$store.state.tags;
        },
      }
    },
    methods: {
      tagItem(image, tag) {
        console.log(tag);
      },
      deleteImage(image, index) {
        if (!window.confirm("Delete image?")) {
          return;
        }

        this.$query(`
          mutation {
            deleteImage(id: "${image.id}") {
              id
            }
          }
        `).then(() => {
          this.images = this.images.filter(_image => _image.id !== image.id);
        });
      },
      load() {
        this.busy = true;
        this.$query(`
        {
          images {
            id, created, imageUrl, thumbnailUrl
            tags { id, name }
          }
        }
      `).then(response => {
          this.imageBuffer = response.images.map(image => {
            image.className = "";
            image.hasTags = image.tags !== null && image.tags.length > 0;
            return image;
          });
          // TODO: Currently simulates stream of images, later imageBuffer is fed by a WebSocket from the server.
          this.thread = setInterval(() => {
            if (this.imageBuffer.length > 0) {
              this.images.unshift(this.imageBuffer.pop())
            } else {
              clearInterval(this.thread);
            }
          }, 2000);
          this.busy = false;
        });
      }
    },
    mounted() {
      this.load();
    }
  }
</script>

<style scoped>

</style>