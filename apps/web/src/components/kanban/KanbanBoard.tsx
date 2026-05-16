import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import type { DirectoryUser } from "../../lib/projectsApi.js";
import { patchTaskStatus } from "../../lib/tasksApi.js";
import type { Project, Task, TaskStatus } from "../../types/domain.js";
import {
  COLUMN_STATUSES,
  COLUMN_TITLES,
  addTask,
  cloneColumns,
  findTaskLocation,
  groupTasksByStatus,
  isColumnId,
  moveTaskToStatus,
  removeTask,
  replaceTask,
  type ColumnsState,
} from "./kanbanModel.js";
import { KanbanColumn } from "./KanbanColumn.js";
import { TaskFormModal } from "./TaskFormModal.js";

type Props = {
  project: Project;
  users: DirectoryUser[];
  initialTasks: Task[];
};

type EditingTask =
  | { mode: "create" }
  | { mode: "edit"; task: Task }
  | null;

export function KanbanBoard({ project, users, initialTasks }: Props) {
  const { token, user } = useAuth();
  const [columns, setColumns] = useState<ColumnsState>(() =>
    groupTasksByStatus(initialTasks),
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingTask>(null);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  useEffect(() => {
    setColumns(groupTasksByStatus(initialTasks));
  }, [initialTasks]);

  const usersById = useMemo(() => {
    const map = new Map<string, DirectoryUser>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const resolveAssigneeLabel = useCallback(
    (assigneeId: string | null) => {
      if (!assigneeId) return null;
      const u = usersById.get(assigneeId);
      if (!u) return "(unknown)";
      return u.fullName || u.email;
    },
    [usersById],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setSyncError(null);
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const cols = columnsRef.current;

      const activeLoc = findTaskLocation(cols, activeId);
      if (!activeLoc) return;

      let targetStatus: TaskStatus | null = null;
      if (isColumnId(overId)) {
        targetStatus = overId;
      } else {
        const overLoc = findTaskLocation(cols, overId);
        if (!overLoc) return;
        targetStatus = overLoc.status;
      }

      if (!targetStatus) return;

      if (targetStatus === activeLoc.status) {
        const oldIndex = cols[targetStatus].findIndex((t) => t.id === activeId);
        const newIndex = cols[targetStatus].findIndex((t) => t.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return;
        }
        setColumns((prev) => ({
          ...prev,
          [targetStatus]: arrayMove(prev[targetStatus], oldIndex, newIndex),
        }));
        return;
      }

      const snapshot = cloneColumns(cols);
      const optimistic = moveTaskToStatus(
        cols,
        activeId,
        activeLoc.status,
        targetStatus,
      );
      setColumns(optimistic);

      if (!token) {
        setColumns(snapshot);
        setSyncError("Not authenticated.");
        return;
      }

      void (async () => {
        try {
          const updated = await patchTaskStatus(activeId, targetStatus, token);
          if (updated.projectId !== project.id) {
            setColumns(snapshot);
            setSyncError("Task project mismatch.");
            return;
          }
          setColumns((prev) => replaceTask(prev, updated));
        } catch {
          setColumns(snapshot);
          setSyncError("Could not sync status with the server. Changes were reverted.");
        }
      })();
    },
    [project.id, token],
  );

  return (
    <div className="kanban-root">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "0.75rem",
        }}
      >
        <button
          type="button"
          className="btn primary"
          onClick={() => setEditing({ mode: "create" })}
        >
          + New task
        </button>
      </div>
      {syncError ? (
        <div className="banner error" role="alert">
          {syncError}
        </div>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={onDragEnd}
      >
        <div className="kanban-columns">
          {COLUMN_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              title={COLUMN_TITLES[status]}
              tasks={columns[status]}
              resolveAssigneeLabel={resolveAssigneeLabel}
              onOpenTask={(task) => setEditing({ mode: "edit", task })}
            />
          ))}
        </div>
      </DndContext>

      {editing != null ? (
        <TaskFormModal
          mode={editing.mode}
          project={project}
          task={editing.mode === "edit" ? editing.task : null}
          users={users}
          token={token}
          currentUserId={user?.id ?? null}
          currentUserRole={user?.role ?? null}
          onClose={() => setEditing(null)}
          onCreated={(t) => {
            setColumns((prev) => addTask(prev, t));
            setEditing(null);
          }}
          onUpdated={(t) => {
            setColumns((prev) => replaceTask(prev, t));
            setEditing(null);
          }}
          onDeleted={(id) => {
            setColumns((prev) => removeTask(prev, id));
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}
