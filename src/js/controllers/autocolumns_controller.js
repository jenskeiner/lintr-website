import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  initialize() {
    console.log("Autocolumns controller initialized")
    document.querySelectorAll("div.autocolumns").forEach((container) => {
      const child = container.firstElementChild
      child.classList.add("grid", "sm:grid-cols-2", "md:grid-cols-3", "gap-4")
    })
  }
}
