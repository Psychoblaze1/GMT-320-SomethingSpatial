import React, { useEffect } from 'react';
import { Box, styled, IconButton, Divider, ButtonGroup, Tooltip } from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
  FormatQuote as QuoteIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon
} from '@mui/icons-material';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { CodeNode } from '@lexical/code';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $createParagraphNode,
  $getRoot
} from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';

import { uploadImage } from '../../services/blogService';

// Styled components
const EditorContainer = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
}));

const ToolbarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
  flexWrap: 'wrap',
}));

const EditorInner = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '300px',
  '& .editor-input': {
    minHeight: '300px',
    padding: theme.spacing(2),
    fontSize: '16px',
    fontFamily: theme.typography.fontFamily,
    outline: 'none',
    '& p': {
      margin: 0,
      marginBottom: theme.spacing(1),
    },
    '& h1': {
      fontSize: '2em',
      fontWeight: 'bold',
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
    '& h2': {
      fontSize: '1.5em',
      fontWeight: 'bold',
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
    '& h3': {
      fontSize: '1.17em',
      fontWeight: 'bold',
      marginTop: theme.spacing(1.5),
      marginBottom: theme.spacing(1),
    },
    '& ul, & ol': {
      paddingLeft: theme.spacing(4),
      marginBottom: theme.spacing(1),
    },
    '& blockquote': {
      borderLeft: `4px solid ${theme.palette.primary.main}`,
      paddingLeft: theme.spacing(2),
      marginLeft: 0,
      marginBottom: theme.spacing(1),
      fontStyle: 'italic',
      color: theme.palette.text.secondary,
    },
    '& code': {
      backgroundColor: theme.palette.action.hover,
      padding: '2px 6px',
      borderRadius: theme.shape.borderRadius,
      fontFamily: 'monospace',
    },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'underline',
    },
    '& img': {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: theme.shape.borderRadius,
      margin: theme.spacing(1, 0),
    },
  },
  '& .editor-placeholder': {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
    color: theme.palette.text.secondary,
    pointerEvents: 'none',
  },
}));

// Toolbar Component
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatElement = (format) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format);
  };

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const imageUrl = await uploadImage(file, 'blog/content');
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const imageNode = document.createElement('img');
              imageNode.src = imageUrl;
              imageNode.alt = 'Uploaded image';
              selection.insertRawText(`<img src="${imageUrl}" alt="Uploaded image" />`);
            }
          });
        } catch (error) {
          console.error('Failed to upload image:', error);
          alert('Failed to upload image');
        }
      }
    };
    input.click();
  };

  return (
    <ToolbarContainer>
      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Bold">
          <IconButton size="small" onClick={() => formatText('bold')}>
            <BoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton size="small" onClick={() => formatText('italic')}>
            <ItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Underline">
          <IconButton size="small" onClick={() => formatText('underline')}>
            <UnderlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Code">
          <IconButton size="small" onClick={() => formatText('code')}>
            <CodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Align Left">
          <IconButton size="small" onClick={() => formatElement('left')}>
            <AlignLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Center">
          <IconButton size="small" onClick={() => formatElement('center')}>
            <AlignCenterIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Right">
          <IconButton size="small" onClick={() => formatElement('right')}>
            <AlignRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Bullet List">
          <IconButton size="small">
            <BulletListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton size="small">
            <NumberListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Quote">
          <IconButton size="small">
            <QuoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Tooltip title="Insert Image">
        <IconButton size="small" variant="outlined" onClick={handleImageUpload}>
          <ImageIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </ToolbarContainer>
  );
}

// Plugin to sync editor state with parent component
function OnChangeHTMLPlugin({ onChange }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor);
        onChange(html);
      });
    });
  }, [editor, onChange]);

  return null;
}

// Plugin to set initial HTML content
function InitialContentPlugin({ initialHtml }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialHtml && initialHtml !== '<p><br></p>') {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialHtml, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        root.select();
        nodes.forEach(node => root.append(node));
      });
    }
  }, []);

  return null;
}

// Main RichTextEditor Component
const RichTextEditor = ({ value, onChange, placeholder = 'Write your content here...' }) => {
  const initialConfig = {
    namespace: 'BlogEditor',
    theme: {
      paragraph: 'editor-paragraph',
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
        code: 'editor-text-code',
      },
    },
    onError: (error) => {
      console.error('Lexical Editor Error:', error);
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      LinkNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorContainer>
        <ToolbarPlugin />
        <EditorInner>
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div className="editor-placeholder">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangeHTMLPlugin onChange={onChange} />
          <InitialContentPlugin initialHtml={value} />
          <HistoryPlugin />
        </EditorInner>
      </EditorContainer>
    </LexicalComposer>
  );
};

export default RichTextEditor;
