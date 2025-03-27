# TypeScript Migration Guide

This guide provides step-by-step instructions for converting existing JavaScript Stimulus controllers to TypeScript.

## Prerequisites

- TypeScript is already set up in the project
- Rollup is configured to handle TypeScript files
- ESLint is configured for TypeScript

## Converting a JavaScript Controller to TypeScript

### 1. Create a new TypeScript file

Create a new `.ts` file in the `src/ts/controllers` directory with the same name as your JavaScript controller.

### 2. Add type annotations

Here's an example of converting a JavaScript controller to TypeScript:

**Original JavaScript (menu_controller.js):**
```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["menu"]
  
  toggle() {
    this.menuTarget.classList.toggle("hidden")
  }
  
  hide(event) {
    if (!this.element.contains(event.target)) {
      this.menuTarget.classList.add("hidden")
    }
  }
}
```

**TypeScript Version (menu_controller.ts):**
```typescript
import { Controller } from "@hotwired/stimulus"

export default class MenuController extends Controller {
  static readonly targets = ["menu"]
  
  // Define typed targets
  declare readonly menuTarget: HTMLElement
  declare readonly hasMenuTarget: boolean
  
  toggle(): void {
    this.menuTarget.classList.toggle("hidden")
  }
  
  hide(event: Event): void {
    if (!this.element.contains(event.target as Node)) {
      this.menuTarget.classList.add("hidden")
    }
  }
}
```

### 3. Update imports in app.ts

Update the import statement in `app.ts` to point to the new TypeScript controller:

```typescript
// Change this:
import MenuController from "./js/controllers/menu_controller"

// To this:
import MenuController from "./ts/controllers/menu_controller"
```

### 4. Add interfaces for complex data attributes

If your controller uses data attributes, define an interface for them:

```typescript
interface MyControllerElement extends HTMLElement {
  dataset: {
    valueValue?: string;
    optionValue?: string;
  };
}

export default class MyController extends Controller<MyControllerElement> {
  // Controller implementation
}
```

### 5. Testing

After converting a controller, test it thoroughly to ensure it works as expected.

## Best Practices

1. Convert one controller at a time
2. Add comprehensive type annotations
3. Use readonly where appropriate
4. Define explicit return types for methods
5. Use proper event typing

## Common TypeScript Patterns for Stimulus

### Values

```typescript
static readonly values = {
  name: String,
  count: Number,
  active: Boolean
}

declare nameValue: string
declare countValue: number
declare activeValue: boolean
```

### Classes

```typescript
static readonly classes = ["active", "inactive"]

declare readonly activeClass: string
declare readonly inactiveClass: string
```

### Targets

```typescript
static readonly targets = ["output", "input"]

declare readonly outputTarget: HTMLElement
declare readonly outputTargets: HTMLElement[]
declare readonly hasOutputTarget: boolean

declare readonly inputTarget: HTMLInputElement
declare readonly inputTargets: HTMLInputElement[]
declare readonly hasInputTarget: boolean
```
