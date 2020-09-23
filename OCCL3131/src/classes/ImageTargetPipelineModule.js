export const imageTargetPipelineModule = (initXrScene, targetFound, targetLost) => {
    
    // const targetFound = ({detail}) => {
    //     console.log('targetfound')
        // if (detail.name === 'bolacha') {
        //     model.position.copy(detail.position)
        //     model.quaternion.copy(detail.rotation)
        //     model.scale.set(detail.scale, detail.scale, detail.scale)
        //     model.visible = true
        // }
    // }
  
    // Hides the image frame when the target is no longer detected.
    // const targetLost = ({detail}) => {
    //   if (detail.name === 'bolacha') {
    //     model.visible = false
    //   }
    // }
  
    const onStart = ({canvas}) => {
      const {scene, camera, renderer} = XR8.Threejs.xrScene()
  
      initXrScene({scene, camera, renderer})
  
      XR8.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.quaternion,
      })
    }
  
    return {
        name: 'target-module',
        onStart,
        listeners: [
            {event: 'reality.imagefound', process: targetFound },
            {event: 'reality.imageupdated', process: targetFound },
            {event: 'reality.imagelost', process: targetLost },
        ],
    }
  }