let tasks = [];
let touchStartY = 0;
let touchStartIndex = -1;
let isDragging = false;

const taskList = document.getElementById('taskList');
const taskInput = document.getElementById('taskInput');
const toggleBtn = document.getElementById('toggleTheme');
const header = document.querySelector('.header');

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  updateToggleButton(true);
} else {
  updateToggleButton(false);
}

// Load saved tasks
const storedTasks = localStorage.getItem('tasks');
if (storedTasks) {
  tasks = JSON.parse(storedTasks);
  renderTasks();
}

function updateToggleButton(isDark) {
  const emoji = toggleBtn.querySelector('.emoji');
  const text = toggleBtn.querySelector('.text');
  
  if (isDark) {
    emoji.textContent = '🌞';
    text.textContent = 'Toggle to Light Mode';
  } else {
    emoji.textContent = '🌙';
    text.textContent = 'Toggle to Dark Mode';
  }
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = task.done ? 'done' : '';

    const bulletPoint = document.createElement('span');
    bulletPoint.className = 'bullet-point';
    bulletPoint.textContent = '•'; // Bullet point character
    bulletPoint.draggable = true; // Make it draggable for desktop
    
    // Desktop drag and drop
    bulletPoint.ondragstart = (event) => {
      event.dataTransfer.setData('text/plain', index);
      li.classList.add('dragging');
    };
    bulletPoint.ondragend = () => {
      li.classList.remove('dragging');
    };
    li.ondragover = (event) => {
      event.preventDefault();
      li.classList.add('drag-over');
    };
    li.ondragleave = () => {
      li.classList.remove('drag-over');
    };
    li.ondrop = (event) => {
      event.preventDefault();
      const draggedIndex = parseInt(event.dataTransfer.getData('text/plain'));
      const newIndex = index;
      
      if (draggedIndex !== newIndex) {
        const temp = tasks[draggedIndex];
        tasks.splice(draggedIndex, 1);
        tasks.splice(newIndex, 0, temp);
        saveTasks();
        renderTasks();
      }
      li.classList.remove('drag-over');
    };
    
    // Touch events for mobile devices
    bulletPoint.addEventListener('touchstart', function(event) {
      event.preventDefault();
      event.stopPropagation();
      touchStartY = event.touches[0].clientY;
      touchStartIndex = index;
      isDragging = true;
      li.classList.add('dragging');
      console.log('Touch start:', index, touchStartY);
    }, { passive: false });
    
    bulletPoint.addEventListener('touchmove', function(event) {
      if (!isDragging) return;
      event.preventDefault();
      event.stopPropagation();
      
      const touchY = event.touches[0].clientY;
      
      // Find the target element based on touch position
      const touchElement = document.elementFromPoint(event.touches[0].clientX, touchY);
      const targetLi = touchElement ? touchElement.closest('li') : null;
      
      // Remove drag-over from all elements
      document.querySelectorAll('li').forEach(item => item.classList.remove('drag-over'));
      
      if (targetLi && targetLi !== li) {
        targetLi.classList.add('drag-over');
      }
    }, { passive: false });
    
    bulletPoint.addEventListener('touchend', function(event) {
      if (!isDragging) return;
      event.preventDefault();
      event.stopPropagation();
      
      const touchY = event.changedTouches[0].clientY;
      const touchElement = document.elementFromPoint(event.changedTouches[0].clientX, touchY);
      const targetLi = touchElement ? touchElement.closest('li') : null;
      
      console.log('Touch end:', touchStartIndex, targetLi ? Array.from(taskList.children).indexOf(targetLi) : 'no target');
      
      // Remove all drag classes
      document.querySelectorAll('li').forEach(item => {
        item.classList.remove('dragging', 'drag-over');
      });
      
      if (targetLi && targetLi !== li) {
        // Find the target index
        const targetIndex = Array.from(taskList.children).indexOf(targetLi);
        if (targetIndex !== -1 && touchStartIndex !== targetIndex) {
          console.log('Moving task from', touchStartIndex, 'to', targetIndex);
          const temp = tasks[touchStartIndex];
          tasks.splice(touchStartIndex, 1);
          tasks.splice(targetIndex, 0, temp);
          saveTasks();
          renderTasks();
        }
      }
      
      isDragging = false;
      touchStartIndex = -1;
    }, { passive: false });
    
    bulletPoint.addEventListener('touchcancel', function(event) {
      if (!isDragging) return;
      event.preventDefault();
      event.stopPropagation();
      
      console.log('Touch cancelled');
      
      // Remove all drag classes
      document.querySelectorAll('li').forEach(item => {
        item.classList.remove('dragging', 'drag-over');
      });
      
      isDragging = false;
      touchStartIndex = -1;
    }, { passive: false });
    
    const span = document.createElement('span');
    span.className = 'task-text';
    span.innerText = task.text;
    span.onclick = () => toggleDone(index);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.innerText = 'Edit';
    editBtn.onclick = () => editTask(index);

    const delBtn = document.createElement('button');
    delBtn.innerText = 'Delete';
    delBtn.onclick = () => deleteTask(index);

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    li.appendChild(bulletPoint);
    li.appendChild(span);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (text) {
    tasks.push({ text, done: false });
    taskInput.value = '';
    saveTasks();
    renderTasks();
  }
}

function batchAddTasks() {
  const baseText = taskInput.value.trim();
  if (!baseText) {
    alert('Please enter a task name first!');
    return;
  }

  const count = prompt('How many tasks do you want to add?');
  if (count === null || count === '') return;

  const numTasks = parseInt(count);
  if (isNaN(numTasks) || numTasks <= 0 || numTasks > 100) {
    alert('Please enter a valid number between 1 and 100!');
    return;
  }

  // Find the numeric suffix in the base text
  const match = baseText.match(/(.*?)(\d+)$/);
  let prefix, startNumber;

  if (match) {
    // If there's a number at the end, use it as the starting number
    prefix = match[1];
    startNumber = parseInt(match[2]);
  } else {
    // If no number at the end, start from 1
    prefix = baseText;
    startNumber = 1;
  }

  // Create batch tasks
  for (let i = 0; i < numTasks; i++) {
    const taskNumber = startNumber + i;
    const taskText = `${prefix}${taskNumber}`;
    tasks.push({ text: taskText, done: false });
  }

  taskInput.value = '';
  saveTasks();
  renderTasks();
}

function toggleDone(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
  renderTasks();
}

function editTask(index) {
  const newText = prompt('Edit task:', tasks[index].text);
  if (newText !== null && newText.trim() !== '') {
    tasks[index].text = newText.trim();
    saveTasks();
    renderTasks();
  }
}

function deleteTask(index) {
  if (confirm('Delete this task?')) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
}

function killAllTasks() {
  if (confirm('Are you sure you want to delete all tasks?')) {
    tasks = [];
    saveTasks();
    renderTasks();
  }
}

toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  updateToggleButton(isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
