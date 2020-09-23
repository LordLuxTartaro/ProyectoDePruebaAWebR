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
const THREE = require('three');
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator.js';
import CameraFeed from "@/components/CameraFeed";
import { creatGeom, creatMat } from '@/classes/Face3DUtils'
import Stats from 'stats-js'
export default {
  name: 'experience',
  components: {
    CameraFeed
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
    mouthOpened: false,
  }),
  mounted(){

    this.stats = new Stats();
    this.$el.appendChild( this.stats.dom );

    this.texLoader = new THREE.TextureLoader()
    
    this.showCamera = true
  },
  methods: {
    loadModels(){
      this.loaderGLTF = new GLTFLoader()

      this.loaderGLTF.setPath( '/assets/models/' );
      this.occluderMat = new THREE.MeshStandardMaterial({
        colorWrite: false
      })
      this.loaderGLTF.load( 'occluder.glb', ( gltf ) => {
        const model = gltf.scene
        model.scale.set(0.85,1,1.2)
        model.position.set(0, 0.05, 0.2)
        model.traverse(child => {
          if (child.isMesh) {
            child.material = this.occluderMat
          }
        });

        // this.headMesh.add( model );
      });

      
      this.loaderGLTF.setPath( '/assets/models/frog/' );
      this.loaderGLTF.load( 'frog.glb', ( gltf ) => {
        this.frog = gltf.scene
        this.frog.scale.set(0.3,0.3,0.3)
        this.frog.rotation.set(-0.49,0,0)
        window.frog = this.frog
        this.frog.traverse(child => {
          if (child && child.material) {
            if (child.material.name == 'Lenses_mat') {
              child.material.metalness = 0.3
              child.material.roughness = 0.5
            }
          }
        });

        this.headMesh.add( this.frog );
      });
    },
    init({canvas, detail}) {
      if (this.headMesh) {
        return
      }
      
      this.canvas = this.canvas || canvas
      this.modelGeometry = this.modelGeometry || detail
      
      if (!(this.canvas && this.modelGeometry)) {
        return
      }
      
      const {scene} = XR8.Threejs.xrScene()  // Get the 3js scene from XR
      
      this.clock = new THREE.Clock()
  
      const targetObject = new THREE.Object3D()
      targetObject.position.set(0, 0, -1)
      scene.add(targetObject)
      
  
      const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 )
      directionalLight.castShadow = true
      directionalLight.position.set(0, 0.25, 0)
      directionalLight.target = targetObject
      scene.add(directionalLight)
      
      var bounceLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3)
      scene.add( bounceLight )

      // this.material = new THREE.MeshStandardMaterial({
      //   colorWrite: false
      // })
      this.material = new THREE.MeshStandardMaterial({
        color: 0x17631a,
        transparent: true,
        opacity: 0.2,
        metalness: 0.3,
        roughness: 0.5,
        alphaMap: new THREE.TextureLoader().load(require('@/assets/Alpha/softer.png')),
      })
      this.geometry = creatGeom(this.modelGeometry)
      this.headMesh = new THREE.Mesh(this.geometry, this.material)

      this.loadModels()
      
      this.hide()
  
      scene.add(this.headMesh)
    },
    update(event) {

      this.stats.begin()

      const detail = event.detail;
      const {vertices, normals, transform, attachmentPoints} = detail
      if (this.frog && attachmentPoints.mouth) {
        let mouthPos = attachmentPoints.mouth.position
        this.frog.position.set(mouthPos.x, mouthPos.y, mouthPos.z)
      }
      
  
      const {position, rotation, scale} = transform  // Update transform.
      this.headMesh.position.set(position.x, position.y, position.z)
      this.headMesh.setRotationFromQuaternion(rotation)
      this.headMesh.scale.set(scale, scale, scale)
  
      vertices.forEach((v, index)=> {  // Update the vertices
        if (index == 14) {
          let upVec3 = new THREE.Vector3(vertices[index].x, vertices[index].y, vertices[index].z)
          let downVec3 = new THREE.Vector3(vertices[index-1].x, vertices[index-1].y, vertices[index-1].z)
          let dist = upVec3.distanceTo( downVec3 )
          this.mouthOpened = dist > 0.05
          let percScaleMouth = dist / .015
          let percScaleFrog = 0.0001
          if (this.mouthOpened > 0.03) {
            percScaleFrog = 0.3 * percScaleMouth / 10
            if (percScaleFrog > 0.3) {
              percScaleFrog = 0.3
            }
          }
          this.frog.scale.set(percScaleFrog, percScaleFrog, percScaleFrog)
          this.material.opacity = percScaleFrog
        }

        this.headMesh.geometry.vertices[index].x = v.x
        this.headMesh.geometry.vertices[index].y = v.y
        this.headMesh.geometry.vertices[index].z = v.z
      })
      this.headMesh.geometry.verticesNeedUpdate = true
      
      this.headMesh.geometry.faces.forEach((face) => {  // Update the normals.
        face.vertexNormals[0].copy(normals[face.a])
        face.vertexNormals[1].copy(normals[face.b])
        face.vertexNormals[2].copy(normals[face.c])
      })
      this.headMesh.geometry.normalsNeedUpdate = true
      
    //   this.headMesh.material
      
      this.headMesh.visible = true

      this.stats.end()
    },
    onDetach() {
      this.canvas = null
      this.modelGeometry = null
    },
    hide() {
      this.headMesh.visible = false
    },
    loadTextFile(url) {
      return this.$http.get(url).then(response => {
          if (response.status && response.status == 200) {
              return response.body
          }
      }, err => {
          console.log('loadTextFile error', wrr)
      });
    },
    convertToVector (points) {
      let resultPoints = []
      for (let i = 0; i < points.length; i = i + 3) {
          let vectorPoint = new THREE.Vector3(points[i], points[i + 1], points[i + 2])
          resultPoints.push(vectorPoint)
      }
      return resultPoints
    }
  }
}
</script>

<style scoped lang="scss">
.experience {
  @include set-size(100%, 100%);
  position: relative;
}
</style>
