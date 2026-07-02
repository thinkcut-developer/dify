import type { ChatItem } from '../../../types'
import type { MarkdownProps } from '@/app/components/base/markdown'
import { render, screen } from '@testing-library/react'
import BasicContent from '../basic-content'

// Mock Markdown component used only in tests
vi.mock('@/app/components/base/markdown', () => ({
  Markdown: ({ content, className }: MarkdownProps) => (
    <div data-testid="basic-content-markdown" data-content={String(content)} className={className}>
      {String(content)}
    </div>
  ),
}))

describe('BasicContent', () => {
  const mockItem = {
    id: '1',
    content: 'Hello World',
    isAnswer: true,
  }

  it('renders content correctly', () => {
    render(<BasicContent item={mockItem as ChatItem} />)
    const markdown = screen.getByTestId('basic-content-markdown')
    expect(markdown).toHaveAttribute('data-content', 'Hello World')
  })

  it('renders logAnnotation content if present', () => {
    const itemWithAnnotation = {
      ...mockItem,
      annotation: {
        logAnnotation: {
          content: 'Annotated Content',
        },
      },
    }
    render(<BasicContent item={itemWithAnnotation as ChatItem} />)
    const markdown = screen.getByTestId('basic-content-markdown')
    expect(markdown).toHaveAttribute('data-content', 'Annotated Content')
  })

  it('renders empty string if logAnnotation content is missing', () => {
    const itemWithEmptyAnnotation = {
      ...mockItem,
      annotation: {
        logAnnotation: {
          content: '',
        },
      },
    }
    const { rerender } = render(<BasicContent item={itemWithEmptyAnnotation as ChatItem} />)
    expect(screen.getByTestId('basic-content-markdown')).toHaveAttribute('data-content', '')

    const itemWithUndefinedAnnotation = {
      ...mockItem,
      annotation: {
        logAnnotation: {},
      },
    }
    rerender(<BasicContent item={itemWithUndefinedAnnotation as ChatItem} />)
    expect(screen.getByTestId('basic-content-markdown')).toHaveAttribute('data-content', '')
  })

  it('wraps Windows UNC paths in backticks', () => {
    const itemWithUNC = {
      ...mockItem,
      content: '\\\\server\\share\\file.txt',
    }
    render(<BasicContent item={itemWithUNC as ChatItem} />)
    const markdown = screen.getByTestId('basic-content-markdown')
    expect(markdown).toHaveAttribute('data-content', '`\\\\server\\share\\file.txt`')
  })

  it('does not wrap content in backticks if it already is', () => {
    const itemWithBackticks = {
      ...mockItem,
      content: '`\\\\server\\share\\file.txt`',
    }
    render(<BasicContent item={itemWithBackticks as ChatItem} />)
    const markdown = screen.getByTestId('basic-content-markdown')
    expect(markdown).toHaveAttribute('data-content', '`\\\\server\\share\\file.txt`')
  })

  it('does not wrap backslash strings that are not UNC paths', () => {
    const itemWithBackslashes = {
      ...mockItem,
      content: '\\not-a-unc',
    }
    render(<BasicContent item={itemWithBackslashes as ChatItem} />)
    const markdown = screen.getByTestId('basic-content-markdown')
    expect(markdown).toHaveAttribute('data-content', '\\not-a-unc')
  })

  it('applies error class when isError is true', () => {
    const errorItem = {
      ...mockItem,
      isError: true,
    }
    render(<BasicContent item={errorItem as ChatItem} />)
    const markdown = screen.getByTestId('basic-content-markdown')
    expect(markdown).toHaveClass('!text-[#F04438]')
  })

  it('renders non-string content without attempting to wrap (covers typeof !== "string" branch)', () => {
    const itemWithNonStringContent = {
      ...mockItem,
      content: 12345,
    }
    render(<BasicContent item={itemWithNonStringContent as unknown as ChatItem} />)
    const markdown = screen.getByTestId('basic-content-markdown')
    expect(markdown).toHaveAttribute('data-content', '12345')
  })

  it('converts a standalone image url into markdown image syntax', () => {
    const itemWithImageUrl = {
      ...mockItem,
      content: 'https://example.com/profile.jpg',
    }

    render(<BasicContent item={itemWithImageUrl as ChatItem} />)

    expect(screen.getByTestId('basic-content-markdown')).toHaveAttribute('data-content', '![](https://example.com/profile.jpg)')
  })

  it('converts labeled image url lines into label plus markdown image syntax', () => {
    const itemWithLabeledImageUrl = {
      ...mockItem,
      content: 'Profil Fotograf:\nhttps://example.com/profile.jpg',
    }

    render(<BasicContent item={itemWithLabeledImageUrl as ChatItem} />)

    expect(screen.getByTestId('basic-content-markdown')).toHaveAttribute('data-content', 'Profil Fotograf:\n![](https://example.com/profile.jpg)')
  })

  it('converts single-line label and image url content into an embedded image block', () => {
    const itemWithInlineLabeledImageUrl = {
      ...mockItem,
      content: 'Vesikalik Fotograf: https://example.com/profile.jpg',
    }

    render(<BasicContent item={itemWithInlineLabeledImageUrl as ChatItem} />)

    expect(screen.getByTestId('basic-content-markdown')).toHaveAttribute('data-content', 'Vesikalik Fotograf:\n\n![](https://example.com/profile.jpg)')
  })
})
