<template>
  <div class="max-w-2xl mx-auto px-6 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-3">
      <div v-if="!editingName" class="flex items-center gap-2 min-w-0">
        <h2 class="text-2xl font-bold truncate">{{ list.name }}</h2>
        <button
          @click="startRename"
          class="text-gray-400 hover:text-gray-600 shrink-0"
          title="Rename list"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 013.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
      <form v-else @submit.prevent="submitRename" class="flex-1 flex gap-2">
        <input
          ref="renameInput"
          v-model="renameValue"
          type="text"
          class="flex-1 text-xl font-bold border-b-2 border-indigo-500 bg-transparent focus:outline-none"
          @blur="submitRename"
          @keydown.escape="editingName = false"
        />
      </form>

      <div class="flex items-center gap-2 shrink-0">
        <span class="text-sm text-gray-500">
          {{ checkedCount }}/{{ list.items.length }} done
        </span>
        <button
          v-if="checkedCount > 0"
          @click="$emit('clear-checked')"
          class="text-xs text-gray-400 hover:text-red-500 transition-colors"
          title="Remove checked items"
        >
          Clear checked
        </button>
        <button
          @click="confirmDelete"
          class="text-gray-400 hover:text-red-500 transition-colors ml-1"
          title="Delete list"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Progress bar -->
    <div v-if="list.items.length > 0" class="w-full bg-gray-200 rounded-full h-1.5 mb-6">
      <div
        class="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
        :style="{ width: progressPercent + '%' }"
      />
    </div>

    <!-- Items -->
    <ul class="space-y-1 mb-6">
      <li
        v-for="item in list.items"
        :key="item.id"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white hover:shadow-sm transition-all group"
      >
        <button
          @click="$emit('toggle-item', item.id)"
          :class="[
            'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
            item.checked
              ? 'bg-indigo-500 border-indigo-500'
              : 'border-gray-300 hover:border-indigo-400'
          ]"
        >
          <svg v-if="item.checked" class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <span
          :class="[
            'flex-1 text-sm transition-colors',
            item.checked ? 'line-through text-gray-400' : 'text-gray-800'
          ]"
        >{{ item.text }}</span>
        <button
          @click="$emit('delete-item', item.id)"
          class="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
          title="Remove item"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>
    </ul>

    <!-- Empty state -->
    <div v-if="list.items.length === 0" class="text-center py-10 text-gray-400">
      <p class="text-sm">No items yet. Add one below!</p>
    </div>

    <!-- Add item form -->
    <form @submit.prevent="handleAdd" class="flex gap-2">
      <input
        v-model="newItemText"
        type="text"
        placeholder="Add an item…"
        class="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
      />
      <button
        type="submit"
        class="bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        Add
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  list: { type: Object, required: true }
})

const emit = defineEmits(['add-item', 'toggle-item', 'delete-item', 'clear-checked', 'delete-list', 'rename-list'])

const newItemText = ref('')
const editingName = ref(false)
const renameValue = ref('')
const renameInput = ref(null)

const checkedCount = computed(() => props.list.items.filter(i => i.checked).length)
const progressPercent = computed(() =>
  props.list.items.length === 0 ? 0 : Math.round((checkedCount.value / props.list.items.length) * 100)
)

function handleAdd() {
  if (!newItemText.value.trim()) return
  emit('add-item', newItemText.value)
  newItemText.value = ''
}

async function startRename() {
  renameValue.value = props.list.name
  editingName.value = true
  await nextTick()
  renameInput.value?.focus()
  renameInput.value?.select()
}

function submitRename() {
  if (renameValue.value.trim()) emit('rename-list', renameValue.value)
  editingName.value = false
}

function confirmDelete() {
  if (confirm(`Delete "${props.list.name}"? This cannot be undone.`)) {
    emit('delete-list')
  }
}
</script>
