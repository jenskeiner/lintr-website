import { Controller } from "@hotwired/stimulus"

let copyIcon =
  '<span class="svg-icon"><svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 0 24 24" width="16px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></span>'
let checkmarkIcon =
  '<span class="svg-icon"><svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 0 24 24" width="16px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></span>'

export default class extends Controller {
  initialize() {
    document
      .querySelectorAll("div.highlight > pre > code")
      .forEach((codeBlock) => {
        const button = document.createElement("button")
        button.className = "clipboard-button"
        button.type = "button"
        button.title = "Copy to clipboard"
        button.innerHTML = copyIcon
        /*const _copyIcon = copyIcon.cloneNode()
        const _checkmarkIcon = checkmarkIcon.cloneNode()
        button.appendChild(_copyIcon)*/
        button.addEventListener("click", () => {
          navigator.clipboard
            .writeText((codeBlock.innerText || "").trim())
            .then(
              () => {
                button.blur()
                button.innerHTML = checkmarkIcon
                //button.replaceChild(_checkmarkIcon, _copyIcon)
                setTimeout(() => (button.innerHTML = copyIcon), 2000)
              },
              () => (button.innerHTML = "Error"),
            )
        })
        const pre = codeBlock.parentNode
        pre.parentNode.insertBefore(button, pre)
      })
  }
}
