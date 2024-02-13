<script setup lang="ts">
  import { useEditor, EditorContent } from '@tiptap/vue-3'

  import StarterKit from '@tiptap/starter-kit'

  const props = defineProps({
    label: {
      type: String,
      default: '',
    },
    modelValue: {
      type: String,
      default: '',
    },
  })

  const emit = defineEmits(['update:modelValue'])
  const textInput = ref('')

  const editor = useEditor({
    content: props.modelValue ?? '<p></p>',
    extensions: [StarterKit],
    onUpdate: ({ editor }) => {
      textInput.value = editor.getText()
      emit('update:modelValue', editor.getHTML())
    },
  })
</script>

<template>
  <div class="my-4">
    <p class="text-neutral-lighten-1 mb-4">{{ label }}</p>

    <div v-if="editor" class="mb-4 tools">
      <!-- header -->
      <VTooltip location="top" color="primary">
        <template #activator="{ props: activatorProps }">
          <VBtn
            v-bind="activatorProps"
            :class="{ 'is-active': editor.isActive('heading', { level: 6 }) }"
            variant="flat"
            size="small"
            :ripple="true"
            @click="editor.chain().focus().toggleHeading({ level: 6 }).run()"
          >
            <VIcon>mdi-format-header-1</VIcon>
          </VBtn>
        </template>

        {{ $t('formattext.heading') }}
      </VTooltip>

      <!-- paragraph -->
      <VTooltip location="top" color="primary">
        <template #activator="{ props: activatorProps }">
          <VBtn
            v-bind="activatorProps"
            :class="{ 'is-active': editor.isActive('paragraph') }"
            variant="flat"
            size="small"
            :ripple="true"
            @click="editor.chain().focus().setParagraph().run()"
          >
            <VIcon>mdi-format-paragraph</VIcon>
          </VBtn>
        </template>

        {{ $t('formattext.paragraph') }}
      </VTooltip>

      <!-- bold text -->
      <VTooltip location="top" color="primary">
        <template #activator="{ props: activatorProps }">
          <VBtn
            v-bind="activatorProps"
            :disabled="!editor.can().chain().focus().toggleBold().run()"
            :class="{ 'is-active': editor.isActive('bold') }"
            variant="flat"
            size="small"
            :ripple="true"
            @click="editor.chain().focus().toggleBold().run()"
          >
            <VIcon>mdi-format-bold</VIcon>
          </VBtn>
        </template>

        {{ $t('formattext.bold') }}
      </VTooltip>

      <!-- italic text -->
      <VTooltip location="top" color="primary">
        <template #activator="{ props: activatorProps }">
          <VBtn
            v-bind="activatorProps"
            :disabled="!editor.can().chain().focus().toggleItalic().run()"
            :class="{ 'is-active': editor.isActive('italic') }"
            variant="flat"
            size="small"
            :ripple="true"
            @click="editor.chain().focus().toggleItalic().run()"
          >
            <VIcon>mdi-format-italic</VIcon>
          </VBtn>
        </template>

        {{ $t('formattext.italic') }}
      </VTooltip>

      <!-- strikethrough text -->
      <VTooltip location="top" color="primary">
        <template #activator="{ props: activatorProps }">
          <VBtn
            v-bind="activatorProps"
            :disabled="!editor.can().chain().focus().toggleStrike().run()"
            :class="{ 'is-active': editor.isActive('strike') }"
            variant="flat"
            size="small"
            :ripple="true"
            @click="editor.chain().focus().toggleStrike().run()"
          >
            <VIcon>mdi-format-strikethrough</VIcon>
          </VBtn>
        </template>

        {{ $t('formattext.strikethrough') }}
      </VTooltip>

      <!-- bullet list -->
      <VTooltip location="top" color="primary">
        <template #activator="{ props: activatorProps }">
          <VBtn
            v-bind="activatorProps"
            :class="{ 'is-active': editor.isActive('bulletList') }"
            variant="flat"
            size="small"
            :ripple="true"
            @click="editor.chain().focus().toggleBulletList().run()"
          >
            <VIcon>mdi-format-list-bulleted</VIcon>
          </VBtn>
        </template>

        {{ $t('formattext.bulletlist') }}
      </VTooltip>

      <!-- numbered list -->
      <VTooltip location="top" color="primary">
        <template #activator="{ props: activatorProps }">
          <VBtn
            v-bind="activatorProps"
            :class="{ 'is-active': editor.isActive('orderedList') }"
            variant="flat"
            size="small"
            :ripple="true"
            @click="editor.chain().focus().toggleOrderedList().run()"
          >
            <VIcon>mdi-format-list-numbered</VIcon>
          </VBtn>
        </template>

        {{ $t('formattext.numberedlist') }}
      </VTooltip>

      <!-- line break -->
      <VTooltip location="top" color="primary">
        <template #activator="{ props: activatorProps }">
          <VBtn
            v-bind="activatorProps"
            variant="flat"
            size="small"
            :ripple="true"
            @click="editor.chain().focus().setHardBreak().run()"
          >
            <VIcon>mdi-format-line-spacing</VIcon>
          </VBtn>
        </template>

        {{ $t('formattext.linebreak') }}
      </VTooltip>

      <!-- undo -->
      <VTooltip location="top" color="primary">
        <template #activator="{ props: activatorProps }">
          <VBtn
            v-bind="activatorProps"
            :disabled="!editor.can().chain().focus().undo().run()"
            variant="flat"
            size="small"
            :ripple="true"
            @click="editor.chain().focus().undo().run()"
          >
            <VIcon>mdi-undo</VIcon>
          </VBtn>
        </template>

        {{ $t('formattext.undo') }}
      </VTooltip>

      <!-- redo -->
      <VTooltip location="top" color="primary">
        <template #activator="{ props: activatorProps }">
          <VBtn
            v-bind="activatorProps"
            :disabled="!editor.can().chain().focus().redo().run()"
            variant="flat"
            size="small"
            :ripple="true"
            @click="editor.chain().focus().redo().run()"
          >
            <VIcon>mdi-redo</VIcon>
          </VBtn>
        </template>

        {{ $t('formattext.redo') }}
      </VTooltip>
    </div>

    <EditorContent :editor="editor" />
  </div>
</template>

<style lang="scss">
  .ProseMirror {
    border: 1px solid rgb(var(--v-theme-neutral-lighten-3));
    border-radius: 4px;
    padding: 1rem 1.5rem;
    width: 100%;
    max-height: 60vh;
    overflow-y: auto;

    &:focus {
      outline: none;
      border-color: rgb(var(--v-theme-neutral)) !important;
      border-width: 2px;
    }
  }
</style>
