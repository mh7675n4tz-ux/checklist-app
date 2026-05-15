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

  function exportData() {
    const payload = JSON.stringify({ version: 1, lists: lists.value }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `checklists-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result)
          if (!Array.isArray(parsed?.lists)) throw new Error('Invalid file format')
          lists.value = parsed.lists
          resolve(parsed.lists.length)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsText(file)
    })
  }

  return { lists, createList, deleteList, renameList, addItem, toggleItem, deleteItem, clearChecked, exportData, importData }
}
