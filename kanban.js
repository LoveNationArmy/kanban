
const columns = []

function createColumn (title) {
  const column = {
    title: title || 'untitled',
    cards: []
  }

  columns.push(column)
}

function renderToHTML () {
  let html = '<div class="kanban">'

  columns.forEach(column => {
    html += `
      <div class="kanban-column">
        <div class="kanban-column-title">${column.title}</div>
      </div>
    `
  })

  return html + '</div>'
}

createColumn('backlog')
createColumn('todo')
createColumn('in progress')
createColumn('done')

container.innerHTML = renderToHTML()
