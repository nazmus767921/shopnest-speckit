"use client"

import React, { useState, useEffect } from "react"
import { useEditor, EditorContent, useEditorState } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { BoldIcon, ItalicIcon, StrikethroughIcon, Heading1Icon, Heading2Icon, Heading3Icon, ListIcon, ListOrderedIcon, QuoteIcon, CodeIcon, UndoIcon, RedoIcon, LinkIcon, UnlinkIcon, XIcon, CheckIcon } from "@/lib/icons";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

  // Keep editor content in sync with external value changes
  useEffect(() => {
    if (!editor) return

    const current = editor.getHTML()
    const normalizedCurrent = editor.isEmpty || current === "<p></p>" || current === "<p><br></p>" ? "" : current
    
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
        "flex flex-col w-full bg-background text-foreground transition-all duration-200 border border-input rounded-2xl overflow-hidden focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 p-2 gap-1 select-none">
        {isLinking ? (
          <div className="flex items-center gap-1.5 w-full">
            <Input
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
              className="flex-1 h-8 text-xs px-3 focus-visible:ring-1"
              autoFocus
            />
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={handleSetLink}
              className="rounded-full h-8 w-8 shrink-0"
            >
              <CheckIcon className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsLinking(false)
                setLinkUrl("")
              }}
              className="rounded-full h-8 w-8 shrink-0"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-0.5">
              {/* Headings */}
              <Button
                type="button"
                variant={activeStates.h1 ? "default" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className="h-8 w-8 rounded-md shrink-0"
                title="Heading 1"
              >
                <Heading1Icon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant={activeStates.h2 ? "default" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="h-8 w-8 rounded-md shrink-0"
                title="Heading 2"
              >
                <Heading2Icon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant={activeStates.h3 ? "default" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className="h-8 w-8 rounded-md shrink-0"
                title="Heading 3"
              >
                <Heading3Icon className="w-4 h-4" />
              </Button>

              <div className="w-px h-5 bg-border mx-1" />

              {/* Formatting */}
              <Button
                type="button"
                variant={activeStates.bold ? "default" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className="h-8 w-8 rounded-md shrink-0"
                title="Bold"
              >
                <BoldIcon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant={activeStates.italic ? "default" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className="h-8 w-8 rounded-md shrink-0"
                title="Italic"
              >
                <ItalicIcon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant={activeStates.strike ? "default" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className="h-8 w-8 rounded-md shrink-0"
                title="Strike-through"
              >
                <StrikethroughIcon className="w-4 h-4" />
              </Button>

              <div className="w-px h-5 bg-border mx-1" />

              {/* Lists */}
              <Button
                type="button"
                variant={activeStates.bulletList ? "default" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="h-8 w-8 rounded-md shrink-0"
                title="Bullet List"
              >
                <ListIcon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant={activeStates.orderedList ? "default" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className="h-8 w-8 rounded-md shrink-0"
                title="Numbered List"
              >
                <ListOrderedIcon className="w-4 h-4" />
              </Button>

              <div className="w-px h-5 bg-border mx-1" />

              {/* Quotes & Code */}
              <Button
                type="button"
                variant={activeStates.blockquote ? "default" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className="h-8 w-8 rounded-md shrink-0"
                title="Blockquote"
              >
                <QuoteIcon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant={activeStates.code ? "default" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className="h-8 w-8 rounded-md shrink-0"
                title="Code"
              >
                <CodeIcon className="w-4 h-4" />
              </Button>

              <div className="w-px h-5 bg-border mx-1" />

              {/* Links */}
              <Button
                type="button"
                variant={activeStates.link ? "default" : "ghost"}
                size="icon"
                onClick={handleOpenLinkInput}
                className="h-8 w-8 rounded-md shrink-0"
                title="Insert Link"
              >
                <LinkIcon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().unsetLink().run()}
                disabled={!activeStates.link}
                className="h-8 w-8 rounded-md shrink-0"
                title="Remove Link"
              >
                <UnlinkIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* History */}
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!activeStates.canUndo}
                className="h-8 w-8 rounded-md shrink-0"
                title="Undo"
              >
                <UndoIcon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!activeStates.canRedo}
                className="h-8 w-8 rounded-md shrink-0"
                title="Redo"
              >
                <RedoIcon className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Editor Workspace */}
      <div 
        className="min-h-[150px] p-4 cursor-text focus-visible:outline-none" 
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent 
          editor={editor} 
          className="flex-1 prose prose-stone dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline focus:outline-none" 
        />
      </div>

      {/* Status Bar / Word Count */}
      <div className="flex items-center justify-end px-4 py-2 text-xs text-muted-foreground font-mono gap-4 select-none border-t border-border bg-muted/20">
        <span>{activeStates.words} words</span>
        <span>{activeStates.characters} characters</span>
      </div>
    </div>
  )
}
