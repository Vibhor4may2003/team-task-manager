import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { patchTaskStatus } from "../../lib/tasksApi.js";
import type { Task, TaskStatus } from "../../types/domain.js";
import {
  COLUMN_STATUSES,
  COLUMN_TITLES,
  cloneColumns,
  findTaskLocation,
  groupTasksByStatus,
  isColumnId,
  moveTaskToStatus,
  replaceTask,
  type ColumnsState,
} from "./kanbanModel.js";
import { KanbanColumn } from "./KanbanColumn.js";

type Props = {
  projectId: string;
  initialTasks: Task[];
};

export function KanbanBoard({ projectId, initialTasks }: Props) {
  const { token } = useAuth();
  const [columns, setColumns] = useState<ColumnsState>(() =>
    groupTasksByStatus(initialTasks),
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  useEffect(() => {
    setColumns(groupTasksByStatus(initialTasks));
  }, [initialTasks]);

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
          if (updated.projectId !== projectId) {
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
    [projectId, token],
  );

  return (
    <div className="kanban-root">
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
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
