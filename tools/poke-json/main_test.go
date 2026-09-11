package main

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestBackupFiles(t *testing.T) {
	t.Chdir(t.TempDir())
	if err := os.MkdirAll("output", 0755); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join("output", "pokemon_data.json")
	if err := os.WriteFile(path, []byte("old data"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := backupFiles(map[string]bool{path: true, "missing.json": false}); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(filepath.Join("backup", "pokemon_data.json"))
	if err != nil || string(data) != "old data" {
		t.Fatalf("backup = %q, error = %v", data, err)
	}
}

func TestRunReportsGenerationFailure(t *testing.T) {
	t.Chdir(t.TempDir())
	mockAPI(t, func(r *http.Request) (int, string) {
		if r.URL.RawQuery != "" {
			return fixtureResponse(r)
		}
		return 503, `{}`
	})
	input, err := os.CreateTemp(t.TempDir(), "stdin")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { input.Close() })
	if _, err := input.WriteString("2\n"); err != nil {
		t.Fatal(err)
	}
	if _, err := input.Seek(0, 0); err != nil {
		t.Fatal(err)
	}
	previous := os.Stdin
	os.Stdin = input
	t.Cleanup(func() { os.Stdin = previous })
	if err := run(); err == nil || !strings.Contains(err.Error(), "503") {
		t.Fatalf("expected failure, got %v", err)
	}
	for _, name := range []string{"pokemon_data.json", "pokemon_i18n.json"} {
		if _, err := os.Stat(filepath.Join("output", name)); !os.IsNotExist(err) {
			t.Fatalf("failed run created %s", name)
		}
	}
}

func TestBackupFilesReportsFailure(t *testing.T) {
	t.Chdir(t.TempDir())
	if err := backupFiles(map[string]bool{"missing.json": true}); err == nil {
		t.Fatal("expected backup error")
	}
}
