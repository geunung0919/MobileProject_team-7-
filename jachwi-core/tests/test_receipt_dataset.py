from app.receipt_dataset import load_receipt_dataset, receipt_dataset_summary
from app.receipt_items import classify_product


def test_seed_receipt_dataset_is_loaded():
    summary = receipt_dataset_summary()
    assert summary["loaded"] is True
    assert summary["ingredient_groups"] >= 60
    assert summary["ingredient_aliases"] >= summary["ingredient_groups"]
    assert summary["processed_food_terms"] >= 20


def test_dataset_only_aliases_expand_ingredient_matching():
    radish = classify_product("국산 무우 1개")
    assert radish["normalized_name"] == "무"
    assert radish["is_ingredient"] is True

    lettuce = classify_product("논산양촌상추 봉")
    assert lettuce["normalized_name"] == "상추"
    assert lettuce["is_ingredient"] is True


def test_dataset_negative_terms_prevent_false_fridge_additions():
    prepared = classify_product("매콤달콤 오리주물럭")
    assert prepared["item_type"] == "food"
    assert prepared["is_ingredient"] is False

    snack = classify_product("대추 쌀과자")
    # Generic '과자' rule remains conservative even if '대추' resembles an ingredient.
    assert snack["item_type"] == "food"
    assert snack["is_ingredient"] is False


def test_dataset_loader_has_stable_shape_for_generated_catalog_override():
    data = load_receipt_dataset()
    assert isinstance(data["ingredients"], list)
    assert isinstance(data["product_name_map"], dict)
    assert isinstance(data["barcode_products"], dict)
