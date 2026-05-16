import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import type { Task } from "../../types/domain.js";

type Props = {
  task: Task;
  assigneeLabel?: string | null;
  onOpen?: (task: Task) => void;
};

export function KanbanCard({ task, assigneeLabel, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="kanban-card"
      onClick={() => {
        if (!isDragging) onOpen?.(task);
      }}
      {...attributes}
      {...listeners}
    >
      <h3 className="kanban-card-title">{task.title}</h3>
      <p className="muted small" style={{ margin: "0 0 0.25rem" }}>
        Due {new Date(task.dueDate).toLocaleDateString()}
      </p>
      <p className="muted small" style={{ margin: 0 }}>
        {assigneeLabel ? `Assignee: ${assigneeLabel}` : "Unassigned"}
      </p>
    </article>
  );
}
