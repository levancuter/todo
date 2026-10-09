const SETTLE_MS = 150;

let state = null;

// Drag items of `list` by their `.handle`. The dragged item follows the
// pointer with a transform and other items slide out of the way; the DOM is
// not reordered. After the drop, onEnd(id, ids) gets the new id order, or
// ids = null if nothing moved.
export function makeSortable(list, onEnd) {
  list.addEventListener("pointerdown", (e) => {
    const handle = e.target.closest(".handle");
    if (!handle || state) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);

    const li = handle.closest("li");
    const items = [...list.children];
    // Page coordinates so scrolling during the drag doesn't break the math
    const rects = items.map((el) => {
      const r = el.getBoundingClientRect();
      return { mid: r.top + window.scrollY + r.height / 2, height: r.height };
    });
    const start = items.indexOf(li);

    state = { li, items, rects, start, target: start, startY: e.pageY, onEnd };
    li.classList.add("dragging", "lifted");
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  });
}

function onMove(e) {
  const { li, items, rects, start, startY } = state;
  const dy = e.pageY - startY;
  li.style.transform = `translateY(${dy}px)`;

  const center = rects[start].mid + dy;
  let target = start;
  rects.forEach((r, i) => {
    if (i > start && center > r.mid) target = i;
    if (i < start && center < r.mid && target === start) target = i;
  });
  state.target = target;

  const shift = rects[start].height;
  items.forEach((el, i) => {
    if (el === li) return;
    let y = 0;
    if (i > start && i <= target) y = -shift;
    if (i < start && i >= target) y = shift;
    el.style.transform = y ? `translateY(${y}px)` : "";
  });
}

function onUp(e) {
  const handle = e.currentTarget;
  handle.removeEventListener("pointermove", onMove);
  handle.removeEventListener("pointerup", onUp);
  handle.removeEventListener("pointercancel", onUp);

  // Slide the dragged item into its final slot before reporting
  const { li, rects, start, target } = state;
  let offset = 0;
  for (let i = start + 1; i <= target; i++) offset += rects[i].height;
  for (let i = target; i < start; i++) offset -= rects[i].height;
  li.classList.remove("dragging");
  li.style.transform = `translateY(${offset}px)`;

  setTimeout(finish, SETTLE_MS);
}

function finish() {
  const { li, items, start, target, onEnd } = state;
  state = null;
  const id = li.dataset.id;
  if (target === start) {
    onEnd(id, null);
    return;
  }
  const ids = items.map((el) => el.dataset.id).filter((x) => x !== id);
  ids.splice(target, 0, id);
  onEnd(id, ids);
}
