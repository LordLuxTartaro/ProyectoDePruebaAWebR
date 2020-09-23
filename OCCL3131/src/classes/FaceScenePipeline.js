export  const faceScenePipelineModule = (init, update, hide, onDetach) => {
    return {
      name: 'facescene',
      onAttach: init,
      onDetach,
      listeners: [
        {event: 'facecontroller.faceloading', process: init},
        {event: 'facecontroller.facefound', process: update},
        {event: 'facecontroller.faceupdated', process: update},
        {event: 'facecontroller.facelost', process: hide},
      ],
    }
}