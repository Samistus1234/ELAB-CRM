import React, { useState, useEffect } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

type FilterType = 'all' | 'active' | 'completed';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    // Request notification permission on load
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  useEffect(() => {
    // Check for due todos every minute
    const interval = setInterval(() => {
      checkForDueTodos();
    }, 60000);

    return () => clearInterval(interval);
  }, [todos]);

  const checkForDueTodos = () => {
    if (notificationPermission !== 'granted') return;

    const now = new Date();

    todos.forEach(todo => {
      if (!todo.completed && todo.dueDate) {
        const dueDate = new Date(todo.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const minutesUntilDue = Math.floor(timeDiff / (1000 * 60));

        // Notify if due in 30 minutes (with 1 minute tolerance)
        if (minutesUntilDue <= 30 && minutesUntilDue >= 29) {
          new Notification('Todo Due Soon!', {
            body: `"${todo.text}" is due in 30 minutes`,
            icon: '/todo.svg',
            tag: `todo-${todo.id}` // Prevent duplicate notifications
          });
        }
      }
    });
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      const newTodoItem: Todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        dueDate: newDueDate || undefined,
        createdAt: new Date().toISOString()
      };
      setTodos([...todos, newTodoItem]);
      setNewTodo('');
      setNewDueDate('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  }).sort((a, b) => {
    // Sort by due date first (if exists), then by created date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const timeDiff = date.getTime() - now.getTime();
    const hoursUntilDue = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesUntilDue = Math.floor(timeDiff / (1000 * 60));

    if (timeDiff < 0) return 'Overdue';
    if (minutesUntilDue < 60) return `${minutesUntilDue}m left`;
    if (hoursUntilDue < 24) return `${hoursUntilDue}h left`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getDueDateClass = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - now.getTime();
    const hoursUntilDue = timeDiff / (1000 * 60 * 60);

    if (timeDiff < 0) return 'overdue';
    if (hoursUntilDue <= 1) return 'due-soon';
    if (hoursUntilDue <= 24) return 'due-today';
    return 'due-later';
  };

  return (
    <div className="container">
      <div className="header">
        <h1>✨ Todo List</h1>
        <p className="subtitle">Stay organized, stay productive</p>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      <form onSubmit={addTodo} className="todo-input">
        <div className="input-group">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="todo-text-input"
          />
          <input
            type="datetime-local"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="due-date-input"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
        <button type="submit" className="add-btn">
          <span>+</span>
        </button>
      </form>

      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <li
            key={todo.id}
            className={`todo-item ${todo.completed ? 'completed' : ''} ${todo.dueDate ? getDueDateClass(todo.dueDate) : ''}`}
          >
            <div className="todo-checkbox">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                id={`todo-${todo.id}`}
              />
              <label htmlFor={`todo-${todo.id}`} className="checkmark"></label>
            </div>
            <div className="todo-content">
              <span className="todo-text">{todo.text}</span>
              {todo.dueDate && (
                <span className={`due-date ${getDueDateClass(todo.dueDate)}`}>
                  📅 {formatDueDate(todo.dueDate)}
                </span>
              )}
            </div>
            <button
              className="delete-btn"
              onClick={() => deleteTodo(todo.id)}
              title="Delete todo"
            >
              🗑️
            </button>
          </li>
        ))}
        {filteredTodos.length === 0 && (
          <li className="empty-state">
            <span>No todos {filter !== 'all' ? `in ${filter}` : ''}. Add one above! 🎯</span>
          </li>
        )}
      </ul>
    </div>
  );
};

export default App;