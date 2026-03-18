"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface Option {
  id: string;
  name: string;
  price_delta: number;
  position: number;
}

interface OptionGroup {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  position: number;
  item_options: Option[];
}

interface Props {
  itemId: string;
}

export default function VariantsEditor({ itemId }: Props) {
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);

  const supabase = createClient();

  async function loadGroups() {
    try {
      const { data } = await supabase
        .from("item_option_groups")
        .select("*, item_options(*)")
        .eq("item_id", itemId)
        .order("position");
      if (data) setGroups(data as OptionGroup[]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGroups(); }, [itemId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setAddingGroup(true);
    try {
      const { data } = await supabase
        .from("item_option_groups")
        .insert({ item_id: itemId, name: newGroupName.trim(), position: groups.length })
        .select("*, item_options(*)")
        .single();
      if (data) setGroups((prev) => [...prev, data as OptionGroup]);
      setNewGroupName("");
    } finally {
      setAddingGroup(false);
    }
  }

  async function deleteGroup(groupId: string) {
    if (!confirm("Supprimer ce groupe d'options ?")) return;
    await supabase.from("item_option_groups").delete().eq("id", groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }

  async function toggleGroupProp(groupId: string, prop: "required" | "multiple", value: boolean) {
    await supabase.from("item_option_groups").update({ [prop]: value }).eq("id", groupId);
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, [prop]: value } : g));
  }

  async function addOption(groupId: string, name: string, priceDelta: number) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const { data } = await supabase
      .from("item_options")
      .insert({ group_id: groupId, name, price_delta: priceDelta, position: group.item_options.length })
      .select()
      .single();
    if (data) {
      setGroups((prev) => prev.map((g) =>
        g.id === groupId ? { ...g, item_options: [...g.item_options, data as Option] } : g
      ));
    }
  }

  async function deleteOption(groupId: string, optionId: string) {
    await supabase.from("item_options").delete().eq("id", optionId);
    setGroups((prev) => prev.map((g) =>
      g.id === groupId ? { ...g, item_options: g.item_options.filter((o) => o.id !== optionId) } : g
    ));
  }

  if (loading) return <p className="text-xs text-slate-400 py-2">Chargement des variantes…</p>;

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100 mt-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Variantes & options</p>

      {groups.map((group) => (
        <GroupEditor
          key={group.id}
          group={group}
          onDelete={() => deleteGroup(group.id)}
          onToggle={(prop, val) => toggleGroupProp(group.id, prop, val)}
          onAddOption={(name, delta) => addOption(group.id, name, delta)}
          onDeleteOption={(optId) => deleteOption(group.id, optId)}
        />
      ))}

      <form onSubmit={addGroup} className="flex gap-2">
        <input
          type="text"
          placeholder="Nouveau groupe (ex: Taille, Cuisson…)"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="flex-1 border border-dashed border-slate-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30"
        />
        <button
          type="submit"
          disabled={addingGroup || !newGroupName.trim()}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
        >
          + Groupe
        </button>
      </form>
    </div>
  );
}

function GroupEditor({
  group,
  onDelete,
  onToggle,
  onAddOption,
  onDeleteOption,
}: {
  group: OptionGroup;
  onDelete: () => void;
  onToggle: (prop: "required" | "multiple", val: boolean) => void;
  onAddOption: (name: string, delta: number) => void;
  onDeleteOption: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newDelta, setNewDelta] = useState("0");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddOption(newName.trim(), parseFloat(newDelta) || 0);
    setNewName("");
    setNewDelta("0");
  }

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700">{group.name}</p>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={group.required}
              onChange={(e) => onToggle("required", e.target.checked)}
              className="rounded"
            />
            Obligatoire
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={group.multiple}
              onChange={(e) => onToggle("multiple", e.target.checked)}
              className="rounded"
            />
            Multiple
          </label>
          <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {group.item_options.sort((a, b) => a.position - b.position).map((opt) => (
          <div key={opt.id} className="flex items-center gap-2 text-xs">
            <span className="flex-1 text-slate-700">{opt.name}</span>
            <span className={`font-medium ${opt.price_delta > 0 ? "text-teal-600" : opt.price_delta < 0 ? "text-red-500" : "text-slate-400"}`}>
              {opt.price_delta > 0 ? "+" : ""}{opt.price_delta !== 0 ? `${Number(opt.price_delta).toFixed(2)} €` : "inclus"}
            </span>
            <button onClick={() => onDeleteOption(opt.id)} className="text-slate-300 hover:text-red-400 transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-1.5 pt-1">
        <input
          type="text"
          placeholder="Option (ex: Grand)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-400"
        />
        <input
          type="number"
          step="0.50"
          placeholder="±€"
          value={newDelta}
          onChange={(e) => setNewDelta(e.target.value)}
          className="w-16 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-400"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="text-xs bg-teal-500 hover:bg-teal-600 text-white px-2 py-1 rounded transition-colors disabled:opacity-40"
        >
          +
        </button>
      </form>
    </div>
  );
}
