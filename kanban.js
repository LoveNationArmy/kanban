import morphdom from './morphdom.js'

// ids are incrementally numbered as a singleton
// in order to avoid id collisions
let kanbanId = 0

/**
 * Kanban
 */

export default class Kanban {
  constructor (el) {
    this.id = kanbanId++
    this.el = el
    this.columns = []
    this.dropListener = this.dropListener.bind(this)
    window.addEventListener('message', this.dropListener)
  }

  destroy () {
    window.removeEventListener('message', this.dropListener)
  }

  render () {
    morphdom(this.el, this.renderToHTML())
  }

  renderToHTML () {
    let html = `<div data-id="${this.id}" class="kanban">`

    this.columns.forEach(column => {
      const cards = column.cards.map((card, index) => `
        <div data-index="${index}" class="kanban-card" draggable="true" ondragstart="Kanban.dragStart(event)">
          <div class="kanban-card-title">${card.title}</div>
          <div class="kanban-card-content">${card.content}</div>
        </div>
      `)

      html += `
        <div data-id="${column.id}" class="kanban-column" ondrop="Kanban.drop(event)" ondragover="Kanban.dragOver(event)">
          <div class="kanban-column-title">${column.title}</div>
          <div class="kanban-column-cards">${cards.join('\n')}</div>
        </div>
      `
    })

    return html + '</div>'
  }

  createColumn (title = 'untitled') {
    const column = {
      id: this.columns.length,
      title: title,
      cards: []
    }

    this.columns.push(column)

    return column
  }

  createCard (content = '') {
    const parts = content.split('\n')

    const card = {
      title: parts[0],
      content: parts.slice(1).join('\n')
    }

    return card
  }

  dropListener (event) {
    if (event.data.kanbanId == this.id) {
      const card = this.columns[event.data.sourceColumnId].cards.splice(event.data.cardIndex, 1)[0]
      this.columns[event.data.targetColumnId].cards.push(card)
      this.render()
    }
  }

  static dragStart (event) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('kanbanId', event.target.closest('.kanban').dataset.id)
    event.dataTransfer.setData('columnId', event.target.closest('.kanban-column').dataset.id)
    event.dataTransfer.setData('cardIndex', event.target.dataset.index)
  }

  static dragOver (event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  static drop (event) {
    event.preventDefault()

    const kanbanId = event.dataTransfer.getData('kanbanId')
    const sourceColumnId = event.dataTransfer.getData('columnId')
    const sourceCardIndex = event.dataTransfer.getData('cardIndex')
    const targetColumnId = event.target.closest('.kanban-column').dataset.id

    window.postMessage({
      kanbanId,
      sourceCardIndex,
      sourceColumnId,
      targetColumnId
    })
  }
}
