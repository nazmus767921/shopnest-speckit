"use client"

import React, { useState, useEffect } from "react"
import { useEditor, EditorContent, useEditorState } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  X,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Write your content here...",
  className
}: RichTextEditorProps) {
  const [isLinking, setIsLinking] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-primary underline hover:opacity-80 transition-opacity"
        }
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty"
      })
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Normalize empty tags like <p></p> to empty string
      const isEmpty = editor.isEmpty || html === "<p></p>" || html === "<p><br></p>"
      onChange(isEmpty ? "" : html)
    },
    onBlur: () => {
      onBlur?.()
    }
  })

  // Keep editor content in sync with external value changes (e.g. form reset or initial load)
  useEffect(() => {
    if (!editor) return

    const current = editor.getHTML()
    const normalizedCurrent = editor.isEmpty || current === "<p></p>" || current === "<p><br></p>" ? "" : current
    
    // Only update if value is different AND editor is not focused (meaning it's an external change)
    if (value !== normalizedCurrent && !editor.isFocused) {
      editor.commands.setContent(value, false)
    }
  }, [value, editor])

  const handleSetLink = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (linkUrl.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      let url = linkUrl.trim()
      // Normalize external URLs
      if (!/^https?:\/\//i.test(url) && !/^\//.test(url)) {
        url = `https://${url}`
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }
    setIsLinking(false)
    setLinkUrl("")
  }

  const handleOpenLinkInput = () => {
    const previousUrl = editor.getAttributes("link").href || ""
    setLinkUrl(previousUrl)
    setIsLinking(true)
  }

  const activeStates = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return {
          h1: false, h2: false, h3: false,
          bold: false, italic: false, strike: false,
          bulletList: false, orderedList: false,
          blockquote: false, code: false, link: false,
          canUndo: false, canRedo: false,
          characters: 0, words: 0
        }
      }
      
      const text = ctx.editor.getText().trim()
      
      return {
        h1: ctx.editor.isActive("heading", { level: 1 }),
        h2: ctx.editor.isActive("heading", { level: 2 }),
        h3: ctx.editor.isActive("heading", { level: 3 }),
        bold: ctx.editor.isActive("bold"),
        italic: ctx.editor.isActive("italic"),
        strike: ctx.editor.isActive("strike"),
        bulletList: ctx.editor.isActive("bulletList"),
        orderedList: ctx.editor.isActive("orderedList"),
        blockquote: ctx.editor.isActive("blockquote"),
        code: ctx.editor.isActive("code"),
        link: ctx.editor.isActive("link"),
        canUndo: ctx.editor.can().undo(),
        canRedo: ctx.editor.can().redo(),
        characters: ctx.editor.getText().length,
        words: text === "" ? 0 : text.split(/\s+/).length
      }
    }
  })

  if (!editor) {
    return null
  }

  return (

    <div
      className={cn(
        "flex flex-col w-full bg-transparent text-ink font-sans transition-all duration-200",
        className
      )}
    >
      {/* Toolbar */}
      <div className="sticky top-[73px] z-30 flex flex-wrap items-center justify-between border-y border-hairline-light py-1.5 bg-canvas-cream/95 backdrop-blur-md gap-1 mb-4">
        {isLinking ? (
          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              placeholder="Enter URL (e.g. google.com or /about)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSetLink()
                }
              }}
              className="flex-1 h-8 text-micro bg-canvas-light text-ink border border-hairline-light rounded-full px-3 focus:outline-none focus:border-shade-60"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSetLink}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-on-primary hover:bg-shade-70 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsLinking(false)
                setLinkUrl("")
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-hairline-light text-ink bg-canvas-light hover:bg-hairline-light transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-0.5">
              {/* Headings */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                  activeStates.h1
                    ? "bg-primary text-on-primary hover:bg-shade-70 font-bold"
                    : "text-ink hover:bg-hairline-light"
                )}
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                  activeStates.h2
                    ? "bg-primary text-on-primary hover:bg-shade-70 font-bold"
                    : "text-ink hover:bg-hairline-light"
                )}
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                  activeStates.h3
                    ? "bg-primary text-on-primary hover:bg-shade-70 font-bold"
                    : "text-ink hover:bg-hairline-light"
                )}
                title="Heading 3"
              >
                <Heading3 className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-hairline-light mx-1" />

              {/* Formatting */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                  activeStates.bold
                    ? "bg-primary text-on-primary hover:bg-shade-70 font-bold"
                    : "text-ink hover:bg-hairline-light"
                )}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                  activeStates.italic
                    ? "bg-primary text-on-primary hover:bg-shade-70 italic"
                    : "text-ink hover:bg-hairline-light"
                )}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                  activeStates.strike
                    ? "bg-primary text-on-primary hover:bg-shade-70"
                    : "text-ink hover:bg-hairline-light"
                )}
                title="Strike-through"
              >
                <Strikethrough className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-hairline-light mx-1" />

              {/* Lists */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                  activeStates.bulletList
                    ? "bg-primary text-on-primary hover:bg-shade-70"
                    : "text-ink hover:bg-hairline-light"
                )}
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                  activeStates.orderedList
                    ? "bg-primary text-on-primary hover:bg-shade-70"
                    : "text-ink hover:bg-hairline-light"
                )}
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-hairline-light mx-1" />

              {/* Quotes & Code */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                  activeStates.blockquote
                    ? "bg-primary text-on-primary hover:bg-shade-70"
                    : "text-ink hover:bg-hairline-light"
                )}
                title="Blockquote"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                  activeStates.code
                    ? "bg-primary text-on-primary hover:bg-shade-70"
                    : "text-ink hover:bg-hairline-light"
                )}
                title="Code"
              >
                <Code className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-hairline-light mx-1" />

              {/* Links */}
              <button
                type="button"
                onClick={handleOpenLinkInput}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                  activeStates.link
                    ? "bg-primary text-on-primary hover:bg-shade-70"
                    : "text-ink hover:bg-hairline-light"
                )}
                title="Insert Link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().unsetLink().run()}
                disabled={!activeStates.link}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink hover:bg-hairline-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Remove Link"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </div>

            {/* History */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!activeStates.canUndo}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink hover:bg-hairline-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!activeStates.canRedo}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink hover:bg-hairline-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Editor Workspace */}
      <div className="min-h-[500px] cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} className="flex-1 prose prose-stone max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline focus:outline-none" />
      </div>

      {/* Status Bar / Word Count */}
      <div className="flex items-center justify-end py-4 text-micro text-shade-40 font-mono gap-4 select-none border-t border-hairline-light mt-8">
        <span>{activeStates.words} words</span>
        <span>{activeStates.characters} characters</span>
      </div>
    </div>
  )
}
