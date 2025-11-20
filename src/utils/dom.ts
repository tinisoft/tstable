/**
 * @fileoverview DOM manipulation utilities
 * @module utils/dom
 */

/**
 * Get element offset relative to document
 */
export function getOffset(element: HTMLElement): { top: number; left: number } {
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset
  }
}

/**
 * Get element position relative to parent
 */
export function getPosition(element: HTMLElement): { top: number; left: number } {
  return {
    top: element.offsetTop,
    left: element.offsetLeft
  }
}

/**
 * Get element dimensions
 */
export function getDimensions(element: HTMLElement): {
  width: number
  height: number
  innerWidth: number
  innerHeight: number
  outerWidth: number
  outerHeight: number
} {
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)
  
  return {
    width: rect.width,
    height: rect.height,
    innerWidth: element.clientWidth,
    innerHeight: element.clientHeight,
    outerWidth: element.offsetWidth,
    outerHeight: element.offsetHeight
  }
}

/**
 * Check if element is visible in viewport
 */
export function isInViewport(element: HTMLElement, threshold: number = 0): boolean {
  const rect = element.getBoundingClientRect()
  
  return (
    rect.top >= -threshold &&
    rect.left >= -threshold &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
  )
}

/**
 * Scroll element into view if needed
 */
export function scrollIntoViewIfNeeded(
  element: HTMLElement,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'nearest' }
): void {
  if (!isInViewport(element)) {
    element.scrollIntoView(options)
  }
}

/**
 * Get scroll position
 */
export function getScrollPosition(element: HTMLElement | Window = window): {
  x: number
  y: number
} {
  if (element === window) {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    }
  }
  
  const el = element as HTMLElement
  return {
    x: el.scrollLeft,
    y: el.scrollTop
  }
}

/**
 * Set scroll position
 */
export function setScrollPosition(
  element: HTMLElement | Window,
  x: number,
  y: number,
  smooth: boolean = false
): void {
  if (element === window) {
    window.scrollTo({
      left: x,
      top: y,
      behavior: smooth ? 'smooth' : 'auto'
    })
  } else {
    const el = element as HTMLElement
    if (smooth) {
      el.scrollTo({
        left: x,
        top: y,
        behavior: 'smooth'
      })
    } else {
      el.scrollLeft = x
      el.scrollTop = y
    }
  }
}

/**
 * Get parent element matching selector
 */
export function getParent(
  element: HTMLElement,
  selector: string
): HTMLElement | null {
  let parent = element.parentElement
  
  while (parent) {
    if (parent.matches(selector)) {
      return parent
    }
    parent = parent.parentElement
  }
  
  return null
}

/**
 * Add class to element
 */
export function addClass(element: HTMLElement, ...classNames: string[]): void {
  element.classList.add(...classNames)
}

/**
 * Remove class from element
 */
export function removeClass(element: HTMLElement, ...classNames: string[]): void {
  element.classList.remove(...classNames)
}

/**
 * Toggle class on element
 */
export function toggleClass(element: HTMLElement, className: string, force?: boolean): void {
  element.classList.toggle(className, force)
}

/**
 * Check if element has class
 */
export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className)
}

/**
 * Set element attribute
 */
export function setAttr(
  element: HTMLElement,
  name: string,
  value: string | number | boolean
): void {
  element.setAttribute(name, String(value))
}

/**
 * Get element attribute
 */
export function getAttr(element: HTMLElement, name: string): string | null {
  return element.getAttribute(name)
}

/**
 * Remove element attribute
 */
export function removeAttr(element: HTMLElement, name: string): void {
  element.removeAttribute(name)
}

/**
 * Set element style
 */
export function setStyle(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
): void {
  Object.assign(element.style, styles)
}

/**
 * Get computed style
 */
export function getStyle(element: HTMLElement, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property)
}

/**
 * Create element
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options?: {
    className?: string
    id?: string
    attrs?: Record<string, string | number | boolean>
    styles?: Partial<CSSStyleDeclaration>
    text?: string
    html?: string
  }
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName)
  
  if (options) {
    if (options.className) element.className = options.className
    if (options.id) element.id = options.id
    if (options.attrs) {
      Object.entries(options.attrs).forEach(([key, value]) => {
        element.setAttribute(key, String(value))
      })
    }
    if (options.styles) {
      Object.assign(element.style, options.styles)
    }
    if (options.text) element.textContent = options.text
    if (options.html) element.innerHTML = options.html
  }
  
  return element
}

/**
 * Remove element from DOM
 */
export function removeElement(element: HTMLElement): void {
  element.parentElement?.removeChild(element)
}

/**
 * Get siblings
 */
export function getSiblings(element: HTMLElement): HTMLElement[] {
  const siblings: HTMLElement[] = []
  let sibling = element.parentElement?.firstElementChild
  
  while (sibling) {
    if (sibling !== element && sibling instanceof HTMLElement) {
      siblings.push(sibling)
    }
    sibling = sibling.nextElementSibling
  }
  
  return siblings
}

/**
 * Get next sibling matching selector
 */
export function getNextSibling(
  element: HTMLElement,
  selector?: string
): HTMLElement | null {
  let sibling = element.nextElementSibling
  
  while (sibling) {
    if (sibling instanceof HTMLElement) {
      if (!selector || sibling.matches(selector)) {
        return sibling
      }
    }
    sibling = sibling.nextElementSibling
  }
  
  return null
}

/**
 * Get previous sibling matching selector
 */
export function getPreviousSibling(
  element: HTMLElement,
  selector?: string
): HTMLElement | null {
  let sibling = element.previousElementSibling
  
  while (sibling) {
    if (sibling instanceof HTMLElement) {
      if (!selector || sibling.matches(selector)) {
        return sibling
      }
    }
    sibling = sibling.previousElementSibling
  }
  
  return null
}

/**
 * Wait for element to be in DOM
 */
export async function waitForElement(
  selector: string,
  timeout: number = 5000
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      resolve(element)
      return
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        observer.disconnect()
        resolve(element)
      }
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeout)
  })
}

/**
 * Create DocumentFragment from HTML string
 */
export function createFragment(html: string): DocumentFragment {
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  return template.content
}

/**
 * Detect click outside element
 */
export function onClickOutside(
  element: HTMLElement,
  callback: (event: MouseEvent) => void
): () => void {
  const handler = (event: MouseEvent) => {
    if (!element.contains(event.target as Node)) {
      callback(event)
    }
  }
  
  document.addEventListener('click', handler)
  
  return () => {
    document.removeEventListener('click', handler)
  }
}