import { ref, watch } from 'vue'

const STORAGE_KEY = 'checklist-app-data'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const lists = ref(loadFromStorage())

watch(lists, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

export function useChecklists() {
  function createList(name) {
    const trimmed = name.trim()
    if (!trimmed) return null
    const list = { id: generateId(), name: trimmed, items: [] }
    lists.value.push(list)
    return list.id
  }

  function deleteList(id) {
    lists.value = lists.value.filter(l => l.id !== id)
  }

  function renameList(id, name) {
    const trimmed = name.trim()
    if (!trimmed) return
    const list = lists.value.find(l => l.id === id)
    if (list) list.name = trimmed
  }

  function addItem(listId, text) {
    const trimmed = text.trim()
    if (!trimmed) return
    const list = lists.value.find(l => l.id === listId)
    if (list) list.items.push({ id: generateId(), text: trimmed, checked: false })
  }

  function toggleItem(listId, itemId) {
    const list = lists.value.find(l => l.id === listId)
    if (!list) return
    const item = list.items.find(i => i.id === itemId)
    if (item) item.checked = !item.checked
  }

  function deleteItem(listId, itemId) {
    const list = lists.value.find(l => l.id === listId)
    if (list) list.items = list.items.filter(i => i.id !== itemId)
  }

  function clearChecked(listId) {
    const list = lists.value.find(l => l.id === listId)
    if (list) list.items.forEach(i => { i.checked = false })
  }

  return { lists, createList, deleteList, renameList, addItem, toggleItem, deleteItem, clearChecked }
}
