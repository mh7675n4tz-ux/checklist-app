<template>
  <!-- h-dvh accounts for iOS Safari browser chrome; overflow-hidden + relative lets absolute children cover the viewport -->
  <div class="relative flex h-dvh bg-gray-50 text-gray-900 overflow-hidden">

    <!-- Mobile backdrop -->
    <div
      v-if="drawerOpen"
      class="absolute inset-0 bg-black/40 z-20 md:hidden"
      @click="drawerOpen = false"
    />

    <!-- Sidebar
         mobile: absolute (NOT fixed) so inputs inside don't get cursor-displaced by iOS keyboard
         desktop: static in the flex row -->
    <aside
      :class="[
        'bg-white border-r border-gray-200 flex flex-col shrink-0 z-30 transition-transform duration-300',
        'absolute inset-y-0 left-0 w-72 md:static md:w-64 md:translate-x-0',
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="px-4 py-5 border-b border-gray-200 flex items-center justify-between">
        <h1 class="text-lg font-semibold tracking-tight">My Checklists</h1>
        <button class="md:hidden text-gray-400 hover:text-gray-600 p-1" @click="drawerOpen = false">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto py-2">
        <button
          v-for="list in lists"
          :key="list.id"
          @click="selectList(list.id)"
          :class="[
            'w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors',
            activeListId === list.id
              ? 'bg-indigo-50 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          <span class="truncate">{{ list.name }}</span>
          <span class="text-xs text-gray-400 ml-2 shrink-0">
            {{ list.items.filter(i => !i.checked).length }}/{{ list.items.length }}
          </span>
        </button>
      </nav>

      <div class="px-4 py-3 border-t border-gray-200 space-y-2">
        <form @submit.prevent="handleCreateList" class="flex gap-2">
          <input
            v-model="newListName"
            type="text"
            placeholder="New list name…"
            class="flex-1 min-w-0 text-base md:text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
          <button
            type="submit"
            class="shrink-0 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </form>

        <!-- Import / Export -->
        <div class="flex gap-2">
          <button
            @click="handleExport"
            class="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md py-1.5 transition-colors hover:bg-gray-50"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button
            @click="triggerImport"
            class="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md py-1.5 transition-colors hover:bg-gray-50"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Import
          </button>
          <input ref="importInput" type="file" accept=".json" class="hidden" @change="handleImport" />
        </div>

        <!-- Import feedback -->
        <p v-if="importMessage" :class="['text-xs text-center transition-opacity', importError ? 'text-red-500' : 'text-green-600']">
          {{ importMessage }}
        </p>
      </div>
    </aside>

    <!-- Main content — no overflow-hidden here (was clipping the sticky Add button) -->
    <div class="flex-1 flex flex-col min-w-0">

      <!-- Mobile top bar -->
      <header class="md:hidden flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200 shrink-0 min-h-[52px]">
        <button @click="drawerOpen = true" class="text-gray-500 p-2 -ml-1 shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <template v-if="activeList">
          <form v-if="mobileRenaming" @submit.prevent="submitMobileRename" class="flex-1 flex items-center gap-2 min-w-0">
            <input
              ref="mobileRenameInput"
              v-model="mobileRenameValue"
              type="text"
              class="flex-1 min-w-0 font-semibold text-base border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              @keydown.escape="mobileRenaming = false"
            />
            <button type="submit" class="shrink-0 text-indigo-600 text-sm font-medium px-1">Done</button>
          </form>

          <button
            v-else
            @click="startMobileRename"
            class="flex-1 min-w-0 text-left font-semibold text-base truncate"
          >
            {{ activeList.name }}
          </button>

          <button
            v-if="!mobileRenaming"
            @click="handleDeleteList"
            class="text-gray-400 hover:text-red-500 p-2 shrink-0 transition-colors"
            title="Delete list"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </template>

        <span v-else class="font-semibold text-base text-gray-400">My Checklists</span>
      </header>

      <main class="flex-1 overflow-y-auto">
        <ChecklistView
          v-if="activeList"
          :list="activeList"
          @add-item="(text) => addItem(activeList.id, text)"
          @toggle-item="(itemId) => toggleItem(activeList.id, itemId)"
          @delete-item="(itemId) => deleteItem(activeList.id, itemId)"
          @clear-checked="() => clearChecked(activeList.id)"
          @delete-list="handleDeleteList"
          @rename-list="(name) => renameList(activeList.id, name)"
        />
        <div v-else class="flex flex-col items-center justify-center h-full text-gray-400 px-6 text-center">
          <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p class="text-lg font-medium">No list selected</p>
          <p class="text-sm mt-1">Open the menu and create a list to get started</p>
        </div>
      </main>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useChecklists } from './composables/useChecklists.js'
import ChecklistView from './components/ChecklistView.vue'

const { lists, createList, deleteList, renameList, addItem, toggleItem, deleteItem, clearChecked, exportData, importData } = useChecklists()

const activeListId = ref(lists.value[0]?.id ?? null)
const newListName = ref('')
const drawerOpen = ref(false)

const importInput = ref(null)
const importMessage = ref('')
const importError = ref(false)
let importMessageTimer = null

const mobileRenaming = ref(false)
const mobileRenameValue = ref('')
const mobileRenameInput = ref(null)

const activeList = computed(() => lists.value.find(l => l.id === activeListId.value) ?? null)

function selectList(id) {
  activeListId.value = id
  drawerOpen.value = false
}

async function handleCreateList() {
  const id = createList(newListName.value)
  if (id) {
    newListName.value = ''
    activeListId.value = id
    // Wait for DOM update before closing so iOS doesn't race keyboard dismissal with drawer animation
    await nextTick()
    drawerOpen.value = false
  }
}

function handleDeleteList() {
  if (!confirm(`Delete "${activeList.value?.name}"? This cannot be undone.`)) return
  const idx = lists.value.findIndex(l => l.id === activeListId.value)
  deleteList(activeListId.value)
  activeListId.value = lists.value[Math.max(0, idx - 1)]?.id ?? null
}

async function startMobileRename() {
  mobileRenameValue.value = activeList.value?.name ?? ''
  mobileRenaming.value = true
  await nextTick()
  mobileRenameInput.value?.focus()
  mobileRenameInput.value?.select()
}

function handleExport() {
  exportData()
}

function triggerImport() {
  importInput.value.value = ''
  importInput.value.click()
}

async function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  clearTimeout(importMessageTimer)
  try {
    const count = await importData(file)
    activeListId.value = lists.value[0]?.id ?? null
    importError.value = false
    importMessage.value = `Imported ${count} list${count !== 1 ? 's' : ''}`
  } catch {
    importError.value = true
    importMessage.value = 'Invalid file — import failed'
  }
  importMessageTimer = setTimeout(() => { importMessage.value = '' }, 3000)
}

function submitMobileRename() {
  const trimmed = mobileRenameValue.value.trim()
  if (trimmed && activeList.value) renameList(activeListId.value, trimmed)
  mobileRenaming.value = false
}
</script>
