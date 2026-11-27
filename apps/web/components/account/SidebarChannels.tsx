"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChannelCategory, Icon, toast } from "@fellowship/ui";
import type { Category, Channel } from "@fellowship/db";
import { useState, type ReactNode } from "react";
import styles from "@/components/shell/Sidebar.module.sass";
import { createCategoryAction, reorderCategoriesAction, reorderChannelsAction } from "@/lib/app/manage-actions";
import { usePref } from "@/lib/prefs";

const LOOSE = "sem-categoria";
type Order = Record<string, string[]>;

function buildOrder(categories: Category[], channels: Channel[]): Order {
  const order: Order = { [LOOSE]: [] };
  for (const c of categories) order[c.id] = [];
  for (const ch of [...channels].sort((a, b) => a.position - b.position)) (order[ch.category_id ?? LOOSE] ??= []).push(ch.id);
  return order;
}

/**
 * Canais e categorias da barra. Quem gerencia canais arrasta canais (entre e para fora das categorias) e
 * categorias inteiras; no celular, segure um instante para arrastar. Categorias abrem e fecham (salvo por pessoa).
 */
export function SidebarChannels({
  spaceId,
  categories,
  channels,
  canManage,
  renderRow,
  categoryAction,
}: {
  spaceId: string;
  categories: Category[];
  channels: Channel[];
  canManage: boolean;
  renderRow: (c: Channel) => ReactNode;
  categoryAction: (cat: Category) => ReactNode;
}) {
  // Estado local para arrastar sem esperar o servidor; volta a seguir as props quando elas mudam.
  const [source, setSource] = useState({ categories, channels });
  const [order, setOrder] = useState(() => buildOrder(categories, channels));
  const [catOrder, setCatOrder] = useState(() => [...categories].sort((a, b) => a.position - b.position).map((c) => c.id));
  if (source.categories !== categories || source.channels !== channels) {
    setSource({ categories, channels });
    setOrder(buildOrder(categories, channels));
    setCatOrder([...categories].sort((a, b) => a.position - b.position).map((c) => c.id));
  }
  const [closedRaw, setClosedRaw] = usePref<string>(`categorias-fechadas:${spaceId}`, "");
  const closed = new Set(closedRaw.split(",").filter(Boolean));
  const setOpen = (id: string, open: boolean) => {
    const next = new Set(closed);
    if (open) next.delete(id);
    else next.add(id);
    setClosedRaw([...next].join(","));
  };
  const [active, setActive] = useState<string | null>(null);
  const [startContainer, setStartContainer] = useState<string | null>(null);
  const [newCat, setNewCat] = useState<string | null>(null);

  const byId = new Map(channels.map((c) => [c.id, c]));
  const catById = new Map(categories.map((c) => [c.id, c]));
  const containerOf = (id: string) => (id.startsWith("cont:") ? id.slice(5) : Object.keys(order).find((k) => order[k]!.includes(id)));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setActive(id);
    setStartContainer(id.startsWith("cat:") ? null : (containerOf(id) ?? null));
  }

  function onDragOver(e: DragOverEvent) {
    const id = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || id.startsWith("cat:")) return;
    const from = containerOf(id);
    const to = overId.startsWith("cat:") ? overId.slice(4) : containerOf(overId);
    if (!from || !to || from === to) return;
    setOrder((o) => {
      const target = [...o[to]!];
      const at = target.indexOf(overId);
      target.splice(at >= 0 ? at : target.length, 0, id);
      return { ...o, [from]: o[from]!.filter((x) => x !== id), [to]: target };
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    setActive(null);
    if (!overId) return;
    if (id.startsWith("cat:")) {
      const from = catOrder.indexOf(id.slice(4));
      const to = catOrder.indexOf(overId.replace(/^cat:|^cont:/, ""));
      if (from < 0 || to < 0 || from === to) return;
      const next = arrayMove(catOrder, from, to);
      setCatOrder(next);
      const r = await reorderCategoriesAction(spaceId, next);
      if (r.error) toast.error(r.error);
      return;
    }
    const container = containerOf(id);
    if (!container) return;
    let list = order[container]!;
    const from = list.indexOf(id);
    const to = list.indexOf(overId);
    if (to >= 0 && from !== to) {
      list = arrayMove(list, from, to);
      setOrder((o) => ({ ...o, [container]: list }));
    }
    const touched = new Set([container, startContainer ?? container]);
    for (const k of touched) {
      const ids = k === container ? list : order[k]!;
      const r = await reorderChannelsAction(spaceId, k === LOOSE ? null : k, ids);
      if (r.error) return toast.error(r.error);
    }
  }

  const activeChannel = active && !active.startsWith("cat:") ? byId.get(active) : undefined;
  const activeCat = active?.startsWith("cat:") ? catById.get(active.slice(4)) : undefined;

  const body = (
    <>
      <ChannelList id={LOOSE} ids={order[LOOSE] ?? []} byId={byId} renderRow={renderRow} canManage={canManage} dragging={!!activeChannel} />
      <SortableContext items={catOrder.map((id) => `cat:${id}`)} strategy={verticalListSortingStrategy}>
        {catOrder.map((catId) => {
          const cat = catById.get(catId);
          if (!cat) return null;
          const ids = order[catId] ?? [];
          if (!ids.length && !canManage) return null;
          return (
            <SortableCategory key={catId} cat={cat} canManage={canManage} open={!closed.has(catId)} onOpenChange={(o) => setOpen(catId, o)} action={categoryAction(cat)}>
              <ChannelList id={catId} ids={ids} byId={byId} renderRow={renderRow} canManage={canManage} dragging={!!activeChannel} />
            </SortableCategory>
          );
        })}
      </SortableContext>
      {canManage &&
        (newCat === null ? (
          <button type="button" className={styles.addChannelRow} onClick={() => setNewCat("")}>
            <Icon name="plus" size={18} />
            Nova categoria
          </button>
        ) : (
          <form
            className={styles.newCategory}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newCat.trim()) return setNewCat(null);
              const r = await createCategoryAction(spaceId, newCat);
              if (r.error) toast.error(r.error);
              else toast.success("Categoria criada");
              setNewCat(null);
            }}
          >
            <input autoFocus value={newCat} maxLength={40} placeholder="Nome da categoria" aria-label="Nome da nova categoria" onChange={(e) => setNewCat(e.target.value)} onBlur={() => !newCat.trim() && setNewCat(null)} onKeyDown={(e) => e.key === "Escape" && setNewCat(null)} />
          </form>
        ))}
    </>
  );

  if (!canManage) return body;
  return (
    <DndContext id={`dnd-${spaceId}`} sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={(e) => void onDragEnd(e)} onDragCancel={() => setActive(null)}>
      {body}
      <DragOverlay dropAnimation={null}>
        {activeChannel ? <div className={styles.dragGhost}>{renderRow(activeChannel)}</div> : activeCat ? <div className={styles.dragGhost}>{activeCat.name.toUpperCase()}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableCategory({ cat, canManage, open, onOpenChange, action, children }: { cat: Category; canManage: boolean; open: boolean; onOpenChange: (o: boolean) => void; action: ReactNode; children: ReactNode }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: `cat:${cat.id}`, disabled: !canManage });
  return (
    <ChannelCategory
      rootRef={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : undefined }}
      name={cat.name}
      open={open}
      onOpenChange={onOpenChange}
      action={action}
      barProps={canManage ? { ...attributes, ...listeners, role: undefined, tabIndex: undefined } : undefined}
    >
      {children}
    </ChannelCategory>
  );
}

function ChannelList({ id, ids, byId, renderRow, canManage, dragging }: { id: string; ids: string[]; byId: Map<string, Channel>; renderRow: (c: Channel) => ReactNode; canManage: boolean; dragging: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `cont:${id}`, disabled: !canManage });
  if (!canManage) return <div>{ids.map((cid) => byId.get(cid) && renderRow(byId.get(cid)!))}</div>;
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={`${styles.dropList} ${dragging && !ids.length ? styles.dropEmpty : ""} ${isOver ? styles.dropOver : ""}`}>
        {ids.map((cid) => {
          const c = byId.get(cid);
          return c ? (
            <SortableRow key={cid} id={cid}>
              {renderRow(c)}
            </SortableRow>
          ) : null;
        })}
        {dragging && !ids.length && <span className={styles.dropHint}>Solte aqui</span>}
      </div>
    </SortableContext>
  );
}

function SortableRow({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : undefined }} {...attributes} {...listeners} tabIndex={-1}>
      {children}
    </div>
  );
}
