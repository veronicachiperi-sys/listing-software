import React, { useState } from "react";
import { Icon, Pill, Card } from "./ui";
import { genId, ago, priorityColor } from "../utils";

export default function ActionsView({
  properties, actionItems, changeLog,
  onUpdateAction, onDeleteAction, onAddAction, onAddLog
}) {
  const [newTask, setNewTask] = useState("");
  const [newProp, setNewProp] = useState(properties[0]?.name || "");
  const [newPriority, setNewPriority] = useState("medium");

  const handleAdd = () => {
    if (!newTask.trim()) return;
    onAddAction({
      id: genId(),
      property: newProp,
      task: newTask,
      source: "manual",
      priority: newPriority,
      assignee: "",
      status: "open",
      created: new Date().toISOString(),
      completed: null,
    });
    onAddLog(`Added task: ${newTask} (${newProp})`);
    setNewTask("");
  };

  const open = actionItems.filter((a) => a.status === "open");
  const inProg = actionItems.filter((a) => a.status === "in_progress");
  const done = actionItems.filter((a) => a.status === "done");

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Action items</div>

      {/* Quick add */}
      <Card style={{ padding: "14px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={newProp}
            onChange={(e) => setNewProp(e.target.value)}
            style={{ fontSize: 13, width: 160 }}
          >
            <option value="">Property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{ flex: 1, fontSize: 13 }}
          />
          <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={{ fontSize: 13, width: 100 }}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button onClick={handleAdd} style={{ fontSize: 13, padding: "6px 14px", cursor: "pointer" }}>
            Add
          </button>
        </div>
      </Card>

      {/* Status pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Pill bg="#FCEBEB" text="#791F1F">{open.length} open</Pill>
        <Pill bg="#FAEEDA" text="#633806">{inProg.length} in progress</Pill>
        <Pill bg="#EAF3DE" text="#27500A">{done.length} done</Pill>
      </div>

      {/* Task list */}
      <Card>
        {actionItems.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>
            No action items yet. They'll be auto-generated when you run AI analysis, or add them manually above.
          </div>
        ) : (
          [...open, ...inProg, ...done].slice(0, 50).map((a) => {
            const pC = priorityColor(a.priority);
            return (
              <div
                key={a.id}
                style={{
                  padding: "12px 20px",
                  borderBottom: "0.5px solid var(--color-border-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  opacity: a.status === "done" ? 0.55 : 1,
                }}
              >
                <select
                  value={a.status}
                  onChange={(e) => onUpdateAction(a.id, { status: e.target.value })}
                  style={{ fontSize: 11, width: 95, padding: "3px 4px" }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    textDecoration: a.status === "done" ? "line-through" : "none",
                  }}>
                    {a.task}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                    {a.property} · {a.source} · {ago(a.created)}
                  </div>
                </div>
                <Pill bg={pC.bg} text={pC.text}>{a.priority}</Pill>
                <button
                  onClick={() => onDeleteAction(a.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: 4, color: "var(--color-text-tertiary)",
                  }}
                  aria-label="Delete task"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            );
          })
        )}
      </Card>

      {/* Change log */}
      {changeLog.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Change log</div>
          <Card style={{ padding: "16px 20px" }}>
            {changeLog.slice(0, 25).map((e) => (
              <div key={e.id} style={{
                display: "flex", gap: 12, marginBottom: 10, fontSize: 13, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", minWidth: 80, flexShrink: 0 }}>
                  {new Date(e.date).toLocaleDateString()}
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>{e.message}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
