from abc import ABC, abstractmethod
from datetime import date

from auto_quote.models.quote import Quote


class QuoteRenderer(ABC):
    """
    Renders a quote as the file sent to the customer, with the branding in its header.
    """

    @abstractmethod
    def render(self, quote: Quote, issue_date: date) -> bytes:
        pass
