# References are compared loosely, so "hr-tube-42 " in an offer matches "HR-TUBE-42" from a datasheet.
def normalize_product_reference(product_reference: str) -> str:
    return product_reference.strip().casefold()
