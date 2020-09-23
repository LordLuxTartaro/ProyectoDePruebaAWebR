<template>
  <div class="experience">
    <CameraFeed
      v-if="showCamera"
      :initFace="init"
      :updateFace="update"
      :hideFace="hide"
      :onDetachFace="onDetach"
      ref="cameraFeed"
    />
  </div>
</template>

<script>
const THREE = require("three");
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { PMREMGenerator } from "three/src/extras/PMREMGenerator.js";
import { RoughnessMipmapper } from "three/examples/jsm/utils/RoughnessMipmapper.js";
import { PMREMCubeUVPacker } from "@/vendors/pmrem/PMREMCubeUVPacker.js";
import CameraFeed from "@/components/CameraFeed";
import { creatGeom, creatMat } from "@/classes/Face3DUtils";
import Stats from "stats-js";
import { TextureLoader } from "three";

import { bus } from "../main";

export default {
  name: "experience",
  components: {
    CameraFeed,
  },
  data: () => ({
    showCamera: false,
    raycaster: null,
    geometry: null,
    material: null,
    uniforms: null,
    canvas: null,
    modelGeometry: null,
    headMesh: null,
    uniforms: null,
    clock: null,
    vertexShader: null,
    fragmentShader: null,
  }),
  mounted() {
    // this.stats = new Stats();
    // this.$el.appendChild( this.stats.dom );

    this.texLoader = new THREE.TextureLoader();

    this.showCamera = true;

    bus.$on("callChangeModel", this.changeModel);
  },
  methods: {
    loadModels(indexModel) {
      console.log("Start Loading Model");
      // this.headMesh.remove(this.glasses);

      this.loaderGLTF = new GLTFLoader();

      this.loaderGLTF.setPath("/assets/models/");
      this.occluderMat = new THREE.MeshStandardMaterial({
        colorWrite: false,
      });
      this.loaderGLTF.load("occluder.glb", (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.75, 1, 1.2);
        model.position.set(-0.012, 0, 0.25);
        model.traverse((child) => {
          if (child.isMesh) {
            child.material = this.occluderMat;
          }
        });

        this.headMesh.add(model);
      });
      this.hdrEnvMap = null;
      const { renderer } = XR8.Threejs.xrScene();
      this.envMap = null;
      var pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();

      new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath("assets/textures/")
        .load("hotel_room_1k.hdr", (texture) => {
          this.envMap = pmremGenerator.fromEquirectangular(texture);
          texture.dispose();
          pmremGenerator.dispose();

          const glassMaterial = new THREE.MeshPhysicalMaterial({
            // map: new THREE.TextureLoader().load(
            //   "assets/textures/baseColor.png"
            // ),
            color: 0xffffff,
            color: 0x96a3b4,
            // metalness: 0,
            // roughness: 0,
            // envMap: this.envMap.texture,
            // envMapIntensity: 0.2,
            // depthTest: true,
            transparency: 0.25,
            transparent: true,
          });

          this.loaderGLTF.setPath("/assets/models/");
          this.loaderGLTF.load("OCCL3131-0131.glb", (gltf) => {
            this.glasses = gltf.scene;
            this.glasses.scale.set(0.405, 0.405, 0.405);
            this.glasses.position.set(0, 0, 0.07);
            this.glasses.rotation.set(0.045, 0, 0);
            this.glasses.traverse((child) => {
              if (child && child.material) {
                if (child.material.name == "vidro lente escuro") {
                  child.material = glassMaterial;
                  // child.material.color.set(0xffb8be);
                } else if (child.material.name == "a_plastico preto") {
                  child.material.color.set(0x1f1f1f);
                } else {
                  child.material.metalness = 0.8;
                  child.material.envMap = this.envMap.texture;
                }
              }
            });

            this.headMesh.add(this.glasses);
          });
        });
    },
    init({ canvas, detail }) {
      console.log("=== Camera Face Detect Init ===");
      if (this.headMesh) {
        return;
      }

      this.canvas = this.canvas || canvas;
      this.modelGeometry = this.modelGeometry || detail;

      if (!(this.canvas && this.modelGeometry)) {
        return;
      }

      const { scene } = XR8.Threejs.xrScene(); // Get the 3js scene from XR

      this.clock = new THREE.Clock();

      const targetObject = new THREE.Object3D();
      targetObject.position.set(0, 0, -1);
      scene.add(targetObject);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.castShadow = true;
      directionalLight.position.set(0, 0.25, 0);
      directionalLight.target = targetObject;
      scene.add(directionalLight);

      var bounceLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
      scene.add(bounceLight);

      this.material = new THREE.MeshStandardMaterial({
        colorWrite: true,
        visible: false,
      });
      this.geometry = creatGeom(this.modelGeometry);
      this.headMesh = new THREE.Mesh(this.geometry, this.material);

      this.loadModels(0);

      this.hide();

      scene.add(this.headMesh);
    },
    update(event) {
      // this.stats.begin()

      const detail = event.detail;
      const { vertices, normals, transform, attachmentPoints } = detail;
      if (this.glasses && attachmentPoints.noseTip) {
        let nosePos = attachmentPoints.noseTip.position;
        this.glasses.position.set(0.003, nosePos.y + 0.05, 0.05);
      }

      const { position, rotation, scale } = transform; // Update transform.
      this.headMesh.position.set(position.x, position.y, position.z);
      this.headMesh.setRotationFromQuaternion(rotation);
      this.headMesh.scale.set(scale, scale, scale);

      vertices.forEach((v, index) => {
        // Update the vertices
        this.headMesh.geometry.vertices[index].x = v.x;
        this.headMesh.geometry.vertices[index].y = v.y;
        this.headMesh.geometry.vertices[index].z = v.z;
      });
      this.headMesh.geometry.verticesNeedUpdate = true;

      this.headMesh.geometry.faces.forEach((face) => {
        // Update the normals.
        face.vertexNormals[0].copy(normals[face.a]);
        face.vertexNormals[1].copy(normals[face.b]);
        face.vertexNormals[2].copy(normals[face.c]);
      });
      this.headMesh.geometry.normalsNeedUpdate = true;

      this.headMesh.material;

      this.headMesh.visible = true;

      let elementsBtn = document.getElementsByClassName("effect_btn");
      for (let i = 0; i < elementsBtn.length; i++) {
        elementsBtn[i].classList.remove("none");
        elementsBtn[i].classList.add("show");
      }

      // this.stats.end()
    },
    onDetach() {
      console.log("=== onDetach");
      this.canvas = null;
      this.modelGeometry = null;
    },
    hide() {
      console.log("=== Hide");
      let elementsBtn = document.getElementsByClassName("effect_btn");
      for (let i = 0; i < elementsBtn.length; i++) {
        elementsBtn[i].classList.remove("show");
        elementsBtn[i].classList.add("none");
      }
      this.headMesh.visible = false;
    },
    loadTextFile(url) {
      console.log("=== loadTextFile");
      return this.$http.get(url).then(
        (response) => {
          if (response.status && response.status == 200) {
            return response.body;
          }
        },
        (err) => {
          console.log("loadTextFile error", wrr);
        }
      );
    },
    convertToVector(points) {
      console.log("=== convertToVector");
      let resultPoints = [];
      for (let i = 0; i < points.length; i = i + 3) {
        let vectorPoint = new THREE.Vector3(
          points[i],
          points[i + 1],
          points[i + 2]
        );
        resultPoints.push(vectorPoint);
      }
      return resultPoints;
    },
    changeModel(index) {
      switch (index) {
        case 0:
          // this.loadModels(0)
          if (this.glasses) {
            this.glasses.traverse((child) => {
              if (child && child.material) {
                console.log("=== 0 === " + child.material.name);
                if (child.material.name == "a_plastico preto") {
                  child.material.color.set(0x1f1f1f);
                } else if (
                  child.material.name == "vidro lente escuro" ||
                  child.material.name == ""
                ) {
                  child.material.color.set(0x96a3b4);
                } else if (child.material.name == "metal preto") {
                  child.material.color.set(0xa9a9a9);
                } else {
                  child.material.metalness = 0.8;
                  child.material.envMap = this.envMap.texture;
                }
              }
            });
          }
          break;
        case 1:
          // this.loadModels(1)
          if (this.glasses) {
            this.glasses.traverse((child) => {
              if (child && child.material) {
                console.log("=== 1 === " + child.material.name);
                if (child.material.name == "a_plastico preto") {
                  child.material.color.set(0x1f1f1f);
                } else if (
                  child.material.name == "vidro lente escuro" ||
                  child.material.name == ""
                ) {
                  child.material.color.set(0xffffff);
                } else if (child.material.name == "metal preto") {
                  child.material.color.set(0x4c4c4c);
                } else {
                  child.material.metalness = 0.8;
                  child.material.envMap = this.envMap.texture;
                }
              }
            });
          }
          break;
        case 2:
          // this.loadModels(1)
          if (this.glasses) {
            this.glasses.traverse((child) => {
              if (child && child.material) {
                console.log("=== 2 === " + child.material.name);
                if (child.material.name == "a_plastico preto") {
                  child.material.color.set(0x416f92);
                } else if (
                  child.material.name == "vidro lente escuro" ||
                  child.material.name == ""
                ) {
                  child.material.color.set(0xffffff);
                } else if (child.material.name == "metal preto") {
                  child.material.color.set(0x0f1c27);
                } else {
                  child.material.metalness = 0.8;
                  child.material.envMap = this.envMap.texture;
                }
              }
            });
          }
          break;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.experience {
  @include set-size(100%, 100%);
  position: relative;
}
</style>
