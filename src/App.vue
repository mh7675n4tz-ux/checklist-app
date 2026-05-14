<template>
  <div class="flex h-screen bg-gray-50 text-gray-900">

    <!-- Mobile backdrop -->
    <div
      v-if="drawerOpen"
      class="fixed inset-0 bg-black/40 z-20 md:hidden"
      @click="drawerOpen = false"
    />

    <!-- Sidebar (desktop: static | mobile: slide-in drawer) -->
    <aside
      :class="[
        'bg-white border-r border-gray-200 flex flex-col shrink-0 z-30 transition-transform duration-300',
        'fixed inset-y-0 left-0 w-72 md:static md:w-64 md:translate-x-0',
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
            'w-full text-left px-4 py-3 text-sm flex items-center justify-between group transition-colors',
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

      <!-- New list form -->
      <div class="px-4 py-3 border-t border-gray-200">
        <form @submit.prevent="handleCreateList" class="flex gap-2">
          <input
            v-model="newListName"
            type="text"
            placeholder="New list name…"
            class="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
          <button
            type="submit"
            class="shrink-0 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </form>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Mobile top bar -->
      <header class="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <button @click="drawerOpen = true" class="text-gray-500 hover:text-gray-700 p-1 -ml-1">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="font-semibold text-base truncate">{{ activeList?.name ?? 'My Checklists' }}</span>
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
import { ref, computed } from 'vue'
import { useChecklists } from './composables/useChecklists.js'
import ChecklistView from './components/ChecklistView.vue'

const { lists, createList, deleteList, renameList, addItem, toggleItem, deleteItem, clearChecked } = useChecklists()

const activeListId = ref(lists.value[0]?.id ?? null)
const newListName = ref('')
const drawerOpen = ref(false)

const activeList = computed(() => lists.value.find(l => l.id === activeListId.value) ?? null)

function selectList(id) {
  activeListId.value = id
  drawerOpen.value = false
}

function handleCreateList() {
  const id = createList(newListName.value)
  if (id) {
    activeListId.value = id
    newListName.value = ''
    drawerOpen.value = false
  }
}

function handleDeleteList() {
  const idx = lists.value.findIndex(l => l.id === activeListId.value)
  deleteList(activeListId.value)
  activeListId.value = lists.value[Math.max(0, idx - 1)]?.id ?? null
}
</script>
