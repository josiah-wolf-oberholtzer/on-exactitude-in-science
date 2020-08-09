import {
  Plane, Raycaster, Vector2, Vector3,
} from 'three';
import { dispatch } from 'd3-dispatch';

const DragControls = (objects, _camera, canvas) => {
  const plane = new Plane();
  const raycaster = new Raycaster();
  const mouse = new Vector2();
  const intersection = new Vector3();
  const worldPosition = new Vector3();
  const intersections = [];
  const dispatcher = dispatch(
    'drag', 'dragstart', 'dragend', 'mouseover', 'mouseout',
    'select', 'deselect',
  );

  let enabled = true,
    transformGroup = false,
    dragged = null,
    selected = null,
    hovered = null;

  function onDocumentMouseMove(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, _camera);
    if (dragged && enabled) {
      raycaster.ray.intersectPlane(plane, intersection);
      dispatcher.call('drag', null, { event, object: dragged, position: intersection });
      return;
    }
    intersections.length = 0;
    raycaster.setFromCamera(mouse, _camera);
    raycaster.intersectObjects(objects, true, intersections);
    if (intersections.length > 0) {
      const { object } = intersections[0];
      plane.setFromNormalAndCoplanarPoint(
        _camera.getWorldDirection(plane.normal),
        worldPosition.setFromMatrixPosition(object.matrixWorld),
      );
      if (hovered !== object) {
        if (hovered !== null) {
          dispatcher.call('mouseout', null, { event, object: hovered });
        }
        dispatcher.call('mouseover', null, { event, object });
        canvas.style.cursor = 'pointer';
        hovered = object;
      }
    } else if (hovered !== null) {
      dispatcher.call('mouseout', null, { event, object: hovered });
      canvas.style.cursor = 'auto';
      hovered = null;
    }
  }

  function onDocumentMouseDown(event) {
    event.preventDefault();
    intersections.length = 0;
    raycaster.setFromCamera(mouse, _camera);
    raycaster.intersectObjects(objects, true, intersections);
    if (intersections.length > 0) {
      dragged = (transformGroup === true) ? objects[0] : intersections[0].object;
      raycaster.ray.intersectPlane(plane, intersection);
      canvas.style.cursor = 'move';
      if (dragged !== selected) {
        if (selected) {
          dispatcher.call('deselect', null, { event, object: selected, replaced: true });
        }
        selected = dragged;
        dispatcher.call('select', null, { event, object: selected });
      }
      dispatcher.call('dragstart', null, { event, object: dragged });
    } else if (selected) {
      dispatcher.call('deselect', null, { event, object: selected, replaced: false });
      selected = null;
    }
  }

  function onDocumentMouseCancel(event) {
    event.preventDefault();
    if (dragged) {
      dispatcher.call('dragend', null, { event, object: dragged });
      dragged = null;
    }
    canvas.style.cursor = hovered ? 'pointer' : 'auto';
  }

  function onDocumentTouchMove(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = event.changedTouches[0];
    mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, _camera);
    if (dragged && enabled) {
      raycaster.ray.intersectPlane(plane, intersection);
      dispatcher.call('drag', null, { event, object: dragged, position: intersection });
    }
  }

  function onDocumentTouchStart(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = event.changedTouches[0];
    mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    intersections.length = 0;
    raycaster.setFromCamera(mouse, _camera);
    raycaster.intersectObjects(objects, true, intersections);
    if (intersections.length > 0) {
      dragged = (transformGroup === true) ? objects[0] : intersections[0].object;
      plane.setFromNormalAndCoplanarPoint(
        _camera.getWorldDirection(plane.normal),
        worldPosition.setFromMatrixPosition(dragged.matrixWorld),
      );
      raycaster.ray.intersectPlane(plane, intersection);
      canvas.style.cursor = 'move';
      if (dragged !== selected) {
        if (selected) {
          dispatcher.call('deselect', null, { event, object: selected, replaced: true });
        }
        selected = dragged;
        dispatcher.call('select', null, { event, object: selected });
      }
      dispatcher.call('dragstart', null, { event, object: dragged });
    } else if (selected) {
      dispatcher.call('deselect', null, { event, object: selected, replaced: false });
      selected = null;
    }
  }

  function onDocumentTouchEnd(event) {
    event.preventDefault();
    if (dragged) {
      dispatcher.call('dragend', null, { event, object: dragged });
      dragged = null;
    }
    canvas.style.cursor = 'auto';
  }

  function activate() {
    canvas.addEventListener('mousemove', onDocumentMouseMove, false);
    canvas.addEventListener('mousedown', onDocumentMouseDown, false);
    canvas.addEventListener('mouseup', onDocumentMouseCancel, false);
    canvas.addEventListener('mouseleave', onDocumentMouseCancel, false);
    canvas.addEventListener('touchmove', onDocumentTouchMove, false);
    canvas.addEventListener('touchstart', onDocumentTouchStart, false);
    canvas.addEventListener('touchend', onDocumentTouchEnd, false);
  }

  function deactivate() {
    canvas.removeEventListener('mousemove', onDocumentMouseMove, false);
    canvas.removeEventListener('mousedown', onDocumentMouseDown, false);
    canvas.removeEventListener('mouseup', onDocumentMouseCancel, false);
    canvas.removeEventListener('mouseleave', onDocumentMouseCancel, false);
    canvas.removeEventListener('touchmove', onDocumentTouchMove, false);
    canvas.removeEventListener('touchstart', onDocumentTouchStart, false);
    canvas.removeEventListener('touchend', onDocumentTouchEnd, false);
    canvas.style.cursor = '';
  }

  function dispose() {
    deactivate();
  }

  activate();

  return {
    activate,
    add(_) { objects.push(_); },
    remove(_) { objects.splice(objects.indexOf(_), 1); },
    deactivate,
    dispose,
    enabled(_) { return arguments.length > 0 ? enabled = _ : enabled; },
    objects: () => objects,
    on(name, _) { return arguments.length > 1 ? dispatcher.on(name, _) : dispatcher.on(name); },
    transformGroup(_) { return arguments.length > 0 ? transformGroup = _ : transformGroup; },
  };
};

export { DragControls };
