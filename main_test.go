package main

import (
	"os"
	"path/filepath"
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

func TestBackupFilesReportsFailure(t *testing.T) {
	t.Chdir(t.TempDir())
	if err := backupFiles(map[string]bool{"missing.json": true}); err == nil {
		t.Fatal("expected backup error")
	}
}
