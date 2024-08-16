import * as React from 'react'
import './styles/index.css'

import { EditorContent } from '@tiptap/react'
import { Content, Editor } from '@tiptap/core'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { SectionOne } from './components/section/one'
import { SectionTwo } from './components/section/two'
import { SectionThree } from './components/section/three'
import { SectionFour } from './components/section/four'
import { SectionFive } from './components/section/five'
import { LinkBubbleMenu } from './components/bubble-menu/link-bubble-menu'
import { ImageBubbleMenu } from './components/bubble-menu/image-bubble-menu'
import { useMinimalTiptapEditor, UseMinimalTiptapEditorProps } from './hooks/use-minimal-tiptap'
import Document from '@tiptap/extension-document'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
// import Image from '@tiptap/extension-'

export interface MinimalTiptapProps extends Omit<UseMinimalTiptapEditorProps, 'onUpdate' | 'onBlur'> {
  value?: Content
  onValueChange?: (value: Content) => void
  className?: string
  editorContentClassName?: string
}

const Toolbar = ({ editor }: { editor: Editor }) => (
  <div className="bg-muted border-b border-border p-2">
    <div className="flex w-full flex-wrap items-center">
      <SectionOne editor={editor} />
      <Separator orientation="vertical" className="mx-2 h-7" />
      <SectionTwo editor={editor} />
      <Separator orientation="vertical" className="mx-2 h-7" />
      <SectionThree editor={editor} />
      <Separator orientation="vertical" className="mx-2 h-7" />
      <SectionFour editor={editor} />
      <Separator orientation="vertical" className="mx-2 h-7" />
      <SectionFive editor={editor} />
    </div>
  </div>
)

const CustomDocument = Document.extend({
  content: 'heading block*',
})

export const MinimalTiptapEditor = React.forwardRef<HTMLDivElement, MinimalTiptapProps>(
  ({ value, content, onValueChange, className, editorContentClassName, ...props }, ref) => {
    const editor = useMinimalTiptapEditor({
      value,
      onUpdate: onValueChange,
      content,
      extensions: [
        CustomDocument,
        StarterKit.configure({
          document: false,
        }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            if (node.type.name === 'heading') {
              return 'Enter a heading for your quiz'
            }

            return 'Add a description for your quiz'
          },
        }),
        Image,
      ],
      ...props
    })

    const handleClick = () => {
      if (editor && !editor?.isFocused) {
        editor?.chain().focus().run()
      }
    }

    if (!editor) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex h-auto w-full flex-col focus-within:border-primary overflow-hidden',
          className
        )}
      >
        {/* <Toolbar editor={editor} /> */}

        <div className="h-full grow flex" onClick={handleClick}>
          <EditorContent editor={editor} className={cn('minimal-tiptap-editor p-6 text-center', editorContentClassName)} />
        </div>

        <LinkBubbleMenu editor={editor} />
        <ImageBubbleMenu editor={editor} />
      </div>
    )
  }
)

MinimalTiptapEditor.displayName = 'MinimalTiptapEditor'

export default MinimalTiptapEditor
