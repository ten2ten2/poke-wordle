# Makefile for poke-json project

# Variables
BINARY_NAME=poke-json
OUTPUT_DIR=output
GO_FILES=$(wildcard *.go)

# Default target
.PHONY: all
all: build

# Build the binary
.PHONY: build
build: $(BINARY_NAME)

$(BINARY_NAME): $(GO_FILES)
	go build -o $(BINARY_NAME) .

# Run the program
.PHONY: run
run: build
	./$(BINARY_NAME)

# Install dependencies
.PHONY: deps
deps:
	go mod download
	go mod tidy

# Create output directory
.PHONY: setup
setup:
	mkdir -p $(OUTPUT_DIR)

# Clean build artifacts
.PHONY: clean
clean:
	rm -f $(BINARY_NAME)
	rm -rf $(OUTPUT_DIR)

# Clean and rebuild
.PHONY: rebuild
rebuild: clean build

# Run with setup (ensures output directory exists)
.PHONY: run-setup
run-setup: setup build
	./$(BINARY_NAME)

# Format Go code
.PHONY: fmt
fmt:
	go fmt ./...

# Vet Go code
.PHONY: vet
vet:
	go vet ./...

# Run tests (if any exist)
.PHONY: test
test:
	go test ./...

# Build for different platforms
.PHONY: build-linux
build-linux:
	GOOS=linux GOARCH=amd64 go build -o $(BINARY_NAME)-linux .

.PHONY: build-windows
build-windows:
	GOOS=windows GOARCH=amd64 go build -o $(BINARY_NAME).exe .

.PHONY: build-macos
build-macos:
	GOOS=darwin GOARCH=amd64 go build -o $(BINARY_NAME)-macos .

# Build for all platforms
.PHONY: build-all
build-all: build-linux build-windows build-macos

# Help target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  build       - Build the binary"
	@echo "  run         - Build and run the program"
	@echo "  run-setup   - Create output directory, build and run"
	@echo "  deps        - Download and tidy dependencies"
	@echo "  setup       - Create output directory"
	@echo "  clean       - Remove build artifacts and output"
	@echo "  rebuild     - Clean and rebuild"
	@echo "  fmt         - Format Go code"
	@echo "  vet         - Vet Go code"
	@echo "  test        - Run tests"
	@echo "  build-linux - Build for Linux"
	@echo "  build-windows - Build for Windows"
	@echo "  build-macos - Build for macOS"
	@echo "  build-all   - Build for all platforms"
	@echo "  help        - Show this help" 