
class DayPlanner {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('dayPlannerTasks')) || [];
        this.taskIdCounter = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
        
        this.taskInput = document.getElementById('taskInput');
        this.scheduledTime = document.getElementById('scheduledTime');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.taskCounter = document.getElementById('taskCounter');
        this.emptyState = document.getElementById('emptyState');
        
        this.init();
    }
    
    init() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        this.renderTasks();
        this.updateCounters();
    }
    
    addTask() {
        const taskText = this.taskInput.value.trim();
        if (taskText === '') return;
        
        const scheduledTime = this.scheduledTime.value;
        
        const newTask = {
            id: this.taskIdCounter++,
            text: taskText,
            completed: false,
            scheduledTime: scheduledTime,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTasks();
        this.updateCounters();
        this.taskInput.value = '';
        this.scheduledTime.value = '';
        this.taskInput.focus();
    }
    
    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateCounters();
    }
    
    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateCounters();
        }
    }
    
    editTask(id, newText) {
        const task = this.tasks.find(t => t.id === id);
        if (task && newText.trim() !== '') {
            task.text = newText.trim();
            this.saveTasks();
            this.renderTasks();
        }
    }
    
    formatTime(timeString) {
        if (!timeString) return 'No time set';
        
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        
        return `${displayHour}:${minutes} ${ampm}`;
    }
    
    renderTasks() {
        this.taskList.innerHTML = '';
        
        if (this.tasks.length === 0) {
            this.emptyState.style.display = 'block';
            return;
        }
        
        this.emptyState.style.display = 'none';
        
        // Sort tasks by scheduled time
        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (!a.scheduledTime && !b.scheduledTime) return 0;
            if (!a.scheduledTime) return 1;
            if (!b.scheduledTime) return -1;
            return a.scheduledTime.localeCompare(b.scheduledTime);
        });
        
        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.taskList.appendChild(taskElement);
        });
    }
    
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-task-id', task.id);
        
        const scheduledTimeText = this.formatTime(task.scheduledTime);
        
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                ${task.completed ? '✓' : ''}
            </div>
            <div class="task-content">
                <input type="text" class="task-text ${task.completed ? 'completed' : ''}" 
                       value="${task.text}" data-id="${task.id}" data-original="${task.text}">
                <div class="task-timing">
                    <div class="scheduled-time">
                        <span>🕐 ${scheduledTimeText}</span>
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn" data-id="${task.id}" title="Edit">
                    ✏️
                </button>
                <button class="action-btn delete-btn" data-id="${task.id}" title="Delete">
                    🗑️
                </button>
            </div>
        `;
        
        // Add event listeners
        const checkbox = li.querySelector('.task-checkbox');
        const textInput = li.querySelector('.task-text');
        const editBtn = li.querySelector('.edit-btn');
        const deleteBtn = li.querySelector('.delete-btn');
        
        checkbox.addEventListener('click', () => this.toggleComplete(task.id));
        
        textInput.addEventListener('blur', (e) => {
            this.editTask(task.id, e.target.value);
        });
        
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.target.blur();
            }
            if (e.key === 'Escape') {
                e.target.value = e.target.dataset.original;
                e.target.blur();
            }
        });
        
        editBtn.addEventListener('click', () => {
            textInput.focus();
            textInput.select();
        });
        
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this task?')) {
                this.deleteTask(task.id);
            }
        });
        
        return li;
    }
    
    updateCounters() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        
        if (total === 0) {
            this.taskCounter.textContent = '0 tasks';
        } else {
            this.taskCounter.textContent = `${completed}/${total} completed`;
        }
    }
    
    saveTasks() {
        localStorage.setItem('dayPlannerTasks', JSON.stringify(this.tasks));
    }
}

// Initialize the day planner when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DayPlanner();
});
