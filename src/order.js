// Old todos have no `order`; fall back to creation time
export function sortKey(todo) {
  if (typeof todo.order === "number") return todo.order;
  if (todo.createdAt) return todo.createdAt.toMillis();
  return Date.now();
}

export function sortTodos(todos) {
  return todos
    .map((t) => ({ ...t, order: sortKey(t) }))
    .sort((a, b) => a.order - b.order);
}

// New order for an item dropped between prev and next (either may be missing)
export function orderBetween(prev, next) {
  if (prev && next) return (prev.order + next.order) / 2;
  if (prev) return prev.order + 1;
  if (next) return next.order - 1;
  return Date.now();
}
