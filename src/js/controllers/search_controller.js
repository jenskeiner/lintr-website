import { Controller } from "@hotwired/stimulus"
import lunr from "lunr"

export default class extends Controller {
  static targets = ["container", "overlay", "meta", "query", "index", "output", "list"]

  connect() {
    this.searchIndex = null
    // Set up the clickOutside event
    this.clickOutsideEventListener = this.collapse.bind(this)
  }
  
  expand(event) {
    event.stopPropagation() // Prevent immediate collapse
    
    if (!this.containerTarget.classList.contains("search-expanded")) {
      this.containerTarget.classList.add("search-expanded")
      this.overlayTarget.classList.add("search-expanded")
      this.outputTarget.classList.add("search-expanded")
      this.queryTarget.classList.add("search-expanded")
      
      // Add a global click listener to detect clicks outside
      document.addEventListener("click", this.clickOutsideEventListener)
    }
  }
  
  collapse(event) {
    // Prevent collapse if the click is on the container itself
    if (event && this.containerTarget.contains(event.target)) {
      return
    }
    
    this.containerTarget.classList.remove("search-expanded")
    this.overlayTarget.classList.remove("search-expanded")
    this.outputTarget.classList.remove("search-expanded")
    this.queryTarget.classList.remove("search-expanded")
    
    // Remove the global listener when collapsed
    document.removeEventListener("click", this.clickOutsideEventListener)
  }
  
  // Clean up when controller is disconnected
  disconnect() {
    document.removeEventListener("click", this.clickOutsideEventListener)
  }

  async initializeIndex() {
    console.log("Initializing search index...")
    if (this.searchIndex) {
      return
    }

    try {
      const response = await fetch(this.indexTarget.value)

      if (!response.ok) {
        throw new Error("Failed to fetch search index")
      }

      const indexData = await response.json()

      // Store the original documents for retrieval after search
      this.documents = {}
      
      // Create lunr index
      this.searchIndex = lunr(function() {
        // Define fields to index
        this.ref('location')
        this.field('title')
        this.field('text')
        
        // Add each document to the index
        indexData.forEach(doc => {
          this.add(doc)
        })
      })
      
      // Store the original documents for retrieval
      indexData.forEach(doc => {
        this.documents[doc.location] = doc
      })

      console.log("Added " + indexData.length + " documents to search index...")
    } catch (error) {
      console.error("Failed to initialize search index:", error)
    }

    this.performSearch()

    console.log("Search index initialized")
  }

  performSearch() {
    console.log("Performing search...")

    const query = this.queryTarget.value.trim()

    if (!query) {
      this.metaTarget.textContent = "Type to start searching"
      this.listTarget.innerHTML = ''
      return
    }

    console.log("Query:", query)

    // Perform the search with lunr
    let results = []
    try {
      results = this.searchIndex.search(query)
      console.log("Search results:", JSON.stringify(results, null, 2))
    } catch (error) {
      console.error("Search error:", error)
      // Handle common lunr syntax errors by doing a simpler search
      try {
        // Fall back to a simple term search if the query syntax is invalid
        results = this.searchIndex.search(query.split(/\s+/).map(term => `${term}*`).join(' '))
      } catch (fallbackError) {
        console.error("Fallback search error:", fallbackError)
        this.metaTarget.textContent = "Search error. Try a different query."
        return
      }
    }

    // Show number of results
    this.metaTarget.textContent = `${results.length} matching documents`

    // Convert lunr results to the format expected by showResults
    const formattedResults = [{
      result: results.map(result => {
        // Highlight matching text.
        const doc = this.documents[result.ref];
        
        // Extract matching terms from the matchData
        const matchingTerms = Object.keys(result.matchData.metadata);
        
        // Create a highlighted version of the text
        let highlightedText = doc.text;
        let highlightedTitle = doc.title;
        
        // Apply highlighting for each matching term
        matchingTerms.forEach(term => {
          // Create a case-insensitive regex to find all instances of the term
          const regex = new RegExp(`(${term})`, 'gi');

          // Replace matches in the title
          highlightedTitle = highlightedTitle.replace(regex, '<em>$1</em>');

          // Replace matches with the highlighted version
          highlightedText = highlightedText.replace(regex, '<em>$1</em>');
        });
        
        return {
          doc: {
            ...doc,
            text: highlightedText,
            title: highlightedTitle
          }
        };
      })
    }]

    this.showResults(formattedResults)

    console.log("Search completed")
  }

  showResults(results) {
    // Add results as list items to listTarget.
    this.listTarget.innerHTML = results.map(fieldResult => 
      fieldResult.result.map(result => `
      <li class="search-result-item">
        <a class="search-result-link" href="${result.doc.location}">
          <article>
            <div class="search-result-icon">
            </div>
            <h1>${result.doc.title}</h1>
            ${result.doc.tags && result.doc.tags.length > 0 ? `
            <nav class="search-result-nav">
              ${result.doc.tags.map(tag => `<span class="search-result-tag">${tag}</span>`).join('')}
            </nav>` : ''}
          </article>
        </a>
        <a class="search-result-link" href="${result.doc.location}">
          <article>
            ${result.doc.text}
          </article>
        </a>
      </li>`).join('')
    ).join('')
  }
}