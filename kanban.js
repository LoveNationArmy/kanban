import morphdom from './morphdom.js'

// ids are incrementally numbered as a singleton
// in order to avoid id collisions
let kanbanId = 0

const placeholder = document.createElement('div')
placeholder.className = 'kanban-card kanban-card-placeholder'
placeholder.lastBefore = { dataset: {} }

let holdingCard

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
    let html = `<div data-id="${this.id}" class="kanban" ondrop="Kanban.drop(event)" ondragover="Kanban.dragOver(event)">`

    this.columns.forEach(column => {
      const cards = column.cards.map((card, index) => `
        <div class="kanban-card" data-index="${index}" draggable="true" ondragstart="Kanban.dragStart(event)">
          <div class="kanban-card-title">${card.title}</div>
          <div class="kanban-card-content">${card.content}</div>
        </div>
      `)

      html += `
        <div class="kanban-column" data-id="${column.id}">
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
      const card = this.columns[event.data.sourceColumnId].cards.splice(event.data.sourceCardIndex, 1)[0]

      const targetCardIndex = placeholder.lastBefore.dataset.index

      if (targetCardIndex) {
        this.columns[event.data.targetColumnId].cards.splice(targetCardIndex, 0, card)
      } else {
        this.columns[event.data.targetColumnId].cards.push(card)
      }
      this.render()
    }
  }

  static dragStart (event) {
    holdingCard = event.target
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('kanbanId', holdingCard.closest('.kanban').dataset.id)
    event.dataTransfer.setData('columnId', holdingCard.closest('.kanban-column').dataset.id)
    event.dataTransfer.setData('cardIndex', holdingCard.dataset.index)
    setTimeout(() => {
      placeholder.innerHTML = holdingCard.innerHTML
      holdingCard.parentNode.insertBefore(placeholder, holdingCard)
      holdingCard.style.display = 'none'
    })
  }

  static dragOver (event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'


    const closestCard = event.target.closest('.kanban-card')

    if (event.target === placeholder) return
    if (closestCard === placeholder) return
    if (closestCard === placeholder.lastBefore) return

    if (closestCard) {
      placeholder.lastBefore = closestCard
      placeholder.dataset.index = closestCard.dataset.index
      closestCard.parentNode.insertBefore(placeholder, closestCard)
    } else {
      placeholder.lastBefore = event.target.closest('.kanban-column').querySelector('.kanban-column-cards')
      placeholder.lastBefore.appendChild(placeholder)
    }
  }

  static drop (event) {
    event.preventDefault()

    const kanbanId = event.dataTransfer.getData('kanbanId')
    const sourceColumnId = event.dataTransfer.getData('columnId')
    const sourceCardIndex = event.dataTransfer.getData('cardIndex')
    const targetColumnId = event.target.closest('.kanban-column').dataset.id

    placeholder.parentNode.removeChild(placeholder)

    window.postMessage({
      kanbanId,
      sourceCardIndex,
      sourceColumnId,
      targetColumnId
    })
  }
}
