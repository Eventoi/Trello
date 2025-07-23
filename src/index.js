import './styles.css';

const columnTitles = ['To Do', 'In Progress', 'Done'];
const columnIds = ['todo', 'inprogress', 'done'];

let state = loadState();

function loadState() {
  const saved = localStorage.getItem('trello-state');
  if (saved) return JSON.parse(saved);
  return {
    todo: [],
    inprogress: [],
    done: [],
  };
}

function saveState() {
  localStorage.setItem('trello-state', JSON.stringify(state));
}

function createCard(content, columnId, index) {
  const card = document.createElement('div');
  card.className = 'card';
  card.textContent = content;
  card.draggable = true;

  const deleteBtn = document.createElement('span');
  deleteBtn.className = 'delete-card';
  deleteBtn.innerHTML = '&times;';
  deleteBtn.onclick = () => {
    state[columnId].splice(index, 1);
    saveState();
    render();
  };

  card.appendChild(deleteBtn);

  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ columnId, index }));
    e.target.classList.add('grabbing');
  });
  card.addEventListener('dragend', (e) => {
    e.target.classList.remove('grabbing');
  });

  return card;
}

function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  columnIds.forEach((colId, colIndex) => {
    const column = document.createElement('div');
    column.className = 'column';
    column.dataset.column = colId;

    const title = document.createElement('div');
    title.className = 'column-title';
    title.textContent = columnTitles[colIndex];

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards';
    cardsContainer.addEventListener('dragover', (e) => e.preventDefault());
    cardsContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const draggedCard = state[data.columnId][data.index];

      state[data.columnId].splice(data.index, 1);
      state[colId].push(draggedCard);
      saveState();
      render();
    });

    state[colId].forEach((text, idx) => {
      const card = createCard(text, colId, idx);
      cardsContainer.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'add-card';
    addBtn.textContent = 'Add another card';
    addBtn.onclick = () => {
      const text = prompt('Enter card text');
      if (text) {
        state[colId].push(text);
        saveState();
        render();
      }
    };

    column.appendChild(title);
    column.appendChild(cardsContainer);
    column.appendChild(addBtn);
    board.appendChild(column);
  });
}

render();
