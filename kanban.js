import morphdom from './morphdom.js'

let columnId = 0

const columns = []

function createColumn (title = 'untitled') {
  const column = {
    id: `column_${columnId++}`,
    title: title,
    cards: []
  }

  columns.push(column)

  return column
}

function createCard (content = '') {
  const parts = content.split('\n')

  const card = {
    title: parts[0],
    content: parts.slice(1).join('\n')
  }

  return card
}

function renderToHTML () {
  let html = '<div class="kanban">'

  columns.forEach(column => {
    const cards = column.cards.map((card, index) => `
      <div id="${column.id}_${index}" class="kanban-card" draggable="true" ondragstart="Kanban.dragStart(event)">
        <div class="kanban-card-title">${card.title}</div>
        <div class="kanban-card-content">${card.content}</div>
      </div>
    `)

    html += `
      <div id="${column.id}" class="kanban-column" ondrop="Kanban.drop(event)" ondragover="Kanban.dragOver(event)">
        <div class="kanban-column-title">${column.title}</div>
        <div class="kanban-column-cards">${cards.join('\n')}</div>
      </div>
    `
  })

  return html + '</div>'
}

window.Kanban = {
  dragStart (event) { // TODO: { dataTransfer, card: target }?
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('cardId', event.target.id)
    event.dataTransfer.setData('columnId', event.target.closest('.kanban-column').id.split('_').pop())
  },

  dragOver (event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  },

  drop (event) {
    event.preventDefault()

    const cardId = event.dataTransfer.getData('cardId')
    const cardIndex = cardId.split('_').pop()
    const sourceColumnId = event.dataTransfer.getData('columnId')
    const targetColumnId = event.target.closest('.kanban-column').id.split('_').pop()

    const card = columns[sourceColumnId].cards.splice(cardIndex, 1)[0]
    columns[targetColumnId].cards.push(card)

    morphdom(container.firstChild, renderToHTML())
    // container.innerHTML = renderToHTML()

    // let target = event.target.closest('.kanban-column').querySelector('.kanban-column-cards')
    // target.appendChild(document.getElementById(data));
  }
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

morphdom(container.firstChild, renderToHTML())
