import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  initialize() {
    document
      .querySelectorAll("div.admonition.note.collapsible > div.title")
      .forEach((noteTitle) => {
        const button = document.createElement("button")
        button.className = "flex-shrink"
        button.type = "button"
        button.title = "Expand/Collapse"

        const expand = document.createElement("span")
        expand.className = "expand-indicator"
        expand.innerHTML =
          '<svg class="fill-current w-6 h-6" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5v15m7.5-7.5h-15" stroke-linecap="round" stroke-linejoin="round"></path></svg>'

        const collapse = document.createElement("span")
        collapse.className = "collapse-indicator hidden"
        collapse.innerHTML =
          '<svg class="fill-current w-6 h-6" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 12h-15" stroke-linecap="round" stroke-linejoin="round"></path></svg>'

        button.appendChild(expand)
        button.appendChild(collapse)

        // Get content element.
        const content = noteTitle.parentElement.querySelector(".content")

        button.addEventListener("click", () => {
          expand.classList.toggle("hidden")
          collapse.classList.toggle("hidden")
          content.classList.toggle("hidden")
        })

        noteTitle.appendChild(button)
      })
  }
}
