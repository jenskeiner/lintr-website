// Type definitions for Stimulus
// This enhances the existing @hotwired/stimulus types

declare module "@hotwired/stimulus" {
  export interface Controller<Element extends HTMLElement = HTMLElement> {
    readonly element: Element;
  }
}
