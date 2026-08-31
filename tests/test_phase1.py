"""
Unit and Sanity Tests for Phase 1 Deliverables
Validates dataset schemas, vocabulary completeness, nutrient bounds,
and .dat file structure for C++ interop.
"""

import os
import json
import unittest

class TestPhase1DataPipeline(unittest.TestCase):
    def setUp(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.raw_dir = os.path.join(self.base_dir, "data", "raw")
        self.proc_dir = os.path.join(self.base_dir, "data", "processed")
        self.pantry_dir = os.path.join(self.base_dir, "data", "sample_pantry")

    def test_raw_files_exist(self):
        for name in ["recipes_small.json", "recipes_medium.json", "recipes_large.json"]:
            path = os.path.join(self.raw_dir, name)
            self.assertTrue(os.path.exists(path), f"Missing raw file: {name}")

    def test_processed_files_exist(self):
        for tier in ["small", "medium", "large"]:
            json_p = os.path.join(self.proc_dir, f"recipes_{tier}_processed.json")
            csv_p = os.path.join(self.proc_dir, f"recipes_{tier}_processed.csv")
            dat_p = os.path.join(self.proc_dir, f"recipes_{tier}.dat")
            self.assertTrue(os.path.exists(json_p), f"Missing {json_p}")
            self.assertTrue(os.path.exists(csv_p), f"Missing {csv_p}")
            self.assertTrue(os.path.exists(dat_p), f"Missing {dat_p}")

    def test_ingredient_vocabulary(self):
        vocab_path = os.path.join(self.proc_dir, "ingredient_vocabulary.json")
        self.assertTrue(os.path.exists(vocab_path), "Missing ingredient_vocabulary.json")
        with open(vocab_path, "r", encoding="utf-8") as f:
            vocab = json.load(f)
        self.assertGreaterEqual(len(vocab), 30, "Vocabulary contains too few ingredients")
        for key, entry in vocab.items():
            self.assertIn("id", entry)
            self.assertIn("canonical_name", entry)
            self.assertIn("unit", entry)

    def test_recipe_nutrient_bounds(self):
        small_json = os.path.join(self.proc_dir, "recipes_small_processed.json")
        with open(small_json, "r", encoding="utf-8") as f:
            recipes = json.load(f)
        self.assertEqual(len(recipes), 60)
        for r in recipes:
            self.assertGreater(r["calories"], 50.0)
            self.assertLess(r["calories"], 1500.0)
            self.assertGreaterEqual(r["protein_g"], 0.0)
            self.assertGreaterEqual(r["carbohydrates_g"], 0.0)
            self.assertGreaterEqual(r["fat_g"], 0.0)
            self.assertGreater(len(r["ingredients"]), 0)

    def test_pantry_integrity(self):
        pantry_dat = os.path.join(self.proc_dir, "pantry.dat")
        self.assertTrue(os.path.exists(pantry_dat), "Missing pantry.dat")
        with open(pantry_dat, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]
        num_items = int(lines[0])
        self.assertEqual(num_items, len(lines) - 1)
        self.assertGreaterEqual(num_items, 20)

if __name__ == "__main__":
    unittest.main()
