// Props for a control that sits inside a draggable and has to act on its
// own press rather than pick the draggable up — a remove X, a favourite
// star, a servings stepper.
//
// All three event families need stopping. The planner's sensors listen on
// mousedown (MouseSensor) and touchstart (TouchSensor), and neither is the
// same stream as pointerdown: a browser fires pointerdown *and* mousedown
// for one click, so stopping only the pointer event leaves the sensor's
// own listener untouched and the press both deletes the chip and starts
// dragging it. pointerdown is stopped too, for any sensor that uses it.
//
// Spread it onto the control: <button {...stopDragPress} onClick={…}>
export const stopDragPress = {
  onMouseDown: (e) => e.stopPropagation(),
  onTouchStart: (e) => e.stopPropagation(),
  onPointerDown: (e) => e.stopPropagation(),
}

export default stopDragPress
