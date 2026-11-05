from auto_quote.models.quote_configuration import (
    QuoteConfiguration,
    QuoteConfigurationDatabase,
    QuoteConfigurationInput,
    QuoteConfigurationPreview,
)
from auto_quote.utils.quote_prompt import QUOTE_SYSTEM_PROMPT, build_quote_prompt, build_quote_tool


DEFAULT_BUSINESS_RULES = (
    "- Prices already include VAT and any discount, never add either.\n"
    "- Add a site measurement as a flat fee of CHF 180 whenever the work is installed on site.\n"
    "- Workshop work (cutting, bending, welding) is charged at CHF 85 per hour.\n"
    "- Installation is charged at CHF 95 per hour and per fitter.\n"
    "- Add 10 % to tube and profile lengths for cuts, rounded up to whole metres.\n"
    "- The quote is valid for 30 days. Payment terms: 30 days net."
)

DEFAULT_QUOTE_CONFIGURATION = QuoteConfigurationInput(extra_margin_percentage=0, business_rules=DEFAULT_BUSINESS_RULES)

PREVIEW_REQUEST = "[customer message and extracted details]"
PREVIEW_PRODUCTS = "[matching products from the catalogue: reference, description, unit, unit price]"
PREVIEW_SIMILAR_OFFERS = "[similar past offers]"


class QuoteConfigurationController:
    def __init__(self, quote_configuration_database: QuoteConfigurationDatabase):
        self.quote_configuration_database = quote_configuration_database

    async def get_quote_configuration(self) -> QuoteConfiguration:
        return await self.quote_configuration_database.get_quote_configuration()

    async def update_quote_configuration(self, configuration_input: QuoteConfigurationInput) -> QuoteConfiguration:
        return await self.quote_configuration_database.update_quote_configuration(configuration_input)

    # Only the business rules go back to the default: the margin is a business figure, not part of the prompt text.
    async def reset_quote_configuration(self) -> QuoteConfiguration:
        quote_configuration = await self.get_quote_configuration()
        configuration_input = QuoteConfigurationInput(
            extra_margin_percentage=quote_configuration.extra_margin_percentage, business_rules=DEFAULT_BUSINESS_RULES
        )
        return await self.update_quote_configuration(configuration_input=configuration_input)

    async def preview_quote_configuration(self) -> QuoteConfigurationPreview:
        quote_configuration = await self.get_quote_configuration()
        return QuoteConfigurationPreview(
            system_prompt=QUOTE_SYSTEM_PROMPT,
            prompt=build_quote_prompt(
                configuration=quote_configuration,
                request=PREVIEW_REQUEST,
                products=PREVIEW_PRODUCTS,
                similar_offers=PREVIEW_SIMILAR_OFFERS,
                adjustment=None,
            ),
            tools=[build_quote_tool()],
        )
