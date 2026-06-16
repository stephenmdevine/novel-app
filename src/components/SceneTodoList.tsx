import { useState } from 'react';
import type { TodoItem } from '../types';
import './SceneTodoList.css';

interface SceneTodoListProps {
  todos: TodoItem[];
  onChange: (todos: TodoItem[]) => void;
  onJumpToMarker: (markerId: string) => void;
}

export default function SceneTodoList({ todos, onChange, onJumpToMarker }: SceneTodoListProps) {
  const [newLabel, setNewLabel] = useState('');

  const addTodo = () => {
    if (!newLabel.trim()) return;
    const todo: TodoItem = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      done: false,
    };
    onChange([...todos, todo]);
    setNewLabel('');
  };

  const toggleDone = (id: string) => {
    onChange(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTodo = (id: string) => {
    onChange(todos.filter((t) => t.id !== id));
  };

  const pendingCount = todos.filter((t) => !t.done).length;

  return (
    <div className="todo-list">
      <div className="todo-header">
        <h3>Scene To-Do</h3>
        {pendingCount > 0 && <span className="todo-badge">{pendingCount}</span>}
      </div>

      {todos.length === 0 && (
        <div className="todo-empty">No to-dos yet. Add one below or mark text as "Must Edit" in the editor.</div>
      )}

      {todos.map((todo) => (
        <div key={todo.id} className={`todo-item ${todo.done ? 'done' : ''}`}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => toggleDone(todo.id)}
            className="todo-checkbox"
          />
          <span
            className="todo-label"
            onClick={() => {
              if (todo.mustEditMarkerId) onJumpToMarker(todo.mustEditMarkerId);
            }}
            title={todo.mustEditMarkerId ? 'Click to jump to marked text' : undefined}
          >
            {todo.mustEditMarkerId && <span className="todo-marker-icon">✎ </span>}
            {todo.label}
          </span>
          <button className="todo-delete" onClick={() => deleteTodo(todo.id)}>&times;</button>
        </div>
      ))}

      <div className="todo-add">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addTodo(); }}
          placeholder="Add a to-do..."
          className="todo-input"
        />
        <button onClick={addTodo} className="todo-add-btn">+</button>
      </div>
    </div>
  );
}
