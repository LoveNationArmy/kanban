import morphdom from './morphdom.js'

const VERSION = '1'

let kanbanStore = window.localStorage.kanban ? JSON.parse(window.localStorage.kanban) : {}
let kanbans = []
let holdingCard

const placeholder = document.createElement('div')
placeholder.className = 'kanban-card kanban-card-placeholder'
placeholder.lastBefore = { dataset: {} }

/**
 * Kanban
 */

export default class Kanban {
  constructor (el, name = 'default') {
    this.id = kanbans.length
    this.name = name
    kanbans.push(this)
    this.el = el
    this.columns = []
    this.dropListener = this.dropListener.bind(this)
    window.addEventListener('message', this.dropListener)

    if (name in kanbanStore) {
      const store = kanbanStore[name]
      if (store.version === VERSION) {
        this.columns = store.data
      } else {
        alert(`Kanban data version mismatch.\nCurrent: ${VERSION}\nStored: ${store.version}`)
      }
    }
  }

  save () {
    kanbanStore[this.name] = {
      version: VERSION,
      data: this.columns
    }

    window.localStorage.kanban = JSON.stringify(kanbanStore)
  }

  destroy () {
    window.removeEventListener('message', this.dropListener)
  }

  render () {
    morphdom(this.el, this.renderToHTML())
    this.save() // any render, means there was data change, so we save
  }

  renderToHTML () {
    let html = `<div data-id="${this.id}" class="kanban" ondrop="Kanban.drop(event)" ondragover="Kanban.dragOver(event)">`

    this.columns.forEach(column => {
      const cards = column.cards.map((card, index) => `
        <div class="kanban-card"
          data-index="${index}"
          draggable="true"
          ondragstart="Kanban.dragStart(event)"
          ondblclick="Kanban.editCard(event)"
          onkeyup="!this.isContentEditable && Kanban.editCard(event)"
          onkeydown="event.which === 27 && this.blur()"
          tabindex="100"
          ><div class="kanban-card-title">${card.title}</div>\n<div class="kanban-card-content">${card.content}</div></div>
      `)

      html += `
        <div class="kanban-column" data-id="${column.id}" ondblclick="Kanban.createCard(${this.id},${column.id},true)">
          <div class="kanban-column-title" ondblclick="event.stopPropagation()">
            <button class="kanban-button-create-card" onclick="Kanban.createCard(${this.id},${column.id},true)" tabindex="1">+</button>
            ${column.title}
          </div>
          <div class="kanban-column-cards">${cards.join('\n')}</div>
        </div>
      `
    })

    return html + '</div>'
  }

  createColumn (title = 'untitled') {
    if (this.columns.find(c => c.title === title)) return

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
      title: parts[0].trim(),
      content: parts.slice(1).join('\n').trim()
    }

    return card
  }

  dropListener (event) {
    if (event.data.kanbanId == this.id) {
      if (event.data.type === 'move') {
        const card = this.columns[event.data.sourceColumnId].cards.splice(event.data.sourceCardIndex, 1)[0]

        const targetCardIndex = placeholder.lastBefore.dataset.index

        if (targetCardIndex) {
          this.columns[event.data.targetColumnId].cards.splice(targetCardIndex, 0, card)
        } else {
          this.columns[event.data.targetColumnId].cards.push(card)
        }
      } else if (event.data.type === 'edit') {
        const card = this.columns[event.data.columnId].cards[event.data.cardIndex]
        const content = event.data.content.trim()
        if (!content) {
          this.columns[event.data.columnId].cards.splice(event.data.cardIndex, 1)
          this.render()
          return
        }

        const parts = event.data.content.split('\n')

        card.title = parts[0].trim()
        card.content = parts.slice(1).join('\n').trim()
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
      type: 'move',
      kanbanId,
      sourceCardIndex,
      sourceColumnId,
      targetColumnId
    })
  }

  static editCard (event) {
    event.stopPropagation()

    const cardElement = event.target.closest('.kanban-card')
    const kanbanId = cardElement.closest('.kanban').dataset.id
    const columnId = cardElement.closest('.kanban-column').dataset.id
    const cardIndex = cardElement.dataset.index

    cardElement.innerHTML = cardElement.textContent
    cardElement.setAttribute('draggable', 'false')
    cardElement.contentEditable = 'plaintext-only'
    cardElement.blur() // this is a browser bug workaround otherwise focus is not given to the element when tabindex is set
    cardElement.addEventListener('blur', onblur)
    cardElement.focus()

    function onblur () {
      const content = cardElement.textContent.trim()

      window.postMessage({
        type: 'edit',
        kanbanId,
        columnId,
        cardIndex,
        content
      })

      cardElement.removeEventListener('blur', onblur)
    }
  }

  static createCard (kanbanId, columnId, focus = false) {
    const board = kanbans[kanbanId]
    const card = board.createCard()
    board.columns[columnId].cards.unshift(card)
    board.render()
    if (focus) {
      const cardElement = board.el.querySelector(`.kanban-column[data-id="${columnId}"] .kanban-card`)
      cardElement.innerHTML = cardElement.textContent
      cardElement.setAttribute('draggable', 'false')
      cardElement.contentEditable = 'plaintext-only'
      cardElement.addEventListener('blur', onblur)
      cardElement.focus()

      function onblur () {
        const content = cardElement.textContent.trim()

        window.postMessage({
          type: 'edit',
          kanbanId,
          columnId,
          cardIndex: 0,
          content
        })

        cardElement.removeEventListener('blur', onblur)
      }
    }
  }
}
