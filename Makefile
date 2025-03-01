ifdef LINTR_REPO
WEBSITE_ARGS = --local-lintr="$(LINTR_REPO)" --editable-lintr
endif

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z -]+:.*?## / {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort

.PHONY: clean
clean: ## Clean generated files
	@unlink content/docs &>/dev/null || true
	@rm -rf assets/ content/docs/ public/ resources/

.PHONY: site
site: node_modules content/docs ## Build and serve site
	@test -f assets/assets/app.js || npx rollup --config
	@npm run dev

node_modules: package.json package-lock.json
	npm install
	@touch node_modules

content/docs: pyproject.toml
	uv run bin/website.py configure $(WEBSITE_ARGS)
	uv run bin/website.py docs pull $(WEBSITE_ARGS)
