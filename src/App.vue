<template>
  <div class="flex h-screen bg-gray-50 text-gray-900">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div class="px-4 py-5 border-b border-gray-200">
        <h1 class="text-lg font-semibold tracking-tight">My Checklists</h1>
      </div>

      <nav class="flex-1 overflow-y-auto py-2">
        <button
          v-for="list in lists"
          :key="list.id"
          @click="activeListId = list.id"
          :class="[
            'w-full text-left px-4 py-2.5 text-sm flex items-center justify-between group transition-colors',
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
            class="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
          <button
            type="submit"
            class="shrink-0 bg-indigo-600 text-white rounded-md px-3 py-1.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </form>
      </div>
    </aside>

    <!-- Main content -->
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
      <div v-else class="flex flex-col items-center justify-center h-full text-gray-400">
        <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <p class="text-lg font-medium">No list selected</p>
        <p class="text-sm mt-1">Create a list on the left to get started</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChecklists } from './composables/useChecklists.js'
import ChecklistView from './components/ChecklistView.vue'

const { lists, createList, deleteList, renameList, addItem, toggleItem, deleteItem, clearChecked } = useChecklists()

const activeListId = ref(lists.value[0]?.id ?? null)
const newListName = ref('')

const activeList = computed(() => lists.value.find(l => l.id === activeListId.value) ?? null)

function handleCreateList() {
  const id = createList(newListName.value)
  if (id) {
    activeListId.value = id
    newListName.value = ''
  }
}

function handleDeleteList() {
  const idx = lists.value.findIndex(l => l.id === activeListId.value)
  deleteList(activeListId.value)
  activeListId.value = lists.value[Math.max(0, idx - 1)]?.id ?? null
}
</script>
