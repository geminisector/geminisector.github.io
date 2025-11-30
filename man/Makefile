# Makefile for Generating HTML Command References using Pandoc

# Define variables
PANDOC = pandoc
TEMPLATE = template.html

# List all source Markdown files
MD_SOURCES = commands.md gm.md

# Automatically calculate the target HTML files by replacing .md with .html
HTML_TARGETS = $(patsubst %.md, %.html, $(MD_SOURCES))

# --- Primary Target ---
# The default target builds all HTML files
all: $(HTML_TARGETS)
	@echo "Build complete. Generated: $(HTML_TARGETS)"

# --- Cleanup Target ---
# Removes generated HTML files
clean:
	@rm -f $(HTML_TARGETS)
	@echo "Cleaned up generated HTML files."

# --- Pattern Rule for Building HTML from Markdown ---
# This rule defines how to create any %.html file from its corresponding %.md file.
# The command uses your specified Pandoc syntax.
%.html: %.md $(TEMPLATE)
	@echo "Building $@ from $< using $(TEMPLATE)..."
	$(PANDOC) $< --template $(TEMPLATE) -o $@
	@echo "Successfully created $@."

# --- Phony Targets ---
.PHONY: all clean
