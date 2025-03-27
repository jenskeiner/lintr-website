import { Controller } from "@hotwired/stimulus";

// TypeScript interface for data attributes
/*interface HelloControllerElement extends HTMLElement {
  dataset: {
    nameValue?: string;
  };
}*/

// TypeScript controller class with proper type annotations
export default class HelloController extends Controller<HTMLFormElement> {
  static readonly targets = ["output"];
  
  // Define typed targets
  declare readonly outputTarget: HTMLElement;
  declare readonly hasOutputTarget: boolean;
  
  // Define typed values
  static readonly values = {
    name: String
  };
  declare nameValue: string;
  
  connect(): void {
    this.greet();
  }
  
  greet(): void {
    if (this.hasOutputTarget) {
      this.outputTarget.textContent = `Hello, ${this.nameValue || 'World'}!`;
    }
  }
}
