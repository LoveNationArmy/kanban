
const columns = []

function createColumn (title) {
  const column = {
    title: title || 'untitled',
    cards: []
  }

  columns.push(column)

  return column
}

function createCard (content) {
  const parts = content.split('\n')

  const card = {
    title: parts[0],
    content: parts.slice(1).join('\n') || ''
  }

  return card
}

function renderToHTML () {
  let html = '<div class="kanban">'

  columns.forEach(column => {
    const cards = column.cards.map((card, index) => `
      <div id="${column.title.replace(/[^A-Za-z]/g, '')}_${index}" class="kanban-card" draggable="true" ondragstart="dragstart_handler(event);">
        <div class="kanban-card-title">${card.title}</div>
        <div class="kanban-card-content">${card.content}</div>
      </div>
    `)

    html += `
      <div class="kanban-column" ondrop="drop_handler(event);" ondragover="dragover_handler(event);">
        <div class="kanban-column-title">${column.title}</div>
        <div class="kanban-column-cards">${cards.join('\n')}</div>
      </div>
    `
  })

  return html + '</div>'
}

window.dragstart_handler = function dragstart_handler(ev) {
  console.log("dragStart: dropEffect = " + ev.dataTransfer.dropEffect + " ; effectAllowed = " + ev.dataTransfer.effectAllowed);

  // Add this element's id to the drag payload so the drop handler will
  // know which element to add to its tree
  ev.dataTransfer.setData("text", ev.target.id);
  ev.dataTransfer.effectAllowed = "move";
}

window.drop_handler = function drop_handler(ev) {
  console.log("drop: dropEffect = " + ev.dataTransfer.dropEffect + " ; effectAllowed = " + ev.dataTransfer.effectAllowed);
  ev.preventDefault();

  // Get the id of the target and add the moved element to the target's DOM
  var data = ev.dataTransfer.getData("text");
  let target = ev.target.closest('.kanban-column').querySelector('.kanban-column-cards')
  target.appendChild(document.getElementById(data));
}

window.dragover_handler = function dragover_handler(ev) {
  console.log("dragOver: dropEffect = " + ev.dataTransfer.dropEffect + " ; effectAllowed = " + ev.dataTransfer.effectAllowed);
  ev.preventDefault();
  // Set the dropEffect to move
  ev.dataTransfer.dropEffect = "move"
}

let backlog = createColumn('backlog')
let todo = createColumn('todo')
let in_progress = createColumn('in progress')
let done = createColumn('done')

let card = createCard('Hello, world\nGreetings\npeople\nThis is a card and it has some quite long content that should wrap.')
backlog.cards.push(card)
backlog.cards.push(card)
backlog.cards.push(card)
backlog.cards.push(card)
backlog.cards.push(card)
backlog.cards.push(card)
backlog.cards.push(card)
todo.cards.push(card)
todo.cards.push(card)
todo.cards.push(card)
in_progress.cards.push(card)
done.cards.push(card)
done.cards.push(card)
done.cards.push(card)
done.cards.push(card)
done.cards.push(card)
done.cards.push(card)
done.cards.push(card)
done.cards.push(card)
done.cards.push(card)
done.cards.push(card)
done.cards.push(card)

container.innerHTML = renderToHTML()
