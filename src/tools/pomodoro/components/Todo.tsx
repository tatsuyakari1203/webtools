'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, RotateCcw, Clock } from 'lucide-react';
import { Task, TodoProps } from '../types';

const Todo: React.FC<TodoProps> = ({
  tasks,
  currentTask,
  onTaskAdd,
  onTaskSelect,
  onTaskComplete,
  onTaskDelete
}) => {
  const handleResumeTask = (taskId: string) => {
    // Resume completed task by marking it as incomplete
    const task = tasks.find((t: Task) => t.id === taskId);
    if (task && task.completed) {
      onTaskComplete(taskId); // This will toggle the completion status
    }
  };
  const [newTaskText, setNewTaskText] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      onTaskAdd(newTaskText.trim(), estimatedPomodoros);
      setNewTaskText('');
      setEstimatedPomodoros(1);
    }
  };

  const activeTasks = tasks.filter((task: Task) => !task.completed);
  const completedTasks = tasks.filter((task: Task) => task.completed);

  return (
    <Card className="p-4 w-full">
      <h3 className="font-semibold mb-4">Todo List</h3>
      
      {/* Add Task Form */}
      <div className="space-y-3 mb-6 p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-muted-foreground">Add New Task</h4>
        </div>
        
        <div className="space-y-3">
          <div>
            <Input
              placeholder="What do you want to work on?"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              className="text-sm"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <label className="text-xs text-muted-foreground font-medium">Estimated Pomodoros:</label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="10"
                value={estimatedPomodoros}
                onChange={(e) => setEstimatedPomodoros(Number(e.target.value))}
                className="w-16 h-8 text-xs"
              />
              <Button 
                onClick={handleAddTask} 
                size="sm" 
                disabled={!newTaskText.trim()}
                className="has-[>svg]:px-2.5"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-medium text-muted-foreground">Active</h4>
          {activeTasks.map((task: Task) => (
            <div
              key={task.id}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer ${
                currentTask === task.id 
                  ? 'bg-primary/10 border-primary/20 shadow-sm' 
                  : 'hover:bg-muted/50 border-border'
              }`}
              onClick={() => onTaskSelect(task.id)}
            >
              <Checkbox
                checked={false}
                onCheckedChange={() => onTaskComplete(task.id)}
              />
              <span className="flex-1 text-sm font-medium">{task.text}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {task.pomodorosSpent}/{task.estimatedPomodoros} 🍅
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskDelete(task.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Completed</h4>
          {completedTasks.map((task: Task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30"
            >
              <Checkbox checked={true} disabled />
              <span className="flex-1 text-sm line-through text-muted-foreground">{task.text}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {task.completedPomodoros} 🍅
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                onClick={() => handleResumeTask(task.id)}
                title="Resume task"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onTaskDelete(task.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No tasks yet. Add one above!</p>
        </div>
      )}
    </Card>
  );
};

export default Todo;