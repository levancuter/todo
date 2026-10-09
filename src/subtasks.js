// Subtasks: a checklist stored as an array on the todo, [{ id, text, done }]

export function subtasksOf(todo) {
  return todo.subtasks || [];
}

export function newSubtaskId() {
  return Math.random().toString(36).slice(2, 10);
}

// { done, total }
export function progressOf(todo) {
  const subtasks = subtasksOf(todo);
  return { done: subtasks.filter((s) => s.done).length, total: subtasks.length };
}

// The checklist without ticks: what a routine keeps
export function stepsOf(subtasks) {
  return subtasks.map(({ id, text }) => ({ id, text }));
}

// Same steps in the same order (ticks ignored)?
export function sameSteps(a, b) {
  return JSON.stringify(stepsOf(a || [])) === JSON.stringify(stepsOf(b || []));
}

// A new routine todo starts with nothing ticked
export function freshSubtasks(steps) {
  return (steps || []).map(({ id, text }) => ({ id, text, done: false }));
}
