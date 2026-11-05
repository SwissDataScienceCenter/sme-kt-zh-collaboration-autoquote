from pydantic import BaseModel


class BrandColors(BaseModel):
    ink: str


# The branding file is shared with the frontend; only the fields the backend uses are read.
class Branding(BaseModel):
    name: str
    details: str
    colors: BrandColors
