'use client';

// Task Manager Component with Todo List functionality
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Clock, 
  Target,
  CheckCircle2,
  Circle
} from 'lucide-react';
import type { TaskManagerProps, Task } from '../types';

// Individual Task Item Component
interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string, newTitle: string) => void;
  onUpdatePomodoros: (taskId: string, count: number) => void;
}

function TaskItem({ 
  task, 
  isSelected, 
  onSelect, 
  onComplete, 
  onDelete, 
  onEdit, 
  onUpdatePomodoros 
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.text);

  const handleEdit = () => {
    if (editTitle.trim()) {
      onEdit(task.id, editTitle.trim());
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(task.text);
      setIsEditing(false);
    }
  };

  return (
    <div 
      className={`p-4 border rounded-lg transition-all duration-200 ${
        isSelected 
          ? 'border-primary bg-accent shadow-md' 
          : 'border-border hover:border-muted-foreground hover:shadow-sm'
      } ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion Checkbox */}
        <button
          onClick={() => onComplete(task.id)}
          className={`mt-1 transition-colors ${
            task.completed ? 'text-primary' : 'text-muted-foreground hover:text-primary'
          }`}
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Task Title */}
          {isEditing ? (
            <div className="flex gap-2 mb-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                className="text-sm"
                autoFocus
              />
              <Button
                onClick={handleEdit}
                size="sm"
                variant="outline"
                className="px-2"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => {
                  setEditTitle(task.text);
                  setIsEditing(false);
                }}
                size="sm"
                variant="outline"
                className="px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <h4 
              className={`font-medium mb-2 cursor-pointer ${
                task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}
              onClick={() => !task.completed && onSelect(task.id)}
            >
              {task.text}
            </h4>
          )}

          {/* Task Metadata */}
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={isSelected ? 'default' : 'outline'} 
              className="text-xs"
            >
              {task.estimatedPomodoros} estimated
            </Badge>
            <Badge 
              variant={task.completedPomodoros > 0 ? 'secondary' : 'outline'} 
              className="text-xs"
            >
              {task.completedPomodoros} completed
            </Badge>
            {isSelected && (
              <Badge className="text-xs bg-primary">
                Current
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                task.completed ? 'bg-primary' : 'bg-secondary'
              }`}
              style={{ 
                width: `${Math.min((task.completedPomodoros / task.estimatedPomodoros) * 100, 100)}%` 
              }}
            />
          </div>

          {/* Pomodoro Counter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{task.completedPomodoros} / {task.estimatedPomodoros}</span>
            </div>
            
            {/* Quick Pomodoro Buttons */}
            {!task.completed && (
              <div className="flex gap-1">
                <Button
                  onClick={() => onUpdatePomodoros(task.id, task.completedPomodoros + 1)}
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 text-xs"
                >
                  +
                </Button>
                {task.completedPomodoros > 0 && (
                  <Button
                    onClick={() => onUpdatePomodoros(task.id, task.completedPomodoros - 1)}
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0 text-xs"
                  >
                    -
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1">
          {!task.completed && (
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={() => onDelete(task.id)}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Add Task Form Component
interface AddTaskFormProps {
  onAdd: (title: string, estimatedPomodoros: number) => void;
}

function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), estimatedPomodoros);
      setTitle('');
      setEstimatedPomodoros(1);
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        variant="outline"
        className="w-full border-dashed border-2 border-muted hover:border-muted-foreground text-muted-foreground"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Task
      </Button>
    );
  }

  return (
    <Card className="p-4 border-2 border-accent">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Enter task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Estimated pomodoros:</label>
          <Input
            type="number"
            min="1"
            max="20"
            value={estimatedPomodoros}
            onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
        
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={!title.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button 
            type="button" 
            onClick={() => {
              setIsExpanded(false);
              setTitle('');
              setEstimatedPomodoros(1);
            }}
            size="sm" 
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

// Main Task Manager Component
export default function TaskManager({
  tasks,
  selectedTaskId,
  onTaskSelect,
  onTaskAdd,
  onTaskComplete,
  onTaskDelete,
  onTaskEdit,
  onTaskUpdatePomodoros
}: TaskManagerProps) {
  // Filter tasks
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  // Calculate statistics
  const totalPomodoros = tasks.reduce((sum: number, task: Task) => sum + task.completedPomodoros, 0);
  const totalEstimated = activeTasks.reduce((sum: number, task: Task) => sum + task.estimatedPomodoros, 0);
  const totalCompleted = activeTasks.reduce((sum: number, task: Task) => sum + task.completedPomodoros, 0);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Task Manager</h3>
        </div>
        <Badge variant="outline">
          {activeTasks.length} active
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-accent rounded-lg">
          <div className="text-2xl font-bold text-accent-foreground">{totalPomodoros}</div>
          <div className="text-xs text-muted-foreground">Total Pomodoros</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">{completedTasks.length}</div>
          <div className="text-xs text-muted-foreground">Completed Tasks</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <div className="text-2xl font-bold text-secondary-foreground">{activeTasks.length}</div>
          <div className="text-xs text-muted-foreground">Active Tasks</div>
        </div>
      </div>

      {/* Progress Overview */}
      {activeTasks.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Overall Progress</span>
            <span>{totalCompleted} / {totalEstimated} pomodoros</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalEstimated > 0 ? (totalCompleted / totalEstimated) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Task Form */}
      <div className="mb-6">
        <AddTaskForm onAdd={onTaskAdd} />
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-foreground mb-3">Active Tasks</h4>
          <div className="space-y-3">
            {activeTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                isSelected={task.id === selectedTaskId}
                onSelect={onTaskSelect}
                onComplete={onTaskComplete}
                onDelete={onTaskDelete}
                onEdit={onTaskEdit || ((taskId: string, newTitle: string) => {})}
                onUpdatePomodoros={onTaskUpdatePomodoros || ((taskId: string, count: number) => {})}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Completed Tasks ({completedTasks.length})
          </h4>
          <div className="space-y-2">
            {completedTasks.slice(0, 3).map(task => (
              <TaskItem
                key={task.id}
                task={task}
                isSelected={false}
                onSelect={() => {}}
                onComplete={onTaskComplete}
                onDelete={onTaskDelete}
                onEdit={onTaskEdit || ((taskId: string, newTitle: string) => {})}
                onUpdatePomodoros={onTaskUpdatePomodoros || ((taskId: string, count: number) => {})}
              />
            ))}
            {completedTasks.length > 3 && (
              <div className="text-center py-2">
                <Badge variant="outline" className="text-xs">
                  +{completedTasks.length - 3} more completed
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-lg font-medium mb-2">No tasks yet</p>
          <p className="text-sm">Add your first task to get started with focused work sessions!</p>
        </div>
      )}
    </Card>
  );
}