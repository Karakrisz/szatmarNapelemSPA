<script setup>
// Összeg mező: ezres tagolással mutatja, számként adja vissza
const props = defineProps({ modelValue: { type: [Number, String], default: '' }, placeholder: String })
const emit = defineEmits(['update:modelValue', 'blur'])

const focused = ref(false)
const text = computed(() => {
  const v = props.modelValue
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n)) return String(v)
  return focused.value ? String(n) : n.toLocaleString('hu-HU')
})

function onInput(e) {
  const raw = e.target.value.replace(/[\s ]|Ft/g, '').replace(',', '.')
  if (raw === '') return emit('update:modelValue', '')
  const n = Number(raw)
  emit('update:modelValue', isNaN(n) ? e.target.value : n)
}
</script>

<template>
  <div class="kiv-money">
    <input
      type="text"
      inputmode="decimal"
      :value="text"
      :placeholder="placeholder"
      @focus="focused = true"
      @blur="focused = false; emit('blur')"
      @input="onInput"
    />
    <span>Ft</span>
  </div>
</template>

<style scoped>
.kiv-money {
  position: relative;
}
.kiv-money input {
  padding-right: 38px !important;
}
.kiv-money span {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8a8f98;
  font-size: 14px;
  pointer-events: none;
}
</style>
