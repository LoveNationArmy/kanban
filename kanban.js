
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
    const cards = column.cards.map(card => `
      <div class="kanban-card">
        <div class="kanban-card-title">${card.title}</div>
        <div class="kanban-card-content">${card.content}</div>
      </div>
    `)

    html += `
      <div class="kanban-column">
        <div class="kanban-column-title">${column.title}</div>
        <div class="kanban-column-cards">${cards.join('\n')}</div>
      </div>
    `
  })

  return html + '</div>'
}

let backlog = createColumn('backlog')
createColumn('todo')
createColumn('in progress')
createColumn('done')

let card = createCard('Hello, world\nGreetings\npeople\nThis is a card and it has some quite long content that should wrap.')
backlog.cards.push(card)

container.innerHTML = renderToHTML()
