package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestComparisonDistinguishesNullAndMissing(t *testing.T) {
	for _, tt := range []struct {
		old, next, kind        string
		oldPresent, newPresent bool
	}{
		{`{"tags":["starter"]}`, `{"tags":null}`, "type_changed", true, true},
		{`{"tags":null}`, `{"tags":["starter"]}`, "type_changed", true, true},
		{`{}`, `{"tags":null}`, "added", false, true},
		{`{"tags":null}`, `{}`, "removed", true, false},
		{`null`, `[]`, "type_changed", true, true},
		{`[]`, `null`, "type_changed", true, true},
		{`[]`, `[null]`, "added", false, true},
		{`[null]`, `[]`, "removed", true, false},
	} {
		t.Run(tt.old+" to "+tt.next, func(t *testing.T) {
			result, err := CompareJSONStrings(tt.old, tt.next)
			if err != nil {
				t.Fatal(err)
			}
			if result.IsEqual || len(result.Differences) != 1 || result.Differences[0].Type != tt.kind {
				t.Fatalf("unexpected comparison: %+v", result)
			}
			output := filepath.Join(t.TempDir(), "comparison.json")
			if err := ExportComparisonResult(result, output); err != nil {
				t.Fatal(err)
			}
			data, err := os.ReadFile(output)
			if err != nil {
				t.Fatal(err)
			}
			var report struct {
				Differences []map[string]json.RawMessage `json:"differences"`
			}
			if err := json.Unmarshal(data, &report); err != nil {
				t.Fatal(err)
			}
			diff := report.Differences[0]
			_, oldPresent := diff["old_value"]
			_, newPresent := diff["new_value"]
			if oldPresent != tt.oldPresent || newPresent != tt.newPresent {
				t.Fatalf("missing/extra value: %s", data)
			}
			if result.Differences[0].OldValue == nil && oldPresent && string(diff["old_value"]) != "null" {
				t.Fatalf("lost old null: %s", data)
			}
			if result.Differences[0].NewValue == nil && newPresent && string(diff["new_value"]) != "null" {
				t.Fatalf("lost new null: %s", data)
			}
			if tt.kind == "type_changed" && (result.Summary.TypeChanged != 1 || result.Summary.Added != 0 || result.Summary.Removed != 0) {
				t.Fatalf("incorrect summary: %+v", result.Summary)
			}
		})
	}
	result, err := CompareJSONStrings(`{"tags":null}`, `{"tags":null}`)
	if err != nil || !result.IsEqual {
		t.Fatalf("equal nulls: %+v, %v", result, err)
	}
}
