"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Daftar drag-and-drop yang juga bisa diurutkan dengan keyboard (Spasi, panah, Spasi). */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  render,
  grid = false,
  className,
  disabledIds = [],
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  render: (item: T, handle: ReactNode) => ReactNode;
  grid?: boolean;
  className?: string;
  disabledIds?: string[];
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => i.id === e.active.id);
    const to = items.findIndex((i) => i.id === e.over!.id);
    if (disabledIds.includes(items[to].id)) return;
    onReorder(arrayMove(items, from, to));
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={grid ? rectSortingStrategy : verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} disabled={disabledIds.includes(item.id)}>
              {(handle) => render(item, handle)}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, disabled, children }: { id: string; disabled: boolean; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const handle = disabled ? (
    <span className="inline-block w-8" aria-hidden="true" />
  ) : (
    <button
      type="button"
      className="grid h-9 w-8 shrink-0 cursor-grab touch-none place-items-center rounded text-admin-muted hover:bg-black/5 active:cursor-grabbing"
      aria-label="Seret untuk mengubah urutan"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </button>
  );
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("relative", isDragging && "z-10 opacity-80 shadow-lg")}>
      {children(handle)}
    </li>
  );
}
