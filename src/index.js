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

let dragged = null;
let draggedFrom = null;
let placeholder = null;
let offsetX = 0;
let offsetY = 0;

function createCard(content, columnId, index) {
  const card = document.createElement('div');
  card.className = 'card';
  card.textContent = content;

  const deleteBtn = document.createElement('span');
  deleteBtn.className = 'delete-card';
  deleteBtn.innerHTML = '&times;';

  // Предотвращение всплытия события клика, чтобы не запускался drag
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    state[columnId].splice(index, 1);
    saveState();
    render();
  });

  card.appendChild(deleteBtn);

  card.addEventListener('mousedown', (e) => {
    e.preventDefault();

    // Если клик был по крестику — не начинаем drag (доп. защита)
    if (e.target === deleteBtn) return;

    draggedFrom = { columnId, index };

    dragged = card.cloneNode(true);
    dragged.classList.add('grabbing');
    dragged.style.position = 'absolute';
    dragged.style.zIndex = '1000';
    dragged.style.width = `${card.offsetWidth}px`;
    dragged.style.pointerEvents = 'none';

    const rect = card.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    moveAt(e.pageX, e.pageY);
    document.body.appendChild(dragged);

    placeholder = document.createElement('div');
    placeholder.className = 'card placeholder';
    placeholder.style.height = `${card.offsetHeight}px`;

    card.style.opacity = '0.3';

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  return card;
}

function moveAt(pageX, pageY) {
  if (!dragged) return;
  dragged.style.left = pageX - offsetX + 'px';
  dragged.style.top = pageY - offsetY + 'px';
}

function onMouseMove(e) {
  moveAt(e.pageX, e.pageY);

  const elemUnder = document.elementFromPoint(e.clientX, e.clientY);
  if (!elemUnder) return;

  const cardsContainer = elemUnder.closest('.cards');
  if (!cardsContainer) return;

  const cardUnder = elemUnder.closest('.card:not(.placeholder)');

  if (cardUnder && cardsContainer.contains(cardUnder)) {
    const rect = cardUnder.getBoundingClientRect();
    const middleY = rect.top + rect.height / 2;

    if (e.clientY < middleY) {
      cardsContainer.insertBefore(placeholder, cardUnder);
    } else {
      cardsContainer.insertBefore(placeholder, cardUnder.nextSibling);
    }
  } else {
    if (!cardsContainer.contains(placeholder)) {
      cardsContainer.appendChild(placeholder);
    }
  }
}

function onMouseUp() {
  if (!dragged) return;

  const placeholderParent = placeholder?.parentElement;
  if (!placeholderParent) {
    cleanupDrag();
    render();
    return;
  }

  const newColumnId = placeholderParent.dataset.columnId;
  const newIndex = Array.from(placeholderParent.children).indexOf(placeholder);

  const movedCardText = state[draggedFrom.columnId][draggedFrom.index];
  state[draggedFrom.columnId].splice(draggedFrom.index, 1);
  state[newColumnId].splice(newIndex, 0, movedCardText);

  saveState();
  cleanupDrag();
  render();
}

function cleanupDrag() {
  if (dragged) {
    dragged.remove();
    dragged = null;
  }
  if (placeholder) {
    placeholder.remove();
    placeholder = null;
  }

  // Прозрачность карточки
  const originalCard = document.querySelector(
    `.card[data-column-id="${draggedFrom?.columnId}"][data-index="${draggedFrom?.index}"]`
  );
  if (originalCard) originalCard.style.opacity = '1';

  draggedFrom = null;

  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
}

function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  columnIds.forEach((colId, colIndex) => {
    const column = document.createElement('div');
    column.className = 'column';
    column.dataset.columnId = colId;

    const title = document.createElement('div');
    title.className = 'column-title';
    title.textContent = columnTitles[colIndex];

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards';
    cardsContainer.dataset.columnId = colId;
    cardsContainer.addEventListener('mousedown', (e) => e.preventDefault());

    state[colId].forEach((text, idx) => {
      const card = createCard(text, colId, idx);
      card.dataset.columnId = colId;
      card.dataset.index = idx;
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
