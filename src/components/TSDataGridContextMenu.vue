<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="visible"
        ref="menuRef"
        class="ts-datagrid-context-menu"
        :style="menuStyle"
        @click.stop
        @contextmenu.prevent
      >
        <template v-for="(item, index) in items" :key="index">
          <!-- Separator -->
          <div v-if="item.text === '-'" class="ts-datagrid-context-menu__separator" />

          <!-- Menu Item -->
          <button
            v-else
            class="ts-datagrid-context-menu__item"
            :class="{ 
              'ts-datagrid-context-menu__item--disabled': item.disabled,
              'ts-datagrid-context-menu__item--has-submenu': item.items && item.items.length 
            }"
            :disabled="item.disabled"
            @click="handleItemClick(item)"
          >
            <span v-if="item.icon" class="ts-datagrid-context-menu__icon">
              {{ item.icon }}
            </span>
            <span class="ts-datagrid-context-menu__text">{{ item.text }}</span>
            <span v-if="item.items && item.items.length" class="ts-datagrid-context-menu__arrow">
              ▶
            </span>
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { PropType } from 'vue';
import type { ContextMenuItem } from '../types';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
  items: {
    type: Array as PropType<ContextMenuItem[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const menuRef = ref<HTMLElement>();

const menuStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${props.y}px`,
  left: `${props.x}px`,
  zIndex: 10000,
}));

const handleItemClick = (item: ContextMenuItem) => {
  if (item.disabled) return;
  
  item.onClick?.();
  emit('close');
};

// ✅ Close on click outside
const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close');
  }
};

onMounted(() => {
  // Add click outside listener after a small delay
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('contextmenu', handleClickOutside);
  }, 100);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('contextmenu', handleClickOutside);
});
</script>

<style lang="scss">
// ===== CONTEXT MENU ANIMATIONS =====
.context-menu-enter-active {
  animation: context-menu-in 0.15s ease-out;
}

.context-menu-leave-active {
  animation: context-menu-out 0.1s ease-in;
}

@keyframes context-menu-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes context-menu-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

.ts-datagrid-context-menu {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  padding: 4px 0;
  transform-origin: top left;
  
  &__item {
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #333;
    transition: background 0.15s;
    
    &:hover:not(&--disabled) {
      background: #f5f5f5;
    }
    
    &:active:not(&--disabled) {
      background: #e8e8e8;
    }
    
    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &--has-submenu {
      padding-right: 24px;
    }
  }
  
  &__icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  
  &__text {
    flex: 1;
    font-weight: 500;
  }
  
  &__arrow {
    font-size: 10px;
    opacity: 0.6;
    margin-left: auto;
  }
  
  &__separator {
    height: 1px;
    background: #e0e0e0;
    margin: 4px 8px;
  }
}
</style>