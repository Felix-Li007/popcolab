'use client';

import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  type NodeViewProps,
} from '@tiptap/react';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';
import {
  Bold,
  Eraser,
  Heading,
  ImagePlus,
  Italic,
  List,
  Palette,
  Redo2,
  Undo2,
  Upload,
} from 'lucide-react';

interface TiptapEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  className?: string;
  bodyClassName?: string;
}

const DEFAULT_TEXT_COLOR = '#111827';
const DEFAULT_IMAGE_WIDTH = 280;
const DEFAULT_IMAGE_HEIGHT = 180;
const DEFAULT_IMAGE_MIN_SIZE = 120;

type EdgeHandle = 'top' | 'right' | 'bottom' | 'left';
type CornerHandle = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
type ResizeHandle =
  | { type: 'edge'; edge: EdgeHandle }
  | { type: 'corner'; corner: CornerHandle };

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }

      reject(new Error('Failed to read image file'));
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function ResizableImageNode({
  node,
  selected,
  updateAttributes,
}: Readonly<NodeViewProps>) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const resizeStateRef = useRef<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const width = typeof node.attrs.width === 'number' ? node.attrs.width : null;
  const height =
    typeof node.attrs.height === 'number' ? node.attrs.height : null;
  const displayWidth = width ?? DEFAULT_IMAGE_WIDTH;
  const displayHeight = height ?? DEFAULT_IMAGE_HEIGHT;

  useEffect(() => {
    const imageElement = imageRef.current;
    if (!imageElement) return;

    imageElement.style.width = `${displayWidth}px`;
    imageElement.style.height = `${displayHeight}px`;
    imageElement.style.maxWidth = 'none';
    imageElement.style.objectFit = 'fill';
  }, [displayWidth, displayHeight]);

  const startResize = (
    handle: ResizeHandle,
    event: React.MouseEvent<HTMLElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const bounds = imageRef.current?.getBoundingClientRect();

    resizeStateRef.current = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: width ?? bounds?.width ?? DEFAULT_IMAGE_WIDTH,
      startHeight: height ?? bounds?.height ?? DEFAULT_IMAGE_HEIGHT,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      if (resizeState.handle.type === 'edge') {
        if (
          resizeState.handle.edge === 'left' ||
          resizeState.handle.edge === 'right'
        ) {
          const deltaX = moveEvent.clientX - resizeState.startX;
          const nextWidth = Math.max(
            DEFAULT_IMAGE_MIN_SIZE,
            Math.round(
              resizeState.startWidth +
                (resizeState.handle.edge === 'right' ? deltaX : -deltaX)
            )
          );

          updateAttributes({
            width: nextWidth,
            height: resizeState.startHeight,
          });
          return;
        }

        const deltaY = moveEvent.clientY - resizeState.startY;
        const nextHeight = Math.max(
          DEFAULT_IMAGE_MIN_SIZE,
          Math.round(
            resizeState.startHeight +
              (resizeState.handle.edge === 'bottom' ? deltaY : -deltaY)
          )
        );

        updateAttributes({
          width: resizeState.startWidth,
          height: nextHeight,
        });
        return;
      }

      const cornerDirection: Record<
        CornerHandle,
        { xSign: 1 | -1; ySign: 1 | -1 }
      > = {
        'top-left': { xSign: -1, ySign: -1 },
        'top-right': { xSign: 1, ySign: -1 },
        'bottom-right': { xSign: 1, ySign: 1 },
        'bottom-left': { xSign: -1, ySign: 1 },
      };

      const { xSign, ySign } = cornerDirection[resizeState.handle.corner];
      const horizontalDelta = (moveEvent.clientX - resizeState.startX) * xSign;
      const verticalDelta = (moveEvent.clientY - resizeState.startY) * ySign;
      const nextWidth = Math.max(
        DEFAULT_IMAGE_MIN_SIZE,
        Math.round(resizeState.startWidth + horizontalDelta)
      );
      const nextHeight = Math.max(
        DEFAULT_IMAGE_MIN_SIZE,
        Math.round(resizeState.startHeight + verticalDelta)
      );

      updateAttributes({
        width: nextWidth,
        height: nextHeight,
      });
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
      globalThis.removeEventListener('mousemove', handleMouseMove);
      globalThis.removeEventListener('mouseup', handleMouseUp);
    };

    globalThis.addEventListener('mousemove', handleMouseMove);
    globalThis.addEventListener('mouseup', handleMouseUp);
  };

  const edgeHandleClass =
    'absolute z-10 bg-blue-400/0 transition-colors opacity-0 group-hover:opacity-100 group-hover:bg-blue-400/20';
  const cornerHandleClass =
    'absolute z-20 h-3 w-3 rounded-sm border border-blue-600 bg-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100';

  return (
    <NodeViewWrapper
      as="span"
      className={`group relative mx-1 inline-block max-w-full align-middle rounded-md border border-dashed p-1 transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-50/30'
          : 'border-transparent hover:border-blue-300'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt || node.attrs.title || 'Inserted image'}
        className="block max-w-none rounded-sm object-fill"
        width={displayWidth}
        height={displayHeight}
      />

      <button
        type="button"
        aria-label="Resize top edge"
        title="Resize top edge"
        onMouseDown={event => startResize({ type: 'edge', edge: 'top' }, event)}
        className={`${edgeHandleClass} left-3 right-3 top-0 h-2 cursor-ns-resize`}
      />
      <button
        type="button"
        aria-label="Resize right edge"
        title="Resize right edge"
        onMouseDown={event =>
          startResize({ type: 'edge', edge: 'right' }, event)
        }
        className={`${edgeHandleClass} right-0 top-3 bottom-3 w-2 cursor-ew-resize`}
      />
      <button
        type="button"
        aria-label="Resize bottom edge"
        title="Resize bottom edge"
        onMouseDown={event =>
          startResize({ type: 'edge', edge: 'bottom' }, event)
        }
        className={`${edgeHandleClass} left-3 right-3 bottom-0 h-2 cursor-ns-resize`}
      />
      <button
        type="button"
        aria-label="Resize left edge"
        title="Resize left edge"
        onMouseDown={event =>
          startResize({ type: 'edge', edge: 'left' }, event)
        }
        className={`${edgeHandleClass} left-0 top-3 bottom-3 w-2 cursor-ew-resize`}
      />

      <button
        type="button"
        aria-label="Resize top left corner"
        title="Resize top left corner"
        onMouseDown={event =>
          startResize({ type: 'corner', corner: 'top-left' }, event)
        }
        className={`${cornerHandleClass} left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize`}
      />
      <button
        type="button"
        aria-label="Resize top right corner"
        title="Resize top right corner"
        onMouseDown={event =>
          startResize({ type: 'corner', corner: 'top-right' }, event)
        }
        className={`${cornerHandleClass} right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize`}
      />
      <button
        type="button"
        aria-label="Resize bottom right corner"
        title="Resize bottom right corner"
        onMouseDown={event =>
          startResize({ type: 'corner', corner: 'bottom-right' }, event)
        }
        className={`${cornerHandleClass} bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize`}
      />
      <button
        type="button"
        aria-label="Resize bottom left corner"
        title="Resize bottom left corner"
        onMouseDown={event =>
          startResize({ type: 'corner', corner: 'bottom-left' }, event)
        }
        className={`${cornerHandleClass} bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize`}
      />
    </NodeViewWrapper>
  );
}

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => {
          const value = element.getAttribute('width');
          return value ? Number(value) : null;
        },
        renderHTML: attributes =>
          attributes.width ? { width: attributes.width } : {},
      },
      height: {
        default: null,
        parseHTML: element => {
          const value = element.getAttribute('height');
          return value ? Number(value) : null;
        },
        renderHTML: attributes =>
          attributes.height ? { height: attributes.height } : {},
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNode);
  },
});

const TiptapEditor = ({
  value = '',
  onChange,
  className = '',
  bodyClassName = '',
}: TiptapEditorProps) => {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      ResizableImage.configure({ inline: true, allowBase64: true }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      handlePaste(_view, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageFile = items
          .map(item => item.getAsFile())
          .find(file => file?.type.startsWith('image/'));

        if (!imageFile) {
          return false;
        }

        event.preventDefault();
        void fileToDataUrl(imageFile).then(dataUrl => {
          editor?.chain().focus().setImage({ src: dataUrl }).run();
        });
        return true;
      },
      handleDrop(_view, event) {
        const file = Array.from(event.dataTransfer?.files ?? []).find(item =>
          item.type.startsWith('image/')
        );

        if (!file) {
          return false;
        }

        event.preventDefault();
        void fileToDataUrl(file).then(dataUrl => {
          editor?.chain().focus().setImage({ src: dataUrl }).run();
        });
        return true;
      },
    },
  });

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const handleImageInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    editor?.chain().focus().setImage({ src: dataUrl }).run();
    event.target.value = '';
  };

  const insertImageFromUrl = () => {
    const imageUrl = globalThis.prompt?.('Enter image URL');

    if (!imageUrl?.trim()) {
      return;
    }

    editor?.chain().focus().setImage({ src: imageUrl.trim() }).run();
  };

  const toolbarButtonClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/70 bg-white/80 text-gray-700 transition-colors hover:bg-white hover:text-gray-900';
  const activeToolbarButtonClass =
    'bg-slate-900 text-white hover:bg-slate-900 hover:text-white';
  const toolbarGroupClass =
    'flex items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white/70 p-1 backdrop-blur';

  return (
    <div
      className={`flex h-[320px] flex-col overflow-hidden border border-slate-200 bg-white ${className}`}
    >
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 bg-slate-50/80 px-2.5 py-2.5">
        <div className={toolbarGroupClass}>
          <button
            type="button"
            aria-label="Bold"
            title="Bold"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`${toolbarButtonClass} ${
              editor?.isActive('bold') ? activeToolbarButtonClass : ''
            }`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Italic"
            title="Italic"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`${toolbarButtonClass} ${
              editor?.isActive('italic') ? activeToolbarButtonClass : ''
            }`}
          >
            <Italic className="h-4 w-4" />
          </button>
        </div>

        <div className={toolbarGroupClass}>
          <button
            type="button"
            aria-label="Heading 1"
            title="Heading 1"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`${toolbarButtonClass} ${
              editor?.isActive('heading', { level: 1 })
                ? activeToolbarButtonClass
                : ''
            }`}
          >
            <Heading className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Heading 2"
            title="Heading 2"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`${toolbarButtonClass} ${
              editor?.isActive('heading', { level: 2 })
                ? activeToolbarButtonClass
                : ''
            }`}
          >
            <Heading className="h-4 w-4" />
          </button>
        </div>

        <div className={toolbarGroupClass}>
          <button
            type="button"
            aria-label="Bullet list"
            title="Bullet list"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`${toolbarButtonClass} ${
              editor?.isActive('bulletList') ? activeToolbarButtonClass : ''
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Clear formatting"
            title="Clear formatting"
            onClick={() => editor?.chain().focus().unsetAllMarks().run()}
            className={toolbarButtonClass}
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>

        <div className={toolbarGroupClass}>
          <button
            type="button"
            aria-label="Insert image by URL"
            title="Insert image by URL"
            onClick={insertImageFromUrl}
            className={toolbarButtonClass}
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Upload image"
            title="Upload image"
            onClick={openImagePicker}
            className={toolbarButtonClass}
          >
            <Upload className="h-4 w-4" />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Insert image"
            title="Insert image"
            onChange={handleImageInputChange}
          />
        </div>

        <div className={toolbarGroupClass}>
          <label className="flex h-8 items-center gap-1.5 rounded-md border border-white/70 bg-white/80 px-1.5 transition-colors hover:bg-white">
            <Palette className="h-4 w-4 text-gray-600" />
            <input
              type="color"
              value={
                editor?.getAttributes('textStyle').color ?? DEFAULT_TEXT_COLOR
              }
              onChange={event => {
                editor?.chain().focus().setColor(event.target.value).run();
              }}
              className="h-7 w-7 cursor-pointer rounded border border-gray-200 bg-white p-0"
              aria-label="Text color"
              title="Text color"
            />
          </label>
        </div>

        <div className={toolbarGroupClass}>
          <button
            type="button"
            aria-label="Undo"
            title="Undo"
            onClick={() => editor?.chain().focus().undo().run()}
            className={toolbarButtonClass}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Redo"
            title="Redo"
            onClick={() => editor?.chain().focus().redo().run()}
            className={toolbarButtonClass}
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none px-0.5 py-2 focus:outline-none"
          style={{
            minHeight: 0,
          }}
        />
      </div>
    </div>
  );
};

export default TiptapEditor;
