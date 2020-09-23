<template>
  <section class="camera-feed">
    <canvas ref="canvas" id="camera-feed__canvas" ></canvas>
  </section>
</template>

<script>
window.THREE = require('three');
import { faceScenePipelineModule } from '@/classes/FaceScenePipeline';
export default {
  name: "camera-feed",
  props: ["initFace", "updateFace", "hideFace", "onDetachFace"],
  components: {},
  data() {
    return {
      loading: true,
    };
  },
  mounted() {
    
    window.addEventListener("resize", e => {
      this.$refs.canvas.width = window.innerWidth;
      this.$refs.canvas.height = window.innerHeight;
    });

    this.$nextTick(() => {
      window.XR8 ? this.load() : window.addEventListener("xrloaded", this.load);
    });
  },

  methods: {
    load() {
      XR8.FaceController.configure({
        //Fill geometry in FACE, MOUTH, and/or EYES
        meshGeometry: [XR8.FaceController.MeshGeometry.FACE],
        coordinates: {
          mirroredDisplay: true,
          axes: 'RIGHT_HANDED',
        },
      })
      XR8.addCameraPipelineModules([
        XR8.GlTextureRenderer.pipelineModule({flipX: true}),
        XR8.Threejs.pipelineModule(),
        XR8.FaceController.pipelineModule(),
        XRExtras.FullWindowCanvas.pipelineModule(),
        {
          name: "camerastartupmodule",
          onCameraStatusChange: ({ status }) => {
            if (status == "requesting") {
            } else if (status == "hasStream") {
            } else if (status == "hasVideo") {
              this.loading = false;
            } else if (status == "failed") {
            }
          }
        },
        // Custom pipeline modules.
        faceScenePipelineModule(this.initFace, this.updateFace, this.hideFace, this.onDetachFace),
      ]);

      this.$refs.canvas.width = window.innerWidth;
      this.$refs.canvas.height = window.innerHeight;

      XR8.run({ 
        canvas: this.$refs.canvas, 
        cameraConfig: {
          direction: XR8.XrConfig.camera().FRONT
        },
        allowedDevices: XR8.XrConfig.device().ANY,
      });
    },
    pause() {
      if (!XR8.isPaused()) {
        XR8.pause();
      }
    },
    resume() {
      if (XR8.isPaused()) {
        XR8.resume();
      }
    }
  }
};
</script>

<style lang="scss">
.camera-feed {
  @include set-size(100%, 100%);
  
  .camera-feed__canvas {
    @include set-size(100%, 100%);
    transform: scaleX(-1);
  }
}

#camera-feed__canvas {
  position: absolute;
  top: 0;

  @include minWidth(1024) {
    position: absolute;
    right: 50%;
    transform: translate(50%, -50%);
    top: 50%;
    max-width: 700px;
    height: auto !important;
  }
}
</style>