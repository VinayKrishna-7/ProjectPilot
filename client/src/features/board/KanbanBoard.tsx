import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { IIssue, IBoardColumn, IssueStatus } from '@taskflow/shared';
import { BoardColumnComponent } from './BoardColumn';
import { IssueCard } from './IssueCard';
import { useMoveIssue } from '@/features/issue/hooks/useIssues';
import { useQueryClient } from '@tanstack/react-query';

interface ColumnWithIssues extends IBoardColumn {
  issues: IIssue[];
}

interface KanbanBoardProps {
  projectId: string;
  columns: ColumnWithIssues[];
  onIssueClick: (issue: IIssue) => void;
  onAddIssueClick: (columnId: string) => void;
}

export function KanbanBoard({
  projectId,
  columns: initialColumns,
  onIssueClick,
  onAddIssueClick,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnWithIssues[]>(initialColumns);
  const [activeIssue, setActiveIssue] = useState<IIssue | null>(null);

  const queryClient = useQueryClient();
  const moveIssueMutation = useMoveIssue();

  // Sync state with props when data changes outside of active dragging
  if (!activeIssue && columns !== initialColumns) {
    setColumns(initialColumns);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag begins to allow clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumn = (id: string): ColumnWithIssues | undefined => {
    // Check if id is a column id
    const col = columns.find((c) => c._id === id);
    if (col) return col;
    // Otherwise, check if id is an issue id within a column
    return columns.find((c) => c.issues.some((i) => i._id === id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const issue = active.data.current?.issue as IIssue;
    if (issue) {
      setActiveIssue(issue);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceColumn = findColumn(activeId);
    const targetColumn = findColumn(overId);

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn) {
      return;
    }

    // Move issue between different columns in state optimistically
    setColumns((prevCols) => {
      const sourceCol = prevCols.find((c) => c._id === sourceColumn._id)!;
      const targetCol = prevCols.find((c) => c._id === targetColumn._id)!;

      const activeIndex = sourceCol.issues.findIndex((i) => i._id === activeId);
      if (activeIndex === -1) return prevCols;

      const activeItem = sourceCol.issues[activeIndex];
      const updatedItem = {
        ...activeItem,
        boardColumn: targetCol._id,
        status: targetCol.status,
      };

      const overIndex = targetCol.issues.findIndex((i) => i._id === overId);
      const newTargetIssues = [...targetCol.issues];

      if (overIndex >= 0) {
        newTargetIssues.splice(overIndex, 0, updatedItem);
      } else {
        newTargetIssues.push(updatedItem);
      }

      return prevCols.map((c) => {
        if (c._id === sourceCol._id) {
          return {
            ...c,
            issues: c.issues.filter((i) => i._id !== activeId),
          };
        }
        if (c._id === targetCol._id) {
          return {
            ...c,
            issues: newTargetIssues,
          };
        }
        return c;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentColumn = findColumn(activeId);
    if (!currentColumn) return;

    const activeIndex = currentColumn.issues.findIndex((i) => i._id === activeId);
    const overIndex = currentColumn.issues.findIndex((i) => i._id === overId);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      // Reordered within same column
      const newIssues = arrayMove(currentColumn.issues, activeIndex, overIndex);
      setColumns((prev) =>
        prev.map((c) => (c._id === currentColumn._id ? { ...c, issues: newIssues } : c))
      );

      // Compute new fractional or order position
      const position = (overIndex + 1) * 1000;

      moveIssueMutation.mutate(
        {
          issueId: activeId,
          boardColumn: currentColumn._id,
          position,
          status: currentColumn.status,
        },
        {
          onError: () => {
            // Roll back to initial columns on failure
            setColumns(initialColumns);
          },
        }
      );
    } else {
      // Crossed columns or stayed at dropped position
      const targetIndex = activeIndex !== -1 ? activeIndex : currentColumn.issues.length - 1;
      const position = (targetIndex + 1) * 1000;

      moveIssueMutation.mutate(
        {
          issueId: activeId,
          boardColumn: currentColumn._id,
          position,
          status: currentColumn.status,
        },
        {
          onError: () => {
            setColumns(initialColumns);
          },
        }
      );
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[calc(100vh-14rem)]">
        {columns.map((column) => (
          <BoardColumnComponent
            key={column._id}
            column={column}
            onIssueClick={onIssueClick}
            onAddIssueClick={onAddIssueClick}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeIssue ? (
          <IssueCard issue={activeIssue} onClick={() => {}} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
