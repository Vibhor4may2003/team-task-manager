import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "../../types/domain.js";
import { KanbanCard } from "./KanbanCard.js";

type Props = {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  resolveAssigneeLabel: (assigneeId: string | null) => string | null;
  onOpenTask: (task: Task) => void;
};

export function KanbanColumn({
  status,
  title,
  tasks,
  resolveAssigneeLabel,
  onOpenTask,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const ids = tasks.map((t) => t.id);

  return (
    <section className={`kanban-column${isOver ? " is-over" : ""}`}>
      <header className="kanban-column-header">
        <h2 id={`column-${status}`}>{title}</h2>
        <span className="count-pill">{tasks.length}</span>
      </header>
      <div ref={setNodeRef} className="kanban-column-body">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              assigneeLabel={resolveAssigneeLabel(task.assigneeId)}
              onOpen={onOpenTask}
            />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}
